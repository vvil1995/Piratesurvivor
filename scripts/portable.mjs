import { build } from 'esbuild';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { Script } from 'node:vm';

const bundled = await build({ entryPoints: ['src/main.ts'], bundle: true, minify: true,
  format: 'iife', target: 'es2020', outfile: 'portable/app.js', write: false, legalComments: 'inline',
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.VITE_QA': '"false"', 'process.env.NODE_ENV': '"production"' } });
const js = bundled.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = bundled.outputFiles.find(file => file.path.endsWith('.css')).text;
const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const notices = (await Promise.all(['licenses/dependencies/phaser/LICENSE.md', 'licenses/dependencies/eventemitter3/LICENSE'].map(file => readFile(file, 'utf8')))).join('\n\n');
let html = await readFile('index.html', 'utf8');
html = html.replace('</head>', () => `<style>${css}</style></head>`)
  .replace('<div id="license-notices"></div>', () => `<details style="font:10px monospace;max-height:250px;overflow:auto"><summary>Licencias MIT · Phaser / EventEmitter3</summary><pre style="white-space:pre-wrap;padding:12px">${escapeHtml(notices)}</pre></details>`)
  .replace('<script type="module" src="/src/main.ts"></script>', () => `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`);
// Comprueba también el script ya insertado: evita romper cadenas del motor al empaquetar.
new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1], { filename: 'One-Piece-Survivor.html' });
await mkdir('dist', { recursive: true });
await writeFile('dist/One-Piece-Survivor.html', html);
await cp('licenses', 'dist/licenses', { recursive: true });
await cp('docs/PROBAR.md', 'dist/LEEME.md');
console.log(`HTML autónomo: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB (${(gzipSync(html).length / 1024).toFixed(0)} KiB gzip). Sin CDN ni peticiones externas.`);
