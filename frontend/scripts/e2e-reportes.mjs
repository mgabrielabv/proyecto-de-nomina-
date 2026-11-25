#!/usr/bin/env node
/**
 * Verificación enfocada de la página Reportes del menú de Nómina.
 * Usa CDP contra un Chrome headless propio; no agrega dependencias.
 *
 *   pnpm e2e:reportes
 *   E2E_BASE=http://localhost:5173 E2E_API=http://localhost:3002 pnpm e2e:reportes
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const PORT = Number(process.env.E2E_REPORTES_PORT ?? 9453);
const BASE = process.env.E2E_BASE ?? 'http://localhost:5173';
const API = process.env.E2E_API ?? 'http://localhost:3002';
const USER = process.env.E2E_USER ?? 'admin_prueba';
const PASS = process.env.E2E_PASS ?? 'Password123';
const CHROME = process.env.CHROME_BIN ?? '/opt/google/chrome/chrome';
const DOWNLOADS = join('/tmp/opencode', `chrome-reportes-descargas-${PORT}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
};

class Cdp {
  constructor(url) { this.url = url; this.id = 1; this.pending = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true });
      this.ws.addEventListener('error', rej, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, userGesture: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  }
  close() { try { this.ws?.close(); } catch { /* ya cerrado */ } }
}

const profile = await mkdtemp('/tmp/opencode/chrome-reportes-');
await rm(DOWNLOADS, { recursive: true, force: true }).catch(() => {});
await mkdir(DOWNLOADS, { recursive: true });
const child = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-background-networking', '--disable-dev-shm-usage',
  '--no-sandbox', '--window-size=1280,900', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

let cdp;
try {
  let version;
  for (let i = 0; i < 100; i += 1) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) { version = await r.json(); break; }
    } catch { /* esperando */ }
    await sleep(150);
  }
  if (!version) throw new Error('Chrome no abrió CDP');
  const created = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  const target = await created.json();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS }).catch(() => {});

  const errores = [];
  cdp.ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errores.push(msg.params.args?.map((a) => a.value ?? a.description).join(' '));
    }
  });

  await cdp.send('Page.navigate', { url: `${BASE}/login` });
  for (let i = 0; i < 100; i += 1) {
    if (await cdp.evaluate("Boolean(document.querySelector('input[name=\"username\"]'))")) break;
    await sleep(150);
  }
  const login = await cdp.evaluate(`(async () => {
    const res = await fetch(${JSON.stringify(`${API}/api/login`)}, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ${JSON.stringify(USER)}, password: ${JSON.stringify(PASS)} }),
    });
    return res.status;
  })()`);
  check('login contra el backend', login === 200, `status ${login}`);

  // La opción se siembra por migración; recargar evita depender de reiniciar el backend.
  const reload = await cdp.evaluate(`(async () => {
    const res = await fetch(${JSON.stringify(`${API}/api/execute`)}, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subsystem: 'Security', class: 'Admin', method: 'reloadPermissions', params: [] }),
    });
    return res.status;
  })()`);
  check('recarga de permisos del menú', reload === 200, `status ${reload}`);

  await cdp.send('Page.navigate', { url: `${BASE}/payroll/reportes` });
  for (let i = 0; i < 150; i += 1) {
    const listo = await cdp.evaluate("Boolean(document.querySelector('[data-reporte-general]'))");
    if (listo) break;
    await sleep(150);
  }
  for (let i = 0; i < 150; i += 1) {
    const cargando = await cdp.evaluate("document.querySelectorAll('[data-reporte-general] tbody .animate-pulse').length");
    if (cargando === 0) break;
    await sleep(150);
  }
  await sleep(300);

  const vista = await cdp.evaluate(`(() => {
    const root = document.querySelector('[data-reporte-general]');
    const texto = document.querySelector('main')?.textContent ?? '';
    const tablas = [...(root?.querySelectorAll('table') ?? [])].map((t) => ({
      columnas: [...t.querySelectorAll('thead th')].map((th) => th.textContent.trim()).join('|'),
      filas: t.querySelectorAll('tbody tr').length,
    }));
    return {
      ruta: location.pathname,
      titulo: document.querySelector('h1')?.textContent?.trim() ?? '',
      resumenFinal: /resumen final de todos los reportes/i.test(texto),
      porEmpleado: /resumen por empleado/i.test(texto),
      reportesEmpleado: /reportes por empleado/i.test(texto),
      enMenu: [...document.querySelectorAll('nav button')].some((b) => b.textContent.trim() === 'Reportes'),
      tablas,
      botonesPdf: [...(root?.querySelectorAll('button') ?? [])].filter((b) => b.textContent.trim() === 'PDF').length,
    };
  })()`);

  check('ruta /payroll/reportes', vista.ruta === '/payroll/reportes' && vista.titulo === 'Reportes', `${vista.ruta} · ${vista.titulo}`);
  check('opción Reportes en el menú de Nómina', vista.enMenu);
  check('resumen final de todos los reportes', vista.resumenFinal);
  check('resumen por empleado', vista.porEmpleado);
  check('reportes por empleado', vista.reportesEmpleado);
  const tablaEmpleados = vista.tablas.find((t) => t.columnas.startsWith('Empleado|Recibos'));
  const tablaRecibos = vista.tablas.find((t) => t.columnas.startsWith('Empleado|Período'));
  check('tabla de empleados con datos', (tablaEmpleados?.filas ?? 0) > 0, `${tablaEmpleados?.filas ?? 0} filas`);
  check('tabla de recibos con datos', (tablaRecibos?.filas ?? 0) > 0, `${tablaRecibos?.filas ?? 0} filas`);
  check('botones de descarga PDF', vista.botonesPdf > 0, `${vista.botonesPdf} botones`);

  if (vista.botonesPdf > 0) {
    const descarga = await cdp.evaluate(`(async () => {
      const boton = [...document.querySelectorAll('[data-reporte-general] button')].find((b) => b.textContent.trim() === 'PDF');
      boton.click();
      await new Promise((r) => setTimeout(r, 1600));
      return document.querySelector('[role="status"]')?.textContent?.trim() ?? '';
    })()`);
    const archivos = await readdir(DOWNLOADS).catch(() => []);
    check('descarga del recibo en PDF', /recibo descargado/i.test(descarga) && archivos.some((a) => a.endsWith('.pdf')), archivos.join(', '));
  }

  check('sin errores de consola', errores.length === 0, errores.join(' | '));
} finally {
  cdp?.close();
  child.kill('SIGKILL');
  await sleep(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
  await rm(DOWNLOADS, { recursive: true, force: true }).catch(() => {});
}

const fallos = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fallos}/${results.length} verificaciones OK`);
if (fallos > 0) process.exitCode = 1;
