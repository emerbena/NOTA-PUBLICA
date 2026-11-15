import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/database/client';
import { categories } from '@/database/schema';
import { publicArticles } from '@/database/queries';
import { StoryGrid } from '@/components/public';
export default async function Category({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { slug } = await params;
  const [category] = await db().select().from(categories).where(eq(categories.slug, slug));
  if (!category) notFound();
  const result = await publicArticles({
    category: slug,
    page: Number((await searchParams).pagina) || 1,
  });
  return (
    <main id="contenido" className="container page-section">
      <h1>{category.name}</h1>
      <p>{category.description}</p>
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
