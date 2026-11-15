import '../../scripts/runtime-env';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db, closeDatabase, withDatabase } from '../../src/database/client';
import {
  developmentTarget,
  DevelopmentPool,
  DatabaseTargetError,
} from '../../src/database/development-target';
import * as s from '../../src/database/schema';
import { actorById, HttpError } from '../../src/auth/permissions';
import { auth } from '../../src/auth/auth';
import { saveArticle, articleAction, publishDue } from '../../src/editorial/articles';
import { saveResource, resourceAction, adminData } from '../../src/editorial/resources';
import { publicStory } from '../../src/database/queries';
import { vote, rankingVote } from '../../src/editorial/voting';

test(
  'Neon development: módulos integrados con rollback de todos los datos de prueba',
  {
    skip: process.env.NP_ALLOW_DEV_CHECK !== 'yes',
    timeout: 180000,
  },
  async (t) => {
    assert.equal(process.env.NP_DATABASE_MODE, 'neon');
    assert.equal(process.env.CONTENT_MODE, 'demo');
    const target = developmentTarget();
    const prefix = `check-${randomUUID()}`;
    const rollback = new Error('ROLLBACK_VERIFICATION_FIXTURES');
    const password = randomBytes(24).toString('hex');
    try {
      await t.test(
        'pool rechaza una identidad distinta antes de consultas y transacciones',
        async () => {
          // Conexión real al endpoint autorizado; solo cambia la identidad esperada del test.
          // No se abre una conexión a main ni se intenta una escritura.
          const rejectedPool = new DevelopmentPool(
            { connectionString: target.pooled, connectionTimeoutMillis: 10000 },
            { ...target, branchId: 'br-not-authorized-by-this-test' },
          );
          try {
            await assert.rejects(rejectedPool.query('select 1'), DatabaseTargetError);
            await assert.rejects(rejectedPool.connect(), DatabaseTargetError);
          } finally {
            await rejectedPool.end();
          }
        },
      );
      await assert.rejects(
        db().transaction(async (tx) =>
          withDatabase(tx, async () => {
            const identity = await tx.execute(
              sql`select current_setting('neon.branch_id', true) as branch_id`,
            );
            assert.equal(identity.rows[0].branch_id, target.branchId);
            await db()
              .insert(s.user)
              .values({ id: prefix, name: 'Prueba temporal', email: `${prefix}@example.invalid` });
            await db().insert(s.staff).values({ userId: prefix, roleId: 'superadmin' });
            const admin = await actorById(prefix);
            const category = await saveResource(admin, 'categories', {
              name: 'Sección de prueba',
              slug: prefix,
            });
            const author = await saveResource(admin, 'authors', {
              name: 'Autor ficticio temporal',
              slug: prefix,
              isDemo: true,
            });
            const journalistAccount = await saveResource(admin, 'users', {
              name: 'Periodista temporal',
              email: `journalist-${prefix}@example.invalid`,
              role: 'journalist',
              password,
            });
            const journalist = await actorById(journalistAccount.id);
            const input = {
              slug: prefix,
              title: 'Artículo ficticio de integración Neon',
              summary: 'Prueba técnica temporal; no describe acontecimientos reales.',
              body: '<p>Texto de demostración con contenido editorial para probar la base.</p>',
              authorId: author.id,
              categoryId: category.id,
              isDemo: true,
              tags: ['verificación'],
              sources: [{ name: 'Referencia de prueba', url: 'https://example.invalid/source' }],
            };
            let articleId = '';
            await t.test('CMS, permisos, revisiones, publicación y borrador privado', async () => {
              const created = await saveArticle(journalist, input);
              articleId = created.id;
              assert.equal(await publicStory(prefix), null);
              await assert.rejects(
                articleAction(journalist, articleId, 'publish', 1),
                (e: unknown) => e instanceof HttpError && e.status === 403,
              );
              await articleAction(journalist, articleId, 'submit', 1);
              await articleAction(admin, articleId, 'approve', 1);
              await articleAction(admin, articleId, 'publish', 1);
              assert.equal((await publicStory(prefix))?.revision.title, input.title);
              await saveArticle(admin, {
                ...input,
                id: articleId,
                expectedVersion: 1,
                title: 'Borrador privado sin aprobación',
              });
              assert.equal((await publicStory(prefix))?.revision.title, input.title);
              await assert.rejects(articleAction(admin, articleId, 'publish', 2));
            });
            await t.test(
              'multimedia: metadatos y asociación persistente a una revisión',
              async () => {
                const [file] = await db()
                  .insert(s.media)
                  .values({
                    url: '/api/media/00000000-0000-0000-0000-000000000000.png',
                    pathname: 'temporary.png',
                    mime: 'image/png',
                    size: 100,
                    title: 'Imagen temporal',
                    alt: 'Descripción de prueba',
                    createdBy: admin.id,
                    isDemo: true,
                  })
                  .returning();
                await saveResource(admin, 'media', {
                  id: file.id,
                  title: 'Título actualizado',
                  alt: 'Texto alternativo actualizado',
                });
                await saveArticle(admin, {
                  ...input,
                  id: articleId,
                  expectedVersion: 2,
                  mediaIds: [file.id],
                });
                assert.equal(
                  (
                    await db()
                      .select()
                      .from(s.revisionMedia)
                      .where(eq(s.revisionMedia.mediaId, file.id))
                  ).length,
                  1,
                );
              },
            );
            await t.test(
              'calendario, aprobación exacta y publicación programada recuperable',
              async () => {
                await articleAction(admin, articleId, 'submit', 3);
                await articleAction(admin, articleId, 'approve', 3);
                await articleAction(
                  admin,
                  articleId,
                  'schedule',
                  3,
                  '',
                  new Date(Date.now() + 600000).toISOString(),
                );
                await saveResource(admin, 'calendar', {
                  title: 'Encargo de prueba',
                  dueAt: new Date(),
                  articleId,
                  assigneeId: journalist.id,
                });
                await db()
                  .update(s.articles)
                  .set({ scheduledAt: new Date(Date.now() - 1000) })
                  .where(eq(s.articles.id, articleId));
                assert.ok((await publishDue()).published >= 1);
                assert.equal((await publicStory(prefix))?.revision.version, 3);
                assert.equal((await publishDue()).published, 0);
              },
            );
            await t.test(
              'encuestas y rankings: votos únicos y resultados conservados',
              async () => {
                const poll = await saveResource(admin, 'polls', {
                  slug: prefix,
                  question: 'Pregunta ficticia temporal',
                  scope: 'Consulta de prueba no representativa.',
                  status: 'active',
                  startsAt: new Date(Date.now() - 1000),
                  endsAt: new Date(Date.now() + 600000),
                  isDemo: true,
                  options: ['Opción uno', 'Opción dos'],
                });
                const options = await db()
                  .select()
                  .from(s.pollOptions)
                  .where(eq(s.pollOptions.pollId, poll.id));
                await vote(poll.id, options[0].id, prefix);
                await assert.rejects(vote(poll.id, options[1].id, prefix));
                await resourceAction(admin, 'polls', poll.id, 'close');
                assert.equal(
                  (await db().select().from(s.votes).where(eq(s.votes.pollId, poll.id))).length,
                  1,
                );
                const ranking = await saveResource(admin, 'rankings', {
                  slug: prefix,
                  title: 'Ranking temporal',
                  category: 'Cultura',
                  method: 'votes',
                  published: true,
                  isDemo: true,
                  entries: [
                    { name: 'Persona ficticia A', position: 1 },
                    { name: 'Persona ficticia B', position: 2 },
                  ],
                });
                const entries = await db()
                  .select()
                  .from(s.rankingEntries)
                  .where(eq(s.rankingEntries.rankingId, ranking.id));
                await rankingVote(ranking.id, entries[0].id, prefix);
                await assert.rejects(rankingVote(ranking.id, entries[1].id, prefix));
                await resourceAction(admin, 'rankings', ranking.id, 'unpublish');
              },
            );
            await t.test(
              'premios, distribución en borrador y dashboard con datos SQL',
              async () => {
                const award = await saveResource(admin, 'awards', {
                  title: 'Premios de demostración temporal',
                  year: 2026,
                  isDemo: true,
                  nominations: [
                    { name: 'Candidatura ficticia', category: 'Cultura', winner: true },
                  ],
                });
                await resourceAction(admin, 'awards', award.id, 'publish');
                assert.equal(
                  (
                    await db()
                      .select()
                      .from(s.nominations)
                      .where(eq(s.nominations.awardId, award.id))
                  )[0].winner,
                  true,
                );
                const story = await publicStory(prefix);
                assert.ok(story);
                const variant = await saveResource(admin, 'distribution', {
                  articleId,
                  revisionId: story.revision.id,
                  platform: 'telegram',
                  text: 'Solo un borrador de prueba. No enviar.',
                });
                assert.equal(
                  (
                    await db()
                      .select()
                      .from(s.distribution)
                      .where(eq(s.distribution.id, variant.id))
                  )[0].state,
                  'draft',
                );
                const dashboard = await adminData(admin);
                assert.ok(dashboard.stats.published >= 1);
                assert.ok(dashboard.articles.some((a) => a.article.id === articleId));
              },
            );
            await t.test('autenticación y revocación real de sesión en Neon', async () => {
              const response = await auth().api.signInEmail({
                body: { email: `journalist-${prefix}@example.invalid`, password },
                asResponse: true,
              });
              assert.equal(response.status, 200);
              const cookie = response.headers.get('set-cookie');
              assert.ok(cookie);
              const headers = new Headers({ cookie });
              assert.equal((await auth().api.getSession({ headers }))?.user.id, journalist.id);
              await saveResource(admin, 'users', {
                id: journalist.id,
                name: 'Periodista temporal',
                email: `journalist-${prefix}@example.invalid`,
                role: 'journalist',
                active: false,
              });
              assert.equal(await auth().api.getSession({ headers }), null);
            });
            throw rollback;
          }),
        ),
        (error: unknown) => error === rollback,
      );
      assert.equal((await db().select().from(s.user).where(eq(s.user.id, prefix))).length, 0);
      assert.equal(await publicStory(prefix), null);
      console.log(`Rama ${target.branchId}: pruebas terminadas y datos temporales revertidos.`);
    } finally {
      await closeDatabase();
    }
  },
);
