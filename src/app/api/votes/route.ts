import { z } from 'zod';
import { vote, rankingVote } from '@/editorial/voting';
import { readJson, assertOrigin, errorResponse, hashValue, rateLimit, voter } from '@/shared/http';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const v = z
      .object({ type: z.enum(['poll', 'ranking']), id: z.string(), choice: z.string() })
      .parse(await readJson(request, 4096));
    const identity = voter(request);
    await rateLimit(`voter:${identity.hash}`, 10, 60);
    // IP es una señal de abuso, no una identidad ni prueba de unicidad personal.
    const ip = process.env.VERCEL ? request.headers.get('x-forwarded-for')?.split(',')[0] : 'local';
    await rateLimit(`vote-ip:${hashValue(ip || 'unknown')}`, 60, 3600);
    if (v.type === 'poll') await vote(v.id, v.choice, identity.hash);
    else await rankingVote(v.id, v.choice, identity.hash);
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': identity.cookie } });
  } catch (error) {
    return errorResponse(error);
  }
}
