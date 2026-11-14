import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabaseStatusHandler } from '../lib/database-status.js';
import { getDatabase } from '../lib/database.js';

const request = () => new Request('https://example.com/api/db-status');

test('confirma conexión solo después de una consulta exitosa', async () => {
  let queried = false;
  const handler = createDatabaseStatusHandler(async () => { queried = true; });
  const response = await handler(request());
  assert.equal(queried, true);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { ok: true, database: 'connected' });
});

test('falta de configuración devuelve 503 sin simular conexión', async () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    assert.throws(getDatabase, { code: 'DATABASE_NOT_CONFIGURED' });
    const response = await createDatabaseStatusHandler()(request());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { ok: false, error: 'database_not_configured' });
  } finally {
    if (previous !== undefined) process.env.DATABASE_URL = previous;
  }
});

test('oculta credenciales y detalles de errores del driver', async () => {
  const handler = createDatabaseStatusHandler(async () => {
    throw new Error('failed postgres://user:secret@example.com/private_database');
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, error: 'database_unavailable' });
});

test('rechaza escrituras sin consultar la base', async () => {
  const handler = createDatabaseStatusHandler(async () => assert.fail('No debe consultar'));
  const response = await handler(new Request('https://example.com/api/db-status', { method: 'POST' }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});
