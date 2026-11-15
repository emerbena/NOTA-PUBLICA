import '../scripts/runtime-env';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db, closeDatabase, withDatabase } from '../src/database/client';
import { developmentTarget } from '../src/database/development-target';
import { BootstrapError, checkBootstrap, createInitialAdmin } from '../src/auth/bootstrap-admin';
import { auth } from '../src/auth/auth';
import { actorById } from '../src/auth/permissions';
import * as s from '../src/database/schema';

test(
  'Bootstrap real en development, sin migraciones y con rollback',
  {
    skip: process.env.NP_ALLOW_DEV_CHECK !== 'yes',
    timeout: 60000,
  },
  async (t) => {
    assert.equal(process.env.NP_DATABASE_MODE, 'neon');
    assert.equal(process.env.NP_ALLOW_DEV_MIGRATION, 'no');
    const target = developmentTarget();
    const email = `bootstrap-${randomUUID()}@example.invalid`;
    const password = randomBytes(24).toString('hex');
    const rollback = new Error('ROLLBACK_BOOTSTRAP_TEST');
    let userId = '';
    try {
      // Never remove or alter a real administrator just to run a test.
      await checkBootstrap();
      await assert.rejects(
        db().transaction((tx) =>
          withDatabase(tx, async () => {
            const identity = await tx.execute(
              sql`select current_setting('neon.branch_id', true) as branch_id`,
            );
            assert.equal(identity.rows[0].branch_id, target.branchId);
            await t.test('rechaza entradas inválidas sin guardar datos', async () => {
              await assert.rejects(
                createInitialAdmin({ email, name: 'Prueba', password: 'short' }),
                BootstrapError,
              );
              assert.equal(
                (await tx.select().from(s.user).where(eq(s.user.email, email))).length,
                0,
              );
            });
            await tx
              .insert(s.user)
              .values({ email: `existing-${email}`, name: 'Temporal sin acceso' });
            await t.test('rechaza correo existente sin elevar permisos', async () => {
              await assert.rejects(
                createInitialAdmin({
                  email: ` EXISTING-${email.toUpperCase()} `,
                  name: 'Prueba',
                  password,
                }),
                BootstrapError,
              );
              assert.equal(
                (await tx.select().from(s.staff).where(eq(s.staff.roleId, 'superadmin'))).length,
                0,
              );
            });
            await t.test('crea credencial con hash, rol y auditoría', async () => {
              userId = await createInitialAdmin({
                email: ` ${email.toUpperCase()} `,
                name: 'Administrador temporal',
                password,
              });
              const [account] = await tx
                .select()
                .from(s.account)
                .where(eq(s.account.userId, userId));
              assert.ok(account.password && account.password !== password);
              assert.equal(account.providerId, 'credential');
              assert.equal((await actorById(userId)).role, 'superadmin');
              assert.ok((await actorById(userId)).permissions.has('users'));
              assert.equal(
                (await tx.select().from(s.audit).where(eq(s.audit.entityId, userId))).length,
                1,
              );
            });
            await t.test('Better Auth inicia sesión con la cuenta creada', async () => {
              const response = await auth().api.signInEmail({
                body: { email, password },
                asResponse: true,
              });
              assert.equal(response.status, 200);
              const cookie = response.headers.get('set-cookie');
              assert.ok(cookie);
              assert.equal(
                (await auth().api.getSession({ headers: new Headers({ cookie }) }))?.user.id,
                userId,
              );
            });
            await t.test('impide crear un segundo superadministrador', async () => {
              await assert.rejects(
                createInitialAdmin({ email: `second-${email}`, name: 'Otra cuenta', password }),
                BootstrapError,
              );
              assert.equal(
                (await tx.select().from(s.staff).where(eq(s.staff.roleId, 'superadmin'))).length,
                1,
              );
            });
            throw rollback;
          }),
        ),
        (error) => error === rollback,
      );
      assert.equal((await db().select().from(s.user).where(eq(s.user.email, email))).length, 0);
      assert.equal(
        (
          await db()
            .select()
            .from(s.user)
            .where(eq(s.user.email, `existing-${email}`))
        ).length,
        0,
      );
      assert.equal(
        (await db().select().from(s.account).where(eq(s.account.userId, userId))).length,
        0,
      );
      assert.equal(
        (await db().select().from(s.session).where(eq(s.session.userId, userId))).length,
        0,
      );
      console.log('Verificación terminada. Cuenta temporal, sesión y auditoría revertidas.');
    } finally {
      await closeDatabase();
    }
  },
);
