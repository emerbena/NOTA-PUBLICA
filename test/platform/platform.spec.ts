import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
async function login(page: Page, role = 'superadmin') {
  await page.goto('/admin/login');
  await page.getByLabel('Correo').fill(`${role}@example.invalid`);
  await page.getByLabel('Contraseña').fill(process.env.NP_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}
const origin = 'http://127.0.0.1:4189';
test('portal dinámico, rutas, SEO, búsqueda y responsive', async ({ page, request }) => {
  for (const path of [
    '/',
    '/noticias',
    '/categorias/cultura',
    '/autores/redaccion-demo',
    '/noticias/demo-ciudad',
    '/rankings',
    '/rankings/demo-lugares',
    '/opinion-publica',
    '/deportes',
    '/opinion',
    '/multimedia',
    '/premios',
    '/acerca',
    '/privacidad',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  }
  await page.goto('/noticias/demo-ciudad');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/noticias\/demo-ciudad$/,
  );
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain(
    'NewsArticle',
  );
  await page.goto('/noticias?q=no-hay-esta-noticia');
  await expect(page.getByText('Todavía no hay publicaciones en esta sección.')).toBeVisible();
  for (const width of [1440, 800, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('.masthead .brand img')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `.artifacts/phase2-public-${width}.png`, fullPage: true });
  }
  expect((await request.get('/noticias/inexistente')).status()).toBe(404);
  expect((await request.get('/api/jobs/publish')).status()).toBe(401);
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
});
test('CMS real: crear, revisar, aprobar, publicar y editar sin filtrar el borrador', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('link', { name: 'Crear noticia', exact: true }).click();
  await page.getByLabel('Titular', { exact: true }).fill('Artículo de demostración E2E');
  await page.getByLabel('URL corta').fill('prueba-e2e-noticia');
  await page
    .getByLabel('Subtítulo / resumen')
    .fill('Contenido ficticio creado por una prueba automatizada.');
  await page.getByLabel('Autor', { exact: true }).selectOption('demo-author');
  await page.getByLabel('Categoría', { exact: true }).selectOption('actualidad');
  await page
    .getByRole('textbox', { name: 'Cuerpo del artículo', exact: true })
    .fill('Texto de demostración del flujo editorial. No informa un acontecimiento real.');
  await page.getByRole('button', { name: 'Previsualizar', exact: true }).click();
  await expect(page.getByTitle('Vista previa del borrador sin scripts')).toBeVisible();
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/noticias\/[0-9a-f-]+$/);
  const editorUrl = page.url();
  expect((await page.request.get('/noticias/prueba-e2e-noticia')).status()).toBe(404);
  for (const [label, state] of [
    ['Enviar a revisión', 'En revisión'],
    ['Aprobar esta versión', 'Aprobado'],
    ['Publicar', 'Publicado'],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByText(`Estado: ${state}`, { exact: true })).toBeVisible();
  }
  await page.goto('/noticias/prueba-e2e-noticia');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Artículo de demostración E2E',
  );
  await page.goto(editorUrl);
  await page.getByLabel('Titular', { exact: true }).fill('Título privado todavía sin aprobar');
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await expect(page.getByText('Flujo editorial · versión 2')).toBeVisible();
  const publicResponse = await page.request.get('/noticias/prueba-e2e-noticia');
  const publicText = await publicResponse.text();
  expect(publicText).not.toContain('Título privado todavía sin aprobar');
  expect(publicText).toContain('Artículo de demostración E2E');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
test('permisos de servidor, CSRF, sesión y subida de imagen', async ({ page, request }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(
    (
      await request.post('/api/admin/categories', {
        headers: { origin },
        data: { name: 'Intruso', slug: 'intruso' },
      })
    ).status(),
  ).toBe(401);
  await login(page, 'journalist');
  expect(
    (
      await page.request.post('/api/admin/categories', {
        headers: { origin },
        data: { name: 'Prohibido', slug: 'prohibido' },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post('/api/admin/articles', {
        headers: { origin: 'https://otro.invalid' },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const upload = await page.request.post('/api/media', {
    headers: { origin },
    multipart: {
      file: {
        name: 'favicon.png',
        mimeType: 'image/png',
        buffer: readFileSync('public/favicon.png'),
      },
      title: 'Imagen de prueba',
      alt: 'Icono de demostración',
    },
  });
  expect(upload.status()).toBe(200);
  const media = await upload.json();
  expect((await request.get(media.url)).headers()['content-type']).toContain('image/png');
  const denied = await page.request.post('/api/media', {
    headers: { origin },
    multipart: {
      file: {
        name: 'bad.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from('<svg onload="alert(1)"></svg>'),
      },
      title: 'Archivo no permitido',
      alt: 'no',
    },
  });
  expect(denied.status()).toBe(400);
});
test('votación persistente, resultados y rechazo de duplicados', async ({ page }) => {
  await page.goto('/opinion-publica');
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Votar', exact: true }).click();
  await expect(page.getByText('Tu voto quedó registrado.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Votar', exact: true }).click();
  await expect(page.getByText('El registro ya existe o ya participaste.')).toBeVisible();
});
test('panel responsive, vistas calendario y módulos administrativos', async ({ page }) => {
  await login(page);
  for (const path of [
    'categorias',
    'autores',
    'multimedia',
    'calendario',
    'aprobaciones',
    'rankings',
    'encuestas',
    'premios',
    'usuarios',
    'configuracion',
    'distribucion',
  ]) {
    expect((await page.goto(`/admin/${path}`))?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  }
  await page.goto('/admin/calendario');
  for (const mode of ['day', 'week', 'month'])
    await page.getByLabel('Vista del calendario').selectOption(mode);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.artifacts/phase2-admin-mobile.png', fullPage: true });
});
test('CSP por petición, boletín con baja y publicador autenticado', async ({ page, request }) => {
  const first = await request.get('/');
  const second = await request.get('/');
  expect(first.headers()['content-security-policy']).toContain("'strict-dynamic'");
  expect(first.headers()['content-security-policy']).not.toEqual(
    second.headers()['content-security-policy'],
  );
  const result = await request.post('/api/newsletter', {
    headers: { origin },
    data: { email: 'lectura@example.invalid', consent: true },
  });
  expect(result.status()).toBe(200);
  const body = await result.json();
  expect(body.unsubscribe).toContain('/boletin/baja?token=');
  await page.goto(body.unsubscribe);
  await page.getByRole('button', { name: 'Confirmar baja del boletín' }).click();
  await expect(page.getByText('La solicitud de baja fue procesada.')).toBeVisible();
  const job = await request.get('/api/jobs/publish', {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  expect(job.status()).toBe(200);
  expect(await job.json()).toEqual({ published: 0 });
});
