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
  expect(await page.evaluate(async () => { const path = '/src/game/systems/progression.ts', { chooseUpgrades } = await import(/* @vite-ignore */ path); const p = window.__OPS_QA__!.getRun()!.player; return chooseUpgrades(p.taken, Math.random, p).every((c: { kind?: string; abilityId?: string }) => !c.kind || c.abilityId !== 'elastic-punch' && p.attacks.some(a => a.id === c.abilityId && a.level < 6)); })).toBe(true);
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
    // Start the visual fixture deterministically: the real loop may have fired Pistol already.
    for(const a of p.attacks)Object.assign(a,{cooldown:0,pending:0,burstTimer:0,activeFor:0,activationPending:false,targetId:undefined});
    r.strikes.length=0;r.projectiles.clear();r.areas.clear();
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
    // Selection fixture: ambient combat can legitimately collect persistent berries.
    await page.evaluate(()=>{window.__OPS_QA__!.getRun()!.update=()=>{};});
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

test('con cuatro ranuras se mejoran los ataques aprendidos sin aprender un quinto ni unir gratis', async ({ page }) => {
  await page.locator('#start').click();
  await page.evaluate(async () => {
    const path = '/src/game/systems/loadout.ts', progression = '/src/game/systems/progression.ts';
    const { improveAttack } = await import(/* @vite-ignore */ path), { chooseUpgrades } = await import(/* @vite-ignore */ progression);
    const qa = window.__OPS_QA__!, r = qa.getRun()!; for (const id of ['gatling','bazooka','whip']) improveAttack(r.player, id);
    r.player.choices = chooseUpgrades({}, Math.random, r.player); qa.tick();
  });
  await offerChoice(page, 'ability:elastic-punch');
  await expect(page.locator('#levelup')).toBeVisible(); await expect(page.locator('.upgrade-card')).toHaveCount(3);
  expect(await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; return r.choices.every(c => !('kind' in c) || r.player.attacks.some(a => a.id === c.abilityId)); })).toBe(true);
  await page.locator('.upgrade-card').filter({ has: page.getByRole('heading', { name: /Pistol/ }) }).click(); await expect(page.locator('#combinations')).toBeHidden();
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.attacks[0].level)).toBe(2);
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
  await expect(page.locator('#item-found')).toBeVisible();
  await page.locator('#item-keep').click();
  expect(await page.locator('#chest-reward').count()).toBe(0);
  expect(await page.locator('#chest-options').count()).toBe(0);
  await page.evaluate(() => { const qa = window.__OPS_QA__!, r = qa.getRun()!; r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); });
  const coins = await page.evaluate(() => window.__OPS_QA__!.store.progress.coins); expect(coins).toBeGreaterThanOrEqual(7);
  expect(await page.evaluate(() => Object.keys(window.__OPS_QA__!.getRun()!.player.items).length)).toBe(0);
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.coins)).toBe(coins);
});

test('Morgan: carta, aviso visible, victoria y viaje automático sin curación', async ({ page }, testInfo) => {
  await page.locator('#start').click();
  await revealMorganChart(page); await takeMorganChart(page);
  await expect(page.locator('#boss-panel')).toBeVisible();
  await expect(page.locator('#boss-phase')).toHaveCount(0);
  await page.evaluate(async () => {
    const path = '/src/content/bosses/morgan.ts', { MORGAN_ATTACKS } = await import(/* @vite-ignore */ path);
    const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.player, b = r.encounter!;
    for (const attack of p.attacks) attack.cooldown = 1e6;
    b.body.x = 384; b.body.y = 220; p.x = 384; p.y = 370;
    b.prepare(MORGAN_ATTACKS[0], p, r.world); b.tick = () => {}; qa.draw(); qa.tick();
  });
  await expect(page.locator('#boss-pattern')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('morgan-warning.png') });
  const viewport = page.viewportSize()!;
  const bar = await page.locator('#boss-panel').boundingBox();
  expect(bar!.x).toBeGreaterThanOrEqual(0); expect(bar!.x + bar!.width).toBeLessThanOrEqual(viewport.width);
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!, p = r.player, b = r.encounter!;
    b.tick = Object.getPrototypeOf(b).tick; p.hp = 43; b.body.x = p.x; b.body.y = p.y - 40; b.body.hp = 1;
    p.attacks[0].cooldown = 0; r.update(1 / 60, { x: 0, y: 0 }); qa.tick(); qa.draw();
  });
  await expect(page.locator('#combinations')).toBeVisible();
  await page.locator('#combination-done').click();
  await expect(page.locator('#voyage')).toBeVisible();
  await expect(page.locator('#voyage-title')).toContainText('ORANGE TOWN');
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.zone)).toBe('morgan-arena');
  expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.morganVictories)).toBe(1);
  await expect(page.locator('#voyage')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('#area-label')).toContainText('ORANGE TOWN');
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.hp)).toBeLessThan(45);
  await expect(page.locator('#challenge-morgan')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__OPS_QA__!.getRun()!.enemies.count)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.enemies.items.filter(e => e.active).every(e => e.visual?.startsWith('buggy-')))).toBe(true);
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
    const qa = window.__OPS_QA__!, r = qa.getRun()!; improveAttack(r.player, 'gatling'); r.grantCombinationReward(); equipItem(r.player, 'vest'); qa.tick();
  });
  await expect(page.locator('#equipped-item')).toContainText('Barret');
  await expect.poll(() => page.locator('#equipped-item img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 96)).toBe(true);
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
  await expect(page.locator('#equipped-item')).toContainText('Barret');
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
  await expect(page.locator('#boss-name')).toHaveText('BUGGY');
}

test('Buggy: carta de Orange, cuatro avisos legibles, victoria y llegada a Syrup sin curar', async ({ page }, info) => {
  await enterBuggy(page);
  for (const id of ['knives', 'bomb', 'split', 'barrage']) {
    await page.evaluate(async id => {
      const path = '/src/content/bosses/buggy.ts', { BUGGY_ATTACKS } = await import(/* @vite-ignore */ path);
      const qa = window.__OPS_QA__!, r = qa.getRun()!, b = r.encounter!;
      for (const a of r.player.attacks) a.cooldown = 1e6;
      b.body.x = 1648; b.body.y = 1152; r.player.x = 1408; r.player.y = 1152; b.body.hp = b.body.maxHp * 0.2;
      b.tick(0, r.player, r.world, () => ({ x: 0, y: 0 }), () => {});
      b.prepare(BUGGY_ATTACKS.find((a: { id: string }) => a.id === id)!, r.player, r.world);
      b.elapsed = b.telegraph!.attack.preparation - 0.15; b.telegraph!.elapsed = b.elapsed; b.tick = () => {};
      qa.draw(); qa.tick();
    }, id);
    await expect(page.locator('#boss-phase')).toHaveCount(0);
    expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.encounter!.stage)).toBe('final');
    await page.screenshot({ path: info.outputPath(`buggy-${id}.png`) });
  }
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!, b = r.encounter!;
    b.tick = Object.getPrototypeOf(b).tick; r.player.hp = 53; b.body.x = r.player.x; b.body.y = r.player.y - 40; b.body.hp = 1;
    r.player.attacks[0].cooldown = 0; r.update(1 / 60, { x: 0, y: 0 }); qa.tick();
  });
  await expect.poll(()=>page.evaluate(()=>!!window.__OPS_QA__!.getRun()!.exitSignal)).toBe(true);
  await expect(page.locator('#combinations')).toBeVisible();await page.locator('#combination-done').click();
  expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.zone)).toBe('buggy-arena');
  await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;Object.assign(r.player,r.exitSignal);r.update(1/60,{x:0,y:0});q.tick();});
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
  await page.evaluate(async () => {
    const path = '/src/game/systems/progression.ts', { chooseUpgrades } = await import(/* @vite-ignore */ path);
    const qa = window.__OPS_QA__!, r = qa.getRun()!; r.player.choices = chooseUpgrades({}, () => .99, r.player); r.status = 'levelup'; qa.tick();
  });
  await expect(page.locator('#levelup')).toBeVisible();
  expect(await page.locator('.upgrade-card').evaluateAll(cards => cards.every(card => card.querySelector('img')!.getBoundingClientRect().bottom <= card.querySelector('h3')!.getBoundingClientRect().top - 2))).toBe(true);
  await page.screenshot({ path: info.outputPath('buff-cards.png') });
});

test('Orange Town: cuatro barrios propios, tres piratas distintos y navegación con esfera', async ({ page }, info) => {
  await page.locator('#start').click(); await isolateWalk(page);
  await page.evaluate(() => {
    const qa = window.__OPS_QA__!, r = qa.getRun()!; r.morganDefeated = true; r.boardToOrangeTown(); r.player.hurtTimer = 1e6;
    r.update = () => {}; qa.tick(); qa.draw();
  });
  await expect(page.locator('#area-label')).toContainText('ORANGE TOWN');
  const districts = await page.evaluate(() => {
    const r = window.__OPS_QA__!.getRun()!; return [...new Set(Array.from({length: 30}, (_, i) => r.world.getChunk(i - 15, 0).district))].sort();
  });
  expect(districts).toEqual(['circus', 'market', 'occupied', 'orchard']);
  for (const district of districts) {
    await page.evaluate(async ({ district }) => {
      const qa = window.__OPS_QA__!, r = qa.getRun()!;
      const chunk = Array.from({length: 80}, (_, i) => r.world.getChunk(i - 40, 0)).find(c => c.district === district)!;
      r.player.x = chunk.cx * 512 + 256; r.player.y = 256;
      const path = '/src/content/catalog.ts', { ENEMIES } = await import(/* @vite-ignore */ path);
      r.enemies.clear();
      ['buggy-pirate','buggy-gunner','buggy-bruiser'].forEach((id, i) => {
        const enemy = r.enemies.acquire()!;
        Object.assign(enemy, ENEMIES[id], { id: 810 + i, visual: id, x: r.player.x - 70 + i * 70, y: r.player.y + 60, maxHp: ENEMIES[id].hp, flash: 0, launchTime: 0, statuses: undefined });
      });
      qa.draw(); qa.tick();
    }, { district });
    await page.screenshot({ path: info.outputPath(`orange-${district}.png`) });
  }
  // Los tres atlas son distintos y tienen las16 poses normalizadas, sin descargas externas.
  const frames = await page.evaluate(async () => {
    const atlas = ['/src/assets/actors/buggy-pirate-atlas.png', '/src/assets/actors/buggy-gunner-atlas.png', '/src/assets/actors/buggy-bruiser-atlas.png'];
    return Promise.all(atlas.map(async url => {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 192;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
      return { size: [image.width, image.height], frames: Array.from({length:16}, (_, i) => {
        const pixels = ctx.getImageData(i % 8 * 96, Math.floor(i / 8) * 96, 96, 96).data;
        return pixels.filter((_, j) => j % 4 === 3 && pixels[j] > 128).length;
      }), pixels: canvas.toDataURL() };
    }));
  });
  expect(new Set(frames.map(a => a.pixels)).size).toBe(3);
  for (const atlas of frames) { expect(atlas.size).toEqual([768,192]); expect(atlas.frames.every(n => n > 500)).toBe(true); }
});

test('referencia costera: base naval, puerto, seis ilustraciones de Luffy y comida con hueso', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.locator('#start').click(); await isolateWalk(page);
  await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; r.update = () => {}; });
  for (const district of ['barracks','harbor','plaza']) {
    await page.evaluate(({ district }) => {
      const qa = window.__OPS_QA__!, r = qa.getRun()!;
      let chunk = r.world.getChunk(0, district === 'harbor' ? 3 : 0);
      if (district === 'plaza') chunk = Array.from({length:60}, (_, i) => r.world.getChunk(i - 30, 0)).find(c => c.district === 'plaza')!;
      r.player.x = chunk.cx * 512 + 256; r.player.y = chunk.cy * 512 + 256; qa.draw(); qa.tick();
    }, { district });
    await page.screenshot({ path: info.outputPath(`shells-${district}.png`) });
  }
  await page.evaluate(async () => {
    const path = '/src/ui/pixel-art.ts', { artUrl } = await import(/* @vite-ignore */ path);
    const gallery = document.createElement('div'); gallery.id = 'luffy-art-review';
    Object.assign(gallery.style, { position:'fixed', inset:'14px', background:'#102635', zIndex:'40000', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', padding:'12px', overflow:'auto' });
    for (const id of ['elastic-punch','gatling','bazooka','whip','balloon','axe']) {
      const item = document.createElement('div'), image = document.createElement('img'), title = document.createElement('div');
      image.src = artUrl('ability-' + id); image.width = image.height = 96; image.style.imageRendering = 'pixelated'; title.textContent = id;
      item.append(image,title); gallery.append(item);
    }
    const food = new Image(); food.src = '/src/assets/worlds/food.png'; food.width = 96; food.height = 84; food.style.imageRendering='pixelated'; food.alt = 'Carne con hueso blanco'; gallery.append(food); document.body.append(gallery);
    await Promise.all(Array.from(gallery.querySelectorAll('img')).map(image => image.decode()));
  });
  expect(await page.locator('#luffy-art-review img').evaluateAll(images => new Set(images.map(image => (image as HTMLImageElement).src)).size)).toBe(7);
  await page.screenshot({ path: info.outputPath('luffy-six-illustrations-food.png') });
  expect(errors).toEqual([]);
});

test('Morgan naval: zoom de exploración, seguimiento y límites de cámara', async ({page},info) => {
  await page.locator('#start').click();
  const zoom = await page.evaluate(() => window.__OPS_QA__!.metrics().cameraZoom);
  await page.evaluate(() => { const qa=window.__OPS_QA__!,r=qa.getRun()!;r.beginMorgan();r.update=()=>{};qa.draw();qa.tick(); });
  expect(await page.evaluate(() => window.__OPS_QA__!.metrics().cameraZoom)).toBe(zoom);
  const before = await page.evaluate(() => window.__OPS_QA__!.metrics().cameraX!);
  await page.evaluate(() => {const qa=window.__OPS_QA__!;qa.getRun()!.player.x+=250;qa.draw(16);});
  const after = await page.evaluate(() => window.__OPS_QA__!.metrics().cameraX!);
  expect(after).toBeGreaterThan(before);expect(after).toBeLessThan(before+250);
  for (const edge of ['center','gate','corner']) {
    await page.evaluate(({edge})=>{const qa=window.__OPS_QA__!,r=qa.getRun()!;Object.assign(r.player,edge==='center'?{x:1280,y:900}:edge==='gate'?{x:1280,y:320}:{x:60,y:60});for(let i=0;i<30;i++)qa.draw(100);}, {edge});
    await page.screenshot({path:info.outputPath(`naval-${edge}.png`)});
  }
  const geometry = await page.evaluate(()=>{const r=window.__OPS_QA__!.getRun()!;return {w:r.arena.width,h:r.arena.height,blocked:r.arena.covers.every(c=>!r.world.canOccupy(c.x+16,c.y+16,14)),bound:!r.world.canOccupy(-10,200,14)};});
  expect(geometry.blocked).toBe(true);expect(geometry.bound).toBe(true);expect(geometry.w).toBeGreaterThan(page.viewportSize()!.width/zoom);expect(geometry.h).toBeGreaterThan(page.viewportSize()!.height/zoom);
  expect(await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom)).toBe(zoom);
});

test('recompensa de Morgan permite unir Pistol y Gatling antes del viaje',async({page})=>{
 await page.locator('#start').click();
 await page.evaluate(async()=>{const path='/src/game/systems/loadout.ts',{improveAttack}=await import(/* @vite-ignore */path);const qa=window.__OPS_QA__!,r=qa.getRun()!;improveAttack(r.player,'gatling');r.player.attacks[0].level=6;r.player.attacks[1].level=3;r.beginMorgan();const b=r.encounter!;b.body.x=r.player.x+40;b.body.y=r.player.y;b.body.hp=1;r.update(1/60,{x:0,y:0});qa.tick();});
 await expect(page.locator('#combinations')).toBeVisible();
 await page.locator('[data-join="0"]').click();await page.locator('[data-join="1"]').click();
 await expect(page.locator('#voyage')).toBeVisible();await expect(page.locator('#voyage')).toBeHidden({timeout:15000});
 expect(await page.evaluate(()=>{const r=window.__OPS_QA__!.getRun()!;return {zone:r.zone,levels:r.player.attacks.map(a=>a.level),group:r.player.abilitySlots.some(s=>s.includes('elastic-punch')&&s.includes('gatling'))};})).toEqual({zone:'orange-town',levels:[6,3],group:true});
 await expect(page.locator('.attack-slot .ability-component')).toHaveCount(2);
});

test('ciclos reales de cuatro pasos y poses de daño/derrota de Morgan',async({page},info)=>{
 await page.locator('#start').click();
 const frames=await page.evaluate(()=>{
  const qa=window.__OPS_QA__!,r=qa.getRun()!;r.morganDefeated=true;r.boardToOrangeTown();r.update=()=>{};r.enemies.clear();
  const enemy=r.enemies.acquire()!;Object.assign(enemy,{id:810,visual:'buggy-pirate',x:r.player.x+40,y:r.player.y+80,hp:100,radius:13,flash:0,ranged:undefined});qa.draw(100);
  const result:string[]=[];for(let i=0;i<8;i++){enemy.x+=13;qa.draw(100);result.push(qa.metrics().enemyTextures[0]);}return result;
 });expect(new Set(frames).size).toBe(4);
 const boss=await page.evaluate(()=>{
  const qa=window.__OPS_QA__!,r=qa.getRun()!;r.zone='shells-town';r.morganDefeated=false;r.beginMorgan();r.update=()=>{};const b=r.encounter!;b.body.x=r.player.x+50;b.body.y=r.player.y+70;qa.draw(100);
  const result:string[]=[];for(let i=0;i<12;i++){b.body.x+=10;qa.draw(100);result.push(qa.metrics().bossTexture!);}b.body.flash=.15;qa.draw(100);const hurt=qa.metrics().bossTexture;b.body.flash=0;b.defeated();qa.draw(100);const kneel=qa.metrics().bossTexture;b.elapsed=.6;qa.draw(100);return{frames:result,hurt,kneel,fall:qa.metrics().bossTexture};
 });expect(new Set(boss.frames).size).toBe(4);expect(boss.hurt).toBe('morgan-pose-13');expect(boss.kneel).toBe('morgan-pose-14');expect(boss.fall).toBe('morgan-pose-15');
 await page.screenshot({path:info.outputPath('morgan-fall.png')});
});

test('diez sprites originales y cofre grande: equipar, mejorar, máximo y reemplazo', async ({ page }, info) => {
  await page.locator('#start').click(); await isolateWalk(page);
  await page.evaluate(async () => {
    const path='/src/ui/item-art.ts', { ITEM_IMAGES }=await import(/* @vite-ignore */ path);
    const gallery=document.createElement('div');gallery.id='item-gallery';gallery.style.cssText='position:fixed;inset:0;z-index:99999;background:#24333f;display:grid;grid-template-columns:repeat(5,1fr);align-content:center;gap:12px';
    for(const [id,src] of Object.entries(ITEM_IMAGES)){const img=document.createElement('img');img.src=src as string;img.alt=id;img.style.cssText='width:100%;max-width:120px;image-rendering:pixelated';gallery.append(img);}
    document.body.append(gallery);
  });
  await expect.poll(()=>page.locator('#item-gallery img').evaluateAll(images=>images.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth===96))).toBe(true);
  await expect(page.locator('#item-gallery img')).toHaveCount(10);await page.screenshot({path:info.outputPath('ten-original-items.png')});await page.locator('#item-gallery').evaluate(e=>e.remove());
  // Abrir el cofre real, sin pasar por la recogida antigua de objetos.
  await page.evaluate(()=>{const qa=window.__OPS_QA__!,r=qa.getRun()!,c=r.chests.active[0]??{id:-999,kind:'chest',radius:14,hp:24,maxHp:24,speed:0,damage:0,xp:0,flash:0,x:0,y:0,active:false,large:true,openProgress:0};if(!r.chests.active.length)r.chests.active.push(c as typeof r.chests.active[number]);c.active=true;c.large=true;c.x=r.player.x;c.y=r.player.y;c.openProgress=2.99;r.update(1/60,{x:0,y:0});qa.tick();});
  await expect(page.locator('#item-found')).toBeVisible();
  expect(await page.evaluate(()=>Object.keys(window.__OPS_QA__!.getRun()!.player.items).length)).toBe(0);
  await page.locator('#item-take').click();await expect(page.locator('#item-found')).toBeHidden();
  const equipped=await page.evaluate(()=>Object.keys(window.__OPS_QA__!.getRun()!.player.items)[0]);
  const offer=async(id:string)=>{await page.evaluate(id=>{const qa=window.__OPS_QA__!,r=qa.getRun()!;r.pendingItem=id;r.status='item';qa.tick();},id);await expect(page.locator('#item-found')).toBeVisible();};
  for(let level=2;level<=3;level++){await offer(equipped);await expect(page.locator('#item-take')).toContainText('Mejorar');await page.locator('#item-take').click();expect(await page.evaluate(id=>window.__OPS_QA__!.getRun()!.player.items[id],equipped)).toBe(level);}
  await offer(equipped);await expect(page.locator('#item-take')).toBeDisabled();await page.locator('#item-keep').click();
  const next=equipped==='vest'?'haramaki':'vest';await offer(next);await expect(page.locator('#item-old-art img')).toHaveCount(1);
  const card=await page.locator('#item-found .dialog-card').boundingBox();expect(card!.y).toBeGreaterThanOrEqual(0);expect(card!.y+card!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.screenshot({path:info.outputPath('item-comparison.png')});await page.locator('#item-take').click();
  expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.player.items)).toEqual({[next]:1});
});

test('HUD compacto: estrellas, combinaciones, objeto y Morgan sin superposición', async ({ page }, info) => {
  await page.locator('#start').click(); await isolateWalk(page);
  await expect(page.locator('#equipped-item')).toBeHidden();
  await expect(page.locator('#attack-selection-label')).toBeHidden();
  await expect(page.locator('#run-items')).toBeHidden();
  await expect(page.locator('#navigation-hint')).toBeHidden();
  await expect(page.locator('.run-clock')).not.toContainText('EXPLORA');
  await page.evaluate(async()=>{
    const path='/src/game/systems/loadout.ts',itemsPath='/src/game/systems/items.ts';
    const {improveAttack}=await import(/* @vite-ignore */ path),{equipItem}=await import(/* @vite-ignore */ itemsPath);
    const qa=window.__OPS_QA__!,r=qa.getRun()!,p=r.player;
    for(const id of ['gatling','bazooka','frenzy'])improveAttack(p,id);
    p.attacks.find(a=>a.id==='gatling')!.level=5;p.attacks.find(a=>a.id==='bazooka')!.level=6;
    equipItem(p,'haramaki');qa.tick();
  });
  await expect(page.locator('[data-ability="elastic-punch"] .level-stars svg')).toHaveCount(1);
  await expect(page.locator('[data-ability="gatling"] .level-stars svg')).toHaveCount(5);
  await expect(page.locator('[data-ability="bazooka"] .level-stars.gold svg')).toHaveCount(1);
  await expect(page.locator('#equipped-item')).toBeVisible();
  await page.locator('[data-slot="1"]').click();await expect(page.locator('[data-slot="1"]')).toHaveAttribute('aria-pressed','true');
  for(const width of [1440,1024,844,667,568]){
    await page.setViewportSize({width,height:width>1000?800:width===568?320:390});
    const rects=await page.evaluate(()=>{
      const box=(selector:string)=>{const r=document.querySelector(selector)!.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return {player:box('.player-status'),clock:box('.run-clock'),pause:box('#pause'),row:box('.attack-row'),tools:box('#manage-abilities'),joy:box('#joystick'),touch:document.body.classList.contains('touch-device')};
    });
    expect(rects.player.right).toBeLessThan(rects.clock.x);expect(rects.pause.width).toBeGreaterThanOrEqual(44);expect(rects.row.right).toBeLessThan(rects.tools.x);
    expect(rects.row.x).toBeGreaterThanOrEqual(0);expect(rects.row.bottom).toBeLessThanOrEqual(width>1000?800:width===568?320:390);
    if(rects.touch)expect(rects.row.x).toBeGreaterThan(rects.joy.right);
    if(width===844)await page.screenshot({path:info.outputPath('hud-exploration-844.png')});
  }
  await page.evaluate(()=>{
    const qa=window.__OPS_QA__!,r=qa.getRun()!,p=r.player;
    p.abilitySlots=[p.attacks.map(a=>a.id),[],[],[]];p.selectedSlot=0;r.beginMorgan();r.player.hurtTimer=1e6;
    for(const a of p.attacks)a.cooldown=1e6;qa.tick();qa.draw();
  });
  for(const width of [1440,844,568]){
    await page.setViewportSize({width,height:width>1000?800:width===568?320:390});
    await expect(page.locator('#boss-panel')).toBeVisible();await expect(page.locator('.run-clock')).toBeVisible();await expect(page.locator('#captain-avatar')).toBeVisible();
    await expect(page.locator('[data-slot="0"] .ability-component')).toHaveCount(4);
    const boxes=await page.evaluate(()=>['.player-status','.run-clock','#boss-panel','#pause','.attack-row'].map(s=>{const r=document.querySelector(s)!.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
    for(const b of boxes){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width);expect(b.bottom).toBeLessThanOrEqual(width>1000?800:width===568?320:390);}
    expect(boxes[2].y).toBeGreaterThanOrEqual(boxes[1].bottom);
    expect(boxes[2].x>=boxes[0].right||boxes[2].y>=boxes[0].bottom).toBe(true);
    await page.screenshot({path:info.outputPath(`hud-morgan-${width}.png`)});
  }
  await page.locator('#pause').click();await expect(page.locator('#paused')).toBeVisible();
});

test('Buggy completo: cámara de exploración, seis patrones, partes y sprites animados', async ({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#start').click();const normalZoom=await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom);
 await page.evaluate(()=>{const qa=window.__OPS_QA__!,r=qa.getRun()!;r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();r.lootNoticeFor=0;r.player.hurtTimer=1e6;for(const a of r.player.attacks)a.cooldown=1e6;r.update=()=>{};qa.draw();qa.tick();});
 await expect(page.locator('#boss-name')).toHaveText('BUGGY');await expect(page.locator('#boss-portrait,#boss-hp')).toHaveCount(0);
 expect(await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom)).toBe(normalZoom);
 const frames=[];
 for(let i=0;i<4;i++)frames.push(await page.evaluate(()=>{const qa=window.__OPS_QA__!,b=qa.getRun()!.encounter!;b.body.x+=24;qa.draw(100);return qa.metrics().bossTexture;}));
 expect(new Set(frames).size).toBeGreaterThanOrEqual(3);
 for(const id of ['knives','ring','bomb','split','charge','barrage']){
  await page.evaluate(async id=>{
   const path='/src/content/bosses/buggy.ts',{BUGGY_ATTACKS}=await import(/* @vite-ignore */ path);
   const qa=window.__OPS_QA__!,r=qa.getRun()!,b=r.encounter!;b.cancel();b.body.x=1648;b.body.y=1152;b.body.hp=b.body.maxHp*.2;r.player.x=1408;r.player.y=1152;
   b.prepare(BUGGY_ATTACKS.find((a:{id:string})=>a.id===id)!,r.player,r.world);b.elapsed=b.telegraph!.attack.preparation-.16;b.telegraph!.elapsed=b.elapsed;qa.draw();qa.tick();
  },id);
  await expect(page.locator('#boss-phase')).toHaveCount(0);await page.screenshot({path:info.outputPath(`buggy-full-${id}-warning.png`)});
  const outcome=await page.evaluate(()=>{
   const qa=window.__OPS_QA__!,r=qa.getRun()!,b=r.encounter! as typeof r.encounter & {knives:unknown[];parts:unknown[];hazards:unknown[]};
   for(let i=0;i<25;i++)b!.tick(1/60,r.player,r.world,()=>({x:0,y:0}),()=>{});qa.draw();qa.tick();return {knives:b!.knives.length,parts:b!.parts.length,hazards:b!.hazards.length};
  });
  if(id==='knives')expect(outcome.knives).toBe(9);if(id==='ring')expect(outcome.knives).toBe(16);if(id==='split')expect(outcome.parts).toBe(3);if(id==='charge')expect(outcome.parts).toBe(1);if(id==='bomb'||id==='barrage')expect(outcome.hazards).toBeGreaterThan(0);
  await page.screenshot({path:info.outputPath(`buggy-full-${id}-impact.png`)});
 }
 await page.setViewportSize({width:568,height:320});
 await page.evaluate(()=>{window.__OPS_QA__!.draw();window.__OPS_QA__!.tick();});
 const panel=await page.locator('#boss-panel').boundingBox();expect(panel!.x).toBeGreaterThanOrEqual(0);expect(panel!.x+panel!.width).toBeLessThanOrEqual(568);
 await page.screenshot({path:info.outputPath('buggy-small-landscape.png')});
 await page.evaluate(()=>{const qa=window.__OPS_QA__!,r=qa.getRun()!;r.encounter!.cancel();r.encounter!.body.hp=0;r.encounter!.defeated();qa.draw();qa.tick();});
 await page.screenshot({path:info.outputPath('buggy-defeated.png')});expect(errors).toEqual([]);
});

test('entrenamiento uniforme:13 PNG originales,14 tarjetas y progreso conservado',async({page},info)=>{
 await page.evaluate(()=>{const s=window.__OPS_QA__!.store;s.progress.coins=1000;const p=s.getTraining('luffy');p.levels={vitality:3,force:10,critical:1,starter:1};s.flush();});
 await page.reload();await expect(page.locator('#loading')).toBeHidden();await page.locator('#train').click();
 await expect(page.locator('.training-card')).toHaveCount(14);
 await expect.poll(()=>page.locator('.training-icon').evaluateAll(images=>images.every(i=>(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth===512))).toBe(true);
 expect(await page.locator('.training-icon').evaluateAll(images=>new Set(images.map(i=>(i as HTMLImageElement).src)).size)).toBe(13);
 expect(await page.locator('[data-training="starter"] img').getAttribute('src')).toBe(await page.locator('[data-training="repertoire"] img').getAttribute('src'));
 await expect(page.locator('[data-training="force"] .bought')).toHaveCount(10);await expect(page.locator('[data-buy-training="force"]')).toBeDisabled();
 const colors=await page.locator('.training-segments i').evaluateAll(nodes=>({empty:[...new Set(nodes.filter(n=>!n.classList.contains('bought')).map(n=>getComputedStyle(n).backgroundColor))],gold:[...new Set(nodes.filter(n=>n.classList.contains('bought')).map(n=>getComputedStyle(n).backgroundColor))]}));
 expect(colors.empty).toEqual(['rgb(40, 54, 64)']);expect(colors.gold).toEqual(['rgb(217, 173, 76)']);
 for(const [width,height]of [[1440,900],[844,390],[390,844],[320,640]]){
  await page.setViewportSize({width,height});
  const layout=await page.locator('.training-card').evaluateAll(cards=>cards.map(card=>{const r=card.getBoundingClientRect(),g=card.parentElement!.getBoundingClientRect(),buy=card.querySelector('button')!.getBoundingClientRect(),text=card.querySelector('article>div')!.getBoundingClientRect();return {height:r.height,inside:r.x>=g.x&&r.right<=g.right,noOverlap:text.right<buy.left};}));
  expect(layout.every(r=>r.inside&&r.noOverlap)).toBe(true);expect(Math.max(...layout.map(r=>r.height))-Math.min(...layout.map(r=>r.height))).toBeLessThan(1);
  await page.locator('.training-dialog').evaluate(e=>e.scrollTop=0);await page.screenshot({path:info.outputPath(`training-${width}.png`)});
 }
 await page.setViewportSize({width:844,height:390});await page.locator('[data-buy-training="vitality"]').click();await expect(page.locator('[data-training="vitality"] .bought')).toHaveCount(4);await expect(page.locator('#training-wallet')).toHaveText('905 berries');
 await page.reload();await expect(page.locator('#loading')).toBeHidden();await page.locator('#train').click();await expect(page.locator('[data-training="vitality"] .bought')).toHaveCount(4);await expect(page.locator('#training-wallet')).toHaveText('905 berries');
});

test('piratas corregidos conservan figuras completas en ocho direcciones y cuatro pasos',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.locator('#start').click();
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.morganDefeated=true;r.boardToOrangeTown();r.enemies.clear();r.lootNoticeFor=0;r.update=()=>{};
 for(const [i,visual]of ['buggy-pirate','buggy-gunner','buggy-bruiser'].entries()){const e=r.enemies.acquire()!;Object.assign(e,{id:700+i,visual,x:r.player.x-100+i*100,y:r.player.y+80,hp:100,maxHp:100,radius:13,flash:0,speed:0,damage:0,ranged:undefined});}q.draw();q.tick();});
 const poses=new Set<string>();
 for(const [dx,dy]of [[24,0],[24,24],[0,24],[-24,24],[-24,0],[-24,-24],[0,-24],[24,-24]]){
  for(let step=0;step<4;step++){
   const keys=await page.evaluate(({dx,dy})=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(const e of r.enemies.items)if(e.active){e.x+=dx;e.y+=dy;}q.draw(100);return q.metrics().enemyTextures;},{dx,dy});keys.forEach(k=>poses.add(k));
  }
 }
 expect(poses.size).toBeGreaterThanOrEqual(24);await page.screenshot({path:info.outputPath('pirates-walking.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(const e of r.enemies.items)if(e.active)e.flash=.15;q.draw();});await page.screenshot({path:info.outputPath('pirates-hurt.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(const e of r.enemies.items)if(e.active){e.flash=0;e.ranged={interval:2,speed:200,range:250};e.shotTimer=1.95;}q.draw(100);});await page.screenshot({path:info.outputPath('pirates-attack.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(const e of r.enemies.items)if(e.active){e.ranged=undefined;e.shotTimer=0;}q.draw(200);});await page.screenshot({path:info.outputPath('pirates-idle.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(const e of r.enemies.items)if(e.active){r.visualDeaths.push({x:e.x,y:e.y,visual:e.visual!});e.active=false;}q.draw(100);});await page.screenshot({path:info.outputPath('pirates-death.png')});expect(errors).toEqual([]);
});

test('marines: tres armas, cuatro pasos sin recortes, preparación, disparo y derrota',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#start').click();
 await page.evaluate(async()=>{
  const q=window.__OPS_QA__!,r=q.getRun()!,path='/src/content/catalog.ts',{ENEMIES}=await import(/* @vite-ignore */path);
  r.enemies.clear();r.update=()=>{};r.player.hurtTimer=1e6;
  for(const [i,id]of ['marine','marine-rifle','marine-veteran'].entries()){
   const def=ENEMIES[id],e=r.enemies.acquire()!;Object.assign(e,{...def,id:800+i,active:true,x:r.player.x-80+i*80,y:r.player.y+70,maxHp:def.hp,flash:0,shotTimer:1,shotRecovery:0,shotWindup:0});
  }const frames=new Set<string>();(window as unknown as {marineFrames:Set<string>}).marineFrames=frames;
  r.update=dt=>{q.metrics().enemyTextures.forEach(k=>frames.add(k));for(const e of r.enemies.items)if(e.active){e.x+=66*dt;if(e.x>r.player.x+300)e.x=r.player.x-180;}};q.draw();q.tick();
 });
 const poses=new Set<string>();
 for(let step=0;step<8;step++){
  await page.waitForTimeout(200);
  const keys=await page.evaluate(()=>{const q=window.__OPS_QA__!;q.draw(16);return q.metrics().enemyTextures;});keys.forEach(k=>poses.add(k));
  await page.screenshot({path:info.outputPath(`marines-step-${step}.png`)});
 }
 const seen=await page.evaluate(()=>Array.from((window as unknown as {marineFrames:Set<string>}).marineFrames));seen.forEach(k=>poses.add(k));
 for(const visual of ['marine-sword','marine-rifle','marine-veteran'])for(let frame=1;frame<=4;frame++)expect(poses.has(`${visual}-e-${frame}`)).toBe(true);
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.update=()=>{};q.draw(200);});
 expect(await page.evaluate(()=>window.__OPS_QA__!.metrics().enemyTextures)).toEqual(expect.arrayContaining(['marine-sword-e-0','marine-rifle-e-0','marine-veteran-e-0']));
 await page.screenshot({path:info.outputPath('marines-idle-east.png')});
 // Sustained turns change the facing, but brief diagonal/separation corrections do not.
 for(const [dx,dy,direction]of [[-1,0,'w'],[0,-1,'n'],[0,1,'s']] as const){
  const keys=await page.evaluate(({dx,dy})=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(let n=0;n<12;n++){for(const e of r.enemies.items)if(e.active){e.x+=dx;e.y+=dy;}q.draw(1000/60);}q.draw(200);return q.metrics().enemyTextures;},{dx,dy});
  for(const visual of ['marine-sword','marine-rifle','marine-veteran'])expect(keys).toContain(`${visual}-${direction}-0`);
  await page.screenshot({path:info.outputPath(`marines-idle-${direction}.png`)});
 }

 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.update=()=>{};let i=0;for(const e of r.enemies.items)if(e.active){e.x=r.player.x-80+(i++)*80;e.shotWindup=e.ranged?.preparation??0;e.shotAngle=-Math.PI/2;}q.draw(200);});
 await page.screenshot({path:info.outputPath('marines-aiming.png')});
 expect(await page.evaluate(()=>window.__OPS_QA__!.metrics().enemyTextures)).toEqual(expect.arrayContaining(['marine-rifle-n-5','marine-veteran-n-5']));
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(const e of r.enemies.items)if(e.active){e.shotWindup=0;e.shotRecovery=.3;}q.draw(100);});
 await page.screenshot({path:info.outputPath('marines-attack.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(const e of r.enemies.items)if(e.active){e.flash=.15;e.shotRecovery=0;}q.draw(100);});
 await page.screenshot({path:info.outputPath('marines-hurt.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(const e of r.enemies.items)if(e.active){r.visualDeaths.push({x:e.x,y:e.y,visual:e.visual!});e.active=false;}q.draw(100);});
 await page.screenshot({path:info.outputPath('marines-death.png')});
 // Decode the actual Vite imports and check transparency/padding in all 192 packed cells.
 const assets=await page.evaluate(async()=>{
  const results=[];
  for(const name of ['marine-sword','marine-rifle','marine-veteran']){
   const path=`/src/assets/motion/${name}.png?url`,{default:url}=await import(/* @vite-ignore */path),im=new Image();im.src=url;await im.decode();
   const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);let bad=0,empty=0;
   for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    const a=ctx.getImageData(col*128,row*128,128,128).data;let count=0;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){if(a[(y*128+x)*4+3]>96){count++;if(x<2||x>125||y<2||y>125)bad++;}}
    if(!count)empty++;
   }
   for(let col=0;col<8;col++){const idle=ctx.getImageData(col*128,0,128,128).data,passing=ctx.getImageData(col*128,256,128,128).data; if(!idle.every((v,i)=>v===passing[i]))bad++;}
   results.push({name,bad,empty,width:im.width,height:im.height});
  }return results;
 });
 for(const a of assets){expect(a.bad).toBe(0);expect(a.empty).toBe(0);expect(a.width).toBe(1024);expect(a.height).toBe(1024);}
 expect(errors).toEqual([]);
});

test('pueblos orgánicos: distintas semillas, continuidad visual y arenas conservadas',async({page},info)=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#start').click();
 for(const theme of ['shells','orange'] as const)for(const [seed,x,y]of [[3,-256,256],[42,256,256],[887,768,-256]]){
  const metrics=await page.evaluate(async({theme,seed,x,y})=>{
   const worldPath='/src/game/world/world.ts',shellPath='/src/content/worlds/shells-town.ts',orangePath='/src/content/worlds/orange-town.ts';
   const {ProceduralWorld}=await import(/* @vite-ignore */worldPath),{SHELLS_TOWN}=await import(/* @vite-ignore */shellPath),{ORANGE_TOWN}=await import(/* @vite-ignore */orangePath);
   const q=window.__OPS_QA__!,r=q.getRun()!;r.update=()=>{};r.enemies.clear();r.projectiles.clear();r.areas.clear();r.strikes.length=0;r.world=new ProceduralWorld(seed,theme);r.zone=theme==='orange'?'orange-town':'shells-town';r.definition=theme==='orange'?ORANGE_TOWN:SHELLS_TOWN;r.player.x=x;r.player.y=y;r.player.hurtTimer=0;q.draw();q.tick();return q.metrics();
  },{theme,seed,x,y});
  expect(metrics.renderedChunks).toBeGreaterThan(4);expect(metrics.textureSlots).toBeLessThanOrEqual(36);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const view=page.viewportSize()!,hero=await page.screenshot({clip:{x:view.width/2-32,y:view.height/2-70,width:64,height:80}});
  const red=await page.evaluate(async png=>{const im=new Image();im.src='data:image/png;base64,'+png;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;let red=0;for(let i=0;i<a.length;i+=4)if(a[i]>100&&a[i]>a[i+1]*1.6&&a[i]>a[i+2]*1.6)red++;return red;},hero.toString('base64'));
  expect(red,`Luffy visible: ${theme}/${seed}`).toBeGreaterThan(12);
  await page.screenshot({path:info.outputPath(`town-${theme}-${seed}.png`)});
 }
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.zone='shells-town';r.beginMorgan();q.draw();q.tick();});
 await expect(page.locator('#boss-name')).toHaveText('AXE-HAND MORGAN');await page.screenshot({path:info.outputPath('town-morgan-unchanged.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();q.draw();q.tick();});
 await expect(page.locator('#boss-name')).toHaveText('BUGGY');await page.screenshot({path:info.outputPath('town-buggy-unchanged.png')});expect(errors).toEqual([]);
});

test('Syrup completo: viaje voluntario, tres piratas, seis patrones de Kuro y Baratie pendiente',async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#start').click();const zoom=await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom);
 await page.evaluate(async()=>{
  const path='/src/game/systems/loadout.ts',{improveAttack}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!;
  r.morganDefeated=true;r.boardToOrangeTown();improveAttack(r.player,'gatling');r.player.level=36;r.player.xp=7;r.player.collectedBerries=123;r.player.hp=70;
  r.beginBuggy();r.encounter!.body.x=r.player.x+40;r.encounter!.body.y=r.player.y;r.encounter!.body.hp=1;r.player.attacks[0].cooldown=0;
  for(let i=0;i<90;i++)r.update(1/60,{x:0,y:0});r.update=()=>{};q.draw();q.tick();
 });
 await expect(page.locator('#combinations')).toBeVisible();await page.locator('#combination-done').click();
 await expect(page.locator('#navigation-hint')).toContainText('SYRUP VILLAGE');
 expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.zone)).toBe('buggy-arena');await page.screenshot({path:info.outputPath('syrup-voluntary-exit.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.update=Object.getPrototypeOf(r).update;Object.assign(r.player,r.exitSignal);r.update(1/60,{x:0,y:0});q.tick();});
 await expect(page.locator('#voyage-title')).toContainText('SYRUP VILLAGE');
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,{x:0,y:0});r.update=()=>{};q.draw();q.tick();});
 await expect(page.locator('#area-label')).toContainText('SYRUP VILLAGE');
 expect(await page.evaluate(()=>{const p=window.__OPS_QA__!.getRun()!.player;return [p.level,p.xp,p.collectedBerries,p.attacks.length];})).toEqual([36,7,123,2]);
 await page.evaluate(async()=>{const path='/src/content/catalog.ts',{ENEMIES}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!;
  for(const [i,id]of ['blackcat-pirate','blackcat-claw','blackcat-hypnotist'].entries()){const d=ENEMIES[id],e=r.enemies.acquire()!;Object.assign(e,d,{id:800+i,active:true,x:r.player.x-100+i*100,y:r.player.y+60,maxHp:d.hp,flash:0,shotTimer:0,shotWindup:0,shotRecovery:0,meleeTimer:0,meleeWindup:0,meleeHits:0});}
  for(const a of r.player.attacks)a.cooldown=1e6;
  for(let i=0;i<70;i++){r.player.hurtTimer=1;Object.getPrototypeOf(r).update.call(r,1/60,{x:0,y:0});}q.draw();q.tick();
 });
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:info.outputPath('syrup-map-and-enemies.png')});
 const textures=await page.evaluate(()=>window.__OPS_QA__!.metrics().enemyTextures);for(const id of ['blackcat-pirate','blackcat-claw','blackcat-hypnotist'])expect(textures.some(t=>t.startsWith(id+'-'))).toBe(true);
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.beginKuro();q.draw();q.tick();});
 await expect(page.locator('#boss-name')).toHaveText('CAPITÀ KURO');expect(await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom)).toBe(zoom);await page.screenshot({path:info.outputPath('kuro-arena.png')});
 for(const id of ['cross','pounce','ghost','shakushi','flurry','surprise']){
  await page.evaluate(async id=>{const path='/src/content/bosses/kuro.ts',{KURO_ATTACKS}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;
   b.cancel();b.body.x=1408;b.body.y=1090;b.body.hp=b.body.maxHp*.2;r.player.x=1558;r.player.y=1090;r.player.hurtTimer=1;
   b.prepare(KURO_ATTACKS.find((a:{id:string})=>a.id===id)!,r.player,r.world);b.elapsed=b.telegraph!.attack.preparation-.15;b.telegraph!.elapsed=b.elapsed;b.phase=3;q.draw();q.tick();
  },id);
  await expect(page.locator('#boss-phase')).toHaveCount(0);await page.screenshot({path:info.outputPath(`kuro-${id}-warning.png`)});
  await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(let i=0;i<14;i++)r.encounter!.tick(1/60,r.player,r.world,()=>({x:0,y:0}),()=>{});q.draw();q.tick();});
  await page.screenshot({path:info.outputPath(`kuro-${id}-impact.png`)});
 }
 await page.evaluate(async()=>{
  const path='/src/content/bosses/kuro.ts',{KURO_ATTACKS}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;
  b.cancel();b.body.x=1408;b.body.y=1090;r.player.x=1558;r.player.y=1090;r.player.hurtTimer=1e6;
  b.prepare(KURO_ATTACKS.find((a:{id:string})=>a.id==='shakushi')!,r.player,r.world);
  for(let i=0;i<2000&&!b.moveName.startsWith('ESGOTAT');i++)b.tick(.01,r.player,r.world,()=>({x:0,y:0}),()=>{});
  if(!b.moveName.startsWith('ESGOTAT'))throw Error('Shakushi no acaba con agotamiento');q.draw();q.tick();
 });
 await page.screenshot({path:info.outputPath('kuro-exhaustion.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;b.cancel();b.state='approach';b.body.x=r.player.x+40;b.body.y=r.player.y;b.body.hp=1;r.player.attacks[0].cooldown=0;r.player.hurtTimer=1;
  for(let i=0;i<100&&r.status==='playing';i++)Object.getPrototypeOf(r).update.call(r,1/60,{x:0,y:0});q.draw();q.tick();});
 await expect(page.locator('#combinations')).toBeVisible();await expect(page.locator('#combination-message')).toContainText('Kuro');await page.locator('#combination-done').click();
 await expect(page.locator('#navigation-hint')).toContainText('BARATIE');
 expect(await page.evaluate(()=>{const r=window.__OPS_QA__!.getRun()!;return {won:r.kuroDefeated,unlocked:r.baratieUnlocked,travel:!!r.exitSignal,zone:r.zone};})).toEqual({won:true,unlocked:true,travel:true,zone:'kuro-arena'});
 await page.screenshot({path:info.outputPath('kuro-victory-baratie-ready.png')});expect(errors).toEqual([]);
});

test('HUD minimalista compartido: tres bosses sin panel ni textos secundarios, móvil y escritorio',async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#start').click();
 for(const boss of ['morgan','buggy','kuro']){
  await page.evaluate(id=>{
   const q=window.__OPS_QA__!,r=q.getRun()!;r.update=Object.getPrototypeOf(r).update;
   if(id==='morgan')r.beginMorgan();
   else if(id==='buggy'){r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();}
   else {r.buggyDefeated=true;r.encounter!.defeated();for(let i=0;i<90;i++)r.update(1/60,{x:0,y:0});r.finishCombinations();r.sailToSyrup();for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,{x:0,y:0});r.beginKuro();}
   r.player.hurtTimer=1e6;r.update=()=>{};q.draw();q.tick();
  },boss);
  await expect(page.locator('#boss-name')).toHaveText(boss==='morgan'?'AXE-HAND MORGAN':boss==='buggy'?'BUGGY':'CAPITÀ KURO');
  await expect(page.locator('#boss-phase,#boss-pattern,#boss-hp,#boss-portrait')).toHaveCount(0);
  await expect(page.locator('.run-clock')).toBeVisible();
  const layout=await page.evaluate(()=>{
   const boss=document.querySelector('#boss-panel')!,style=getComputedStyle(boss),bar=boss.getBoundingClientRect(),player=document.querySelector('.player-status')!.getBoundingClientRect(),clock=document.querySelector('.run-clock')!.getBoundingClientRect();
   const overlap=bar.x<player.right&&bar.right>player.x&&bar.y<player.bottom&&bar.bottom>player.y;
   return {background:style.backgroundColor,border:style.borderTopWidth,shadow:style.boxShadow,overlap,belowClock:bar.y>=clock.bottom,x:bar.x,right:bar.right,height:bar.height,width:innerWidth};
  });
  expect(layout.background).toBe('rgba(0, 0, 0, 0)');expect(layout.border).toBe('0px');expect(layout.shadow).toBe('none');expect(layout.overlap).toBe(false);expect(layout.belowClock).toBe(true);expect(layout.height).toBeLessThan(40);expect(layout.x).toBeGreaterThanOrEqual(0);expect(layout.right).toBeLessThanOrEqual(layout.width);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:info.outputPath(`${boss}-minimal-hud.png`)});
 }
 for(const width of [568,667,740,844,1024,1440]){
  await page.setViewportSize({width,height:width>1000?900:390});
  const overlap=await page.evaluate(()=>{const a=document.querySelector('#boss-panel')!.getBoundingClientRect(),b=document.querySelector('.player-status')!.getBoundingClientRect();const c=document.querySelector('.run-clock')!.getBoundingClientRect();return {overlap:a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y,belowClock:a.y>=c.bottom};});expect(overlap.overlap).toBe(false);expect(overlap.belowClock).toBe(true);
 }
 expect(errors).toEqual([]);
});

test('Baratie completo: Log Pose voluntario, flota conectada, Krieg seis patrones y Arlong pendiente',async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.locator('#start').click();const zoom=await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom);
 await page.evaluate(()=>{
  const q=window.__OPS_QA__!,r=q.getRun()!;r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();r.buggyDefeated=true;r.encounter!.defeated();
  for(let i=0;i<90;i++)r.update(1/60,{x:0,y:0});r.finishCombinations();r.sailToSyrup();for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,{x:0,y:0});r.beginKuro();
  r.player.hp=70;r.player.level=42;r.player.xp=9;r.player.collectedBerries=321;r.player.hurtTimer=10;
  r.encounter!.body.hp=1;r.encounter!.body.x=r.player.x+35;r.encounter!.body.y=r.player.y;r.player.attacks[0].cooldown=0;
  for(let i=0;i<100&&r.status==='playing';i++)r.update(1/60,{x:0,y:0});r.update=()=>{};q.draw();q.tick();
 });
 await expect(page.locator('#combinations')).toBeVisible();await page.locator('#combination-done').click();await expect(page.locator('#navigation-hint')).toContainText('BARATIE');
 expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.zone)).toBe('kuro-arena');
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.update=Object.getPrototypeOf(r).update;Object.assign(r.player,r.exitSignal);r.update(1/60,{x:0,y:0});q.tick();});
 await expect(page.locator('#voyage-title')).toContainText('BARATIE');
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,{x:0,y:0});r.update=()=>{};q.draw();q.tick();});
 await expect(page.locator('#area-label')).toContainText('BARATIE');expect(await page.evaluate(()=>{const p=window.__OPS_QA__!.getRun()!.player;return [p.level,p.xp,p.collectedBerries];})).toEqual([42,9,321]);
 await page.evaluate(async()=>{const path='/src/content/catalog.ts',{ENEMIES}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!;
  for(const [i,id]of ['krieg-saber','krieg-gunner','krieg-armored'].entries()){const d=ENEMIES[id],e=r.enemies.acquire()!;Object.assign(e,d,{id:900+i,active:true,x:r.player.x-60+i*70,y:r.player.y+75,maxHp:d.hp,flash:0,shotTimer:0,shotWindup:0,shotRecovery:0,meleeTimer:0,meleeWindup:0,meleeHits:0});}
  q.draw();q.tick();
 });
 await page.screenshot({path:info.outputPath('baratie-fleet-enemies.png')});
 const textures=await page.evaluate(()=>window.__OPS_QA__!.metrics().enemyTextures);for(const id of ['krieg-saber','krieg-gunner','krieg-armored'])expect(textures.some(t=>t.startsWith(id))).toBe(true);
 // Recorrido sobre la cubierta y las pasarelas usando entrada real de simulación.
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.player.hurtTimer=1e6;for(const a of r.player.attacks)a.cooldown=1e6;
  const keys=[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}];for(const d of keys)for(let i=0;i<120;i++){Object.getPrototypeOf(r).update.call(r,1/60,d);if(!r.world.canOccupy(r.player.x,r.player.y,14))throw Error('El jugador pisa el mar');}q.draw();q.tick();
 });
 await page.screenshot({path:info.outputPath('baratie-explored.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.beginKrieg();q.draw();q.tick();});
 await expect(page.locator('#boss-name')).toHaveText('DON KRIEG');expect(await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom)).toBe(zoom);await expect(page.locator('#boss-phase,#boss-pattern,#boss-hp')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('krieg-arena.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.player.y=256;for(let i=0;i<40;i++)q.draw(33);q.tick();});
 await page.screenshot({path:info.outputPath('krieg-arena-sea-restaurant.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.player.y=1216;for(let i=0;i<40;i++)q.draw(33);q.tick();});
 for(const id of ['spear','gun','naval','shield','poison','mh5']){
  const prep=await page.evaluate(async id=>{const path='/src/content/bosses/krieg.ts',{KRIEG_ATTACKS}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;
   b.cancel();b.body.x=1536;b.body.y=1024;b.body.hp=b.body.maxHp*.2;r.player.x=1536;r.player.y=1250;r.player.hurtTimer=10;
   b.prepare(KRIEG_ATTACKS.find((a:{id:string})=>a.id===id)!,r.player,r.world);b.elapsed=b.telegraph!.attack.preparation-.15;b.telegraph!.elapsed=b.elapsed;q.draw();q.tick();return b.telegraph!.attack.preparation;
  },id);expect(prep).toBeGreaterThanOrEqual(.35);
  await page.screenshot({path:info.outputPath(`krieg-${id}-warning.png`)});
  await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(let i=0;i<20;i++)r.encounter!.tick(.01,r.player,r.world,()=>({x:0,y:0}),()=>{});q.draw();q.tick();});
  await page.screenshot({path:info.outputPath(`krieg-${id}-impact.png`)});
 }
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;b.body.defense!.armor!.remaining=1000;q.draw();q.tick();});await page.screenshot({path:info.outputPath('krieg-armor-cracked.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;b.body.defense!.armor!.remaining=0;q.draw();q.tick();});await page.screenshot({path:info.outputPath('krieg-armor-broken.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;b.cancel();b.state='approach';b.body.x=r.player.x+35;b.body.y=r.player.y;b.body.hp=1;r.player.attacks[0].cooldown=0;r.player.hurtTimer=10;
  for(let i=0;i<100&&r.status==='playing';i++)Object.getPrototypeOf(r).update.call(r,1/60,{x:0,y:0});q.draw();q.tick();});
 await expect(page.locator('#combinations')).toBeVisible();await expect(page.locator('#combination-message')).toContainText('Krieg');await page.locator('#combination-done').click();await expect(page.locator('#navigation-hint')).toContainText('ARLONG');
 expect(await page.evaluate(()=>{const r=window.__OPS_QA__!.getRun()!;return {won:r.kriegDefeated,unlocked:r.arlongUnlocked,travel:!!r.exitSignal,zone:r.zone,projectiles:r.projectiles.count};})).toEqual({won:true,unlocked:true,travel:true,zone:'krieg-arena',projectiles:0});
 await page.screenshot({path:info.outputPath('krieg-victory-arlong-pending.png')});await page.locator('#pause').click();await expect(page.locator('#paused')).toBeVisible();expect(errors).toEqual([]);
});

test('Arlong Park completo: canales, hombres-pez, seis ataques, furia y Roger pendiente',async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.locator('#start').click();const zoom=await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom);
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,axis={x:0,y:0};
  const voyage=()=>{for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,axis);};const wait=()=>{for(let i=0;i<90;i++)r.update(1/60,axis);};
  r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();r.buggyDefeated=true;r.encounter!.defeated();wait();r.finishCombinations();r.sailToSyrup();voyage();r.beginKuro();r.kuroDefeated=true;r.encounter!.defeated();wait();r.finishCombinations();r.sailToBaratie();voyage();r.beginKrieg();
  r.player.hp=70;r.player.level=45;r.player.xp=9;r.player.collectedBerries=456;r.player.hurtTimer=10;r.encounter!.body.hp=1;r.encounter!.body.x=r.player.x+35;r.encounter!.body.y=r.player.y;r.player.attacks[0].cooldown=0;
  for(let i=0;i<100&&r.status==='playing';i++)r.update(1/60,axis);r.update=()=>{};q.draw();q.tick();
 });
 await expect(page.locator('#combinations')).toBeVisible();await page.locator('#combination-done').click();await expect(page.locator('#navigation-hint')).toContainText('ARLONG PARK');expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.zone)).toBe('krieg-arena');
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.update=Object.getPrototypeOf(r).update;Object.assign(r.player,r.exitSignal);r.update(1/60,{x:0,y:0});q.tick();});await expect(page.locator('#voyage-title')).toContainText('ARLONG PARK');
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,{x:0,y:0});r.update=()=>{};r.player.hurtTimer=0;r.player.x=256;r.player.y=400;for(let i=0;i<30;i++)q.draw(33);q.tick();});
 await expect(page.locator('#area-label')).toContainText('ARLONG PARK');expect(await page.evaluate(()=>{const p=window.__OPS_QA__!.getRun()!.player;return [p.level,p.xp,p.collectedBerries];})).toEqual([45,9,456]);
 await page.evaluate(async()=>{const path='/src/content/catalog.ts',{ENEMIES}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!;
  for(const[i,id]of ['fishman-fighter','fishman-spitter','fishman-karate'].entries()){const d=ENEMIES[id],e=r.enemies.acquire()!;Object.assign(e,d,{id:1200+i,active:true,x:48+i*96,y:400,maxHp:d.hp,flash:0,meleeTimer:0,meleeWindup:0,meleeHits:0,shotTimer:0,shotWindup:0,shotRecovery:0});}q.draw();q.tick();
 });
 await page.screenshot({path:info.outputPath('arlong-canals-fishmen.png')});const textures=await page.evaluate(()=>window.__OPS_QA__!.metrics().enemyTextures);for(const id of ['fishman-fighter','fishman-spitter','fishman-karate'])expect(textures.some(t=>t.startsWith(id))).toBe(true);
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.enemies.clear();r.player.hurtTimer=1e6;for(const a of r.player.attacks)a.cooldown=1e6;for(let i=0;i<100;i++){Object.getPrototypeOf(r).update.call(r,1/60,{x:0,y:1});if(!r.world.canOccupy(r.player.x,r.player.y,14))throw Error('El jugador pisa agua');}r.beginArlong();r.player.hurtTimer=0;q.draw();q.tick();});
 await expect(page.locator('#boss-name')).toHaveText('ARLONG');await expect(page.locator('#boss-phase,#boss-pattern,#boss-hp')).toHaveCount(0);expect(await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom)).toBe(zoom);expect((await page.evaluate(()=>window.__OPS_QA__!.metrics().bossTexture))?.startsWith('arlong-')).toBe(true);await page.screenshot({path:info.outputPath('arlong-arena-before.png')});
 const before=await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.player.x=1152;r.player.y=1216;for(let i=0;i<30;i++)q.draw(33);return {slots:q.metrics().textureSlots,solid:r.world.canOccupy(1152,1088,14)};});expect(before.solid).toBe(false);await page.screenshot({path:info.outputPath('arlong-columns-before.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;b.body.hp=b.body.maxHp*.2;r.player.hurtTimer=1e6;for(let i=0;i<100;i++)b.tick(.01,r.player,r.world,()=>({x:0,y:0}),()=>{});r.player.hurtTimer=0;q.draw();q.tick();});
 const after=await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;return {revision:r.world.revision,slots:q.metrics().textureSlots,free:r.world.canOccupy(1152,1088,14)};});expect(after.revision).toBe(1);expect(after.free).toBe(true);expect(after.slots).toBeLessThanOrEqual(before.slots+2);await page.screenshot({path:info.outputPath('arlong-columns-after-rage.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.player.x=1536;r.player.y=1216;for(let i=0;i<30;i++)q.draw(33);});
 for(const id of ['bite','kiribachi','water','tooth','dive','darts']){
  await page.evaluate(async id=>{const path='/src/content/bosses/arlong.ts',{ARLONG_ATTACKS}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;
   b.cancel();b.body.x=1728;b.body.y=1216;b.body.hp=b.body.maxHp*.2;r.player.x=1536;r.player.y=1216;r.player.hurtTimer=1e6;b.prepare(ARLONG_ATTACKS.find((a:{id:string})=>a.id===id)!,r.player,r.world);
   if(id==='dive')for(let i=0;i<1600&&!b.telegraph;i++)b.tick(.01,r.player,r.world,()=>({x:0,y:0}),()=>{});
   if(!b.telegraph)throw Error('Falta aviso '+id);b.elapsed=b.telegraph.attack.preparation-.15;b.telegraph.elapsed=b.elapsed;r.player.hurtTimer=0;q.draw();q.tick();
  },id);await page.screenshot({path:info.outputPath(`arlong-${id}-warning.png`)});
  await page.evaluate(async()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.player.hurtTimer=1e6;for(let i=0;i<30;i++)r.encounter!.tick(.01,r.player,r.world,()=>({x:0,y:0}),()=>{});
   const path='/src/game/systems/effects.ts',{tickEffects}=await import(/* @vite-ignore */path);tickEffects(r,r.players,r.grid,r.world,.2,()=>{},()=>.5);r.player.hurtTimer=0;q.draw();q.tick();});
  await page.screenshot({path:info.outputPath(`arlong-${id}-impact.png`)});
 }
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,b=r.encounter!;b.cancel();b.state='approach';b.body.x=r.player.x+35;b.body.y=r.player.y;b.body.hp=1;r.player.attacks[0].cooldown=0;r.player.hurtTimer=10;
  for(let i=0;i<100&&r.status==='playing';i++)Object.getPrototypeOf(r).update.call(r,1/60,{x:0,y:0});q.draw();q.tick();});
 await expect(page.locator('#combinations')).toBeVisible();await expect(page.locator('#combination-message')).toContainText('Arlong');await page.locator('#combination-done').click();await expect(page.locator('#navigation-hint')).toContainText('ROGER');
 expect(await page.evaluate(()=>{const r=window.__OPS_QA__!.getRun()!;return {won:r.arlongDefeated,unlocked:r.rogerUnlocked,travel:!!r.exitSignal,zone:r.zone,projectiles:r.projectiles.count};})).toEqual({won:true,unlocked:true,travel:true,zone:'arlong-arena',projectiles:0});await page.screenshot({path:info.outputPath('arlong-victory-roger-pending.png')});await page.locator('#pause').click();await expect(page.locator('#paused')).toBeVisible();expect(errors).toEqual([]);
});

test('Roger final: viaje voluntario, seis acciones, cinco invocados, marcador y récords',async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.locator('#start').click();const zoom=await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom);
 await page.evaluate(async()=>{const path='/src/game/bosses/arlong.ts',{ArlongEncounter}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!;
  const worldPath='/src/game/world/arlong-arena.ts',{ArlongArenaWorld}=await import(/* @vite-ignore */worldPath);r.world=new ArlongArenaWorld(42);r.player.x=1536;r.player.y=1216;r.zone='arlong-arena';r.arlongDefeated=true;r.rogerUnlocked=true;r.encounter=new ArlongEncounter();r.encounter.defeated();r.encounter.elapsed=2;r.exitSignal={x:r.player.x+180,y:r.player.y};r.player.level=45;r.player.xp=9;r.player.collectedBerries=456;r.player.hp=74;r.update=()=>{};q.draw();q.tick();});
 expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.finalChallenge)).toBeUndefined();
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.update=Object.getPrototypeOf(r).update;Object.assign(r.player,r.exitSignal);r.update(1/60,{x:0,y:0});q.tick();});
 await expect(page.locator('#voyage-title')).toContainText('GOL D. ROGER');
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,{x:0,y:0});r.update=()=>{};r.player.hurtTimer=1000;for(let i=0;i<30;i++)q.draw(33);q.tick();});
 await expect(page.locator('#roger-score')).toBeVisible();await expect(page.locator('#boss-panel')).toBeHidden();expect(await page.evaluate(()=>window.__OPS_QA__!.metrics().cameraZoom)).toBe(zoom);
 expect(await page.evaluate(()=>{const r=window.__OPS_QA__!.getRun()!;return [r.zone,r.player.level,r.player.xp,r.player.collectedBerries,r.visibleChests.length];})).toEqual(['roger-arena',45,9,456,0]);await page.screenshot({path:info.outputPath('roger-arena.png')});
 for(const id of ['king','kamusari','haki','storm','will']){
  await page.evaluate(async id=>{const path='/src/content/bosses/roger.ts',{ROGER_ATTACKS}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!,b=r.finalChallenge!.roger;
   b.cancel();b.seconds=240;b.body.x=r.player.x+190;b.body.y=r.player.y;b.prepare(ROGER_ATTACKS.find((a:{id:string})=>a.id===id)!,r.player,r.world);if(id==='king')for(let i=0;i<8&&b.attackId!=='king';i++)b.prepare(ROGER_ATTACKS[0],r.player,r.world);q.draw();q.tick();},id);
  await page.screenshot({path:info.outputPath(`roger-${id}-warning.png`)});
  await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,b=r.finalChallenge!.roger;for(let i=0;i<260&&b.state==='preparing';i++)b.tick(.01,r.player,r.world,()=>({x:0,y:0}),()=>{});for(let i=0;i<25;i++)b.tick(.01,r.player,r.world,()=>({x:0,y:0}),()=>{});q.draw();q.tick();});await page.screenshot({path:info.outputPath(`roger-${id}-impact.png`)});
 }
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!,f=r.finalChallenge!;f.seconds=479.98;f.nextSummon=480;for(let i=0;i<2;i++)Object.getPrototypeOf(r).update.call(r,1/60,{x:0,y:0});
  for(const [i,s]of f.summons.entries()){s.boss.body.x=r.player.x+(i-2)*135;s.boss.body.y=r.player.y-90;}q.draw();q.tick();});
 expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.finalChallenge!.living)).toBe(5);await page.screenshot({path:info.outputPath('roger-summon-silhouettes.png')});
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;for(let i=0;i<125;i++)Object.getPrototypeOf(r).update.call(r,1/60,{x:0,y:0});q.draw();q.tick();});await page.screenshot({path:info.outputPath('roger-five-bosses.png')});
 await page.evaluate(async()=>{const path='/src/game/systems/hits.ts',{damageEnemy}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!,f=r.finalChallenge!;
  r.player.stats.critChance=0;f.roger.body.statuses=undefined;damageEnemy(r.player,f.roger.body,12345,0,r.player,r.world,()=>{throw Error('Roger murió');},()=>1);const s=f.summons[0];s.boss.body.hp=1;damageEnemy(r.player,s.boss.body,100,0,r.player,r.world,e=>Object.getPrototypeOf(r).dropXp.call(r,e,r.player.id),()=>1);q.draw();q.tick();});
 await expect(page.locator('#roger-score')).toContainText('12.345');expect(await page.evaluate(()=>{const f=window.__OPS_QA__!.getRun()!.finalChallenge!;return [f.roger.body.hp,f.roger.body.active,f.bossesDefeated];})).toEqual([1,true,1]);
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.player.hp=0;Object.getPrototypeOf(r).update.call(r,1/60,{x:0,y:0});q.draw();q.tick();});
 await expect(page.locator('#result-title')).toContainText('EL REY DE LOS PIRATAS');await expect(page.locator('#roger-results')).toContainText('12.345');await page.screenshot({path:info.outputPath('roger-results-records.png')});
 const titleBox=await page.locator('#result-title').boundingBox();expect(titleBox?.y).toBeGreaterThanOrEqual(0);
 expect(await page.evaluate(()=>window.__OPS_QA__!.store.progress.rogerRecords?.global.damage)).toBe(12345);await page.reload();await expect(page.locator('#loading')).toBeHidden();expect(await page.evaluate(()=>window.__OPS_QA__!.store.progress.rogerRecords?.characters.luffy.damage)).toBe(12345);expect(errors).toEqual([]);
});

test('selección de habilidad responde a un solo toque y al inicio del contacto',async({page,isMobile})=>{
 await page.locator('#start').click();
 await page.evaluate(async()=>{const path='/src/game/systems/loadout.ts',{improveAttack}=await import(/* @vite-ignore */path),q=window.__OPS_QA__!,r=q.getRun()!;improveAttack(r.player,'gatling');r.update=()=>{};q.tick();});
 for(let i=0;i<12;i++){
  const target=i%2?0:1,slot=page.locator(`button[data-slot="${target}"]`);
  if(isMobile)await slot.tap();else await slot.click();
  expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.player.selectedSlot)).toBe(target);
 }
 await page.locator('button[data-slot="1"]').dispatchEvent('pointerdown',{pointerType:'touch',pointerId:17,button:0,bubbles:true});
 expect(await page.evaluate(()=>window.__OPS_QA__!.getRun()!.player.selectedSlot)).toBe(1);
});

test('Beta test público: Kuro con tres ataques enlazados y progreso protegido',async({page},info)=>{
 const before=await page.evaluate(()=>window.__OPS_QA__!.store.progress.coins);
 await page.locator('#beta-test').click();await page.selectOption('#beta-destination','kuro');await expect(page.locator('#beta-level')).toHaveValue('35');await page.locator('#beta-enter').click();await expect(page.locator('#boss-name')).toHaveText('CAPITÀ KURO');
 expect(await page.evaluate(()=>{const r=window.__OPS_QA__!.getRun()!;return [r.practice,r.player.level,r.player.abilitySlots[0].length];})).toEqual([true,35,3]);
 await page.evaluate(()=>{const q=window.__OPS_QA__!,r=q.getRun()!;r.player.collectedBerries=999;r.morganDefeated=true;r.buggyDefeated=true;q.tick();});expect(await page.evaluate(()=>window.__OPS_QA__!.store.progress.coins)).toBe(before);
 await page.screenshot({path:info.outputPath('beta-kuro-three-linked.png')});await page.locator('#pause').click();await page.locator('#abandon').click();expect(await page.evaluate(()=>window.__OPS_QA__!.store.progress.coins)).toBe(before);
});
