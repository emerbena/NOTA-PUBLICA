# Nota Pública

Landing editorial en español, adaptable a escritorio, tablet y móvil. HTML, CSS y JavaScript nativos, sin dependencias de instalación.

## Vista local

Desde esta carpeta:

```sh
node server.mjs
```

Abre http://localhost:4173. También puedes ejecutar `npm.cmd run dev` en PowerShell o `npm run dev` en otros entornos.

## Comprobación

```sh
node --check dist/app.js
node --check server.mjs
```

## Archivos y funciones

- `dist/index.html`: portada, navegación, boletín y modal de lectura.
- `dist/styles.css`: paleta, composición y estilos responsive.
- `dist/app.js`: artículos ilustrativos, filtros, búsqueda, guardados locales y diálogos.
- `.openai/hosting.json`: identidad del sitio y directorio estático de publicación.

Los artículos son contenido de demostración. El boletín valida los campos, pero no envía ni almacena datos; necesita integrarse con un proveedor de correo para crear suscripciones reales. Las fotografías se cargan desde Unsplash y las fuentes desde Google Fonts. Los artículos guardados persisten en el navegador mediante `localStorage`.
