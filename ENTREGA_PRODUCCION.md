# Preparación de la entrega de producción

14 de noviembre de 2026, America/Bogota. El propietario autorizó usar Neon main y lanzar con ejemplos identificados como demostración.

## Base preparada

- Rama verificada por SQL en conexiones pooled y directa: `br-gentle-brook-bb36jzhq`.
- Endpoint: `ep-young-boat-bbjg90u1`.
- Base vacía antes de aplicar la migración inicial; evidencia privada en `.artifacts/production-initial-state.json`.
- Resultado: 35 tablas, 16 artículos demo, cero artículos reales y 5 roles. No hay cuentas con contraseña predeterminada.
- Desarrollo conserva su propia conexión y rama. No se copiaron sus usuarios.
- `release:initialize` solo permite una instalación inicial en una base vacía identificada. Las actualizaciones futuras necesitan un procedimiento de migración revisado.

## Configuración privada y acceso

`.env.release.local` está ignorado por Git y no lo carga Next.js. Incluye conexiones main, IDs verificados, secretos nuevos, `CONTENT_MODE=demo`, `NP_ENV=production`, `NP_DATABASE_MODE=neon`, `NP_MEDIA_STORAGE=blob` y los orígenes `https://www.notapublica.com`.

El primer administrador de producción se crea con `npm.cmd run admin:create:production`. El comando habitual sin ese sufijo es para development. Nunca pasar contraseñas por argumentos ni copiarlas al repositorio. La verificación de solo lectura observó cero administradores activos antes de solicitar al propietario que cree su cuenta.

## Validación de esta entrega

- Sintaxis, TypeScript, ESLint y formato correctos.
- 13 pruebas unitarias y 15 de integración correctas; las de integración usan bases PostgreSQL locales aisladas.
- Build Next.js completado.
- 6 pruebas de navegador de la plataforma y 4 de la landing histórica correctas.
- Seed demo probado dos veces: idempotente, sin duplicados, sin credenciales predeterminadas y con todos los artículos marcados como demo.
- Conexiones de producción verificadas de nuevo después de la migración: 35 tablas en ambas.
- Siete rutas de la compilación respondieron HTTP 200 en un servidor local conectado a main: portada, noticias, artículo demo, login, estado SQL, robots y sitemap. Se comprobó etiqueta demo, `noindex` y sitemap sin noticias. Solo se realizaron lecturas y el servidor temporal se cerró.
- Archivos candidatos a Git revisados contra las conexiones, contraseñas de base y secretos reales locales: sin coincidencias. Los archivos privados y artefactos están excluidos.

No se presenta esta validación local como evidencia de un despliegue remoto ya realizado.

La consulta actualizada de `npm audit --include=dev` no se completó: el entorno restringido no pudo acceder al registro y se rechazó el permiso para repetirla fuera de ese entorno. No se cambiaron dependencias. Siguen pendientes de revisión los avisos moderados documentados en la fase anterior; no se afirma que las dependencias estén libres de vulnerabilidades.

## Pendiente para publicar el dominio

1. Conectar Vercel y revisar el proyecto real `nota-publica`, su rama Git de producción y las variables por entorno.
2. Configurar solo Production con las variables privadas indicadas; no copiar las conexiones main a Preview o Development. La URL directa es para operaciones de mantenimiento, no necesaria en el runtime web.
3. Conectar Vercel Blob y configurar `BLOB_READ_WRITE_TOKEN`; los archivos de `.local-media` no existen en Vercel.
4. Crear el administrador de producción con contraseña elegida por el propietario y probar el acceso HTTPS.
5. Preparar Preview con datos aislados y comprobar el artefacto remoto; coordinar el programador autenticado de `/api/jobs/publish` según el plan disponible.
6. Publicar la entrega validada, verificar dominio, rutas, demostración visible y `noindex`, conservar el despliegue previo como opción de recuperación. No ejecutar migraciones desde el build.

La configuración inicial de producción usa `CONTENT_MODE=demo`: no se presentarán los ejemplos como noticias reales y el sitemap queda vacío. La preparación de envío de boletines, IA y canales sociales no equivale a conectar esos servicios.
