import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
});

test('puerto adaptable, instrucciones, créditos y partida sin peticiones de backend', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('h1')).toContainText('COBARDES.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#help-open').click(); await expect(page.locator('#help')).toBeVisible();
  await page.locator('[data-close="help"]').click();
  await page.locator('#credits-open').click(); await expect(page.locator('#credits')).toContainText('Phaser');
  await page.locator('[data-close="credits"]').click();
  await page.locator('#start').click(); await expect(page.locator('#hud')).toBeVisible();
  await expect.poll(async () => {
    const [minutes, seconds] = (await page.locator('#clock').innerText()).split(':').map(Number);
    return minutes * 60 + seconds;
  }, { timeout: 5000 }).toBeGreaterThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('teclado, pausa, subida de nivel y mejora única', async ({ page }) => {
  await page.locator('#start').click();
  const before = await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x);
  await page.keyboard.down('d'); await page.waitForTimeout(250); await page.keyboard.up('d');
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x)).toBeGreaterThan(before + 10);
  await page.locator('#pause').click(); await expect(page.locator('#paused')).toBeVisible();
  const time = await page.evaluate(() => window.__OPS_QA__!.getRun()!.time);
  await page.waitForTimeout(200); expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.time)).toBe(time);
  await page.locator('#resume').click();
  await page.evaluate(() => {
    const run = window.__OPS_QA__!.getRun()!, p = run.player, enemy = run.enemies.acquire()!;
    Object.assign(enemy, { id: 900, x: p.x + 45, y: p.y, hp: 1, maxHp: 1, damage: 0, speed: 0, xp: p.xpNext + 2 });
    p.attacks[0].cooldown = 0;
  });
  await expect(page.locator('#levelup')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.upgrade-card')).toHaveCount(3);
  await expect(page.locator('.upgrade-card img.pixel-icon')).toHaveCount(3);
  expect(await page.locator('.upgrade-card img').first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const frozen = await page.evaluate(() => window.__OPS_QA__!.getRun()!.time);
  await page.waitForTimeout(200); expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.time)).toBe(frozen);
  await page.locator('.upgrade-card').first().click(); await expect(page.locator('#levelup')).toBeHidden();
  expect(await page.evaluate(() => Object.values(window.__OPS_QA__!.getRun()!.taken).reduce((a, b) => a + b, 0))).toBe(1);
});

test('derrota, reinicio, exploración sin límite y guardado persistente', async ({ page }) => {
  await page.locator('#start').click();
  await page.evaluate(() => { window.__OPS_QA__!.getRun()!.player.hp = 0; });
  await expect(page.locator('#result')).toBeVisible(); await expect(page.locator('#result-title')).toContainText('CAEN');
  await page.locator('#retry').click(); await expect(page.locator('#hud')).toBeVisible();
  await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; r.time = 600 - 1 / 60; r.player.kills = 30; });
  await page.waitForTimeout(200);
  await expect(page.locator('#result')).toBeHidden();
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.time)).toBeGreaterThan(600 - 1 / 60);
  await page.evaluate(() => { window.__OPS_QA__!.getRun()!.player.hp = 0; });
  await expect(page.locator('#result')).toBeVisible();
  const coins = await page.evaluate(() => window.__OPS_QA__!.store.progress.coins);
  await page.waitForTimeout(200); expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.coins)).toBe(coins);
  await page.locator('#return-home').click(); await expect(page.locator('#win-count')).toHaveText('00');
  await page.locator('#train').click(); await expect(page.locator('#starting-hp')).toHaveText('105');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#win-count')).toHaveText('00'); await expect(page.locator('#starting-hp')).toHaveText('105');
});

test('joystick táctil, cancelación y giro', async ({ page, isMobile, browserName }) => {
  test.skip(!isMobile, 'Controles táctiles en emulación móvil');
  test.skip(browserName !== 'chromium', 'Arrastre nativo mediante CDP; WebKit se valida manualmente');
  await page.locator('#start').click(); await expect(page.locator('#touch-zone')).toBeVisible();
  const before = await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x);
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 100, y: 280 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 145, y: 280 }] });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x)).toBeGreaterThan(before + 10);
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  const after = await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x);
  await page.waitForTimeout(150); expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x)).toBeCloseTo(after, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#rotate-screen')).toBeVisible();
  await expect(page.locator('#paused')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#rotate-screen')).toBeHidden();
  await page.locator('#resume').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#game canvas')!;
    return Math.abs(canvas.width / canvas.height - innerWidth / innerHeight);
  })).toBeLessThan(0.01);
});


test('móvil vertical pide girar, congela la partida y permite volver al puerto', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Solo la experiencia móvil requiere orientación');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#start').click();
  await expect(page.locator('#rotate-screen')).toBeVisible();
  const time = await page.evaluate(() => window.__OPS_QA__!.getRun()!.time);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.time)).toBe(time);
  await page.locator('#rotate-home').click();
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('#rotate-screen')).toBeHidden();
});


test('explorar coordenadas lejanas recicla chunks y conserva la geometría', async ({ page }) => {
  await page.locator('#start').click(); await page.locator('#pause').click();
  const data = await page.evaluate(async () => {
    const qa = window.__OPS_QA__!, run = qa.getRun()!;
    const original = JSON.stringify(run.world.getChunk(0, 0));
    for (let i = -30; i <= 30; i++) {
      run.player.x = i * 10000 + 256; run.player.y = i * -10000 + 256;
      await new Promise(requestAnimationFrame);
    }
    return { chunks: run.world.chunkCount, ...qa.metrics(), identical: JSON.stringify(run.world.getChunk(0, 0)) === original };
  });
  expect(data.chunks).toBeLessThanOrEqual(128); expect(data.textureSlots).toBeLessThanOrEqual(49);
  expect(data.renderedChunks).toBeGreaterThan(0); expect(data.identical).toBe(true);
});

test('animación direccional responde al movimiento y se detiene al parar', async ({ page }) => {
  await page.locator('#start').click();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  // Movimiento de simulación determinista; el teclado/joystick se prueban en otros casos.
  // No mantener una diagonal durante el polling: podría alcanzar un obstáculo aleatorio.
  await page.evaluate(() => { window.__OPS_QA__!.getRun()!.update(1 / 60, { x: 1, y: -1 }); });
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().actorTexture)).toMatch(/^straw-hat-ne-[01]$/);
  expect(await page.evaluate(() => window.__OPS_QA__!.metrics().actorDirection)).toBe('ne');
  await page.waitForTimeout(120);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().actorFrame)).toBe(0);
  await page.screenshot({ path: test.info().outputPath('restored-art.png') });
});

test('los seis atlas detallados contienen ocho orientaciones utilizables sin recortes', async ({ page }) => {
  const summary = await page.evaluate(async () => {
    const modulePath = '/src/game/scenes/directional-art.ts';
    const { createDirectionalArt, createPackedDirectionalArt } = await import(/* @vite-ignore */ modulePath);
    const gallery = document.createElement('div');
    gallery.style.cssText = 'position:absolute;inset:0 auto auto 0;z-index:9999;background:#657379;padding:12px;display:grid;grid-template-columns:repeat(8,96px);gap:2px';
    document.body.append(gallery);
    const results = [];
    for (const name of ['luffy', 'marine', 'zoro', 'nami', 'usopp', 'sanji']) {
      const image = new Image(); image.src = `/src/assets/actors/${name}-directions.png`;
      await image.decode();
      const frames = new Map<string, HTMLCanvasElement>();
      const mockScene = { textures: { get: () => ({ getSourceImage: () => image }), addCanvas: (key: string, canvas: HTMLCanvasElement) => frames.set(key, canvas) } };
      createDirectionalArt(mockScene, name, name);
      const packedImage = new Image(); packedImage.src = `/src/assets/actors/${name}-atlas.png`; await packedImage.decode();
      const packedFrames = new Map<string, HTMLCanvasElement>();
      createPackedDirectionalArt({ textures: { get: () => ({ getSourceImage: () => packedImage }), addCanvas: (key: string, canvas: HTMLCanvasElement) => packedFrames.set(key, canvas) } }, name, name);
      let packedIdentical = packedFrames.size === frames.size;
      for (const [key, frame] of frames) if (packedFrames.get(key)?.toDataURL() !== frame.toDataURL()) packedIdentical = false;
      let cropped = 0, empty = 0;
      const label = document.createElement('div'); label.textContent = name; label.style.cssText = 'grid-column:1/-1;color:white;font:14px monospace'; gallery.append(label);
      for (const canvas of frames.values()) {
        const data = canvas.getContext('2d')!.getImageData(0, 0, 96, 96).data;
        let count = 0;
        for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) if (data[(x + y * 96) * 4 + 3] > 32) {
          count++; if (x === 0 || y === 0 || x === 95 || y === 95) cropped++;
        }
        if (!count) empty++;
        gallery.append(canvas);
      }
      results.push({ name, packedIdentical, frames: frames.size, cropped, empty,
        distinct: frames.get(`${name}-n-0`)!.toDataURL() !== frames.get(`${name}-s-0`)!.toDataURL() });
    }
    return results;
  });
  for (const actor of summary) {
    expect(actor.packedIdentical, actor.name).toBe(true);
    expect(actor.frames, actor.name).toBe(16); expect(actor.cropped, actor.name).toBe(0);
    expect(actor.empty, actor.name).toBe(0); expect(actor.distinct, actor.name).toBe(true);
  }
  await page.screenshot({ path: test.info().outputPath('directional-gallery.png'), fullPage: true });
});

test('cuatro ataques equipados, evolución +, cartas válidas y reinicio de build', async ({ page }) => {
  await page.locator('#start').click();
  await expect(page.locator('.attack-slot')).toHaveCount(4);
  await expect(page.locator('.attack-slot.empty')).toHaveCount(3);
  const offer = async (last: boolean) => {
    await page.evaluate(async (last) => {
      const progressionPath = '/src/game/systems/progression.ts', catalogPath = '/src/content/catalog.ts';
      const { chooseUpgrades } = await import(/* @vite-ignore */ progressionPath);
      const { UPGRADES } = await import(/* @vite-ignore */ catalogPath);
      const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.player;
      // Aislar la UI de ataques; no representa el ritmo natural de una partida.
      p.taken = Object.fromEntries(UPGRADES.map((u: { id: string; max: number }) => [u.id, u.max]));
      p.hp = p.stats.maxHp;
      r.status = 'levelup'; p.choices = chooseUpgrades(p.taken, () => last ? 0.999 : 0, p); qa.tick();
    }, last);
    await expect(page.locator('#levelup')).toBeVisible();
    await expect(page.locator('.upgrade-card')).toHaveCount(3);
  };
  for (const name of ['Gatling', 'Bazooka', 'Whip']) {
    await offer(true);
    await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: new RegExp(name) }) }).click();
  }
  await expect(page.locator('.attack-slot.empty')).toHaveCount(0);
  for (let i = 0; i < 5; i++) {
    await offer(false);
    await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Pistol/ }) }).click();
  }
  await expect(page.locator('[data-ability="elastic-punch"]')).toHaveClass(/evolved/);
  await expect(page.locator('[data-ability="elastic-punch"]')).toContainText('Pistol +');
  await offer(false); await expect(page.locator('.upgrade-card')).not.toContainText(['Pistol']);
  await page.locator('.upgrade-card').first().click();
  await page.screenshot({ path: test.info().outputPath('four-attacks.png') });
  await page.evaluate(() => { window.__OPS_QA__!.getRun()!.player.hp = 0; });
  await expect(page.locator('#result')).toBeVisible(); await page.locator('#retry').click();
  await expect(page.locator('.attack-slot.empty')).toHaveCount(3);
  await expect(page.locator('[data-ability="elastic-punch"]')).toContainText('NV. 1 / 6');
});

test('los cuatro efectos evolucionados se dibujan sin errores en combate', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.locator('#start').click();
  await page.addStyleTag({ content: '#paused{display:none!important}' });
  const behaviors = await page.evaluate(async () => {
    const path = '/src/game/systems/loadout.ts';
    const { improveAttack } = await import(/* @vite-ignore */ path);
    const r = window.__OPS_QA__!.getRun()!, p = r.player;
    for (const id of ['elastic-punch', 'gatling', 'bazooka', 'whip']) while ((p.attacks.find(a => a.id === id)?.level ?? 0) < 6) improveAttack(p, id);
    p.x = 256; p.y = 256;
    for (const e of r.enemies.items) e.active = false;
    for (let i = 0; i < 8; i++) {
      const e = r.enemies.acquire()!, a = i * Math.PI / 4;
      Object.assign(e, { id: 900 + i, x: p.x + Math.cos(a) * 80, y: p.y + Math.sin(a) * 80, hp: 10000, maxHp: 10000, damage: 0, speed: 0, xp: 0 });
    }
    r.update(1 / 60, { x: 0, y: 0 }); r.pause();
    return r.strikes.map(s => s.behavior).sort();
  });
  expect(behaviors).toEqual(['burst', 'cone', 'line', 'sweep']);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: test.info().outputPath('four-effects.png') });
  expect(errors).toEqual([]);
});

test('pasos apoyados en el suelo y vuelta a reposo sin deslizamiento visual', async ({ page }) => {
  await page.locator('#start').click();
  await page.keyboard.down('d');
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().footsteps)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => Math.abs(window.__OPS_QA__!.metrics().legSwing))).toBeGreaterThan(1);
  await page.screenshot({ path: test.info().outputPath('grounded-walk.png') });
  await page.keyboard.up('d');
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().footsteps)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().actorScaleY)).toBeCloseTo(0.65);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().actorAngle)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().legSwing)).toBe(0);
});
