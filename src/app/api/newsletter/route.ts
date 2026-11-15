import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { readJson, assertOrigin, errorResponse, hashValue, rateLimit } from '@/shared/http';
import { db } from '@/database/client';
import { subscribers } from '@/database/schema';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const ip = process.env.VERCEL ? request.headers.get('x-forwarded-for')?.split(',')[0] : 'local';
    await rateLimit(`newsletter-ip:${hashValue(ip || 'unknown')}`, 20, 3600);
    const v = z
      .object({ email: z.email().transform((e) => e.toLowerCase()), consent: z.literal(true) })
      .parse(await readJson(request, 4096));
    await rateLimit(`subscribe:${hashValue(v.email)}`, 3, 3600);
    const token = randomBytes(32).toString('hex');
    const inserted = await db()
      .insert(subscribers)
      .values({ email: v.email, unsubscribeHash: hashValue(token) })
      .onConflictDoNothing()
      .returning({ id: subscribers.id });
    return Response.json({
      ok: true,
      message: 'Solicitud guardada. Los envíos del boletín aún no están habilitados.',
      unsubscribe: inserted.length ? `/boletin/baja?token=${token}` : undefined,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
