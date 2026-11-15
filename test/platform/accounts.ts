import { db, closeDatabase } from '../../src/database/client';
import * as s from '../../src/database/schema';
import { hashPassword } from 'better-auth/crypto';
if (
  process.env.NP_ENV !== 'test' ||
  !process.env.NP_LOCAL_DATABASE?.startsWith('.artifacts/platform-') ||
  !process.env.NP_TEST_PASSWORD
)
  throw Error('Solo base aislada de pruebas');
for (const role of ['superadmin', 'journalist', 'social']) {
  const password = await hashPassword(process.env.NP_TEST_PASSWORD);
  await db()
    .insert(s.user)
    .values({ id: `test-${role}`, name: `Prueba ${role}`, email: `${role}@example.invalid` });
  await db()
    .insert(s.account)
    .values({
      userId: `test-${role}`,
      accountId: `test-${role}`,
      providerId: 'credential',
      password,
    });
  await db()
    .insert(s.staff)
    .values({ userId: `test-${role}`, roleId: role });
}
await closeDatabase();
