import { existsSync } from 'node:fs';
if (
  !process.env.VERCEL &&
  !['preview', 'production'].includes(process.env.VERCEL_ENV || '') &&
  process.env.NP_ENV !== 'preview' &&
  existsSync('.env.local')
)
  process.loadEnvFile('.env.local');
