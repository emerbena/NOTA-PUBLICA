import { neon } from '@neondatabase/serverless';
import { databaseUrl } from './env.js';

// Este módulo pertenece al servidor. Nunca importarlo desde dist/.
export function getDatabase() {
  return neon(databaseUrl());
}

export async function checkDatabaseConnection() {
  const sql = getDatabase();
  const rows = await sql.query('SELECT 1 AS connected', [], {
    fetchOptions: { signal: AbortSignal.timeout(8000) },
  });
  if (rows[0]?.connected !== 1) throw new Error('Database check failed');
}
