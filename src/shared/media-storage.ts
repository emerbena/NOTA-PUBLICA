/** Almacenamiento independiente de la base SQL: permite Neon + archivos locales en desarrollo. */
export function mediaStorage(
  env: Record<string, string | undefined> = process.env,
): 'local' | 'blob' {
  const mode = env.NP_MEDIA_STORAGE || (env.NP_DATABASE_MODE === 'local' ? 'local' : 'blob');
  if (!['local', 'blob'].includes(mode))
    throw new Error('Configura NP_MEDIA_STORAGE=local o blob.');
  if (mode === 'local') {
    if (env.VERCEL || !['development', 'test'].includes(env.NP_ENV || ''))
      throw new Error('Los archivos locales solo están permitidos en desarrollo y pruebas.');
    return 'local';
  }
  return 'blob';
}
