# Nota Pública

Landing editorial y fundación técnica para su evolución a una plataforma de noticias. Código activo: HTML/CSS/JavaScript modular, Node.js 24, Vercel Functions y Neon. Next.js App Router, TypeScript y Drizzle son el destino documentado; todavía no están instalados.

## Raíz correcta y ejecución

El repositorio es esta carpeta `nota-publica/`, no el paquete `frontnotapublica` del directorio superior. Desde el workspace:

```sh
cd nota-publica
npm ci --include=dev
npm run dev
```

Abrir `http://localhost:4173`. En PowerShell usar `npm.cmd` y `npx.cmd` si la política bloquea los wrappers `.ps1`. Los módulos del navegador requieren HTTP; no abrir `index.html` directamente con `file://`.

La landing funciona sin base de datos. Los archivos dentro de `dist/` son código fuente público mantenido directamente, no una carpeta desechable de build.

## Entorno local

Copiar `.env.example` a `.env.local` únicamente si este último no existe. Configurar una URL de la rama **de desarrollo** de Neon, nunca compartir credenciales de producción. No es necesario hacerlo para las verificaciones automáticas. La carga local no sobrescribe variables del proceso y se omite con `NODE_ENV=test` o dentro de Vercel.

```sh
npm run env:check
```

Valida el formato de la URL cuando está presente y el puerto; no consulta la base. Sin `DATABASE_URL`, la portada funciona y `/api/db-status` devuelve 503. La URL solo se utiliza en servidor. `.env.local` está ignorado y no debe aparecer en commits, capturas ni logs.

Production, Preview y desarrollo deben usar credenciales/ramas separadas. Esta fase no las ha creado ni comprobado en las cuentas externas y no ha cambiado la conexión existente. Vercel conserva sus propias variables: no copiar allí el `NODE_ENV` y `PORT` del ejemplo local.

## Verificaciones reproducibles

```sh
npm run verify
npm run test:e2e
```

| Comando                | Alcance                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `npm run check`        | Sintaxis de todos los JS/MJS del proyecto, excluyendo dependencias y artefactos      |
| `npm run lint`         | ESLint recomendado con ámbitos de servidor/navegador                                 |
| `npm run format:check` | Prettier; excluye HTML/CSS legado y auditoría histórica                              |
| `npm run format`       | Aplica formato a archivos cubiertos; revisar diff después                            |
| `npm test`             | Pruebas unitarias de API, entorno, búsqueda y almacenamiento; sin SQL real           |
| `npm run verify`       | Sintaxis, lint, formato y pruebas unitarias                                          |
| `npm run test:e2e`     | Edge en Windows / Chromium en otros sistemas; servidor propio en 4187, sin secretos  |
| `npm run env:check`    | Configuración local, sin red                                                         |
| `npm run db:check`     | Consulta real `SELECT 1` usando la conexión configurada; NO forma parte de verify/CI |

En Windows se utiliza Microsoft Edge instalado. En Linux/macOS instalar el navegador de pruebas con `npx playwright install chromium`; en Linux CI se utiliza `npx playwright install --with-deps chromium`. No reutilizar el puerto 4187 para otro servidor durante las pruebas.

E2e verifica la marca, cabecera, ausencia de desbordamiento a 1440/800/390 px, filtros, búsquedas, diálogos, guardados tras recarga y boletín demo. Sustituye fotos/fuentes externas por recursos deterministas. Los resultados y capturas quedan en `.artifacts/` y `test-results/`, ignorados por Git. Para comparaciones visuales antes/después en el mismo sistema y navegador, ejecutar e2e con `VISUAL_BASELINE=record` antes del cambio y `VISUAL_BASELINE=compare` después; el modo normal de CI no necesita esos archivos locales. Una nueva línea base solo debe tomarse sobre una versión ya aceptada.

No hay compilación de frontend ni TypeScript todavía. `check` no es un build. Al incorporar Next/TypeScript se añadirán `next build` y `tsc --noEmit` al workflow. GitHub Actions comprueba calidad y e2e sin credenciales; no despliega. Su ejecución remota queda pendiente del futuro push autorizado.

## Código y diseño

- `dist/design/tokens.css`: paleta oficial, Manrope/DM Sans y escalas compartibles.
- `dist/styles.css` e `index.html`: composición existente, cabecera compacta y favicon PNG preservados.
- `dist/app.js`: estado, presentación y eventos; ahora importa módulos nativos.
- `dist/modules/data/`: artículos y textos demo.
- `dist/modules/services/`: guardados en `localStorage` con la clave existente `np-saved`.
- `dist/modules/shared/`: utilidades y configuración pública.
- `lib/`: cliente Neon, validación privada, carga local y respuestas HTTP.
- `api/db-status.js`: única ruta API de Vercel.
- `test/`: pruebas unitarias y de navegador.

No se ha implementado CMS, administración, autenticación ni integraciones. El boletín sigue sin guardar/enviar correos. La base no contiene un modelo editorial definido por este repositorio. Guardados pertenece al navegador; buscador y categorías operan sobre ocho entradas demo, siete listadas como noticias.

## Despliegue y conexión actual

Destino existente: `https://www.notapublica.com/` en Vercel. `vercel.json` mantiene instalación `npm ci`, build vacío, `framework: null`, `outputDirectory: dist` y la función de `api/`. No se cambian DNS, credenciales ni configuración de producción en esta fase. `.openai/hosting.json` es una configuración histórica de Sites que solo sirve estáticos y no ejecuta la API.

`GET /api/db-status` ejecuta `SELECT 1` con timeout y devuelve disponibilidad, sin detalles del driver; otros métodos devuelven 405. Esta operación no prueba tablas, escritura ni backups. El endpoint público mantiene el riesgo de consultas repetidas señalado en la auditoría.

**No hacer commit, push o despliegue sin autorización del propietario.** El logo local y la cabecera difieren todavía de producción; no sobrescribirlos para igualarlos al remoto.

## Documentación

- [Auditoría de Fase 0](AUDITORIA_NOTA_PUBLICA.md): estado histórico, evidencias y límites.
- [Estado inicial de Fase 1](ESTADO_INICIAL_FASE_1.md): divergencias documentadas antes de modificar código.
- [Arquitectura](ARQUITECTURA_NOTA_PUBLICA.md): estructura actual/objetivo, diseño, entornos y decisiones.
- [Plan de migración](PLAN_MIGRACION.md): secuencia, paridad, validación y vuelta atrás.
