# Checklist manual FASE 2

## ResponsiveTable — encabezado sticky (regresión corregida)

### Caso: /payroll/periodos con 12+ filas
1. Abrir `/payroll/periodos` con datos suficientes (≥12 filas) en escritorio (≥ md).
2. Hacer scroll vertical lento hasta el final de la página.
3. Verificar:
   - [ ] El encabezado de la tabla permanece fijo justo debajo del Topbar (sin separarse ni “flotar” sobre las filas).
   - [ ] El encabezado es opaco (no se transparenta el contenido de las filas por debajo, sin `backdrop-blur` translúcido en el header).
   - [ ] No aparece franja vacía arriba de la tabla ni desplazamiento vertical extraño (~80px) del header.
   - [ ] La línea/separador inferior del encabezado se mantiene visible al hacer scroll.
   - [ ] Las esquinas redondeadas de la card se conservan (primera/última celda del bloque visible).
4. Repetir en tema claro y oscuro.
5. Verificar en 390px: la tabla usa vista móvil por tarjetas (sin cambios de comportamiento/regresión).

### Verificación técnica (opcional, con Playwright/DevTools)
- Con la tabla visible y tras hacer scroll ~400px, `th.getBoundingClientRect().top` debe ser igual al alto real del Topbar (o `0` si el scroller estuviera bajo el Topbar).
- `getComputedStyle(th).backgroundColor` debe tener alpha `1` (fondo opaco).
