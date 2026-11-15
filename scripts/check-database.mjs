import { checkDatabaseConnection } from '../lib/database.js';
import { loadLocalEnvironment } from '../lib/load-local-env.js';

loadLocalEnvironment();

try {
  await checkDatabaseConnection();
  console.log('Conexión a Neon verificada con SELECT 1.');
} catch (error) {
  console.error(
    error?.code === 'DATABASE_NOT_CONFIGURED'
      ? 'Falta DATABASE_URL. Configúrala en .env.local o en el entorno.'
      : 'No se pudo conectar a Neon. Revisa DATABASE_URL y la disponibilidad de red.',
  );
  process.exitCode = 1;
}
