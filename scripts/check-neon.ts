import './runtime-env';
import { Client } from 'pg';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { developmentTarget, verifyDevelopmentTarget } from '../src/database/development-target';

try {
  const target = developmentTarget();
  for (const [type, connectionString] of [
    ['pooled', target.pooled],
    ['direct', target.direct],
  ]) {
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    });
    try {
      await client.connect();
      await client.query('begin read only');
      await verifyDevelopmentTarget(client, target);
      const { rows } = await client.query(
        "select count(*)::int as tables from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and left(table_name, 3)='np_'",
      );
      if (type === 'direct' && rows[0].tables === 35) {
        const applied = await client.query('select hash from drizzle.__drizzle_migrations');
        const recorded = readMigrationFiles({ migrationsFolder: 'drizzle' });
        const migrationsMatch = recorded.every((m) => applied.rows.some((a) => a.hash === m.hash));
        if (!migrationsMatch) throw new Error('MIGRATION_MISMATCH');
        const counts = await client.query(`select
          (select count(*)::int from np_article where is_demo=true) as demo_articles,
          (select count(*)::int from np_author where is_demo=true) as demo_authors,
          (select count(*)::int from np_category) as categories,
          (select count(*)::int from np_role) as roles,
          (select count(*)::int from np_staff where role_id='superadmin' and active=true) as administrators`);
        console.log(
          JSON.stringify({
            migrationHashesMatch: migrationsMatch,
            migrations: applied.rowCount,
            counts: counts.rows[0],
          }),
        );
      }
      await client.query('rollback');
      console.log(
        JSON.stringify({
          connection: type,
          branch: target.branchId,
          endpoint: target.endpointId,
          applicationTables: rows[0].tables,
          readOnly: true,
        }),
      );
    } finally {
      await client.end();
    }
  }
} catch {
  console.error(
    'Comprobación Neon rechazada o conexión no disponible. No se muestran credenciales.',
  );
  process.exitCode = 1;
}
