import Link from 'next/link';
import { publicArticles, publicRankings, publicPolls } from '@/database/queries';
import { StoryGrid, NewsletterSection, minutes } from '@/components/public';
import { Bookmark } from '@/components/public-client';
export default async function Home() {
  const [{ rows }, rankings, polls] = await Promise.all([
    publicArticles({ featured: true, limit: 12 }),
    publicRankings(),
    publicPolls(),
  ]);
  const hero = rows[0],
    radar = rows.slice(1, 4);
  const opinion = rows.find((r) => r.revision.kind !== 'news');
  return (
    <main id="contenido" className="container">
      <div className="trending">
        <span className="trending-label">
          <span className="purple-dot" /> EN CONVERSACIÓN
        </span>
        <Link href="/categorias/nacional">Nacional ↗</Link>
        <Link href="/categorias/internacional">Internacional ↗</Link>
        <Link href="/categorias/local">Local ↗</Link>
        <Link href="/categorias/regional">Regional ↗</Link>
        <span className="demo-tag">
          {process.env.CONTENT_MODE === 'demo' ? 'EDICIÓN DEMO' : 'NOTA PÚBLICA'}
        </span>
      </div>
      <section className="lead-section">
        <div className="section-eyebrow">
          <span>LO QUE IMPORTA HOY</span>
          <span>Una pausa para entender el mundo ↙</span>
        </div>
        {hero ? (
          <div className="lead-grid">
            <article className="hero-story">
              {hero.revision.cover && (
                <img
                  className="hero-image"
                  src={hero.revision.cover}
                  alt={hero.revision.coverAlt}
                  fetchPriority="high"
                />
              )}
              <div className="hero-shade" />
              <div className="hero-top">
                <span className="tag tag-yellow">EN PORTADA</span>
                <Bookmark id={hero.article.slug} />
              </div>
              <div className="hero-copy">
                <span className="eyebrow light">
                  {hero.category.name.toUpperCase()}
                  {hero.article.isDemo ? ' · DEMOSTRACIÓN' : ''}
                </span>
                <h1>
                  <Link href={`/noticias/${hero.article.slug}`}>{hero.revision.title}</Link>
                </h1>
                <p>{hero.revision.summary}</p>
                <div className="hero-meta">
                  <span>
                    Por <strong>{hero.author.name}</strong> · {minutes(hero.revision.body)} min de
                    lectura
                  </span>
                  <Link
                    className="round-arrow"
                    href={`/noticias/${hero.article.slug}`}
                    aria-label="Leer noticia principal"
                  >
                    ↗
                  </Link>
                </div>
              </div>
            </article>
            <aside className="lead-sidebar">
              <div className="sidebar-title">
                <span>EN EL RADAR</span>
                <span>↗</span>
              </div>
              {radar.map((story) => (
                <article className="radar-story" key={story.article.id}>
                  <div className="radar-text">
                    <span className="eyebrow">{story.category.name.toUpperCase()}</span>
                    <h2>
                      <Link href={`/noticias/${story.article.slug}`}>{story.revision.title}</Link>
                    </h2>
                    <span className="read-time">{minutes(story.revision.body)} min de lectura</span>
                  </div>
                  {story.revision.cover && (
                    <img src={story.revision.cover} alt={story.revision.coverAlt} loading="lazy" />
                  )}
                </article>
              ))}
              <div className="radar-note">
                <span className="note-spark">✳</span>
                <p>
                  El mundo no cabe en un titular.
                  <br />
                  <strong>Vamos un poco más allá.</strong>
                </p>
              </div>
            </aside>
          </div>
        ) : (
          <p className="empty-panel">
            Aún no hay noticias publicadas. El equipo editorial está preparando la primera edición.
          </p>
        )}
      </section>
      <section className="latest-section" id="historias">
        <div className="section-heading">
          <h2>
            Historias para estar al día<span>.</span>
          </h2>
          <Link className="text-button" href="/noticias">
            Ver todas las noticias ↗
          </Link>
        </div>
        <StoryGrid stories={rows.slice(1, 4)} />
      </section>
      <section className="perspective" id="opinion">
        <div className="perspective-intro">
          <span className="eyebrow">OTRAS MIRADAS</span>
          <h2>
            Pensar distinto.
            <br />
            Entender mejor<span>.</span>
          </h2>
          <p>Ideas que abren conversaciones y nos invitan a cambiar de perspectiva.</p>
          <Link
            className="text-button"
            href={opinion ? `/noticias/${opinion.article.slug}` : '/opinion'}
          >
            Leer opinión y análisis ↗
          </Link>
        </div>
        <div className="quote">
          <span className="quote-mark">“</span>
          <blockquote>
            Estar informados no es saberlo todo. Es aprender a hacernos mejores preguntas.
          </blockquote>
          <div className="quote-author">
            <span className="author-avatar">np.</span>
            <div>
              <strong>La mirada de Nota Pública</strong>
              <span>Opinión y análisis</span>
            </div>
          </div>
        </div>
        <span className="perspective-art" aria-hidden="true">
          ✳
        </span>
      </section>
      <section className="page-section">
        <div className="section-heading">
          <h2>
            Más formas de entender<span>.</span>
          </h2>
        </div>
        <div className="public-panels">
          <section>
            <h3>
              <Link href="/rankings">Rankings ↗</Link>
            </h3>
            {rankings.slice(0, 3).map((r) => (
              <p key={r.id}>
                <Link href={`/rankings/${r.slug}`}>{r.title}</Link>
              </p>
            ))}
            {!rankings.length && <p>Próximamente nuevas clasificaciones.</p>}
          </section>
          <section>
            <h3>
              <Link href="/opinion-publica">Opinión pública ↗</Link>
            </h3>
            {polls.slice(0, 3).map((p) => (
              <p key={p.id}>
                <Link href="/opinion-publica">{p.question}</Link>
              </p>
            ))}
          </section>
          <section>
            <h3>
              <Link href="/multimedia">Multimedia ↗</Link>
            </h3>
            <p>Entrevistas, videos y coberturas especiales.</p>
            <Link href="/premios">Premios Nota Pública ↗</Link>
          </section>
        </div>
      </section>
      <NewsletterSection />
    </main>
  );
}
