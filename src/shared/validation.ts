import { z } from 'zod';
export const slug = z
  .string()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const url = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//.test(v), 'Usa una URL HTTP(S)');
export const assetUrl = z.union([
  url,
  z.string().regex(/^\/api\/media\/[a-zA-Z0-9.-]+$/),
  z.literal(''),
]);
export const articleInput = z
  .object({
    id: z.string().optional(),
    expectedVersion: z.number().int().positive().optional(),
    slug,
    title: z.string().min(5).max(240),
    kicker: z.string().max(120).default(''),
    summary: z.string().min(10).max(600),
    body: z.string().min(10).max(200000),
    cover: assetUrl.default(''),
    coverAlt: z.string().max(300).default(''),
    caption: z.string().max(500).default(''),
    kind: z.enum(['news', 'column', 'editorial', 'analysis', 'interview', 'video']).default('news'),
    authorId: z.string().min(1),
    categoryId: z.string().min(1),
    isDemo: z.boolean().default(false),
    featured: z.number().int().min(0).max(100).default(0),
    tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    sources: z
      .array(z.object({ name: z.string().min(1).max(200), url }))
      .max(30)
      .default([]),
    mediaIds: z.array(z.string()).max(50).default([]),
    changeNote: z.string().max(1000).default(''),
  })
  .refine((v) => !v.cover || v.coverAlt.trim().length > 0, {
    message: 'La imagen requiere texto alternativo',
    path: ['coverAlt'],
  });
export const roles = ['superadmin', 'director', 'editor', 'journalist', 'social'] as const;
export const roleLabels = {
  superadmin: 'Superadministrador',
  director: 'Director editorial',
  editor: 'Editor',
  journalist: 'Periodista',
  social: 'Gestor de redes',
};
export const states: Record<string, string> = {
  draft: 'Borrador',
  review: 'En revisión',
  changes: 'Requiere cambios',
  approved: 'Aprobado',
  scheduled: 'Programado',
  published: 'Publicado',
  rejected: 'Rechazado',
  archived: 'Archivado',
};
export type ArticleInput = z.infer<typeof articleInput>;
