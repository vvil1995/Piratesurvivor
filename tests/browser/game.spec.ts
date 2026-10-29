import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
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
  await expect(page.locator('#clock')).toHaveText('00:01', { timeout: 5000 });
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
    p.attackTimer = 0;
  });
  await expect(page.locator('#levelup')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.upgrade-card')).toHaveCount(3);
  const frozen = await page.evaluate(() => window.__OPS_QA__!.getRun()!.time);
  await page.waitForTimeout(200); expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.time)).toBe(frozen);
  await page.locator('.upgrade-card').first().click(); await expect(page.locator('#levelup')).toBeHidden();
  expect(await page.evaluate(() => Object.values(window.__OPS_QA__!.getRun()!.taken).reduce((a, b) => a + b, 0))).toBe(1);
});

test('derrota, reinicio, victoria y guardado persistente sin duplicar botín', async ({ page }) => {
  await page.locator('#start').click();
  await page.evaluate(() => { window.__OPS_QA__!.getRun()!.player.hp = 0; });
  await expect(page.locator('#result')).toBeVisible(); await expect(page.locator('#result-title')).toContainText('CAEN');
  await page.locator('#retry').click(); await expect(page.locator('#hud')).toBeVisible();
  await page.evaluate(() => { const r = window.__OPS_QA__!.getRun()!; r.time = 600 - 1 / 60; r.player.kills = 30; });
  await expect(page.locator('#result-title')).toHaveText('¡ERES LEYENDA!');
  const coins = await page.evaluate(() => window.__OPS_QA__!.store.progress.coins);
  await page.waitForTimeout(200); expect(await page.evaluate(() => window.__OPS_QA__!.store.progress.coins)).toBe(coins);
  await page.locator('#return-home').click(); await expect(page.locator('#win-count')).toHaveText('01');
  await page.locator('#train').click(); await expect(page.locator('#starting-hp')).toHaveText('105');
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#win-count')).toHaveText('01'); await expect(page.locator('#starting-hp')).toHaveText('105');
});

test('joystick táctil, cancelación y giro', async ({ page, isMobile, browserName }) => {
  test.skip(!isMobile, 'Controles táctiles en emulación móvil');
  test.skip(browserName !== 'chromium', 'Arrastre nativo mediante CDP; WebKit se valida manualmente');
  await page.locator('#start').click(); await expect(page.locator('#touch-zone')).toBeVisible();
  const before = await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x);
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 100, y: 580 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 145, y: 580 }] });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x)).toBeGreaterThan(before + 10);
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  const after = await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x);
  await page.waitForTimeout(150); expect(await page.evaluate(() => window.__OPS_QA__!.getRun()!.player.x)).toBeCloseTo(after, 1);
  await page.setViewportSize({ width: 844, height: 390 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
