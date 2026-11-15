import Link from 'next/link';
import { publicArticles } from '@/database/queries';
import { db } from '@/database/client';
import { categories } from '@/database/schema';
import { StoryGrid } from '@/components/public';
export const metadata = { title: 'Noticias', alternates: { canonical: '/noticias' } };
export default async function News({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const result = await publicArticles({
    query: p.q,
    category: p.categoria,
    page: Number(p.pagina) || 1,
  });
  const cats = await db().select().from(categories);
  const link = (page: number) =>
    `/noticias?${new URLSearchParams({ q: p.q || '', categoria: p.categoria || '', pagina: String(page) })}`;
  return (
    <main id="contenido" className="container page-section">
      <h1>Noticias</h1>
      <form className="filter-form">
        <label>
          Buscar
          <input name="q" defaultValue={p.q} placeholder="Titular o resumen" />
        </label>
        <label>
          Categoría
          <select name="categoria" defaultValue={p.categoria || ''}>
            <option value="">Todas</option>
            {cats.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-purple">Buscar</button>
      </form>
      <p>{result.total} noticias</p>
      <StoryGrid stories={result.rows} />
      <nav className="pagination" aria-label="Paginación">
        {result.page > 1 && <Link href={link(result.page - 1)}>← Anterior</Link>}
        <span>Página {result.page}</span>
        {result.page * result.limit < result.total && (
          <Link href={link(result.page + 1)}>Siguiente →</Link>
        )}
      </nav>
    </main>
  );
}
