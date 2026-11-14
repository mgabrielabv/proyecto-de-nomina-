#!/usr/bin/env node
/**
 * E2E de navegación del frontend de Onyx — sin dependencias nuevas.
 *
 * Usa los built-ins de Node (fetch + WebSocket global) para hablar Chrome
 * DevTools Protocol contra un Chrome headless lanzado en un puerto propio. No
 * reemplaza a Playwright: es la red de seguridad mínima que exige el proyecto
 * mientras no haya runner de frontend instalado.
 *
 * Qué verifica, por cada perfil del usuario de prueba:
 *   1. Recorre TODAS las opciones del sidebar (todos los paneles), y por cada
 *      una comprueba: ruta, título de la barra superior y del documento, h1 de
 *      la pantalla, altura/contenido del área principal, opacidad final 1.
 *   2. Clics rápidos (30 ms) sobre las mismas opciones: la pantalla final debe
 *      quedar visible, nunca en negro.
 *   3. Recarga completa sobre la última ruta: el contenido vuelve a montarse.
 *   4. Audita todos los inputs/textarea/select visibles: nombre accesible,
 *      placeholder y etiqueta flotante no pueden mostrarse superpuestos.
 *
 * Además, una sola vez:
 *   5. 500 forzado en /api/execute → tarjeta de error visible con "Reintentar"
 *      y recuperación al reintentar.
 *   6. 401 + refresh → la petición se reintenta sola, sin alerta ni pantalla
 *      vacía.
 *   7. Error de render forzado → ErrorBoundary visible con "Reintentar".
 *   8. 404 y 403 visibles (nunca redirección silenciosa ni pantalla en blanco).
 *   9. Sin overflow horizontal a 390 px en las pantallas del reporte.
 *
 * Uso:
 *   pnpm e2e:nav
 *   E2E_BASE=http://localhost:5173 E2E_API=http://localhost:3002 pnpm e2e:nav
 *
 * Requisitos: backend y Vite corriendo, Chrome instalado (CHROME_BIN).
 * El reporte detallado se escribe en /tmp/opencode/onyx-e2e-report.json.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const BASE = process.env.E2E_BASE ?? 'http://localhost:5173';
const API = process.env.E2E_API ?? 'http://localhost:3002';
const CHROME = process.env.CHROME_BIN ?? '/opt/google/chrome/chrome';
const USERNAME = process.env.E2E_USER ?? 'admin_prueba';
const PASSWORD = process.env.E2E_PASS ?? 'Password123';
const PORT = Number(process.env.E2E_PORT ?? 9333);
const REPORT_PATH = process.env.E2E_REPORT ?? '/tmp/opencode/onyx-e2e-report.json';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* -------------------------------------------------------------------------- */
/* Cliente CDP mínimo                                                         */
/* -------------------------------------------------------------------------- */

class Cdp {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const onOpen = () => {
        this.ws.removeEventListener('error', onError);
        resolve();
      };
      const onError = (event) => {
        this.ws.removeEventListener('open', onOpen);
        reject(new Error(`No se pudo conectar a CDP: ${event?.message ?? 'error'}`));
      };
      this.ws.addEventListener('open', onOpen);
      this.ws.addEventListener('error', onError);
    });

    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${message.error.message} (${message.error.code})`));
        else pending.resolve(message.result);
        return;
      }
      const handlers = this.handlers.get(message.method) ?? [];
      handlers.forEach((handler) => {
        try {
          handler(message.params);
        } catch (error) {
          console.error(`[e2e] handler ${message.method}:`, error);
        }
      });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    const list = this.handlers.get(method) ?? [];
    list.push(handler);
    this.handlers.set(method, list);
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      /* la conexión ya estaba cerrada */
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Recolección de errores                                                     */
/* -------------------------------------------------------------------------- */

const globalErrors = [];
const globalWarnings = [];
const httpFailures = [];
const loadingFailures = [];
const fieldAudit = [];
const steps = [];
const failures = [];

let currentStep = { name: 'inicio', errors: [], http: [], warnings: [] };

const beginStep = (name) => {
  currentStep = { name, errors: [], http: [], warnings: [] };
};

const recordError = (kind, text) => {
  const entry = { kind, text: String(text).slice(0, 600), step: currentStep.name };
  globalErrors.push(entry);
  currentStep.errors.push(entry);
};

const recordWarning = (text) => {
  const entry = String(text).slice(0, 400);
  globalWarnings.push(entry);
  currentStep.warnings.push(entry);
};

const recordHttpFailure = (failure) => {
  const entry = { ...failure, step: currentStep.name };
  httpFailures.push(entry);
  currentStep.http.push(entry);
};

const fail = (message, detail) => {
  failures.push({ step: currentStep.name, message, detail: detail ?? null });
};

const check = (condition, message, detail) => {
  if (!condition) fail(message, detail);
  return condition;
};

/* -------------------------------------------------------------------------- */
/* Arranque de Chrome y CDP                                                   */
/* -------------------------------------------------------------------------- */

const launchChrome = async () => {
  const userDataDir = await mkdtemp(join(tmpdir(), 'onyx-e2e-'));
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--window-size=1280,900',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ];
  const child = spawn(CHROME, args, { stdio: 'ignore' });

  let version = null;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) {
        version = await response.json();
        break;
      }
    } catch {
      /* Chrome todavía no abrió el puerto */
    }
    await sleep(150);
  }
  if (!version) {
    child.kill('SIGKILL');
    throw new Error(`Chrome no abrió el puerto de depuración ${PORT}. ¿Existe ${CHROME}?`);
  }

  const created = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('about:blank')}`, {
    method: 'PUT',
  });
  if (!created.ok) {
    child.kill('SIGKILL');
    throw new Error(`No se pudo crear la pestaña de CDP (${created.status})`);
  }
  const target = await created.json();

  return { child, userDataDir, target, version };
};

/* -------------------------------------------------------------------------- */
/* Helpers de página                                                          */
/* -------------------------------------------------------------------------- */

let cdp;

const evalExpr = async (expression, { awaitPromise = false } = {}) => {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text;
    throw new Error(`Error en la página: ${description}`);
  }
  return result.result.value;
};

const evalFn = (fn, ...args) => {
  const params = args.map((arg) => JSON.stringify(arg)).join(', ');
  return evalExpr(`(${fn.toString()})(${params})`, { awaitPromise: true });
};

const waitUntil = async (fn, { timeout = 10000, interval = 80, args = [] } = {}) => {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    last = await evalFn(fn, ...args);
    if (last) return last;
    await sleep(interval);
  }
  return last;
};

const navigate = async (url) => {
  await cdp.send('Page.navigate', { url });
  await waitUntil(() => document.readyState === 'complete', { timeout: 15000 });
};

const pageState = () => ({
  path: location.pathname + location.search,
  title: document.title,
  topbar: document.querySelector('header h1')?.textContent?.trim() ?? null,
  main: (() => {
    const main = document.querySelector('main');
    if (!main) return null;
    const inner = main.firstElementChild;
    const rect = main.getBoundingClientRect();
    return {
      height: Math.round(rect.height),
      opacity: inner ? Number(getComputedStyle(inner).opacity) : null,
      // Marca que el layout pone en el contenedor del Outlet. Es la única
      // prueba de que lo montado corresponde a la ruta actual: sin esto, un
      // h1 viejo (p. ej. el de la pantalla anterior) hacía pasar la espera.
      route: inner?.getAttribute('data-route') ?? null,
      h1: main.querySelector('h1')?.textContent?.trim() ?? null,
      textLen: main.innerText.trim().length,
      alert: main.querySelector('[role="alert"]')?.innerText.trim().slice(0, 400) ?? null,
      scrollWidth: document.body.scrollWidth,
      viewportWidth: innerWidth,
    };
  })(),
});

const waitForPage = async (expectedPath, { timeout = 9000 } = {}) => {
  const deadline = Date.now() + timeout;
  let last = null;
  let previous = null;
  while (Date.now() < deadline) {
    last = await evalFn(pageState);
    const titleOk = Boolean(last.title && last.topbar && last.title === `${last.topbar} — Onyx`);
    const ready =
      last.main &&
      last.main.h1 &&
      last.main.height > 120 &&
      last.main.opacity !== null &&
      last.main.opacity >= 0.99 &&
      titleOk &&
      (!expectedPath || last.path === expectedPath) &&
      (!expectedPath || last.main.route === expectedPath);
    if (ready) {
      // Dos lecturas seguidas con el mismo h1: el contenido ya no está en
      // tránsito (montaje de la pantalla nueva tras la navegación).
      if (previous && previous.path === last.path && previous.main?.h1 === last.main?.h1) return last;
      previous = last;
      await sleep(90);
      continue;
    }
    previous = null;
    await sleep(70);
  }
  return last;
};

const readSidebar = () => {
  const nav = document.querySelector('nav[aria-label="Navegación principal"]');
  if (!nav) return null;
  // Mientras el menú real no llegue, el nav dibuja el fallback genérico con
  // aria-busy="true". Sin esta señal, el recorrido arrancaba sobre el fallback
  // y todos sus ítems quedaban inertes (no navegaban).
  const busy = nav.getAttribute('aria-busy') === 'true';
  const viewport = nav.firstElementChild;
  if (!viewport) {
    return { panels: [], busy, state: nav.innerText.trim().slice(0, 200) };
  }
  const panels = [...viewport.children].map((panel) => ({
    label: panel.querySelector('h2')?.textContent?.trim() ?? null,
    inert: panel.hasAttribute('inert') || panel.inert === true,
    items: [...panel.querySelectorAll('li button')]
      .map((button) => button.textContent.trim())
      .filter(Boolean),
  }));
  return { panels, busy, state: null };
};

const waitForSidebar = async ({ timeout = 15000 } = {}) => {
  const deadline = Date.now() + timeout;
  let last = null;
  while (Date.now() < deadline) {
    last = await evalFn(readSidebar);
    const ready = last && !last.busy && (last.panels.some((panel) => panel.items.length > 0) || last.state);
    if (ready) {
      // El menú real recién montado puede reordenar paneles; se confirma con
      // una segunda lectura idéntica antes de recorrerlo.
      await sleep(140);
      const confirmed = await evalFn(readSidebar);
      if (
        confirmed &&
        !confirmed.busy &&
        JSON.stringify(confirmed.panels) === JSON.stringify(last.panels)
      ) {
        return confirmed;
      }
      last = confirmed ?? last;
      continue;
    }
    await sleep(100);
  }
  return last;
};

const ensurePanel = async (index) => {
  const panels = await evalFn(() => {
    const nav = document.querySelector('nav[aria-label="Navegación principal"]');
    const viewport = nav?.firstElementChild;
    return viewport
      ? [...viewport.children].map((panel) => ({
          inert: panel.hasAttribute('inert') || panel.inert === true,
          label: panel.querySelector('h2')?.textContent?.trim() ?? null,
        }))
      : [];
  });
  if (!panels[index]) return false;
  if (!panels[index].inert) return true;

  const clicked = await evalFn(() => {
    const nav = document.querySelector('nav[aria-label="Navegación principal"]');
    const button = nav?.querySelector('button[aria-label^="Ir a "]');
    if (!button) return false;
    button.click();
    return true;
  });
  if (!clicked) return false;

  return Boolean(
    await waitUntil(
      (target) => {
        const nav = document.querySelector('nav[aria-label="Navegación principal"]');
        const panel = nav?.firstElementChild?.children?.[target];
        return Boolean(panel) && !panel.hasAttribute('inert') && panel.inert !== true;
      },
      { args: [index], timeout: 4000 },
    ),
  );
};

const clickSidebarItem = async (panelIndex, label) => {
  const before = await evalExpr('location.pathname');
  const result = await evalFn(
    (index, text) => {
      const nav = document.querySelector('nav[aria-label="Navegación principal"]');
      const panel = nav?.firstElementChild?.children?.[index];
      if (!panel) return { clicked: false, active: false };
      const button = [...panel.querySelectorAll('li button')].find(
        (candidate) => candidate.textContent.trim() === text,
      );
      if (!button) return { clicked: false, active: false };
      const active = button.getAttribute('aria-current') === 'page';
      button.click();
      return { clicked: true, active };
    },
    panelIndex,
    label,
  );
  if (!result.clicked) return { clicked: false, path: before };
  // Si el ítem ya era la ruta activa no hay navegación que esperar.
  if (result.active) return { clicked: true, path: before };

  const path = await waitUntil(
    (previous) => (location.pathname === previous ? null : location.pathname),
    { args: [before], timeout: 6000 },
  );
  return { clicked: true, path: path || before };
};

/* -------------------------------------------------------------------------- */
/* Auditoría de campos de formulario                                          */
/* -------------------------------------------------------------------------- */

const auditFields = (pageLabel) => {
  const fields = [...document.querySelectorAll('input, textarea, select')];
  return fields.map((el) => {
    // El nombre accesible puede venir de tres formas: `label[for]` (campo
    // flotante y checkbox), un `label` que envuelve al control (checkbox) o un
    // `aria-label` (buscadores). Antes solo se miraba el `label` dentro de
    // `.relative`, así que el checkbox de "Recordarme" se reportaba sin nombre.
    const explicit = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
    const wrapping = el.closest('label');
    const wrap = el.closest('.relative');
    const wrapLabel = wrap?.querySelector('label');
    const wrapMatches =
      wrapLabel && (!wrapLabel.getAttribute('for') || wrapLabel.getAttribute('for') === el.id)
        ? wrapLabel
        : null;
    const label = explicit ?? wrapMatches ?? wrapping ?? null;
    const transform = label ? getComputedStyle(label).transform : 'none';
    const floated = transform !== 'none' && !/^matrix\(1,\s*0,\s*0,\s*1,/.test(transform);
    const placeholder = el.getAttribute('placeholder');
    const value = String(el.value ?? '');
    const aria = el.getAttribute('aria-label') || (label ? label.textContent.trim() : null);
    const type = el.getAttribute('type') ?? el.tagName.toLowerCase();
    const issues = [];

    if (label && placeholder && !floated && !value) {
      issues.push('placeholder visible con la etiqueta en reposo (se superponen)');
    }
    const isDateOrTime = ['date', 'time', 'datetime-local', 'month', 'week'].includes(type);
    if (label && isDateOrTime && !floated) {
      issues.push('campo de fecha con etiqueta en reposo (se superpone con la máscara nativa del navegador)');
    }
    if (!aria && !placeholder) {
      issues.push('sin nombre accesible ni placeholder');
    }
    if (!label && placeholder && placeholder.length > 70) {
      issues.push('placeholder demasiado largo para una línea');
    }

    return {
      page: pageLabel,
      tag: el.tagName.toLowerCase(),
      type,
      name: el.getAttribute('name'),
      id: el.id || null,
      placeholder,
      value: value.slice(0, 60),
      label: label ? label.textContent.trim() : null,
      labelFloated: floated,
      ariaLabel: aria,
      issues,
    };
  });
};

const collectFields = async (pageLabel) => {
  const fields = await evalFn(auditFields, pageLabel);
  fieldAudit.push(...fields);
  fields
    .filter((field) => field.issues.length > 0)
    .forEach((field) => {
      fail(`Campo con problema en ${pageLabel}: ${field.name ?? field.id ?? field.type}`, field);
    });
  return fields;
};

/* -------------------------------------------------------------------------- */
/* Sesión y perfiles                                                          */
/* -------------------------------------------------------------------------- */

const login = async () => {
  beginStep('login');
  await navigate(`${BASE}/login`);
  await waitUntil(() => Boolean(document.querySelector('input[name="username"]')), { timeout: 15000 });
  await collectFields('Login');

  const result = await evalFn(
    async (api, username, password) => {
      const response = await fetch(`${api}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json().catch(() => null);
      return { status: response.status, body };
    },
    API,
    USERNAME,
    PASSWORD,
  );
  check(result.status === 200, `Login falló con estado ${result.status}`, result.body);

  const me = await evalFn(async (api) => {
    const response = await fetch(`${api}/api/me`, { credentials: 'include' });
    return response.ok ? response.json() : null;
  }, API);
  check(Boolean(me?.profiles?.length), 'La sesión no devolvió perfiles', me);

  await navigate(`${BASE}/payroll/periodos`);
  await waitUntil(
    () => Boolean(document.querySelector('nav[aria-label="Navegación principal"]')),
    { timeout: 20000 },
  );
  return me;
};

const currentProfile = () =>
  evalFn(() => {
    const aside = document.querySelector('aside');
    const button = aside?.querySelector('button[aria-haspopup="menu"]');
    return button?.textContent?.trim() ?? null;
  });

const switchProfile = async (nombre) => {
  beginStep(`perfil:${nombre}`);
  // Las pantallas 403/404 se dibujan fuera del layout (sin sidebar ni
  // selector de perfil). Antes de cambiar de perfil hay que volver a una ruta
  // con layout; /dashboard existe para todos los perfiles.
  const hasAside = await evalExpr("Boolean(document.querySelector('aside'))");
  if (!hasAside) {
    await pushRoute('/dashboard');
    await waitUntil(() => Boolean(document.querySelector('aside')), { timeout: 10000 });
    await waitForSidebar();
  }

  const before = await currentProfile();
  if (before && before.endsWith(nombre)) {
    await waitForSidebar();
    return true;
  }

  const opened = await evalFn(() => {
    const aside = document.querySelector('aside');
    const button = aside?.querySelector('button[aria-haspopup="menu"]');
    if (!button) return false;
    button.click();
    return true;
  });
  if (!opened) {
    fail(`No se encontró el menú de perfil para cambiar a ${nombre}`);
    return false;
  }

  await waitUntil(() => Boolean(document.querySelector('[role="menu"] [role="menuitemradio"]')), {
    timeout: 5000,
  });
  const clicked = await evalFn((target) => {
    const option = [...document.querySelectorAll('[role="menuitemradio"]')].find(
      (candidate) => candidate.textContent.trim() === target,
    );
    if (!option) return false;
    option.click();
    return true;
  }, nombre);
  if (!clicked) {
    fail(`No se encontró el perfil ${nombre} en el menú`);
    return false;
  }

  const ok = await waitUntil(
    (target) => {
      const aside = document.querySelector('aside');
      const button = aside?.querySelector('button[aria-haspopup="menu"]');
      return Boolean(button && button.textContent.trim().endsWith(target));
    },
    { args: [nombre], timeout: 8000 },
  );
  check(Boolean(ok), `El perfil activo no cambió a ${nombre}`);
  await waitForSidebar();
  await sleep(200);
  return true;
};

/* -------------------------------------------------------------------------- */
/* Auditoría por perfil                                                       */
/* -------------------------------------------------------------------------- */

const assertPage = (state, { expectedPath, expectedTitle } = {}) => {
  if (!state) {
    fail('La pantalla no devolvió estado');
    return;
  }
  if (expectedPath) check(state.path === expectedPath, `Ruta inesperada: ${state.path}`, state);
  if (expectedTitle) check(state.title === expectedTitle, `Título inesperado: ${state.title}`, state);

  if (!state.main) {
    // Sin <main> no hay layout: o la pantalla es 403/404 (debe verse fuera de
    // estas rutas) o la aplicación no montó nada. Antes este caso pasaba en
    // silencio y una guarda que rechazaba la ruta se contaba como éxito.
    fail(`Sin área principal (layout) en ${state.path}`, state);
    return;
  }

  check(state.main.height > 120, `Área principal sin altura en ${state.path}`, state.main);
  check(state.main.opacity === null || state.main.opacity >= 0.99, `Contenido con opacity ${state.main.opacity} en ${state.path}`, state.main);
  check(state.main.textLen > 20, `Área principal vacía en ${state.path}`, state.main);
  check(Boolean(state.main.h1), `Pantalla sin encabezado h1 en ${state.path}`, state.main);
  check(
    state.main.scrollWidth <= state.main.viewportWidth + 1,
    `Overflow horizontal en ${state.path} (${state.main.scrollWidth} > ${state.main.viewportWidth})`,
    state.main,
  );

  if (state.title && state.topbar) {
    check(
      state.title === `${state.topbar} — Onyx`,
      `document.title no coincide con el título de la barra en ${state.path}: "${state.title}" vs "${state.topbar}"`,
      state,
    );
  }
};

const assertHandled = (step) => {
  const unexpected = step.http.filter((failure) => failure.status !== 403 && failure.status !== 404);
  if (unexpected.length > 0) {
    fail('Peticiones fallidas sin manejar', unexpected);
  }
};

const auditProfile = async (nombre) => {
  beginStep(`recorrido:${nombre}`);
  const sidebar = await waitForSidebar();
  if (!sidebar) {
    fail(`El sidebar no apareció para ${nombre}`);
    return null;
  }
  if (sidebar.state) {
    fail(`El sidebar muestra un estado vacío/error para ${nombre}: ${sidebar.state}`);
    return null;
  }

  const visited = [];
  const sections = sidebar.panels;

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    const active = await ensurePanel(sectionIndex);
    check(active, `No se pudo activar el panel ${section.label} de ${nombre}`);
    if (!active) continue;

    for (const label of section.items) {
      beginStep(`${nombre} · ${section.label} · ${label}`);
      const result = await clickSidebarItem(sectionIndex, label);
      check(result.clicked, `No se pudo hacer clic en ${label}`);
      const state = await waitForPage(result.path);
      assertPage(state, { expectedPath: result.path });

      const fields = await collectFields(`${nombre} · ${label}`);
      const handledAlert = state?.main?.alert ?? null;
      if (handledAlert) {
        check(/reintentar/i.test(handledAlert), `Error sin acción de reintento en ${label}`, handledAlert);
      }
      assertHandled(currentStep);

      visited.push({
        section: section.label,
        label,
        path: result.path,
        title: state?.title ?? null,
        topbar: state?.topbar ?? null,
        h1: state?.main?.h1 ?? null,
        height: state?.main?.height ?? null,
        opacity: state?.main?.opacity ?? null,
        alert: handledAlert,
        fields: fields.length,
      });
    }
  }

  // Rutas personales compartidas. No salen del menú del servidor (cada perfil
  // ve solo los subsistemas que tiene asignados), pero son pantallas del
  // layout y también deben abrir con contenido, título correcto y sin error.
  const SHARED_ROUTES = [
    ['Inicio', '/dashboard'],
    ['Mi perfil', '/profile'],
    ['Mis recibos', '/payroll'],
    ['Mi asistencia', '/attendance'],
    ['Mis solicitudes', '/requests'],
    ['Configuración', '/settings'],
  ];
  for (const [label, route] of SHARED_ROUTES) {
    beginStep(`${nombre} · Mi espacio · ${label}`);
    await pushRoute(route);
    const state = await waitForPage(route);
    assertPage(state, { expectedPath: route });
    const fields = await collectFields(`${nombre} · ${label}`);
    assertHandled(currentStep);
    visited.push({
      section: 'Mi espacio',
      label,
      path: route,
      title: state?.title ?? null,
      topbar: state?.topbar ?? null,
      h1: state?.main?.h1 ?? null,
      height: state?.main?.height ?? null,
      opacity: state?.main?.opacity ?? null,
      alert: state?.main?.alert ?? null,
      fields: fields.length,
    });
  }

  // Clics rápidos: 15 navegaciones seguidas con 30 ms entre una y otra.
  beginStep(`clics-rápidos:${nombre}`);
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const active = await ensurePanel(sectionIndex);
    if (!active) continue;
    await evalFn(
      async (index, count) => {
        const nav = document.querySelector('nav[aria-label="Navegación principal"]');
        const panel = nav?.firstElementChild?.children?.[index];
        const items = [...(panel?.querySelectorAll('li button') ?? [])];
        for (let click = 0; click < count; click += 1) {
          items[click % items.length]?.click();
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
        return items.length;
      },
      sectionIndex,
      15,
    );
  }
  const afterRapid = await waitForPage(null);
  assertPage(afterRapid);
  assertHandled(currentStep);

  // Recarga completa sobre la última ruta.
  beginStep(`recarga:${nombre}`);
  const pathBeforeReload = await evalExpr('location.pathname');
  await cdp.send('Page.reload', { ignoreCache: false });
  await waitUntil(() => document.readyState === 'complete', { timeout: 15000 });
  await waitUntil(() => Boolean(document.querySelector('nav[aria-label="Navegación principal"]')), {
    timeout: 20000,
  });
  const sidebarAfterReload = await waitForSidebar();
  const afterReload = await waitForPage(pathBeforeReload);
  assertPage(afterReload, { expectedPath: pathBeforeReload });
  check(
    Boolean(sidebarAfterReload && sidebarAfterReload.panels.some((panel) => panel.items.length > 0)),
    `El sidebar no volvió a cargar tras la recarga de ${nombre}`,
    sidebarAfterReload,
  );
  assertHandled(currentStep);

  return {
    profile: nombre,
    visited,
    afterReload: {
      path: afterReload?.path ?? null,
      profileAfterReload: await currentProfile(),
      opacity: afterReload?.main?.opacity ?? null,
      height: afterReload?.main?.height ?? null,
    },
  };
};

/* -------------------------------------------------------------------------- */
/* Pruebas forzadas                                                           */
/* -------------------------------------------------------------------------- */

const installFetchMock = async (mock) => {
  const source = mock.toString();
  await evalFn((mockSource) => {
    if (!window.__e2eRealFetch) window.__e2eRealFetch = window.fetch;
    window.fetch = new Function('real', `return (${mockSource})(real);`)(window.__e2eRealFetch);
  }, source);
};

const restoreFetch = async () => {
  await evalFn(() => {
    if (window.__e2eRealFetch) {
      window.fetch = window.__e2eRealFetch;
      delete window.__e2eRealFetch;
    }
    return true;
  });
};

const pushRoute = (path) =>
  evalFn((target) => {
    history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return location.pathname;
  }, path);

const forceServerError = async () => {
  beginStep('forzado:500');
  await installFetchMock((real) => (input, init) => {
    const url = typeof input === 'string' ? input : input?.url ?? '';
    if (url.includes('/api/execute')) {
      return Promise.resolve(
        new Response(JSON.stringify({ error: 'Fallo simulado del servidor (500)' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
    return real(input, init);
  });

  await pushRoute('/admin/permissions');
  const alert = await waitUntil(
    () => document.querySelector('main [role="alert"]')?.innerText?.trim() ?? null,
    { timeout: 8000 },
  );
  check(Boolean(alert), 'Un 500 no mostró error visible');
  check(Boolean(alert && /Reintentar/i.test(alert)), 'El error del 500 no ofrece reintento', alert);

  await restoreFetch();
  const retried = await evalFn(() => {
    const button = [...document.querySelectorAll('main button')].find(
      (candidate) => candidate.textContent.trim() === 'Reintentar',
    );
    if (!button) return false;
    button.click();
    return true;
  });
  check(retried, 'No se encontró el botón Reintentar');
  const recovered = await waitUntil(
    () => !document.querySelector('main [role="alert"]') && Boolean(document.querySelector('main h1')),
    { timeout: 8000 },
  );
  check(Boolean(recovered), 'La pantalla no se recuperó tras reintentar el 500');
  return { alert: Boolean(alert), recovered: Boolean(recovered) };
};

const forceUnauthorized = async () => {
  beginStep('forzado:401+refresh');
  await installFetchMock((real) => {
    let injected = false;
    window.__e2eRefreshCount = 0;
    return (input, init) => {
      const url = typeof input === 'string' ? input : input?.url ?? '';
      if (url.includes('/api/refresh')) window.__e2eRefreshCount += 1;
      if (!injected && url.includes('/api/execute')) {
        injected = true;
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Sesión expirada (simulada)' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return real(input, init);
    };
  });

  await pushRoute('/admin/usuarios');
  const rows = await waitUntil(() => document.querySelectorAll('tbody tr').length, { timeout: 12000 });
  const refreshCount = await evalExpr('window.__e2eRefreshCount ?? 0');
  const alert = await evalExpr(
    'document.querySelector(\'main [role="alert"]\')?.innerText?.trim() ?? null',
  );
  await restoreFetch();

  check(refreshCount >= 1, 'Un 401 no disparó /api/refresh');
  check(!alert, 'Un 401 manejado dejó una alerta visible', alert);
  check(Number(rows) > 0, 'La pantalla no cargó datos después del refresh', { rows });
  return { rows: Number(rows), refreshCount };
};

const forceRenderError = async () => {
  beginStep('forzado:error-render');
  await installFetchMock((real) => (input, init) => {
    const url = typeof input === 'string' ? input : input?.url ?? '';
    const body = init?.body ? String(init.body) : '';
    if (url.includes('/api/execute') && body.includes('listarPermisosOpcion')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            perfil: { id: 1, nombre: 'Superusuario', descripcion: null },
            opciones: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }
    return real(input, init);
  });

  await pushRoute('/admin/opciones');
  await waitUntil(() => Boolean(document.querySelector('main h1')), { timeout: 8000 });
  await evalFn(() => {
    const tab = [...document.querySelectorAll('button')].find((candidate) =>
      candidate.textContent.includes('Asignar a perfil'),
    );
    tab?.click();
    return Boolean(tab);
  });

  const boundary = await waitUntil(
    () => document.querySelector('main [role="alert"]')?.innerText?.trim() ?? null,
    { timeout: 8000 },
  );
  await restoreFetch();

  check(Boolean(boundary), 'Un error de render no mostró la red de seguridad');
  check(
    Boolean(boundary && /No se pudo mostrar esta pantalla/i.test(boundary)),
    'El ErrorBoundary no mostró su mensaje',
    boundary,
  );
  check(
    Boolean(boundary && /Reintentar/i.test(boundary)),
    'El ErrorBoundary no ofrece reintento',
    boundary,
  );
  return { boundary: Boolean(boundary) };
};

const checkNotFound = async () => {
  beginStep('sistema:404');
  await pushRoute('/ruta-inexistente');
  // Se esperan las dos señales juntas: el h1 aparece en el render y el título
  // del documento en el efecto posterior. Mirar solo el h1 devolvía un estado
  // con el título todavía viejo y el chequeo fallaba sin ser un bug real.
  const state = await waitUntil(
    () => {
      const h1 = document.querySelector('h1')?.textContent?.trim() ?? null;
      const title = document.title;
      return h1 === 'Esta página no existe' && title === 'Página no encontrada — Onyx'
        ? { h1, title }
        : null;
    },
    { timeout: 8000 },
  );
  check(state?.h1 === 'Esta página no existe', 'La ruta inexistente no muestra 404 visible', state);
  check(state?.title === 'Página no encontrada — Onyx', 'El 404 no actualiza document.title', state);
  return state;
};

const checkForbidden = async () => {
  beginStep('sistema:403');
  await pushRoute('/admin/permissions');
  const state = await waitUntil(
    () => {
      const h1 = document.querySelector('h1')?.textContent?.trim() ?? null;
      const title = document.title;
      return h1 === 'Acceso denegado' && title === 'Acceso denegado — Onyx' ? { h1, title } : null;
    },
    { timeout: 8000 },
  );
  check(state?.h1 === 'Acceso denegado', 'La guarda de rol no muestra 403 visible', state);
  check(state?.title === 'Acceso denegado — Onyx', 'El 403 no actualiza document.title', state);
  return state;
};

const checkMobileOverflow = async () => {
  beginStep('móvil:390');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const routes = ['/admin/permissions', '/admin/registration', '/admin/usuarios'];
  const results = [];
  for (const route of routes) {
    await pushRoute(route);
    await waitForPage(route);
    const overflow = await evalFn(() => ({
      path: location.pathname,
      body: document.body.scrollWidth,
      viewport: innerWidth,
      main: document.querySelector('main')?.getBoundingClientRect().width ?? null,
    }));
    results.push(overflow);
    check(
      overflow.body <= overflow.viewport + 1,
      `Overflow horizontal a 390 px en ${overflow.path} (${overflow.body} > ${overflow.viewport})`,
      overflow,
    );
  }
  await cdp.send('Emulation.clearDeviceMetricsOverride');
  return results;
};

/* -------------------------------------------------------------------------- */
/* Programa principal                                                         */
/* -------------------------------------------------------------------------- */

const run = async () => {
  let chrome;
  try {
    chrome = await launchChrome();
    cdp = new Cdp(chrome.target.webSocketDebuggerUrl);
    await cdp.connect();

    await Promise.all([
      cdp.send('Runtime.enable'),
      cdp.send('Page.enable'),
      cdp.send('Log.enable'),
      cdp.send('Network.enable'),
    ]);

    cdp.on('Runtime.exceptionThrown', (params) => {
      const detail = params.exceptionDetails;
      recordError('exception', detail?.exception?.description ?? detail?.text ?? 'excepción sin detalle');
    });
    cdp.on('Runtime.consoleAPICalled', (params) => {
      const text = params.args
        .map((arg) => arg.value ?? arg.description ?? arg.preview?.description ?? '')
        .join(' ');
      if (params.type === 'error') recordError('console.error', text);
      else if (params.type === 'warning') recordWarning(text);
    });
    cdp.on('Log.entryAdded', (params) => {
      if (params.entry.level === 'error') recordError(`log.${params.entry.source}`, params.entry.text);
    });
    cdp.on('Network.responseReceived', (params) => {
      const { response, type } = params;
      if (response.status >= 400) {
        recordHttpFailure({ url: response.url, status: response.status, type });
      }
    });
    cdp.on('Network.loadingFailed', (params) => {
      if (params.canceled) return;
      loadingFailures.push({ errorText: params.errorText, type: params.type });
      recordError('network.loadingFailed', `${params.errorText} (${params.type})`);
    });

    const me = await login();
    const profiles = me.profiles.map((profile) => profile.nombre);
    console.log(`[e2e] perfiles: ${profiles.join(', ')}`);

    const reports = [];
    for (const profile of profiles) {
      const switched = await switchProfile(profile);
      if (!switched) continue;
      const report = await auditProfile(profile);
      if (report) reports.push(report);
    }

    // Volver al perfil con más permisos para las pruebas forzadas.
    await switchProfile('Superusuario');
    const serverError = await forceServerError();
    const unauthorized = await forceUnauthorized();
    const renderError = await forceRenderError();
    const notFound = await checkNotFound();

    // 403: un perfil sin rol superuser no puede abrir el panel administrativo.
    const forbiddenProfile = profiles.find((profile) => profile === 'Empleado') ?? profiles[profiles.length - 1];
    await switchProfile(forbiddenProfile);
    const forbidden = await checkForbidden();

    await switchProfile('Superusuario');
    const mobile = await checkMobileOverflow();

    // Cierre ordenado del navegador.
    await cdp.send('Browser.close').catch(() => {});

    const report = {
      generatedAt: new Date().toISOString(),
      base: BASE,
      api: API,
      profiles,
      traversals: reports,
      forced: { serverError, unauthorized, renderError, notFound, forbidden },
      mobile,
      fields: fieldAudit,
      consoleErrors: globalErrors,
      consoleWarnings: globalWarnings,
      httpFailures,
      loadingFailures,
      failures,
    };

    await mkdir(dirname(REPORT_PATH), { recursive: true });
    await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

    // Los errores de consola solo se toleran en las pruebas que los provocan
    // a propósito (500, 401, error de render). En navegación normal son fallo.
    const unexpectedConsoleErrors = globalErrors.filter(
      (entry) => !String(entry.step).startsWith('forzado:'),
    );
    unexpectedConsoleErrors.forEach((entry) => {
      fail(`Error de consola en [${entry.step}]: ${entry.kind}`, entry.text);
    });

    const totalPages = reports.reduce((sum, item) => sum + item.visited.length, 0);
    const fieldsWithIssues = fieldAudit.filter((field) => field.issues.length > 0);
    console.log(`[e2e] páginas recorridas: ${totalPages}`);
    console.log(`[e2e] campos auditados: ${fieldAudit.length} (con problema: ${fieldsWithIssues.length})`);
    console.log(`[e2e] errores de consola: ${globalErrors.length}`);
    console.log(`[e2e] peticiones >=400: ${httpFailures.length}`);
    console.log(`[e2e] fallos: ${failures.length}`);
    if (failures.length > 0) {
      failures.slice(0, 20).forEach((item) => console.error(`  ✗ [${item.step}] ${item.message}`));
      console.error(`[e2e] reporte completo: ${REPORT_PATH}`);
      process.exitCode = 1;
    } else {
      console.log(`[e2e] OK — reporte: ${REPORT_PATH}`);
    }
  } finally {
    try {
      cdp?.close();
    } catch {
      /* ya cerrado */
    }
    if (chrome?.child) {
      try {
        chrome.child.kill('SIGKILL');
      } catch {
        /* ya terminó */
      }
    }
    if (chrome?.userDataDir) {
      await rm(chrome.userDataDir, { recursive: true, force: true }).catch(() => {});
    }
  }
};

run().catch((error) => {
  console.error('[e2e] Error fatal:', error);
  process.exitCode = 1;
});
