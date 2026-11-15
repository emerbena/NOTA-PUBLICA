# Nota Pública

Plataforma editorial con Next.js App Router, React, TypeScript, PostgreSQL, Drizzle y Better Auth. La implementación de Fase 2 está en `src/`. La landing anterior se conserva íntegra en `dist/` y puede ejecutarse con `npm run dev:legacy`.

La configuración nueva es local. No se ha realizado commit, push ni despliegue. Producción sigue sin cambios. Consulta [RESULTADO_FASE_2.md](RESULTADO_FASE_2.md) para conocer la validación y los pendientes externos.

## Ejecutar en desarrollo

Requiere Node.js 24 y npm. La raíz es `nota-publica/`, no el paquete de la carpeta superior.

En este workspace, los comandos `npm.cmd run dev`, `npm.cmd run build` y `npm.cmd run start` también funcionan desde `frontnotapublica/`: sus scripts redirigen a la aplicación en `nota-publica/`. `dev` inicia Next.js localmente en el puerto 3000; `build` compila la aplicación; `start` sirve esa compilación localmente y requiere ejecutar `build` primero. Los tres utilizan la configuración de la aplicación y su `.env.local`; no despliegan ni ejecutan migraciones. Para otro puerto puedes usar `npm.cmd run dev -- --port 3001`.

**En este workspace ya está conectado y migrado Neon development.** Para entrar, ejecuta `npm run admin:create` una sola vez y luego `npm run dev`. No repitas `setup:local` ni reemplaces `.env.local`. El siguiente bloque es únicamente para una instalación nueva con PostgreSQL embebido:

En PowerShell usa `npm.cmd run admin:create` desde `nota-publica/`. La carpeta superior `frontnotapublica/` también tiene un acceso que redirige ese comando al paquete correcto, cargando `nota-publica/.env.local`. Para verificar comando, destino y preparación sin crear usuarios: `npm.cmd run admin:create -- --check`. El comando interactivo pide correo, nombre y contraseña oculta dos veces; no acepta credenciales por argumentos. Solo permite desarrollo, verifica la identidad de Neon, rechaza correos existentes y se bloquea si ya hay un superadministrador. No ejecuta migraciones. La prueba específica `npm.cmd run test:admin`, con `NP_ALLOW_DEV_CHECK=yes`, utiliza el esquema development existente y revierte todos sus datos temporales; requiere que aún no exista un superadministrador.

```sh
cd nota-publica
npm ci --include=dev
npm run setup:local
npm run db:migrate
npm run db:seed
npm run admin:create
npm run dev
```

Abre **http://localhost:3000** y **http://localhost:3000/admin/login**. Usa el mismo origen indicado en `BETTER_AUTH_URL`; mezclar `localhost` con `127.0.0.1` puede provocar rechazo de solicitudes por protección de origen.

`setup:local` solo se ejecuta la primera vez: crea `.env.local` con secretos aleatorios sin mostrarlos y se niega a sobrescribir uno existente. En este workspace ya está preparado el entorno local y aplicada la migración. No hay una cuenta administradora predeterminada: ejecuta `admin:create` en tu terminal para elegir correo, nombre y contraseña de al menos 12 caracteres. La contraseña se introduce oculta y se guarda mediante Better Auth. El procedimiento se bloquea si ya existe un superadministrador; las demás cuentas se crean en **Usuarios**.

En PowerShell usa `npm.cmd`/`npx.cmd` si están bloqueados los wrappers `.ps1`. El almacenamiento local utiliza PGlite, PostgreSQL embebido, sin Docker ni servicios globales. **Detén el servidor antes de ejecutar migraciones, seed o creación de administrador**: una base PGlite persistente debe tener un único proceso propietario. Los datos están en `.local-db/main` y las imágenes en `.local-media`, ambos ignorados por Git. No son el almacenamiento de producción.

## Conectar la rama de desarrollo de Neon

El adaptador remoto usa `DATABASE_URL` pooled mediante `pg`/Drizzle; el migrador usa `DATABASE_URL_UNPOOLED` directa. Ambas son privadas. En este workspace se verificó la rama `development` (`br-super-bar-bbfkktrc`), endpoint `ep-billowing-resonance-bbfeuvjq`. Se aplicaron 35 tablas, ejemplos y pruebas editoriales reales, sin conexiones a main/producción.

Variables de `.env.local`:

| Variable                                                     | Uso                                                                               |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `DATABASE_URL`                                               | URL pooled de development                                                         |
| `DATABASE_URL_UNPOOLED`                                      | URL directa de la misma rama/base/rol, utilizada por migraciones                  |
| `NP_ENV=development`, `NP_DATABASE_MODE=neon`                | Entorno local conectado a Neon                                                    |
| `NP_EXPECTED_NEON_BRANCH_ID`, `NP_EXPECTED_NEON_ENDPOINT_ID` | IDs confirmados en el panel Neon; se comparan con SQL antes de usar la conexión   |
| `NP_ALLOW_DEV_MIGRATION=no`                                  | Bloqueo persistente; habilitar solo por proceso cuando se autorice migrar/sembrar |
| `NP_MEDIA_STORAGE=local`                                     | Imágenes en `.local-media` durante desarrollo; `blob` para objetos/CDN            |
| `BETTER_AUTH_URL`, `SITE_URL`                                | `http://localhost:3000` para este entorno                                         |
| `BETTER_AUTH_SECRET`, `CRON_SECRET`                          | Secretos existentes; no reemplazarlos ni compartirlos                             |
| `CONTENT_MODE=demo`                                          | Mostrar únicamente ejemplos ficticios                                             |

Cada adquisición del pool consulta los IDs de Neon; una diferencia impide entregar la conexión. Las transacciones mantienen el cliente ya verificado. El migrador verifica la conexión directa antes del bloqueo y de aplicar SQL. No se migra al arrancar ni al compilar. Una variable que diga `development` por sí sola no acredita el destino.

Comprobaciones de solo lectura:

```sh
npm run env:check
npm run db:check:neon
```

Para futuras migraciones **autorizadas de development**, en PowerShell:

```powershell
$env:NP_ALLOW_DEV_MIGRATION = 'yes'
try {
  npm.cmd run db:migrate
  if ($LASTEXITCODE -ne 0) { throw 'Migración detenida' }
  npm.cmd run db:seed
} finally {
  $env:NP_ALLOW_DEV_MIGRATION = 'no'
}
```

No hace falta repetirlas para empezar a trabajar ahora. El seed es idempotente, pero siempre necesita autorización explícita de entorno. Si tu terminal heredó `NODE_TLS_REJECT_UNAUTHORIZED=0`, corrígelo a `1` para ese proceso: la protección rechaza TLS inseguro. No cambies las conexiones Vercel para ejecutar estos comandos locales.

`CONTENT_MODE=demo` muestra únicamente ejemplos ficticios. `CONTENT_MODE=live` muestra exclusivamente publicaciones reales. Los artículos no pueden cambiar su clasificación demo/real después de crearse. Usa autores y archivos del mismo tipo. El seed es idempotente y no reemplaza registros existentes; los datos de prueba no se presentan como sucesos reales.

## Flujo editorial

- Periodista: crea y edita sus borradores y envía a revisión.
- Editor: revisa, modifica y solicita cambios. Solo aprueba si un administrador le concedió esa facultad.
- Director editorial: administra, aprueba y publica.
- Superadministrador: también gestiona usuarios y permisos.
- Gestor de redes: prepara variantes de contenido ya publicado. No puede aprobar ni publicar noticias.

Cada guardado crea una revisión. Aprobar vincula la decisión a esa versión exacta. Editar después invalida la aprobación; si ya había una versión pública, permanece visible hasta aprobar y publicar la nueva. Las eliminaciones de artículos requieren confirmación y son lógicas: conservan revisiones y auditoría. La prioridad de portada se ajusta desde la ficha de una noticia.

El editor admite formato, enlaces, imágenes del archivo y videos de YouTube. El servidor valida y sanitiza el contenido. Los formularios de rankings, encuestas, autores, categorías, encargos, premios y usuarios escriben datos reales. Las consultas con votos no permiten reemplazar opciones ni resultados; se pueden cerrar. Los rankings con votos conservan su metodología y participantes; se pueden despublicar.

## Publicación programada

Con la aplicación iniciada, ejecuta en otra terminal:

```sh
npm run scheduler
```

Este proceso de servidor llama cada 30 segundos al endpoint protegido `/api/jobs/publish`. Las fechas se guardan en PostgreSQL; al reiniciarse, publica los trabajos vencidos todavía aprobados. El procesamiento bloquea filas y es idempotente. La agenda se muestra en America/Bogota; los formularios identifican cuándo una entrada se interpreta en la zona horaria del dispositivo.

Para una futura puesta en servicio en Vercel habrá que configurar un programador externo o Vercel Cron según el plan contratado, enviando `Authorization: Bearer CRON_SECRET`. No se ha activado ningún cron remoto. Sin trabajador o programador, los artículos permanecen programados hasta la siguiente ejecución. No se utilizan temporizadores del navegador para publicar.

## Multimedia y servicios externos

Con `NP_MEDIA_STORAGE=local` las cargas se guardan en `.local-media`, incluso si SQL está en Neon. Este modo se limita a desarrollo/pruebas fuera de Vercel. Con `NP_MEDIA_STORAGE=blob` se utiliza **Vercel Blob**, con `BLOB_READ_WRITE_TOKEN` privado y CDN. Acepta PNG, JPEG y WebP de hasta 3 MB, valida firma del archivo y exige texto alternativo. No acepta SVG/HTML. PostgreSQL solo conserva metadatos y relaciones.

Vercel Blob aún no está conectado. Fuera del modo local, una carga sin token devuelve un error explícito; no simula un guardado. Los objetos son públicos: no subas material confidencial o sujeto a embargo que requiera control de acceso. La subida de video binario y la transformación de imágenes no forman parte de esta versión; el editor permite videos externos autorizados.

El boletín registra correo y consentimiento y permite baja mediante un enlace privado. **No envía correos todavía**. IA y redes sociales tienen contratos y modelos separados, sin modelos conectados, búsquedas automáticas, tokens sociales ni envíos. Las variantes multicanal se guardan en estado borrador.

## Verificación

```sh
npm run verify
npm run build
npm run test:e2e
npm run test:e2e:legacy
npm run env:check
```

`verify` incluye sintaxis, TypeScript, ESLint, Prettier, pruebas unitarias heredadas e integración SQL en memoria. Las pruebas de navegador de la plataforma usan cuentas efímeras y una base independiente en `.artifacts/platform-*`, nunca la base local de trabajo ni Neon. Requieren el build anterior, usan el puerto 4189 y cierran el servidor al terminar. Las pruebas heredadas usan el puerto 4187. Edge en Windows; en Linux, instalar Chromium con `npx playwright install --with-deps chromium`.

Los secretos de prueba se generan en memoria. `.artifacts/`, `test-results/` y `playwright-report/` no se publican. CI está configurado, pero no se ha ejecutado remotamente porque no hubo push. `db:check` y `env:check:legacy` son herramientas conservadas del frontend anterior; la comprobación activa de la plataforma es `env:check` y `/api/db-status`.

La integración remota es voluntaria y no forma parte de CI. `test:neon` comprueba la identidad autorizada, crea datos ficticios dentro de una transacción y revierte todo al terminar. Nunca apunta a producción:

```powershell
$env:NP_ALLOW_DEV_CHECK = 'yes'
try { npm.cmd run test:neon } finally { $env:NP_ALLOW_DEV_CHECK = 'no' }
```

Después de un build, `npm run check:neon:web` inicia un servidor temporal en el puerto 4191, prueba 16 rutas GET y captura escritorio/móvil con datos de Neon. Cierra el navegador y servidor al terminar; no realiza escrituras editoriales.

## Estructura activa

```text
src/app/                  páginas públicas, panel y Route Handlers
src/components/           UI pública, formularios, editor y CSS Modules
src/styles/               tokens y CSS público conservado
src/database/             esquema, conexión PostgreSQL y consultas
src/auth/                 Better Auth, roles y permisos de servidor
src/editorial/            revisiones, decisiones, recursos, votos y agenda
src/shared/               validación, sanitización, límites HTTP y JSON-LD
src/ai/                   contratos de propuestas futuras, sin proveedor
src/integrations/         contratos de distribución futura, sin cuentas
src/proxy.ts              política CSP con nonce por petición
public/                   logo, favicon y archivos públicos
scripts/                  entorno, migraciones, seed, administrador y publicador
Drizzle: drizzle/         SQL versionado y metadatos de migraciones
```

Las rutas públicas se renderizan en servidor con URLs reales, SEO por artículo, JSON-LD, sitemap y robots. La búsqueda y la paginación consultan PostgreSQL. Los guardados siguen siendo locales al navegador. Los votos abiertos tienen identificador de navegador, restricciones de unicidad y límites; no acreditan identidad personal ni son encuestas representativas.

`vercel.json` ahora selecciona Next.js y `npm run build`; se quitó la salida estática `dist`. `.vercelignore` excluye la API histórica de raíz para que el backend servido sea `src/app/api`. Los originales permanecen en el repositorio. `.openai/hosting.json` es histórico y no ejecuta esta plataforma. El dominio, DNS, cuentas y configuración privada de Vercel no fueron modificados.

Documentación histórica: [Fase 0](AUDITORIA_NOTA_PUBLICA.md), [arquitectura de Fase 1](ARQUITECTURA_NOTA_PUBLICA.md), [plan anterior](PLAN_MIGRACION.md), [resultado de Fase 1](RESULTADO_FASE_1.md) y [README previo](docs/README_FASE_1.md). Para el estado implementado consulta [RESULTADO_FASE_2.md](RESULTADO_FASE_2.md).

**No hacer commit, push, despliegue ni migraciones de producción sin autorización del propietario.**

Plan de puesta en servicio, sin ejecutarlo todavía: [DESPLIEGUE_NOTA_PUBLICA.md](DESPLIEGUE_NOTA_PUBLICA.md).
