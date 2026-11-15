import { readFile } from 'node:fs/promises';
import { mediaStorage } from '@/shared/media-storage';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (mediaStorage() !== 'local') return new Response(null, { status: 404 });
  const { filename } = await params;
  if (!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(filename)) return new Response(null, { status: 404 });
  try {
    return new Response(await readFile(`.local-media/${filename}`), {
      headers: {
        'Content-Type': filename.endsWith('.jpg')
          ? 'image/jpeg'
          : filename.endsWith('.png')
            ? 'image/png'
            : 'image/webp',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
