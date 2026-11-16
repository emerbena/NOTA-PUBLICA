import { deploymentTarget } from './deployment-target';

// Compatibilidad con el control inicial; ahora acepta identidades dinámicas.
export function previewTarget(env: Record<string, string | undefined> = process.env) {
  if (env.VERCEL_ENV !== 'preview' && env.NP_ENV !== 'preview') return undefined;
  return deploymentTarget(env);
}
