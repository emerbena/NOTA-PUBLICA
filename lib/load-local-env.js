import { fileURLToPath } from 'node:url';

export function loadLocalEnvironment() {
  // Las pruebas y Vercel nunca leen credenciales de un archivo local.
  if (process.env.NODE_ENV === 'test' || process.env.VERCEL) return;
  try {
    process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)));
  } catch (error) {
    // El error original podría revelar contenido del archivo; no adjuntarlo.
    // eslint-disable-next-line preserve-caught-error
    if (error.code !== 'ENOENT') throw new Error('No se pudo cargar .env.local');
  }
}
