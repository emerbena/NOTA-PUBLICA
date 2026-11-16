import { uploadBlob, BlobUploadError } from '@/shared/blob-upload';
import { BlobTargetError } from '@/shared/blob-target';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { actorFromHeaders, requirePermission, HttpError } from '@/auth/permissions';
import { assertOrigin, errorResponse, rateLimit, readBytes } from '@/shared/http';
import { db } from '@/database/client';
import { media, audit } from '@/database/schema';
import { mediaStorage } from '@/shared/media-storage';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const actor = await actorFromHeaders(request.headers);
    requirePermission(actor, 'write');
    await rateLimit(`upload:${actor.id}`, 20, 3600);
    const body = await readBytes(request, 4 * 1024 * 1024);
    const form = await new Response(new Uint8Array(body), {
      headers: { 'Content-Type': request.headers.get('content-type') || '' },
    }).formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 3 * 1024 * 1024 || file.size === 0)
      throw new HttpError(400, 'Sube una imagen de hasta 3 MB.');
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? 'png'
      : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
        ? 'jpg'
        : buffer.subarray(0, 4).toString() === 'RIFF' &&
            buffer.subarray(8, 12).toString() === 'WEBP'
          ? 'webp'
          : null;
    if (!ext) throw new HttpError(400, 'Solo PNG, JPEG o WebP válidos. No SVG/HTML.');
    const title = z.string().min(2).max(200).parse(form.get('title'));
    const alt = z.string().min(1).max(300).parse(form.get('alt'));
    const description = z
      .string()
      .max(4000)
      .parse(form.get('description') || '');
    const pathname = `${randomUUID()}.${ext}`;
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    let url: string;
    if (mediaStorage() === 'local') {
      await mkdir('.local-media', { recursive: true });
      await writeFile(`.local-media/${pathname}`, buffer, { flag: 'wx' });
      url = `/api/media/${pathname}`;
    } else {
      const result = await uploadBlob(`editorial/${pathname}`, buffer, mime);
      url = result.url;
    }
    const [row] = await db()
      .insert(media)
      .values({
        url,
        pathname,
        mime,
        size: file.size,
        title,
        alt,
        description,
        createdBy: actor.id,
        isDemo: process.env.CONTENT_MODE === 'demo',
      })
      .returning();
    await db()
      .insert(audit)
      .values({ actorId: actor.id, action: 'media.upload', entity: 'media', entityId: row.id });
    return Response.json(row);
  } catch (error) {
    if (error instanceof BlobTargetError || error instanceof BlobUploadError)
      return Response.json({ error: error.message }, { status: 503 });
    return errorResponse(error);
  }
}
