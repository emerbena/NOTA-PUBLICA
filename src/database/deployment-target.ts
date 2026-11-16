import { Pool, type PoolClient, type PoolConfig } from 'pg';
import { DatabaseTargetError } from './development-target';

// IDs públicos de main, contrastados previamente con Neon. No son credenciales.
export const mainIdentity = Object.freeze({
  branchId: 'br-gentle-brook-bb36jzhq',
  endpointId: 'ep-young-boat-bbjg90u1',
});

type Environment = Record<string, string | undefined>;
export type DeploymentTarget = {
  mode: 'preview' | 'production';
  endpointId: string;
  pooled: string;
  direct: string;
};
export type BranchIdentity = { branchId: string; endpointId: string };
type IdentityReader = {
  query: (text: string) => Promise<{ rows: Record<string, unknown>[] }>;
};

export function deploymentTarget(env: Environment = process.env): DeploymentTarget | undefined {
  const mode = env.VERCEL_ENV || env.NP_ENV;
  if (mode !== 'preview' && mode !== 'production') {
    if (env.VERCEL || env.NP_ENV === 'preview' || env.NP_ENV === 'production')
      throw new DatabaseTargetError();
    return undefined;
  }
  try {
    if (
      env.NP_ENV !== mode ||
      (env.VERCEL && env.VERCEL_ENV !== mode) ||
      env.NP_DATABASE_MODE !== 'neon' ||
      (mode === 'preview'
        ? env.CONTENT_MODE !== 'demo'
        : !['demo', 'live'].includes(env.CONTENT_MODE || '')) ||
      env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ||
      env.NP_ALLOW_DEV_MIGRATION === 'yes'
    )
      throw new DatabaseTargetError();
    const pooled = new URL(env.DATABASE_URL || '');
    const direct = new URL(env.DATABASE_URL_UNPOOLED || '');
    for (const url of [pooled, direct]) {
      const permitted = new Set(['sslmode', 'channel_binding', 'uselibpqcompat']);
      if (
        !['postgres:', 'postgresql:'].includes(url.protocol) ||
        !url.hostname.endsWith('.neon.tech') ||
        !url.username ||
        !url.password ||
        url.pathname.length < 2 ||
        url.hash ||
        [...url.searchParams.keys()].some((key) => !permitted.has(key)) ||
        [...permitted].some((key) => url.searchParams.getAll(key).length > 1) ||
        !['require', 'verify-ca', 'verify-full'].includes(url.searchParams.get('sslmode') || '')
      )
        throw new DatabaseTargetError();
      url.searchParams.set('sslmode', 'verify-full');
      url.searchParams.delete('uselibpqcompat');
    }
    const endpointId = direct.hostname.split('.')[0];
    if (
      !/^ep-[a-z0-9-]+$/.test(endpointId) ||
      endpointId.endsWith('-pooler') ||
      pooled.hostname !== direct.hostname.replace(endpointId + '.', endpointId + '-pooler.') ||
      pooled.port !== direct.port ||
      pooled.pathname !== direct.pathname ||
      pooled.username !== direct.username ||
      pooled.password !== direct.password ||
      (mode === 'production'
        ? endpointId !== mainIdentity.endpointId
        : endpointId === mainIdentity.endpointId)
    )
      throw new DatabaseTargetError();
    return { mode, endpointId, pooled: pooled.toString(), direct: direct.toString() };
  } catch {
    throw new DatabaseTargetError();
  }
}

export async function verifyDeploymentIdentity(
  client: IdentityReader,
  target: DeploymentTarget,
  previous?: BranchIdentity,
): Promise<BranchIdentity> {
  try {
    const { rows } = await client.query(
      "select current_setting('neon.branch_id', true) as branch_id, current_setting('neon.endpoint_id', true) as endpoint_id",
    );
    const branchId = rows[0]?.branch_id;
    const endpointId = rows[0]?.endpoint_id;
    if (
      typeof branchId !== 'string' ||
      !/^br-[a-z0-9-]+$/.test(branchId) ||
      endpointId !== target.endpointId ||
      (target.mode === 'production'
        ? branchId !== mainIdentity.branchId
        : branchId === mainIdentity.branchId) ||
      (previous && (previous.branchId !== branchId || previous.endpointId !== endpointId))
    )
      throw new DatabaseTargetError();
    return { branchId, endpointId };
  } catch {
    // Nunca reenviar errores de pg: pueden incluir datos de conexión.
    throw new DatabaseTargetError();
  }
}

type ConnectCallback = Parameters<Pool['connect']>[0];
export class DeploymentPool extends Pool {
  private identity?: BranchIdentity;
  constructor(
    config: PoolConfig,
    private readonly target: DeploymentTarget,
  ) {
    super(config);
  }
  override connect(): Promise<PoolClient>;
  override connect(callback: ConnectCallback): void;
  override connect(callback?: ConnectCallback): Promise<PoolClient> | void {
    const pending = super
      .connect()
      .then(async (client) => {
        try {
          const identity = await verifyDeploymentIdentity(client, this.target);
          // Comparación después del await para cubrir adquisiciones concurrentes.
          if (this.identity && this.identity.branchId !== identity.branchId)
            throw new DatabaseTargetError();
          this.identity = identity;
          return client;
        } catch {
          client.release(true);
          throw new DatabaseTargetError();
        }
      })
      .catch(() => {
        throw new DatabaseTargetError();
      });
    if (callback) {
      void pending.then(
        (client) => callback(undefined, client, client.release),
        () => callback(new DatabaseTargetError(), undefined, () => {}),
      );
      return;
    }
    return pending;
  }
}
