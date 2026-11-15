import type { MetadataRoute } from 'next';
import { and, eq } from 'drizzle-orm';
import { db } from '@/database/client';
import * as s from '@/database/schema';
import { publishedCondition } from '@/editorial/articles';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || 'https://www.notapublica.com';
  if (process.env.CONTENT_MODE === 'demo') return [];
  const rows = await db()
    .select({ slug: s.articles.slug, updated: s.revisions.createdAt })
    .from(s.articles)
    .innerJoin(
      s.revisions,
      and(
        eq(s.revisions.articleId, s.articles.id),
        eq(s.revisions.version, s.articles.publishedVersion),
      ),
    )
    .where(publishedCondition());
  const categories = await db().select({ slug: s.categories.slug }).from(s.categories);
  const authors = await db()
    .select({ slug: s.authors.slug })
    .from(s.authors)
    .where(eq(s.authors.isDemo, false));
  const rankings = await db()
    .select({ slug: s.rankings.slug })
    .from(s.rankings)
    .where(and(eq(s.rankings.isDemo, false), eq(s.rankings.published, true)));
  return [
    ...[
      '',
      '/noticias',
      '/deportes',
      '/opinion',
      '/multimedia',
      '/rankings',
      '/opinion-publica',
      '/premios',
    ].map((path) => ({ url: base + path })),
    ...rows.map((r) => ({ url: `${base}/noticias/${r.slug}`, lastModified: r.updated })),
    ...categories.map((r) => ({ url: `${base}/categorias/${r.slug}` })),
    ...authors.map((r) => ({ url: `${base}/autores/${r.slug}` })),
    ...rankings.map((r) => ({ url: `${base}/rankings/${r.slug}` })),
  ];
}
