import { defineConfig } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
process.env.NP_DATABASE_MODE = 'local';
process.env.NP_ENV = 'test';
process.env.NP_LOCAL_DATABASE ||= `.artifacts/platform-${randomUUID()}`;
process.env.NP_TEST_PASSWORD ||= randomBytes(24).toString('hex');
process.env.BETTER_AUTH_SECRET ||= randomBytes(48).toString('hex');
process.env.CRON_SECRET ||= randomBytes(32).toString('hex');
process.env.BETTER_AUTH_URL = 'http://127.0.0.1:4189';
process.env.CONTENT_MODE = 'demo';
export default defineConfig({
  testDir: './test/platform',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  globalSetup: './test/platform/setup.ts',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:4189',
    browserName: 'chromium',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx next start --hostname 127.0.0.1 --port 4189',
    url: 'http://127.0.0.1:4189/admin/login',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
