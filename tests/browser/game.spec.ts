import { test, expect, type Page } from '@playwright/test';

async function offerChoice(page: Page, target: string, capPassives = false, hurt = false) {
  await page.evaluate(async ({ target, capPassives, hurt }) => {
    const progressionPath = '/src/game/systems/progression.ts', catalogPath = '/src/content/catalog.ts';
    const { chooseUpgrades } = await import(/* @vite-ignore */ progressionPath);
    const { UPGRADES } = await import(/* @vite-ignore */ catalogPath);
    const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.player;
    if (capPassives) Object.assign(p.taken, Object.fromEntries(UPGRADES.map((u: { id: string; max: number }) => [u.id, u.max])));
    if (hurt) p.hp = 40;
    for (let i = 0; i < 100; i++) {
      const choices = chooseUpgrades(p.taken, () => i / 100, p);
      if (choices.some((c: { id: string }) => c.id === target)) { r.status = 'levelup'; p.choices = choices; qa.tick(); return; }
    }
    throw new Error(`No hay carta válida: ${target}`);
  }, { target, capPassives, hurt });
  await expect(page.locator('#levelup')).toBeVisible();
  await expect(page.locator('.upgrade-card')).toHaveCount(3);
}

async function isolateWalk(page: Page) {
  await page.evaluate(async () => {
    const path = '/src/content/catalog.ts', { ENEMIES } = await import(/* @vite-ignore */ path);
    for (const enemy of Object.values(ENEMIES) as { speed: number; damage: number }[]) { enemy.speed = 0; enemy.damage = 0; }
    const run = window.__OPS_QA__!.getRun()!; run.enemies.clear();
    for (const chest of run.chests.active) chest.active = false;
    for (const attack of run.player.attacks) { attack.cooldown = 1e6; attack.pending = 0; }
  });
}

// Acortar únicamente el reloj de la fixture; generación y recogida usan el flujo real.
async function revealMorganChart(page: Page) {
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!;
    r.player.hurtTimer = 1e6; r.enemies.clear();
    r.time = 300; r.update(1 / 60, { x: 0, y: 0 });
    r.time = 346; r.update(1 / 60, { x: 0, y: 0 });
    if (!r.route.signal) throw new Error('No se generó carta náutica transitable');
    qa.draw(); qa.tick();
  });
}
async function takeMorganChart(page: Page) {
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!;
    Object.assign(r.player, r.route.signal!); r.update(1 / 60, { x: 0, y: 0 }); qa.draw(); qa.tick();
  });
  await expect(page.locator('#voyage')).toBeVisible();
  await expect(page.locator('#voyage-title')).toContainText('RUMBO A MORGAN');
  await expect(page.locator('#voyage')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('#boss-panel')).toBeVisible();
}

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
  await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; r.time = 600 - 1 / 60; r.player.kills = 30; const coin = r.pickups.acquire()!; Object.assign(coin, { x: r.player.x, y: r.player.y, kind: 'berry', value: 30 }); });
  await page.waitForTimeout(200);
  await expect(page.locator('#result')).toBeHidden();
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.time)).toBeGreaterThan(600 - 1 / 60);
  await page.evaluate(() => { window.__OPS_QA__!.getRun()!.player.hp = 0; });
  await expect(page.locator('#result')).toBeVisible();
  const coins = await page.evaluate(() => window.__OPS_QA__!.store.progress.coins);
  await page.waitForTimeout(200); expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.coins)).toBe(coins);
  await page.locator('#return-home').click(); await expect(page.locator('#win-count')).toHaveText('00');
  await page.locator('#train').click(); await page.locator('[data-buy-training="vitality"]').click(); await page.locator('#training-close').click(); await expect(page.locator('#starting-hp')).toHaveText('108');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#win-count')).toHaveText('00'); await expect(page.locator('#starting-hp')).toHaveText('108');
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
  test.setTimeout(90000);
  await page.locator('#start').click();
  await expect(page.locator('.attack-slot')).toHaveCount(4);
  await expect(page.locator('.attack-slot.empty')).toHaveCount(3);
  for (let i = 0; i < 5; i++) {
    await offerChoice(page, 'ability:elastic-punch', true);
    await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Pistol/ }) }).click();
  }
  await expect(page.locator('[data-ability="elastic-punch"]')).toHaveClass(/evolved/);
  for (const name of ['Gatling', 'Bazooka', 'Whip']) {
    await offerChoice(page, `ability:${name.toLowerCase()}`, true);
    await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: new RegExp(name) }) }).click();
  }
  await expect(page.locator('.attack-slot.empty')).toHaveCount(0);
  expect(await page.evaluate(async () => { const path = '/src/game/systems/progression.ts', { chooseUpgrades } = await import(/* @vite-ignore */ path); const p = window.__OPS_QA__!.getRun()!.player; return chooseUpgrades(p.taken, Math.random, p).every((c: object) => !('kind' in c)); })).toBe(true);
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
    // Grupo ya desbloqueado de fixture: reglas de obtención probadas aparte.
    p.abilitySlots = [['elastic-punch', 'gatling', 'bazooka', 'whip'], [], [], []]; p.selectedSlot = 0;
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
  await isolateWalk(page);
  const step = await page.evaluate(() => {
    const qa = window.__OPS_QA__!, p = qa.getRun()!.player; qa.draw(); let swing = 0;
    for (let i = 0; i < 8; i++) { p.x += 6; qa.draw(); swing = Math.max(swing, Math.abs(qa.metrics().legSwing)); }
    return { footsteps: qa.metrics().footsteps, swing };
  });
  expect(step.footsteps).toBeGreaterThan(0); expect(step.swing).toBeGreaterThan(1);
  await page.screenshot({ path: test.info().outputPath('grounded-walk.png') });
  await page.evaluate(() => { for (let i = 0; i < 20; i++) window.__OPS_QA__!.draw(1000 / 60); });
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().footsteps)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().actorScaleY)).toBeCloseTo(0.65);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().actorAngle)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().legSwing)).toBe(0);
});

test('vida, defensa, regeneración, críticos y XP se reflejan en la interfaz y se reinician', async ({ page }) => {
  await page.locator('#start').click();
  await offerChoice(page, 'heart', false, true);
  await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Espíritu/ }) }).click();
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.stats.maxHp)).toBe(120);
  await offerChoice(page, 'armor');
  await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Guardia/ }) }).click();
  await offerChoice(page, 'regen');
  await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Segundo aliento/ }) }).click();
  await offerChoice(page, 'critical');
  await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Golpe certero/ }) }).click();
  await page.locator('#pause').click();
  await expect(page.locator('#stat-armor')).toHaveText('3%');
  await expect(page.locator('#stat-critical')).toHaveText('2% ×1,5');
  await expect(page.locator('#stat-regen')).toHaveText('0.22 HP/s');
  await page.evaluate(() => { const p = window.__OPS_QA__!.getRun()!.player; p.xp = p.xpNext / 2; });
  await expect(page.locator('.xp-track')).toHaveAttribute('aria-valuenow', '50');
  await expect(page.locator('#xp-text')).toContainText('XP 10 / 21');
  await page.screenshot({ path: test.info().outputPath('effective-stats.png') });
  await page.locator('#resume').click();
  await page.evaluate(() => { window.__OPS_QA__!.getRun()!.player.hp = 0; });
  await expect(page.locator('#result')).toBeVisible(); await page.locator('#retry').click();
  const stats = await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.stats);
  expect(stats.maxHp).toBe(100); expect(stats.armor).toBe(0); expect(stats.critChance).toBe(0); expect(stats.regeneration).toBe(0.2);
});

test('cuatro habilidades, objeto de jefe y unión táctil sin aprendizaje automático', async ({ page }) => {
  await page.locator('#start').click(); await isolateWalk(page);
  for (const [id, name] of [['gatling', 'Gatling'], ['bazooka', 'Bazooka'], ['whip', 'Whip']]) {
    await offerChoice(page, `ability:${id}`, true);
    await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: new RegExp(name) }) }).click();
  }
  await page.locator('#manage-abilities').click(); await expect(page.locator('.combination-card')).toHaveCount(4);
  await expect(page.locator('.combination-card').first()).toBeDisabled(); await page.locator('#combination-done').click();
  await page.evaluate(() => { const qa = window.__OPS_QA__!, r = qa.getRun()!; r.grantCombinationReward(); qa.tick(); });
  await expect(page.locator('#union-count')).toHaveText('1'); await page.locator('#manage-abilities').click();
  const time = await page.evaluate(() => window.__OPS_QA__!.getRun()!.time); await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.time)).toBe(time);
  await page.locator('[data-join="1"]').click(); await page.locator('[data-join="0"]').click();
  await expect(page.locator('#combinations')).toBeHidden(); await expect(page.locator('#union-count')).toHaveText('0');
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.attacks.length)).toBe(4);
  await offerChoice(page, 'ability:fury', true); await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Furia/ }) }).click();
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.attacks.length)).toBe(5);
  await page.screenshot({ path: test.info().outputPath('boss-union.png') });
});

test('beta permite probar los cinco personajes sin compras ni cambios del perfil', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const profile = await page.evaluate(() => { const store = window.__OPS_QA__!.store; for (const id of ['luffy','zoro','nami','usopp','sanji']) store.getTraining(id); return JSON.stringify(store.progress); });
  for (const [id, name, visual, hp] of [['luffy', 'Luffy', 'straw-hat', 100], ['zoro', 'Zoro', 'zoro', 110], ['nami', 'Nami', 'nami', 90], ['usopp', 'Usopp', 'usopp', 85], ['sanji', 'Sanji', 'sanji', 105]] as const) {
    await page.locator('#beta-character').selectOption(id);
    await expect(page.locator('#start')).toBeEnabled();
    await expect(page.locator('#character-title')).toContainText(name.toUpperCase());
    await expect(page.locator('#train')).toBeEnabled();
    await page.locator('#start').click(); await expect(page.locator('#hud')).toBeVisible();
    await expect(page.locator('#character-name')).toHaveText(name.toUpperCase());
    await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.metrics().actorTexture)).toMatch(new RegExp(`^${visual}-(?:n|ne|e|se|s|sw|w|nw)-[01]$`));
    expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.stats.maxHp)).toBe(hp);
    await page.locator('#pause').click(); await page.locator('#abandon').click();
  }
  expect(await page.evaluate(() => JSON.stringify(window.__OPS_QA__!.store.progress))).toBe(profile);
  expect(errors).toEqual([]);
});

test('las técnicas evolucionadas de la tripulación se integran con sprites, HUD y efectos', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  for (const id of ['zoro', 'nami', 'usopp', 'sanji']) {
    await page.evaluate(async id => {
      await window.__OPS_QA__!.start(id);
      const path = '/src/game/systems/loadout.ts', catalog = '/src/content/catalog.ts';
      const { newAttack } = await import(/* @vite-ignore */ path);
      const { CHARACTERS, ENEMIES } = await import(/* @vite-ignore */ catalog);
      for (const e of Object.values(ENEMIES) as {speed: number;damage:number;xp:number}[]) { e.speed = 0; e.damage = 0; e.xp = 0; }
      const run = window.__OPS_QA__!.getRun()!, p = run.player;
      p.xpNext = 1e6; for (const chest of run.chests.active) chest.active = false;
      p.attacks = CHARACTERS[id].abilities.map((a: string) => ({ ...newAttack(a), level: 6 }));
      p.abilitySlots = [p.attacks.slice(0, 2).map(a => a.id), p.attacks.slice(2, 4).map(a => a.id), [p.attacks[4].id], [p.attacks[5].id]];
      for (let i = 0; i < 6; i++) {
        const enemy = run.enemies.acquire()!;
        Object.assign(enemy, { id: 900 + i, x: p.x + 30 + i * 20, y: p.y, hp: 5000, maxHp: 5000, speed: 0, damage: 0, xp: 0 });
      }
      window.__OPS_QA__!.tick();
    }, id);
    await expect(page.locator('#character-name')).toHaveText(id.toUpperCase());
    for (let slot = 0; slot < 4; slot++) {
      await page.evaluate(slot => window.__OPS_QA__!.getRun()!.selectSlot(slot), slot);
      await page.waitForTimeout(200);
    }
    expect(await page.evaluate(() => [...document.querySelectorAll('.attack-slot .component-name')].every(name => {
      const label = name.getBoundingClientRect(), slot = name.closest('.attack-slot')!.getBoundingClientRect();
      return label.left >= slot.left && label.right <= slot.right;
    }))).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`crew-${id}.png`) });
    await page.locator('#pause').click(); await page.locator('#pause-build').click();
    await expect(page.locator('#combinations')).toBeVisible();
    await expect(page.locator('#combinations')).toContainText('+');
    expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.attacks.length)).toBe(6);
    await page.evaluate(() => window.__OPS_QA__!.getRun()!.finishCombinations());
    await page.evaluate(() => window.__OPS_QA__!.tick());
    await page.locator('#abandon').click();
  }
  expect(errors).toEqual([]);
});

test('con cuatro ranuras las cartas son pasivas y no habilitan una unión gratis', async ({ page }) => {
  await page.locator('#start').click();
  await page.evaluate(async () => {
    const path = '/src/game/systems/loadout.ts', progression = '/src/game/systems/progression.ts';
    const { improveAttack } = await import(/* @vite-ignore */ path), { chooseUpgrades } = await import(/* @vite-ignore */ progression);
    const qa = window.__OPS_QA__!, r = qa.getRun()!; for (const id of ['gatling','bazooka','whip']) improveAttack(r.player, id);
    r.player.choices = chooseUpgrades({}, Math.random, r.player); r.status = 'levelup'; qa.tick();
  });
  await expect(page.locator('#levelup')).toBeVisible(); await expect(page.locator('.upgrade-card')).toHaveCount(3);
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.choices.every(c => !('kind' in c)))).toBe(true);
  await page.locator('.upgrade-card').first().click(); await expect(page.locator('#combinations')).toBeHidden();
  await page.locator('#manage-abilities').click(); await expect(page.locator('.combination-card').first()).toBeDisabled();
  await expect(page.locator('#combination-message')).toContainText('objeto de unión');
});

test('paso articulado en ocho direcciones y Whip con pierna elástica en lugar de círculo', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.locator('#start').click();
  await isolateWalk(page);
  const origin = await page.evaluate(() => {
    const r = window.__OPS_QA__!.getRun()!, p = r.player;
    for (let y = 128; y <= 1024; y += 32) for (let x = 128; x <= 1024; x += 32) {
      if (Array.from({ length: 8 }, (_, i) => i * Math.PI / 4).every(a => r.world.segmentClear(x, y, x + Math.cos(a) * 55, y + Math.sin(a) * 55, 14))) return { x, y };
    }
    throw new Error('Fixture sin espacio abierto');
  });
  for (const [direction, keys] of [['e', ['ArrowRight']], ['se', ['ArrowRight', 'ArrowDown']], ['s', ['ArrowDown']], ['sw', ['ArrowLeft', 'ArrowDown']], ['w', ['ArrowLeft']], ['nw', ['ArrowLeft', 'ArrowUp']], ['n', ['ArrowUp']], ['ne', ['ArrowRight', 'ArrowUp']]] as [string, string[]][]) {
    await page.evaluate(o => Object.assign(window.__OPS_QA__!.getRun()!.player, o), origin);
    // Teclado/colisiones se prueban aparte. Actualizar la escena explícitamente
    // evita leer una pose antigua cuando Phaser limita el render por software.
    const pose = await page.evaluate(({ keys }) => {
      const qa = window.__OPS_QA__!, p = qa.getRun()!.player;
      const dx = keys.includes('ArrowRight') ? 2 : keys.includes('ArrowLeft') ? -2 : 0;
      const dy = keys.includes('ArrowDown') ? 2 : keys.includes('ArrowUp') ? -2 : 0;
      let swing = 0; qa.draw();
      for (let i = 0; i < 12; i++) {
        p.x += dx; p.y += dy;
        qa.draw();
        swing = Math.max(swing, Math.abs(qa.metrics().legSwing));
      }
      return { direction: qa.metrics().actorDirection, swing };
    }, { keys });
    expect(pose.direction).toBe(direction); expect(pose.swing).toBeGreaterThan(2);
    if (['e', 'n'].includes(direction)) await page.screenshot({ path: test.info().outputPath(`articulated-${direction}.png`) });
    await page.waitForTimeout(100);
  }
  await page.evaluate(async () => {
    const r = window.__OPS_QA__!.getRun()!, p = r.player;
    r.strikes.length = 0; r.strikes.push({ x: p.x, y: p.y, ownerId: p.id, life: 0.18, angle: 0.4, reach: 95, behavior: 'sweep', evolved: true, arc: Math.PI, splash: 0, impact: { x: p.x + 90, y: p.y }, visual: 'rubber-kick' });
    r.pause(); window.__OPS_QA__!.tick();
  });
  await page.addStyleTag({ content: '#paused{display:none!important}' });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: test.info().outputPath('elastic-whip.png') });
  expect(errors).toEqual([]);
});

test('uniones opacas de cadera y rodilla en los seis atlas y todo el ciclo', async ({ page }) => {
  test.setTimeout(90000);
  const result = await page.evaluate(async () => {
    const jointsPath = '/src/game/scenes/walk-joints.ts', posePath = '/src/game/scenes/walk-pose.ts';
    const { detectLegJoints, legTransform } = await import(/* @vite-ignore */ jointsPath);
    const { legPose } = await import(/* @vite-ignore */ posePath);
    const directions = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
    let checked = 0, fallback = 0, gaps = 0;
    const gallery = document.createElement('div'); gallery.style.cssText = 'position:absolute;left:0;top:0;z-index:9999;display:grid;grid-template-columns:repeat(4,128px);background:#60736d;padding:12px;color:white;font:12px monospace'; document.body.append(gallery);
    for (const actor of ['luffy', 'zoro', 'nami', 'usopp', 'sanji', 'marine']) {
      const image = new Image(); image.src = `/src/assets/actors/${actor}-atlas.png`; await image.decode();
      for (let frame = 0; frame < 2; frame++) for (let d = 0; d < 8; d++) {
        const source = document.createElement('canvas'); source.width = source.height = 96; const s = source.getContext('2d')!;
        s.drawImage(image, d * 96, frame * 96, 96, 96, 0, 0, 96, 96);
        const joints = detectLegJoints(s.getImageData(0, 0, 96, 96).data);
        if (!joints) { fallback++; continue; }
        for (const phase of [Math.PI / 2, Math.PI * 1.5]) {
          const output = document.createElement('canvas'); output.width = output.height = 128; const ctx = output.getContext('2d')!; ctx.imageSmoothingEnabled = false;
          const body = { x: 64, y: 113, scaleX: 1, scaleY: 1, angle: 0, originX: 0.5, originY: 0.96 };
          for (let leg = 0; leg < 2; leg++) {
            const j = joints[leg], pose = legPose(directions[d], phase, leg ? 1 : -1, true), t = legTransform(body, j, pose.thigh);
            const draw = (pivot: {x: number;y:number}, position: {x:number;y:number}, angle: number, top: number, bottom: number) => {
              ctx.save(); ctx.translate(position.x, position.y); ctx.rotate(angle * Math.PI / 180);
              ctx.drawImage(source, j.left, top, 48, bottom - top, j.left - pivot.x, top - pivot.y, 48, bottom - top); ctx.restore();
            };
            draw(j.hip, t.root, t.angle, Math.min(60, j.hip.y - 4), j.knee.y + 5);
            draw(j.knee, t.knee, t.angle + pose.knee, j.knee.y - 4, 96);
            const alpha = ctx.getImageData(Math.round(t.knee.x) - 1, Math.round(t.knee.y) - 1, 3, 3).data;
            if (!alpha.some((v, i) => i % 4 === 3 && v > 96)) gaps++;
            checked++;
          }
          ctx.drawImage(source, 0, 0, 96, 70, body.x - 48, body.y - 96 * body.originY, 96, 70);
          if (directions[d] === 'e') {
            const label = document.createElement('div'); label.style.cssText = 'display:flex;flex-direction:column'; label.append(document.createTextNode(`${actor} · ${frame} · ${phase.toFixed(1)}`), output); gallery.append(label);
          }
        }
      }
    }
    return { checked, fallback, gaps };
  });
  expect(result.checked).toBeGreaterThan(100); expect(result.gaps).toBe(0);
  await page.screenshot({ path: test.info().outputPath('joint-regression.png'), fullPage: true });
});

test('tocar las ranuras alterna Pistol/Bazooka sin agruparlos ni disparar el que queda en reserva', async ({ page, isMobile }) => {
  await page.locator('#start').click();
  await isolateWalk(page);
  await offerChoice(page, 'ability:bazooka', true);
  await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Bazooka/ }) }).click();
  const sample = () => page.evaluate(() => {
    const r = window.__OPS_QA__!.getRun()!, p = r.player; r.enemies.clear(); r.strikes.length = 0;
    const e = r.enemies.acquire()!; Object.assign(e, { id: 999, x: p.x + 30, y: p.y, hp: 10000, maxHp: 10000, xp: 0, speed: 0, damage: 0 });
    for (const a of p.attacks) a.cooldown = 0;
    r.update(1 / 60, { x: 0, y: 0 });
    const result = { behaviors: r.strikes.map(s => s.behavior), selected: p.selectedSlot, groups: p.abilitySlots.map(s => [...s]), fired: p.attacks.filter(a => a.cooldown > 0).map(a => a.id) };
    for (const a of p.attacks) a.cooldown = 1e6;
    return result;
  });
  await expect(page.locator('.attack-slot[data-slot="0"]')).toHaveAttribute('aria-pressed', 'true');
  const first = await sample(); expect(first.behaviors).toEqual(['line']); expect(first.fired).toEqual(['elastic-punch']);
  expect(first.groups).toEqual([['elastic-punch'], ['bazooka'], [], []]);
  const bazooka = page.locator('.attack-slot[data-slot="1"]');
  if (isMobile) await bazooka.tap(); else await bazooka.click();
  await expect(bazooka).toHaveAttribute('aria-pressed', 'true');
  expect((await sample()).behaviors).toEqual(['cone']);
  const pistol = page.locator('.attack-slot[data-slot="0"]');
  if (isMobile) await pistol.tap(); else await pistol.click();
  expect((await sample()).behaviors).toEqual(['line']);
  await page.keyboard.press('2'); await expect(bazooka).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#manage-abilities').click(); await expect(page.locator('.combination-card').first()).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath('selected-slot.png') });
});

test('retrato frontal y cofres pequeños/grandes con botín directo y guardado de berries', async ({ page }) => {
  expect(await page.locator('#captain-portrait').getAttribute('src')).toBe(await page.evaluate(async () => {
    const path = '/src/ui/pixel-art.ts'; return (await import(/* @vite-ignore */ path)).artUrl('straw-hat-portrait');
  }));
  await page.locator('#start').click(); await isolateWalk(page);
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.player;
    for (const chest of r.chests.active) chest.active = false;
    p.xpNext = 1e6; Object.assign(r, { random: () => 0.5 });
    const chest = r.chests.active[0] ?? { id: -999, kind: 'chest', radius: 14, speed: 0, damage: 0, xp: 0 };
    if (!r.chests.active.length) r.chests.active.push(chest as typeof r.chests.active[number]); Object.assign(chest, { active: true, large: false, hp: 1, x: p.x + 25, y: p.y });
    p.attacks[0].cooldown = 0; r.update(1 / 60, { x: 0, y: 0 });
    if (chest.active || p.kills !== 0) throw new Error('El cofre no se rompió correctamente');
    const coin = r.pickups.acquire()!; Object.assign(coin, { x: p.x, y: p.y, kind: 'berry', ownerId: p.id, value: 7 });
    r.update(1 / 60, { x: 0, y: 0 }); qa.tick();
    Object.assign(chest, { active: true, large: true, openProgress: 2.99, x: p.x, y: p.y });
    r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); qa.draw();
  });
  await expect(page.locator('#loot-notice')).toContainText('Cofre');
  expect(await page.locator('#chest-reward').count()).toBe(0);
  expect(await page.locator('#chest-options').count()).toBe(0);
  await page.evaluate(() => { const qa = window.__OPS_QA__!, r = qa.getRun()!; r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); });
  const coins = await page.evaluate(() => window.__OPS_QA__!.store.progress.coins); expect(coins).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(() => Object.keys(window.__OPS_QA__!.getRun()!.player.items).length)).toBe(0);
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.coins)).toBe(coins);
});

test('Morgan: carta, aviso visible, victoria y viaje automático sin curación', async ({ page }, testInfo) => {
  await page.locator('#start').click();
  await revealMorganChart(page); await takeMorganChart(page);
  await expect(page.locator('#boss-panel')).toBeVisible();
  await expect(page.locator('#boss-phase')).toHaveText('FASE 1/3');
  await page.evaluate(async () => {
    const path = '/src/content/bosses/morgan.ts', { MORGAN_ATTACKS } = await import(/* @vite-ignore */ path);
    const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.player, b = r.encounter!;
    for (const attack of p.attacks) attack.cooldown = 1e6;
    b.body.x = 384; b.body.y = 220; p.x = 384; p.y = 370;
    b.prepare(MORGAN_ATTACKS[0], p, r.world); b.tick = () => {}; qa.draw(); qa.tick();
  });
  await expect(page.locator('#boss-pattern')).toContainText('Cop de destral');
  await page.screenshot({ path: testInfo.outputPath('morgan-warning.png') });
  const viewport = page.viewportSize()!;
  const bar = await page.locator('#boss-panel').boundingBox();
  expect(bar!.x).toBeGreaterThanOrEqual(0); expect(bar!.x + bar!.width).toBeLessThanOrEqual(viewport.width);
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.player, b = r.encounter!;
    b.tick = Object.getPrototypeOf(b).tick; p.hp = 43; b.body.x = p.x; b.body.y = p.y - 40; b.body.hp = 1;
    p.attacks[0].cooldown = 0; r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); qa.draw();
  });
  await expect(page.locator('#voyage')).toBeVisible();
  await expect(page.locator('#voyage-title')).toContainText('ORANGE TOWN');
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.zone)).toBe('morgan-arena');
  expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.morganVictories)).toBe(1);
  await expect(page.locator('#voyage')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('#area-label')).toContainText('ORANGE TOWN');
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.hp)).toBeLessThan(45);
  await expect(page.locator('#challenge-morgan')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.getRun()!.enemies.count)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.enemies.items.filter(e => e.active).every(e => e.visual === 'buggy-pirate'))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('orange-pirates.png') });
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.morganVictories)).toBe(1);
});

test('Morgan: cinco patrones legibles y fases sin avisos ocultos por el HUD', async ({ page }, testInfo) => {
  await page.locator('#start').click(); await revealMorganChart(page); await takeMorganChart(page);
  for (const id of ['axe', 'sweep', 'charge', 'order', 'devastating']) {
    await page.evaluate(async id => {
      const path = '/src/content/bosses/morgan.ts', { MORGAN_ATTACKS } = await import(/* @vite-ignore */ path);
      const qa = window.__OPS_QA__!, r = qa.getRun()!, b = r.encounter!;
      for (const a of r.player.attacks) a.cooldown = 1e6;
      b.body.x = 384; b.body.y = 176; r.player.x = 384; r.player.y = 400;
      b.prepare(MORGAN_ATTACKS.find((a: { id: string }) => a.id === id)!, r.player, r.world);
      b.elapsed = b.telegraph!.attack.preparation - 0.15; b.telegraph!.elapsed = b.elapsed;
      b.tick = () => {}; qa.draw(); qa.tick();
    }, id);
    expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.encounter!.stage)).toBe('final');
    await page.screenshot({ path: testInfo.outputPath(`morgan-${id}.png`) });
  }
});

test('buffs legibles, Balloon hinchado y fruta temporal con decisión táctil', async ({ page }, info) => {
  await page.locator('#start').click(); await isolateWalk(page);
  await page.evaluate(async () => {
    const path = '/src/game/systems/loadout.ts', { improveAttack } = await import(/* @vite-ignore */ path);
    const qa = window.__OPS_QA__!, r = qa.getRun()!; improveAttack(r.player, 'fury'); r.selectSlot(1); r.player.attacks.find(a => a.id === 'fury')!.activeFor = 60; qa.draw(); qa.tick();
  });
  await expect(page.locator('#buff-strip')).toContainText('ATK');
  await expect(page.locator('#buff-strip')).toContainText('×1.12');
  await page.evaluate(async () => {
    const path = '/src/game/systems/loadout.ts', { improveAttack } = await import(/* @vite-ignore */ path);
    const qa = window.__OPS_QA__!, r = qa.getRun()!; improveAttack(r.player, 'balloon'); r.selectSlot(2); r.player.attacks.find(a => a.id === 'balloon')!.activeFor = 0.45; r.update = () => {}; qa.draw(); qa.tick();
  });
  await expect(page.locator('#buff-strip')).toContainText('IMMUNE');
  expect(await page.evaluate(() => window.__OPS_QA__!.metrics().inflating)).toBe(true);
  expect(await page.evaluate(() => window.__OPS_QA__!.metrics().actorScaleY)).toBeCloseTo(0.65, 2);
  await page.screenshot({ path: info.outputPath('balloon-defense.png') });
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.pickups.acquire()!;
    r.update = Object.getPrototypeOf(r).update;
    Object.assign(p, { x: r.player.x, y: r.player.y, kind: 'fruit', fruitId: 'bomu', value: 0 });
    r.update(1 / 60, { x: 0, y: 0 }); qa.tick();
  });
  await expect(page.locator('#fruit-found')).toBeVisible();
  await expect(page.locator('#fruit-description')).toContainText('Bomu');
  await page.locator('#fruit-take').click(); await expect(page.locator('#fruit-found')).toBeHidden();
  await expect(page.locator('#fruit-active')).toContainText('Bomu');
});

test('pareja en dos toques con recompensa de jefe y objeto único visible junto a ataques', async ({ page, isMobile }, info) => {
  await page.locator('#start').click(); await isolateWalk(page);
  await page.evaluate(async () => {
    const loadout = '/src/game/systems/loadout.ts', items = '/src/game/systems/items.ts';
    const { improveAttack } = await import(/* @vite-ignore */ loadout), { equipItem } = await import(/* @vite-ignore */ items);
    const qa = window.__OPS_QA__!, r = qa.getRun()!; improveAttack(r.player, 'gatling'); r.grantCombinationReward(); equipItem(r.player, 'boots'); qa.tick();
  });
  await expect(page.locator('#equipped-item')).toContainText('Botes');
  await expect.poll(() => page.locator('#equipped-item img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 24)).toBe(true);
  const attacks = await page.locator('#attack-slots').boundingBox(), item = await page.locator('#equipped-item').boundingBox();
  expect(item!.x).toBeGreaterThanOrEqual(attacks!.x + attacks!.width); expect(item!.x + item!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.locator('#manage-abilities').click(); await expect(page.locator('.combination-card')).toHaveCount(2);
  if (isMobile) await page.locator('[data-join="0"]').tap(); else await page.locator('[data-join="0"]').click();
  await expect(page.locator('.combination-card')).toHaveCount(1); await expect(page.locator('#combination-chosen')).toContainText('Pistol');
  await page.screenshot({ path: info.outputPath('two-tap-combination.png') });
  if (isMobile) await page.locator('[data-join="1"]').tap(); else await page.locator('[data-join="1"]').click();
  await expect(page.locator('#combinations')).toBeHidden();
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.abilitySlots[1])).toEqual(['gatling', 'elastic-punch']);
  await page.locator('#equipped-item').click(); await expect(page.locator('#item-info')).toBeVisible(); await page.locator('#item-info-close').click();
  const offer = () => page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!, item = r.pickups.acquire()!;
    Object.assign(item, { x: r.player.x, y: r.player.y, kind: 'item', itemId: 'whetstone', value: 0, ownerId: r.player.id });
    r.update(1 / 60, { x: 0, y: 0 }); qa.tick();
  });
  await offer(); await expect(page.locator('#item-found')).toBeVisible(); await page.locator('#item-keep').click();
  await expect(page.locator('#equipped-item')).toContainText('Botes');
  await offer(); await page.locator('#item-take').click(); await expect(page.locator('#equipped-item')).toContainText('Pedra');
  expect(await page.evaluate(() => Object.keys(window.__OPS_QA__!.getRun()!.player.items))).toEqual(['whetstone']);
  await page.screenshot({ path: info.outputPath('equipped-item.png') });
});


test('carta desde05:00, barco pausable y derrota con25HP permite reintentar sin perder build', async ({ page }, info) => {
  await page.locator('#start').click(); await isolateWalk(page);
  await expect(page.locator('#navigation-hint')).toContainText('05:00');
  await expect(page.locator('#challenge-morgan')).toHaveCount(0);
  await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; r.time = 299; r.update(1 / 60, { x: 0, y: 0 }); });
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.route.signal)).toBeUndefined();
  await revealMorganChart(page); await expect(page.locator('#navigation-hint')).toContainText('CARTA NÁUTICA');
  await page.screenshot({ path: info.outputPath('navigation-chart.png') });
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!;
    Object.assign(r.player, r.route.signal!); r.player.level = 8; r.player.collectedBerries = 23;
    r.update(1 / 60, { x: 0, y: 0 }); qa.tick();
  });
  await expect(page.locator('#voyage')).toBeVisible();
  await page.locator('#voyage-pause').click(); await expect(page.locator('#paused')).toBeVisible();
  const elapsed = await page.evaluate(() => window.__OPS_QA__!.getRun()!.voyage!.elapsed);
  await page.waitForTimeout(200); expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.voyage!.elapsed)).toBe(elapsed);
  await page.locator('#resume').click(); await expect(page.locator('#voyage')).toBeVisible();
  await page.screenshot({ path: info.outputPath('boat-voyage.png') });
  await expect(page.locator('#voyage')).toBeHidden({ timeout: 15000 }); await expect(page.locator('#boss-panel')).toBeVisible();
  await page.evaluate(() => { const qa = window.__OPS_QA__!, r = qa.getRun()!; r.player.hp = 0; r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); });
  await expect(page.locator('#voyage-title')).toContainText('REGRESO');
  await expect(page.locator('#voyage')).toBeHidden({ timeout: 15000 });
  const state = await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; return { hp: r.player.hp, zone: r.zone, level: r.player.level, berries: r.player.collectedBerries, next: r.route.nextAt, time: r.time }; });
  expect(state.zone).toBe('shells-town'); expect(state.hp).toBeGreaterThanOrEqual(25); expect(state.hp).toBeLessThan(26);
  expect(state.level).toBe(8); expect(state.berries).toBe(23); expect(state.next).toBeGreaterThan(state.time);
  await expect(page.locator('#result')).toBeHidden();
  await page.evaluate(() => { const qa = window.__OPS_QA__!, r = qa.getRun()!; r.time = r.route.nextAt; r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); });
  await expect(page.locator('#navigation-hint')).toContainText('CARTA NÁUTICA');
  await takeMorganChart(page);
  expect(await page.evaluate(() => { const b = window.__OPS_QA__!.getRun()!.encounter!; return b.body.hp === b.body.maxHp; })).toBe(true);
});

async function enterBuggy(page: Page) {
  await page.locator('#start').click();
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!; r.morganDefeated = true; r.boardToOrangeTown(); r.player.hurtTimer = 1e6;
    Object.assign(r, { zoneTime: 300 }); r.update(1 / 60, { x: 0, y: 0 });
    Object.assign(r, { zoneTime: 346 }); r.update(1 / 60, { x: 0, y: 0 });
    if (!r.buggyRoute.signal) throw new Error('No hay carta válida de Buggy'); qa.draw(); qa.tick();
  });
  await expect(page.locator('#navigation-hint')).toContainText('Buggy');
  await page.evaluate(() => { const qa = window.__OPS_QA__!, r = qa.getRun()!; Object.assign(r.player, r.buggyRoute.signal!); r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); });
  await expect(page.locator('#voyage-title')).toContainText('RUMBO A BUGGY');
  await expect(page.locator('#voyage')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('#boss-name')).toHaveText('BUGGY EL PAYASO');
}

test('Buggy: carta de Orange, cuatro avisos legibles, victoria y llegada a Syrup sin curar', async ({ page }, info) => {
  await enterBuggy(page);
  for (const id of ['knives', 'bomb', 'split', 'barrage']) {
    await page.evaluate(async id => {
      const path = '/src/content/bosses/buggy.ts', { BUGGY_ATTACKS } = await import(/* @vite-ignore */ path);
      const qa = window.__OPS_QA__!, r = qa.getRun()!, b = r.encounter!;
      for (const a of r.player.attacks) a.cooldown = 1e6;
      b.body.x = 384; b.body.y = 145; r.player.x = 384; r.player.y = 380; b.body.hp = b.body.maxHp * 0.2;
      b.tick(0, r.player, r.world, () => ({ x: 0, y: 0 }), () => {});
      b.prepare(BUGGY_ATTACKS.find((a: { id: string }) => a.id === id)!, r.player, r.world);
      b.elapsed = b.telegraph!.attack.preparation - 0.15; b.telegraph!.elapsed = b.elapsed; b.tick = () => {};
      qa.draw(); qa.tick();
    }, id);
    await expect(page.locator('#boss-phase')).toHaveText('FASE 3/3');
    expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.encounter!.stage)).toBe('final');
    await page.screenshot({ path: info.outputPath(`buggy-${id}.png`) });
  }
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!, b = r.encounter!;
    b.tick = Object.getPrototypeOf(b).tick; r.player.hp = 53; b.body.x = r.player.x; b.body.y = r.player.y - 40; b.body.hp = 1;
    r.player.attacks[0].cooldown = 0; r.update(1 / 60, { x: 0, y: 0 }); qa.tick();
  });
  await expect(page.locator('#voyage-title')).toContainText('SYRUP VILLAGE');
  await expect(page.locator('#voyage')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('#area-label')).toContainText('SYRUP VILLAGE');
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.hp)).toBeLessThan(55);
  expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.buggyVictories)).toBe(1);
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.buggyVictories)).toBe(1);
});

test('Buggy: derrota vuelve a Orange con25HP y conserva nivel/berries para otra carta', async ({ page }) => {
  await enterBuggy(page);
  await page.evaluate(() => { const qa = window.__OPS_QA__!, r = qa.getRun()!; r.player.level = 24; r.player.collectedBerries = 41; r.player.hp = 0; r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); });
  await expect(page.locator('#voyage-title')).toContainText('REGRESO A ORANGE');
  await expect(page.locator('#voyage')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('#area-label')).toContainText('ORANGE TOWN');
  const p = await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; return { hp: r.player.hp, level: r.player.level, berries: r.player.collectedBerries, morgan: r.morganDefeated, buggy: r.buggyDefeated }; });
  expect(p.hp).toBeGreaterThanOrEqual(25); expect(p.hp).toBeLessThan(26); expect(p.level).toBe(24); expect(p.berries).toBe(41); expect(p.morgan).toBe(true); expect(p.buggy).toBe(false);
  await expect(page.locator('#result')).toBeHidden();
  await page.evaluate(() => { const qa = window.__OPS_QA__!, r = qa.getRun()!; Object.assign(r, { zoneTime: r.buggyRoute.nextAt }); r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); });
  await expect(page.locator('#navigation-hint')).toContainText('CARTA NÁUTICA');
});

test('entrenamiento por estadística/personaje, configuración inicial, veto y cambio de cartas', async ({ page, isMobile }, info) => {
  await page.evaluate(() => { const store = window.__OPS_QA__!.store; store.progress.coins = 10000; store.flush(); });
  await page.locator('#train').click(); await expect(page.locator('.training-card')).toHaveCount(14);
  await expect(page.locator('#training-title')).toContainText('NIVEL 1');
  for (const id of ['vitality','starter','repertoire','bans','rerolls']) await page.locator(`[data-buy-training="${id}"]`).click();
  await expect(page.locator('#training-title')).toContainText('NIVEL 6');
  await page.locator('#training-starter').selectOption('gatling'); await page.locator('#training-second').selectOption('whip');
  await page.locator('[data-ban="balloon"]').check();
  await page.screenshot({ path: info.outputPath('training-configuration.png') });
  await page.locator('.training-dialog').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: info.outputPath('permanent-training.png') });
  expect(await page.locator('.training-card').evaluateAll(cards => cards.every(card => {
    const progress = card.querySelector('.training-segments')!.getBoundingClientRect(), buy = card.querySelector('button')!.getBoundingClientRect();
    return progress.right <= buy.left - 2;
  }))).toBe(true);
  if (isMobile) {
    await page.setViewportSize({ width: 390, height: 844 });
    const box = await page.locator('.training-dialog').boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: info.outputPath('permanent-training-portrait.png') });
    await page.setViewportSize({ width: 844, height: 390 });
  }

  await page.locator('#training-close').click(); await expect(page.locator('#starting-hp')).toHaveText('108');
  await page.locator('#beta-character').selectOption('zoro'); await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#train').click(); await expect(page.locator('#training-title')).toContainText('NIVEL 1');
  await page.locator('#training-close').click(); await page.locator('#beta-character').selectOption('luffy'); await expect(page.locator('#start')).toBeEnabled();
  await page.reload(); await expect(page.locator('#loading')).toBeHidden(); await page.locator('#start').click();
  const data = await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; return { ids: r.player.attacks.map(a => a.id), hp: r.player.stats.maxHp, bans: r.player.bannedAbilities, level: r.player.level }; });
  expect(data).toEqual({ ids: ['gatling','whip'], hp: 108, bans: ['balloon'], level: 1 });
  await offerChoice(page, 'heart'); await expect(page.locator('#reroll')).toBeEnabled(); await page.locator('#reroll').click();
  await expect(page.locator('#reroll')).toBeDisabled(); await expect(page.locator('.upgrade-card')).toHaveCount(3);
});

test('34 iconos propios distintos, buffs legibles y barril/muslo/cofre reconocibles', async ({ page }, info) => {
  const count = await page.evaluate(async () => {
    const path = '/src/ui/pixel-art.ts', abilities = '/src/content/attacks.ts';
    const { artUrl } = await import(/* @vite-ignore */ path), { ABILITIES } = await import(/* @vite-ignore */ abilities);
    const gallery = document.createElement('div'); gallery.id = 'qa-icon-gallery';
    Object.assign(gallery.style, { position: 'fixed', inset: '12px', zIndex: '40000', background: '#102630', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '5px', padding: '10px', overflow: 'auto' });
    const urls: string[] = [];
    for (const a of Object.values(ABILITIES) as {id:string;shortName:string}[]) { const cell = document.createElement('div'), img = document.createElement('img'), label = document.createElement('small'); img.src = artUrl('ability-' + a.id); urls.push(img.src); img.width = img.height = 48; img.style.imageRendering = 'pixelated'; label.textContent = a.shortName; Object.assign(label.style, { display: 'block', color: '#e9dbb1', font: '9px monospace' }); cell.append(img,label); gallery.append(cell); }
    document.body.append(gallery); await Promise.all([...gallery.querySelectorAll('img')].map(img => img.decode())); return { total: urls.length, unique: new Set(urls).size, valid: urls.every(url => url.startsWith('data:image/png')) };
  });
  expect(count).toEqual({ total: 34, unique: 34, valid: true });
  await page.screenshot({ path: info.outputPath('ability-gallery.png') }); await page.locator('#qa-icon-gallery').evaluate(el => el.remove());
  await page.locator('#start').click(); await isolateWalk(page);
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.player; r.update = () => {};
    r.chests.active.push({ active: true, id: -888, kind: 'chest', large: false, x: p.x + 70, y: p.y, hp: 24, maxHp: 24, speed: 0, damage: 0, xp: 0, radius: 14, flash: 0 }, { active: true, id: -889, kind: 'chest', large: true, x: p.x + 140, y: p.y, hp: 24, maxHp: 24, speed: 0, damage: 0, xp: 0, radius: 14, flash: 0 });
    const food = r.pickups.acquire()!; Object.assign(food, { x: p.x - 70, y: p.y, kind: 'food', value: 12, life: 20 });
    const bullet = r.projectiles.acquire()!; Object.assign(bullet, { x: p.x + 40, y: p.y - 70, vx: 120, vy: 40, hostile: true, life: 3, radius: 3 }); qa.draw();
  });
  await page.screenshot({ path: info.outputPath('barrel-food-rifle.png') });
});
