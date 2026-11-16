# Reporte frontend — Cierre FASE 3

Fecha: 2026-11-16 (entorno del agente)

## Resumen
Se cerró (parcial/pragmático) la FASE 3 de motion y pulido UI en `frontend/` con tokens centralizados, transiciones de página/tema, mejoras en componentes interactivos (Modal/Drawer/Tabs/Select/Toast/Sidebar/Topbar), hooks de rendimiento/visibilidad y migración parcial de magic numbers a `constants/animations.ts`. Verificación automatizada en verde: `npx tsc --noEmit`, `npm test`, `npm run build`.

## Commits (FASE 3 cierre, por bloque)
- `8e65612` `feat(motion): inicia FASE 3 con tokens y transiciones base` (parcial previo): tokens/variants base, App MotionConfig, layout/tema/modal/drawer/toast iniciales.
- `feat(motion): tema y transición de página`: `useLowEndDevice`, variantes de página sin blur en low-end/reduced-motion, scroll-to-top condicional (no en POP), `theme-transition` a `var(--dur-base)`/`var(--ease-in-out)` con limpieza en toggles rápidos, y reemplazo de colores hardcodeados puntuales por tokens.
- `feat(layout): sidebar y tooltips`: `Tooltip` reutilizable (delay 300ms, fade+offset, foco/Esc, `role="tooltip"`), tooltip en `SidebarItem` colapsado y botones de ícono de Topbar, indicador activo con `SPRING.soft`, dropdown notificaciones con variantes compartidas.
- `feat(ui): tabs, select y toasts`: `TabPanels/TabPanel` API + cross-fade direccional (base) y wrappers `AnimatePresence` en consumidores clave, Select con type-ahead (buffer 500ms, normaliza tildes), scroll al activo y estilos hover/activo mejorados; toasts con swipe móvil, pausa de progreso y cola máx. 4.
- `perf(motion): visibilidad y tokens`: `usePageVisibility` y `usePauseAnimationsWhenHidden` (`data-paused` en `<html>`), pausa de orbes/skeletons según visibilidad, tokenización de motion en componentes clave (`AuthSuccess`, `Stepper`, `PasswordStrength`, `SidebarNav`, `ProfilePicker`, `Calendar`, `LoginPage`, etc.) y fixes de compatibilidad de APIs.

> Nota: si los hashes difieren en tu historial local, usa los mensajes de commit como referencia.

## Decisiones
- **`useLowEndDevice`** (`frontend/src/hooks/useLowEndDevice.ts`): heurística memoizada (`hardwareConcurrency <= 4`, `deviceMemory <= 4` si existe, o `prefers-reduced-data: reduce`). Tipado sin `any` vía `Navigator & { deviceMemory?: number }`. Se usa para degradar transiciones de página (sin blur, easing/duración simples) junto con `prefers-reduced-motion`.
- **Cambio de tema / `startViewTransition`**: solo para toggle de tema (`ThemeProvider`), con reveal circular cuando hay origen y soporte; fallback a clase temporal `theme-transition` (240ms, vars de tokens). No se usa `startViewTransition` para cambios de ruta para evitar choques con `AnimatePresence` de framer-motion. Limpieza de timer en toggles rápidos/desmontaje.
- **Rutas**: `DashboardLayout` mantiene `key={location.pathname}` (sin query/state) y `AnimatePresence mode="wait"` con variante simplificada en reduced/low-end; scroll-to-top solo en navegación no-`POP`.
- **Pausa de animaciones**: combinación de JS (`usePageVisibility`, pausa de framer/orbes/skeletons) y CSS (`html[data-paused] * { animation-play-state: paused !important; }`) para animaciones infinitas al ocultar pestaña.
- **LazyMotion / `domAnimation`**: **no adoptado** en este cierre. Medición comparativa requerida (antes/después, ≥10 KB gzip) y migración segura a `m.*` no completada en todo el árbol; además hay uso de `layout/layoutId/drag` que exigiría evaluar `domMax` caso a caso. Decisión: posponer hasta poder medir y migrar mecánicamente con bajo riesgo.
- **Tokens/magic numbers**: se centralizó en `frontend/src/constants/animations.ts` y se migraron variants y componentes prioritarios; quedan algunos valores puntuales justificados por comportamiento específico (p. ej. órbita decorativa `DURATION.slower * 80` en `LoginPage`, buffers/umbrales funcionales de interacción) documentados en código.

## 3.2 Doble render / saltos (revisión)
- **Confirmado**: transiciones de página usan key por `location.pathname` en `DashboardLayout/PageTransition`; `PageTransition` variantes memoizadas a nivel de módulo/hook.
- **Ajustado**: contenedor de ruta con altura mínima (`min-h-[50vh]`) para reducir saltos; variantes sin blur en low-end/reduced-motion.
- **Revisado (sin cambios estructurales mayores)**: `PeriodsPage`, `pages/admin/Dashboard.tsx`, `pages/user/Dashboard.tsx` realizan fetch en `useEffect` al montar y renderizan skeletons durante carga; los skeletons pueden diferir levemente en altura del contenido final (posible shift menor). No se detectaron keys dependientes de query/state en `AnimatePresence` de rutas. Recomendado en iteración posterior: normalizar alturas de skeleton/contenido y añadir cancelación (`AbortController`/flag `ignore`) en efectos async para StrictMode/red navegable lenta.

## Cobertura de tema y componentes opacos
- Se reemplazaron casos puntuales detectados (`ToastHost` hover, toggle en `admin/PermissionsPage`) por tokens/superficies del tema.
- Revisados a nivel de código `Select`, `Modal`, `Calendar` y estilos globales para uso predominante de tokens CSS.
- **Riesgo/no verificado completamente**: `recharts` y algunos SVG/componentes pueden requerir recalcular colores desde variables CSS al cambiar `html.dark` en tiempo real; no se implementó suscripción reactiva explícita a cambios de clase en todos los charts (verificación visual pendiente).

## Verificación
- `cd frontend && npx tsc --noEmit` ✅
- `cd frontend && npm test` ✅ (31 tests, 2 archivos)
- `cd frontend && npm run build` ✅ (chunk principal >500 kB, warning preexistente)
- `grep` de `console.log` en `src`: sin hallazgos nuevos introducidos.
- Playwright: `npx --prefix frontend playwright install chromium` ✅ (instalación completada). Capturas automatizadas en `docs/after-fase3/` y medición de long frames **no ejecutadas** en este cierre (requiere app en ejecución + flujo de autenticación/datos); ver `docs/CHECKLIST-MANUAL-FASE3.md`.

## No verificado visualmente / pendientes menores
- Validación visual en navegador: sticky/scroll real, 10 cambios de ruta, ausencia de flash/opacos en todos los componentes, foco/teclado completo, swipe en dispositivo táctil, pausa en pestaña oculta (Task Manager), 390px y CPU 4×.
- 3.6 acordeón de secciones con API/animación exacta solicitada y comportamiento del panel lateral existente alineado solo parcialmente (sin romper lógica actual).
- Migración exhaustiva de todos los consumidores de tabs a `TabPanels` animado; se aplicaron wrappers direccionales en casos clave.
- Tokenización exhaustiva de **todos** los magic numbers de motion en `src` (quedan literales puntuales/CSS o casos justificados).
- `LazyMotion` diferido por falta de medición antes/después y migración segura.

## Riesgos
- Cambios amplios en variants/componentes animados: posible regresión sutil en timings o interacciones no cubiertas por tests (baja/media).
- `startViewTransition`/clip-path depende de soporte del navegador; fallback implementado pero no validado visualmente en todos los entornos.
- Sin capturas comparativas automatizadas, la validación final de “polish premium” queda sujeta a checklist manual.
