import { eq, and } from 'drizzle-orm';
import { db } from '@/database/client';
import { staff, rolePermission, user } from '@/database/schema';
import { auth } from './auth';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type Actor = {
  id: string;
  name: string;
  role: string;
  permissions: Set<string>;
  kind: 'human';
};
export async function actorFromHeaders(headers: Headers): Promise<Actor> {
  const session = await auth().api.getSession({ headers });
  if (!session) throw new HttpError(401, 'Inicia sesión.');
  return actorById(session.user.id);
}
export async function actorById(id: string): Promise<Actor> {
  const [row] = await db()
    .select({ staff, name: user.name })
    .from(staff)
    .innerJoin(user, eq(user.id, staff.userId))
    .where(and(eq(staff.userId, id), eq(staff.active, true)));
  if (!row) throw new HttpError(403, 'Cuenta sin acceso editorial activo.');
  const grants = await db()
    .select()
    .from(rolePermission)
    .where(eq(rolePermission.roleId, row.staff.roleId));
  const permissions = new Set(grants.map((g) => g.permissionId));
  if (row.staff.canApprove && row.staff.roleId === 'editor') permissions.add('approve');
  return { id, name: row.name, role: row.staff.roleId, permissions, kind: 'human' };
}
export function requirePermission(actor: Actor, permission: string) {
  if (actor.kind !== 'human' || !actor.permissions.has(permission))
    throw new HttpError(403, 'No tienes permiso para esta operación.');
}
export const grants: Record<string, string[]> = {
  superadmin: [
    'write',
    'edit_all',
    'review',
    'approve',
    'publish',
    'manage',
    'users',
    'distribute',
  ],
  director: ['write', 'edit_all', 'review', 'approve', 'publish', 'manage', 'distribute'],
  editor: ['write', 'edit_all', 'review', 'manage'],
  journalist: ['write'],
  social: ['distribute'],
};
