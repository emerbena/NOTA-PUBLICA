import { execFileSync } from 'node:child_process';
import { prepareTestDirectory } from './test-directory';
export default function setup() {
  prepareTestDirectory(process.env);
  for (const file of ['scripts/migrate.ts', 'scripts/seed.ts', 'test/platform/accounts.ts'])
    execFileSync(process.execPath, ['--import', 'tsx', file], { env: process.env, stdio: 'pipe' });
}
