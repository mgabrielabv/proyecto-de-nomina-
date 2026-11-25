# Checklist manual — FASE 1 y FASE 2

> Entorno sin navegador/Playwright disponible durante la implementación. Verificar manualmente en Chrome/Chromium (claro y oscuro) a 1920×1080 y 390×844.

## FASE 1 — Validaciones y contraseña
- [ ] **Autofill (Chrome, gestor de contraseñas):** en `/login` la etiqueta de "Nombre de usuario" y "Contraseña" queda flotada, sin solaparse con el texto autocompletado. Probar en claro y oscuro.
- [ ] **Payload sin `trim`:** iniciar sesión con una contraseña válida y confirmar en Network que el valor enviado es exactamente el escrito (sin recorte de espacios internos). La app rechaza espacios en bordes/solo espacios en cliente antes de enviar.
- [ ] **Registro/cambio rechaza:** `        ` (8 espacios), 8 tabs, 8 NBSP, `" Abcdef12"`, `"Abcdef12 "`, `"abcdefgh"`, `"12345678"`, `"Abcdef1"` (7 chars), contraseñas >72 bytes UTF-8 (ej. `"ñ".repeat(37)+"a1"`, emoji repetido largo), 200 caracteres.
- [ ] **Acepta:** `"Abcdef12"`, `"mi clave 2026"` (passphrase con espacios internos), `"ñ".repeat(30)+"a1"` (≤72 bytes).
- [ ] **Login:** no muestra reglas de complejidad para contraseñas antiguas; sí rechaza vacía, solo espacios y >72 bytes.
- [ ] **Contador:** visible en foco o ≥80% del límite en campos con `maxLength`; cuenta **bytes** (tope 72) en contraseña. No empuja el layout.
- [ ] **Pegado largo:** se recorta al límite y muestra toast warning "Se recortó el texto pegado al límite permitido." (rate-limited).
- [ ] **Checklist de fortaleza (registro):** muestra requisitos y estados correcto/pendiente/error según interacción.
- [ ] **Bloq Mayús:** chip "Bloq Mayús activado" bajo el campo de contraseña.
- [ ] **Búsquedas:** `SearchInput` y buscador del Topbar limitados a 100 caracteres.

## FASE 2 — UI y tabla
- [ ] **Sidebar:** etiquetas visibles "Horas extras", "Pre-nómina", "Préstamos", "Períodos", "Mis recibos" (sin llaves técnicas pegadas). Títulos de página/ruta coherentes (mayúscula inicial).
- [ ] **`/payroll/periodos`:** una sola barra de scroll de página (sin scroll vertical anidado en la tabla). Encabezado `thead` permanece visible al hacer scroll (`position: sticky`, `top` = alto del Topbar). Comprobar que `overflow-clip` del contenedor no rompe el sticky.
- [ ] **Scroll horizontal:** solo si la tabla desborda; scrollbar fina (`.scroll-thin`).
- [ ] **Filas:** altura mínima ~56px, hover en toda la fila, foco por teclado (Tab + Enter en fila clicable).
- [ ] **Columna "Procesado":** sin valor muestra "—" atenuado (aria-label "Sin procesar"); con valor muestra fecha y hora en segunda línea.
- [ ] **Badges:** más legibles (`text-[13px]`, `px-3 py-1`), punto/ícono por estado; "Procesado" y "Pagado" distinguibles sin color (reloj vs check). Contraste AA en claro y oscuro.
- [ ] **Acción "Ver detalle":** botón más alto, ícono + texto (en móvil ícono/label compacto con `aria-label`).
- [ ] **Estado vacío:** `EmptyState` reutilizable en tablas sin resultados (ilustración + título + descripción).
- [ ] **Skeleton:** filas con forma de tabla (anchos variados) durante carga.
- [ ] **Responsive 390px:** sin scroll horizontal en login, dashboard y períodos.

## Verificación automática ejecutada
- `npx tsc --noEmit`: OK
- `npm test` (vitest): OK (31 pruebas: validación contraseña + sanitize/money)
- `npm run build`: OK

## Cómo verificar sticky de thead sin romper overflow
- El contenedor de tabla usa `overflow-clip` (no `overflow-hidden`) para permitir `position: sticky` en `thead` respecto al viewport/scroll de página.
- `--topbar-h` se define en el layout (`5rem`) y el `thead` usa `top: var(--topbar-h, 5rem)`.
- Si se observa que el sticky no aplica, revisar ancestros con `overflow`, `transform` o `contain` que creen un nuevo contexto de scroll y ajustar solo el contenedor necesario.
