import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq } from 'drizzle-orm';
import { db, closeDatabase } from '../../src/database/client';
import * as s from '../../src/database/schema';
import {
  actorById,
  grants,
  type Actor,
  HttpError,
  requirePermission,
} from '../../src/auth/permissions';
import { saveArticle, articleAction, publishDue } from '../../src/editorial/articles';
import { saveResource, resourceAction, adminData } from '../../src/editorial/resources';
import { publicStory, publicArticles } from '../../src/database/queries';
import { vote, rankingVote } from '../../src/editorial/voting';
import { cleanContent } from '../../src/shared/sanitize';
import { readJson, assertOrigin, rateLimit } from '../../src/shared/http';
import { auth } from '../../src/auth/auth';
import { structuredData } from '../../src/shared/structured-data';

process.env.NP_DATABASE_MODE = 'local';
process.env.NP_LOCAL_DATABASE = 'memory://';
process.env.CONTENT_MODE = 'demo';
process.env.BETTER_AUTH_SECRET = randomBytes(48).toString('hex');
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
const password = randomBytes(24).toString('hex');
let admin: Actor, journalist: Actor, editor: Actor, social: Actor;
const denied = (status: number) => (e: unknown) => e instanceof HttpError && e.status === status;
const input = (slug: string) => ({
  slug,
  title: 'Artículo de prueba demostrativa',
  summary: 'Resumen de prueba sin hechos reales.',
  body: '<p>Texto de prueba para validar el flujo editorial.</p>',
  authorId: 'author',
  categoryId: 'category',
  isDemo: true,
});

before(async () => {
  await migrate(db(), { migrationsFolder: 'drizzle' });
  await migrate(db(), { migrationsFolder: 'drizzle' }); // reproducible e idempotente
  for (const [id, permissions] of Object.entries(grants)) {
    await db().insert(s.role).values({ id, name: id });
    for (const permissionId of permissions) {
      await db().insert(s.permission).values({ id: permissionId }).onConflictDoNothing();
      await db().insert(s.rolePermission).values({ roleId: id, permissionId });
    }
  }
  await db()
    .insert(s.user)
    .values({ id: 'admin', name: 'Administrador de pruebas', email: 'admin@example.invalid' });
  await db().insert(s.staff).values({ userId: 'admin', roleId: 'superadmin' });
  admin = await actorById('admin');
  for (const role of ['journalist', 'editor', 'social']) {
    const result = await saveResource(admin, 'users', {
      name: role,
      email: `${role}@example.invalid`,
      role,
      password,
    });
    const actor = await actorById(result.id);
    if (role === 'journalist') journalist = actor;
    if (role === 'editor') editor = actor;
    if (role === 'social') social = actor;
  }
  await db()
    .insert(s.authors)
    .values({ id: 'author', name: 'Autor demo', slug: 'autor-demo', isDemo: true });
  await db().insert(s.categories).values({ id: 'category', name: 'Pruebas', slug: 'pruebas' });
});
after(closeDatabase);

test('borrador → revisión → aprobación exacta → publicación, con permisos', async () => {
  const a = await saveArticle(journalist, input('flujo-editorial'));
  assert.equal(await publicStory('flujo-editorial'), null);
  await assert.rejects(articleAction(journalist, a.id, 'publish', 1), denied(403));
  await articleAction(journalist, a.id, 'submit', 1);
  await assert.rejects(
    saveArticle(journalist, { ...input('flujo-editorial'), id: a.id, expectedVersion: 1 }),
    denied(403),
  );
  await assert.rejects(articleAction(editor, a.id, 'approve', 1), denied(403));
  await articleAction(admin, a.id, 'approve', 1, 'Aprobación de prueba');
  await articleAction(admin, a.id, 'publish', 1);
  assert.equal((await publicStory('flujo-editorial'))?.revision.version, 1);
  const edited = await saveArticle(admin, {
    ...input('flujo-editorial'),
    id: a.id,
    expectedVersion: 1,
    title: 'Título privado pendiente de revisión',
  });
  assert.equal(edited.version, 2);
  assert.equal((await publicStory('flujo-editorial'))?.revision.title, input('x').title);
  await assert.rejects(articleAction(admin, a.id, 'publish', 2), denied(409));
  await assert.rejects(
    saveArticle(admin, { ...input('flujo-editorial'), id: a.id, expectedVersion: 1 }),
    denied(409),
  );
  const socialRow = (await adminData(social)).articles.find((v) => v.article.id === a.id);
  assert.equal(socialRow?.revision.version, 1);
  await articleAction(admin, a.id, 'submit', 2);
  await articleAction(admin, a.id, 'approve', 2);
  await articleAction(admin, a.id, 'publish', 2);
  assert.equal((await publicStory('flujo-editorial'))?.revision.version, 2);
  const decisions = await db().select().from(s.reviews).where(eq(s.reviews.articleId, a.id));
  assert.equal(decisions.filter((d) => d.decision === 'approve').length, 2);
  assert.notEqual(
    decisions.find((d) => d.decision === 'approve')?.revisionId,
    decisions.filter((d) => d.decision === 'approve')[1].revisionId,
  );
  await articleAction(admin, a.id, 'unpublish', 2);
  assert.equal(await publicStory('flujo-editorial'), null);
});
test('devolver, rechazar, archivar y eliminar conservan el historial', async () => {
  const a = await saveArticle(journalist, input('historial-editorial'));
  await articleAction(journalist, a.id, 'submit', 1);
  await articleAction(editor, a.id, 'changes', 1, 'Ampliar fuentes');
  await saveArticle(journalist, { ...input('historial-editorial'), id: a.id, expectedVersion: 1 });
  await articleAction(journalist, a.id, 'submit', 2);
  await articleAction(editor, a.id, 'reject', 2, 'No publicable');
  await articleAction(admin, a.id, 'archive', 2);
  await articleAction(admin, a.id, 'delete', 2);
  const [row] = await db().select().from(s.articles).where(eq(s.articles.id, a.id));
  assert.ok(row.deletedAt);
  assert.equal(
    (await db().select().from(s.revisions).where(eq(s.revisions.articleId, a.id))).length,
    2,
  );
});
test('publicación programada persistente e idempotente', async () => {
  const a = await saveArticle(admin, input('agenda-persistente'));
  await articleAction(admin, a.id, 'submit', 1);
  await articleAction(admin, a.id, 'approve', 1);
  await articleAction(admin, a.id, 'schedule', 1, '', new Date(Date.now() + 60000).toISOString());
  assert.equal(await publicStory('agenda-persistente'), null);
  await db()
    .update(s.articles)
    .set({ scheduledAt: new Date(Date.now() - 1000) })
    .where(eq(s.articles.id, a.id));
  assert.equal((await publishDue()).published, 1);
  assert.equal((await publishDue()).published, 0);
  assert.equal((await publicStory('agenda-persistente'))?.revision.version, 1);
});
test('separación estricta entre datos demo y portal real', async () => {
  process.env.CONTENT_MODE = 'live';
  assert.equal((await publicArticles()).total, 0);
  assert.equal(await publicStory('agenda-persistente'), null);
  process.env.CONTENT_MODE = 'demo';
  assert.ok((await publicArticles()).total > 0);
});
test('ediciones concurrentes no sobrescriben una versión guardada', async () => {
  const a = await saveArticle(admin, input('edicion-concurrente'));
  const results = await Promise.allSettled([
    saveArticle(admin, {
      ...input('edicion-concurrente'),
      id: a.id,
      expectedVersion: 1,
      title: 'Cambio número uno',
    }),
    saveArticle(admin, {
      ...input('edicion-concurrente'),
      id: a.id,
      expectedVersion: 1,
      title: 'Cambio número dos',
    }),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter((r) => r.status === 'rejected').length, 1);
});
test('autores, categorías, encargos y premios se guardan y actualizan', async () => {
  const category = await saveResource(admin, 'categories', {
    name: 'Nueva sección',
    slug: 'nueva-seccion',
  });
  await saveResource(admin, 'categories', {
    id: category.id,
    name: 'Sección actualizada',
    slug: 'nueva-seccion',
  });
  const author = await saveResource(admin, 'authors', {
    name: 'Autor de ejemplo',
    slug: 'nuevo-autor',
    isDemo: true,
  });
  await resourceAction(admin, 'authors', author.id, 'deactivate');
  assert.equal(
    (await db().select().from(s.authors).where(eq(s.authors.id, author.id)))[0].active,
    false,
  );
  const task = await saveResource(admin, 'calendar', {
    title: 'Encargo persistente',
    dueAt: new Date(),
    assigneeId: admin.id,
  });
  await saveResource(admin, 'calendar', {
    id: task.id,
    title: 'Encargo actualizado',
    dueAt: new Date(),
    assigneeId: admin.id,
  });
  assert.equal(
    (await db().select().from(s.calendar).where(eq(s.calendar.id, task.id)))[0].title,
    'Encargo actualizado',
  );
  const award = await saveResource(admin, 'awards', {
    title: 'Edición de prueba',
    year: 2026,
    isDemo: true,
    nominations: [{ name: 'Persona ficticia', category: 'Cultura', winner: true }],
  });
  await resourceAction(admin, 'awards', award.id, 'publish');
  assert.equal(
    (await db().select().from(s.nominations).where(eq(s.nominations.awardId, award.id)))[0].winner,
    true,
  );
  await resourceAction(admin, 'awards', award.id, 'unpublish');
  await resourceAction(admin, 'calendar', task.id, 'delete');
});
test('encuestas: fechas, opción perteneciente, voto único y conservación de resultados', async () => {
  const base = {
    slug: 'consulta-prueba',
    question: 'Pregunta demostrativa',
    scope: 'Consulta abierta de pruebas no representativa.',
    status: 'active',
    startsAt: new Date(Date.now() - 10000),
    endsAt: new Date(Date.now() + 100000),
    isDemo: true,
    options: ['Opción A', 'Opción B'],
  };
  const poll = await saveResource(admin, 'polls', base);
  const options = await db().select().from(s.pollOptions).where(eq(s.pollOptions.pollId, poll.id));
  await assert.rejects(vote(poll.id, 'no-existe', 'first'), denied(400));
  await vote(poll.id, options[0].id, 'first');
  await assert.rejects(vote(poll.id, options[1].id, 'first'));
  await assert.rejects(saveResource(admin, 'polls', { ...base, id: poll.id }), denied(409));
  await resourceAction(admin, 'polls', poll.id, 'close');
  await assert.rejects(vote(poll.id, options[0].id, 'second'), denied(409));
});
test('rankings distinguen edición y votos; votos no se sobrescriben', async () => {
  const base = {
    slug: 'ranking-prueba',
    title: 'Ranking de prueba',
    description: 'Ejemplo',
    category: 'Cultura',
    method: 'votes',
    published: true,
    isDemo: true,
    entries: [
      { name: 'Participante A', description: '', position: 1 },
      { name: 'Participante B', description: '', position: 2 },
    ],
  };
  const rank = await saveResource(admin, 'rankings', base);
  const entries = await db()
    .select()
    .from(s.rankingEntries)
    .where(eq(s.rankingEntries.rankingId, rank.id));
  await rankingVote(rank.id, entries[0].id, 'first');
  await assert.rejects(rankingVote(rank.id, entries[1].id, 'first'));
  await assert.rejects(saveResource(admin, 'rankings', { ...base, id: rank.id }), denied(409));
  await resourceAction(admin, 'rankings', rank.id, 'unpublish');
  await assert.rejects(rankingVote(rank.id, entries[1].id, 'second'), denied(409));
});
test('autenticación mantenida: contraseña, sesión, revocación y registro público cerrado', async () => {
  const response = await auth().api.signInEmail({
    body: { email: 'journalist@example.invalid', password },
    asResponse: true,
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.ok(cookie);
  const session = await auth().api.getSession({ headers: new Headers({ cookie }) });
  assert.equal(session?.user.id, journalist.id);
  await saveResource(admin, 'users', {
    id: journalist.id,
    name: 'Periodista',
    email: 'journalist@example.invalid',
    role: 'journalist',
    active: false,
  });
  assert.equal(await auth().api.getSession({ headers: new Headers({ cookie }) }), null);
  await assert.rejects(actorById(journalist.id), denied(403));
  await assert.rejects(
    saveResource(admin, 'users', {
      id: admin.id,
      name: 'Admin',
      email: 'admin@example.invalid',
      role: 'editor',
    }),
    denied(400),
  );
  const signup = await auth().handler(
    new Request('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ name: 'Intruso', email: 'intruso@example.invalid', password }),
    }),
  );
  assert.ok(signup.status >= 400);
});
test('contenido enriquecido elimina scripts, handlers, URLs peligrosas e iframes externos', () => {
  const html = cleanContent(
    '<h2>Título</h2><script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)"><a href="javascript:alert(1)">enlace</a><iframe src="https://evil.invalid/x"></iframe><p onclick="x()">Seguro</p>',
  );
  assert.ok(html.includes('<h2>Título</h2>'));
  assert.ok(html.includes('<p>Seguro</p>'));
  assert.doesNotMatch(html, /script|onerror|onclick|javascript:|evil\.invalid/);
  const headline = '</script><script>alert(1)</script>';
  const encoded = structuredData({ headline });
  assert.doesNotMatch(encoded, /</);
  assert.equal(JSON.parse(encoded).headline, headline);
});
test('límites persistentes, JSON acotado, origen y permiso humano', async () => {
  await rateLimit('test-limit', 1);
  await assert.rejects(rateLimit('test-limit', 1), denied(429));
  await assert.rejects(
    readJson(new Request('http://localhost', { method: 'POST', body: '123456789' }), 5),
    denied(413),
  );
  await assert.rejects(
    readJson(new Request('http://localhost', { method: 'POST', body: '{' })),
    denied(400),
  );
  assert.throws(
    () =>
      assertOrigin(
        new Request('http://localhost', { headers: { origin: 'https://evil.invalid' } }),
      ),
    denied(403),
  );
  assert.throws(
    () => requirePermission({ ...admin, kind: 'ai' } as unknown as Actor, 'approve'),
    denied(403),
  );
});
