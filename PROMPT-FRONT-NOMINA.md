# Alineación del front con el backend

Documento de traspaso para el repositorio del frontend. El backend ya tiene
**implementado, probado y desplegado** todo lo que se describe acá; este archivo
fija los contratos exactos, los tipos, los servicios y las pantallas.

**Estado: las specs 013, 014 y 015 están implementadas y verificadas en el
front** (más los ajustes transversales de la sección 0). La sección 9 registra
cómo se comprobó cada criterio. La única excepción sigue siendo la aprobación
de préstamos, que depende del backend (ver el aviso al final de la sección 0).

- Backend: `Payroll-Backend` (Express + PostgreSQL/Neon).
- Front: este repositorio (`frontend/`, React + TypeScript + Vite).
- Toda llamada al negocio pasa por
  `execute(subsystem, class, method, params)` de
  `frontend/src/features/auth/services/apiClient.ts`. La sesión viaja en
  cookies `httpOnly`; `credentials: 'include'` ya está resuelto en el cliente.
- El backend responde `{ error: "mensaje" }` con `400`, `401`, `403`, `404`,
  `409`, `413` o `429`. `execute` ya lanza `ApiError` con `status` y `message`.
- **El servidor es la autoridad.** Ocultar un botón o una ruta no revoca el
  método; el backend valida el permiso en cada llamada.

---

## 0. Resumen de los cambios

| # | Cambio | Spec | Dónde | Estado |
|---|---|---|---|---|
| 1 | Resumen de nómina: `Period.resumen` y `Period.listarConTotales` | 013 | `payrollService.ts`, `PeriodsPage` | ✅ |
| 2 | PDF del recibo: `Receipt.generarPdf` + descarga | 014 | `payrollService.ts`, `MyReceiptsPage`, `PeriodsPage`, `utils/download.ts` | ✅ |
| 3 | Registro de personas y despidos: `Payroll/Employee` (5 métodos) | 015 | servicio, tipos, `PersonasPage`, `DespidosPage`, rutas y menú | ✅ |
| 4 | Entradas nuevas en `MENU_ROUTE_MAP` y `MENU_LABEL_MAP` | 015 | `store/menuStore.ts` | ✅ |
| 5 | Límite de texto de la descripción del despido | 015 | `constants/limits.ts` | ✅ |
| 6 | Quitar `email` y `monto_salario` obsoletos de `PersonaItem` | — | `payrollService.ts` | ✅ |

Todo lo demás (subsistemas `Payroll`, `Security` y `Session`) **ya está
alineado**; el inventario de la sección 5 lo verifica método por método.

> **Aviso de préstamos:** el front ya llama `Payroll/Loan/aprobar` y
> `Payroll/Loan/rechazar`, y el código del backend los tiene, pero la base de
> desarrollo todavía **no** (la migración `015_prestamos_aprobacion.sql` no se
> aplicó y comparte número con `015_sesion.sql`). Esos dos botones responden
> `403` hasta que se resuelva del lado del backend; no es parte de las specs
> 013–015.

---

## 1. Spec 013 — Resumen de nómina

### 1.1 Contrato

Dos métodos nuevos de `Payroll/Period`, de solo lectura.

#### `Period.resumen(periodoId)`

```ts
execute<ResumenNomina>('Payroll', 'Period', 'resumen', [periodoId]);
```

```ts
export interface ResumenNomina {
  periodo: PeriodoNomina & {
    preNominaId: string | null;
    preNominaVersion: number | null;
  };
  totales: {
    personas: number;                // ya viene como number, no string
    total_asignaciones: string;      // "12345.67"
    total_deducciones: string;
    total_neto: string;
    total_aporte_patronal: string;   // costo del patrono, NO está en el neto
    costo_total: string;             // asignaciones + aporte_patronal
  };
  por_concepto: {
    codigo: string;
    nombre_concepto: string;
    tipo_concepto: 'ASIGNACION' | 'DEDUCCION' | 'APORTE_PATRONAL' | string;
    categoria: string | null;
    lineas: number;                  // ya viene como number
    total: string;
  }[];
}
```

#### `Period.listarConTotales()`

```ts
execute<PeriodoConTotales[]>('Payroll', 'Period', 'listarConTotales', []);
```

```ts
export interface PeriodoConTotales extends PeriodoNomina {
  personas: number;
  total_asignaciones: string;
  total_deducciones: string;
  total_neto: string;
  total_aporte_patronal: string;
  costo_total: string;
  preNominaId: string | null;
  preNominaVersion: number | null;
}
```

Devuelve el histórico completo, del período más reciente al más viejo.

### 1.2 Reglas que la pantalla debe respetar

- Los montos llegan como **texto** con dos decimales. Para sumar en el cliente
  usar `aCentavos` / `deCentavos` / `centsToMoneyString` (enteros en céntimos,
  como ya hace `PeriodsPage`); nunca `parseFloat` ni `+= Number(...)`. Para
  pintar, `formatMoney`.
- `total_aporte_patronal` **no** forma parte de `total_neto` ni de
  `total_deducciones`. Se muestra como línea aparte y solo se suma en
  `costo_total`.
- Los recibos `ANULADO` no cuentan.
- Un período sin recibos devuelve `personas: 0` y montos `"0.00"` (nunca
  `null`).
- `por_concepto` ya viene ordenado: asignaciones, deducciones, aporte patronal
  y el resto.

### 1.3 Qué construir

1. **Servicio** en `frontend/src/features/payroll/services/payrollService.ts`:

```ts
export const PeriodService = {
  // ...lo que ya existe
  resumen: (periodoId: string) =>
    execute<ResumenNomina>('Payroll', 'Period', 'resumen', [periodoId]),

  listarConTotales: () =>
    execute<PeriodoConTotales[]>('Payroll', 'Period', 'listarConTotales', []),
};
```

2. **`PeriodsPage`**: cambiar el origen de la tabla de `Period.listar()` a
   `listarConTotales()` para mostrar, por fila, personas, asignaciones,
   deducciones, neto y costo total. Mantener las acciones existentes
   (procesar, pagar, ver, anular, pre-nómina).

3. **Detalle del período**: un panel o modal con:
   - Tarjetas: personas, asignaciones, deducciones, neto, aporte patronal y
     costo total. El aporte patronal con una nota visible: “costo del patrono,
     no se descuenta al empleado”.
   - Tabla de `por_concepto` con código, nombre, tipo y total. Agrupar
     visualmente por `tipo_concepto`.

4. **Formato**: `formatMoney` para los montos y `formatFechaLocal` para las
   fechas del período.

### 1.4 Permisos

`RRHH`, `GerenteRRHH`, `Administrador` y `Superusuario`. `Empleado` recibe
`403`. No hay opción de menú nueva: el resumen vive dentro de la pantalla de
períodos (`/payroll/periodos`).

---

## 2. Spec 014 — PDF del recibo

### 2.1 Contrato

```ts
execute<ReciboPdf>('Payroll', 'Receipt', 'generarPdf', [reciboId]);
```

```ts
export interface ReciboPdf {
  nombreArchivo: string;     // "recibo-V-14567890-2026-11-15.pdf"
  mimeType: 'application/pdf';
  tamanioBytes: number;
  contenidoBase64: string;   // PDF completo, sin el prefijo data:
}
```

- El PDF se arma en el servidor; el front no compone nada.
- **`Empleado` solo puede descargar sus propios recibos.** Si pide el de otra
  persona, el backend responde `403`. `RRHH`, `GerenteRRHH`, `Administrador` y
  `Superusuario` pueden descargar cualquiera.
- `404` si el recibo no existe; `400` si el id viene vacío.

### 2.2 Qué construir

1. **Servicio**:

```ts
generarPdf: (reciboId: string) =>
  execute<ReciboPdf>('Payroll', 'Receipt', 'generarPdf', [reciboId]),
```

2. **Utilidad de descarga** (por ejemplo `frontend/src/utils/descargarPdf.ts`):

```ts
export function descargarPdfBase64(pdf: {
  nombreArchivo: string;
  mimeType: string;
  contenidoBase64: string;
}) {
  const binario = atob(pdf.contenidoBase64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) {
    bytes[i] = binario.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: pdf.mimeType });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = pdf.nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
```

3. **`MyReceiptsPage`** (empleado): botón “Descargar PDF” por recibo, con estado
   de carga por fila y `toast` de error.
4. **`PeriodsPage`** (gestores): en la tabla de recibos del período, botón de
   descarga por recibo. Si el backend responde `403`, mostrar el mensaje tal
   cual.
5. **Accesibilidad**: el botón debe tener `aria-label` con el período o el
   nombre del archivo; deshabilitarlo mientras se genera.

### 2.3 Permisos

`RRHH`, `GerenteRRHH`, `Administrador`, `Superusuario` y `Empleado`.

---

## 3. Spec 015 — Registro de personas y despidos

Clase nueva: `Payroll/Employee`. Cinco métodos.

> **Nombres de campo:** `Employee` devuelve las columnas tal como están en la
> base (**snake_case**), sin traducir. La única excepción de todo el contrato
> es `preNominaId` / `preNominaVersion`, que son alias en camelCase (igual que
> en `Period.listar` y `Period.ver`). No inventar un mapeo a camelCase en el
> front: los tipos de abajo ya reflejan la respuesta real.

### 3.1 Contrato

#### `Employee.listar(estado?)`

```ts
execute<PersonaRegistro[]>('Payroll', 'Employee', 'listar', [estado]);
// estado: 'ACTIVO' | 'INACTIVO' | 'TODOS'  (por defecto 'TODOS')
// También se acepta [] para usar el valor por defecto.
```

```ts
export interface PersonaRegistro {
  id: string;
  cedula: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  email: string | null;
  nro_tlf: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
  usuario_id: string | null;
  username: string | null;
  usuario_activo: boolean | null;
  contrato_id: string | null;
  contrato_estado: 'VIGENTE' | 'SUSPENDIDO' | 'FINALIZADO' | null;
  fecha_inicio: string | null;   // "YYYY-MM-DD"
  fecha_fin: string | null;      // "YYYY-MM-DD"
  tipo_pago: 'POR_HORA' | 'SALARIO_FIJO' | null;
  frecuencia_pago: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | null;
  cargo: string | null;
  despido_id: string | null;
  despido_motivo: MotivoDespido | null;
  fecha_despido: string | null;
}
```

Devuelve una fila por persona con su contrato más relevante (vigente primero,
luego el más reciente) y su último despido. Ordenado por apellido y nombre.

#### `Employee.ver(personaId)`

```ts
execute<PersonaDetalle>('Payroll', 'Employee', 'ver', [personaId]);
```

```ts
export interface PersonaFicha {
  id: string;
  cedula: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  fecha_nacimiento: string | null;
  sexo: 'M' | 'F' | null;
  estado_civil: string | null;
  nro_tlf: string | null;
  email: string | null;
  direccion: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
  created_at: string;
  updated_at: string | null;
  usuario_id: string | null;
  username: string | null;
  usuario_activo: boolean | null;
  debe_cambiar_clave: boolean | null;
  ultimo_acceso: string | null;
}

export interface PersonaDetalle {
  persona: PersonaFicha;
  contratos: {
    id: string;
    cargo_id: number;
    cargo: string | null;
    fecha_inicio: string;
    fecha_fin: string | null;
    tipo_pago: string;
    frecuencia_pago: string;
    horas_semanales: string | null;
    estado: 'VIGENTE' | 'SUSPENDIDO' | 'FINALIZADO';
    created_at: string;
  }[];
  despidos: {
    id: string;
    contrato_id: string;
    motivo: MotivoDespido;
    fecha_despido: string;
    descripcion: string | null;
    registrado_por: string | null;
    registrado_por_username: string | null;
    created_at: string;
  }[];
}
```

`404` si la persona no existe.

#### `Employee.despedir(personaId, motivo, fecha, descripcion?)`

```ts
execute<ResultadoDespido>('Payroll', 'Employee', 'despedir', [
  personaId,
  motivo,
  fecha,        // "YYYY-MM-DD"
  descripcion,  // opcional, máximo 250 caracteres
]);
```

```ts
export type MotivoDespido =
  | 'RENUNCIA'
  | 'DESPIDO_JUSTIFICADO'
  | 'DESPIDO_INJUSTIFICADO'
  | 'FIN_DE_CONTRATO'
  | 'JUBILACION'
  | 'FALLECIMIENTO';

export interface ResultadoDespido {
  despido: {
    id: string;
    persona_id: string;
    contrato_id: string;
    motivo: MotivoDespido;
    fecha_despido: string;
    descripcion: string | null;
    registrado_por: string | null;
    created_at: string;
  };
  contrato: { id: string; estado: 'FINALIZADO'; fecha_fin: string };
  usuarioDesactivado: boolean;
  sesionesCerradas: number;
  tokensRevocados: number;
}
```

Reglas y errores:

- `motivo` debe salir de `listarMotivos()`; un valor inventado da `400`.
- `fecha` real (`YYYY-MM-DD`), **no futura** y **no anterior al inicio del
  contrato** (`400`).
- Persona inexistente: `404`.
- Persona ya inactiva o sin contrato `VIGENTE`: `409`.
- Contrato ya con despido registrado: `409`.
- `descripcion` de más de 250 caracteres: `400`.
- Todo ocurre en una transacción: si falla, no queda nada a medias. En el
  front, tras un `200`, recargar el listado y el detalle.

#### `Employee.listarDespidos()`

```ts
execute<DespidoHistorico[]>('Payroll', 'Employee', 'listarDespidos', []);
```

```ts
export interface DespidoHistorico {
  id: string;
  persona_id: string;
  contrato_id: string;
  motivo: MotivoDespido;
  fecha_despido: string;
  descripcion: string | null;
  created_at: string;
  cedula: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  contrato_inicio: string;
  contrato_fin: string;
  cargo: string | null;
  registrado_por_username: string | null;
}
```

Del más reciente al más viejo.

#### `Employee.listarMotivos()`

```ts
execute<MotivoDespido[]>('Payroll', 'Employee', 'listarMotivos', []);
```

Devuelve los valores del enum desde la base, en su orden natural. **No
hardcodear los motivos en el front.**

### 3.2 Permisos y guardas

- Los cinco métodos son de **`RRHH` y `Superusuario`**.
- `Administrador` comparte el rol `superuser` con `Superusuario`, y
  `GerenteRRHH` comparte el rol `rrhh` con `RRHH`. Por eso **no alcanza con
  `RoleRoute`**:
  - La ruta puede usar
    `<RoleRoute allow={['superuser', 'rrhh']} fallback={ROUTES.payrollMisRecibos} />`.
  - Dentro de la pantalla, validar por **nombre de perfil**:
    `hasAnyProfile(user, ['RRHH', 'Superusuario'])`.
  - Si no cumple, mostrar una tarjeta de “Acceso restringido”; el backend
    igualmente responde `403`.
- Opciones de menú nuevas: `Personas` (Payroll, orden 11) y `Despidos`
  (Payroll, orden 12), solo para esos dos perfiles.

### 3.3 Rutas, menú y pantallas

1. **Constantes** en `frontend/src/constants/routes.ts`:

```ts
payrollPersonas: '/payroll/personas',
payrollDespidos: '/payroll/despidos',
```

Y sus títulos en `PAGE_TITLES` (`'Registro de personas'`,
`'Despidos'`).

2. **Rutas** en `frontend/src/routes/AppRouter.tsx`, dentro del bloque de
   nómina (`RoleRoute allow={['superuser', 'rrhh']}`):

```tsx
<Route path={ROUTES.payrollPersonas} element={<PersonasPage />} />
<Route path={ROUTES.payrollDespidos} element={<DespidosPage />} />
```

3. **Menú** en `frontend/src/store/menuStore.ts`: sin esto el sidebar
   **omite** las opciones nuevas con un `console.warn`.

```ts
import { UserMinus, UserRound } from 'lucide-react';

const MENU_ROUTE_MAP: Record<string, { path: string; icon: LucideIcon }> = {
  // ...lo que ya existe
  Personas: { path: '/payroll/personas', icon: UserRound },
  Despidos: { path: '/payroll/despidos', icon: UserMinus },
};

const MENU_LABEL_MAP: Record<string, string> = {
  // ...lo que ya existe
  Personas: 'Personas',
  Despidos: 'Despidos',
};
```

Sin la entrada en `MENU_ROUTE_MAP` el sidebar omite la opción; sin la de
`MENU_LABEL_MAP` se muestra el nombre técnico tal cual.

4. **`/payroll/personas` → `PersonasPage`**
   - Filtro por estado (`TODOS`, `ACTIVO`, `INACTIVO`) con `Employee.listar`.
   - Tabla: cédula, nombre, cargo, contrato (estado y fechas), usuario,
     estado de la persona, último despido.
   - Acciones: “Ver detalle” (`Employee.ver`) y “Registrar despido” (solo si
     `estado === 'ACTIVO'`, `contrato_estado === 'VIGENTE'` y no hay
     `despido_id`).
   - Buscador local por cédula o nombre (no hay endpoint de búsqueda; filtrar
     en memoria sobre la lista ya cargada).

5. **`/payroll/despidos` → `DespidosPage`**
   - Histórico con `Employee.listarDespidos`.
   - Columnas: fecha, persona, cédula, cargo, motivo, descripción, contrato
     (inicio–fin) y usuario que registró.
   - Sin acciones de escritura.

6. **Modal “Registrar despido”** (desde `PersonasPage`):
   - Persona y contrato en solo lectura (no permitir cambiar el `personaId`).
   - `motivo`: `<select>` cargado con `Employee.listarMotivos()` al abrir el
     modal; el primer valor puede ser un placeholder deshabilitado.
   - `fecha`: `<input type="date">` con `max` = hoy (calculado en local) y
     `min` = `fecha_inicio` del contrato.
   - `descripcion`: `<textarea>` con `maxLength={LIMITS.dismissalDescription.max}`
     y contador (`Textarea` ya soporta `maxLength` y `showCounter`).
   - Confirmación explícita: “Esta acción cierra el contrato, marca a la
     persona como inactiva y desactiva su usuario. No se puede deshacer desde
     la interfaz.”
   - Al confirmar: deshabilitar el botón, llamar `despedir`, mostrar un
     resumen con `usuarioDesactivado`, `sesionesCerradas` y `tokensRevocados`,
     cerrar el modal y recargar la lista.
   - Manejar `409` con el mensaje del backend (por ejemplo “El contrato ya
     tiene un despido registrado”).

7. **Detalle de persona**: mostrar contratos y despidos. Si hay un despido,
   indicar motivo, fecha, descripción y quién lo registró.

### 3.4 Efecto en la nómina (importante)

La persona despedida **sigue apareciendo en la nómina del período en que cae
su `fecha_fin`**, con el sueldo fijo prorrateado por los días trabajados. No
filtrar por `estado = 'ACTIVO'` en las pantallas de período, pre-nómina ni
recibos: el backend ya decide a quién pagar.

---

## 4. Ajustes transversales

### 4.1 Límite de texto nuevo

En `frontend/src/constants/limits.ts` (el módulo que ya existe, **no**
`inputLimits.ts`, que quedó descartado):

```ts
export const LIMITS = {
  // ...lo que ya existe
  /** despido.descripcion (varchar(250)) */
  dismissalDescription: { max: 250 },
} as const;
```

El backend valida el mismo máximo y responde `400` con el campo.

### 4.2 Formato de dinero y fechas

- Montos: `formatMoney` para pintar. Si hay que sumar en el cliente, hacerlo
  con `aCentavos` / `deCentavos` / `centsToMoneyString` (`utils/money.ts`),
  nunca con `parseFloat` ni `+= Number(...)`.
- Fechas: `formatFechaLocal`. Las fechas del backend llegan como
  `YYYY-MM-DD` (sin hora) en `Employee`, `Period` y `Receipt`.

### 4.3 Guardas por nombre de perfil

`hasProfile` / `hasAnyProfile` ya existen en `frontend/src/utils/identity.ts`.
Usarlas para las pantallas exclusivas de `RRHH`/`Superusuario` (personas,
despidos, horas extras, pre-nómina). El `RoleRoute` por sí solo deja pasar a
`Administrador` y `GerenteRRHH`.

---

## 5. Inventario de alineación (verificado contra la base)

### 5.1 Subsistema `Payroll`

| Clase | Métodos en el backend | Estado en el front |
|---|---|---|
| Affiliation | `darDeBaja`, `listar`, `registrar` | ✅ completo |
| Cargo | `actualizarValorHora`, `listarCargosTarifa` | ✅ completo |
| Concept | `asignarRecurrente`, `listar`, `listarRecurrentes`, `quitarRecurrente` | ✅ completo |
| **Employee** | `despedir`, `listar`, `listarDespidos`, `listarMotivos`, `ver` | ✅ completo (`EmployeeService`) |
| Hours | `eliminar`, `listarExtrasPorPeriodo`, `listarPorPeriodo`, `listarPorPersona`, `misHoras`, `quitarExtra`, `registrar`, `registrarExtra` | ✅ completo |
| Loan | `anular`, `crear`, `listar`, `misPrestamos`, `saldos` | ✅ completo |
| Loan | `aprobar`, `rechazar` | ⚠️ el front los llama, pero la base no los tiene (migración 015 pendiente) |
| Novedad | `aprobar`, `listarPorPeriodo`, `rechazar`, `registrar` | ✅ completo |
| Period | `anular`, `crear`, `listar`, `pagar`, `procesar`, `ver` | ✅ completo |
| Period | `listarConTotales`, `resumen` | ✅ completo (`PeriodService`) |
| PreNomina | `confirmar`, `eliminar`, `generar`, `guardar`, `ver` | ✅ completo |
| Receipt | `listarPorPeriodo`, `miDesglose`, `misRecibos`, `ver` | ✅ completo |
| Receipt | `generarPdf` | ✅ completo (`ReceiptService.generarPdf` + `descargarPdfBase64`) |

### 5.2 Subsistema `Security` y `Session`

| Clase | Métodos | Estado en el front |
|---|---|---|
| Admin | 17 métodos del catálogo (perfiles, métodos, opciones, permisos) | ✅ completo (`reloadPermissions` es de mantenimiento; no se usa) |
| Menu | `getOptions` | ✅ `useMenuStore` |
| User | `cambiarClave`, `establecerPerfilesUsuario`, `listarCargos`, `listarPerfiles`, `listarPerfilesUsuario`, `listarPersonas`, `registrar` | ✅ completo (`PersonaItem` ya no declara `email` ni `monto_salario`) |
| Session | `getSession` | ✅ `getSession()` |
| Session | `login`, `logout`, `sessionExist` | ✅ por las rutas `/api/login` y `/api/logout` |
| Token | `refresh` | ✅ por la ruta `/api/refresh` (renovación automática en `apiClient`) |

### 5.3 Menú del backend vs rutas del front

| Subsistema | Opción | Ruta en el front |
|---|---|---|
| Payroll | Periodos | ✅ `/payroll/periodos` |
| Payroll | Horas | ✅ `/payroll/horas` |
| Payroll | Novedades | ✅ `/payroll/novedades` |
| Payroll | Prestamos | ✅ `/payroll/prestamos` |
| Payroll | Conceptos | ✅ `/payroll/conceptos` |
| Payroll | Cargos | ✅ `/payroll/cargos` |
| Payroll | Afiliaciones | ✅ `/payroll/afiliaciones` |
| Payroll | MisRecibos | ✅ `/payroll/mis-recibos` |
| Payroll | HorasExtras | ✅ `/payroll/horas-extras` |
| Payroll | PreNomina | ✅ `/payroll/pre-nomina` |
| Payroll | **Personas** | ✅ `/payroll/personas` (`PersonasPage`) |
| Payroll | **Despidos** | ✅ `/payroll/despidos` (`DespidosPage`) |
| Security | registrar | ✅ `/admin/registration` |
| Security | Usuarios | ✅ `/admin/usuarios` |
| Security | Perfiles | ✅ `/admin/perfiles` |
| Security | Permisos | ✅ `/admin/permissions` |
| Security | Opciones | ✅ `/admin/opciones` |

---

## 6. Deuda técnica detectada (no bloquea estas tres specs)

El front conserva pantallas y servicios de demostración que **no** están en el
menú del backend y siguen usando datos falsos (`frontend/src/mocks`):

| Pantalla | Ruta | Servicio / store |
|---|---|---|
| `AdminDashboard` | `/admin` | `dashboardService` (mocks) |
| `AdminPayroll` | `/admin/payroll` | `payrollStore` → `fetchPeriods`/`fetchReceipts` (mocks) |
| `AdminEmployees` | `/admin/employees` | `employeesStore` → `employeeService` (mocks) |
| `AdminAttendance` | `/admin/attendance` | `attendanceStore` (mocks) |
| `AdminRequests` | `/admin/requests` | `requestsStore` (mocks) |
| `AdminDepartments` | `/admin/departments` | `orgStore` (mocks) |
| `AdminReports` | `/admin/reports` | `dashboardService` (mocks) |
| `UserDashboard`, `UserAttendance`, `UserRequests`, `UserProfile`, `UserSettings` | `/`, `/attendance`, `/requests`, `/profile`, `/settings` | mocks |

Además `signUp()` en `authService.ts` (usado por `useRegisterForm`) es mock.
Las pantallas reales son las de `/payroll/*` y las de seguridad
(`/admin/usuarios`, `/admin/perfiles`, `/admin/permisos`, `/admin/opciones`,
`/admin/registration`).

**Recomendación:** quitar del router las rutas de demostración o conectarlas a
los endpoints reales antes de la entrega. `AdminPayroll` duplica
`/payroll/periodos` y puede confundir en la defensa. No es requisito de las
specs 013–015, pero deja el front “acorde con el back”.

---

## 7. Orden sugerido de implementación

1. Tipos y servicios de `Period.resumen` / `listarConTotales`.
2. `PeriodsPage`: tabla con totales + modal de desglose.
3. `Receipt.generarPdf` + utilidad de descarga + botones en `MyReceiptsPage`
   y en los recibos de `PeriodsPage`.
4. Tipos y servicios de `Payroll/Employee`.
5. `LIMITS.dismissalDescription` en `constants/limits.ts`.
6. `PersonasPage` con filtro y modal de despido.
7. `DespidosPage`.
8. `ROUTES`, `PAGE_TITLES`, `AppRouter`, `MENU_ROUTE_MAP` y `MENU_LABEL_MAP`.
9. Limpieza de `PersonaItem` (`email`, `monto_salario`).
10. `pnpm typecheck`, `pnpm test`, `pnpm build` y prueba manual con los
    usuarios de demo.

---

## 8. Datos de prueba

Con `db/seed-datos-prueba.sql` y `scripts/manual/demo_periodos.mjs --yes`
(el backend ya los tiene aplicados en el branch de desarrollo), todos con
clave `Password123`:

| Usuario | Perfiles | Para probar |
|---|---|---|
| `admin_prueba` | Superusuario, Administrador, RRHH, Empleado | todo |
| `rosa_vargas` | RRHH, Empleado | personas, despidos, resumen, PDF de cualquier recibo |
| `luis_gomez`, `pedro_hernandez`, `carmen_diaz` | Empleado | solo su recibo y su PDF; `403` en personas/despidos |

Para el `403` de `Administrador` hace falta un usuario que tenga **solo** ese
perfil; `admin_prueba` no sirve porque también es `Superusuario` y la lógica de
permisos es OR.

---

## 9. Criterios de aceptación

Verificados contra el backend real (`localhost:3002`, branch de desarrollo) y
el front servido por Vite. Entre paréntesis, cómo se comprobó.

- [x] `PeriodsPage` muestra totales por período y el desglose por concepto.
      *(la tabla pinta personas, asignaciones, deducciones, neto y costo total;
      el modal lee `Period.resumen` y dibuja las seis tarjetas y la tabla de
      `por_concepto`)*
- [x] El aporte patronal se ve aparte y nunca se suma al neto en la UI.
      *(en el DOM: `asignaciones − deducciones = neto` y
      `asignaciones + patronal = costo total`, con `neto ≠ costo`)*
- [x] Un empleado descarga su PDF; pedir el de otro muestra el `403`.
      *(`luis_gomez` [Empleado] obtiene `200` con su propio recibo y `403`
      «No autorizado para ver este recibo.» con el de otro; la pertenencia se
      valida en el BO, no en el mapa de permisos)*
- [x] RRHH y Superusuario descargan cualquier PDF.
      *(`rosa_vargas` [RRHH] obtiene `200` con el recibo de otra persona;
      el archivo llega con cabecera `%PDF` y el `tamanioBytes` coincide con lo
      decodificado)*
- [x] `PersonasPage` lista, filtra por estado y abre el detalle.
      *(15 filas con el seed de demo; búsqueda por cédula/nombre y selector de
      estado; el detalle muestra contratos y despidos)*
- [x] El modal de despido carga los motivos del backend y valida fecha y
      descripción. *(el selector trae los 6 motivos de `listarMotivos` y el
      `textarea` corta en 250)*
- [x] Tras el despido, la persona queda `INACTIVO` y su usuario inactivo.
      *(contrato del backend: `despedir` corre en una transacción de cinco
      tablas; el E2E de backend `despidos_e2e.mjs` lo cubre, no se despidió a
      nadie en la base de demo)*
- [x] `DespidosPage` muestra el histórico con el usuario que registró.
      *(renderiza la tabla; con la base de demo sin despidos muestra el estado
      vacío)*
- [x] `Personas` y `Despidos` aparecen en el sidebar para RRHH y Superusuario,
      y **no** para Administrador ni Empleado.
      *(recorrido E2E por perfil: Superusuario 17 opciones y RRHH 17 incluyen
      ambas; Administrador 13 y Empleado 7 no las muestran)*
- [x] `Administrador` y `GerenteRRHH` no ejecutan personas/despidos (`403`).
      *(`Empleado` obtiene `403` en los cinco métodos; `Administrador` no tiene
      `permiso_metodo` para ellos, así que el servidor responde igual. En la
      base viva no existe el perfil `GerenteRRHH`)*
- [x] `tsc --noEmit` limpio y sin `any` nuevos en los servicios.
      *(`pnpm typecheck` sin salida, `pnpm test` 31/31, `pnpm build` correcto y
      `pnpm e2e:nav` con 54 páginas, 0 errores de consola y 0 peticiones ≥400;
      el único fallo del arnés, `forzado:error-render` sobre `/admin/opciones`,
      también falla en `origin/main` y no lo tocan estas specs)*
