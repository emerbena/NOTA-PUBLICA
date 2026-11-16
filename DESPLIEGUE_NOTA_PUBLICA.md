# Puesta en servicio de Nota Pública

Documento iniciado el 14 de noviembre de 2026, America/Bogota. Actualización del 15 de noviembre: la entrega anterior ya está en GitHub, rama `release/phase-2`, commit `c48492d`. La preparación adicional de Preview descrita al final está pendiente de commit y push autorizados. No se ha publicado esta plataforma en el dominio de producción desde estas tareas.

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
- Cuenta administradora local probada por el propietario; la cuenta de producción se verificó por separado. No volver a ejecutar el alta inicial ni compartir contraseñas por chat.
- Boletín con altas, consentimiento y bajas reales, pero sin proveedor de envío de correos.
- IA, investigación automática y Telegram/Facebook/Instagram/Threads/X preparados mediante contratos y modelos, sin credenciales, modelos ni envíos.
- Premios incluye ediciones, nominaciones/categorías y ganadores. Jurados, convocatoria y votación de premios corresponden a una fase posterior.
- Pendientes mediciones de carga/Core Web Vitals, revisión WCAG completa, observabilidad externa, recuperación y política de retención. No son controles ya certificados por esta entrega.

Evidencia de implementación, tablas, rutas y pruebas: [RESULTADO_FASE_2.md](RESULTADO_FASE_2.md).

## Preview automático de Neon — 15 de noviembre de 2026

### Estado Git y cambios pendientes

Última consulta de solo lectura a GitHub: `release/phase-2` apunta a `c48492d35d838aa7e4a6544d530a74af14cb147e` y `main` permanece en `c0bb0b157023f5c882c80da2c7e94b4fb6ec8d60`. No hace falta volver a publicar la entrega anterior. El propietario confirmó Production → main y eligió las ramas Preview automáticas. Esta sección sustituye la propuesta anterior de fijar Preview a development. Los cambios adicionales siguen sin commit ni push:

- `package.json`: `prebuild` ejecuta `tsx scripts/check-preview.ts`; `build` sigue siendo `next build`.
- `scripts/check-preview.ts`: pese a conservar su nombre inicial, ahora verifica tanto Preview como Production. Compara pooled y directa en transacciones de solo lectura, sin cargar archivos privados, migrar o sembrar datos.
- `src/database/deployment-target.ts`: política compartida de despliegues. Production exige la rama `br-gentle-brook-bb36jzhq` y endpoint `ep-young-boat-bbjg90u1` de main. Preview obtiene el endpoint de las URLs inyectadas y lee el ID real de rama por SQL; rechaza main, inconsistencias de endpoint y cambios de rama entre conexiones. Ambos modos exigen TLS con certificado y hostname verificados.
- `src/database/preview-target.ts`: conserva compatibilidad con el control anterior, sin fijar development.
- `src/database/client.ts`: todas las adquisiciones del pool desplegado comprueban `neon.branch_id` y `neon.endpoint_id` antes de entregar la conexión. Errores de conexión e identidad se ocultan; no hay fallback a una base distinta.
- `scripts/maintenance-guard.ts`, migrador, seed y herramientas de release: rechazan ejecución en Preview/Vercel antes de acceder a credenciales de producción o migrar. La carga del entorno local también se desactiva en despliegues.
- `test/integration/deployment-target.test.ts`: ramas dinámicas, aislamiento de main, URLs mezcladas, errores sin secretos, pool Promise/callback y bloqueo de mantenimiento/prebuild.

Los IDs de main son públicos y están fijados en código: no se pueden redefinir mediante variables de Preview. Si se reemplaza deliberadamente main o su endpoint, será necesaria una revisión de esos IDs. Preview no necesita un ID de rama manual por despliegue. El desarrollo local conserva su control anterior de development.

La integración es la fuente de las URLs de cada Preview. La validación SQL acredita identidad real, endpoint coincidente y ausencia de conexión a main; no consulta la API de gestión para certificar el nombre, proyecto, padre o autor de creación de una rama. No requiere una API key de Neon. No se ha creado ni conectado una rama Preview automática nueva durante esta preparación.

### Configuración requerida en el panel, aún no verificada remotamente

En el proyecto Vercel `nota-publica`, conservar la rama Git de Production en `main`. La rama `release/phase-2` debe generar un **Preview**, sin asignarle los dominios de producción. Usar Next.js, Node 24, raíz del repositorio, instalación `npm ci --include=dev`, compilación `npm run build` y salida automática, sin el antiguo override `dist`.

Configurar únicamente el alcance **Preview**:

| Variable                | Valor o procedencia                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL`          | Pooled de la rama automática, inyectada por Neon; no copiar desde archivos locales         |
| `DATABASE_URL_UNPOOLED` | Directa de esa misma rama automática, inyectada por Neon; requerida para el control previo |
| `NP_ENV`                | `preview`                                                                                  |
| `NP_DATABASE_MODE`      | `neon`                                                                                     |
| `CONTENT_MODE`          | `demo`                                                                                     |
| `SITE_URL`              | Origen HTTPS estable de la rama Preview, copiado del panel                                 |
| `BETTER_AUTH_URL`       | Exactamente el mismo origen de Preview                                                     |
| `BETTER_AUTH_SECRET`    | Secreto de pruebas, distinto del de Production, mínimo 32 caracteres                       |
| `CRON_SECRET`           | Otro secreto de pruebas, mínimo 32 caracteres                                              |
| `NP_MEDIA_STORAGE`      | `blob`                                                                                     |
| `BLOB_READ_WRITE_TOKEN` | Token del almacén público de pruebas, si se habilitan subidas                              |

No crear `VERCEL` o `VERCEL_ENV` manualmente: Vercel proporciona sus valores y el código rechaza discrepancias con `NP_ENV`. No copiar conexiones fijas de main/development ni secretos de producción a Preview. Mantener `NP_ALLOW_DEV_MIGRATION=no` localmente y no habilitarlo en Vercel. Si se crearon overrides manuales de las dos URLs de Preview siguiendo la propuesta anterior, resolverlos en la configuración de la integración para que sean las conexiones automáticas efectivas las que lleguen al build. No eliminar la integración ni variables de Production.

En Neon/Vercel: conservar **Production branch = main**, **Create database branch for deployment → Preview activado** y la creación de una rama por deployment de Production desactivada. No cambiar la rama predeterminada como parte de este trabajo. Neon inyecta las URLs durante el despliegue y pueden no verse como valores específicos en Settings. Conservar los nombres exactos `DATABASE_URL` y `DATABASE_URL_UNPOOLED`, sin prefijos adicionales. Production debe disponer también de ambas URLs de main para el control previo, `NP_ENV=production`, modo Neon y su CONTENT_MODE elegido; este cambio de código no modifica esas variables remotamente.

Referencia: https://neon.com/docs/guides/vercel-managed-integration

El endpoint de estado público solo devuelve conectividad; los logs del nuevo `prebuild` acreditan la rama verificada sin revelar URLs. La configuración efectiva de Vercel y el resultado de un nuevo build remoto todavía están pendientes de acceso al panel y despliegue autorizado.

La validación de Blob se amplía en la sección «Aislamiento de Blob» al final: ahora exige `BLOB_STORE_ID` y una variable independiente con el ID esperado para el entorno. El SDK mantiene OIDC; el token estático es opcional con OIDC y, cuando existe, debe coincidir con el mismo almacén. Las imágenes son públicas; los archivos locales no se transfieren automáticamente.

Preview usa una copia separada creada por Neon desde la rama predeterminada; no comparte escrituras con main. Esa copia puede contener datos, usuarios y sesiones heredados de su rama padre. `CONTENT_MODE=demo` filtra el portal público, pero no anonimiza datos ni restringe por sí solo los datos del administrador. Mantener Preview protegido y utilizar cuentas de prueba autorizadas. La programación remota no está configurada; no se ejecuta ningún cron al compilar. No se siembran ejemplos ni se aplican migraciones automáticamente: una rama sin esquema compatible necesitará un procedimiento separado de migración exclusivamente Preview, todavía no implementado.

### Verificación de esta preparación

- Dieciséis pruebas específicas de destinos y controles correctas; utilizan URLs ficticias, sustitutos de SQL y ejecuciones de prebuild que deben detenerse antes de conectar. No escriben ni acceden a main.
- TypeScript y ESLint de los archivos modificados correctos.
- Compilación optimizada de Next completada en el entorno local. Prebuild local no abrió conexiones de despliegue. No se presenta como prueba remota de una rama automática ni como comprobación de autenticación HTTPS en Vercel.
- No se repitieron las pruebas funcionales del portal o del administrador ya confirmadas por el propietario.
- No hay comandos de migración o seed en instalación, prebuild, build o arranque. El workflow usa bases de prueba locales para sus pruebas; no aplica migraciones a Neon. El inicializador de producción exige ejecución explícita y rechaza Vercel.
- Revisados los archivos candidatos, el índice y los blobs de los commits de la entrega respecto a `origin/main`: sin coincidencias con las conexiones/contraseñas/secretos privados locales ni patrones habituales de claves. Esto no sustituye un escáner de todas las credenciales posibles.
- `.env`, `.env.local`, `.env.release.local` y `.artifacts` permanecen ignorados. Solo `.env.example`, con marcadores vacíos, está versionado.

Pendiente antes de publicar: completar/revisar las variables y el origen real de Preview, comprobar la asignación de la integración Neon y autorizar el nuevo commit/push de `release/phase-2`. No se modificaron Vercel, dominios, main ni producción; no se ejecutaron migraciones, commit o push durante esta preparación.

## Corrección de la salida de Preview — 15 de noviembre de 2026

El error comunicado busca `/vercel/path0/dist/routes-manifest.json`. La configuración local y la del commit HEAD ya declaran Next.js; ninguna define `distDir`. El artefacto local existente contiene `.next/routes-manifest.json`, `.next/BUILD_ID` y `config.distDir = ".next"` en `required-server-files.json`. Esto apunta a un override antiguo de Vercel o a una configuración distinta en el despliegue fallido; no se consultó su configuración privada para atribuir la causa con certeza.

Se añade `"outputDirectory": null` a `vercel.json` para restablecer explícitamente la salida predeterminada del framework en los despliegues que usen este archivo, incluso si hay un valor heredado del proyecto. No se cambia `next.config.ts`, no se convierte la aplicación en exportación estática y se conserva la landing histórica `dist/`. La corrección permanece local en `release/phase-2` hasta autorizar commit y push.

Referencia: [Vercel admite outputDirectory string o null y sobrescribe Project Settings](https://vercel.com/docs/project-configuration/vercel-json#outputdirectory).

### Valores para revisar en Settings → Build and Deployment

| Campo            | Valor esperado                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root Directory   | Vacío: raíz del repositorio Git. `package.json`, `src/`, `next.config.ts` y `vercel.json` están en esa raíz. No poner `nota-publica`, `dist`, `src` ni `.next`. |
| Framework Preset | Next.js                                                                                                                                                         |
| Build Command    | `npm run build`; conservarlo para que npm ejecute también `prebuild`.                                                                                           |
| Install Command  | `npm ci --include=dev`                                                                                                                                          |
| Output Directory | Predeterminado de Next.js: Override desactivado, sin `dist`. El archivo local usa `null` para restablecer ese valor por despliegue.                             |
| Node.js Version  | 24.x                                                                                                                                                            |

Estos ajustes del panel son del proyecto y pueden afectar futuros despliegues de Production. Para mantener esta intervención limitada a Preview, no se modifican ahora: la corrección versionada permite resolver Output Directory en la rama de entrega. Si Root Directory estuviera configurado incorrectamente, detener el despliegue y revisar ese ajuste antes de continuar; no se corrige mediante una propiedad inventada en `vercel.json`. Ningún cambio de este turno modifica el despliegue de producción existente.

### Origen de Preview y validación posterior

El propietario confirmó el dominio estable. Configurar ambos nombres como Config, únicamente Preview → `release/phase-2`:

```dotenv
SITE_URL=https://nota-publica-git-release-phase-2-emerbena99-1179s-projects.vercel.app
BETTER_AUTH_URL=https://nota-publica-git-release-phase-2-emerbena99-1179s-projects.vercel.app
```

No se escribieron estos valores en archivos privados ni remotamente. Después de la autorización de commit/push y despliegue:

1. Verificar que el despliegue sea Preview, de `release/phase-2`, y del nuevo commit que incluye `outputDirectory: null` y las protecciones de identidad. Un redeploy de un commit anterior no incorpora estos cambios.
2. Revisar Build Logs: `npm run build` debe ejecutar primero el control SQL de identidad en solo lectura; debe aceptar la rama automática y rechazar main. No ejecutar migraciones ni seed para resolver este error de salida.
3. Confirmar compilación de Next sin búsqueda del manifiesto en `dist`. El manifiesto corresponde a `.next/routes-manifest.json`; no copiarlo manualmente a `dist`.
4. Comprobar estado Ready y abrir exclusivamente el dominio estable de Preview. Probar portada, artículo, `/admin/login`, sesión y una operación autorizada sobre datos de prueba. Validar subida de imagen solo cuando Blob de pruebas esté configurado.
5. Mantener los dominios públicos y Production sin cambios. No usar Promote to Production.

Validación local de esta corrección: revisión de raíz Git, scripts, configuración de Next y artefactos existentes; validación de JSON y formato. No se repite el build ni las pruebas funcionales locales ya realizadas. La comprobación del empaquetado remoto sigue pendiente del Preview autorizado.

## Aislamiento de Blob — configuración requerida antes de desplegar

El propietario confirmó dos almacenes públicos con prefijo BLOB: `nota-publica-preview`, conectado solo a Preview, y `nota-publica-production`, conectado solo a Production. No se han consultado sus IDs ni credenciales remotamente. No hay IDs reales inventados o fijados en código; los ejemplos de las pruebas son ficticios.

### Variables exactas

| Variable                      | Tipo                               | Preview → `release/phase-2`             | Production                                 |
| ----------------------------- | ---------------------------------- | --------------------------------------- | ------------------------------------------ |
| `BLOB_STORE_ID`               | Config, gestionada por la conexión | ID de `nota-publica-preview`            | ID de `nota-publica-production`            |
| `BLOB_READ_WRITE_TOKEN`       | Secret, gestionada por la conexión | Token de `nota-publica-preview`         | Token de `nota-publica-production`         |
| `NP_PREVIEW_BLOB_STORE_ID`    | Config, nueva                      | ID verificado de `nota-publica-preview` | **No configurar**                          |
| `NP_PRODUCTION_BLOB_STORE_ID` | Config, nueva                      | **No configurar**                       | ID verificado de `nota-publica-production` |
| `NP_MEDIA_STORAGE`            | Config                             | `blob`                                  | `blob`                                     |

`VERCEL_ENV` y OIDC los proporciona Vercel. No crear, copiar ni fijar `VERCEL_OIDC_TOKEN` manualmente. El desarrollo local habitual conserva `NP_MEDIA_STORAGE=local`; el adaptador remoto de esta entrega solo admite Preview/Production con una identidad explícita.

### Cómo obtener y configurar los valores

1. En Vercel → Storage, abrir **nota-publica-preview**. Copiar su **Store ID** de los detalles/configuración del almacén. Es un identificador, no el nombre del almacén, una URL de archivo ni el token. Si se consulta mediante la variable gestionada `BLOB_STORE_ID`, verificar primero en la conexión del almacén que corresponde a **nota-publica-preview**, no deducirlo solo del alcance de la variable.
2. En `nota-publica` → Settings → Environment Variables, buscar `NP_PREVIEW_BLOB_STORE_ID`. Crear una entrada solo si no existe; usar tipo **Config**, alcance **Preview**, rama **release/phase-2**, y pegar ese ID. No usar All Environments.
3. Para la configuración futura de Production, obtener separadamente el ID desde **nota-publica-production** y usarlo en `NP_PRODUCTION_BLOB_STORE_ID`, tipo **Config**, alcance **Production exclusivamente**. No reutilizar el ID de Preview. Esta tarea no modifica Production.
4. Se aceptan tanto `store_` seguido del ID como el ID sin ese prefijo. Los dos almacenes deben tener IDs distintos. Las variables esperadas son referencias de confianza independientes: no definirlas mediante interpolación de `BLOB_STORE_ID` ni copiar un valor sin comprobar a qué almacén pertenece.
5. Reutilizar las entradas `BLOB_STORE_ID` y `BLOB_READ_WRITE_TOKEN` creadas por las conexiones. No duplicarlas ni renombrarlas. Revisar que no haya un override específico de `release/phase-2` que apunte al almacén de producción. El mismo nombre con un valor propio por entorno es correcto.
6. Si `NP_MEDIA_STORAGE` aún no existe para Preview, añadir `blob` como Config en Preview → `release/phase-2`. El modo Neon ya lo usa por defecto, pero declararlo evita ambigüedad.
7. No hacer Redeploy todavía: estos cambios necesitan primero el commit/push autorizados. No cambiar conexiones, tokens o dominios de Production para probar Preview.

### Qué comprueba el código

- `src/shared/blob-target.ts` toma el entorno efectivo de `VERCEL_ENV` y exige coherencia con `NP_ENV`. Rechaza IDs ausentes, inválidos o distintos del esperado. Rechaza una variable esperada del otro entorno presente y no vacía, para evitar políticas heredadas de All Environments.
- La comprobación se ejecuta en `prebuild`, antes de conectar a Neon, y en cada subida remota. `env:check` también comprueba la configuración Blob. Sin estos IDs el nuevo build de Vercel se detiene de forma segura; no hay migraciones ni intentos de subida para verificar identidades.
- Si existe `BLOB_READ_WRITE_TOKEN`, se contrasta el identificador de almacén contenido en su formato con el ID esperado, incluso si OIDC está disponible. Un token cruzado o de formato desconocido se rechaza antes de llamar al SDK. Vercel sigue siendo quien autentica la credencial; leer su ID no verifica su validez criptográfica.
- `src/shared/blob-upload.ts` pasa el `storeId` ya validado a `put`, pero no pasa `token` ni `oidcToken`. El SDK conserva la prioridad OIDC, el token del contexto de la petición y la renovación automática. Si no hay OIDC, solo puede recurrir al token estático que ya se validó contra el mismo destino.
- La API de medios devuelve HTTP 503 con un mensaje fijo si falla el aislamiento o la subida. No imprime los errores originales del SDK ni conserva causas con tokens. El control ocurre antes de la escritura en Blob y de crear el registro de multimedia; se mantienen las comprobaciones previas de sesión, permisos, origen y límite de solicitudes.
- Las subidas continúan siendo públicas, con nombres UUID, PNG/JPEG/WebP de hasta 3 MB. No se cambió el diseño ni el almacenamiento local.

La política depende de que el administrador configure correctamente cada ID esperado. No consulta la API de gestión para acreditar el nombre del almacén, su propietario o comparar secretos entre despliegues separados; tampoco puede impedir que alguien con permisos para cambiar código y configuración cambie ambas referencias a la vez. La coincidencia y el aislamiento efectivos en Vercel se comprobarán con una subida autorizada a Preview después de desplegar, verificando que aparezca solo en el almacén de pruebas.

Referencia del comportamiento OIDC/storeId y del formato con o sin `store_`: [SDK oficial de Vercel Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk).

### Pruebas de esta entrega

Comando: `node --import tsx --test test/integration/blob-target.test.ts test/integration/deployment-target.test.ts test/integration/development-target.test.ts test/integration/preview-target.test.ts`.

Resultado: **25/25 correctas** (9 nuevas de Blob y 16 de aislamiento Neon/entorno). Cubren cruces en ambos sentidos, ausencia de IDs, incoherencia de entorno, tokens cruzados incluso con OIDC, ausencia de llamadas al escritor cuando hay rechazo, conservación de las opciones OIDC, fallback estático y ocultación de errores. Usan un escritor sustituido e identidades ficticias, sin red, bases de datos ni subidas reales. Se ejecutaron fuera de la restricción de Windows que impide iniciar tsx; no se ejecutaron migradores.

TypeScript y ESLint de los archivos afectados correctos. Formato comprobado. No se instalaron dependencias ni se modificaron archivos privados de entorno, Neon, Vercel o credenciales. Las comprobaciones remotas siguen pendientes; no se hizo commit, push ni despliegue.
