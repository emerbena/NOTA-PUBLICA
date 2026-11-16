import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blobTarget, BlobTargetError } from '../../src/shared/blob-target';
import { createBlobUploader, BlobUploadError } from '../../src/shared/blob-upload';

// Identificadores y tokens exclusivamente ficticios; ningún caso accede a servicios remotos.
function environment(mode = 'preview'): Record<string, string | undefined> {
  const id = mode === 'preview' ? 'PreviewFixture' : 'ProductionFixture';
  return {
    VERCEL: '1',
    VERCEL_ENV: mode,
    NP_ENV: mode,
    NP_MEDIA_STORAGE: 'blob',
    BLOB_STORE_ID: `store_${id}`,
    [mode === 'preview' ? 'NP_PREVIEW_BLOB_STORE_ID' : 'NP_PRODUCTION_BLOB_STORE_ID']:
      `store_${id}`,
    BLOB_READ_WRITE_TOKEN: `vercel_blob_rw_${id}_fakeCredential`,
  };
}

test('Blob acepta únicamente la identidad esperada de cada entorno y normaliza store_', () => {
  for (const mode of ['preview', 'production']) {
    const env = environment(mode);
    const target = blobTarget(env);
    assert.equal(target.mode, mode);
    assert.equal(target.storeId, env.BLOB_STORE_ID!.slice(6));
    assert.deepEqual(blobTarget({ ...env, BLOB_STORE_ID: target.storeId }), target);
    assert.equal('token' in target, false);
  }
});

test('Preview rechaza el almacén Production y Production rechaza el de Preview', async () => {
  let writes = 0;
  const upload = createBlobUploader(async () => {
    writes++;
    return { url: 'https://unused.invalid' };
  });
  for (const mode of ['preview', 'production']) {
    const env = environment(mode);
    const other = environment(mode === 'preview' ? 'production' : 'preview');
    // Incluso si el token y BLOB_STORE_ID están cruzados juntos, la política independiente manda.
    env.BLOB_STORE_ID = other.BLOB_STORE_ID;
    env.BLOB_READ_WRITE_TOKEN = other.BLOB_READ_WRITE_TOKEN;
    await assert.rejects(
      upload('image.png', Buffer.from('fixture'), 'image/png', env),
      BlobTargetError,
    );
  }
  assert.equal(writes, 0);
});

test('IDs ausentes, vacíos, inválidos o variables de política del otro entorno bloquean Blob', () => {
  for (const changes of [
    { BLOB_STORE_ID: undefined },
    { BLOB_STORE_ID: ' ' },
    { BLOB_STORE_ID: 'https://example.invalid' },
    { NP_PREVIEW_BLOB_STORE_ID: undefined },
    { NP_PREVIEW_BLOB_STORE_ID: 'store_' },
    { NP_PRODUCTION_BLOB_STORE_ID: 'store_ProductionFixture' },
    { NP_PRODUCTION_BLOB_STORE_ID: 'store_PreviewFixture' },
  ])
    assert.throws(() => blobTarget({ ...environment(), ...changes }), BlobTargetError);
});

test('no permite camuflar Preview como Production ni elegir almacenamiento local en Vercel', () => {
  for (const changes of [
    { NP_ENV: 'production' },
    { NP_ENV: 'development' },
    { NP_ENV: undefined },
    { VERCEL_ENV: undefined },
    { VERCEL_ENV: 'production' },
    { NP_MEDIA_STORAGE: 'local' },
  ])
    assert.throws(() => blobTarget({ ...environment(), ...changes }), BlobTargetError);
  assert.throws(() => blobTarget({}), BlobTargetError);
});

test('rechaza un token fallback cruzado incluso con OIDC disponible, antes de invocar el SDK', async () => {
  let writes = 0;
  const upload = createBlobUploader(async () => {
    writes++;
    return { url: 'https://unused.invalid' };
  });
  for (const mode of ['preview', 'production']) {
    const env = environment(mode);
    env.VERCEL_OIDC_TOKEN = 'fake-oidc';
    env.BLOB_READ_WRITE_TOKEN = environment(
      mode === 'preview' ? 'production' : 'preview',
    ).BLOB_READ_WRITE_TOKEN;
    await assert.rejects(
      upload('image.png', Buffer.from('fixture'), 'image/png', env),
      BlobTargetError,
    );
  }
  assert.equal(writes, 0);
});

test('OIDC sin token estático conserva el destino validado y no recibe credenciales explícitas', async () => {
  let writes = 0;
  const upload = createBlobUploader(async (pathname, body, options) => {
    writes++;
    assert.equal(pathname, 'editorial/image.png');
    assert.equal(body.toString(), 'fixture');
    assert.deepEqual(options, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
      storeId: 'PreviewFixture',
    });
    assert.equal('token' in options, false);
    assert.equal('oidcToken' in options, false);
    return { url: 'https://example.invalid/image.png' };
  });
  const env = environment();
  delete env.BLOB_READ_WRITE_TOKEN;
  // El token OIDC puede llegar mediante el contexto de petición del SDK, no solo process.env.
  const result = await upload('editorial/image.png', Buffer.from('fixture'), 'image/png', env);
  assert.equal(result.url, 'https://example.invalid/image.png');
  assert.equal(writes, 1);
});

test('fallback estático válido se mantiene en el SDK sin forzar su prioridad frente a OIDC', async () => {
  const upload = createBlobUploader(async (_pathname, _body, options) => {
    assert.equal(options.storeId, 'ProductionFixture');
    assert.equal('token' in options, false);
    return { url: 'https://example.invalid/image.png' };
  });
  await upload('image.png', Buffer.from('fixture'), 'image/png', environment('production'));
});

test('errores de configuración no exponen tokens, IDs introducidos ni causas', () => {
  const sensitive = 'private-value-must-not-appear';
  for (const changes of [
    { BLOB_READ_WRITE_TOKEN: sensitive },
    { BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_PreviewFixture_fake value' },
    { BLOB_STORE_ID: sensitive },
  ])
    assert.throws(
      () => blobTarget({ ...environment(), ...changes }),
      (error: unknown) => {
        assert.ok(error instanceof BlobTargetError);
        assert.ok(!error.message.includes(sensitive));
        assert.equal(error.cause, undefined);
        return true;
      },
    );
});

test('errores del SDK se sustituyen sin imprimirlos ni conservar credenciales en la causa', async (t) => {
  const logs: unknown[] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => logs.push(args));
  t.mock.method(console, 'log', (...args: unknown[]) => logs.push(args));
  const upload = createBlobUploader(async () => {
    throw new Error('fake-sensitive-sdk-token');
  });
  await assert.rejects(
    upload('image.png', Buffer.from('fixture'), 'image/png', environment()),
    (error: unknown) => {
      assert.ok(error instanceof BlobUploadError);
      assert.ok(!error.message.includes('fake-sensitive'));
      assert.equal(error.cause, undefined);
      return true;
    },
  );
  assert.deepEqual(logs, []);
});
