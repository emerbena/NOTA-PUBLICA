import Link from 'next/link';
import type { PublicStory } from '@/database/queries';
import { plainText } from '@/shared/sanitize';
import { Bookmark, Newsletter } from './public-client';
export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      className={`brand ${footer ? 'footer-brand' : ''}`}
      href="/"
      aria-label="Nota Pública, inicio"
    >
      <img
        className="brand-image"
        src="/assets/nota-publica-horizontal.png"
        alt="Nota Pública — La información que importa"
        width="2172"
        height="724"
      />
    </Link>
  );
}
export const menu = [
  ['Inicio', '/'],
  ['Actualidad', '/categorias/actualidad'],
  ['Política', '/categorias/politica'],
  ['Economía', '/categorias/economia'],
  ['Cultura', '/categorias/cultura'],
  ['Tecnología', '/categorias/tecnologia'],
  ['Planeta', '/categorias/planeta'],
  ['Deportes', '/deportes'],
];
export function Header() {
  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <div className="topbar">
        <div className="container topbar-inner">
          <span>Periodismo para mirar más allá.</span>
          <span>
            <span className="live-dot" /> Una mirada independiente{' '}
            <span className="top-separator">/</span>
            <time>
              {new Intl.DateTimeFormat('es-CO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'America/Bogota',
              }).format(new Date())}
            </time>
          </span>
        </div>
      </div>
      <header className="container">
        <div className="masthead">
          <Brand />
          <div className="header-actions">
            <Link
              className="icon-button search-toggle"
              href="/noticias"
              aria-label="Abrir búsqueda"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </Link>
            <a href="/#boletin" className="button button-purple">
              Súmate al boletín <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <nav className="nav" aria-label="Categorías de noticias">
          <div className="nav-links">
            {menu.map(([label, href]) => (
              <Link className="nav-link" key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>
          <Link href="/opinion" className="opinion-link">
            Otras miradas <span>↗</span>
          </Link>
        </nav>
        {process.env.CONTENT_MODE === 'demo' && (
          <p className="edition-notice">
            Edición de demostración · Contenido ilustrativo, no noticias verificadas.
          </p>
        )}
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="container">
      <div className="footer-main">
        <Brand footer />
        <p>
          Las historias que importan.
          <br />
          El contexto que necesitas.
        </p>
        <div className="footer-links">
          <Link href="/acerca">Quiénes somos ↗</Link>
          <Link href="/principios">Nuestros principios ↗</Link>
          <a href="/#boletin">Nuestro boletín ↗</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Nota Pública</span>
        <span>
          {process.env.CONTENT_MODE === 'demo'
            ? 'Edición de demostración. Historias ilustrativas.'
            : 'La información que importa.'}
        </span>
        <Link href="/privacidad">Privacidad</Link>
      </div>
    </footer>
  );
}
export function minutes(body: string) {
  return Math.max(1, Math.ceil(plainText(body).split(/\s+/).length / 200));
}
export function StoryCard({ story }: { story: PublicStory }) {
  const { article: a, revision: r, author, category } = story;
  return (
    <article className="story-card">
      <Link
        className="story-image-button"
        href={`/noticias/${a.slug}`}
        aria-label={`Leer: ${r.title}`}
      >
        {r.cover && <img src={r.cover} alt={r.coverAlt} loading="lazy" />}
      </Link>
      <div className="card-topline">
        <Link href={`/categorias/${category.slug}`} className="eyebrow">
          {category.name.toUpperCase()}
        </Link>
        <Bookmark id={a.slug} />
      </div>
      {a.isDemo && <small className="demo-label">Demostración</small>}
      <h3>
        <Link href={`/noticias/${a.slug}`}>{r.title}</Link>
      </h3>
      <p>{r.summary}</p>
      <div className="card-meta">
        <Link href={`/autores/${author.slug}`}>
          <strong>{author.name}</strong>
        </Link>
        <span>{minutes(r.body)} min de lectura</span>
      </div>
      <small>
        {a.publishedAt?.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
        {a.isDemo ? ' · Demostración' : ''}
      </small>
    </article>
  );
}
export function StoryGrid({ stories }: { stories: PublicStory[] }) {
  return stories.length ? (
    <div className="stories-grid">
      {stories.map((story) => (
        <StoryCard key={story.article.id} story={story} />
      ))}
    </div>
  ) : (
    <p className="empty-panel">Todavía no hay publicaciones en esta sección.</p>
  );
}
export function NewsletterSection() {
  return (
    <section className="newsletter" id="boletin">
      <div className="newsletter-copy">
        <span className="newsletter-kicker">
          <span className="yellow-dot" /> UN CORREO. OTRA PERSPECTIVA.
        </span>
        <h2>
          Lo importante,
          <br />
          sin tanto ruido<span>.</span>
        </h2>
        <p>
          Una selección de historias para comenzar el día
          <br />
          con contexto. Directamente en tu bandeja.
        </p>
      </div>
      <div className="newsletter-form-wrap">
        <Newsletter />
      </div>
    </section>
  );
}
