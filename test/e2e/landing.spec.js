import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Recursos remotos deterministas: estas pruebas no dependen de Unsplash/Google.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-14T15:00:00Z'));
  await page.route(
    /https:\/\/(images\.unsplash\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,
    (route) =>
      route.fulfill({
        contentType: route.request().resourceType() === 'image' ? 'image/svg+xml' : 'text/css',
        body:
          route.request().resourceType() === 'image'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900"><rect width="100%" height="100%" fill="#d5cddd"/></svg>'
            : '',
      }),
  );
});

for (const width of [1440, 800, 390]) {
  test(`portada y marca a ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('.story-card')).toHaveCount(3);
    await expect(page.locator('header .brand-image')).toHaveAttribute(
      'src',
      'assets/nota-publica-horizontal.png',
    );
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'favicon.png');
    await expect(page.locator('.masthead')).toHaveCSS(
      'min-height',
      width > 800 ? '84px' : width > 560 ? '76px' : '66px',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.evaluate(() =>
      Promise.all(
        [...document.images].map((img) => {
          img.loading = 'eager';
          return img.decode().catch(() => {});
        }),
      ),
    );
    expect(await page.locator('header .brand-image').evaluate((img) => img.naturalWidth)).toBe(
      2172,
    );
    const shot = await page.screenshot({ fullPage: true, animations: 'disabled' });
    await mkdir('.artifacts', { recursive: true });
    await writeFile(`.artifacts/landing-${width}.png`, shot);
    if (process.env.VISUAL_BASELINE === 'record') {
      await writeFile(`.artifacts/before-${width}.png`, shot);
    } else if (process.env.VISUAL_BASELINE === 'compare') {
      const before = await readFile(`.artifacts/before-${width}.png`);
      const hash = (data) => createHash('sha256').update(data).digest('hex');
      expect(hash(shot), 'La captura debe coincidir con el árbol local previo').toBe(hash(before));
    }
    expect(errors).toEqual([]);
  });
}

test('navegación, búsqueda, lectura, guardados y boletín demo', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.story-card')).toHaveCount(3);
  await page.locator('[data-category="Tecnología"]').click();
  await expect(page.locator('.story-card')).toHaveCount(1);
  await expect(page.locator('.story-card h3')).toContainText('inteligencia');
  await page.locator('#view-all').click();
  await expect(page.locator('.story-card')).toHaveCount(7);
  await page.locator('.search-toggle').click();
  await page.locator('#search').fill('librerias');
  await expect(page.locator('.story-card')).toHaveCount(1);
  await page.locator('#search').fill('zzzzzz');
  await expect(page.locator('#empty-results')).toBeVisible();
  await page.locator('#reset-filters').click();
  await page.locator('[data-story="ciudad"]').first().click();
  await expect(page.locator('dialog')).toBeVisible();
  await expect(page.locator('#dialog-title')).toContainText('ciudad');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  const save = page.locator('[data-save="ciudad"]').first();
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-info="about"]').click();
  await expect(page.locator('#dialog-title')).toHaveText('Una mirada con contexto');
  await page.locator('.dialog-close').click();
  await page.locator('[data-search="cultura"]').click();
  await expect(page.locator('#search')).toHaveValue('cultura');
  await expect(page.locator('.story-card')).toHaveCount(1);
  await page.locator('#email').fill('reader@example.com');
  await page.locator('.consent input').check();
  await page.locator('#newsletter-form button[type="submit"]').click();
  await expect(page.locator('#newsletter-feedback')).toContainText(
    'no se ha creado una suscripción',
  );
  await expect(page.locator('#email')).toHaveValue('');
  expect(errors).toEqual([]);
});
