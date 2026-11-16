# Checklist manual FASE 3 (cierre)

Verificación manual recomendada en navegador (Chrome/Chromium). Ejecutar en `frontend/` con `npm run dev` o `npm run preview` tras `npm run build`.

## Preparación
- [ ] Probar en claro y oscuro (toggle de tema).
- [ ] Probar en 1920×1080 y 390×844 (responsive/móvil).
- [ ] Activar `prefers-reduced-motion: reduce` en DevTools/OS y repetir puntos clave.
- [ ] Probar throttling CPU 4× en Performance/Rendering para evaluar fluidez.

## Tabla y scroll
- [ ] Abrir vista con `ResponsiveTable` (p. ej. Períodos): confirmar que no hay scroll vertical anidado dentro de la tabla, que el header se mantiene sticky bajo la topbar y que el scroll horizontal aparece solo cuando es necesario.
- [ ] Verificar que filas, estados vacíos/loading y acciones se ven alineados sin saltos de layout.

## Rutas y transiciones (10 cambios seguidos)
- [ ] Navegar 10 veces seguidas entre rutas del dashboard (sidebar/menú) sin pausas largas.
- [ ] Confirmar que no hay pantalla en blanco persistente, “doble render” visible ni saltos grandes de altura durante la transición.
- [ ] Confirmar que al navegar normal la vista hace scroll al inicio; al usar atrás/adelante del navegador el scroll no debe forzarse al inicio.
- [ ] Con `prefers-reduced-motion` o en equipo modesto: transición debe ser simple (sin blur) y sin mareos.

## Cambio de tema
- [ ] Alternar tema claro/oscuro varias veces seguidas (incluye doble clic/cambios rápidos).
- [ ] Verificar que no hay flash fuerte, que no quedan áreas “opacas” con fondos hardcodeados y que la clase temporal de transición se limpia siempre.
- [ ] Si el navegador soporta View Transitions: comprobar reveal circular desde el toggle; si no, fallback suave por transición de colores.
- [ ] Revisar componentes sensibles: Modal, Drawer, Select, Calendar, tablas, toasts y gráficos (recharts) mantienen legibilidad/colores coherentes.

## Modal y Drawer (foco y accesibilidad)
- [ ] Abrir/cerrar Modal y Drawer con mouse y teclado: foco queda atrapado dentro mientras está abierto.
- [ ] Al cerrar, el foco regresa al elemento que disparó la apertura.
- [ ] `Esc` cierra Modal/Drawer.
- [ ] Con contenido largo: scroll interno funciona y el body no salta por scrollbar (compensación de lock).
- [ ] En móvil (Drawer): arrastrar horizontalmente para cerrar funciona con umbral/velocidad razonable.

## Select, Tabs y Sidebar (teclado)
- [ ] Select: abrir con Enter/Espacio, navegar con flechas, confirmar con Enter, cerrar con Esc/Tab, type-ahead (teclear letras, ignora tildes) salta a opción y el ítem activo hace scroll visible (`nearest`).
- [ ] Tabs: cambiar con click y teclas de navegación; el indicador activo se mueve suavemente y el contenido/panel asociado cambia con cross-fade donde aplique.
- [ ] Sidebar: ítem activo indicado claramente; en modo colapsado mostrar tooltip en hover y foco de teclado, cerrar tooltip con Esc. Navegación por teclado sin pérdida de foco.

## Toasts
- [ ] Disparar varios toasts: máximo 4 visibles (cola).
- [ ] Barra de progreso avanza y se pausa al hover/focus; reanuda al salir.
- [ ] En móvil: swipe horizontal para descartar (umbral/velocidad) con pausa de progreso durante el arrastre.

## Visibilidad de pestaña y animaciones
- [ ] Con animaciones infinitas visibles (orbes/fondo/skeletons), cambiar a otra pestaña y volver: confirmar que se pausan/reanudan (atributo `data-paused` en `<html>` y/o `document.hidden`) sin consumo innecesario.
- [ ] En Task Manager de Chrome, comparar CPU con pestaña visible vs oculta (debe bajar al estar oculta).

## Responsive y contraste
- [ ] Revisar 390px: sin overflow horizontal inesperado, controles tocables, menús/drawers usables.
- [ ] Verificar contraste AA en textos, badges, estados hover/active/focus y bordes en claro/oscuro.
