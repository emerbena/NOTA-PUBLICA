import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ignored = new Set([
  'node_modules',
  '.git',
  '.artifacts',
  'test-results',
  'playwright-report',
  '.next',
  '.local-db',
  '.local-media',
]);
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await check(filename);
    else if (/\.(mjs|js)$/.test(filename)) {
      const result = spawnSync(process.execPath, ['--check', filename], { stdio: 'inherit' });
      if (result.status !== 0) throw new Error(`Sintaxis inválida: ${filename}`);
    }
  }
}
await check('.');
console.log('Sintaxis JavaScript verificada; TypeScript y build se comprueban por separado.');
