import { publicPolls, pollResults } from '@/database/queries';
import { VoteForm } from '@/components/public-client';
export const metadata = { title: 'Opinión pública' };
export default async function Polls() {
  const rows = await publicPolls();
  return (
    <main id="contenido" className="container page-section">
      <h1>Opinión pública</h1>
      <p>
        Consultas abiertas de participación ciudadana. No son encuestas representativas de la
        población.
      </p>
      {await Promise.all(
        rows.map(async (p) => (
          <section className="poll-panel" key={p.id}>
            <h2>{p.question}</h2>
            <p>{p.scope}</p>
            <p>
              Desde {p.startsAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' })} hasta{' '}
              {p.endsAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' })} (Colombia)
            </p>
            {p.isDemo && <p className="demo-notice">Consulta de demostración</p>}
            <VoteForm
              type="poll"
              id={p.id}
              options={await pollResults(p.id)}
              active={p.status === 'active' && p.startsAt <= new Date() && p.endsAt > new Date()}
            />
          </section>
        )),
      )}
      {!rows.length && <p>No hay consultas publicadas.</p>}
    </main>
  );
}
