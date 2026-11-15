import { readEnvironment } from '../lib/env.js';
import { loadLocalEnvironment } from '../lib/load-local-env.js';

try {
  loadLocalEnvironment();
  const env = readEnvironment();
  console.log(
    env.databaseUrl
      ? 'Configuración válida. DATABASE_URL presente; no se ha probado la conexión.'
      : 'Configuración válida para la landing. DATABASE_URL ausente; la API responderá 503.',
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
