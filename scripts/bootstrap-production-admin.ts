import { drizzle } from 'drizzle-orm/node-postgres';
import { withDatabase } from '../src/database/client';
import { BootstrapError, checkBootstrap, createInitialAdmin } from '../src/auth/bootstrap-admin';
import { adminInput } from './admin-input';
import { releaseConnection } from './release-connection';
import { verifyProductionIdentity } from './production-target.mjs';
import * as schema from '../src/database/schema';

async function main() {
  if (process.argv.slice(2).some((arg) => arg !== '--check'))
    throw new BootstrapError('No pases credenciales por argumentos.');
  const { client, target } = await releaseConnection();
  try {
    await withDatabase(drizzle(client, { schema }), async () => {
      await checkBootstrap();
      if (process.argv.includes('--check')) {
        console.log('Producción preparada para crear su primer administrador. Solo lectura.');
        return;
      }
      const input = await adminInput();
      await verifyProductionIdentity(client, target);
      await createInitialAdmin(input);
      console.log(
        'Superadministrador de producción creado. No se modificaron cuentas de desarrollo.',
      );
    });
  } finally {
    await client.end();
  }
}
try {
  await main();
} catch (error) {
  console.error(
    error instanceof BootstrapError
      ? error.message
      : 'No se completó la operación. Revisa el destino de producción y su esquema. Credenciales y errores SQL ocultos.',
  );
  process.exitCode = 1;
}
