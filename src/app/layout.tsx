import type { Metadata } from 'next';
import { headers } from 'next/headers';
import '@/styles/tokens.css';
import '@/styles/editorial.css';
import '@/styles/platform.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://www.notapublica.com'),
  title: { default: 'Nota Pública — La información que importa', template: '%s | Nota Pública' },
  description: 'Periodismo para entender lo que pasa.',
  icons: { icon: '/favicon.png' },
  robots: process.env.CONTENT_MODE === 'demo' ? { index: false, follow: false } : undefined,
};
export default async function Layout({ children }: { children: React.ReactNode }) {
  await headers(); // nonce por petición; evita HTML estático con nonce reutilizado.
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700;750&family=Manrope:wght@400;500;600;650;700;750;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
