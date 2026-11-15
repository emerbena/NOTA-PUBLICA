import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/database/client';
import { authors } from '@/database/schema';
import { publicArticles } from '@/database/queries';
import { StoryGrid } from '@/components/public';
export default async function Author({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { slug } = await params;
  const [author] = await db()
    .select()
    .from(authors)
    .where(and(eq(authors.slug, slug), eq(authors.isDemo, process.env.CONTENT_MODE === 'demo')));
  if (!author) notFound();
  const result = await publicArticles({
    author: slug,
    page: Number((await searchParams).pagina) || 1,
  });
  return (
    <main id="contenido" className="container page-section">
      {author.photo && <img className="author-photo" src={author.photo} alt={author.name} />}
      <h1>{author.name}</h1>
      <p>{author.specialty}</p>
      <p>{author.bio}</p>
      {author.isDemo && <p className="demo-notice">Perfil de demostración</p>}
      <StoryGrid stories={result.rows} />
      <nav className="pagination">
        {result.page > 1 && <Link href={`?pagina=${result.page - 1}`}>Anterior</Link>}
        {result.page * result.limit < result.total && (
          <Link href={`?pagina=${result.page + 1}`}>Siguiente</Link>
        )}
      </nav>
    </main>
  );
}
