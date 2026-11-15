import './runtime-env';
import { db, closeDatabase } from '../src/database/client';
import { seedDemo } from '../src/database/seed-demo';
if (process.env.VERCEL_ENV === 'production')
  throw new Error('El seed no se ejecuta en producción.');
if (
  process.env.NP_DATABASE_MODE !== 'local' &&
  (process.env.NP_ENV !== 'development' || process.env.NP_ALLOW_DEV_MIGRATION !== 'yes')
)
  throw new Error('El seed solo se permite en desarrollo.');
try {
  await seedDemo(db());
  console.log(
    'Roles y contenido de demostración preparados. Sin cuentas con contraseña predeterminada.',
  );
} finally {
  await closeDatabase();
}
