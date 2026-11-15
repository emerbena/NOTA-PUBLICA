import { db } from '@/database/client';
import { subscribers } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { hashValue, assertOrigin, errorResponse } from '@/shared/http';
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) return new Response('Enlace inválido', { status: 400 });
  return new Response(
    `<!doctype html><html lang="es"><meta charset="utf-8"><title>Baja del boletín</title><form method="post"><input type="hidden" name="token" value="${token}"><button>Confirmar baja del boletín</button></form></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const token = (await request.formData()).get('token');
    if (typeof token !== 'string') return new Response('Token inválido', { status: 400 });
    await db()
      .update(subscribers)
      .set({ active: false })
      .where(eq(subscribers.unsubscribeHash, hashValue(token)));
    return new Response('La solicitud de baja fue procesada.');
  } catch (error) {
    return errorResponse(error);
  }
}
