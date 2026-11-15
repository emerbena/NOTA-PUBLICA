import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { Database } from '../../src/database/client';
import { seedDemo } from '../../src/database/seed-demo';
import * as schema from '../../src/database/schema';

test('instalación demo: esquema completo, datos identificados, sin credenciales y seed idempotente', async () => {
  const client = new PGlite();
  try {
    const database = drizzle(client, { schema });
    await migrate(database, { migrationsFolder: 'drizzle' });
    await seedDemo(database as unknown as Database);
    const articles = await database.select().from(schema.articles);
    assert.equal(articles.length, 16);
    assert.ok(articles.every((article) => article.isDemo));
    assert.equal((await database.select().from(schema.staff)).length, 0);
    assert.equal((await database.select().from(schema.account)).length, 0);
    assert.equal((await database.select().from(schema.role)).length, 5);
    const first = {
      articles: articles.length,
      revisions: (await database.select().from(schema.revisions)).length,
      categories: (await database.select().from(schema.categories)).length,
      permissions: (await database.select().from(schema.rolePermission)).length,
    };
    await seedDemo(database as unknown as Database);
    assert.deepEqual(
      {
        articles: (await database.select().from(schema.articles)).length,
        revisions: (await database.select().from(schema.revisions)).length,
        categories: (await database.select().from(schema.categories)).length,
        permissions: (await database.select().from(schema.rolePermission)).length,
      },
      first,
    );
  } finally {
    await client.close();
  }
});
