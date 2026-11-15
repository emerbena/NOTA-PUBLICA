# Resultado de la Fase 1

14 de noviembre de 2026. Fundación técnica completada localmente. Sin commit, push, despliegue ni modificación de credenciales. La siguiente fase requiere autorización.

## Entrega

- Landing preservada, con su logo horizontal, favicon PNG y cabecera compacta previamente modificados.
- Tokens CSS compartibles y módulos ES de datos, persistencia local, configuración y utilidades.
- Configuración privada validada en servidor; entorno local opcional y pruebas independientes de secretos.
- ESLint, Prettier, pruebas unitarias/e2e y workflow de GitHub Actions.
- Arquitectura Next.js/TypeScript/Drizzle y plan de transición definidos, sin instalar aún esos runtimes ni cambiar Vercel.

## Archivos creados en esta fase

```text
ESTADO_INICIAL_FASE_1.md
ARQUITECTURA_NOTA_PUBLICA.md
PLAN_MIGRACION.md
RESULTADO_FASE_1.md
.editorconfig
.prettierignore
.prettierrc.json
eslint.config.js
playwright.config.js
.github/workflows/quality.yml
dist/design/tokens.css
dist/modules/data/stories.js
dist/modules/data/info-pages.js
dist/modules/services/saved-stories.js
dist/modules/shared/config.js
dist/modules/shared/utils.js
lib/env.js
lib/load-local-env.js
scripts/check-env.mjs
scripts/check-source.mjs
test/env.test.js
test/frontend.test.js
test/e2e/landing.spec.js
```

También se generaron copias de referencia y capturas en `.artifacts/`, y resultados temporales de pruebas; están ignorados. No son archivos de producción.

## Archivos modificados

| Archivos                                                 | Cambio                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `README.md`, `.env.example`                              | Instrucciones, comandos, entornos y límites                                 |
| `.gitignore`                                             | Excluir capturas y resultados de pruebas                                    |
| `package.json`, `package-lock.json`                      | Comandos y herramientas de calidad reproducibles                            |
| `dist/index.html`                                        | Añadir carga de tokens y cambiar script a módulo; conservar cambios previos |
| `dist/styles.css`                                        | Extraer variables y consumir tokens con valores equivalentes                |
| `dist/app.js`                                            | Extraer datos/utilidades/guardados y formatear; conservar comportamiento    |
| `lib/database.js`                                        | Validar la URL privada antes de crear el cliente                            |
| `server.mjs`                                             | Carga/configuración centralizadas y MIME PNG correcto                       |
| `scripts/check-database.mjs`                             | Carga de entorno compartida y formato                                       |
| `lib/database-status.js`, `test/database-status.test.js` | Solo formato consistente; mismo contrato y pruebas                          |

`AUDITORIA_NOTA_PUBLICA.md` y `dist/favicon.png` ya estaban sin seguimiento antes de esta fase. No deben atribuirse como archivos nuevos de esta implementación. El binario `dist/assets/nota-publica-horizontal.png`, el favicon y `vercel.json` mantienen los SHA-256 registrados al inicio.

## Dependencias

Cinco dependencias directas añadidas, todas de desarrollo:

| Dependencia        | Versión fijada | Justificación                                 |
| ------------------ | -------------- | --------------------------------------------- |
| `eslint`           | 10.15.0        | Errores estáticos de JavaScript               |
| `@eslint/js`       | 10.0.1         | Reglas recomendadas oficiales                 |
| `globals`          | 17.14.0        | Ámbitos Node y navegador                      |
| `prettier`         | 3.10.1         | Formato verificable                           |
| `@playwright/test` | 1.65.1         | Regresión funcional y responsive en navegador |

La dependencia de ejecución sigue siendo `@neondatabase/serverless` 1.2.1. La instalación informó cero vulnerabilidades conocidas en ese momento; no constituye una auditoría integral de seguridad. No se añadieron ORM, autenticación o SDKs sin uso.

## Validación

| Verificación                     | Resultado                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run verify`                 | Sintaxis, lint, formato y 10 pruebas unitarias correctos                              |
| `npm run env:check`              | Correcto para landing sin credenciales locales; no se abre conexión                   |
| E2e sobre la copia previa        | 4/4 correctos                                                                         |
| E2e sobre versión reorganizada   | 4/4 correctos                                                                         |
| Comparación visual antes/después | PNG idénticos por SHA-256 a 1440, 800 y 390 px bajo el mismo navegador/entorno        |
| Artículos y textos informativos  | Comparación estructural con copia previa: idénticos                                   |
| HTML previo                      | Idéntico tras descontar las dos incorporaciones deliberadas: tokens y `type="module"` |
| Logo, favicon y Vercel           | SHA-256 sin cambios                                                                   |

La primera captura móvil encontró una espera en imágenes lazy del propio test; se corrigió forzando su carga en la prueba. El entorno restringido de Windows impedía cerrar el servidor del ejecutor; la comprobación final se ejecutó fuera de esa restricción y terminó con código 0. La comparación entre contextos de usuario distintos mostró diferencias de rasterización/fuentes; por ello se repitió la captura de la **copia original** y la versión nueva en el mismo contexto, con igualdad final. No se reemplazó la referencia por la versión modificada para ocultar diferencias.

Las pruebas visuales usan sustitutos deterministas de fuentes/fotos remotas; confirman paridad bajo esas condiciones. No certifican disponibilidad de proveedores externos, WCAG, Core Web Vitals ni comportamiento en todos los navegadores. No hay TypeScript/build todavía; estos controles se incorporarán cuando exista la aplicación Next.

## Diferencias y pendientes

Antes: script monolítico, tokens dentro del CSS, cuatro pruebas API y sin CI. Ahora: separación inicial, tokens reutilizables, validación privada, diez pruebas unitarias, cuatro e2e y workflow preparado. El frontend sigue estático, con datos demo y la misma API de disponibilidad.

Pendientes: adopción gradual de Next/TypeScript y Drizzle, seguridad de contenido externo, autenticación/permisos, modelos/migraciones, aislamiento real de ramas Neon y despliegue futuro autorizado. No hay CMS, panel, IA ni publicación multicanal. Producción sigue en su versión anterior de marca; el SHA exacto desplegado no se certificó desde el panel privado. GitHub Actions aún no se ejecutó remotamente porque no se ha hecho push.

No se borraron archivos del proyecto, no se revirtieron cambios del usuario y no se hicieron operaciones destructivas Git. La landing local sigue funcionando según las pruebas anteriores. La producción no fue modificada.
