// Empaquetado reproducible de recursos generados. No descarga imágenes ni modifica los originales.
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const server = await createServer({ server: { host: '127.0.0.1', port: 5187, strictPort: true } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.route('**/__prepare', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Preparación local de atlas</title>' }));
  await page.goto('http://127.0.0.1:5187/__prepare');
  const sheets = await page.evaluate(async () => {
    const { createDirectionalArt, SHEET_DIRECTIONS } = await import('/src/game/scenes/directional-art.ts');
    const output = [];
    for (const id of ['luffy', 'marine', 'zoro', 'nami', 'usopp', 'sanji']) {
      const image = new Image(); image.src = `/src/assets/actors/${id}-directions.png`; await image.decode();
      const frames = new Map();
      createDirectionalArt({ textures: { get: () => ({ getSourceImage: () => image }), addCanvas: (key, canvas) => frames.set(key, canvas) } }, id, id);
      const packed = document.createElement('canvas'); packed.width = 768; packed.height = 192;
      const ctx = packed.getContext('2d'); ctx.imageSmoothingEnabled = false;
      for (let phase = 0; phase < 2; phase++) for (let i = 0; i < 8; i++) ctx.drawImage(frames.get(`${id}-${SHEET_DIRECTIONS[i]}-${phase}`), i * 96, phase * 96);
      output.push({ id, data: packed.toDataURL('image/png').split(',')[1] });
    }
    return output;
  });
  for (const sheet of sheets) {
    const bytes = Buffer.from(sheet.data, 'base64');
    await writeFile(`src/assets/actors/${sheet.id}-atlas.png`, bytes);
    console.log(`${sheet.id}: ${(bytes.length / 1024).toFixed(1)} KiB, 8 direcciones × 2 pasos`);
  }
} finally { await browser?.close(); await server.close(); }
