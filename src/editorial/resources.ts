import { z } from 'zod';
import { eq, and, sql, isNull, desc, ilike } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { db } from '@/database/client';
import * as s from '@/database/schema';
import { type Actor, requirePermission, HttpError } from '@/auth/permissions';
import { slug, assetUrl, roles } from '@/shared/validation';
import { log } from './articles';
const name = z.string().trim().min(2).max(200);
const description = z.string().max(4000).default('');
const id = z.string().optional();
export const schemas = {
  categories: z.object({ id, name, slug, description }),
  authors: z.object({
    id,
    name,
    slug,
    bio: description,
    specialty: z.string().max(200).default(''),
    photo: assetUrl.default(''),
    active: z.boolean().default(true),
    isDemo: z.boolean().default(false),
  }),
  rankings: z
    .object({
      id,
      slug,
      title: name,
      description,
      category: name,
      method: z.enum(['editorial', 'votes', 'criteria']),
      published: z.boolean().default(false),
      isDemo: z.boolean().default(false),
      entries: z
        .array(
          z.object({
            name,
            description,
            position: z.number().int().positive(),
            score: z.number().int().min(0).max(10000).default(0),
          }),
        )
        .min(2)
        .max(100),
      criteria: z.array(z.object({ name, description })).max(30).default([]),
    })
    .refine(
      (v) => new Set(v.entries.map((e) => e.position)).size === v.entries.length,
      'Las posiciones no pueden repetirse',
    )
    .refine((v) => v.method !== 'criteria' || v.criteria.length > 0, 'Define los criterios'),
  polls: z
    .object({
      id,
      slug,
      question: name,
      scope: z.string().min(10).max(1000),
      status: z.enum(['draft', 'active', 'closed']),
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date(),
      isDemo: z.boolean().default(false),
      options: z.array(z.string().min(1).max(200)).min(2).max(10),
    })
    .refine((v) => v.endsAt > v.startsAt, 'La fecha final debe ser posterior'),
  awards: z.object({
    id,
    title: name,
    year: z.number().int().min(2020).max(2200),
    description,
    published: z.boolean().default(false),
    isDemo: z.boolean().default(false),
    nominations: z
      .array(z.object({ category: name, name, description, winner: z.boolean().default(false) }))
      .max(100)
      .default([]),
  }),
  calendar: z.object({
    id,
    title: name,
    description,
    dueAt: z.coerce.date(),
    assigneeId: z.string().nullable().default(null),
    articleId: z.string().nullable().default(null),
  }),
  users: z.object({
    id,
    name,
    email: z.email().transform((v) => v.toLowerCase()),
    role: z.enum(roles),
    active: z.boolean().default(true),
    canApprove: z.boolean().default(false),
    password: z.string().min(12).max(128).optional(),
  }),
  media: z.object({ id: z.string(), title: name, description, alt: z.string().min(1).max(300) }),
  distribution: z.object({
    id,
    articleId: z.string(),
    revisionId: z.string(),
    platform: z.enum(['telegram', 'facebook', 'instagram', 'threads', 'x']),
    text: z.string().max(10000),
  }),
};
export type Resource = keyof typeof schemas;
export async function saveResource(actor: Actor, resource: Resource, raw: unknown) {
  requirePermission(
    actor,
    resource === 'users'
      ? 'users'
      : resource === 'distribution'
        ? 'distribute'
        : resource === 'media'
          ? 'write'
          : 'manage',
  );
  return db().transaction(async (tx) => {
    let savedId: string;
    switch (resource) {
      case 'categories': {
        const v = schemas.categories.parse(raw);
        const [row] = v.id
          ? await tx.update(s.categories).set(v).where(eq(s.categories.id, v.id)).returning()
          : await tx.insert(s.categories).values(v).returning();
        savedId = row?.id;
        break;
      }
      case 'authors': {
        const v = schemas.authors.parse(raw);
        const [row] = v.id
          ? await tx.update(s.authors).set(v).where(eq(s.authors.id, v.id)).returning()
          : await tx.insert(s.authors).values(v).returning();
        savedId = row?.id;
        break;
      }
      case 'rankings': {
        const { entries, criteria, ...v } = schemas.rankings.parse(raw);
        if (v.id) {
          const [existing] = await tx
            .select()
            .from(s.rankings)
            .where(eq(s.rankings.id, v.id))
            .for('update');
          if (!existing) throw new HttpError(404, 'Ranking no encontrado.');
          if (existing.isDemo !== v.isDemo)
            throw new HttpError(400, 'Mantén separados los registros demo y reales.');
          const [vote] = await tx
            .select()
            .from(s.rankingVotes)
            .where(eq(s.rankingVotes.rankingId, v.id))
            .limit(1);
          if (vote)
            throw new HttpError(
              409,
              'Un ranking con votos conserva participantes y metodología. Solo puedes despublicarlo.',
            );
        }
        const [row] = v.id
          ? await tx
              .update(s.rankings)
              .set({ ...v, updatedAt: new Date() })
              .where(eq(s.rankings.id, v.id))
              .returning()
          : await tx.insert(s.rankings).values(v).returning();
        savedId = row?.id;
        if (!savedId) break;
        await tx.delete(s.rankingEntries).where(eq(s.rankingEntries.rankingId, savedId));
        await tx.delete(s.rankingCriteria).where(eq(s.rankingCriteria.rankingId, savedId));
        await tx
          .insert(s.rankingEntries)
          .values(entries.map((e) => ({ ...e, rankingId: savedId })));
        if (criteria.length)
          await tx
            .insert(s.rankingCriteria)
            .values(criteria.map((c) => ({ ...c, rankingId: savedId })));
        break;
      }
      case 'polls': {
        const { options, ...v } = schemas.polls.parse(raw);
        if (v.id) {
          const [existing] = await tx
            .select()
            .from(s.polls)
            .where(eq(s.polls.id, v.id))
            .for('update');
          if (!existing) throw new HttpError(404, 'Encuesta no encontrada.');
          if (existing.isDemo !== v.isDemo)
            throw new HttpError(400, 'Mantén separados los registros demo y reales.');
          const [vote] = await tx.select().from(s.votes).where(eq(s.votes.pollId, v.id)).limit(1);
          if (vote)
            throw new HttpError(
              409,
              'Una consulta con votos no puede cambiar. Puedes cerrarla desde la lista.',
            );
        }
        const [row] = v.id
          ? await tx.update(s.polls).set(v).where(eq(s.polls.id, v.id)).returning()
          : await tx.insert(s.polls).values(v).returning();
        savedId = row?.id;
        if (!savedId) break;
        await tx.delete(s.pollOptions).where(eq(s.pollOptions.pollId, savedId));
        await tx.insert(s.pollOptions).values(options.map((label) => ({ pollId: savedId, label })));
        break;
      }
      case 'awards': {
        const { nominations, ...v } = schemas.awards.parse(raw);
        const [row] = v.id
          ? await tx.update(s.awards).set(v).where(eq(s.awards.id, v.id)).returning()
          : await tx.insert(s.awards).values(v).returning();
        savedId = row?.id;
        if (!savedId) break;
        await tx.delete(s.nominations).where(eq(s.nominations.awardId, savedId));
        if (nominations.length)
          await tx
            .insert(s.nominations)
            .values(nominations.map((n) => ({ ...n, awardId: savedId })));
        break;
      }
      case 'calendar': {
        const v = schemas.calendar.parse(raw);
        const [row] = v.id
          ? await tx.update(s.calendar).set(v).where(eq(s.calendar.id, v.id)).returning()
          : await tx.insert(s.calendar).values(v).returning();
        savedId = row?.id;
        break;
      }
      case 'media': {
        const v = schemas.media.parse(raw);
        const [existing] = await tx
          .select()
          .from(s.media)
          .where(eq(s.media.id, v.id))
          .for('update');
        if (!existing) throw new HttpError(404, 'Recurso no encontrado.');
        if (existing.createdBy !== actor.id && !actor.permissions.has('edit_all'))
          throw new HttpError(403, 'Solo puedes editar los metadatos de tus imágenes.');
        const [row] = await tx.update(s.media).set(v).where(eq(s.media.id, v.id)).returning();
        savedId = row?.id;
        break;
      }
      case 'users': {
        const v = schemas.users.parse(raw);
        // Serializa cambios de roles y protege la última cuenta administradora.
        const admins = await tx
          .select()
          .from(s.staff)
          .where(eq(s.staff.roleId, 'superadmin'))
          .for('update');
        if (v.id === actor.id && (!v.active || v.role !== 'superadmin'))
          throw new HttpError(400, 'No puedes revocar tu propio acceso.');
        if (
          v.id &&
          admins.filter((a) => a.active).length === 1 &&
          admins.some((a) => a.userId === v.id) &&
          (!v.active || v.role !== 'superadmin')
        )
          throw new HttpError(400, 'Debe quedar un superadministrador activo.');
        if (v.id) {
          await tx
            .update(s.user)
            .set({ name: v.name, email: v.email, updatedAt: new Date() })
            .where(eq(s.user.id, v.id));
          savedId = v.id;
          await tx.delete(s.session).where(eq(s.session.userId, savedId));
        } else {
          if (!v.password)
            throw new HttpError(
              400,
              'La cuenta nueva requiere contraseña de al menos 12 caracteres.',
            );
          const [row] = await tx
            .insert(s.user)
            .values({ name: v.name, email: v.email })
            .returning();
          savedId = row.id;
        }
        if (v.password) {
          const password = await hashPassword(v.password);
          await tx
            .insert(s.account)
            .values({ userId: savedId, accountId: savedId, providerId: 'credential', password })
            .onConflictDoUpdate({
              target: [s.account.providerId, s.account.accountId],
              set: { password, updatedAt: new Date() },
            });
        }
        await tx
          .insert(s.staff)
          .values({ userId: savedId, roleId: v.role, active: v.active, canApprove: v.canApprove })
          .onConflictDoUpdate({
            target: s.staff.userId,
            set: {
              roleId: v.role,
              active: v.active,
              canApprove: v.canApprove,
              updatedAt: new Date(),
            },
          });
        break;
      }
      case 'distribution': {
        const v = schemas.distribution.parse(raw);
        const [a] = await tx
          .select()
          .from(s.articles)
          .where(and(eq(s.articles.id, v.articleId), isNull(s.articles.deletedAt)));
        const [r] = await tx
          .select()
          .from(s.revisions)
          .where(and(eq(s.revisions.id, v.revisionId), eq(s.revisions.articleId, v.articleId)));
        if (!a || !r || a.publishedVersion !== r.version)
          throw new HttpError(400, 'Solo se preparan variantes de revisiones publicadas.');
        const [row] = await tx
          .insert(s.distribution)
          .values({ ...v, state: 'draft' })
          .onConflictDoUpdate({
            target: [s.distribution.revisionId, s.distribution.platform],
            set: { text: v.text, state: 'draft' },
          })
          .returning();
        savedId = row.id;
        break;
      }
    }
    if (!savedId!) throw new HttpError(404, 'Registro no encontrado.');
    await log(tx, actor.id, `${resource}.save`, resource, savedId);
    return { id: savedId };
  });
}
export async function resourceAction(actor: Actor, resource: string, id: string, action: string) {
  requirePermission(actor, 'manage');
  await db().transaction(async (tx) => {
    if (resource === 'polls' && action === 'close')
      await tx.update(s.polls).set({ status: 'closed' }).where(eq(s.polls.id, id));
    else if (resource === 'rankings' && ['publish', 'unpublish'].includes(action))
      await tx
        .update(s.rankings)
        .set({ published: action === 'publish' })
        .where(eq(s.rankings.id, id));
    else if (resource === 'awards' && ['publish', 'unpublish'].includes(action))
      await tx
        .update(s.awards)
        .set({ published: action === 'publish' })
        .where(eq(s.awards.id, id));
    else if (resource === 'authors' && action === 'deactivate')
      await tx.update(s.authors).set({ active: false }).where(eq(s.authors.id, id));
    else if (resource === 'calendar' && action === 'delete')
      await tx.delete(s.calendar).where(eq(s.calendar.id, id));
    else throw new HttpError(400, 'Acción no permitida.');
    await log(tx, actor.id, `${resource}.${action}`, resource, id);
  });
  return { ok: true };
}
export async function adminData(
  actor: Actor,
  filter?: { id?: string; page?: number; query?: string; state?: string },
) {
  const page = Math.max(1, Math.min(10000, Math.floor(filter?.page || 1)));
  const pageSize = filter ? 25 : 500;
  const articles = await db()
    .select({
      article: s.articles,
      revision: s.revisions,
      author: s.authors.name,
      category: s.categories.name,
      total: sql<number>`count(*) over()::int`,
    })
    .from(s.articles)
    .innerJoin(
      s.revisions,
      and(
        eq(s.revisions.articleId, s.articles.id),
        eq(
          s.revisions.version,
          actor.permissions.has('distribute') && !actor.permissions.has('write')
            ? s.articles.publishedVersion
            : s.articles.currentVersion,
        ),
      ),
    )
    .innerJoin(s.authors, eq(s.authors.id, s.revisions.authorId))
    .innerJoin(s.categories, eq(s.categories.id, s.revisions.categoryId))
    .where(
      and(
        isNull(s.articles.deletedAt),
        filter?.id ? eq(s.articles.id, filter.id) : undefined,
        filter?.state ? eq(s.articles.state, filter.state) : undefined,
        filter?.query ? ilike(s.revisions.title, `%${filter.query.slice(0, 200)}%`) : undefined,
        actor.permissions.has('edit_all')
          ? undefined
          : actor.permissions.has('distribute')
            ? sql`${s.articles.publishedVersion} is not null`
            : eq(s.articles.createdBy, actor.id),
      ),
    )
    .orderBy(desc(s.articles.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [authors, categories, media, calendar, rankings, polls, awards] = await Promise.all([
    db().select().from(s.authors),
    db().select().from(s.categories),
    db().select().from(s.media).orderBy(desc(s.media.createdAt)).limit(500),
    db()
      .select()
      .from(s.calendar)
      .where(actor.permissions.has('manage') ? undefined : eq(s.calendar.assigneeId, actor.id)),
    db().select().from(s.rankings),
    db().select().from(s.polls),
    db().select().from(s.awards),
  ]);
  const users = actor.permissions.has('users')
    ? await db()
        .select({
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
          role: s.staff.roleId,
          active: s.staff.active,
          canApprove: s.staff.canApprove,
        })
        .from(s.user)
        .innerJoin(s.staff, eq(s.staff.userId, s.user.id))
    : [];
  return {
    pagination: {
      page,
      pageSize,
      total: articles[0]?.total || 0,
      query: filter?.query || '',
      state: filter?.state || '',
    },
    stats: (
      await db()
        .select({
          total: sql<number>`count(*)::int`,
          published: sql<number>`count(*) filter (where ${s.articles.publishedVersion} is not null)::int`,
          drafts: sql<number>`count(*) filter (where ${s.articles.state} = 'draft')::int`,
          review: sql<number>`count(*) filter (where ${s.articles.state} = 'review')::int`,
          scheduled: sql<number>`count(*) filter (where ${s.articles.state} = 'scheduled')::int`,
        })
        .from(s.articles)
        .where(
          and(
            isNull(s.articles.deletedAt),
            actor.permissions.has('edit_all')
              ? undefined
              : actor.permissions.has('distribute')
                ? sql`${s.articles.publishedVersion} is not null`
                : eq(s.articles.createdBy, actor.id),
          ),
        )
    )[0],
    articles,
    authors,
    categories,
    media,
    calendar,
    rankings,
    polls,
    awards,
    users,
    assignees: actor.permissions.has('manage')
      ? await db()
          .select({ id: s.user.id, name: s.user.name })
          .from(s.user)
          .innerJoin(s.staff, eq(s.staff.userId, s.user.id))
          .where(eq(s.staff.active, true))
      : [],
    rankingEntries: await db().select().from(s.rankingEntries),
    criteria: await db().select().from(s.rankingCriteria),
    pollOptions: await db().select().from(s.pollOptions),
    voteResults: await db()
      .select({ optionId: s.votes.optionId, count: sql<number>`count(*)::int` })
      .from(s.votes)
      .groupBy(s.votes.optionId),
    rankingResults: await db()
      .select({ entryId: s.rankingVotes.entryId, count: sql<number>`count(*)::int` })
      .from(s.rankingVotes)
      .groupBy(s.rankingVotes.entryId),
    nominations: await db().select().from(s.nominations),
    activity: actor.permissions.has('review')
      ? await db().select().from(s.audit).orderBy(desc(s.audit.createdAt)).limit(30)
      : [],
    distribution: actor.permissions.has('distribute')
      ? await db().select().from(s.distribution)
      : [],
  };
}
