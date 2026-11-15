import './runtime-env';
import { adminInput } from './admin-input';
import { closeDatabase } from '../src/database/client';
import { developmentTarget } from '../src/database/development-target';
import { BootstrapError, checkBootstrap, createInitialAdmin } from '../src/auth/bootstrap-admin';

async function main() {
  if (process.env.VERCEL || process.env.NP_ENV !== 'development')
    throw new BootstrapError(
      'Este comando local requiere NP_ENV=development y no se ejecuta en Vercel.',
    );
  if (process.argv.slice(2).some((arg) => arg !== '--check'))
    throw new BootstrapError(
      'No pases credenciales como argumentos. Usa el formulario interactivo.',
    );
  if (process.env.NP_DATABASE_MODE !== 'local') {
    const target = developmentTarget();
    await checkBootstrap();
    console.log(`Destino verificado: Neon development (${target.branchId}).`);
  } else {
    await checkBootstrap();
    console.log('Destino: PostgreSQL local de desarrollo.');
  }
  if (process.argv.includes('--check')) {
    console.log(
      'Comando y base preparados. Comprobación de solo lectura; no se creó ningún usuario.',
    );
    return;
  }
  const { email, name, password } = await adminInput();
  await createInitialAdmin({ email, name, password });
  console.log('Superadministrador creado. Inicia sesión en /admin/login.');
}

try {
  await main();
} catch (error) {
  console.error(
    error instanceof BootstrapError
      ? error.message
      : 'No se pudo completar la operación. Revisa el entorno development, la conexión y el esquema existente. No se muestran detalles SQL ni credenciales.',
  );
  process.exitCode = 1;
} finally {
  await closeDatabase().catch(() => {
    process.exitCode = 1;
  });
}
