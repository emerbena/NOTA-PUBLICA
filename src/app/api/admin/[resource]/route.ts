import { z } from 'zod';
import { actorFromHeaders, HttpError } from '@/auth/permissions';
import { articleAction, saveArticle, setFeatured } from '@/editorial/articles';
import { saveResource, resourceAction, schemas, type Resource } from '@/editorial/resources';
import { readJson, assertOrigin, errorResponse, rateLimit } from '@/shared/http';
export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    assertOrigin(request);
    const actor = await actorFromHeaders(request.headers);
    await rateLimit(`admin:${actor.id}`, 120);
    const { resource } = await params;
    const raw = z.record(z.string(), z.unknown()).parse(await readJson(request));
    if (raw.action) {
      const v = z
        .object({
          id: z.string(),
          action: z.string(),
          expectedVersion: z.number().int().optional(),
          comment: z.string().max(2000).default(''),
          scheduledAt: z.string().optional(),
          position: z.number().int().min(0).max(100).optional(),
          confirm: z.string().optional(),
        })
        .parse(raw);
      if (v.action === 'delete' && v.confirm !== v.id)
        throw new HttpError(400, 'Confirma la eliminación.');
      if (resource === 'articles' && v.action === 'featured') {
        await setFeatured(actor, v.id, v.position || 0);
        return Response.json({ ok: true });
      }
      return Response.json(
        resource === 'articles'
          ? await articleAction(
              actor,
              v.id,
              v.action,
              v.expectedVersion || 0,
              v.comment,
              v.scheduledAt,
            )
          : await resourceAction(actor, resource, v.id, v.action),
      );
    }
    if (resource === 'articles') return Response.json(await saveArticle(actor, raw));
    if (!(resource in schemas)) throw new HttpError(404, 'Recurso desconocido.');
    return Response.json(await saveResource(actor, resource as Resource, raw));
  } catch (error) {
    return errorResponse(error);
  }
}
