// Configuración privada del servidor. No importar desde dist/.
function configurationError(code, message) {
  return Object.assign(new Error(message), { code });
}

export function databaseUrl(env = process.env, required = true) {
  const value = env.DATABASE_URL?.trim();
  if (!value) {
    if (required)
      throw configurationError('DATABASE_NOT_CONFIGURED', 'DATABASE_URL is not configured');
    return undefined;
  }
  let valid = false;
  try {
    const url = new URL(value);
    valid =
      ['postgres:', 'postgresql:'].includes(url.protocol) &&
      !!url.hostname &&
      url.pathname.length > 1;
  } catch {
    // Nunca incluir el valor o la excepción del parser en errores públicos/logs.
  }
  if (!valid)
    throw configurationError(
      'INVALID_ENVIRONMENT',
      'DATABASE_URL must be a PostgreSQL connection URL',
    );
  return value;
}

export function readEnvironment(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw configurationError(
      'INVALID_ENVIRONMENT',
      'NODE_ENV must be development, test or production',
    );
  }
  const portText = env.PORT || '4173';
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw configurationError('INVALID_ENVIRONMENT', 'PORT must be an integer between 1 and 65535');
  }
  return { nodeEnv, port, databaseUrl: databaseUrl(env, false) };
}
