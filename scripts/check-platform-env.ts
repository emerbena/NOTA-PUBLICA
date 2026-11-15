import './runtime-env';
import { z } from 'zod';
import { developmentTarget } from '../src/database/development-target';
import { mediaStorage } from '../src/shared/media-storage';
try {
  const local = process.env.NP_DATABASE_MODE === 'local';
  if (local && process.env.VERCEL) throw Error('El almacenamiento local no es válido en Vercel.');
  if (!local) {
    if (process.env.NP_ENV === 'development') developmentTarget();
    const connection = new URL(process.env.DATABASE_URL || '');
    if (!['postgres:', 'postgresql:'].includes(connection.protocol))
      throw Error('DATABASE_URL debe ser PostgreSQL.');
    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0')
      throw Error('No desactives la verificación TLS al conectar Neon.');
  }
  z.string().min(32).parse(process.env.BETTER_AUTH_SECRET);
  const origin = new URL(process.env.BETTER_AUTH_URL || '');
  if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname))
    throw Error('La autenticación fuera de localhost requiere HTTPS.');
  z.string().min(32).parse(process.env.CRON_SECRET);
  z.enum(['demo', 'live']).parse(process.env.CONTENT_MODE);
  console.log(
    `Configuración válida para ${local ? 'PostgreSQL local' : 'PostgreSQL remoto'}. No se imprimen secretos ni se abre conexión.`,
  );
  if (mediaStorage() === 'blob' && !process.env.BLOB_READ_WRITE_TOKEN)
    console.log('Multimedia remota pendiente: configura Vercel Blob antes de subir imágenes.');
} catch {
  console.error(
    'Configuración incompleta o insegura. Revisa .env.example: modo de base, URL privada, origen, secretos, TLS y modo de contenido.',
  );
  process.exitCode = 1;
}
