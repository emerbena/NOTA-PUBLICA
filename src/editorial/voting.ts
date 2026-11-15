import { and, eq } from 'drizzle-orm';
import { db } from '@/database/client';
import * as s from '@/database/schema';
import { HttpError } from '@/auth/permissions';
export async function vote(pollId: string, optionId: string, voterHash: string) {
  await db().transaction(async (tx) => {
    const [poll] = await tx.select().from(s.polls).where(eq(s.polls.id, pollId)).for('update');
    const now = new Date();
    if (
      !poll ||
      poll.isDemo !== (process.env.CONTENT_MODE === 'demo') ||
      poll.status !== 'active' ||
      poll.startsAt > now ||
      poll.endsAt <= now
    )
      throw new HttpError(409, 'La consulta no está activa.');
    const [option] = await tx
      .select()
      .from(s.pollOptions)
      .where(and(eq(s.pollOptions.id, optionId), eq(s.pollOptions.pollId, pollId)));
    if (!option) throw new HttpError(400, 'Opción inválida.');
    await tx.insert(s.votes).values({ pollId, optionId, voterHash });
  });
}
export async function rankingVote(rankingId: string, entryId: string, voterHash: string) {
  await db().transaction(async (tx) => {
    const [ranking] = await tx
      .select()
      .from(s.rankings)
      .where(eq(s.rankings.id, rankingId))
      .for('update');
    if (
      !ranking ||
      !ranking.published ||
      ranking.method !== 'votes' ||
      ranking.isDemo !== (process.env.CONTENT_MODE === 'demo')
    )
      throw new HttpError(409, 'La votación no está disponible.');
    const [entry] = await tx
      .select()
      .from(s.rankingEntries)
      .where(and(eq(s.rankingEntries.id, entryId), eq(s.rankingEntries.rankingId, rankingId)));
    if (!entry) throw new HttpError(400, 'Participante inválido.');
    await tx.insert(s.rankingVotes).values({ rankingId, entryId, voterHash });
  });
}
