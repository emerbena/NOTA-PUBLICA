import { and, eq, sql, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@/database/client';
import * as s from '@/database/schema';
import { VoteForm } from '@/components/public-client';
export default async function Ranking({ params }: { params: Promise<{ slug: string }> }) {
  const [r] = await db()
    .select()
    .from(s.rankings)
    .where(
      and(
        eq(s.rankings.slug, (await params).slug),
        eq(s.rankings.published, true),
        eq(s.rankings.isDemo, process.env.CONTENT_MODE === 'demo'),
      ),
    );
  if (!r) notFound();
  const entries = await db()
    .select({
      id: s.rankingEntries.id,
      name: s.rankingEntries.name,
      description: s.rankingEntries.description,
      position: s.rankingEntries.position,
      score: s.rankingEntries.score,
      count: sql<number>`count(${s.rankingVotes.id})::int`,
    })
    .from(s.rankingEntries)
    .leftJoin(s.rankingVotes, eq(s.rankingVotes.entryId, s.rankingEntries.id))
    .where(eq(s.rankingEntries.rankingId, r.id))
    .groupBy(s.rankingEntries.id)
    .orderBy(asc(s.rankingEntries.position));
  const criteria = await db()
    .select()
    .from(s.rankingCriteria)
    .where(eq(s.rankingCriteria.rankingId, r.id));
  if (r.method === 'votes') entries.sort((a, b) => b.count - a.count || a.position - b.position);
  return (
    <main id="contenido" className="container page-section">
      <h1>{r.title}</h1>
      <p>{r.description}</p>
      <p>
        Método:{' '}
        {r.method === 'editorial'
          ? 'selección editorial'
          : r.method === 'votes'
            ? 'votación abierta, no representativa'
            : 'evaluación basada en criterios'}
      </p>
      {r.isDemo && <p className="demo-notice">Ranking de demostración. Participantes ficticios.</p>}
      {criteria.length > 0 && (
        <section>
          <h2>Criterios</h2>
          {criteria.map((c) => (
            <p key={c.id}>
              <strong>{c.name}:</strong> {c.description}
            </p>
          ))}
        </section>
      )}
      <ol>
        {entries.map((e) => (
          <li className="poll-panel" key={e.id}>
            <h2>{e.name}</h2>
            <p>{e.description}</p>
            {r.method === 'criteria' && <p>Puntuación editorial: {e.score}</p>}
          </li>
        ))}
      </ol>
      {r.method === 'votes' && (
        <VoteForm
          type="ranking"
          id={r.id}
          options={entries.map((e) => ({ id: e.id, label: e.name, count: e.count }))}
          active
        />
      )}
    </main>
  );
}
