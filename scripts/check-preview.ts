import { Client } from 'pg';
import { blobTarget } from '../src/shared/blob-target';
import {
  deploymentTarget,
  verifyDeploymentIdentity,
  type BranchIdentity,
} from '../src/database/deployment-target';

// No carga archivos .env ni importa migradores, semillas o scripts de producción.
// Vercel proporciona las variables efectivas antes de ejecutar npm run build.
try {
  const target = deploymentTarget();
  if (target) {
    blobTarget();
    let identity: BranchIdentity | undefined;
    for (const connectionString of [target.pooled, target.direct]) {
      const client = new Client({
        connectionString,
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });
      try {
        await client.connect();
        await client.query('BEGIN READ ONLY');
        identity = await verifyDeploymentIdentity(client, target, identity);
        await client.query('ROLLBACK');
      } finally {
        await client.end();
      }
    }
    console.log(
      `${target.mode}: identidad SQL verificada (${identity!.branchId} / ${identity!.endpointId}). Solo lectura.`,
    );
  } else {
    console.log('Entorno local o CI: no se abre conexión de despliegue.');
  }
} catch {
  console.error(
    'Despliegue bloqueado: verifica entorno, identidad Blob, conexiones Neon y TLS. Production solo admite main; Preview debe usar una rama distinta. No se muestran secretos.',
  );
  process.exitCode = 1;
}
