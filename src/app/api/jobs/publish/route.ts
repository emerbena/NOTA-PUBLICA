import { timingSafeEqual } from 'node:crypto';
import { publishDue } from '@/editorial/articles';
import { errorResponse } from '@/shared/http';
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (
    !expected ||
    !supplied ||
    Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
  )
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  try {
    return Response.json(await publishDue(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
