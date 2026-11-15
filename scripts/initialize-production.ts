import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { mkdirSync, writeFileSync } from 'node:fs';
import { releaseConnection } from './release-connection';
import { verifyProductionIdentity } from './production-target.mjs';
import { seedDemo } from '../src/database/seed-demo';
import * as schema from '../src/database/schema';

// Initial installation only. Existing databases need a separately reviewed upgrade.
async function initialize() {
  if (process.argv.slice(2).join(' ') !== '--apply-demo')
    throw new Error('Se requiere --apply-demo para la instalación inicial autorizada.');
  const migrations = readMigrationFiles({ migrationsFolder: 'drizzle' });
  if (migrations.length !== 1) throw new Error('Este comando solo admite la migración inicial.');
  const { client, target } = await releaseConnection();
  try {
    await client.query("select pg_advisory_lock(hashtext('nota-publica-production-initial'))");
    await verifyProductionIdentity(client, target);
    const previous = await client.query(
      "select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') and table_type='BASE TABLE'",
    );
    if (previous.rowCount !== 0)
      throw new Error('La base ya contiene tablas. No se modificó el esquema.');
    mkdirSync('.artifacts', { recursive: true });
    writeFileSync(
      '.artifacts/production-initial-state.json',
      JSON.stringify(
        {
          inspectedAt: new Date().toISOString(),
          branchId: target.branchId,
          endpointId: target.endpointId,
          previousTables: previous.rows,
          migrationHashes: migrations.map((m) => m.hash),
          recovery:
            'Initial empty database; preserve the previous Vercel deployment. No down migration is executed automatically.',
        },
        null,
        2,
      ),
    );
    const database = drizzle(client, { schema });
    await verifyProductionIdentity(client, target);
    await migrate(database, { migrationsFolder: 'drizzle' });
    await verifyProductionIdentity(client, target);
    await seedDemo(database);
    const counts = await client.query(`select
      (select count(*)::int from information_schema.tables where table_schema='public' and left(table_name,3)='np_') as tables,
      (select count(*)::int from np_article where is_demo=true) as demo_articles,
      (select count(*)::int from np_article where is_demo=false) as real_articles,
      (select count(*)::int from np_role) as roles,
      (select count(*)::int from np_staff) as staff`);
    console.log(JSON.stringify(counts.rows[0]));
    console.log('Esquema y demostración inicial preparados. No se creó una cuenta con contraseña.');
  } finally {
    await client.end(); // Also releases the advisory lock, including on failure.
  }
}

try {
  await initialize();
} catch {
  console.error(
    'Preparación detenida. Revisa el destino y el estado de las tablas antes de reintentar. Los errores SQL y las credenciales permanecen ocultos.',
  );
  process.exitCode = 1;
}
