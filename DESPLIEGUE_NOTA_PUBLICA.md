# Puesta en servicio de Nota Pública

14 de noviembre de 2026, America/Bogota. Instrucciones para una fase posterior; **no se ha hecho commit, push ni despliegue**. No se han cambiado main, producción o variables de Vercel durante esta continuación.

## Usar ahora la versión de desarrollo

### Preparación de producción: rama Neon main

El propietario eligió **Neon `main` para producción**, con ejemplos claramente marcados. Ambas conexiones ya fueron verificadas: rama `br-gentle-brook-bb36jzhq`, endpoint `ep-young-boat-bbjg90u1`, distintos de development. Se creó el esquema inicial en la base vacía: 35 tablas, 16 artículos demo, 5 roles y ningún artículo real. Vercel todavía no se ha configurado ni desplegado desde esta entrega.

Se preparó `.env.release.local`, privado e ignorado por Git, con estos campos:

- `DATABASE_URL`: conexión **pooled de main**.
- `DATABASE_URL_UNPOOLED`: conexión **directa de main**.
- `NP_PRODUCTION_NEON_BRANCH_ID`: ID de la rama main, obtenido de Neon.
- `NP_PRODUCTION_NEON_ENDPOINT_ID`: ID del endpoint de esa rama, obtenido de Neon.
- `NP_ENV=production` y `NEON_BRANCH_NAME=main`: valores ya establecidos.

Este archivo no es `.env.production.local`: Next.js no lo carga automáticamente, por lo que `dev` y `build` mantienen sus entornos actuales. No reemplazar `.env.local` ni copiar conexiones de development. También contiene las variables de runtime y secretos nuevos de producción; no imprimirlo ni subirlo a GitHub.

Después de completar el archivo, ejecutar `npm.cmd run release:check` desde la carpeta superior o desde `nota-publica`. Es una comprobación de **solo lectura**: verifica por SQL los IDs de ambas conexiones, rechaza la identidad conocida de development y muestra el número de tablas de la aplicación. No crea tablas, usuarios, contenido ni cambios en Vercel. El nombre de la rama debe contrastarse con el ID en la consola de Neon; SQL verifica el ID, no el nombre visible.

Los comandos `db:migrate`, `db:seed` y `admin:create` siguen restringidos a desarrollo. No cambiar sus indicadores para usarlos contra main. La instalación inicial se ejecutó mediante `release:initialize -- --apply-demo`, que comprueba identidad, adquiere un bloqueo, exige base vacía y solo admite la migración inicial. No repetirla: se detiene si ya hay tablas. El estado vacío previo y hash de migración están en `.artifacts/production-initial-state.json`, privado; esto no sustituye una copia de seguridad de datos futuros.

Para crear el primer administrador de **producción**, ejecutar `npm.cmd run admin:create:production`; funciona también desde la carpeta superior. Solicita credenciales ocultas, verifica main antes de escribir y rechaza cuentas duplicadas. `npm.cmd run admin:create:production -- --check` verifica preparación sin crear usuarios. No se copian cuentas ni contraseñas de desarrollo.

Vercel, Blob/CDN, cron remoto y la prueba Preview siguen pendientes. No hacer push a la rama Git de producción antes de configurar y verificar esos requisitos. Una rama de entrega separada puede guardarse en GitHub sin modificar la rama main.

### Servidor de desarrollo

Desde `nota-publica/`, con Node 24:

```sh
npm run admin:create
npm run dev
```

El primer comando se ejecuta una sola vez, en una terminal interactiva. El propietario elige nombre, correo y contraseña oculta (mínimo 12 caracteres). No hay contraseña predeterminada ni cuenta administradora persistente de pruebas. Si la terminal de herramientas heredó TLS desactivado, fijar `NODE_TLS_REJECT_UNAUTHORIZED=1` únicamente para esa sesión.

Abrir `http://localhost:3000/admin/login`. La web pública local está en `http://localhost:3000`. Usar ese mismo origen, que coincide con `BETTER_AUTH_URL`. Las tablas y ejemplos de Neon development ya están preparados; no volver a ejecutar `setup:local`.

Para probar agenda, iniciar también `npm run scheduler`. Es un proceso de servidor recuperable: las fechas viven en SQL y no dependen del navegador. Detenerlo cuando no se necesite procesar publicaciones de desarrollo.

Las conexiones privadas están en `.env.local`, ignorado por Git. La aplicación usa pooled, el migrador directa. La identidad autorizada es `br-super-bar-bbfkktrc` / `ep-billowing-resonance-bbfeuvjq`, contrastada con el nombre development por el propietario y con SQL por las herramientas. `NP_ALLOW_DEV_MIGRATION=no` queda como valor persistente.

## Preparar un despliegue, solo tras autorización

1. **Revisar y versionar los cambios.** Raíz del proyecto: `nota-publica`, con Next.js en `src/`. Mantener la landing histórica en `dist/`; no desplegarla como sustituto del backend. Revisar el diff completo de las fases acumuladas, incluidos los cambios de marca anteriores. No incorporar `.env.local`, `.local-db`, `.local-media`, `.artifacts`, credenciales ni resultados de pruebas. El commit/push necesita autorización.
2. **Validar dependencias y operación.** Resolver o evaluar los 11 avisos moderados de Drizzle Kit/esbuild y typescript-eslint/minimatch antes de publicar. Usar `npm audit --include=dev`: este entorno omite herramientas de desarrollo por defecto y muestra solo cuatro avisos sin esa opción. No aplicar los downgrades sugeridos por `audit fix --force` sin revisión. Ejecutar `npm ci --include=dev`, `npm run verify`, `npm run build` y ambas suites E2E. Comprobar backups/restauración y límites del plan; estas garantías no se derivan de un SELECT 1.
3. **Preparar Preview aislado.** Elegir una rama de datos específica y credenciales propias; verificar ID/endpoint y esquema antes de escribir. No reutilizar a ciegas production o las variables de la integración Vercel existente. Los scripts de migración de esta fase están limitados a development local: cualquier migración de Preview/producción necesita un procedimiento separado con destino fijado, revisión de SQL y autorización. No cambiar `NP_ENV` para eludir esta protección.
4. **Configurar secretos por entorno en Vercel.** Revisar la raíz, integración y alcance de cada variable antes de cambiarla. Runtime: `DATABASE_URL` pooled, `NP_DATABASE_MODE=neon`, `NP_ENV=preview` o `production`, `CONTENT_MODE=demo` o `live`, `BETTER_AUTH_URL` y `SITE_URL` HTTPS correspondientes, `BETTER_AUTH_SECRET`, `CRON_SECRET`, `NP_MEDIA_STORAGE=blob`, `BLOB_READ_WRITE_TOKEN`. No copiar las variables `NP_EXPECTED_NEON_*` de development a otros entornos: la aplicación rechaza esa mezcla. No dar prefijo `NEXT_PUBLIC_` a secretos. `DATABASE_URL_UNPOOLED` pertenece al proceso controlado de migración; no es necesaria para el runtime de producción.
5. **Conectar almacenamiento de objetos/CDN.** Crear/conectar el almacén únicamente cuando se autorice. Probar carga, respuesta CDN, metadatos, alt y asociación editorial. Las imágenes guardadas en `.local-media` no se suben automáticamente; migrarlas a objetos y actualizar sus referencias antes de publicar contenido real. El adaptador actual usa objetos públicos: para embargos hace falta almacenamiento privado y control de acceso adicional.
6. **Verificar el artefacto en Preview.** El `vercel.json` local ya preparado en la implementación anterior usa Next y `npm run build`; en esta continuación se conservó. Revisar que `.vercelignore` excluya la API histórica de raíz y los artefactos locales. Comprobar rutas dinámicas, cookies HTTPS, inicio/cierre de sesión, permisos negativos, borradores inaccesibles, publicación, imágenes y política CSP. No asumir que el build local verifica el empaquetado remoto.
7. **Configurar el programador.** Usar un trabajador o cron compatible con el plan que invoque `GET /api/jobs/publish` con `Authorization: Bearer CRON_SECRET`. Probar ejecución, reintentos e idempotencia en Preview. Sin esas invocaciones, los artículos permanecen programados. No se configuró un cron remoto durante esta fase.
8. **Preparar contenido y acceso reales.** Crear los responsables, roles, autores y noticias reales separados de los ejemplos. Completar información de contacto, privacidad y criterios de encuestas/rankings/premios. En `CONTENT_MODE=live` solo se muestran registros reales. El modo demo permanece marcado y no indexable. No se trasladan cuentas de prueba a producción.
9. **Autorizar la salida y recuperación.** Antes de migrar/publicar en producción, definir respaldo, procedimiento de restauración, comprobaciones de compatibilidad y vuelta al despliegue anterior. Autorizar expresamente cambios de base, variables y despliegue. Después comprobar dominio, API, acceso editorial, SEO, CDN, cron y alertas.

## Pendientes externos y alcance

- Vercel Blob/CDN y cron remoto aún sin conectar. Multimedia funciona localmente con Neon; no se certificó almacenamiento remoto.
- Propietario sin cuenta elegida todavía: usar `admin:create`, sin compartir contraseñas por chat.
- Boletín con altas, consentimiento y bajas reales, pero sin proveedor de envío de correos.
- IA, investigación automática y Telegram/Facebook/Instagram/Threads/X preparados mediante contratos y modelos, sin credenciales, modelos ni envíos.
- Premios incluye ediciones, nominaciones/categorías y ganadores. Jurados, convocatoria y votación de premios corresponden a una fase posterior.
- Pendientes mediciones de carga/Core Web Vitals, revisión WCAG completa, observabilidad externa, recuperación y política de retención. No son controles ya certificados por esta entrega.

Evidencia de implementación, tablas, rutas y pruebas: [RESULTADO_FASE_2.md](RESULTADO_FASE_2.md).
