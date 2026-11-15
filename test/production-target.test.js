import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  productionTarget,
  verifyProductionIdentity,
  ProductionTargetError,
} from '../scripts/production-target.mjs';

const development = { branchId: 'br-development', endpointId: 'ep-development' };
const env = {
  NP_ENV: 'production',
  NEON_BRANCH_NAME: 'main',
  NP_PRODUCTION_NEON_BRANCH_ID: 'br-main',
  NP_PRODUCTION_NEON_ENDPOINT_ID: 'ep-main',
  DATABASE_URL: 'postgresql://fixture:fake@ep-main-pooler.example.neon.tech/db?sslmode=require',
  DATABASE_URL_UNPOOLED: 'postgresql://fixture:fake@ep-main.example.neon.tech/db?sslmode=require',
};

test('producción: valida un par aislado y exige TLS sin alterar las variables', () => {
  const original = structuredClone(env);
  const target = productionTarget(env, development);
  assert.equal(new URL(target.pooled).searchParams.get('sslmode'), 'verify-full');
  assert.deepEqual(env, original);
});

test('producción: rechaza development, destinos mezclados y configuración incompleta', () => {
  for (const change of [
    { NP_ENV: 'development' },
    { NEON_BRANCH_NAME: 'development' },
    { NP_PRODUCTION_NEON_BRANCH_ID: development.branchId },
    { NP_PRODUCTION_NEON_ENDPOINT_ID: development.endpointId },
    { DATABASE_URL: '' },
    { DATABASE_URL_UNPOOLED: env.DATABASE_URL },
    { DATABASE_URL_UNPOOLED: env.DATABASE_URL_UNPOOLED.replace('/db?', '/different?') },
    { DATABASE_URL_UNPOOLED: env.DATABASE_URL_UNPOOLED.replace('fixture:fake', 'fixture:other') },
    { DATABASE_URL: env.DATABASE_URL.replace('sslmode=require', 'sslmode=disable') },
    { DATABASE_URL: `${env.DATABASE_URL}&options=unsafe` },
    { DATABASE_URL: `${env.DATABASE_URL}&host=other.neon.tech` },
  ])
    assert.throws(
      () => productionTarget({ ...env, ...change }, development),
      ProductionTargetError,
    );
  assert.throws(() => productionTarget(env, {}), ProductionTargetError);
});

test('producción: verifica la identidad SQL exacta; rechaza ausencia o diferencias', async () => {
  const target = productionTarget(env, development);
  for (const row of [
    {},
    { branch_id: 'br-development', endpoint_id: target.endpointId },
    { branch_id: target.branchId, endpoint_id: 'ep-different' },
  ]) {
    await assert.rejects(
      verifyProductionIdentity({ query: async () => ({ rows: [row] }) }, target),
      ProductionTargetError,
    );
  }
  await verifyProductionIdentity(
    {
      query: async () => ({
        rows: [{ branch_id: target.branchId, endpoint_id: target.endpointId }],
      }),
    },
    target,
  );
});
