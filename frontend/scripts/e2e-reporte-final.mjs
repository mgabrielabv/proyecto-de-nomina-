#!/usr/bin/env node
/**
 * Verificación enfocada del reporte final de un período emitido.
 * Usa CDP contra un Chrome headless propio; no agrega dependencias.
 *
 *   pnpm e2e:reporte
 *   E2E_BASE=http://localhost:5173 E2E_API=http://localhost:3002 pnpm e2e:reporte
 */
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';

const PORT = Number(process.env.E2E_REPORTE_PORT ?? 9444);
const BASE = process.env.E2E_BASE ?? 'http://localhost:5173';
const CHROME = process.env.CHROME_BIN ?? '/opt/google/chrome/chrome';
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
      expression, returnByValue: true, awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.text);
    return result.value;
  }
  close() { try { this.ws?.close(); } catch { /* ya cerrado */ } }
}

const profile = await mkdtemp('/tmp/opencode/chrome-reporte-');
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

  const API = process.env.E2E_API ?? 'http://localhost:3002';
  const USER = process.env.E2E_USER ?? 'admin_prueba';
  const PASS = process.env.E2E_PASS ?? 'Password123';
  await cdp.send('Page.navigate', { url: BASE });
  await sleep(800);
  const login = await cdp.evaluate(`(async () => {
    const res = await fetch(${JSON.stringify(`${API}/api/login`)}, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ${JSON.stringify(USER)}, password: ${JSON.stringify(PASS)} }),
    });
    return res.status;
  })()`);
  check('login contra el backend', login === 200, `status ${login}`);

  await cdp.send('Page.navigate', { url: `${BASE}/payroll/periodos` });
  let ready = false;
  for (let i = 0; i < 100; i += 1) {
    ready = await cdp.evaluate("Boolean(document.querySelector('h1')) && location.pathname === '/payroll/periodos'");
    if (ready) break;
    await sleep(150);
  }
  check('carga de /payroll/periodos con sesión', ready, await cdp.evaluate('location.pathname'));

  let tablaLista = false;
  for (let i = 0; i < 100; i += 1) {
    tablaLista = await cdp.evaluate("/(procesado|pagado|borrador)/i.test(document.querySelector('tbody')?.textContent || '')");
    if (tablaLista) break;
    await sleep(150);
  }
  check('tabla de períodos cargada', tablaLista);

  const clickedDetail = await cdp.evaluate(`(() => {
    const filas = Array.from(document.querySelectorAll('tbody tr'));
    const fila = filas.find((tr) => /procesado|pagado/i.test(tr.textContent || ''));
    if (!fila) return { ok: false, filas: filas.length };
    const boton = Array.from(fila.querySelectorAll('button')).find((b) => /ver detalle/i.test(b.textContent || b.getAttribute('aria-label') || ''));
    if (!boton) return { ok: false, sinBoton: true };
    boton.click();
    return { ok: true, estado: (fila.textContent || '').match(/procesado|pagado/i)?.[0] };
  })()`);
  check('abrir detalle de un período emitido', clickedDetail.ok, JSON.stringify(clickedDetail));

  await sleep(600);
  const tieneBoton = await cdp.evaluate(`(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const boton = dialog && Array.from(dialog.querySelectorAll('button')).find((b) => /ver reporte final/i.test(b.textContent || ''));
    return Boolean(boton);
  })()`);
  check('botón «Ver reporte final» visible en detalle', tieneBoton);

  await cdp.evaluate(`(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const boton = Array.from(dialog.querySelectorAll('button')).find((b) => /ver reporte final/i.test(b.textContent || ''));
    boton.click();
  })()`);
  await sleep(500);

  const reporte = await cdp.evaluate(`(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const texto = dialog?.textContent || '';
    return {
      titulo: document.querySelector('#modal-title')?.textContent || '',
      totales: /personas/i.test(texto) && /asignaciones/i.test(texto) && /aporte patronal/i.test(texto) && /costo total/i.test(texto),
      desglose: /desglose por concepto/i.test(texto),
      recibos: (dialog?.querySelectorAll('tbody tr').length || 0) > 0,
      pdf: Array.from(dialog?.querySelectorAll('button') || []).some((b) => /PDF/i.test(b.textContent || '')),
      imprimir: Array.from(dialog?.querySelectorAll('button') || []).some((b) => /imprimir/i.test(b.textContent || '')),
      marcaImpresion: Boolean(dialog?.querySelector('[data-reporte-final]')),
    };
  })()`);
  check('modal del reporte con título correcto', /reporte final/i.test(reporte.titulo), reporte.titulo);
  check('reporte muestra totales', reporte.totales);
  check('reporte muestra desglose por concepto', reporte.desglose);
  check('reporte muestra recibos', reporte.recibos);
  check('reporte conserva descarga PDF por recibo', reporte.pdf);
  check('reporte ofrece imprimir/guardar PDF', reporte.imprimir);
  check('reporte marcado para impresión aislada', reporte.marcaImpresion);

  await cdp.send('Emulation.setEmulatedMedia', { media: 'print' });
  await sleep(200);
  const impresion = await cdp.evaluate(`(() => {
    const raiz = document.querySelector('[data-reporte-final]');
    const dialog = raiz?.closest('[role="dialog"]');
    return {
      appOculta: getComputedStyle(document.querySelector('#root')).display === 'none',
      reporteVisible: Boolean(raiz && raiz.getBoundingClientRect().height > 0),
      dialogSinScroll: Boolean(dialog && getComputedStyle(dialog).overflow === 'visible'),
      encabezadoImpreso: Boolean(raiz?.querySelector('.print-only') && getComputedStyle(raiz.querySelector('.print-only')).display === 'block'),
      botonesOcultos: Array.from(raiz?.querySelectorAll('button') || []).every((b) => getComputedStyle(b).display === 'none'),
    };
  })()`);
  check('impresión oculta el resto de la app', impresion.appOculta);
  check('impresión muestra el reporte', impresion.reporteVisible);
  check('impresión no recorta el modal', impresion.dialogSinScroll);
  check('impresión incluye encabezado del reporte', impresion.encabezadoImpreso);
  check('impresión oculta botones', impresion.botonesOcultos);
  await cdp.send('Emulation.setEmulatedMedia', { media: 'screen' });
} catch (error) {
  check('sin excepciones en el arnés', false, error.message);
} finally {
  cdp?.close();
  child.kill('SIGKILL');
}

const fallos = results.filter((r) => !r.ok);
console.log(`\n${results.length - fallos.length}/${results.length} verificaciones OK`);
process.exit(fallos.length ? 1 : 0);
