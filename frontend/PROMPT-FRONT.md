==============================================================================
PROMPT PARA EL FRONT — DOS PARTES
Sistema de Nomina (backend: Payroll-Backend)
Fecha: 2026-11-08
==============================================================================

COMO USAR ESTE ARCHIVO
----------------------
Son dos prompts independientes. Pegá SOLO la parte que corresponda:

  PARTE 1  Integrar el front con el subsistema Payroll (ya implementado y
           desplegado en el backend).

  PARTE 2  Construir la vista de asignacion de permisos para Superusuario
           (backend implementado: spec 009, migracion 006 y metodos
           Security/Admin/listarMetodos, listarPermisosMetodo,
           asignarPermisoMetodo y quitarPermisoMetodo).

Las dos partes comparten el mismo contrato HTTP. La parte 1 explica ese
contrato completo; la parte 2 lo da por sabido y solo agrega lo suyo.

Antes de empezar, lee el bloque "CONTRATO HTTP" de la parte 1.


##############################################################################
#                                                                            #
#  PARTE 1 — INTEGRACION DEL FRONT CON EL SUBSISTEMA PAYROLL                 #
#                                                                            #
##############################################################################

CONTEXTO
--------
El backend es un monolito con UN SOLO punto de entrada al negocio:
POST /api/execute. El cliente no arma rutas por entidad; manda un sobre con
subsystem, class, method y params.

El subsistema Payroll ya esta implementado, con 8 clases y 33 metodos, y la
base de datos ya tiene sus tablas, conceptos, aportes de ley, permisos y
opciones de menu. Tu trabajo es construir las pantallas del front que lo
consumen.

NO inventes rutas tipo /api/periodos o /api/empleados. No existe ninguna.
Todo pasa por /api/execute.


==============================================================================
1. CONTRATO HTTP (obligatorio, leelo completo)
==============================================================================

1.1 Variables de entorno del front

    VITE_API_URL=http://localhost:3000     (o la URL del backend desplegado)

    El backend acepta CORS solo desde los origenes de FRONTEND_URL /
    FRONTEND_URLS. En desarrollo suele ser http://localhost:5173.

1.2 La funcion execute()

    Todas las llamadas de negocio pasan por esta unica funcion. No escribas
    fetch sueltos por pantalla.

    async function execute(subsystem, className, method, params = []) {
      const res = await fetch(`${API_URL}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",          // IMPRESCINDIBLE: manda la cookie
        body: JSON.stringify({ subsystem, class: className, method, params }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error = new Error(body?.error ?? `Error ${res.status}`);
        error.status = res.status;
        throw error;
      }

      return body;                        // el resultado del BO, sin envoltorio
    }

    Ejemplos:

      execute("Payroll", "Period", "listar", [])
      execute("Payroll", "Hours",  "registrar",
              [personaId, "2026-11-04", 8, 2, "Turno noche"])
      execute("Security", "User",  "listarPersonas", [])

    Reglas del sobre:

    - subsystem, class y method son alfanumericos, SIN espacios ni guiones
      bajos, y distinguen mayusculas: "Payroll", "Cargo", "listarCargosTarifa".
    - params es SIEMPRE un arreglo, aunque el metodo no reciba nada:
      params: [] (si lo omitis, el backend responde 400).
    - Los argumentos son POSICIONALES y en el orden documentado. Para pasar
      un parametro opcional del final hay que pasar todos los anteriores.
    - credentials: 'include' es obligatorio. Sin eso el navegador no manda
      connect.sid y todo responde 401/403 "sin razon".

1.3 Codigos de respuesta

    200  OK, cuerpo = resultado del objeto de negocio
    400  forma invalida del sobre, o dato de entrada invalido
    401  no hay sesion (o la sesion ya no es valida)
    403  hay sesion pero el perfil no tiene el permiso del metodo
    404  el recurso pedido no existe
    409  conflicto de estado (duplicado, periodo ya procesado, etc.)
    500  error no controlado
    501  la clase o el metodo no existen en el backend

    Todos los errores traen { "error": "mensaje en espanol" }. Ese mensaje
    esta pensado para mostrarse al usuario tal cual: no lo reemplaces por
    "Ocurrio un error".

1.4 Sesion y menu (rutas propias, NO van por /execute)

    POST /api/login     body { username, password }
                        200 -> { userID, userName,
                                 profiles: [{ id, nombre }],
                                 debeCambiarClave }
                        401 -> credenciales invalidas (mensaje generico)
                        403 -> el usuario no tiene perfiles

    GET  /api/me        200 -> la misma forma que el login, o null si no hay
                        sesion (null, no 401)

    POST /api/logout    200 -> { ok: true }
                        OJO: exige cabecera Origin/Referer igual a
                        FRONTEND_URL (proteccion CSRF). Un fetch desde el
                        navegador la manda sola.

    POST /api/refresh   200 -> renueva el access token. Tambien exige Origin.

    El login devuelve profiles con { id, nombre }. Guardalo en el estado
    global: es lo que decide que pantallas mostrar.

1.5 Menu

    execute("Security", "Menu", "getOptions", [])

    200 -> [ { id, nombre, descripcion, subsistema } ]

    Viene YA filtrado por los perfiles de la sesion y ordenado por
    subsistema y orden. No hardcodees el menu: se arma desde el servidor.

    Si el usuario tiene debeCambiarClave === true, el backend responde 403
    en todos los metodos salvo cambiar la clave y logout. El front debe
    forzar la pantalla de cambio de clave antes de cualquier otra cosa.

    execute("Security", "User", "cambiarClave", [claveActual, claveNueva])


==============================================================================
2. REGLAS DE DATOS QUE EL FRONT NO PUEDE IGNORAR
==============================================================================

2.1 El dinero llega como TEXTO

    Todas las columnas DECIMAL se serializan como string, no como number.
    Esto es intencional (precision exacta, nunca float). Campos afectados:

      valor_hora_base, monto, monto_total, total_asignaciones,
      total_deducciones, monto_capital, monto_interes, monto_cuota,
      cuota_periodica, tasa_interes, base_calculo, tasa_aplicada,
      horas_normales, horas_extra, cantidad_unidades

    Consecuencias:

      - NUNCA hagas aritmetica con + sobre esos valores: concatena strings.
      - Para mostrar: formatealos con Intl.NumberFormat, sin convertirlos
        a float para "arreglarlos".
      - Si necesitas sumar en el front (no deberias; el backend ya manda los
        totales), usa BigInt o una libreria decimal, jamas Number + Number.
      - Para inputs numericos: manda el valor como string ("1500.00") o
        number; el backend lo valida y lo castea.

    Formateador sugerido:

      const money = new Intl.NumberFormat("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      money.format("575.00")   // "575,00"

2.2 Las fechas

    Las columnas DATE (fecha, fecha_inicio, fecha_fin, fecha_vencimiento,
    fecha_inscripcion, fecha_baja, vigente_desde, vigente_hasta,
    fecha_emision, fecha_pago, fecha_otorgamiento) llegan como string ISO
    en UTC que representa la medianoche LOCAL del servidor, por ejemplo:

      "2026-11-04T04:00:00.000Z"

    NO hagas value.slice(0, 10) para mostrarla: en zonas horarias con offset
    positivo devuelve el dia anterior. Lee las partes locales:

      const fechaLocal = (iso) => {
        const d = new Date(iso);
        return [d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, "0"),
                String(d.getDate()).padStart(2, "0")].join("-");
      };

    Para enviar fechas al backend usa SIEMPRE "YYYY-MM-DD" (string), nunca
    un Date ni un ISO completo: los metodos validan con
    /^\d{4}-\d{2}-\d{2}$/ y responden 400 si no coincide.

    created_at y fecha_proceso son instantes reales (timestamptz): esos si
    van con toLocaleString().

2.3 Los ids

    - persona_id, contrato_id, periodo_nomina_id, recibo_pago_id,
      prestamo_id, cuota_id, novedad_id, afiliacion_id, registro de horas:
      UUID en string. No los trates como numero.
    - perfil_id, cargo_id, concepto_id, tipo_aporte_id, metodo_id,
      opcion_id: enteros (serial).
    - Los estados son enums en mayusculas: BORRADOR, PROCESADO, PAGADO,
      PENDIENTE, APROBADA, RECHAZADA, APLICADA, ACTIVO, BAJA, ANULADO,
      PAGADO, SOLICITADO, SEMANAL, QUINCENAL, MENSUAL, POR_HORA,
      SALARIO_FIJO, ASIGNACION, DEDUCCION, APORTE_PATRONAL, MONTO_FIJO,
      PORCENTAJE_SALARIO, TRANSFERENCIA, PAGO_MOVIL, EFECTIVO, CHEQUE.

2.4 Redondeo

    El backend redondea a 2 decimales el dinero y a 4 las tasas. El front
    solo muestra; no recalcules netos ni totales.


==============================================================================
3. CATALOGO DE METODOS — 8 CLASES, 33 METODOS
==============================================================================

Formato:  metodo(params) -> respuesta

Los parametros entre corchetes son opcionales. El orden es el de la firma:
si un opcional esta en medio, hay que pasar los anteriores igual.


------------------------------------------------------------------------------
3.1 Cargo  (tarifas por cargo)
------------------------------------------------------------------------------

listarCargosTarifa()
  -> [ { id, nombre, descripcion, valor_hora_base, activo } ]
  valor_hora_base es string decimal.

actualizarValorHora(cargoId, valorHora)
  cargoId: entero > 0
  valorHora: numero >= 0 (string o number)
  -> { id, nombre, valor_hora_base }
  400 si el id o el monto son invalidos; 404 si el cargo no existe o esta
  inactivo.


------------------------------------------------------------------------------
3.2 Hours  (registro de horas trabajadas)
------------------------------------------------------------------------------

registrar(personaId, fecha, horasNormales, horasExtra = 0, observacion = null)
  personaId: uuid string
  fecha: "YYYY-MM-DD"
  horasNormales, horasExtra: numeros >= 0; la suma debe ser > 0
  observacion: string <= 200 o null
  -> { id, persona_id, fecha, horas_normales, horas_extra, observacion,
       created_at }
  409 si ya hay horas de esa persona en esa fecha (UNIQUE persona+fecha).
  409 tambien si la fecha cae en un periodo NO borrador (ya procesado).

listarPorPersona(personaId, fechaInicio, fechaFin)
  -> [ { id, persona_id, fecha, horas_normales, horas_extra, observacion,
         created_at } ]
  Ordenado por fecha. fechaFin no puede ser anterior a fechaInicio.

listarPorPeriodo(periodoId)
  -> [ { id, persona_id, fecha, horas_normales, horas_extra, observacion,
         created_at, cedula, primer_nombre, primer_apellido } ]
  Usa las fechas del periodo; 404 si el periodo no existe.

misHoras(fechaInicio, fechaFin)
  -> igual que listarPorPersona, pero del usuario de la sesion.
  Si no pasas fechas, el backend usa el mes actual. Parametros posicionales:
  para pasar solo fechaFin hay que pasar fechaInicio.

eliminar(id)
  -> { ok: true, id }
  404 si no existe; 409 si el dia cae en un periodo ya procesado.


------------------------------------------------------------------------------
3.3 Affiliation  (afiliaciones a aportes de ley)
------------------------------------------------------------------------------

registrar(personaId, tipoAporteId, nroAfiliacion, fechaInscripcion)
  tipoAporteId: entero (1=SSO, 2=PARO_FORZOSO, 3=VIVIENDA/FAOV, 4=INCES,
                segun el seed; NO los hardcodees: mostra el catalogo real)
  -> { id, persona_id, tipo_aporte_id, nro_afiliacion, fecha_inscripcion,
       fecha_baja, estado }
  404 si el tipo de aporte no existe.

listar(personaId)
  -> [ { id, persona_id, tipo_aporte_id, nro_afiliacion, fecha_inscripcion,
         fecha_baja, estado, codigo, nombre, entidad } ]

darDeBaja(afiliacionId, fechaBaja)
  -> { id, estado: "BAJA", fecha_baja }
  404 si no existe o ya estaba de baja.

OJO: el backend NO tiene un metodo que liste los tipos de aporte. Si la
pantalla necesita el catalogo (codigo/nombre/entidad), pedilo como
requisito nuevo al backend; no lo inventes en el front.


------------------------------------------------------------------------------
3.4 Concept  (conceptos y conceptos recurrentes por persona)
------------------------------------------------------------------------------

listar()
  -> [ { id, codigo, nombre_concepto, tipo_concepto, categoria, unidad,
         afecta_base_ley, activo } ]
  Solo activos, ordenados por codigo. Es el catalogo para los selectores.

asignarRecurrente(personaId, conceptoId, valor, vigenteDesde,
                   tipoValor = "MONTO_FIJO", vigenteHasta = null,
                   observacion = null)
  valor: string/number decimal. Si tipoValor es PORCENTAJE_SALARIO, se
         interpreta como fraccion (0.10 = 10 %).
  -> { id, persona_id, concepto_id, tipo_valor, valor, vigente_desde,
       vigente_hasta, observacion }
  400 si tipoValor no es valido o el porcentaje supera 1; 404 si el concepto
  no existe o esta inactivo; 409 si ya esta asignado con la misma fecha de
  vigencia.

quitarRecurrente(id, fechaHasta)
  -> { id }
  Cierra la vigencia (no borra). 409 si ya estaba cerrado.

listarRecurrentes(personaId)
  -> [ { id, persona_id, concepto_id, tipo_valor, valor, vigente_desde,
         vigente_hasta, observacion, codigo, nombre_concepto,
         tipo_concepto, categoria, unidad, afecta_base_ley } ]


------------------------------------------------------------------------------
3.5 Novedad  (bonos y descuentos puntuales de un periodo)
------------------------------------------------------------------------------

registrar(personaId, conceptoId, periodoId, fecha, cantidad = null,
          monto = null, observacion = null)
  -> { id, persona_id, concepto_id, periodo_nomina_id, fecha, cantidad,
       monto, estado: "PENDIENTE", observacion, created_at }
  Regla: manda monto O cantidad, no ambos vacios. Si mandas cantidad, el
  backend calcula con la tarifa del concepto al procesar.
  404 si el concepto o el periodo no existen; 409 si el periodo no esta en
  BORRADOR.

aprobar(id)
  -> { id, estado: "APROBADA" }
  404 si no existe o ya fue gestionada.

rechazar(id)
  -> { id, estado: "RECHAZADA" }

listarPorPeriodo(periodoId)
  -> [ { id, persona_id, concepto_id, periodo_nomina_id, fecha, cantidad,
         monto, estado, observacion, cedula, primer_nombre, primer_apellido,
         codigo, nombre_concepto, tipo_concepto, categoria, unidad } ]

Ciclo de vida: PENDIENTE -> APROBADA -> APLICADA (al procesar el periodo).
RECHAZADA no se aplica. Si el periodo se anula, APLICADA vuelve a APROBADA.


------------------------------------------------------------------------------
3.6 Loan  (prestamos y cuotas)
------------------------------------------------------------------------------

crear(personaId, fechaOtorgamiento, montoTotal, nroCuotas, tasaInteres = 0)
  montoTotal: numero > 0
  nroCuotas: entero entre 1 y 120
  tasaInteres: fraccion (0.10 = 10 %), interes simple plano
  -> { prestamo: { id, persona_id, fecha_otorgamiento, monto_total,
                   nro_cuotas, cuota_periodica, tasa_interes, estado,
                   created_at },
       cuotas: [ { nroCuota, montoCapital, montoInteres, montoCuota,
                   id, fechaVencimiento } ] }
  La ultima cuota absorbe el redondeo. 404 si la persona no tiene contrato
  vigente (sin contrato no hay frecuencia para fechas de vencimiento).

listar(personaId)
  -> [ { id, persona_id, fecha_otorgamiento, monto_total, nro_cuotas,
         cuota_periodica, tasa_interes, estado, created_at } ]
  Ordenado por fecha de otorgamiento descendente.

saldos(prestamoId)
  -> { prestamoId, cuotasPendientes, saldoPendiente }
  cuotasPendientes es number; saldoPendiente es string decimal.
  El saldo NO se guarda: se calcula sumando cuotas PENDIENTE.

anular(prestamoId)
  -> { id, estado: "ANULADO" }
  409 si el prestamo no esta SOLICITADO/ACTIVO o si ya tiene cuotas
  descontadas.

misPrestamos()
  -> igual que listar, para el usuario de la sesion.


------------------------------------------------------------------------------
3.7 Period  (periodos de nomina: crear, procesar, pagar, anular)
------------------------------------------------------------------------------

crear(frecuencia, fechaInicio, fechaFin, descripcion = null)
  frecuencia: "SEMANAL" | "QUINCENAL" | "MENSUAL"
  -> { id, fecha_inicio, fecha_fin, frecuencia, estado: "BORRADOR",
       descripcion, procesado_por, fecha_proceso, created_at }
  409 si ya existe un periodo con esa frecuencia y esas fechas exactas.

procesar(periodoId)
  -> { periodo: { id, estado: "PROCESADO", procesado_por, fecha_proceso },
       recibos: [ { id, persona_id, periodo_nomina_id, total_asignaciones,
                    total_deducciones, monto_total, estado } ] }
  Genera un recibo por cada contrato VIGENTE de esa frecuencia. Es la
  operacion mas pesada: mostra un estado de carga y no la repitas por doble
  clic (idempotencia no garantizada: el segundo intento da 409 porque el
  periodo ya no esta BORRADOR).
  409 si el periodo no esta BORRADOR.
  409 si alguna persona no tiene salario vigente (el mensaje nombra a la
  persona).

pagar(periodoId, fechaPago, metodoPago, referenciaPago = null,
      cuentaBancariaId = null)
  metodoPago: "TRANSFERENCIA" | "PAGO_MOVIL" | "EFECTIVO" | "CHEQUE"
  cuentaBancariaId: uuid o null (si es null usa la cuenta principal activa
                    de cada persona)
  -> { periodo: { id, estado: "PAGADO", ... }, recibosPagados: number }
  409 si el periodo no esta PROCESADO.

anular(periodoId)
  -> { periodoId, estado: "BORRADOR", recibosEliminados }
  Solo desde PROCESADO (no pagado). Revierte cuotas, novedades y recibos.
  409 si el periodo esta PAGADO o BORRADOR.

listar()
  -> [ { id, fecha_inicio, fecha_fin, frecuencia, estado, descripcion,
         procesado_por, fecha_proceso, created_at } ]
  Ordenado por fecha_inicio descendente.

ver(periodoId)
  -> { periodo: {...}, recibos: [ { id, persona_id, periodo_nomina_id,
         contrato_id, fecha_emision, total_asignaciones, total_deducciones,
         monto_total, estado, fecha_pago, metodo_pago, referencia_pago,
         cedula, primer_nombre, primer_apellido } ] }


------------------------------------------------------------------------------
3.8 Receipt  (recibos de pago)
------------------------------------------------------------------------------

ver(reciboId)
  -> { recibo: { id, persona_id, periodo_nomina_id, contrato_id,
                 fecha_emision, total_asignaciones, total_deducciones,
                 monto_total, estado, fecha_pago, metodo_pago,
                 cuenta_bancaria_id, referencia_pago, pagado_por,
                 cedula, primer_nombre, primer_apellido,
                 fecha_inicio, fecha_fin, frecuencia },
       detalle: [ { id, recibo_pago_id, concepto_id, cuota_prestamo_id,
                    novedad_id, concepto_persona_id, parametro_aporte_id,
                    base_calculo, tasa_aplicada, cantidad_unidades, monto,
                    codigo, nombre_concepto, tipo_concepto, categoria,
                    unidad } ] }
  El detalle viene ordenado: ASIGNACION, DEDUCCION, APORTE_PATRONAL, otros.

listarPorPeriodo(periodoId)
  -> [ { id, persona_id, ..., cedula, primer_nombre, primer_apellido } ]

misRecibos()
  -> recibos del usuario de la sesion, con fecha_inicio, fecha_fin y
     frecuencia del periodo. Excluye ANULADO.

miDesglose(reciboId)
  -> { recibo, detalle } igual que ver(), pero 403 si el recibo no es de la
     persona de la sesion.


==============================================================================
4. MATRIZ DE PERMISOS (que puede hacer cada perfil)
==============================================================================

Perfiles reales en la base: Superusuario, Administrador, RRHH, Empleado.

Metodos de Payroll:

  Superusuario   33 / 33
  Administrador  33 / 33
  RRHH           33 / 33
  Empleado        4 / 33  -> misHoras, misRecibos, miDesglose, misPrestamos

Opciones de menu de Payroll:

  Superusuario / Administrador / RRHH:
    Periodos, Horas, Novedades, Prestamos, Conceptos, Cargos, Afiliaciones

  Empleado:
    MisRecibos

Consecuencia para el front: NO decidas permisos por tu cuenta. Mostra el
menu que devuelve Security/Menu/getOptions y, si una llamada devuelve 403,
mostra el mensaje del backend. El menu es comodidad; el permiso real se
valida en el servidor.

Metodos auxiliares que vas a necesitar (subsistema Security):

  Security/User/listarPerfiles()
    -> [ { id, nombre, descripcion } ]   perfiles activos

  Security/User/listarPersonas()
    -> [ { id, cedula, primer_nombre, segundo_nombre, primer_apellido,
           segundo_apellido, email, usuario_id, username, usuario_activo,
           cargo, contrato_id, tipo_pago, frecuencia_pago,
           contrato_estado, monto_salario } ]
    Solo personas ACTIVO. Es la fuente del persona_id (UUID) que piden
    todos los metodos de Payroll. Disponible para Superusuario,
    Administrador y RRHH.

  Security/User/registrar(datos)
    -> { id, username, persona_id, perfiles, contratoId }
    Datos: cedula, primer_nombre, primer_apellido, segundo_nombre?,
    segundo_apellido?, fecha_nacimiento?, sexo?, estado_civil?, nro_tlf?,
    email?, direccion?, username, password, perfiles (arreglo de ids),
    laboral? { cargo_id, tipo_pago, frecuencia_pago, fecha_inicio,
               horas_semanales?, monto, vigente_desde?, vigente_hasta?,
               motivo? }
    Si mandas laboral, crea contrato y salario en la misma transaccion.

  Security/User/cambiarClave(actual, nueva)


==============================================================================
5. PANTALLAS SUGERIDAS (una por opcion de menu)
==============================================================================

  Periodos      lista de periodos con estado; crear, ver, procesar, pagar,
                anular. Al procesar, mostrar el resumen (recibos generados,
                total asignaciones, total deducciones, neto).
  Horas         alta de horas por persona y fecha; listado por persona o por
                periodo; eliminar mientras el periodo este en BORRADOR.
  Novedades     alta por periodo, aprobar/rechazar, ver estado.
  Prestamos     alta con simulacion de cuotas (el backend devuelve las
                cuotas al crear), listado, saldo, anular.
  Conceptos     catalogo + recurrentes por persona (asignar / cerrar).
  Cargos        tabla de tarifas por hora con edicion inline.
  Afiliaciones  alta y baja por persona.
  MisRecibos    (Empleado) lista de recibos propios y desglose.

Reglas de UI:

  - Todo texto que venga del backend se inserta con textContent o se escapa.
    Nunca innerHTML con datos de usuario.
  - Los importes se muestran con Intl.NumberFormat("es-VE").
  - Los estados se muestran con etiquetas en espanol y color por estado;
    nunca traduzcas el valor que se manda al backend.
  - Despues de crear/procesar/pagar/anular, recarga la lista desde el
    servidor. No parchees el estado local a mano.
  - Deshabilita el boton mientras la peticion esta en vuelo.


==============================================================================
6. CHECKLIST DE ACEPTACION — PARTE 1
==============================================================================

  [ ] Existe una sola funcion execute() y todas las llamadas la usan.
  [ ] Todas las llamadas mandan credentials: "include" y params: [] cuando
      no hay argumentos.
  [ ] El menu se arma desde Security/Menu/getOptions, no esta hardcodeado.
  [ ] El front respeta debeCambiarClave y fuerza el cambio de clave.
  [ ] Los importes se muestran formateados y nunca se operan con +.
  [ ] Las fechas DATE se muestran con las partes locales, y al backend se
      mandan como "YYYY-MM-DD".
  [ ] Los 403 y 409 muestran el mensaje del backend.
  [ ] Las 8 opciones de menu de Payroll funcionan con los 33 metodos.
  [ ] Un usuario Empleado solo ve MisRecibos y recibe 403 en lo demas.
  [ ] Ninguna pantalla inventa rutas fuera de /api/execute y /api/*.


##############################################################################
#                                                                            #
#  PARTE 2 — VISTA DE ASIGNACION DE PERMISOS (SOLO SUPERUSUARIO)             #
#                                                                            #
##############################################################################

ESTADO: el backend de esta parte esta IMPLEMENTADO (spec 009, migracion
006 aplicada). La especificacion vive en:

  specs/009-permisos-metodo-perfil/spec.md
  specs/009-permisos-metodo-perfil/plan.md
  specs/009-permisos-metodo-perfil/tasks.md

Confirma con el backend que la migracion 006 esta aplicada; si no, los cuatro
metodos responden 403/501.


==============================================================================
1. QUE SE CONSTRUYE
==============================================================================

Una pantalla de administracion, visible SOLO para el perfil Superusuario,
que permite:

  - elegir un perfil,
  - ver el catalogo completo de metodos del sistema agrupado por subsistema
    y clase,
  - marcar/desmarcar que metodos puede ejecutar ese perfil,
  - guardar el cambio en el momento: la fila de permiso_metodo se escribe en
    PostgreSQL y el mapa de permisos en memoria del backend se actualiza sin
    reiniciar.

No es una vista de opciones de menu. Es de METODOS (lo que el servidor
ejecuta). Son dos cosas distintas y no se mezclan en esta pantalla.


==============================================================================
2. CONTRATO
==============================================================================

Se usa la misma funcion execute() de la parte 1. No hay endpoints nuevos.

  POST /api/execute
  { "subsystem": "Security", "class": "Admin", "method": "...", "params": [] }

Metodos que expone el backend para esta vista:

------------------------------------------------------------------------------
2.1 Security/Admin/listarMetodos()
------------------------------------------------------------------------------

  params: []

  200 -> [
    { id: 118, subsistema: "Payroll", clase: "Cargo",
      metodo: "actualizarValorHora",
      descripcion: "Actualiza el valor de la hora de un cargo",
      critico: false }
  ]

  Solo metodos activos (con clase y subsistema activos). Ordenado por
  subsistema, clase y metodo.

  critico = true significa: este metodo NO se le puede quitar a
  Superusuario (ver 2.4). El front lo usa para deshabilitar el interruptor.

------------------------------------------------------------------------------
2.2 Security/Admin/listarPermisosMetodo(perfilId)
------------------------------------------------------------------------------

  params: [perfilId]        perfilId entero > 0

  200 -> {
    perfil: { id: 4, nombre: "Empleado", descripcion: "Usuario final" },
    metodos: [
      { id: 118, subsistema: "Payroll", clase: "Cargo",
        metodo: "actualizarValorHora", descripcion: "...",
        critico: false, asignado: false }
    ]
  }

  Devuelve el catalogo COMPLETO con asignado resuelto. No hay que cruzar
  listarMetodos con otra lista: esta llamada alcanza para pintar la
  pantalla.

  400 si perfilId no es entero positivo; 404 si el perfil no existe o esta
  inactivo.

------------------------------------------------------------------------------
2.3 Security/Admin/asignarPermisoMetodo(perfilId, metodoId)
------------------------------------------------------------------------------

  params: [perfilId, metodoId]

  200 -> {
    perfilId: 4, perfil: "Empleado",
    metodoId: 118, subsistema: "Payroll", clase: "Cargo",
    metodo: "actualizarValorHora",
    asignado: true,
    yaEstaba: false
  }

  Idempotente: si ya estaba, 200 con yaEstaba: true.
  400 ids invalidos; 404 perfil o metodo inexistente/inactivo.

------------------------------------------------------------------------------
2.4 Security/Admin/quitarPermisoMetodo(perfilId, metodoId)
------------------------------------------------------------------------------

  params: [perfilId, metodoId]

  200 -> { ..., asignado: false, yaNoEstaba: true|false }

  Idempotente: si no estaba, 200 con yaNoEstaba: true.

  409 si se intenta quitar a Superusuario un metodo critico. La lista de
  criticos es cerrada y la define el backend:

    Security/Admin/listarMetodos
    Security/Admin/listarPermisosMetodo
    Security/Admin/asignarPermisoMetodo
    Security/Admin/quitarPermisoMetodo
    Security/User/listarPerfiles

  El mensaje del 409 explica el motivo: mostralo tal cual.

------------------------------------------------------------------------------
2.5 Security/User/listarPerfiles()   (ya existe, se reutiliza)
------------------------------------------------------------------------------

  params: []

  200 -> [ { id: 1, nombre: "Superusuario", descripcion: "..." },
           { id: 2, nombre: "Administrador", ... },
           { id: 3, nombre: "RRHH", ... },
           { id: 4, nombre: "Empleado", ... } ]

  Es la fuente del selector de perfil. Solo perfiles activos.


==============================================================================
3. FLUJO DE LA PANTALLA
==============================================================================

  1. Al entrar:
       a. comprobar que la sesion tiene el perfil "Superusuario"
          (GET /api/me -> profiles[].nombre). Si no, no renderizar la vista.
       b. execute("Security","User","listarPerfiles",[])
       c. seleccionar el primer perfil y llamar
          execute("Security","Admin","listarPermisosMetodo",[perfilId])

  2. Render:
       - selector de perfil arriba,
       - buscador de metodos (filtra en memoria por subsistema, clase o
         nombre),
       - arbol/lista agrupada: SUBSISTEMA > CLASE > METODO,
       - cada metodo: nombre, descripcion, interruptor (checkbox/switch),
       - contador "N de M metodos asignados",
       - estado vacio y estado de carga.

  3. Al cambiar un interruptor:
       a. deshabilitar ese interruptor mientras la peticion esta en vuelo,
       b. si se marca:   asignarPermisoMetodo(perfilId, metodoId)
          si se desmarca: quitarPermisoMetodo(perfilId, metodoId)
       c. con 200: confirmar el nuevo estado con lo que devuelve el backend
          (no adivines) y actualizar el contador.
       d. con error: revertir el interruptor al estado anterior y mostrar el
          mensaje del backend.

     NO uses un boton "Guardar" global: el guardado es por metodo y en
     caliente. Si igual queres un boton, que sea "Recargar".

  4. Al cambiar de perfil:
       - descartar el estado del perfil anterior,
       - volver a llamar listarPermisosMetodo con el nuevo id,
       - no reutilizar el catalogo de la llamada anterior si el usuario pudo
         haber cambiado (mejor una llamada limpia; es barata).


==============================================================================
4. REGLAS DE UI Y SEGURIDAD
==============================================================================

  - La vista es SOLO para Superusuario. Ocultar el item de menu no alcanza:
    si igual se entra por URL directa, el backend responde 403. Igual
    conviene no renderizar la pantalla si el perfil no esta.

  - Si el perfil seleccionado es Superusuario, los metodos con critico:true
    se muestran marcados y con el interruptor DESHABILITADO, con un texto
    tipo "Obligatorio para Superusuario". Asi el usuario no descubre el 409
    a los golpes.

  - Confirmacion: quitar un permiso es destructivo para ese perfil. Pedi
    confirmacion (dialogo del navegador o modal propio) antes de desmarcar.
    Asignar no necesita confirmacion.

  - No muestres ids crudos al usuario; mostra subsistema/clase/metodo.
    Los ids viajan en el payload, no en la etiqueta.

  - El buscador no debe perder el estado de los interruptores ya cambiados.

  - Accesibilidad: el interruptor tiene que ser un control real
    (checkbox o button con aria-checked), operable con teclado, con
    etiqueta asociada.

  - Nada de innerHTML con datos del backend. textContent o escapeHtml.

  - Despues de cada cambio exitoso, el backend ya aplico el permiso en
    caliente. No hace falta recargar la pagina ni reiniciar el servidor.
    Si el usuario que se esta editando es uno mismo y se quita un permiso,
    la siguiente llamada de ese usuario ya recibe 403: avisalo en la UI.


==============================================================================
5. MANEJO DE ERRORES
==============================================================================

  400  dato invalido (ids). Es un bug del front: no deberia pasar. Log y
       mensaje generico.
  403  el usuario de la sesion no es Superusuario (o perdio el permiso).
       Sacar la vista y avisar.
  404  el perfil o el metodo ya no existe/esta inactivo. Recargar la lista.
  409  intento de quitar un critico a Superusuario. Revertir el interruptor
       y mostrar el mensaje.
  500  error del servidor. Revertir el interruptor y mostrar el mensaje.

  En todos los casos: el estado visual tiene que volver a lo que dice el
  servidor. Nunca dejes un interruptor "marcado" si la escritura fallo.


==============================================================================
6. CHECKLIST DE ACEPTACION — PARTE 2
==============================================================================

  [ ] La opcion "Permisos" aparece en el menu solo para Superusuario.
  [ ] Entrar con otro perfil (por URL directa) no renderiza la vista y las
      llamadas dan 403.
  [ ] El selector de perfil se llena con Security/User/listarPerfiles.
  [ ] Al elegir un perfil se ve el catalogo completo agrupado por
      subsistema y clase, con su estado asignado.
  [ ] Marcar un metodo lo asigna en el backend (la fila queda en
      permiso_metodo y el permiso aplica en la siguiente peticion, sin
      reiniciar).
  [ ] Desmarcar lo quita, con confirmacion previa.
  [ ] Repetir la misma accion no rompe: el backend es idempotente.
  [ ] Con Superusuario seleccionado, los metodos criticos tienen el
      interruptor deshabilitado.
  [ ] Todo error revierte el interruptor y muestra el mensaje del backend.
  [ ] El contador "N de M" se mantiene correcto despues de cada cambio.
  [ ] La pantalla funciona con teclado y no usa innerHTML con datos del
      backend.

##############################################################################
#                                                                            #
#  PARTE 3 — ADMINISTRACION DE PERFILES Y ASIGNACION A USUARIOS              #
#                                                                            #
##############################################################################

ESTADO: el backend de esta parte esta IMPLEMENTADO (spec 010). Migraciones
aplicadas: 008 (metodos y permisos de perfiles) y 009 (lectura de los
perfiles de un usuario). La especificacion vive en:

  specs/010-perfiles/spec.md
  specs/010-perfiles/plan.md
  specs/010-perfiles/tasks.md

Confirma con el backend que 008 y 009 estan aplicadas; si no, los metodos
responden 403/501.


==============================================================================
1. QUE SE CONSTRUYE
==============================================================================

Dos pantallas (o dos pestanas de la misma seccion "Perfiles"):

  A. GESTION DE PERFILES
     - listar todos los perfiles, activos e inactivos, con cuantos usuarios
       los usan,
     - crear un perfil,
     - editar nombre y descripcion,
     - activar/desactivar.

  B. ASIGNACION DE PERFILES A UN USUARIO
     - elegir un usuario existente,
     - ver que perfiles tiene hoy,
     - reemplazar el conjunto completo y guardar.

NO se administran aca las opciones de menu de cada perfil (que pantallas ve):
eso es `permiso_opcion` y queda para una spec posterior. Tampoco se administran
los metodos del perfil: eso es la PARTE 2.

Aviso importante para la UI: un perfil recien creado nace con 6 permisos de
sesion (logout, getSession, sessionExist, refresh, getOptions y cambiarClave),
pero SIN opciones de menu. Un usuario con solo ese perfil podra entrar y salir,
pero no vera ninguna opcion hasta que se le asignen (pendiente). Mostra ese
aviso al crear un perfil y no prometas que la vista aparece sola.


==============================================================================
2. CONTRATO
==============================================================================

Se usa la misma funcion execute() de la parte 1. No hay endpoints nuevos.

  POST /api/execute
  { "subsystem": "Security", "class": "...", "method": "...", "params": [...] }

Todos los params son posicionales.

Quien puede que:
  - listarPerfilesAdmin        -> Superusuario y Administrador
  - listarPerfilesUsuario      -> Superusuario y Administrador
  - crearPerfil                -> SOLO Superusuario
  - editarPerfil               -> SOLO Superusuario
  - cambiarEstadoPerfil        -> SOLO Superusuario
  - establecerPerfilesUsuario  -> SOLO Superusuario

El backend valida igual: un Administrador que intente mutar recibe 403.
Ocultar el boton es comodidad, no seguridad.

------------------------------------------------------------------------------
2.1 Security/Admin/listarPerfilesAdmin()
------------------------------------------------------------------------------

  params: []

  200 -> [
    { id: 1, nombre: "Superusuario", descripcion: "Acceso total",
      activo: true, usuarios: 1, usuariosActivos: 1, protegido: true },
    { id: 4, nombre: "Empleado", descripcion: "Usuario final",
      activo: true, usuarios: 7, usuariosActivos: 6, protegido: false },
    { id: 8, nombre: "Viejo", descripcion: null,
      activo: false, usuarios: 2, usuariosActivos: 0, protegido: false }
  ]

  Ordenado por activo DESC y nombre ASC.
  usuarios = filas de usuario_perfil (incluye usuarios inactivos).
  usuariosActivos = solo usuarios con usuario.activo.
  protegido = true solo para "Superusuario": no se renombra ni se desactiva.

------------------------------------------------------------------------------
2.2 Security/Admin/crearPerfil(nombre, descripcion)
------------------------------------------------------------------------------

  params: [nombre, descripcion]     descripcion puede ser null o ""

  200 -> { id: 8, nombre: "Contador", descripcion: "Nomina y reportes",
           activo: true, protegido: false, permisosBase: 6 }

  Reglas:
    - nombre: 3 a 50 caracteres, solo letras y numeros, empieza con letra.
      Regex del backend: ^[A-Za-z][A-Za-z0-9]{2,49}$
    - descripcion: hasta 200 caracteres; vacia se guarda como null.
    - el nombre es unico sin distinguir mayusculas: "Contador" y "contador"
      chocan.

  400 nombre/descripcion invalidos.  409 nombre repetido.

  En la misma transaccion se crean el perfil y sus 6 permisos base. El mapa
  de permisos del backend se refresca en caliente.

------------------------------------------------------------------------------
2.3 Security/Admin/editarPerfil(perfilId, nombre, descripcion)
------------------------------------------------------------------------------

  params: [perfilId, nombre, descripcion]

  200 -> { id: 4, nombre: "Empleado", descripcion: "Usuario final",
           activo: true, protegido: false }

  Se puede editar un perfil inactivo (para corregirlo antes de reactivarlo).

  400 id/nombre/descripcion invalidos.
  404 perfil inexistente.
  409 si el nombre choca con otro perfil, o si se intenta renombrar
      "Superusuario" (la descripcion SI se puede cambiar).

  Renombrar no rompe permisos ni usuarios: las relaciones usan el id.

------------------------------------------------------------------------------
2.4 Security/Admin/cambiarEstadoPerfil(perfilId, activo)
------------------------------------------------------------------------------

  params: [perfilId, activo]        activo debe ser boolean (no "true"/1)

  200 -> { id: 8, nombre: "Contador", descripcion: "...",
           activo: false, protegido: false, cambio: true }

  cambio = false si ya estaba en ese estado (idempotente).

  400 activo no booleano o id invalido.
  404 perfil inexistente.
  409 si se intenta desactivar "Superusuario".

  Al desactivar, el perfil pierde sus permisos en el mapa en caliente; al
  reactivar, los recupera. No se borra nada: los usuarios que lo tenian
  conservan la fila.

------------------------------------------------------------------------------
2.5 Security/User/listarPerfilesUsuario(usuarioId)
------------------------------------------------------------------------------

  params: [usuarioId]               UUID del usuario (no de la persona)

  200 -> {
    usuarioId: "11111111-1111-4111-8111-111111111111",
    username: "ana",
    activo: true,
    perfiles: [
      { id: 4, nombre: "Empleado", activo: true },
      { id: 7, nombre: "Viejo", activo: false }
    ]
  }

  Incluye perfiles inactivos con activo:false, para que la UI avise.
  400 si usuarioId no es UUID.  404 si el usuario no existe.

------------------------------------------------------------------------------
2.6 Security/User/establecerPerfilesUsuario(usuarioId, perfiles)
------------------------------------------------------------------------------

  params: [usuarioId, perfiles]     perfiles: arreglo NO vacio de ids enteros

  200 -> {
    usuarioId: "11111111-1111-4111-8111-111111111111",
    username: "ana",
    perfiles: [
      { id: 4, nombre: "Empleado" },
      { id: 8, nombre: "Contador" }
    ]
  }

  REEMPLAZA el conjunto completo: lo que no vaya en el arreglo se quita.
  No hay metodos de agregar/quitar sueltos. Se deduplican los ids.

  400 UUID invalido, arreglo vacio, ids no enteros, o perfil
      inexistente/inactivo.
  403 si el solicitante no es Superusuario e intenta asignar Superusuario,
      Administrador o GerenteRRHH.
  404 si el usuario no existe.
  409 si el cambio dejaria el sistema sin ningun usuario activo con
      Superusuario.

  Aplica en la siguiente peticion del usuario afectado (la sesion relee sus
  perfiles).

------------------------------------------------------------------------------
2.7 Security/User/listarPersonas()   (ya existe, se reutiliza)
------------------------------------------------------------------------------

  params: []

  200 -> [
    { id: "<uuid persona>", cedula: "V-1", primer_nombre: "Ana",
      primer_apellido: "Perez", email: "...",
      usuario_id: "11111111-1111-4111-8111-111111111111",
      username: "ana", usuario_activo: true,
      cargo: "Contador", contrato_id: "...", tipo_pago: "SALARIO_FIJO",
      frecuencia_pago: "MENSUAL", contrato_estado: "VIGENTE",
      monto_salario: "500.00" }
  ]

  Es la fuente del selector de usuario. Filtra las personas sin
  usuario_id: no tienen cuenta y no se les pueden asignar perfiles.
  usuario_id es el UUID que espera establecerPerfilesUsuario.

------------------------------------------------------------------------------
2.8 Security/User/listarPerfiles()   (ya existe, se reutiliza)
------------------------------------------------------------------------------

  params: []

  200 -> [ { id: 1, nombre: "Superusuario", descripcion: "..." }, ... ]

  Solo perfiles activos. Podes usarlo para un selector rapido, pero para la
  pantalla de asignacion conviene listarPerfilesAdmin porque tambien trae los
  inactivos y el uso.


==============================================================================
3. FLUJO DE LAS PANTALLAS
==============================================================================

A. GESTION DE PERFILES

  1. Al entrar:
       a. leer la sesion (GET /api/me -> profiles[].nombre).
       b. si no es Superusuario ni Administrador, no renderizar.
       c. execute("Security","Admin","listarPerfilesAdmin",[]).
       d. si es Administrador, ocultar crear/editar/activar/desactivar.

  2. Render:
       - tabla o tarjetas: nombre, descripcion, activo, usuarios
         (usuariosActivos), etiqueta "Protegido" cuando protegido:true,
       - boton "Nuevo perfil",
       - por fila: "Editar" y "Activar/Desactivar",
       - estado de carga y estado vacio.

  3. Crear:
       - formulario con nombre y descripcion (opcional),
       - validar en el cliente con la misma regla del backend, pero no
         bloquear por las dudas: mostra el 400/409 del servidor,
       - deshabilitar "Crear" mientras la peticion esta en vuelo,
       - con 200: cerrar el formulario y recargar listarPerfilesAdmin,
       - con 409: mostrar el mensaje del backend junto al campo nombre,
       - avisar que el perfil nace sin opciones de menu.

  4. Editar:
       - si protegido:true, el campo nombre va deshabilitado y con el texto
         "El perfil Superusuario no se puede renombrar"; la descripcion si
         se puede editar,
       - con 200: recargar la lista (no parchear a mano),
       - con 409: mostrar el mensaje.

  5. Activar/Desactivar:
       - pedir confirmacion, sobre todo al desactivar,
       - si usuariosActivos > 0, avisar cuantos usuarios activos lo usan y
         que se quedaran sin ese perfil,
       - con 200 y cambio:false, no es un error: la lista ya estaba asi;
         recargar y listo,
       - con 409 (Superusuario): mostrar el mensaje y no cambiar nada.

B. ASIGNACION DE PERFILES A UN USUARIO

  1. Al entrar:
       a. comprobar el perfil de la sesion (Superusuario o Administrador),
       b. execute("Security","User","listarPersonas",[]),
       c. quedarse solo con las personas que tengan usuario_id,
       d. armar un buscador por cedula, nombre o username.

  2. Al elegir un usuario:
       a. execute("Security","User","listarPerfilesUsuario",[usuarioId]),
       b. execute("Security","Admin","listarPerfilesAdmin",[]) para el
          catalogo completo,
       c. pintar un checkbox por perfil activo del catalogo, marcado si esta
          en la respuesta de 2.5,
       d. si el usuario tenia un perfil hoy inactivo, mostrarlo marcado y
          deshabilitado con el texto "Perfil inactivo: reactivalo en la
          pestana Perfiles",
       e. no ofrecer "Publico" si existe: es el perfil anonimo.

  3. Guardar:
       - el boton "Guardar perfiles" manda el conjunto COMPLETO marcado:
         execute("Security","User","establecerPerfilesUsuario",
                  [usuarioId, idsSeleccionados]),
       - no mandes un arreglo vacio: el backend responde 400 y la UI debe
         impedirlo antes,
       - con 200: recargar listarPerfilesUsuario y mostrar el conjunto que
         devolvio el backend,
       - deshabilitar el boton mientras la peticion esta en vuelo.

  4. Escalada de privilegios:
       - si la sesion NO es Superusuario, los perfiles Superusuario,
         Administrador y GerenteRRHH se muestran deshabilitados con el texto
         "Solo un Superusuario puede asignar este perfil",
       - si igual se manda, el backend responde 403: mostralo.

  5. Guarda anti-bloqueo:
       - si el usuario es el ultimo Superusuario activo y se lo quitas, el
         backend responde 409. Revertir la seleccion al estado que devuelve
         listarPerfilesUsuario y mostrar el mensaje.

  6. Confirmacion: reemplazar perfiles es destructivo. Antes de guardar,
     mostra un resumen de lo que se agrega y lo que se quita.


==============================================================================
4. REGLAS DE UI Y SEGURIDAD
==============================================================================

  - La vista de mutacion es SOLO para Superusuario. Un Administrador puede
    listar (perfiles y perfiles de un usuario) pero no crear/editar/cambiar
    estado/asignar. Ocultar no alcanza: el backend responde 403.

  - Nunca mandes el nombre del perfil como identidad: las llamadas usan
    perfilId/usuarioId. Los nombres son solo etiquetas.

  - Un perfil inactivo no se puede asignar (400). Para asignarlo hay que
    reactivarlo primero en la pestana Perfiles.

  - No borres perfiles: la UI solo activa/desactiva. No inventes un
    "eliminar" que el backend no tiene.

  - Despues de cada mutacion, recarga desde el servidor. No parchees el
    estado local a mano.

  - Nada de innerHTML con datos del backend. textContent o escapeHtml.

  - Accesibilidad: checkboxes reales con etiqueta asociada; los botones de
    estado con aria-pressed o texto claro ("Activar"/"Desactivar").

  - Mostra los conteos de uso (usuarios/usuariosActivos) tal como llegan;
    sirven para decidir si es seguro desactivar.

  - No muestres ids crudos. El id viaja en el payload, no en la etiqueta.

  - Si el usuario editado sos vos mismo y te quitas un perfil, la siguiente
    peticion ya no lo tiene: avisalo antes de guardar.


==============================================================================
5. MANEJO DE ERRORES
==============================================================================

  400  dato invalido (nombre, descripcion, ids, UUID, arreglo vacio).
       Es un bug del front: log y mensaje generico; no dejes el formulario
       en un estado raro.
  403  la sesion no es Superusuario y quizo mutar o asignar un privilegiado.
       Revertir y mostrar el mensaje del backend.
  404  el perfil o el usuario ya no existe. Recargar la lista.
  409  nombre repetido, rename/desactivacion de Superusuario, o quedaria el
       sistema sin superusuarios. Revertir y mostrar el mensaje tal cual.
  500  error del servidor. Revertir y mostrar el mensaje.

  En todos los casos el estado visual tiene que volver a lo que dice el
  servidor.


==============================================================================
6. CHECKLIST DE ACEPTACION — PARTE 3
==============================================================================

  [ ] La opcion "Perfiles" aparece solo para Superusuario y Administrador.
  [ ] Un Administrador ve la lista pero no los botones de mutacion; si
      intenta mutar por API, recibe 403.
  [ ] listarPerfilesAdmin muestra activos e inactivos con usuarios,
      usuariosActivos y la etiqueta "Protegido".
  [ ] Crear un perfil recarga la lista y avisa que nace sin opciones de menu.
  [ ] Un nombre repetido sin distinguir mayusculas muestra el 409 del backend.
  [ ] Editar cambia nombre/descripcion; el nombre de Superusuario esta
      deshabilitado y la descripcion no.
  [ ] Desactivar/reactivar actualiza la lista; desactivar Superusuario da 409
      y la UI lo muestra.
  [ ] Antes de desactivar un perfil con usuariosActivos > 0, la UI avisa.
  [ ] El selector de usuario sale de listarPersonas y excluye personas sin
      usuario_id.
  [ ] Al elegir un usuario se ven sus perfiles actuales desde
      listarPerfilesUsuario, incluidos los inactivos.
  [ ] Guardar manda el conjunto completo y recarga desde el servidor.
  [ ] No se puede guardar un conjunto vacio desde la UI.
  [ ] Un no Superusuario ve deshabilitados Superusuario/Administrador/
      GerenteRRHH y un 403 del backend si igual los manda.
  [ ] Quitar el ultimo Superusuario activo muestra el 409 y revierte.
  [ ] La pantalla funciona con teclado y no usa innerHTML con datos del
      backend.

==============================================================================
FIN
==============================================================================
