import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { demoPresentation } from '../../src/shared/demo';
import robots from '../../src/app/robots';
import { prepareTestDirectory } from '../platform/test-directory';

test('demo metadata is explicit and never NewsArticle; real news stays unchanged', () => {
  const demo = demoPresentation(true, 'Titular', 'Resumen');
  assert.match(demo.title, /Demostración/);
  assert.match(demo.description, /no es una noticia verificada/);
  assert.equal(demo.schemaType, 'CreativeWork');
  assert.deepEqual(demoPresentation(false, 'Titular', 'Resumen'), {
    title: 'Titular',
    description: 'Resumen',
    schemaType: 'NewsArticle',
  });
});
test('robots permits public crawling to discover noindex', () => {
  const rules = robots().rules;
  assert.deepEqual(rules, { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] });
});
test('clean CI checkout creates missing parent without opening a database', () => {
  const root = mkdtempSync(join(tmpdir(), 'np-e2e-directory-'));
  try {
    const env = {
      NP_ENV: 'test',
      NP_DATABASE_MODE: 'local',
      NP_LOCAL_DATABASE: '.artifacts/platform-regression',
    };
    assert.equal(existsSync(join(root, '.artifacts')), false);
    prepareTestDirectory(env, root);
    assert.equal(existsSync(join(root, '.artifacts')), true);
    assert.equal(existsSync(join(root, env.NP_LOCAL_DATABASE)), false);
    assert.throws(() => prepareTestDirectory({ ...env, NP_DATABASE_MODE: 'neon' }, root));
    assert.throws(() => prepareTestDirectory({ ...env, NP_LOCAL_DATABASE: '../outside' }, root));
    assert.throws(() => prepareTestDirectory({ ...env, VERCEL: '1' }, root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
