import { readdir, readFile, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import path from 'node:path';

const output = 'licenses/dependencies';
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const allowed = new Set(['MIT', 'Apache-2.0', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', '(MIT OR CC0-1.0)']);
const inventory = [];
async function inspect(directory, modulesRoot = directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const root = path.join(directory, entry.name);
    if (entry.name.startsWith('@')) { await inspect(root, modulesRoot); continue; }
    const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    if (!allowed.has(manifest.license)) throw new Error(`Revisar licencia de ${manifest.name}: ${manifest.license}`);
    let noticeRoot = root;
    let notices = (await readdir(root)).filter(name => /^(licen[sc]e|copying|notice)([.\-_]|$)/i.test(name));
    // Los binarios de plataforma de estos proyectos omiten el texto en su tarball.
    // Conservamos el aviso del paquete principal de la MISMA versión.
    const parent = manifest.name.startsWith('@esbuild/') ? 'esbuild' : manifest.name.startsWith('@rollup/rollup-') ? 'rollup' : undefined;
    if (!notices.length && parent) {
      noticeRoot = path.join(modulesRoot, parent);
      const parentManifest = JSON.parse(await readFile(path.join(noticeRoot, 'package.json'), 'utf8'));
      if (parentManifest.version !== manifest.version || parentManifest.license !== manifest.license) throw new Error(`Versiones de avisos incompatibles: ${manifest.name}`);
      notices = (await readdir(noticeRoot)).filter(name => /^(licen[sc]e|copying|notice)([.\-_]|$)/i.test(name));
    }
    if (!notices.length) throw new Error(`Falta el texto legal de ${manifest.name}`);
    const target = path.join(output, manifest.name.replaceAll('/', '__'));
    await mkdir(target, { recursive: true });
    for (const name of notices) await cp(path.join(noticeRoot, name), path.join(target, name), { recursive: true });
    inventory.push({ name: manifest.name, version: manifest.version, license: manifest.license,
      runtime: ['phaser', 'eventemitter3'].includes(manifest.name), noticeSource: noticeRoot, notices: notices.map(n => `${target}/${n}`) });
    if ((await readdir(root)).includes('node_modules')) await inspect(path.join(root, 'node_modules'));
  }
}
await inspect('node_modules');
inventory.sort((a, b) => a.name.localeCompare(b.name));
await writeFile('licenses/inventory.json', JSON.stringify(inventory, null, 2) + '\n');
console.log(`Licencias verificadas y avisos conservados: ${inventory.length} paquetes instalados.`);
