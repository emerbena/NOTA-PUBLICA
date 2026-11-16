import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  deploymentTarget,
  verifyDeploymentIdentity,
  DeploymentPool,
  mainIdentity,
} from '../../src/database/deployment-target';
import { DatabaseTargetError } from '../../src/database/development-target';
import { assertLocalMaintenance } from '../../scripts/maintenance-guard';
import { releaseConfig } from '../../scripts/release-connection';

function environment(mode = 'preview', endpoint = 'ep-automatic-one') {
  return {
    VERCEL: '1',
    VERCEL_ENV: mode,
    NP_ENV: mode,
    NP_DATABASE_MODE: 'neon',
    CONTENT_MODE: 'demo',
    DATABASE_URL: `postgresql://test:example@${endpoint}-pooler.us-east-2.aws.neon.tech/test?sslmode=require`,
    DATABASE_URL_UNPOOLED: `postgresql://test:example@${endpoint}.us-east-2.aws.neon.tech/test?sslmode=require`,
  };
}
function reader(branch: unknown, endpoint: unknown) {
  return { query: async () => ({ rows: [{ branch_id: branch, endpoint_id: endpoint }] }) };
}

test('Preview acepta distintos endpoints automáticos sin fijar development ni IDs manuales', async () => {
  for (const suffix of ['one', 'two']) {
    const target = deploymentTarget(environment('preview', `ep-auto-${suffix}`))!;
    const identity = await verifyDeploymentIdentity(
      reader(`br-auto-${suffix}`, `ep-auto-${suffix}`),
      target,
    );
    assert.equal(identity.branchId, `br-auto-${suffix}`);
    assert.equal(new URL(target.pooled).searchParams.get('sslmode'), 'verify-full');
  }
});

test('Production solo acepta el endpoint y la identidad SQL de main', async () => {
  const target = deploymentTarget(environment('production', mainIdentity.endpointId))!;
  await verifyDeploymentIdentity(reader(mainIdentity.branchId, mainIdentity.endpointId), target);
  assert.throws(() => deploymentTarget(environment('production')), DatabaseTargetError);
  await assert.rejects(
    verifyDeploymentIdentity(reader('br-other', mainIdentity.endpointId), target),
    DatabaseTargetError,
  );
  await assert.rejects(
    verifyDeploymentIdentity(reader(mainIdentity.branchId, 'ep-other'), target),
    DatabaseTargetError,
  );
});

test('Preview rechaza main incluso si aparece bajo otro endpoint y no permite cambiar la política', async () => {
  assert.throws(
    () => deploymentTarget(environment('preview', mainIdentity.endpointId)),
    DatabaseTargetError,
  );
  const target = deploymentTarget(environment())!;
  await assert.rejects(
    verifyDeploymentIdentity(reader(mainIdentity.branchId, target.endpointId), target),
    DatabaseTargetError,
  );
  for (const changes of [
    { NP_ENV: 'production' },
    { NP_ENV: 'development' },
    { NP_ENV: '' },
    { VERCEL_ENV: 'production' },
    { VERCEL_ENV: '' },
    { NP_DATABASE_MODE: 'local' },
    { CONTENT_MODE: 'live' },
    { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    { NP_ALLOW_DEV_MIGRATION: 'yes' },
  ])
    assert.throws(() => deploymentTarget({ ...environment(), ...changes }), DatabaseTargetError);
});

test('URLs mezcladas, parámetros de destino, SSL inseguro y errores no revelan secretos', () => {
  const env = environment();
  for (const value of [
    '',
    'secret-invalid-value',
    env.DATABASE_URL_UNPOOLED,
    env.DATABASE_URL.replace('ep-automatic-one', 'ep-other'),
    env.DATABASE_URL + '&host=another-host',
    env.DATABASE_URL + '&options=secret-value',
    env.DATABASE_URL + '&sslmode=disable',
    env.DATABASE_URL.replace('sslmode=require', 'sslmode=disable'),
    env.DATABASE_URL.replace('example', 'different-secret'),
  ]) {
    assert.throws(
      () => deploymentTarget({ ...env, DATABASE_URL: value }),
      (error: unknown) => error instanceof DatabaseTargetError && !error.message.includes('secret'),
    );
  }
});

test('pooled y directa deben responder la misma rama; identidad ausente o SELECT 1 no basta', async () => {
  const target = deploymentTarget(environment())!;
  const identity = await verifyDeploymentIdentity(
    reader('br-preview-a', target.endpointId),
    target,
  );
  await assert.rejects(
    verifyDeploymentIdentity(reader('br-preview-b', target.endpointId), target, identity),
    DatabaseTargetError,
  );
  for (const invalid of [
    reader(null, target.endpointId),
    reader('main', target.endpointId),
    reader('br-preview-a', null),
    reader('br-preview-a', 'ep-other'),
    { query: async () => ({ rows: [{ connected: 1 }] }) },
  ]) {
    await assert.rejects(verifyDeploymentIdentity(invalid, target), DatabaseTargetError);
  }
  await assert.rejects(
    verifyDeploymentIdentity(
      {
        query: async () => {
          throw new Error('postgresql://private:secret@host');
        },
      },
      target,
    ),
    (error: unknown) =>
      error instanceof DatabaseTargetError && !error.message.includes('postgresql'),
  );
});

test('pool comprueba cada adquisición, descarta conexiones inválidas y conserva la rama observada', async (t) => {
  const target = deploymentTarget(environment())!;
  let branch = 'br-preview-a';
  const queries: string[] = [];
  const releases: boolean[] = [];
  const client = {
    query: async (query: string) => {
      queries.push(query);
      return { rows: [{ branch_id: branch, endpoint_id: target.endpointId }] };
    },
    release: (destroy: boolean) => {
      releases.push(destroy);
    },
  };
  t.mock.method(Pool.prototype, 'connect', () => Promise.resolve(client));
  const pool = new DeploymentPool({}, target);
  await pool.connect();
  branch = 'br-preview-b';
  await assert.rejects(pool.connect(), DatabaseTargetError);
  branch = mainIdentity.branchId;
  await assert.rejects(pool.connect(), DatabaseTargetError);
  assert.deepEqual(releases, [true, true]);
  assert.equal(queries.length, 3);
  assert.ok(queries.every((q) => q.includes("current_setting('neon.branch_id'")));
  await pool.end();
});

test('pool con callback no entrega al consumidor una conexión a main', async (t) => {
  const target = deploymentTarget(environment())!;
  let destroyed = false;
  const client = {
    ...reader(mainIdentity.branchId, target.endpointId),
    release: (value: boolean) => {
      destroyed = value;
    },
  };
  t.mock.method(Pool.prototype, 'connect', () => Promise.resolve(client));
  const pool = new DeploymentPool({}, target);
  await new Promise<void>((resolve, reject) =>
    pool.connect((error, connection) => {
      try {
        assert.ok(error instanceof DatabaseTargetError);
        assert.equal(connection, undefined);
        resolve();
      } catch (e) {
        reject(e);
      }
    }),
  );
  assert.equal(destroyed, true);
  await pool.end();
});

test('pool oculta errores de conexión antes de cualquier consulta SQL', async (t) => {
  t.mock.method(Pool.prototype, 'connect', () =>
    Promise.reject(new Error('private-connection-string')),
  );
  const pool = new DeploymentPool({}, deploymentTarget(environment())!);
  await assert.rejects(
    pool.connect(),
    (error: unknown) =>
      error instanceof DatabaseTargetError && !error.message.includes('private-connection'),
  );
  await pool.end();
});

test('los despliegues bloquean mantenimiento incluso con banderas de migración habilitadas', () => {
  for (const env of [
    { VERCEL: '1' },
    { VERCEL_ENV: 'preview' },
    { VERCEL_ENV: 'production' },
    { NP_ENV: 'preview' },
    { VERCEL_ENV: 'preview', NP_ENV: 'production', NP_ALLOW_DEV_MIGRATION: 'yes' },
  ])
    assert.throws(() => assertLocalMaintenance(env), /bloqueado/);
  assert.doesNotThrow(() => assertLocalMaintenance({ NP_ENV: 'development' }));
  assert.doesNotThrow(() => assertLocalMaintenance({ NP_ENV: 'production' }));
});

test('entrada de preparación de producción se detiene en Preview antes de leer credenciales', () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'preview';
  try {
    assert.throws(() => releaseConfig(), /Mantenimiento SQL bloqueado/);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
});

test('desarrollo local y CI no se convierten en Production por NODE_ENV=production', () => {
  assert.equal(deploymentTarget({ NODE_ENV: 'production' }), undefined);
  assert.equal(deploymentTarget({ NP_ENV: 'development' }), undefined);
  assert.throws(() => deploymentTarget({ VERCEL: '1' }), DatabaseTargetError);
});

test('prebuild real termina con error antes de conectar si Preview recibe main o Production otra rama', () => {
  const script = fileURLToPath(new URL('../../scripts/check-preview.ts', import.meta.url));
  for (const env of [environment('preview', mainIdentity.endpointId), environment('production')]) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', script], {
      env: { ...process.env, ...env, NODE_TLS_REJECT_UNAUTHORIZED: '1' },
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Despliegue bloqueado/);
    assert.ok(!result.stderr.includes(env.DATABASE_URL));
    assert.ok(!result.stderr.includes('example'));
  }
});
