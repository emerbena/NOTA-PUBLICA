import { and, eq, desc, asc, ilike, or, sql, inArray } from 'drizzle-orm';
import { db } from './client';
import * as s from './schema';
import { publishedCondition } from '@/editorial/articles';
export async function publicArticles(
  options: {
    query?: string;
    category?: string;
    author?: string;
    kind?: string;
    kinds?: string[];
    page?: number;
    limit?: number;
    featured?: boolean;
  } = {},
) {
  const page = Math.max(1, Math.min(10000, options.page || 1));
  const limit = Math.min(50, options.limit || 12);
  const condition = and(
    publishedCondition(),
    options.category ? eq(s.categories.slug, options.category) : undefined,
    options.author ? eq(s.authors.slug, options.author) : undefined,
    options.kind ? eq(s.revisions.kind, options.kind) : undefined,
    options.kinds?.length ? inArray(s.revisions.kind, options.kinds) : undefined,
    options.query
      ? or(
          ilike(s.revisions.title, `%${options.query.slice(0, 200)}%`),
          ilike(s.revisions.summary, `%${options.query.slice(0, 200)}%`),
        )
      : undefined,
  );
  const rows = await db()
    .select({
      article: s.articles,
      revision: s.revisions,
      author: s.authors,
      category: s.categories,
      total: sql<number>`count(*) over()::int`,
    })
    .from(s.articles)
    .innerJoin(
      s.revisions,
      and(
        eq(s.revisions.articleId, s.articles.id),
        eq(s.revisions.version, s.articles.publishedVersion),
      ),
    )
    .innerJoin(s.authors, eq(s.authors.id, s.revisions.authorId))
    .innerJoin(s.categories, eq(s.categories.id, s.revisions.categoryId))
    .where(condition)
    .orderBy(
      ...(options.featured
        ? [desc(s.articles.featured), desc(s.articles.publishedAt)]
        : [desc(s.articles.publishedAt)]),
      asc(s.articles.id),
    )
    .limit(limit)
    .offset((page - 1) * limit);
  return { rows, total: rows[0]?.total || 0, page, limit };
}
export type PublicStory = Awaited<ReturnType<typeof publicArticles>>['rows'][number];
export async function publicStory(slug: string) {
  const [row] = await db()
    .select({
      article: s.articles,
      revision: s.revisions,
      author: s.authors,
      category: s.categories,
    })
    .from(s.articles)
    .innerJoin(
      s.revisions,
      and(
        eq(s.revisions.articleId, s.articles.id),
        eq(s.revisions.version, s.articles.publishedVersion),
      ),
    )
    .innerJoin(s.authors, eq(s.authors.id, s.revisions.authorId))
    .innerJoin(s.categories, eq(s.categories.id, s.revisions.categoryId))
    .where(and(publishedCondition(), eq(s.articles.slug, slug)));
  if (!row) return null;
  return {
    ...row,
    sources: await db()
      .select({ name: s.sources.name, url: s.sources.url })
      .from(s.revisionSources)
      .innerJoin(s.sources, eq(s.sources.id, s.revisionSources.sourceId))
      .where(eq(s.revisionSources.revisionId, row.revision.id)),
    tags: await db()
      .select({ name: s.tags.name })
      .from(s.revisionTags)
      .innerJoin(s.tags, eq(s.tags.id, s.revisionTags.tagId))
      .where(eq(s.revisionTags.revisionId, row.revision.id)),
  };
}
export async function publicRankings() {
  return db()
    .select()
    .from(s.rankings)
    .where(
      and(
        eq(s.rankings.published, true),
        eq(s.rankings.isDemo, process.env.CONTENT_MODE === 'demo'),
      ),
    );
}
export async function publicPolls() {
  return db()
    .select()
    .from(s.polls)
    .where(
      and(
        sql`${s.polls.status} <> 'draft'`,
        eq(s.polls.isDemo, process.env.CONTENT_MODE === 'demo'),
      ),
    )
    .orderBy(desc(s.polls.createdAt));
}
export async function pollResults(id: string) {
  return db()
    .select({
      id: s.pollOptions.id,
      label: s.pollOptions.label,
      count: sql<number>`count(${s.votes.id})::int`,
    })
    .from(s.pollOptions)
    .leftJoin(s.votes, eq(s.votes.optionId, s.pollOptions.id))
    .where(eq(s.pollOptions.pollId, id))
    .groupBy(s.pollOptions.id, s.pollOptions.label);
}
