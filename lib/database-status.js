import { checkDatabaseConnection } from './database.js';

export function createDatabaseStatusHandler(check = checkDatabaseConnection) {
  return async function databaseStatus(request) {
    const headers = { 'Cache-Control': 'no-store' };
    if (request.method !== 'GET') {
      return Response.json(
        { ok: false, error: 'method_not_allowed' },
        {
          status: 405,
          headers: { ...headers, Allow: 'GET' },
        },
      );
    }
    try {
      await check();
      return Response.json({ ok: true, database: 'connected' }, { headers });
    } catch (error) {
      // No devolver ni registrar mensajes del driver: pueden incluir credenciales.
      const code =
        error?.code === 'DATABASE_NOT_CONFIGURED'
          ? 'database_not_configured'
          : 'database_unavailable';
      return Response.json({ ok: false, error: code }, { status: 503, headers });
    }
  };
}
