/** Preserve real editorial metadata; label examples even outside the website. */
export function demoPresentation(isDemo: boolean, title: string, description: string) {
  return {
    title: isDemo ? `[Demostración] ${title}` : title,
    description: isDemo
      ? `Contenido ilustrativo; no es una noticia verificada ni un acontecimiento real. ${description}`
      : description,
    schemaType: isDemo ? 'CreativeWork' : 'NewsArticle',
  };
}
