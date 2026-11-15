import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { actorFromHeaders, HttpError } from '@/auth/permissions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administración', robots: { index: false, follow: false } };
export default async function Protected({ children }: { children: React.ReactNode }) {
  try {
    await actorFromHeaders(await headers());
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect('/admin/login');
    if (error instanceof HttpError && error.status === 403)
      return (
        <main className="container page-section">
          <h1>Acceso no autorizado</h1>
          <p>Tu cuenta no tiene un rol editorial activo.</p>
          <a href="/">Volver</a>
        </main>
      );
    throw error;
  }
  return children;
}
