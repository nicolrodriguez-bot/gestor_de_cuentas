const assert = require('assert');
process.env.DB_PATH = ':memory:';
const { splitEqual, splitByPercent, simplify } = require('./server');
const s = splitEqual(1000, [1, 2, 3]);
assert.strictEqual(s.reduce((a, x) => a + x.share, 0), 1000);
const t = simplify({ 1: 600, 2: -200, 3: -400 });
assert.deepStrictEqual(t, [{ from: 2, to: 1, amount: 200 }, { from: 3, to: 1, amount: 400 }]);
// Reparto por porcentajes: 70% / 30% de $1.000,00 (en centavos)
const p = splitByPercent(100000, [{ user_id: 1, percent: 30 }, { user_id: 2, percent: 70 }]);
assert.deepStrictEqual(p.map(x => x.share), [30000, 70000]);
// Con decimales siempre suma exacto, sin perder centavos
const q = splitByPercent(10001, [{ user_id: 1, percent: 33.33 }, { user_id: 2, percent: 33.33 }, { user_id: 3, percent: 33.34 }]);
assert.strictEqual(q.reduce((a, x) => a + x.share, 0), 10001);
// 100% para una sola persona
assert.deepStrictEqual(splitByPercent(5000, [{ user_id: 2, percent: 100 }]).map(x => x.share), [5000]);
console.log('OK: reparto equitativo, por porcentajes y simplificación de deudas');
process.exit(0);
