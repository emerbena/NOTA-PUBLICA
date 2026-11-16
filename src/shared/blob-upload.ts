import { put } from '@vercel/blob';
import { blobTarget } from './blob-target';

type BlobWriter = (
  pathname: string,
  body: Buffer,
  options: { access: 'public'; contentType: string; addRandomSuffix: false; storeId: string },
) => Promise<{ url: string }>;

export class BlobUploadError extends Error {
  constructor() {
    super('No se pudo subir la imagen al almacén configurado.');
    this.name = 'BlobUploadError';
  }
}

export function createBlobUploader(write: BlobWriter = put) {
  return async (
    pathname: string,
    body: Buffer,
    contentType: string,
    env: Record<string, string | undefined> = process.env,
  ) => {
    const target = blobTarget(env);
    try {
      // Fijar el destino validado sin pasar token/oidcToken: el SDK mantiene OIDC y su renovación.
      return await write(pathname, body, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
        storeId: target.storeId,
      });
    } catch {
      // No propagar mensajes, causas ni objetos del SDK que puedan contener credenciales.
      throw new BlobUploadError();
    }
  };
}

export const uploadBlob = createBlobUploader();
