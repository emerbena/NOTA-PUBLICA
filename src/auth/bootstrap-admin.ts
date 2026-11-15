import { hashPassword } from 'better-auth/crypto';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../database/client';
import * as s from '../database/schema';

export class BootstrapError extends Error {}

export async function checkBootstrap() {
  if (
    (
      await db()
        .select({ id: s.staff.userId })
        .from(s.staff)
        .where(eq(s.staff.roleId, 'superadmin'))
        .limit(1)
    ).length
  )
    throw new BootstrapError('Ya existe un superadministrador. Usa la gestión de usuarios.');
  if (
    !(await db().select({ id: s.role.id }).from(s.role).where(eq(s.role.id, 'superadmin')).limit(1))
      .length
  )
    throw new BootstrapError(
      'Falta el rol superadmin. Revisa la preparación de la base; este comando no ejecuta migraciones.',
    );
}

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  name: z.string().trim().min(2).max(200),
  password: z.string().min(12).max(128),
});

export async function createInitialAdmin(input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    throw new BootstrapError(
      'Usa un correo válido, un nombre de 2 a 200 caracteres y una contraseña de 12 a 128 caracteres.',
    );
  const { email, name, password } = parsed.data;
  // Use the same password format as Better Auth; never log input or SQL errors.
  const passwordHash = await hashPassword(password);
  return db().transaction(async (tx) => {
    // Serializes simultaneous bootstrap commands. All records are committed together.
    await tx.execute(sql`lock table np_staff in exclusive mode`);
    if ((await tx.select().from(s.staff).where(eq(s.staff.roleId, 'superadmin')).limit(1)).length)
      throw new BootstrapError('Ya existe un superadministrador. Usa la gestión de usuarios.');
    if (
      (
        await tx
          .select({ id: s.user.id })
          .from(s.user)
          .where(sql`lower(${s.user.email}) = ${email}`)
          .limit(1)
      ).length
    )
      throw new BootstrapError(
        'Ese correo ya existe. No se modificó su contraseña ni sus permisos.',
      );
    const [user] = await tx.insert(s.user).values({ email, name }).returning({ id: s.user.id });
    await tx.insert(s.account).values({
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: passwordHash,
    });
    await tx.insert(s.staff).values({ userId: user.id, roleId: 'superadmin' });
    await tx
      .insert(s.audit)
      .values({ actorId: user.id, action: 'bootstrap', entity: 'user', entityId: user.id });
    return user.id;
  });
}
