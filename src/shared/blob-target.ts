type Environment = Record<string, string | undefined>;

export class BlobTargetError extends Error {
  constructor() {
    super('Almacenamiento no disponible: revisa el entorno y la identidad del almacén Blob.');
    this.name = 'BlobTargetError';
  }
}

function storeId(value: string | undefined): string {
  const id = value?.trim().replace(/^store_/, '');
  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) throw new BlobTargetError();
  return id;
}

/** Solo configuración de servidor. Los IDs esperados se obtienen del panel de cada almacén. */
export function blobTarget(env: Environment = process.env) {
  const mode = env.VERCEL_ENV || env.NP_ENV;
  if (
    !['preview', 'production'].includes(mode || '') ||
    env.NP_ENV !== mode ||
    (env.VERCEL && env.VERCEL_ENV !== mode) ||
    (env.NP_MEDIA_STORAGE && env.NP_MEDIA_STORAGE !== 'blob')
  )
    throw new BlobTargetError();

  const preview = mode === 'preview';
  const expectedKey = preview ? 'NP_PREVIEW_BLOB_STORE_ID' : 'NP_PRODUCTION_BLOB_STORE_ID';
  const otherKey = preview ? 'NP_PRODUCTION_BLOB_STORE_ID' : 'NP_PREVIEW_BLOB_STORE_ID';
  // No aceptar una política del otro entorno heredada de All Environments.
  if (env[otherKey]?.trim()) throw new BlobTargetError();
  const expected = storeId(env[expectedKey]);
  const configured = storeId(env.BLOB_STORE_ID);
  if (configured !== expected) throw new BlobTargetError();

  // El SDK puede usar este token como fallback cuando no hay OIDC.
  // Se verifica su destino incluso cuando OIDC está disponible; nunca se devuelve ni registra.
  if (env.BLOB_READ_WRITE_TOKEN !== undefined && env.BLOB_READ_WRITE_TOKEN !== '') {
    const match = /^vercel_blob_rw_([a-zA-Z0-9-]+)_[^\s]+$/.exec(env.BLOB_READ_WRITE_TOKEN);
    if (!match || match[1] !== expected) throw new BlobTargetError();
  }
  return { mode: mode as 'preview' | 'production', storeId: configured };
}
