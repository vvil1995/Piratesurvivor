import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

await mkdir('test-results/screenshots', { recursive: true });
// HTTP solo para QA: el Chromium administrado bloquea file:// por política.
// Se sirve exclusivamente el HTML autónomo, sin assets ni servicios adicionales.
const server = process.env.PORTABLE_HTTP ? createServer(async (_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(await readFile('dist/One-Piece-Survivor.html'));
}) : undefined;
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server?.address();
const url = address && typeof address === 'object' ? `http://127.0.0.1:${address.port}/` : pathToFileURL(path.resolve('dist/One-Piece-Survivor.html')).href;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext(mobile ? { ...devices['iPhone 13'], defaultBrowserType: undefined } : { viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(), errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url()) && request.url() !== url) external.push(request.url()); });
    await page.goto(url);
    try { await page.locator('#loading').waitFor({ state: 'hidden', timeout: 15000 }); }
    catch (error) { console.error('Errores en la compilación autónoma:', errors); throw error; }
    await context.setOffline(true);
    assert.equal(await page.evaluate(() => !!window.__OPS_QA__), false, 'El artefacto no expone QA');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `test-results/screenshots/portable-${mobile ? 'mobile' : 'desktop'}-home.png`, fullPage: true });
    await page.locator('#start').click();
    if (mobile) {
      const touch = await page.evaluate(() => ({ coarse: matchMedia('(pointer: coarse)').matches, points: navigator.maxTouchPoints, display: getComputedStyle(document.querySelector('#touch-zone')).display }));
      assert.equal(touch.display, 'block', `Joystick disponible: ${JSON.stringify(touch)}`);
    }
    await page.waitForTimeout(7000);
    await page.screenshot({ path: `test-results/screenshots/portable-${mobile ? 'mobile' : 'desktop'}-battle.png` });
    await page.locator('#pause').click();
    await page.locator('#paused').waitFor({ state: 'visible' });
    assert.deepEqual(errors, [], 'Sin errores JavaScript'); assert.deepEqual(external, [], 'Sin solicitudes externas');
    console.log(`HTML autónomo ${server ? 'HTTP local' : 'file://'} ${mobile ? 'móvil emulado' : 'escritorio'}: carga, partida, pausa, sin recursos de red adicionales ni hook QA.`);
    await context.close();
  }
} finally { await browser.close(); server?.close(); }
