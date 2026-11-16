import { drizzle as postgresDrizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as localDrizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import { developmentTarget, DevelopmentPool } from './development-target';
import { deploymentTarget, DeploymentPool } from './deployment-target';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
const scope = new AsyncLocalStorage<Database | Transaction>();
export function withDatabase<T>(database: Database | Transaction, work: () => Promise<T>) {
  return scope.run(database, work);
}
const globalDb = globalThis as unknown as { npDb?: Database; npClose?: () => Promise<void> };
export function db(): Database {
  const scoped = scope.getStore();
  if (scoped) return scoped as Database;
  if (globalDb.npDb) return globalDb.npDb;
  // El entorno de Vercel prevalece: ambos despliegues validan identidad real.
  const deployment = deploymentTarget();
  if (process.env.NP_DATABASE_MODE === 'local') {
    if (process.env.VERCEL) throw new Error('La base local no puede ejecutarse en Vercel.');
    const client = new PGlite(process.env.NP_LOCAL_DATABASE || '.local-db/main');
    globalDb.npDb = localDrizzle(client, { schema }) as unknown as Database;
    globalDb.npClose = () => client.close();
  } else {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Configura DATABASE_URL o prepara el entorno local.');
    const target = process.env.NP_ENV === 'development' ? developmentTarget() : undefined;
    if (!target && process.env.NP_EXPECTED_NEON_BRANCH_ID)
      throw new Error('La protección de Neon development requiere NP_ENV=development.');
    const config = {
      connectionString: deployment?.pooled || target?.pooled || connectionString,
      max: 5,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10000,
      statement_timeout: 15000,
    };
    const client = deployment
      ? new DeploymentPool(config, deployment)
      : target
        ? new DevelopmentPool(config, target)
        : new Pool(config);
    client.on('error', () => console.error('Conexión SQL inactiva interrumpida.'));
    globalDb.npDb = postgresDrizzle(client, { schema });
    globalDb.npClose = () => client.end();
  }
  return globalDb.npDb;
}
export async function closeDatabase() {
  await globalDb.npClose?.();
  globalDb.npDb = undefined;
}
