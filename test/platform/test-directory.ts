import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function prepareTestDirectory(
  env: Record<string, string | undefined>,
  root = process.cwd(),
) {
  const path = env.NP_LOCAL_DATABASE;
  if (
    env.NP_ENV !== 'test' ||
    env.NP_DATABASE_MODE !== 'local' ||
    env.VERCEL ||
    !path ||
    !/^\.artifacts\/platform-[a-zA-Z0-9-]+$/.test(path)
  )
    throw new Error('Solo se permite preparar una base local aislada de pruebas.');
  mkdirSync(dirname(resolve(root, path)), { recursive: true });
}
