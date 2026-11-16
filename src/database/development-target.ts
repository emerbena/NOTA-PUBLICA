import { Pool, type PoolClient, type PoolConfig } from 'pg';

export class DatabaseTargetError extends Error {
  readonly code = 'DATABASE_TARGET_REJECTED';
  constructor() {
    super('Destino SQL rechazado: verifica el entorno y la identidad de rama y endpoint.');
  }
}

export function developmentTarget(env: Record<string, string | undefined> = process.env) {
  try {
    if (env.NP_ENV !== 'development' || env.VERCEL || env.NODE_TLS_REJECT_UNAUTHORIZED === '0')
      throw new DatabaseTargetError();
    const branchId = env.NP_EXPECTED_NEON_BRANCH_ID || '';
    const endpointId = env.NP_EXPECTED_NEON_ENDPOINT_ID || '';
    if (!/^br-[a-z0-9-]+$/.test(branchId) || !/^ep-[a-z0-9-]+$/.test(endpointId))
      throw new DatabaseTargetError();
    const pooled = new URL(env.DATABASE_URL || '');
    const direct = new URL(env.DATABASE_URL_UNPOOLED || '');
    for (const url of [pooled, direct]) {
      if (
        !['postgres:', 'postgresql:'].includes(url.protocol) ||
        !url.hostname.endsWith('.neon.tech') ||
        !['require', 'verify-ca', 'verify-full'].includes(url.searchParams.get('sslmode') || '') ||
        url.searchParams.has('options') ||
        !url.username ||
        !url.password ||
        url.pathname.length < 2
      )
        throw new DatabaseTargetError();
      // Verificación de certificado y hostname, independientemente de cambios futuros en pg.
      url.searchParams.set('sslmode', 'verify-full');
      url.searchParams.delete('uselibpqcompat');
    }
    if (
      pooled.hostname.split('.')[0] !== `${endpointId}-pooler` ||
      direct.hostname.split('.')[0] !== endpointId ||
      pooled.hostname.replace('-pooler.', '.') !== direct.hostname ||
      pooled.port !== direct.port ||
      pooled.pathname !== direct.pathname ||
      pooled.username !== direct.username ||
      pooled.password !== direct.password
    )
      throw new DatabaseTargetError();
    return { branchId, endpointId, pooled: pooled.toString(), direct: direct.toString() };
  } catch {
    throw new DatabaseTargetError();
  }
}

type IdentityReader = {
  query: (text: string) => Promise<{ rows: Record<string, unknown>[] }>;
};
export async function verifyDevelopmentTarget(
  client: IdentityReader,
  target: Pick<ReturnType<typeof developmentTarget>, 'branchId' | 'endpointId'>,
) {
  const { rows } = await client.query(
    "select current_setting('neon.branch_id', true) as branch_id, current_setting('neon.endpoint_id', true) as endpoint_id",
  );
  if (rows[0]?.branch_id !== target.branchId || rows[0]?.endpoint_id !== target.endpointId)
    throw new DatabaseTargetError();
}

type ConnectCallback = Parameters<Pool['connect']>[0];
/** Cada consulta del pool y cada transacción adquiere una conexión verificada. */
export class DevelopmentPool extends Pool {
  constructor(
    config: PoolConfig,
    private readonly target: ReturnType<typeof developmentTarget>,
  ) {
    super(config);
  }
  override connect(): Promise<PoolClient>;
  override connect(callback: ConnectCallback): void;
  override connect(callback?: ConnectCallback): Promise<PoolClient> | void {
    const pending = super.connect().then(async (client) => {
      try {
        await verifyDevelopmentTarget(client, this.target);
        return client;
      } catch {
        client.release(true);
        throw new DatabaseTargetError();
      }
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
