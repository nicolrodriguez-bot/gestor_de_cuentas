require('dotenv').config();
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-inseguro';
const db = new DatabaseSync(process.env.DB_PATH || 'data.db');
db.exec('PRAGMA foreign_keys = ON');
const tx = fn => { db.exec('BEGIN'); try { fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } };
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS groups(id INTEGER PRIMARY KEY, name TEXT NOT NULL, owner_id INTEGER NOT NULL REFERENCES users(id));
CREATE TABLE IF NOT EXISTS members(group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id), PRIMARY KEY(group_id,user_id));
CREATE TABLE IF NOT EXISTS expenses(id INTEGER PRIMARY KEY, group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE, paid_by INTEGER REFERENCES users(id), amount INTEGER NOT NULL, description TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS splits(expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id), share INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settlements(id INTEGER PRIMARY KEY, group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE, from_user INTEGER, to_user INTEGER, amount INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);

// ---------- LÃ³gica de negocio (montos en centavos) ----------
function splitEqual(amount, ids) {
  const base = Math.floor(amount / ids.length);
  let rest = amount - base * ids.length;
  return ids.map(id => ({ user_id: id, share: base + (rest-- > 0 ? 1 : 0) }));
}
function balances(gid) {
  const b = {};
  db.prepare('SELECT user_id FROM members WHERE group_id=?').all(gid).forEach(m => (b[m.user_id] = 0));
  db.prepare('SELECT paid_by,amount FROM expenses WHERE group_id=?').all(gid).forEach(e => (b[e.paid_by] += e.amount));
  db.prepare('SELECT s.user_id,s.share FROM splits s JOIN expenses e ON e.id=s.expense_id WHERE e.group_id=?').all(gid).forEach(s => (b[s.user_id] -= s.share));
  db.prepare('SELECT from_user,to_user,amount FROM settlements WHERE group_id=?').all(gid).forEach(s => { b[s.from_user] += s.amount; b[s.to_user] -= s.amount; });
  return b; // positivo = le deben, negativo = debe
}
function simplify(b) {
  const cr = [], de = [], out = [];
  Object.entries(b).forEach(([id, v]) => { if (v > 0) cr.push([+id, v]); else if (v < 0) de.push([+id, -v]); });
  let i = 0, j = 0;
  while (i < cr.length && j < de.length) {
    const amt = Math.min(cr[i][1], de[j][1]);
    out.push({ from: de[j][0], to: cr[i][0], amount: amt });
    cr[i][1] -= amt; de[j][1] -= amt;
    if (!cr[i][1]) i++; if (!de[j][1]) j++;
  }
  return out;
}

// ---------- API ----------
const app = express();
app.use(express.json());
app.use(express.static('public'));

const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'SesiÃ³n no vÃ¡lida. Inicia sesiÃ³n de nuevo.' }); }
};
const token = u => jwt.sign({ id: u.id, name: u.name, email: u.email }, SECRET, { expiresIn: '7d' });
const isMember = (gid, uid) => db.prepare('SELECT 1 FROM members WHERE group_id=? AND user_id=?').get(gid, uid);
const guard = (req, res, next) => isMember(req.params.id, req.user.id) ? next() : res.status(403).json({ error: 'No perteneces a este grupo.' });
const cents = v => Math.round(Number(v) * 100);

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Completa nombre, correo y una contraseÃ±a de 6+ caracteres.' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email.toLowerCase())) return res.status(409).json({ error: 'Ese correo ya estÃ¡ registrado.' });
  const r = db.prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)').run(name, email.toLowerCase(), bcrypt.hashSync(password, 10));
  const u = { id: Number(r.lastInsertRowid), name, email: email.toLowerCase() };
  res.json({ token: token(u), user: u });
});
app.post('/api/auth/login', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get((req.body.email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(req.body.password || '', u.password)) return res.status(401).json({ error: 'Correo o contraseÃ±a incorrectos.' });
  res.json({ token: token(u), user: { id: u.id, name: u.name, email: u.email } });
});

app.get('/api/groups', auth, (req, res) => res.json(db.prepare('SELECT g.id,g.name FROM groups g JOIN members m ON m.group_id=g.id WHERE m.user_id=? ORDER BY g.id DESC').all(req.user.id)));
app.post('/api/groups', auth, (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Ponle un nombre al grupo.' });
  const r = db.prepare('INSERT INTO groups(name,owner_id) VALUES(?,?)').run(req.body.name, req.user.id);
  db.prepare('INSERT INTO members VALUES(?,?)').run(Number(r.lastInsertRowid), req.user.id);
  res.json({ id: Number(r.lastInsertRowid), name: req.body.name });
});
app.get('/api/groups/:id', auth, guard, (req, res) => {
  const gid = req.params.id, b = balances(gid);
  res.json({
    group: db.prepare('SELECT id,name FROM groups WHERE id=?').get(gid),
    members: db.prepare('SELECT u.id,u.name,u.email FROM users u JOIN members m ON m.user_id=u.id WHERE m.group_id=?').all(gid),
    expenses: db.prepare('SELECT e.id,e.description,e.amount,e.paid_by,e.created_at,u.name paid_by_name FROM expenses e JOIN users u ON u.id=e.paid_by WHERE e.group_id=? ORDER BY e.id DESC').all(gid),
    balances: b, transfers: simplify(b),
  });
});
app.post('/api/groups/:id/members', auth, guard, (req, res) => {
  const u = db.prepare('SELECT id FROM users WHERE email=?').get((req.body.email || '').toLowerCase());
  if (!u) return res.status(404).json({ error: 'No existe un usuario con ese correo. PÃ­dele que se registre primero.' });
  db.prepare('INSERT OR IGNORE INTO members VALUES(?,?)').run(req.params.id, u.id);
  res.json({ ok: true });
});
app.post('/api/groups/:id/expenses', auth, guard, (req, res) => {
  const { description, amount, paid_by, participants } = req.body, amt = cents(amount);
  if (!description || !(amt > 0) || !Array.isArray(participants) || !participants.length) return res.status(400).json({ error: 'Indica descripciÃ³n, monto mayor a 0 y quiÃ©n participa.' });
  const ids = [paid_by, ...participants];
  if (!ids.every(id => isMember(req.params.id, id))) return res.status(400).json({ error: 'Todos deben ser miembros del grupo.' });
  tx(() => {
    const r = db.prepare('INSERT INTO expenses(group_id,paid_by,amount,description) VALUES(?,?,?,?)').run(req.params.id, paid_by, amt, description);
    splitEqual(amt, participants).forEach(s => db.prepare('INSERT INTO splits VALUES(?,?,?)').run(Number(r.lastInsertRowid), s.user_id, s.share));
  });
  res.json({ ok: true });
});
app.delete('/api/groups/:id/expenses/:eid', auth, guard, (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id=? AND group_id=?').run(req.params.eid, req.params.id);
  res.json({ ok: true });
});
app.post('/api/groups/:id/settlements', auth, guard, (req, res) => {
  const amt = cents(req.body.amount), to = req.body.to_user;
  if (!(amt > 0) || !isMember(req.params.id, to)) return res.status(400).json({ error: 'Monto o destinatario no vÃ¡lido.' });
  db.prepare('INSERT INTO settlements(group_id,from_user,to_user,amount) VALUES(?,?,?,?)').run(req.params.id, req.body.from_user || req.user.id, to, amt);
  res.json({ ok: true });
});

module.exports = { app, splitEqual, simplify };
if (require.main === module) app.listen(process.env.PORT || 3000, () => console.log('Cuentas Claras en puerto ' + (process.env.PORT || 3000)));

