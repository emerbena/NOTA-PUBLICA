import { and, eq, isNull, lte, lt, sql } from 'drizzle-orm';
import { db, type Transaction } from '@/database/client';
import * as s from '@/database/schema';
import { articleInput } from '@/shared/validation';
import { cleanContent, plainText } from '@/shared/sanitize';
import { type Actor, requirePermission, HttpError } from '@/auth/permissions';

export async function log(
  tx: Transaction,
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, unknown> = {},
) {
  await tx.insert(s.audit).values({ actorId, action, entity, entityId, details });
}
async function locked(tx: Transaction, id: string) {
  const [article] = await tx
    .select()
    .from(s.articles)
    .where(and(eq(s.articles.id, id), isNull(s.articles.deletedAt)))
    .for('update');
  if (!article) throw new HttpError(404, 'Artículo no encontrado.');
  return article;
}
function mayEdit(actor: Actor, article: typeof s.articles.$inferSelect) {
  requirePermission(actor, 'write');
  if (
    !actor.permissions.has('edit_all') &&
    (article.createdBy !== actor.id || !['draft', 'changes', 'rejected'].includes(article.state))
  )
    throw new HttpError(403, 'Solo puedes editar tus borradores o artículos devueltos.');
}
export async function saveArticle(actor: Actor, raw: unknown) {
  const input = articleInput.parse(raw);
  requirePermission(actor, 'write');
  const body = cleanContent(input.body);
  if (plainText(body).trim().length < 10) throw new HttpError(400, 'Escribe contenido válido.');
  return db().transaction(async (tx) => {
    let id = input.id;
    let version = 1;
    const [author] = await tx.select().from(s.authors).where(eq(s.authors.id, input.authorId));
    if (!author || !author.active || author.isDemo !== input.isDemo)
      throw new HttpError(
        400,
        'Elige un autor activo del mismo entorno: demostración o contenido real.',
      );
    for (const mediaId of new Set(input.mediaIds)) {
      const [file] = await tx.select().from(s.media).where(eq(s.media.id, mediaId));
      if (!file || file.isDemo !== input.isDemo)
        throw new HttpError(400, 'Las imágenes demo y reales deben mantenerse separadas.');
    }
    if (id) {
      const old = await locked(tx, id);
      mayEdit(actor, old);
      if (input.expectedVersion !== old.currentVersion)
        throw new HttpError(409, 'Otra persona modificó el artículo. Recarga antes de guardar.');
      if (input.slug !== old.slug && old.publishedAt)
        throw new HttpError(400, 'La URL de un artículo publicado no puede cambiar.');
      if (input.isDemo !== old.isDemo)
        throw new HttpError(
          400,
          'No conviertas contenido demo en contenido real. Crea un artículo separado.',
        );
      version = old.currentVersion + 1;
      await tx
        .update(s.articles)
        .set({
          slug: input.slug,
          currentVersion: version,
          approvedVersion: null,
          state: 'draft',
          scheduledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(s.articles.id, id));
    } else {
      const [row] = await tx
        .insert(s.articles)
        .values({ slug: input.slug, createdBy: actor.id, isDemo: input.isDemo })
        .returning();
      id = row.id;
    }
    const {
      title,
      kicker,
      summary,
      cover,
      coverAlt,
      caption,
      kind,
      authorId,
      categoryId,
      changeNote,
    } = input;
    const [revision] = await tx
      .insert(s.revisions)
      .values({
        articleId: id,
        version,
        title,
        kicker,
        summary,
        body,
        cover,
        coverAlt,
        caption,
        kind,
        authorId,
        categoryId,
        changeNote,
        editorId: actor.id,
      })
      .returning();
    for (const name of new Set(input.tags)) {
      await tx.insert(s.tags).values({ name }).onConflictDoNothing();
      const [tag] = await tx.select().from(s.tags).where(eq(s.tags.name, name));
      await tx.insert(s.revisionTags).values({ revisionId: revision.id, tagId: tag.id });
    }
    for (const source of new Map(input.sources.map((v) => [v.url, v])).values()) {
      await tx.insert(s.sources).values(source).onConflictDoNothing();
      const [row] = await tx.select().from(s.sources).where(eq(s.sources.url, source.url));
      await tx.insert(s.revisionSources).values({ revisionId: revision.id, sourceId: row.id });
    }
    for (const mediaId of new Set(input.mediaIds))
      await tx.insert(s.revisionMedia).values({ revisionId: revision.id, mediaId });
    await log(tx, actor.id, 'article.save', 'article', id, {
      version,
      changeNote,
      fields: ['title', 'body', 'summary', 'author', 'category', 'sources', 'tags'],
    });
    return { id, version };
  });
}
export async function articleAction(
  actor: Actor,
  id: string,
  action: string,
  expectedVersion: number,
  comment = '',
  scheduledAt?: string,
) {
  return db().transaction(async (tx) => {
    const a = await locked(tx, id);
    if (a.currentVersion !== expectedVersion)
      throw new HttpError(409, 'La versión cambió. Recarga la noticia.');
    const [rev] = await tx
      .select()
      .from(s.revisions)
      .where(and(eq(s.revisions.articleId, id), eq(s.revisions.version, a.currentVersion)));
    const changes: Partial<typeof s.articles.$inferInsert> = { updatedAt: new Date() };
    if (action === 'submit') {
      mayEdit(actor, a);
      if (!['draft', 'changes', 'rejected'].includes(a.state))
        throw new HttpError(409, 'Este estado no admite envío a revisión.');
      changes.state = 'review';
    } else if (['changes', 'reject', 'approve'].includes(action)) {
      requirePermission(actor, action === 'approve' ? 'approve' : 'review');
      if (a.state !== 'review') throw new HttpError(409, 'El artículo debe estar en revisión.');
      changes.state =
        action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes';
      changes.approvedVersion = action === 'approve' ? a.currentVersion : null;
    } else if (action === 'publish' || action === 'schedule') {
      requirePermission(actor, 'publish');
      if (a.approvedVersion !== a.currentVersion || !['approved', 'scheduled'].includes(a.state))
        throw new HttpError(409, 'Se necesita aprobación de la versión actual.');
      if (action === 'schedule') {
        const date = new Date(scheduledAt || '');
        if (!Number.isFinite(date.getTime()) || date <= new Date())
          throw new HttpError(400, 'Elige una fecha futura.');
        changes.state = 'scheduled';
        changes.scheduledAt = date;
      } else {
        changes.state = 'published';
        changes.publishedVersion = a.currentVersion;
        changes.publishedAt = a.publishedAt || new Date();
        changes.scheduledAt = null;
      }
    } else if (action === 'unpublish' || action === 'archive') {
      requirePermission(actor, 'publish');
      changes.publishedVersion = null;
      changes.scheduledAt = null;
      changes.approvedVersion = null;
      changes.state = action === 'archive' ? 'archived' : 'draft';
    } else if (action === 'delete') {
      requirePermission(actor, 'edit_all');
      changes.deletedAt = new Date();
      changes.publishedVersion = null;
      changes.scheduledAt = null;
      changes.state = 'archived';
    } else throw new HttpError(400, 'Acción desconocida.');
    await tx.update(s.articles).set(changes).where(eq(s.articles.id, id));
    await tx
      .insert(s.reviews)
      .values({ articleId: id, revisionId: rev.id, actorId: actor.id, decision: action, comment });
    await log(tx, actor.id, `article.${action}`, 'article', id, {
      version: a.currentVersion,
      comment,
    });
    return { ok: true };
  });
}
export async function publishDue() {
  return db().transaction(async (tx) => {
    await tx.delete(s.rateLimits).where(lt(s.rateLimits.expiresAt, new Date()));
    const rows = await tx
      .select()
      .from(s.articles)
      .where(
        and(
          eq(s.articles.state, 'scheduled'),
          lte(s.articles.scheduledAt, new Date()),
          isNull(s.articles.deletedAt),
        ),
      )
      .for('update', { skipLocked: true });
    let published = 0;
    for (const a of rows) {
      if (a.approvedVersion !== a.currentVersion) continue;
      await tx
        .update(s.articles)
        .set({
          state: 'published',
          publishedVersion: a.currentVersion,
          publishedAt: a.publishedAt || new Date(),
          scheduledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(s.articles.id, a.id));
      await log(tx, null, 'article.scheduled_publish', 'article', a.id, {
        version: a.currentVersion,
      });
      published++;
    }
    return { published };
  });
}
export async function setFeatured(actor: Actor, id: string, position: number) {
  requirePermission(actor, 'publish');
  await db().transaction(async (tx) => {
    await locked(tx, id);
    await tx.update(s.articles).set({ featured: position }).where(eq(s.articles.id, id));
    await log(tx, actor.id, 'article.featured', 'article', id, { position });
  });
}
export const publishedCondition = () =>
  and(
    isNull(s.articles.deletedAt),
    sql`${s.articles.publishedVersion} is not null`,
    eq(s.articles.isDemo, process.env.CONTENT_MODE === 'demo'),
  );
