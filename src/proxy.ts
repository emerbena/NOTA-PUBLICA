import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

export function proxy(request: NextRequest) {
  const nonce = randomBytes(18).toString('base64');
  const dev = process.env.NODE_ENV !== 'production';
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https: data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
    "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  const headers = new Headers(request.headers);
  headers.set('x-np-nonce', nonce);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}
export const config = {
  matcher: ['/((?!api(?:/|$)|_next/static|_next/image|assets/|favicon|robots.txt|sitemap.xml).*)'],
};
