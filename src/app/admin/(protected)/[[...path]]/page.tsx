import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { actorFromHeaders, HttpError } from '@/auth/permissions';
import { adminData } from '@/editorial/resources';
import { db } from '@/database/client';
import * as s from '@/database/schema';
import { Admin } from '@/components/admin';
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ pagina?: string; q?: string; estado?: string }>;
}) {
  const actor = await actorFromHeaders(await headers()).catch((error: unknown) => {
    if (error instanceof HttpError && error.status === 401) redirect('/admin/login');
    if (error instanceof HttpError && error.status === 403) return null;
    throw error;
  });
  if (!actor)
    return (
      <main className="container page-section">
        <h1>Acceso no autorizado</h1>
        <p>Tu cuenta no tiene un rol editorial activo.</p>
      </main>
    );
  const path = (await params).path || [];
  const permissions: Record<string, string> = {
    categorias: 'manage',
    autores: 'manage',
    rankings: 'manage',
    encuestas: 'manage',
    premios: 'manage',
    usuarios: 'users',
    multimedia: 'write',
    aprobaciones: 'review',
    distribucion: 'distribute',
  };
  const needed = path[0] === 'noticias' && path[1] === 'crear' ? 'write' : permissions[path[0]];
  if (needed && !actor.permissions.has(needed))
    return (
      <main className="container page-section">
        <h1>Acceso restringido</h1>
        <p>Tu rol no tiene acceso a este módulo.</p>
        <a href="/admin">Volver al panel</a>
      </main>
    );
  const query = await searchParams;
  const data = await adminData(
    actor,
    path[0] === 'noticias' || path[0] === 'aprobaciones'
      ? {
          id: path[1] && path[1] !== 'crear' ? path[1] : undefined,
          page: Number(query.pagina) || 1,
          query: query.q,
          state: path[0] === 'aprobaciones' ? 'review' : query.estado || undefined,
        }
      : undefined,
  );
  const selected =
    path[0] === 'noticias' && path[1] && path[1] !== 'crear'
      ? data.articles.find((a) => a.article.id === path[1])
      : undefined;
  if (path[0] === 'noticias' && path[1] && path[1] !== 'crear' && !selected) notFound();
  let detail = null;
  if (selected && actor.permissions.has('write')) {
    const r = selected.revision;
    detail = {
      mediaIds: (
        await db()
          .select({ id: s.revisionMedia.mediaId })
          .from(s.revisionMedia)
          .where(eq(s.revisionMedia.revisionId, r.id))
      ).map((m) => m.id),
      tags: (
        await db()
          .select({ name: s.tags.name })
          .from(s.revisionTags)
          .innerJoin(s.tags, eq(s.tags.id, s.revisionTags.tagId))
          .where(eq(s.revisionTags.revisionId, r.id))
      ).map((t) => t.name),
      sources: await db()
        .select({ name: s.sources.name, url: s.sources.url })
        .from(s.revisionSources)
        .innerJoin(s.sources, eq(s.sources.id, s.revisionSources.sourceId))
        .where(eq(s.revisionSources.revisionId, r.id)),
      history: await db()
        .select()
        .from(s.reviews)
        .where(eq(s.reviews.articleId, selected.article.id))
        .orderBy(desc(s.reviews.createdAt)),
      versions: await db()
        .select()
        .from(s.revisions)
        .where(eq(s.revisions.articleId, selected.article.id))
        .orderBy(desc(s.revisions.version)),
    };
  }
  return (
    <Admin
      data={data}
      path={path}
      actor={{
        id: actor.id,
        name: actor.name,
        role: actor.role,
        permissions: [...actor.permissions],
      }}
      detail={detail}
    />
  );
}
