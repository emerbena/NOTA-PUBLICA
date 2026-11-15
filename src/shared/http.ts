import { ZodError } from 'zod';
import { HttpError } from '@/auth/permissions';
import { db } from '@/database/client';
import { rateLimits } from '@/database/schema';
import { sql } from 'drizzle-orm';
import { createHmac, randomBytes } from 'node:crypto';
export function assertOrigin(request: Request) {
  const expected = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin;
  if (request.headers.get('origin') !== expected)
    throw new HttpError(403, 'Origen de solicitud no permitido.');
}
export async function readBytes(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Solicitud vacía.');
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError(413, 'Solicitud demasiado grande.');
    }
    parts.push(value);
  }
  return Buffer.concat(parts);
}
export async function readJson(request: Request, limit = 300_000) {
  const body = await readBytes(request, limit);
  try {
    return JSON.parse(body.toString('utf8')) as unknown;
  } catch {
    throw new HttpError(400, 'Solicitud JSON inválida.');
  }
}
export function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return Response.json({ error: error.issues.map((i) => i.message).join('. ') }, { status: 400 });
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  const code =
    (error as { cause?: { code?: string }; code?: string })?.cause?.code ||
    (error as { code?: string })?.code;
  if (code === '23505')
    return Response.json({ error: 'El registro ya existe o ya participaste.' }, { status: 409 });
  if (code === '23503')
    return Response.json(
      { error: 'Selecciona referencias válidas; el registro puede estar en uso.' },
      { status: 400 },
    );
  console.error('Operación fallida', { code: code || 'internal_error' });
  return Response.json({ error: 'No se pudo completar la operación.' }, { status: 500 });
}
export function hashValue(value: string) {
  const key = process.env.BETTER_AUTH_SECRET;
  if (!key) throw new Error('Falta secreto');
  return createHmac('sha256', key).update(value).digest('hex');
}
export async function rateLimit(key: string, max: number, seconds = 60) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const [row] = await db()
    .insert(rateLimits)
    .values({
      key: `${key}:${bucket}`,
      count: 1,
      expiresAt: new Date((bucket + 1) * seconds * 1000),
    })
    .onConflictDoUpdate({ target: rateLimits.key, set: { count: sql`${rateLimits.count}+1` } })
    .returning();
  if (row.count > max) throw new HttpError(429, 'Demasiadas solicitudes. Intenta más tarde.');
}
export function voter(request: Request) {
  const cookie = request.headers.get('cookie')?.match(/(?:^|; )np-voter=([a-f0-9]{64})/);
  const token = cookie?.[1] || randomBytes(32).toString('hex');
  return {
    hash: hashValue(token),
    cookie: `np-voter=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${process.env.NODE_ENV === 'production' && process.env.NP_DATABASE_MODE !== 'local' ? '; Secure' : ''}`,
  };
}
