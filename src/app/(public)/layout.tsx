import { Header, Footer } from '@/components/public';
export const dynamic = 'force-dynamic';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
