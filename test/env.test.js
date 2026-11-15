import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseUrl, readEnvironment } from '../lib/env.js';

test('landing local funciona sin credenciales; consulta SQL requiere configuración', () => {
  assert.deepEqual(readEnvironment({}), {
    nodeEnv: 'development',
    port: 4173,
    databaseUrl: undefined,
  });
  assert.throws(() => databaseUrl({}), { code: 'DATABASE_NOT_CONFIGURED' });
});

test('rechaza configuración inválida sin filtrar secretos', () => {
  for (const value of ['https://user:secret@example.com/db', 'secret', 'postgres://host']) {
    assert.throws(
      () => databaseUrl({ DATABASE_URL: value }),
      (error) => error.code === 'INVALID_ENVIRONMENT' && !error.message.includes('secret'),
    );
  }
  for (const port of ['abc', '0', '-1', '65536', '2.5']) {
    assert.throws(() => readEnvironment({ PORT: port }), { code: 'INVALID_ENVIRONMENT' });
  }
  assert.throws(() => readEnvironment({ NODE_ENV: 'preview' }), { code: 'INVALID_ENVIRONMENT' });
});

test('acepta PostgreSQL sin abrir conexiones ni alterar la URL', () => {
  for (const scheme of ['postgres', 'postgresql']) {
    const url = `${scheme}://example:fake@localhost/test_db?sslmode=require`;
    assert.equal(databaseUrl({ DATABASE_URL: url }), url);
  }
  assert.equal(readEnvironment({ NODE_ENV: 'test', PORT: '4187' }).port, 4187);
});
