# Arquitectura de Nota Pública

Fase 1 · 14 de noviembre de 2026. Implementación local, sin commit ni despliegue.

## Decisión y alcance

Destino aprobado: monolito modular con Next.js App Router, TypeScript, Neon PostgreSQL, Drizzle y CSS propio. La transición comienza organizando la aplicación existente. No se instala Next.js ni Drizzle en esta fase: aún no hay páginas React ni modelos editoriales que justifiquen ejecutarlos. Se evita mantener dos frameworks o una aplicación vacía junto al sitio actual.

Hoy sigue funcionando la landing estática y su API de disponibilidad. Se han separado módulos del navegador, extraído tokens de diseño, centralizado validación del entorno e incorporado pruebas y calidad. La Fase 0 conserva su valor como fotografía histórica; los cambios de esta fase se describen aquí.

## Estructura ejecutable actual

```text
dist/                              Sitio servido directamente, todo público
  index.html                       Plantilla y marca existentes
  styles.css                       Composición y media queries existentes
  design/tokens.css                Colores, fuentes, escalas y dimensiones
  app.js                           Coordinación, estado, presentación y eventos
  modules/
    data/stories.js                 Ocho entradas de demostración
    data/info-pages.js              Textos informativos existentes
    services/saved-stories.js       Persistencia local tolerante a fallos
    shared/config.js               Configuración exclusivamente pública
    shared/utils.js                Normalización de texto e imágenes
  assets/                          Logo horizontal original
  favicon.png / favicon.svg        Marca nueva y archivo anterior conservado
api/db-status.js                   Adaptador HTTP Vercel existente
lib/database.js                    Adaptador Neon exclusivo del servidor
lib/database-status.js             Contrato de disponibilidad y errores
lib/env.js                         Validación privada sin conexiones de red
lib/load-local-env.js              Carga local, omitida en test/Vercel
scripts/                          Diagnóstico, validación y sintaxis
test/                             Pruebas unitarias y e2e
.github/workflows/quality.yml      Verificaciones sin secretos ni despliegue
```

No se crean carpetas vacías para CMS, IA o integraciones. `dist/` sigue siendo fuente mantenida, no una salida generada. No ejecutar un generador que la limpie.

## Estructura objetivo cuando se incorpore Next.js

```text
public/                           Solo activos estáticos, nunca código privado
src/
  app/
    layout.tsx                    Layout raíz y carga única de estilos
    (public)/                     Grupo de rutas, no añade /public a la URL
      page.tsx                    Portada en /
      noticias/[slug]/page.tsx     Contenido publicado
    admin/                        Ruta /admin, cuando se autorice
    api/                          Route Handlers del servidor
  components/                     Componentes visuales y variantes editoriales
  styles/                         Tokens y CSS propios migrados
  editorial/                      Casos de uso, revisiones y aprobaciones
  ai/                             Adaptadores de asistencia, sin autopublicación
  integrations/                   Conectores de canales y proveedores
  database/                       Cliente, modelos y consultas privadas
  shared/                         Tipos y validaciones sin credenciales
drizzle/                          SQL y metadatos de migraciones versionados
```

Es un mapa futuro, no carpetas ya implementadas. La convención de Next.js reserva `public/` para activos; el sitio se ubica en `src/app/(public)` y las rutas administrativas en `src/app/admin`. [Convenciones oficiales](https://nextjs.org/docs/app/getting-started/project-structure).

Dependencias: rutas → servicios editoriales → repositorios → Neon. El frontend público solo recibe contenido publicable. Los módulos de servidor no se importan desde componentes cliente. La autenticación verificará identidad; cada operación editorial verificará permisos en servidor. Un directorio llamado `admin` por sí solo no ofrece protección.

Drizzle envolverá el adaptador Neon con modelos TypeScript y SQL revisable. Se mantendrá el nombre `DATABASE_URL`; no se asume que existan tablas ni que una consulta de disponibilidad pruebe permiso de escritura. Las migraciones se ejecutarán separadamente del build y nunca desde una petición web. [Integración oficial de Drizzle y Neon](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon). La selección de versiones estables y del transporte para transacciones se verificará en esa fase.

## Sistema de diseño

Fuente común actual: `dist/design/tokens.css`, cargada antes de `styles.css`. Puede importarse en el layout raíz futuro y compartirse con el panel; el panel aún no existe.

| Token       | Valor               | Uso                     |
| ----------- | ------------------- | ----------------------- |
| `--purple`  | `#820AD1`           | Identidad y acciones    |
| `--dark`    | `#21152B`           | Fondos oscuros          |
| `--yellow`  | `#F5C542`           | Acentos                 |
| `--white`   | `#FFFFFF`           | Superficies             |
| `--gray`    | `#F7F7FA`           | Superficies secundarias |
| `--ink`     | `#17151C`           | Texto editorial         |
| `--lilac`   | `#F4EEFC`           | Fondos suaves           |
| `--heading` | Manrope, sans-serif | Titulares               |
| `--body`    | DM Sans, sans-serif | Lectura e interfaz      |

Se mantienen `--muted` y `--line`. La escala de espacios es 4, 8, 12, 16, 24, 32 y 48 px; radios 4/5/6 px; texto base 15 px; contenedor máximo 1264 px. Cabecera local compacta: mínimos 84/76/66 px. Los tokens de contenedor, texto base y cabecera ya se consumen; el resto permite adopción gradual sin sustituir mecánicamente medidas especiales.

Breakpoints vigentes: máximo 560 px (móvil), 800 px (tablet), 1100 px (intermedio) y mínimo 1500 px (pantalla amplia). Se conservan literales en `@media`: las variables CSS no se usan como condiciones de media queries. El futuro panel compartirá escalas; no tiene obligación de copiar el layout editorial.

No se han cambiado los originales del logo ni del favicon. Se mantienen el encuadre del logo horizontal, altura compacta y contenido actual. No se formatea masivamente el HTML/CSS legado para facilitar la revisión de estos cambios sensibles. Prettier sí cubre los tokens y el JavaScript.

## Lógica del frontend y límites

La entrada pasa de script clásico a módulo ES nativo (`type="module"`, diferido por el navegador). Sus imports relativos se sirven como archivos estáticos; Vercel no requiere bundler. Los datos y utilidades no dependen del DOM. Guardados mantiene la clave `np-saved`, filtra IDs inválidos y maneja almacenamiento denegado.

Estado, renderizado y eventos siguen en `app.js` deliberadamente. Próxima extracción: plantillas de tarjetas/diálogos con escape por contexto, estado explícito y controladores de eventos con desmontaje. Después se trasladan a componentes React conservando contratos `data-*`, textos, anclas y navegación. No se crearon capas ficticias ni se cambió el origen demo de los artículos.

El código existente todavía usa `innerHTML` con datos constantes. No introducir contenido externo hasta sanitizar y validar. Boletín, buscador y guardados conservan los límites de demostración documentados en la auditoría.

## Entornos y secretos

| Entorno           | Configuración                                                    | Datos                                                                |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| Local             | `.env.local` opcional, ignorado; `PORT` por defecto 4173         | Rama de desarrollo Neon por configurar por el propietario            |
| Unitarias/e2e/CI  | Sustitutos; e2e y CI fijan `NODE_ENV=test`, `DATABASE_URL` vacía | No acceso a producción; no se carga `.env.local` en test             |
| Vercel Preview    | Variables privadas específicas de Preview                        | Debe utilizar rama/base aislada; no se ha provisionado ni verificado |
| Vercel Production | Variables privadas existentes, sin cambios                       | Conexión existente; no se copiaron secretos                          |

`env:check` valida sintaxis y puerto sin abrir conexión. La URL es opcional para servir la landing y obligatoria al consultar Neon. `DATABASE_URL` inválida genera un error sin su valor. El cliente Neon conserva la consulta `SELECT 1`, timeout y respuestas HTTP anteriores. La validación no acredita disponibilidad, SSL, privilegios, aislamiento o backups.

No usar `NEXT_PUBLIC_DATABASE_URL` ni prefijos públicos para secretos. No exportar el objeto de configuración privada al frontend. En la futura capa TypeScript se incorporará validación de entradas compartida, por ejemplo Zod, cuando existan contratos de API reales; la validación del servidor seguirá siendo obligatoria.

## Calidad y dependencias

- ESLint + `@eslint/js` + `globals`: reglas recomendadas y ámbitos Node/navegador, mediante configuración plana. [Documentación oficial](https://eslint.org/docs/latest/use/configure/configuration-files).
- Prettier y EditorConfig: formato consistente sin reformatear el diseño legado ni el documento histórico.
- `@playwright/test`: navegador real, interacciones y anchuras 1440/800/390. Edge instalado en Windows, Chromium en CI Linux. Recursos externos sustituidos para resultados repetibles.
- `node:test`: API, validación y almacenamiento, sin consultas SQL reales.
- GitHub Actions: instalación reproducible, lint, formato, sintaxis y pruebas; permisos de lectura, sin secretos ni pasos de publicación. No se activa remotamente hasta un futuro push autorizado.

Estas son cinco dependencias directas de desarrollo fijadas en lockfile; producción conserva solo `@neondatabase/serverless`. No se añaden React, Next.js, TypeScript, Drizzle ni Zod antes de usarlos. Hoy no existe build de frontend ni comprobación de tipos: `check` es sintaxis y **no se presenta como compilación**. Al incorporar TypeScript/Next se exigirán `tsc --noEmit` y `next build` en CI, además de los controles actuales.

## Despliegue y límites operativos

`vercel.json` queda sin cambios: `framework: null`, build vacío, instalación `npm ci`, estáticos en `dist` y API en `api/`. Dominio y DNS tampoco cambian. Sites es una configuración histórica estática que no ejecuta Neon; no es el destino de esta transición.

No hay escrituras, migraciones SQL, autenticación, CMS, agentes o conectores nuevos. Faltan la adopción del framework, identidad, seguridad del contenido, modelos editoriales y validación de aislamiento real entre entornos. La arquitectura no garantiza escalabilidad por nombres de carpetas: se medirá rendimiento, volumen y costes cuando se incorporen datos.
