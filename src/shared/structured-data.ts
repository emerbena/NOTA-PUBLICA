// JSON-LD lives inside a script element: HTML escaping is different from JSON escaping.
export function structuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
