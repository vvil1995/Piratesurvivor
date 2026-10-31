import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const base=process.env.PAGES_BASE_PATH || '/Piratesurvivor/';
const root=path.resolve('dist');
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(base))throw Error('outside base');const relative=decodeURIComponent(url.pathname.slice(base.length))||'index.html';const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))throw Error('outside root');if(!(await stat(file)).isFile())throw Error('not file');res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 for(const viewport of [{width:1440,height:900},{width:844,height:390}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(`http://127.0.0.1:${server.address().port}${base}`);await page.locator('#loading').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>!!window.__OPS_QA__),false);
  for(const id of ['luffy','zoro','nami','usopp','sanji']){await page.selectOption('#beta-character',id);await page.waitForFunction(()=>!document.querySelector('#start').disabled);await page.locator('#captain-portrait').evaluate(image=>image.decode());}
  await page.locator('#train').click();
  await page.locator('.training-card').last().waitFor({state:'visible'});
  assert.equal(await page.locator('.training-card').count(),14);
  await page.waitForFunction(()=>[...document.querySelectorAll('.training-icon')].length===14&&[...document.querySelectorAll('.training-icon')].every(i=>i.complete&&i.naturalWidth===512));
  assert.equal(await page.locator('.training-icon').evaluateAll(images=>new Set(images.map(i=>i.src)).size),13);
  await page.screenshot({path:`/tmp/training-production-${viewport.width}.png`});
  await page.locator('#training-close').click();
  await page.locator('#start').click();await page.locator('#hud').waitFor({state:'visible'});await page.waitForTimeout(500);await page.locator('#pause').click();await page.locator('#paused').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log(`Pages smoke OK: ${base}, desktop/mobile, five character atlas imports,13 training sprites/14 cards, start/pause, no404/JS errors or QA hook`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
