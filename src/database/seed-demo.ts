import type { Database } from './client';
import * as s from './schema';
import { grants } from '../auth/permissions';
import { roleLabels } from '../shared/validation';
import { stories } from '../../dist/modules/data/stories.js';

export async function seedDemo(database: Database) {
  await database.transaction(async (tx) => {
    for (const [id, permissions] of Object.entries(grants)) {
      await tx
        .insert(s.role)
        .values({ id, name: roleLabels[id as keyof typeof roleLabels] })
        .onConflictDoNothing();
      for (const permissionId of permissions) {
        await tx.insert(s.permission).values({ id: permissionId }).onConflictDoNothing();
        await tx
          .insert(s.rolePermission)
          .values({ roleId: id, permissionId })
          .onConflictDoNothing();
      }
    }
    await tx
      .insert(s.user)
      .values({
        id: 'demo-system',
        name: 'Sistema de demostración',
        email: 'demo-system@example.invalid',
      })
      .onConflictDoNothing();
    await tx
      .insert(s.authors)
      .values({
        id: 'demo-columnist',
        slug: 'columnista-demo',
        name: 'Columnista de ejemplo',
        bio: 'Identidad ficticia utilizada exclusivamente en pruebas.',
        specialty: 'Opinión y análisis',
        isDemo: true,
      })
      .onConflictDoNothing();
    await tx
      .insert(s.authors)
      .values({
        id: 'demo-author',
        slug: 'redaccion-demo',
        name: 'Redacción de demostración',
        bio: 'Perfil ficticio para probar el medio. No representa una redacción real.',
        specialty: 'Contenido ilustrativo',
        isDemo: true,
      })
      .onConflictDoNothing();
    const cats = [
      'Actualidad',
      'Nacional',
      'Internacional',
      'Local',
      'Regional',
      'Política',
      'Economía',
      'Cultura',
      'Tecnología',
      'Planeta',
      'Deportes',
      'Opinión',
    ];
    const slugify = (v: string) =>
      v
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
    for (const name of cats)
      await tx
        .insert(s.categories)
        .values({ id: slugify(name), name, slug: slugify(name) })
        .onConflictDoNothing();
    for (const story of stories) {
      const articleId = `demo-${story.id}`,
        revisionId = `demo-${story.id}-1`;
      await tx
        .insert(s.articles)
        .values({
          id: articleId,
          slug: `demo-${story.id}`,
          createdBy: 'demo-system',
          state: 'published',
          currentVersion: 1,
          approvedVersion: 1,
          publishedVersion: 1,
          publishedAt: new Date('2026-11-14T15:00:00Z'),
          isDemo: true,
          featured: story.id === 'ciudad' ? 10 : 0,
        })
        .onConflictDoNothing();
      await tx
        .insert(s.revisions)
        .values({
          id: revisionId,
          articleId,
          version: 1,
          title: story.title,
          kicker: 'Contenido de demostración',
          summary: story.description,
          body: story.body.map((p) => `<p>${p}</p>`).join(''),
          cover: story.image
            ? `https://images.unsplash.com/${story.image}?auto=format&fit=crop&w=1400&q=85`
            : '',
          coverAlt: story.alt || '',
          kind: story.id === 'opinion' ? 'column' : 'news',
          authorId: 'demo-author',
          categoryId: slugify(story.category),
          editorId: 'demo-system',
          changeNote: 'Importación de datos ficticios de la landing',
        })
        .onConflictDoNothing();
    }
    const examples = [
      ['deportes', 'Deportes', 'news', 'Cómo se organiza una cobertura deportiva de ejemplo'],
      ['nacional', 'Nacional', 'news', 'Guía de una cobertura nacional: ejemplo ficticio'],
      ['internacional', 'Internacional', 'news', 'Una mirada internacional: ejemplo de formato'],
      ['local', 'Local', 'news', 'Conversaciones de barrio: material de demostración'],
      ['regional', 'Regional', 'news', 'Agenda regional: plantilla de demostración'],
      ['analisis', 'Opinión', 'analysis', 'Leer los datos con contexto: análisis de muestra'],
      ['entrevista', 'Cultura', 'interview', 'Preguntas para una entrevista: ejercicio editorial'],
      ['video', 'Tecnología', 'video', 'La narración audiovisual: ficha de prueba'],
    ];
    for (const [key, category, kind, title] of examples) {
      const articleId = `demo-${key}`;
      await tx
        .insert(s.articles)
        .values({
          id: articleId,
          slug: articleId,
          createdBy: 'demo-system',
          state: 'published',
          currentVersion: 1,
          approvedVersion: 1,
          publishedVersion: 1,
          publishedAt: new Date('2026-11-13T15:00:00Z'),
          isDemo: true,
        })
        .onConflictDoNothing();
      await tx
        .insert(s.revisions)
        .values({
          id: `${articleId}-1`,
          articleId,
          version: 1,
          title,
          kicker: 'Ejemplo ficticio',
          summary:
            'Material de demostración para probar la plataforma. No describe acontecimientos reales.',
          body: '<p>Este contenido es una muestra para probar la edición, clasificación y publicación. No corresponde a un hecho real.</p><h2>Contexto de la prueba</h2><p>El equipo editorial puede sustituir esta estructura por una nueva noticia verificada y mantener separado el contenido de demostración.</p>',
          kind,
          authorId: kind === 'analysis' ? 'demo-columnist' : 'demo-author',
          categoryId: slugify(category),
          editorId: 'demo-system',
          changeNote: 'Datos de prueba separados del contenido real',
        })
        .onConflictDoNothing();
    }
    await tx
      .insert(s.rankings)
      .values({
        id: 'demo-ranking',
        slug: 'demo-lugares',
        title: 'Lugares para descubrir — demostración',
        description: 'Ejemplo ficticio de clasificación editorial.',
        category: 'Lugares turísticos',
        method: 'editorial',
        published: true,
        isDemo: true,
      })
      .onConflictDoNothing();
    await tx
      .insert(s.rankingEntries)
      .values([
        {
          id: 'demo-place-1',
          rankingId: 'demo-ranking',
          name: 'Lugar de ejemplo A',
          description: 'Participante ficticio',
          position: 1,
        },
        {
          id: 'demo-place-2',
          rankingId: 'demo-ranking',
          name: 'Lugar de ejemplo B',
          description: 'Participante ficticio',
          position: 2,
        },
      ])
      .onConflictDoNothing();
    await tx
      .insert(s.polls)
      .values({
        id: 'demo-poll',
        slug: 'demo-temas',
        question: '¿Qué tema te gustaría explorar? — demostración',
        scope: 'Participación abierta de prueba, sin representatividad estadística.',
        status: 'active',
        startsAt: new Date('2026-01-01'),
        endsAt: new Date('2030-01-01'),
        isDemo: true,
      })
      .onConflictDoNothing();
    await tx
      .insert(s.pollOptions)
      .values([
        { id: 'demo-option-1', pollId: 'demo-poll', label: 'Cultura' },
        { id: 'demo-option-2', pollId: 'demo-poll', label: 'Planeta' },
      ])
      .onConflictDoNothing();
    await tx
      .insert(s.awards)
      .values({
        id: 'demo-award',
        title: 'Premios Nota Pública — estructura demo',
        year: 2026,
        description: 'Edición ficticia para pruebas. No hay convocatoria real abierta.',
        published: true,
        isDemo: true,
      })
      .onConflictDoNothing();
  });
}
