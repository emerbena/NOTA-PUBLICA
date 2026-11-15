import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  developmentTarget,
  verifyDevelopmentTarget,
  DatabaseTargetError,
} from '../../src/database/development-target';
import { mediaStorage } from '../../src/shared/media-storage';

const env = {
  NP_ENV: 'development',
  NP_EXPECTED_NEON_BRANCH_ID: 'br-test-development',
  NP_EXPECTED_NEON_ENDPOINT_ID: 'ep-test-development',
  DATABASE_URL:
    'postgresql://test:example@ep-test-development-pooler.us-east-2.aws.neon.tech/test?sslmode=require',
  DATABASE_URL_UNPOOLED:
    'postgresql://test:example@ep-test-development.us-east-2.aws.neon.tech/test?sslmode=require',
};
test('destino remoto exige identidad explícita, ambas URLs del mismo endpoint y TLS', () => {
  const target = developmentTarget(env);
  assert.equal(target.branchId, env.NP_EXPECTED_NEON_BRANCH_ID);
  assert.equal(new URL(target.direct).searchParams.get('sslmode'), 'verify-full');
  for (const changes of [
    { NP_EXPECTED_NEON_BRANCH_ID: '' },
    { NP_EXPECTED_NEON_ENDPOINT_ID: 'ep-production' },
    { NP_ENV: 'production' },
    { VERCEL: '1' },
    { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    { DATABASE_URL_UNPOOLED: env.DATABASE_URL },
    { DATABASE_URL: 'invalid-secret-must-not-appear' },
    { DATABASE_URL: env.DATABASE_URL.replace('sslmode=require', 'sslmode=disable') },
    { DATABASE_URL: env.DATABASE_URL + '&options=endpoint%3Dep-other' },
  ])
    assert.throws(() => developmentTarget({ ...env, ...changes }), DatabaseTargetError);
});
test('identidad SQL se comprueba de nuevo y rechaza main o un ID ausente antes de escribir', async () => {
  const target = developmentTarget(env);
  let branch = target.branchId;
  const queries: string[] = [];
  const reader = {
    query: async (query: string) => {
      queries.push(query);
      return { rows: [{ branch_id: branch, endpoint_id: target.endpointId }] };
    },
  };
  await verifyDevelopmentTarget(reader, target);
  branch = 'br-main';
  await assert.rejects(verifyDevelopmentTarget(reader, target), DatabaseTargetError);
  branch = '';
  await assert.rejects(verifyDevelopmentTarget(reader, target), DatabaseTargetError);
  assert.equal(queries.length, 3);
  assert.ok(queries.every((query) => query.startsWith('select current_setting')));
});
test('Neon y archivos locales se combinan solo en desarrollo; producción usa objetos', () => {
  assert.equal(
    mediaStorage({ NP_ENV: 'development', NP_DATABASE_MODE: 'neon', NP_MEDIA_STORAGE: 'local' }),
    'local',
  );
  assert.equal(mediaStorage({ NP_ENV: 'production', NP_DATABASE_MODE: 'neon' }), 'blob');
  assert.throws(() => mediaStorage({ NP_ENV: 'production', NP_MEDIA_STORAGE: 'local' }));
  assert.throws(() =>
    mediaStorage({ NP_ENV: 'development', NP_MEDIA_STORAGE: 'local', VERCEL: '1' }),
  );
});
