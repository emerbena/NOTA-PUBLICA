# Estado previo a la Fase 1

Comprobado el 14 de noviembre de 2026 antes de modificar código.

- Raíz Git: `nota-publica/`. Rama: `main`.
- HEAD local: `0b24670`, logo horizontal.
- `git ls-remote` confirma `main` remoto en `c0bb0b157023f5c882c80da2c7e94b4fb6ec8d60` (conexión Neon). No se hizo fetch, merge ni push.
- Cambios locales previos: `dist/index.html`, `dist/styles.css`; sin seguimiento: `dist/favicon.png` y `AUDITORIA_NOTA_PUBLICA.md`.
- Diseño vigente local: `dist/index.html`, `dist/styles.css`; comportamiento: `dist/app.js`.
- Marca local: `dist/assets/nota-publica-horizontal.png` y `dist/favicon.png`. Se conservan los binarios y el favicon SVG anterior.
- La lectura HTTP de producción muestra marca tipográfica anterior, `favicon.svg` y script clásico `app.js`. No muestra el logo horizontal local. Es compatible con la versión anterior al commit local de marca; el SHA exacto desplegado no se puede certificar por ese HTML sin acceso al panel de Vercel.
- El dominio público sigue siendo `https://www.notapublica.com/`. La Fase 0 comprobó SELECT 1 en su API; esta fase no cambia variables ni consulta datos privados.

La diferencia local/remoto/producción es intencionalmente conservada. La referencia para preservar el diseño en esta fase es el árbol local completo, incluidos los cambios sin commit, no el HTML antiguo de producción. No hay autorización para commit, push, despliegue o cambios de credenciales.

Decisión de transición: organizar el código estático existente, extraer tokens y módulos puros, validar configuración y añadir calidad/CI. Next.js, TypeScript y Drizzle quedan definidos como destino, con adopción en una fase posterior; no se cambia aún el runtime ni el contrato de despliegue estático de Vercel.
