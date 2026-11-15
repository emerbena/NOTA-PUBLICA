import { execFileSync } from 'node:child_process';
export default function setup() {
  for (const file of ['scripts/migrate.ts', 'scripts/seed.ts', 'test/platform/accounts.ts'])
    execFileSync(process.execPath, ['--import', 'tsx', file], { env: process.env, stdio: 'pipe' });
}
