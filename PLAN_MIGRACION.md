# Plan de migración gradual

## Punto de partida y reglas

Referencia visual: árbol local con logo horizontal, favicon PNG y cabecera compacta. Las diferencias con GitHub y producción están documentadas en [ESTADO_INICIAL_FASE_1.md](ESTADO_INICIAL_FASE_1.md). No se sustituye ese estado por el remoto anterior. La Fase 1 no hace commit, push, despliegue ni cambios de credenciales.

Se conserva el dominio `www.notapublica.com`, Vercel y Neon. No se promete cambiar framework sin adaptar código: se conservan diseño y comportamiento, y se reemplaza progresivamente el mecanismo de renderizado. Cada siguiente fase requiere autorización.

## Secuencia y puertas de aceptación

| Etapa                         | Trabajo                                                                                                                                                   | Criterio para continuar                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1 — Fundación local (actual)  | Tokens, módulos puros, configuración privada, calidad, pruebas y documentación                                                                            | Landing conserva marca, geometría e interacciones; pruebas sin secretos         |
| 2 — Esqueleto Next/TypeScript | Instalar versiones estables compatibles, crear App Router en rama de trabajo y trasladar CSS/activos; conservar archivos originales durante la transición | `tsc --noEmit`, lint y `next build` correctos; pruebas contra nueva aplicación  |
| 3 — Paridad de la portada     | Convertir layout, header, navegación, tarjetas, diálogos, footer y boletín en componentes; datos aún demo                                                 | Capturas y recorridos iguales a línea base local; no cambia identidad ni anclas |
| 4 — API y datos               | Adaptar `/api/db-status` a `src/app/api/db-status/route.ts`; añadir Drizzle/modelos y migraciones en fase autorizada                                      | Mismo contrato de estado; pruebas con dobles y rama Neon aislada; SQL revisado  |
| 5 — CMS protegido y páginas   | Identidad, permisos, revisión editorial y páginas con slug; consultar solo publicaciones                                                                  | Borradores no públicos, validación y sanitización; URLs y metadatos correctos   |
| 6 — Cambio de runtime público | Configurar Vercel para Next, construir Preview separado y aceptar antes de promoción autorizada                                                           | Paridad aprobada y procedimiento de vuelta atrás probado                        |

Las etapas 2–4 pueden validarse en un proyecto Preview separado o rama sin promover a producción. **No cambiar `vercel.json` en la rama desplegada mientras Next no esté listo**. No instalar un framework y apuntar el dominio a una portada incompleta. El proyecto actual continúa atendiendo `/` mientras se valida el sucesor.

## Mapa de traslado

| Actual                                   | Futuro                                                                |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `dist/index.html`                        | `src/app/layout.tsx`, `src/app/(public)/page.tsx` y componentes       |
| `dist/design/tokens.css`                 | `src/styles/tokens.css`, importado una vez en layout raíz             |
| `dist/styles.css`                        | CSS global inicial, luego módulos por componente sin cambiar valores  |
| `dist/assets/*`, favicons                | `public/assets/*`, `public/favicon.png` con mismos nombres/URL        |
| `dist/modules/data/*`                    | Fixtures demo hasta sustituir por repositorios publicados             |
| `dist/modules/shared/*`                  | Utilidades puras tipadas en `src/shared`                              |
| `dist/modules/services/saved-stories.js` | Adaptador cliente, misma clave y formato `np-saved`                   |
| `app.js` eventos/render                  | Componentes cliente solo donde haya interacción                       |
| `lib/database.js`                        | `src/database/client.ts`, exclusivo del servidor                      |
| `api/db-status.js`                       | Route Handler GET, rechazo de otros métodos y respuestas equivalentes |

No dejar simultáneamente dos propietarios de `/api/db-status`. No importar scripts que manipulan el DOM global junto a componentes React que controlan los mismos elementos. El estado de búsqueda, filtros y diálogo tendrá un único propietario; listeners y temporizadores se limpiarán al desmontar.

## Matriz de conservación

- Marca: originales intactos; mismo encuadre y favicon; cabecera 84/76/66 px.
- Navegación: `/`, `#historias`, `#opinion`, `#boletin`, categorías y búsqueda con tildes.
- Lectura: apertura/cierre por teclado, títulos, imágenes y contenido de demo mientras no haya CMS.
- Guardados: compatibilidad de `np-saved`, recarga y tolerancia a almacenamiento bloqueado.
- Boletín: consentimiento y validación; mantener el aviso demo hasta tener servicio real autorizado.
- Responsive: 1440, 800 y 390 px en automatización; ampliar revisión a bordes de breakpoints, zoom y teclado antes de migrar framework.
- Neon: `DATABASE_URL` privada, ningún cambio en credenciales de producción durante preparación. Consultas y validación fuera del navegador.
- Dominio: preservar URLs de marca y redirección del apex; verificar en Preview y luego por lectura después de un despliegue autorizado.

## Preparación de una futura entrega

1. Revisar el diff completo, incluidos los cambios de marca previos; elegir y autorizar qué se versiona. Hoy no se ha hecho commit.
2. Ejecutar `npm ci --include=dev`, `npm run verify`, `npm run test:e2e`. Con Next añadir comprobación de tipos y compilación real.
3. Verificar con el propietario ramas Neon, variables por entorno y credenciales independientes; nunca volcar sus valores en documentación/logs.
4. Aplicar migraciones futuras solamente a entorno aislado, ensayar restauración y revisar compatibilidad con la versión anterior. No ejecutar migraciones desde build.
5. Preparar Preview sin cambiar dominio público. Comparar portada, navegación, rutas y contrato de API.
6. Obtener autorización de despliegue sobre un resultado concreto y verificable. Promover mediante Vercel cuando esté aprobado.
7. Comprobar HTTP, activos, API y logs sanitizados. Si hay regresión, volver a promover el despliegue anterior; no usar `git reset` o `git clean` para recuperar archivos de usuario.

Una reversión de Vercel no revierte una base de datos. Las migraciones deberán ser compatibles hacia atrás (añadir antes de retirar); no borrar columnas o datos hasta verificar uso, backups y autorización específica.

## Pendientes y riesgos

- La identidad nueva sigue local hasta autorizar commit/push/despliegue.
- No se ha verificado el SHA exacto del despliegue, el panel privado de Vercel ni el aislamiento real de ramas Neon.
- El paso a módulos ES requiere servir por HTTP; abrir el HTML con `file://` no es un flujo soportado.
- Las pruebas e2e estabilizan fuentes e imágenes externas; acreditan regresión local bajo esas condiciones, no disponibilidad de Google/Unsplash ni certificación WCAG/Lighthouse.
- Sigue pendiente eliminar duplicación portada/datos, sanitizar contenido externo, SEO de artículos, autenticación, permisos, observabilidad y limitación de consultas públicas de estado.
- No hay CI ejecutado en GitHub todavía; existe el workflow local y sus comandos se comprueban localmente.
- No se construyeron CMS, panel, IA, Telegram, redes, rankings o encuestas.
