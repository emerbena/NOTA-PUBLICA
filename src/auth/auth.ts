import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/database/client';
import * as schema from '@/database/schema';
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error('Configura BETTER_AUTH_SECRET (mínimo 32 caracteres).');
  return betterAuth({
    secret,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    database: drizzleAdapter(db(), { provider: 'pg', schema }),
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
    session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 30 },
    rateLimit: {
      enabled: true,
      storage: 'database',
      modelName: 'authRateLimit',
      window: 60,
      max: 30,
    },
    advanced: {
      useSecureCookies:
        process.env.NODE_ENV === 'production' && process.env.NP_DATABASE_MODE !== 'local',
    },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function auth() {
  return (instance ??= createAuth());
}
