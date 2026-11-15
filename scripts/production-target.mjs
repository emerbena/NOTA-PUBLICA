export class ProductionTargetError extends Error {
  constructor() {
    super('Destino de producción incompleto o rechazado. Revisa las conexiones y los IDs de main.');
  }
}

// Pure validation: this does not load development variables into the release environment.
export function productionTarget(env, development) {
  try {
    if (env.NP_ENV !== 'production' || env.NEON_BRANCH_NAME !== 'main')
      throw new ProductionTargetError();
    const branchId = env.NP_PRODUCTION_NEON_BRANCH_ID || '';
    const endpointId = env.NP_PRODUCTION_NEON_ENDPOINT_ID || '';
    if (!/^br-[a-z0-9-]+$/.test(branchId) || !/^ep-[a-z0-9-]+$/.test(endpointId))
      throw new ProductionTargetError();
    if (
      !development.branchId ||
      !development.endpointId ||
      branchId === development.branchId ||
      endpointId === development.endpointId
    )
      throw new ProductionTargetError();
    const pooled = new URL(env.DATABASE_URL || '');
    const direct = new URL(env.DATABASE_URL_UNPOOLED || '');
    for (const url of [pooled, direct]) {
      const permittedParameters = new Set(['sslmode', 'channel_binding', 'uselibpqcompat']);
      if ([...url.searchParams.keys()].some((key) => !permittedParameters.has(key)))
        throw new ProductionTargetError();
      if (
        !['postgres:', 'postgresql:'].includes(url.protocol) ||
        !url.hostname.endsWith('.neon.tech') ||
        !url.username ||
        !url.password ||
        url.pathname.length < 2 ||
        url.hash ||
        url.searchParams.has('options') ||
        !['require', 'verify-ca', 'verify-full'].includes(url.searchParams.get('sslmode'))
      )
        throw new ProductionTargetError();
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
      throw new ProductionTargetError();
    return { branchId, endpointId, pooled: pooled.toString(), direct: direct.toString() };
  } catch {
    throw new ProductionTargetError();
  }
}

export async function verifyProductionIdentity(client, target) {
  const { rows } = await client.query(
    "select current_setting('neon.branch_id', true) as branch_id, current_setting('neon.endpoint_id', true) as endpoint_id",
  );
  if (rows[0]?.branch_id !== target.branchId || rows[0]?.endpoint_id !== target.endpointId)
    throw new ProductionTargetError();
}
