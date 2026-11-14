# Nota Pública

Landing editorial en español, adaptable a escritorio, tablet y móvil. Frontend en HTML, CSS y JavaScript, con una función de servidor para conectar PostgreSQL en Neon. Requiere Node.js 24.

## Vista local

Desde esta carpeta:

```sh
npm ci
node server.mjs
```

Abre http://localhost:4173. También puedes ejecutar `npm.cmd run dev` en PowerShell o `npm run dev` en otros entornos.

## Comprobación

```sh
npm run check
npm test
```

Las pruebas comprueban respuestas del servidor y protección de credenciales; no se conectan a una base real.

## Conectar Neon en Vercel

1. Abre el proyecto `nota-publica` en Vercel y entra en Storage. Crea una base Neon y conéctala al proyecto. También puedes instalar Neon desde el Marketplace de Vercel.
2. Configura la conexión para Production. Comprueba que exista la variable privada `DATABASE_URL`. La integración de Neon puede añadirla automáticamente. Si configuraste un prefijo distinto, utiliza el nombre exacto `DATABASE_URL` para este código.
3. Despliega nuevamente el proyecto después de conectar la base. `vercel.json` mantiene los archivos estáticos en `dist` y Vercel detecta la función de `api/`.
4. Visita `https://www.notapublica.com/api/db-status`. Una consulta real `SELECT 1` debe devolver `{"ok":true,"database":"connected"}`.

La comprobación es de solo lectura y devuelve únicamente disponibilidad. `database_not_configured` significa que falta la variable; `database_unavailable` indica que la conexión falló. Los errores responden con HTTP 503 y no publican detalles del driver. No se crean tablas ni endpoints de escritura en esta primera conexión; los esquemas se definirán al implementar cada función futura.

La base y su variable deben existir para completar la conexión; instalar el controlador por sí solo no crea una base en Neon. El frontend sigue mostrando contenido de demostración.

## Conexión local

Copia `.env.example` a `.env.local` y coloca allí la cadena de conexión obtenida del panel de Neon, en `DATABASE_URL`. El servidor carga ese archivo al arrancar. No compartas la cadena en capturas ni la subas a GitHub. Los archivos `.env` están excluidos del repositorio.

```sh
npm run db:check
npm run dev
```

La misma comprobación está disponible en `http://localhost:4173/api/db-status`. Utiliza una rama de desarrollo de Neon para las pruebas locales y de Preview.

Las futuras funciones de servidor pueden importar `getDatabase` desde `lib/database.js` y usar consultas parametrizadas. Mantén ese módulo fuera de `dist/`; el navegador nunca debe recibir `DATABASE_URL`. Antes de añadir escrituras, implementa autenticación, autorización y validación según la función concreta.

## Archivos y funciones

- `dist/index.html`: portada, navegación, boletín y modal de lectura.
- `dist/styles.css`: paleta, composición y estilos responsive.
- `dist/app.js`: artículos ilustrativos, filtros, búsqueda, guardados locales y diálogos.
- `.openai/hosting.json`: identidad del sitio y directorio estático de publicación.
- `api/db-status.js`: función de Vercel para comprobar la conexión.
- `lib/database.js`: cliente de Neon, exclusivo del servidor.
- `vercel.json`: configuración del despliegue de Vercel.

El alojamiento estático de Sites definido en `.openai/hosting.json` no ejecuta esta API. La conexión a Neon corresponde al despliegue en Vercel.

Los artículos son contenido de demostración. El boletín valida los campos, pero no envía ni almacena datos; necesita integrarse con un proveedor de correo para crear suscripciones reales. Las fotografías se cargan desde Unsplash y las fuentes desde Google Fonts. Los artículos guardados persisten en el navegador mediante `localStorage`.
