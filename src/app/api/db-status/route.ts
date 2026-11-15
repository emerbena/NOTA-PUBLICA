import { sql } from 'drizzle-orm';
import { db } from '@/database/client';
export async function GET() {
  try {
    await db().execute(sql`select 1`);
    return Response.json(
      { ok: true, database: 'connected' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        error:
          process.env.DATABASE_URL || process.env.NP_DATABASE_MODE === 'local'
            ? 'database_unavailable'
            : 'database_not_configured',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
