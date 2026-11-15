# Resultado de la Fase 2 — Nota Pública

14 de noviembre de 2026, America/Bogota.

## Estado de entrega

Se implementó una primera plataforma editorial operativa **en desarrollo local conectada a Neon development**, con páginas dinámicas, PostgreSQL, autenticación, administración, CMS, revisiones, aprobaciones, programación, rankings, encuestas, premios y multimedia. Las operaciones descritas escriben o consultan PostgreSQL y se probaron con sesiones reales.

**Neon development integrado y verificado.** Rama `br-super-bar-bbfkktrc`, endpoint `ep-billowing-resonance-bbfeuvjq`; el propietario confirmó en Neon que este ID corresponde a `development`. Ambas conexiones devolvieron esos IDs mediante SQL. Se aplicó y repitió la migración inicial de 35 tablas y el seed. Se probaron escrituras editoriales, permisos, sesiones y lecturas públicas en esa rama. Vercel Blob/CDN sigue pendiente de credencial; las imágenes funcionan localmente, independientemente de que SQL esté en Neon.

No hubo commit, push, despliegue, cambios de DNS, modificaciones de credenciales existentes ni operaciones contra datos de producción. La web pública actual conserva su despliegue anterior. La configuración y los archivos nuevos existen únicamente en el árbol de trabajo local.

## 1. Funcionalidades implementadas realmente

| Módulo                         | Comportamiento operativo                                                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Portada                        | Consulta publicaciones de PostgreSQL; conserva logo horizontal, cabecera compacta, favicon, paleta, tipografías, noticia principal, radar, tarjetas, opinión, boletín y footer. Incorpora accesos a las nuevas secciones. La prioridad de portada se ajusta desde la ficha de una noticia. |
| Noticias                       | Listado con imagen, titular, resumen, autor, categoría, fecha y tiempo de lectura calculado; búsqueda por titular/resumen, filtros y paginación de servidor.                                                                                                                               |
| Artículos                      | URL propia, antetítulo, resumen, cuerpo enriquecido, imagen/pie, fuentes, etiquetas, autor, fechas, contenido relacionado y compartir. Solo se lee la revisión publicada.                                                                                                                  |
| Categorías y autores           | Páginas públicas dinámicas, biografía/especialidad/foto cuando existen y listado paginado de artículos. Gestión administrativa persistente.                                                                                                                                                |
| Deportes, opinión y multimedia | Rutas reales con selección de artículos por categoría o tipo editorial. Columnas, editoriales, análisis, entrevistas y videos se distinguen de noticias informativas. Los resultados deportivos se editan como contenido; no hay un proveedor automático de marcadores.                    |
| Identidad                      | Inicio y cierre de sesión con Better Auth, contraseñas derivadas mediante su biblioteca mantenida, sesiones en PostgreSQL, registro público deshabilitado y revocación al modificar una cuenta.                                                                                            |
| Roles                          | Superadministrador, director editorial, editor, periodista y gestor de redes; autorización en servicios y endpoints, además de la interfaz. El editor solo aprueba con habilitación explícita.                                                                                             |
| Dashboard                      | Conteos reales de noticias, publicaciones, borradores, revisión y programación; autores, rankings, encuestas y actividad. Publicadas y borradores pueden solaparse: un artículo puede conservar una versión pública mientras se edita la siguiente.                                        |
| CMS                            | Crear, editar, guardar borrador, asignar autor/categoría, etiquetas, imágenes y fuentes; previsualizar; enviar a revisión, solicitar cambios, rechazar, aprobar, programar, publicar, despublicar, archivar y eliminar con confirmación. Eliminación lógica con historial conservado.      |
| Editor enriquecido             | Tiptap con formato, encabezados, listas, citas, enlaces, imágenes del archivo y videos YouTube. Sanitización de servidor y previsualización en iframe sin permisos para ejecutar scripts.                                                                                                  |
| Versiones y aprobaciones       | Revisión inmutable por guardado. Cada decisión referencia una revisión exacta. Guardar otra versión invalida aprobación/programación. Se controla la versión esperada para evitar sobrescrituras concurrentes.                                                                             |
| Historial                      | Registro del creador, editor, aprobador, fecha, comentario, revisión y publicación. Las revisiones anteriores se pueden consultar; auditoría transaccional en operaciones editoriales.                                                                                                     |
| Calendario                     | Vistas día, semana y mes en America/Bogota; encargos con responsable y noticia asociada; crear, editar y eliminar encargos. Programación persistente en SQL, ejecutada por un trabajador de servidor o endpoint autenticado.                                                               |
| Rankings                       | Crear/editar títulos, categoría, participantes, posiciones, puntuaciones y criterios. Publicar/despublicar. Distinción entre selección editorial, evaluación por criterios y votos abiertos; resultados persistentes.                                                                      |
| Encuestas                      | Pregunta, opciones, alcance, fechas, activar/cerrar y resultados con votos/porcentajes públicos. Identificador de navegador, unicidad en SQL y límites de solicitudes; IP como señal de abuso, no identidad.                                                                               |
| Multimedia                     | Cargas reales locales de PNG/JPEG/WebP, hasta 3 MB, con firma de archivo, título, descripción y alt. Consulta/edición de metadatos y asociación a revisiones. Adaptador Vercel Blob para el entorno remoto.                                                                                |
| Premios                        | Ediciones, categorías de nominación, candidatos, descripción y ganadores; publicación/despublicación. No se implementa todavía una convocatoria, jurado o votación de premios.                                                                                                             |
| Boletín                        | Registro real de correo y consentimiento y enlace privado de baja. No hay proveedor de envío de correos conectado; la interfaz lo comunica.                                                                                                                                                |
| Guardados                      | Persistencia en el navegador; no se presenta como una cuenta de lector ni sincronización entre dispositivos.                                                                                                                                                                               |
| Distribución futura            | Variantes por revisión publicada y plataforma guardadas como borradores. Ningún envío a Telegram, Facebook, Instagram, Threads o X.                                                                                                                                                        |
| IA futura                      | Contratos de investigación, fuentes, deduplicación, redacción, clasificación y titulares, con procedencia y registro de ejecuciones. Sin modelos conectados ni búsquedas automáticas.                                                                                                      |

La portada conserva su composición y activos, pero ya no es idéntica píxel a píxel a la versión estática: tiene enlaces reales, datos de base, fechas, marcas demo y secciones nuevas solicitadas. Los originales de `dist/` no se eliminaron ni reemplazaron. El logo y favicon se copiaron a `public/` sin transformar los binarios.

## 2. Tecnologías incorporadas

| Tecnología                      | Versión instalada | Uso                                                                       |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| Next.js                         | 16.4.6            | App Router, renderizado de servidor, Route Handlers y metadatos           |
| React / React DOM               | 19.3.1            | Componentes y formularios interactivos                                    |
| TypeScript                      | 6.0.3             | Contratos y comprobación estricta                                         |
| Drizzle ORM / Kit               | 0.45.4 / 0.31.11  | Esquema PostgreSQL y migraciones SQL                                      |
| pg                              | 8.23.1            | Conexión remota a PostgreSQL/Neon y transacciones                         |
| PGlite                          | 0.5.16            | PostgreSQL local aislado e integración en memoria, sin servicios globales |
| Better Auth / adaptador Drizzle | 1.7.25            | Autenticación y sesiones mantenidas                                       |
| Zod                             | 4.6.7             | Validación de entradas en servidor                                        |
| Tiptap                          | 3.34.0            | Editor React, StarterKit, imágenes y YouTube                              |
| sanitize-html                   | 2.18.2            | Lista permitida de HTML, atributos, esquemas y hosts de iframe            |
| Vercel Blob SDK                 | 2.4.0             | Adaptador de objetos/CDN; credencial remota pendiente                     |
| tsx / typescript-eslint         | 4.23.15 / 8.72.2  | Scripts TypeScript, pruebas e inspección estática                         |

Se conservaron Node 24, npm/lockfile, ESLint, Prettier y Playwright de Fase 1. `@neondatabase/serverless` permanece para la conexión histórica de `lib/`; el backend nuevo utiliza `pg` con Drizzle para compartir servicios transaccionales entre Neon y PostgreSQL local. No se añadieron microservicios, SDKs de IA o redes sociales ni React Hook Form: para estos formularios bastan estado React y validación Zod de servidor.

El CSS público y los tokens existentes se reutilizan; la administración tiene CSS Modules. Vercel continúa siendo el destino previsto. `vercel.json` ahora declara Next.js y compilación, sin `outputDirectory: dist`. `.vercelignore` prepara la exclusión de la API histórica de raíz para evitar duplicarla con `src/app/api`; la comprobación del artefacto en Vercel Preview sigue pendiente del futuro despliegue autorizado. [Referencia de exclusiones de Vercel](https://vercel.com/docs/deployments/vercel-ignore).

## 3. Base de datos y migración

Esquema: `src/database/schema.ts`. Migración inicial: `drizzle/0000_lazy_kronos.sql`, con journal/snapshot versionables. Se aplicó a PostgreSQL local persistente y a bases aisladas de pruebas. Repetir el migrador no duplica las tablas. `db:generate` comprobó al cierre que no hay diferencias entre esquema y migración.

**35 tablas de aplicación creadas localmente y en Neon development:**

| Dominio                      | Tablas                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Identidad                    | `np_user`, `np_session`, `np_account`, `np_verification`, `np_auth_rate_limit`       |
| Autorización                 | `np_role`, `np_permission`, `np_role_permission`, `np_staff`                         |
| Contenido                    | `np_author`, `np_category`, `np_article`, `np_revision`, `np_tag`, `np_revision_tag` |
| Fuentes y archivos           | `np_source`, `np_revision_source`, `np_media`, `np_revision_media`                   |
| Operación editorial          | `np_review`, `np_audit`, `np_calendar`                                               |
| Rankings                     | `np_ranking`, `np_ranking_entry`, `np_ranking_criterion`, `np_ranking_vote`          |
| Participación                | `np_poll`, `np_poll_option`, `np_vote`                                               |
| Premios                      | `np_award`, `np_nomination`                                                          |
| Preparación de integraciones | `np_distribution`, `np_ai_run`                                                       |
| Operación pública            | `np_rate_limit`, `np_subscriber`                                                     |

Drizzle mantiene además su registro técnico de migraciones. Hay claves primarias/foráneas, unicidad de slugs, números de revisión, posiciones y votos, restricciones de estados/fechas y los índices declarados en el esquema. Las validaciones de pertenencia de opciones, revisiones y archivos se refuerzan en servicios transaccionales.

No se guardan binarios grandes en PostgreSQL. Antes de migrar se verificaron ambas conexiones y se encontraron cero tablas `np_` en development. El migrador usa `DATABASE_URL_UNPOOLED`, verifica rama y endpoint sobre el mismo cliente antes del bloqueo/migración y utiliza el registro de Drizzle para no repetir SQL aplicado. El seed es transaccional e idempotente. No se ejecutan migraciones al arrancar o compilar.

La aplicación sigue usando `DATABASE_URL` pooled. `DevelopmentPool` comprueba los IDs reales de Neon antes de entregar cada conexión para una consulta o transacción; una identidad distinta o ausente bloquea la operación. La transacción conserva esa conexión verificada. Los IDs esperados están en `.env.local`, sin exponer URLs ni contraseñas. La comprobación no depende únicamente de `NP_ENV=development`.

El archivo mantiene `NP_ALLOW_DEV_MIGRATION=no`: el permiso `yes` se habilitó exclusivamente en los procesos autorizados de migración/seed. Se conservaron las conexiones y secretos del usuario. No se conectó a `main` ni se inspeccionaron datos de producción.

## 4. Rutas existentes

| Grupo                      | Rutas                                                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portal                     | `/`, `/noticias`, `/noticias/[slug]`, `/categorias/[slug]`, `/autores/[slug]`                                                                                                                                                     |
| Secciones                  | `/deportes`, `/opinion`, `/multimedia`, `/rankings`, `/rankings/[slug]`, `/opinion-publica`, `/premios`                                                                                                                           |
| Información                | `/acerca`, `/principios`, `/privacidad`, `/boletin/baja`                                                                                                                                                                          |
| SEO                        | `/robots.txt`, `/sitemap.xml`                                                                                                                                                                                                     |
| Acceso                     | `/admin/login`, `/api/auth/[...all]`                                                                                                                                                                                              |
| Panel                      | `/admin`, `/admin/noticias`, `/admin/noticias/crear`, `/admin/noticias/[id]`                                                                                                                                                      |
| Gestión                    | `/admin/categorias`, `/admin/autores`, `/admin/multimedia`, `/admin/calendario`, `/admin/aprobaciones`, `/admin/rankings`, `/admin/encuestas`, `/admin/premios`, `/admin/usuarios`, `/admin/distribucion`, `/admin/configuracion` |
| Mutaciones administrativas | `POST /api/admin/[resource]`: `articles`, `categories`, `authors`, `media`, `calendar`, `rankings`, `polls`, `awards`, `users`, `distribution`                                                                                    |
| Otras operaciones          | `POST /api/media`, `POST /api/votes`, `POST /api/newsletter`, `GET /api/jobs/publish`, `GET /api/db-status`                                                                                                                       |
| Archivos locales           | `GET /api/media/[filename]`, disponible únicamente en desarrollo local                                                                                                                                                            |

El panel utiliza una ruta opcional `[[...path]]` y verifica los permisos por módulo. Las APIs no confían en el rol, actor o estado enviados por el navegador: obtienen sesión y permisos del servidor.

## 5. Acceder al panel y crear el primer administrador

Desde la carpeta `nota-publica`, con el servidor detenido:

```sh
npm run admin:create
npm run dev
```

El primer comando es interactivo: solicita correo, nombre y contraseña oculta de al menos 12 caracteres. No tiene una contraseña predeterminada. Solo permite el primer superadministrador y bloquea la tabla de personal durante la creación para evitar dos inicializaciones concurrentes. Después, usar **http://localhost:3000/admin/login**. El origen debe coincidir con `BETTER_AUTH_URL`.

En este workspace Neon development y sus ejemplos ya están preparados; **no se creó una cuenta personal para el propietario ni se eligió su contraseña**. Las cuentas de navegador viven en bases aisladas; las cuentas temporales de las pruebas Neon se revirtieron mediante rollback. No quedaron accesos de prueba persistentes. El usuario demo del seed no tiene contraseña ni acceso editorial.

Para una instalación limpia:

```sh
npm ci --include=dev
npm run setup:local
npm run db:migrate
npm run db:seed
npm run admin:create
npm run dev
```

No repetir `setup:local` sobre un `.env.local` existente. En PowerShell se puede necesitar `npm.cmd`. El [README](README.md) explica Neon de desarrollo, variables privadas, almacenamiento y comandos. Antes de ejecutar scripts que abren la misma base PGlite persistente, detener el servidor.

## 6. Seguridad y decisiones editoriales

- Validación Zod de servidor; límites de tamaño para JSON y multipart; MIME/firma de imágenes y rechazo de SVG/HTML.
- Sesiones privadas, registro público cerrado, comprobación de roles en servicios, permisos negativos probados y revocación de sesiones al modificar usuarios.
- Origen requerido en mutaciones de aplicación; protección de autenticación del proveedor; secretos fuera del código público.
- Rate limiting persistente para acceso, mutaciones, cargas, votos y boletín. Los límites de aplicación se limpian al ejecutar el publicador.
- Sanitización de HTML y URLs; JSON-LD escapado para impedir cerrar el elemento `script`; CSP con nonce diferente por petición, `strict-dynamic`, bloqueo de objetos/frames no permitidos y cabeceras defensivas. Los estilos en línea siguen permitidos por compatibilidad con el editor. En desarrollo se permite `unsafe-eval`, no en producción. [Guía oficial de CSP en Next.js](https://nextjs.org/docs/app/guides/content-security-policy).
- Transacciones y bloqueo de filas para decisiones/publicación; control de versión esperado, historial inmutable y mantenimiento de la revisión pública anterior durante una edición.
- La IA solo tiene contratos de propuesta, sin credenciales, actor publicador ni capacidad de aprobar. No hay ejecución automática de fuentes o instrucciones externas.
- No se alteran resultados de votación existentes: consultas con votos conservan opciones y rankings con votos conservan participantes/metodología. Cerrar o despublicar mantiene la evidencia.

Los identificadores de navegador pueden eliminarse y una IP puede representar varias personas; la protección de votos es básica y explícita, no una certificación de identidad. Los archivos de Blob se diseñaron como públicos; para material bajo embargo se necesitaría almacenamiento privado y una política adicional.

## 7. Datos de demostración

El seed crea dos perfiles editoriales ficticios, doce categorías y dieciséis artículos demostrativos, incluyendo los ocho contenidos originales y ejemplos de las nuevas secciones. Incluye un ranking editorial con participantes ficticios, una consulta abierta de prueba y una edición de premios de demostración. No crea contraseñas predeterminadas.

`CONTENT_MODE=demo` y `CONTENT_MODE=live` filtran colecciones distintas. Los artículos conservan su marca demo/real y requieren autor del mismo tipo. El modo demo desactiva indexación y entrega un sitemap vacío. La interfaz identifica ejemplos; no se presentan como noticias verificadas. El seed es idempotente y no sobreescribe registros existentes.

## 8. Pruebas ejecutadas

| Comprobación                     | Resultado                                                                   |
| -------------------------------- | --------------------------------------------------------------------------- |
| Sintaxis JS, TypeScript y ESLint | Correctos                                                                   |
| Prettier                         | Correcto                                                                    |
| `npm test`                       | 10/10 pruebas heredadas correctas                                           |
| `npm run test:integration`       | 14/14: integración SQL local y protección de destino/almacenamiento         |
| `npm run test:neon`              | 8/8 en development: siete escenarios y comprobación global con rollback     |
| `npm run build`                  | Compilación Next correcta, rutas dinámicas y proxy CSP                      |
| `npm run test:e2e`               | 6/6 escenarios de plataforma correctos en Edge                              |
| `npm run test:e2e:legacy`        | 4/4 escenarios de la landing conservada correctos                           |
| `npm run env:check`              | Configuración Neon development válida, sin imprimir secretos                |
| Migración y seed                 | Aplicados y repetidos en development; 35 tablas, sin duplicar ejemplos      |
| `npm run db:check:neon`          | Identidad SQL, lectura por ambas conexiones y cotejo de hashes de migración |
| `npm run check:neon:web`         | 16 rutas HTTP 200, API conectada y portada a 1440/390 px usando Neon        |
| `npm run db:generate`            | 35 tablas; sin cambios pendientes de esquema                                |
| `git diff --check`               | Sin errores de espacios; avisos habituales LF/CRLF de Windows               |

**42 pruebas aprobadas**, además de las 16 comprobaciones HTTP sobre Neon y los controles de compilación/calidad. La integración cubre permisos, borrador/aprobación/publicación, rechazo/cambios/archivo, conservación de revisiones, concurrencia, programación idempotente, separación demo/real, CRUD de recursos, votos únicos, sesiones/revocación, sanitización, límites y origen. El navegador crea y publica una noticia, verifica borradores privados, sube/rechaza imágenes, vota y recorre panel y calendario. Las pruebas Neon crean datos temporales dentro de una transacción, usan savepoints para los servicios y verifican su desaparición tras rollback; no dejan contraseñas ni usuarios temporales. Una prueba adicional contra el endpoint autorizado confirma que el pool rechaza un ID esperado diferente, tanto por consulta como por adquisición transaccional; no conecta a otra rama.

Capturas en `.artifacts/phase2-public-1440.png`, `phase2-public-800.png`, `phase2-public-390.png`, `phase2-admin-mobile.png` y `phase2-neon-{1440,390}.png`. Se inspeccionó la portada móvil servida desde Neon y se comprobaron anchos sin desbordamiento. No son certificación WCAG ni medición de Core Web Vitals. No se realizaron Lighthouse, pruebas de carga, restauración de backups ni pentest. Se verificó la identidad de Neon y el esquema, pero no retención, facturación o configuración privada de Vercel.

Durante la ejecución se corrigieron selectores de prueba, etiquetado accesible de los selects, preservación de archivos por revisión, aislamiento de lecturas para el gestor de redes, escape de JSON-LD y límites de carga. Las comprobaciones finales se hicieron después de esas correcciones. La restricción de Windows impedía ejecutar `tsx` y cerrar servidores de navegador de forma fiable; estos comandos se ejecutaron con la autorización de herramienta correspondiente y terminaron correctamente.

## 9. Pendientes y límites de entrega

1. **Entornos de despliegue:** development queda verificado. Preparar Preview y el procedimiento de migración de producción solo cuando se autorice; los scripts actuales bloquean migraciones de producción.
2. **Vercel Blob:** crear/conectar el almacén y configurar su token para probar cargas remotas/CDN. `NP_MEDIA_STORAGE=local` permite trabajar con imágenes en la aplicación local conectada a Neon. El modo local se rechaza en Vercel/producción; allí debe utilizarse `blob`. No se ha simulado una carga remota exitosa.
3. **Programación remota:** configurar un trabajador o cron compatible con el plan. El script `npm run scheduler` ya procesa la agenda en servidor; sin invocaciones, las publicaciones quedan pendientes y se recuperan al reanudar.
4. **Despliegue futuro:** revisar variables, entorno, raíz del proyecto, artefacto Next y API histórica excluida; validar en Preview aislado antes de cualquier producción. No hubo despliegue ni ejecución remota de CI.
5. **Dependencias:** `npm audit --include=dev` confirmó **11 avisos moderados y cero altos/críticos**, en las cadenas Drizzle Kit/esbuild y typescript-eslint/minimatch. El entorno npm omite `dev` por defecto: la primera consulta limitada devolvió cuatro avisos, pero no representaba todas las herramientas. La corrección propuesta incluye regresiones a Drizzle Kit 0.18.1 y typescript-eslint 8.36.0; no se aplicó `audit fix --force`. Debe revisarse/resolverse la exposición antes de publicar. No se cambiaron versiones en esta continuación y no se expone un servidor esbuild por la aplicación. No se afirma ausencia de vulnerabilidades.
6. **Escala/operación:** HTML dinámico por petición para CSP y permisos; no hay aún una estrategia de caché editorial de gran escala. Búsqueda SQL por título/resumen, sin índice especializado. Noticias públicas/administrativas están paginadas; catálogos de recursos y vistas auxiliares requieren ampliación de paginación al crecer. Falta observabilidad externa, recuperación probada y retención de auditorías.
7. **Cuenta del propietario:** crear el primer administrador mediante terminal. No se han enviado invitaciones, restablecimientos por email ni se ha integrado MFA; eso requiere configurar el proveedor operativo correspondiente.
8. **Servicios deliberadamente no conectados:** IA, búsqueda automática y todas las redes sociales. Contratos/modelos preparados; no hay publicación multicanal real todavía. El boletín almacena solicitudes y bajas, pero no envía correos.
9. **Contenido/operación editorial:** completar datos reales, responsables y contacto de privacidad antes del lanzamiento. La estructura de premios no incluye jurados o elecciones públicas. Los archivos multimedia remotos públicos no deben contener material confidencial.

## 10. Archivos y continuidad

Se incorporaron `src/`, `public/`, `drizzle/`, configuración Next/TypeScript/Drizzle, scripts de entorno/migración/seed/administrador/publicador, integración SQL, pruebas de plataforma y `.vercelignore`. Se actualizaron manifiesto/lockfile, calidad, CI, `.env.example`, README y configuración local de despliegue. El README anterior se conservó en `docs/README_FASE_1.md`.

`AUDITORIA_NOTA_PUBLICA.md`, `ARQUITECTURA_NOTA_PUBLICA.md`, `PLAN_MIGRACION.md` y `RESULTADO_FASE_1.md` se mantienen como documentos históricos. Los cambios sin commit de las fases anteriores, la marca y la landing original se conservaron. No se atribuyen esas modificaciones anteriores a la Fase 2.

La primera versión queda operativa y probada en desarrollo con Neon. La salida a producción requiere resolver los pendientes externos y autorización expresa. No se ha comenzado una fase de agentes IA o publicación social. Pasos de despliegue: [DESPLIEGUE_NOTA_PUBLICA.md](DESPLIEGUE_NOTA_PUBLICA.md).

En esta continuación se añadieron protección por identidad SQL, migración directa, contexto transaccional para pruebas, almacenamiento local independiente de SQL, scripts de verificación Neon y pruebas remotas. Se actualizaron documentación, comandos y variables locales de protección; no las credenciales. `vercel.json`, `.openai/hosting.json`, los archivos originales de la landing, logo y favicon se conservaron respecto al inicio de esta continuación. Los cambios anteriores de configuración Vercel permanecen como estaban, sin revertirse ni ampliarse.

El cotejo SHA-256 con `.artifacts/neon-phase2-baseline.json` confirmó esa conservación y el mismo HEAD de Git. No hay archivos versionados eliminados. La búsqueda de los valores privados configurados no los encontró en `public/`, `dist/` o `.next/static`; esta comprobación acotada no sustituye una auditoría forense de secretos. Los servidores temporales de las pruebas se cerraron.
