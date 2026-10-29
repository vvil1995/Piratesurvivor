import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';
import path from 'node:path';

// ZIP sencillo con biblioteca estándar, sin otra dependencia de distribución.
const table = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ n >>> 1 : n >>> 1; return n >>> 0; });
const crc32 = data => { let crc = 0xffffffff; for (const byte of data) crc = table[(crc ^ byte) & 255] ^ crc >>> 8; return (crc ^ 0xffffffff) >>> 0; };
async function files(root, prefix = '', skip = new Set()) {
  const list = [];
  for (const item of await readdir(root, { withFileTypes: true })) {
    if (skip.has(item.name)) continue;
    const relative = path.posix.join(prefix, item.name), absolute = path.join(root, item.name);
    if (item.isDirectory()) list.push(...await files(absolute, relative, skip));
    else if (item.isFile()) list.push({ name: relative, data: await readFile(absolute) });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}
function zip(list) {
  const chunks = [], directory = []; let offset = 0, directorySize = 0;
  for (const { name, data } of list) {
    const filename = Buffer.from(name), compressed = deflateRawSync(data), crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6); header.writeUInt16LE(8, 8);
    header.writeUInt16LE(0x21, 12); header.writeUInt32LE(crc, 14); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8); central.writeUInt16LE(8, 10); central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(filename.length, 28); central.writeUInt32LE(offset, 42);
    chunks.push(header, filename, compressed); directory.push(central, filename); directorySize += central.length + filename.length; offset += header.length + filename.length + compressed.length;
  }
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(list.length, 8); end.writeUInt16LE(list.length, 10); end.writeUInt32LE(directorySize, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...directory, end]);
}
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
await mkdir('release', { recursive: true });
await writeFile(`release/one-piece-survivor-browser-v${version}.zip`, zip(await files('dist')));
await writeFile(`release/one-piece-survivor-source-v${version}.zip`, zip(await files('.', '', new Set(['.git', 'node_modules', 'release', 'dist', 'test-results', 'playwright-report', '.env', '.openai']))));
console.log('Paquetes de navegador y código fuente creados en release/.');
