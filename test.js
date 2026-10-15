const assert = require('assert');
process.env.DB_PATH = ':memory:';
const { splitEqual, simplify } = require('./server');
const s = splitEqual(1000, [1, 2, 3]);
assert.strictEqual(s.reduce((a, x) => a + x.share, 0), 1000);
const t = simplify({ 1: 600, 2: -200, 3: -400 });
assert.deepStrictEqual(t, [{ from: 2, to: 1, amount: 200 }, { from: 3, to: 1, amount: 400 }]);
console.log('OK: reparto equitativo y simplificación de deudas');
process.exit(0);
