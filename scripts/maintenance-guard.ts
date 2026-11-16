// Los scripts locales no pueden convertirse en pasos de build de Vercel.
export function assertLocalMaintenance(env: Record<string, string | undefined> = process.env) {
  if (
    env.VERCEL ||
    env.VERCEL_ENV === 'preview' ||
    env.VERCEL_ENV === 'production' ||
    env.NP_ENV === 'preview'
  )
    throw new Error('Mantenimiento SQL bloqueado en despliegues. Solo ejecución local autorizada.');
}
