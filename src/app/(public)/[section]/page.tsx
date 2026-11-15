import { notFound } from 'next/navigation';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { db } from '@/database/client';
import { awards, nominations } from '@/database/schema';
import { publicArticles } from '@/database/queries';
import { StoryGrid } from '@/components/public';
const titles: Record<string, string> = {
  deportes: 'Deportes',
  opinion: 'Opinión y análisis',
  multimedia: 'Multimedia',
  premios: 'Premios Nota Pública',
  acerca: 'Quiénes somos',
  principios: 'Principios editoriales',
  privacidad: 'Privacidad',
};
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return {
    title: titles[section] || 'Página no encontrada',
    alternates: { canonical: `/${section}` },
  };
}
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { section } = await params;
  if (!titles[section]) notFound();
  let content: React.ReactNode;
  if (section === 'premios') {
    const editions = await db()
      .select()
      .from(awards)
      .where(
        and(eq(awards.published, true), eq(awards.isDemo, process.env.CONTENT_MODE === 'demo')),
      );
    content = (
      <>
        {await Promise.all(
          editions.map(async (e) => (
            <section className="poll-panel" key={e.id}>
              <h2>
                {e.title} · {e.year}
              </h2>
              <p>{e.description}</p>
              {e.isDemo && <p>Edición de demostración; no es una convocatoria real.</p>}
              <ul>
                {(await db().select().from(nominations).where(eq(nominations.awardId, e.id))).map(
                  (n) => (
                    <li key={n.id}>
                      {n.category}: {n.name} — {n.description}
                      {n.winner ? ' · Ganador' : ''}
                    </li>
                  ),
                )}
              </ul>
            </section>
          )),
        )}
        {!editions.length && (
          <p>Las futuras ediciones, categorías y nominaciones se anunciarán aquí.</p>
        )}
      </>
    );
  } else if (section === 'acerca')
    content = (
      <p>
        Nota Pública es un proyecto editorial dedicado a ofrecer información con contexto. Los
        contenidos identificados como demostración son ejemplos de prueba, no coberturas reales.
      </p>
    );
  else if (section === 'principios')
    content = (
      <p>
        Claridad, atribución de fuentes y separación entre información y opinión. Cada publicación
        pasa por una revisión editorial de su versión concreta.
      </p>
    );
  else if (section === 'privacidad')
    content = (
      <>
        <p>
          Las cuentas editoriales utilizan sesiones privadas. Los guardados se conservan en el
          navegador. Para las consultas abiertas usamos un identificador de navegador y límites de
          solicitudes; no identifican inequívocamente a una persona.
        </p>
        <p>
          El formulario del boletín conserva correo y consentimiento. Tras registrarte puedes
          guardar tu enlace de baja. Todavía no enviamos boletines. Fotos y fuentes externas pueden
          implicar conexiones con sus proveedores.
        </p>
        <p>
          Esta política operativa deberá completarse con la identidad y canales de contacto del
          responsable antes del lanzamiento público.
        </p>
      </>
    );
  else {
    const result = await publicArticles({
      category: section === 'deportes' ? 'deportes' : undefined,
      kinds:
        section === 'multimedia'
          ? ['video', 'interview']
          : section === 'opinion'
            ? ['column', 'editorial', 'analysis', 'interview']
            : undefined,
      page: Number((await searchParams).pagina) || 1,
    });
    content = (
      <>
        <p>
          {section === 'deportes'
            ? 'Competencias, resultados informativos e historias de deportistas.'
            : section === 'opinion'
              ? 'Columnas, editoriales, análisis y entrevistas, claramente diferenciados de la información.'
              : 'Reportajes, entrevistas y coberturas audiovisuales.'}
        </p>
        <StoryGrid stories={result.rows} />
        <nav className="pagination" aria-label="Paginación">
          {result.page > 1 && <Link href={`?pagina=${result.page - 1}`}>Anterior</Link>}
          <span>Página {result.page}</span>
          {result.page * result.limit < result.total && (
            <Link href={`?pagina=${result.page + 1}`}>Siguiente</Link>
          )}
        </nav>
      </>
    );
  }
  return (
    <main id="contenido" className="container page-section">
      <h1>{titles[section]}</h1>
      {content}
    </main>
  );
}
