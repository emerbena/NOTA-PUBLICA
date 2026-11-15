import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.env.local'))
  throw new Error('.env.local ya existe. No se sobrescribió; configura el entorno manualmente.');
mkdirSync('.local-db', { recursive: true });
writeFileSync(
  '.env.local',
  `NP_DATABASE_MODE=local\nNP_ENV=development\nNP_LOCAL_DATABASE=.local-db/main\nCONTENT_MODE=demo\nBETTER_AUTH_URL=http://localhost:3000\nBETTER_AUTH_SECRET=${randomBytes(48).toString('hex')}\nCRON_SECRET=${randomBytes(32).toString('hex')}\n`,
  { mode: 0o600 },
);
console.log(
  'Entorno local creado sin credenciales predeterminadas. Ejecuta npm run db:migrate y npm run db:seed.',
);
