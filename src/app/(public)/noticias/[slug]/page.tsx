import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { publicStory, publicArticles } from '@/database/queries';
import { StoryGrid, minutes } from '@/components/public';
import { Share } from '@/components/public-client';
import { cleanContent } from '@/shared/sanitize';
import { demoPresentation } from '@/shared/demo';
import { structuredData } from '@/shared/structured-data';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const story = await publicStory((await params).slug);
  if (!story) return { title: 'No encontrada' };
  const { article: a, revision: r } = story;
  const presentation = demoPresentation(a.isDemo, r.title, r.summary);
  return {
    title: presentation.title,
    description: presentation.description,
    alternates: { canonical: `/noticias/${a.slug}` },
    openGraph: {
      type: a.isDemo ? 'website' : 'article',
      title: presentation.title,
      description: presentation.description,
      images: r.cover ? [r.cover] : [],
      publishedTime: a.publishedAt?.toISOString(),
      modifiedTime: r.createdAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: presentation.title,
      description: presentation.description,
      images: r.cover ? [r.cover] : [],
    },
    robots: a.isDemo ? { index: false, follow: true } : undefined,
  };
}
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const story = await publicStory((await params).slug);
  if (!story) notFound();
  const { article: a, revision: r, author, category, sources, tags } = story;
  const related = await publicArticles({ category: category.slug, limit: 4 });
  const presentation = demoPresentation(a.isDemo, r.title, r.summary);
  const structured = {
    '@context': 'https://schema.org',
    '@type': presentation.schemaType,
    headline: presentation.title,
    description: presentation.description,
    image: r.cover ? [r.cover] : [],
    datePublished: a.publishedAt?.toISOString(),
    dateModified: r.createdAt.toISOString(),
    author: {
      '@type': 'Person',
      name: author.name,
      url: `${process.env.SITE_URL || 'https://www.notapublica.com'}/autores/${author.slug}`,
    },
    publisher: { '@type': 'Organization', name: 'Nota Pública' },
  };
  return (
    <main id="contenido" className="container page-section">
      <article className="article-page">
        <span className="eyebrow">
          {r.kicker || category.name} ·{' '}
          {r.kind === 'news'
            ? 'Información'
            : r.kind === 'column'
              ? 'Columna'
              : r.kind === 'analysis'
                ? 'Análisis'
                : r.kind === 'interview'
                  ? 'Entrevista'
                  : r.kind === 'editorial'
                    ? 'Editorial'
                    : 'Video'}
        </span>
        <h1>{r.title}</h1>
        <p className="article-summary">{r.summary}</p>
        {a.isDemo && (
          <p className="demo-notice">
            Contenido de demostración. No es una noticia verificada ni un acontecimiento real.
          </p>
        )}
        <p>
          <Link href={`/autores/${author.slug}`}>{author.name}</Link> ·{' '}
          {a.publishedAt?.toLocaleString('es-CO', { timeZone: 'America/Bogota' })} ·{' '}
          {minutes(r.body)} min
        </p>
        <small>
          Actualización editorial:{' '}
          {r.createdAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
        </small>
        {r.cover && (
          <figure>
            <img src={r.cover} alt={r.coverAlt} />
            <figcaption>{r.caption}</figcaption>
          </figure>
        )}
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: cleanContent(r.body) }} />
        <p>
          <Link href={`/categorias/${category.slug}`}>{category.name}</Link> ·{' '}
          {tags.map((t) => t.name).join(' · ')}
        </p>
        {sources.length > 0 && (
          <section>
            <h2>Fuentes consultadas</h2>
            <ul>
              {sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Share title={presentation.title} />
      </article>
      <section>
        <h2>Noticias relacionadas</h2>
        <StoryGrid stories={related.rows.filter((v) => v.article.id !== a.id).slice(0, 3)} />
      </section>
      <script
        nonce={(await headers()).get('x-np-nonce') || undefined}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData(structured) }}
      />
    </main>
  );
}
