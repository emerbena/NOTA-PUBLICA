import type { MetadataRoute } from 'next';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${process.env.SITE_URL || 'https://www.notapublica.com'}/sitemap.xml`,
  };
}
