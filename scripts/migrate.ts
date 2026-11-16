import './runtime-env';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closeDatabase } from '../src/database/client';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { developmentTarget, verifyDevelopmentTarget } from '../src/database/development-target';
import { assertLocalMaintenance } from './maintenance-guard';
assertLocalMaintenance();
if (
  process.env.NP_DATABASE_MODE !== 'local' &&
  (process.env.NP_ENV !== 'development' || process.env.NP_ALLOW_DEV_MIGRATION !== 'yes')
)
  throw new Error(
    'Migración bloqueada: requiere entorno de desarrollo explícito. Nunca se ejecuta en producción.',
  );
if (process.env.VERCEL_ENV === 'production')
  throw new Error('No migrar producción desde este comando.');
try {
  if (process.env.NP_DATABASE_MODE === 'local') {
    await migrate(db(), { migrationsFolder: 'drizzle' });
  } else {
    const target = developmentTarget();
    const client = new Client({ connectionString: target.direct, connectionTimeoutMillis: 10000 });
    try {
      await client.connect();
      await verifyDevelopmentTarget(client, target);
      console.log(`Destino verificado: ${target.branchId}. Conexión directa.`);
      // Mismo cliente verificado para bloqueo, migrador y transacciones; nunca pooled.
      await client.query("select pg_advisory_lock(hashtext('nota-publica-migrations'))");
      await verifyDevelopmentTarget(client, target);
      await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
    } finally {
      await client.end();
    }
  }
  console.log('Migraciones aplicadas al entorno autorizado.');
} catch {
  console.error('Migración detenida. Revisa el destino autorizado y el esquema; secretos ocultos.');
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
