import { neon } from '@neondatabase/serverless';

// Este módulo pertenece al servidor. Nunca importarlo desde dist/.
export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString?.trim()) {
    const error = new Error('DATABASE_URL is not configured');
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }
  return neon(connectionString);
}

export async function checkDatabaseConnection() {
  const sql = getDatabase();
  const rows = await sql.query('SELECT 1 AS connected', [], {
    fetchOptions: { signal: AbortSignal.timeout(8000) },
  });
  if (rows[0]?.connected !== 1) throw new Error('Database check failed');
}
