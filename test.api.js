// Pruebas de integración: inicio de sesión, base de datos y reparto de gastos.
// Levanta el servidor real con una base de datos en memoria y usa fetch (Node 22).
const assert = require('assert');
process.env.DB_PATH = ':memory:';
const { app } = require('./server');

const srv = app.listen(0);
const base = `http://127.0.0.1:${srv.address().port}`;

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

(async () => {
  // --- Salud del servicio ---
  assert.strictEqual((await call('GET', '/api/health')).status, 200);

  // --- Registro e inicio de sesión ---
  const ana = await call('POST', '/api/auth/register', { name: 'Ana', email: 'ana@test.com', password: 'secreto1' });
  const luis = await call('POST', '/api/auth/register', { name: 'Luis', email: 'luis@test.com', password: 'secreto2' });
  const eva = await call('POST', '/api/auth/register', { name: 'Eva', email: 'eva@test.com', password: 'secreto3' });
  assert.strictEqual(ana.status, 200);
  assert.ok(ana.data.token, 'el registro entrega un token');
  assert.strictEqual((await call('POST', '/api/auth/register', { name: 'Ana', email: 'ANA@test.com', password: 'secreto1' })).status, 409, 'correo repetido');
  assert.strictEqual((await call('POST', '/api/auth/register', { name: 'X', email: 'x@test.com', password: '123' })).status, 400, 'contraseña corta');
  assert.strictEqual((await call('POST', '/api/auth/login', { email: 'ana@test.com', password: 'mala' })).status, 401, 'contraseña incorrecta');
  const login = await call('POST', '/api/auth/login', { email: 'ana@test.com', password: 'secreto1' });
  assert.strictEqual(login.status, 200, 'login correcto (la base de datos guardó al usuario)');
  const tA = login.data.token, tL = luis.data.token, tE = eva.data.token;
  const idA = ana.data.user.id, idL = luis.data.user.id;

  // --- Rutas protegidas ---
  assert.strictEqual((await call('GET', '/api/groups')).status, 401, 'sin token no entra');

  // --- Grupos y miembros ---
  const g = await call('POST', '/api/groups', { name: 'Viaje a Cartagena' }, tA);
  assert.strictEqual(g.status, 200);
  const gid = g.data.id;
  assert.strictEqual((await call('POST', `/api/groups/${gid}/members`, { email: 'luis@test.com' }, tA)).status, 200);
  assert.strictEqual((await call('GET', `/api/groups/${gid}`, null, tL)).status, 200, 'el invitado ve el grupo');
  assert.strictEqual((await call('GET', `/api/groups/${gid}`, null, tE)).status, 403, 'un ajeno no ve el grupo');

  // --- Gasto en partes iguales: Ana paga $100 entre Ana y Luis ---
  assert.strictEqual((await call('POST', `/api/groups/${gid}/expenses`,
    { description: 'Almuerzo', amount: 100, paid_by: idA, participants: [idA, idL] }, tA)).status, 200);

  // --- Gasto por porcentajes: Ana paga $1000, Luis asume 70% y Ana 30% ---
  assert.strictEqual((await call('POST', `/api/groups/${gid}/expenses`,
    { description: 'Cena', amount: 1000, paid_by: idA, splits: [{ user_id: idL, percent: 70 }, { user_id: idA, percent: 30 }] }, tA)).status, 200);

  // Porcentajes que no suman 100 se rechazan
  assert.strictEqual((await call('POST', `/api/groups/${gid}/expenses`,
    { description: 'Mal', amount: 50, paid_by: idA, splits: [{ user_id: idL, percent: 50 }, { user_id: idA, percent: 40 }] }, tA)).status, 400);

  // Monto inválido
  assert.strictEqual((await call('POST', `/api/groups/${gid}/expenses`,
    { description: 'Cero', amount: 0, paid_by: idA, participants: [idA, idL] }, tA)).status, 400);

  // --- Balances (en centavos): Ana +75.000, Luis -75.000 ---
  let d = (await call('GET', `/api/groups/${gid}`, null, tA)).data;
  assert.strictEqual(d.balances[idA], 75000);
  assert.strictEqual(d.balances[idL], -75000);
  assert.deepStrictEqual(d.transfers, [{ from: idL, to: idA, amount: 75000 }]);
  assert.strictEqual(d.expenses.length, 2);

  // --- Saldar la deuda: Luis le paga $750 a Ana ---
  assert.strictEqual((await call('POST', `/api/groups/${gid}/settlements`, { to_user: idA, amount: 750 }, tL)).status, 200);
  d = (await call('GET', `/api/groups/${gid}`, null, tA)).data;
  assert.strictEqual(d.balances[idA], 0);
  assert.strictEqual(d.balances[idL], 0);
  assert.deepStrictEqual(d.transfers, []);

  console.log('OK: registro, login, grupos, gastos, porcentajes, balances y pagos');
  srv.close();
  process.exit(0);
})().catch(e => { console.error('FALLO:', e); srv.close(); process.exit(1); });
