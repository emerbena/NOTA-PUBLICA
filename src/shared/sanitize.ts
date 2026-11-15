import sanitizeHtml from 'sanitize-html';
export function cleanContent(input: string) {
  return sanitizeHtml(input, {
    allowedTags: [
      'p',
      'h2',
      'h3',
      'strong',
      'em',
      'u',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'img',
      'figure',
      'figcaption',
      'br',
      'hr',
      'iframe',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      iframe: ['src', 'title', 'allowfullscreen'],
    },
    allowedSchemes: ['https', 'http'],
    allowedIframeHostnames: ['www.youtube-nocookie.com', 'player.vimeo.com'],
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !/^(https?:\/\/|\/api\/media\/)/.test(frame.attribs.src || ''),
  });
}
export function plainText(input: string) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
}
