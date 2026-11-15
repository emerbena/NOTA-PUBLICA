import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import pg from 'pg';
import { productionTarget, verifyProductionIdentity } from './production-target.mjs';

try {
  if (process.env.VERCEL || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0')
    throw new Error('UNSAFE_EXECUTION_ENVIRONMENT');
  const env = parseEnv(readFileSync(new URL('../.env.release.local', import.meta.url), 'utf8'));
  const dev = parseEnv(readFileSync(new URL('../.env.local', import.meta.url), 'utf8'));
  const target = productionTarget(env, {
    branchId: dev.NP_EXPECTED_NEON_BRANCH_ID,
    endpointId: dev.NP_EXPECTED_NEON_ENDPOINT_ID,
  });
  for (const [connection, connectionString] of [
    ['pooled', target.pooled],
    ['direct', target.direct],
  ]) {
    const client = new pg.Client({
      connectionString,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    });
    try {
      await client.connect();
      await client.query('BEGIN READ ONLY');
      await verifyProductionIdentity(client, target);
      const { rows } = await client.query(
        "select count(*)::int as application_tables from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and left(table_name,3)='np_'",
      );
      await client.query('ROLLBACK');
      console.log(
        JSON.stringify({
          connection,
          branchId: target.branchId,
          endpointId: target.endpointId,
          applicationTables: rows[0].application_tables,
          readOnly: true,
        }),
      );
    } finally {
      await client.end();
    }
  }
  console.log(
    'Identidad y conexiones verificadas. El nombre main debe corresponder a este ID en Neon. No se ejecutaron migraciones ni escrituras.',
  );
} catch {
  console.error(
    'Verificación detenida. Completa .env.release.local con las conexiones y los IDs de main, distintos de development. Comprueba acceso de red y TLS. Credenciales y errores SQL ocultos.',
  );
  process.exitCode = 1;
}
