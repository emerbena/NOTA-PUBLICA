import './runtime-env';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { developmentTarget } from '../src/database/development-target';

// Solo peticiones GET al servidor local; no crea cuentas, votos ni artículos.
const target = developmentTarget();
assert.equal(process.env.NP_DATABASE_MODE, 'neon');
const origin = 'http://127.0.0.1:4191';
try {
  await fetch(`${origin}/api/db-status`, { signal: AbortSignal.timeout(1000) });
  throw new Error('PORT_IN_USE');
} catch (error) {
  if (error instanceof Error && error.message === 'PORT_IN_USE') throw error;
}
const server = spawn(
  process.execPath,
  [
    resolve('node_modules/next/dist/bin/next'),
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    '4191',
  ],
  {
    env: { ...process.env, NODE_ENV: 'production', BETTER_AUTH_URL: origin, SITE_URL: origin },
    stdio: 'ignore',
    windowsHide: true,
  },
);
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error('SERVER_STOPPED');
    try {
      ready = (await fetch(`${origin}/admin/login`, { signal: AbortSignal.timeout(1500) })).ok;
    } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'El servidor local debe iniciar');
  for (const path of [
    '/api/db-status',
    '/',
    '/noticias',
    '/noticias/demo-ciudad',
    '/categorias/cultura',
    '/autores/redaccion-demo',
    '/rankings',
    '/rankings/demo-lugares',
    '/opinion-publica',
    '/premios',
    '/deportes',
    '/opinion',
    '/multimedia',
    '/sitemap.xml',
    '/robots.txt',
    '/admin/login',
  ]) {
    const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, path);
    if (path === '/api/db-status')
      assert.deepEqual(await response.json(), { ok: true, database: 'connected' });
    console.log(`GET ${path}: 200`);
  }
  await mkdir('.artifacts', { recursive: true });
  browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
  const page = await browser.newPage();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin);
    await page.locator('.masthead .brand img').waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: `.artifacts/phase2-neon-${width}.png`, fullPage: true });
  }
  console.log(`Web local verificada con Neon ${target.branchId}. Sin escrituras editoriales.`);
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    const closed = once(server, 'exit');
    server.kill();
    await closed;
  }
}
