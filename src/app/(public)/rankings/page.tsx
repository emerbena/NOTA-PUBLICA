import Link from 'next/link';
import { publicRankings } from '@/database/queries';
export const metadata = { title: 'Rankings' };
export default async function Rankings() {
  const rows = await publicRankings();
  return (
    <main id="contenido" className="container page-section">
      <h1>Rankings</h1>
      <p>
        Clasificaciones editoriales, por criterios o participación abierta. Cada ranking explica su
        método.
      </p>
      <div className="public-panels">
        {rows.map((r) => (
          <section key={r.id}>
            <small>
              {r.category} ·{' '}
              {r.method === 'editorial'
                ? 'Editorial'
                : r.method === 'votes'
                  ? 'Votación abierta'
                  : 'Evaluación por criterios'}
            </small>
            <h2>
              <Link href={`/rankings/${r.slug}`}>{r.title}</Link>
            </h2>
            <p>{r.description}</p>
            {r.isDemo && <p>Demostración</p>}
          </section>
        ))}
      </div>
      {!rows.length && <p>No hay rankings publicados.</p>}
    </main>
  );
}
