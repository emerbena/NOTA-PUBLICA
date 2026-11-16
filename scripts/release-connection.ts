import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { Client } from 'pg';
import { productionTarget, verifyProductionIdentity } from './production-target.mjs';
import { assertLocalMaintenance } from './maintenance-guard';

export function releaseConfig() {
  assertLocalMaintenance();
  if (process.env.VERCEL || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0')
    throw new Error('La preparación se ejecuta localmente con TLS verificado.');
  const env = parseEnv(readFileSync(new URL('../.env.release.local', import.meta.url), 'utf8'));
  const development = parseEnv(readFileSync(new URL('../.env.local', import.meta.url), 'utf8'));
  return productionTarget(env, {
    branchId: development.NP_EXPECTED_NEON_BRANCH_ID,
    endpointId: development.NP_EXPECTED_NEON_ENDPOINT_ID,
  });
}

export async function releaseConnection() {
  const target = releaseConfig();
  const client = new Client({
    connectionString: target.direct,
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
  });
  try {
    await client.connect();
    await verifyProductionIdentity(client, target);
    console.log(`Destino de producción verificado: ${target.branchId} / ${target.endpointId}.`);
    return { client, target };
  } catch {
    await client.end();
    throw new Error('No se pudo verificar la conexión de producción.');
  }
}
