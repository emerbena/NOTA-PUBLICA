import { defineConfig } from 'drizzle-kit';
// Generación offline. Las migraciones se aplican mediante scripts/migrate.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './drizzle',
});
