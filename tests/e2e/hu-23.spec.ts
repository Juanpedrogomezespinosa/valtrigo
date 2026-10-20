import { expect, test } from './fixtures';
import { at, currentGameState, hudClock, hudEnergy, hudMoney, screenDarkness, startWith } from './helpers';

// HU-23. Ciclo día y noche
// El reloj avanza 1 minuto de juego por segundo real.

test('Escenario 1: Atardecer', async ({ page }) => {
  // A las 20:30 (30 minutos después de las 20:00) la pantalla está a mitad del oscurecimiento.
  await startWith(page, { minutes: at(20, 30) });

  const minutes = (await currentGameState(page))!.minutes;
  const darkness = await screenDarkness(page);
  expect(darkness).toBeCloseTo((minutes - at(20)) / 60, 1);
  expect(darkness).toBeGreaterThanOrEqual(0.5);
  expect(darkness).toBeLessThan(0.55);
});

test('Escenario 2: Antes del atardecer', async ({ page }) => {
  await startWith(page, { minutes: at(19, 59) });

  expect(['19:59', '20:00']).toContain((await hudClock(page))?.time);
  // A las 19:59 la luz es normal (a las 20:00 justas empieza a oscurecer: 0).
  expect(await screenDarkness(page)).toBe(0);
});

test('Escenario 3: Interfaz en la oscuridad', async ({ page }) => {
  await startWith(page, { minutes: at(23) });
  expect(await screenDarkness(page)).toBe(1);

  // La interfaz está por encima de la capa de noche y sus textos siguen visibles.
  const order = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return { night: game.scene.getIndex('NightScene'), hud: game.scene.getIndex('HudScene') };
  });
  expect(order.hud).toBeGreaterThan(order.night);
  const clock = await hudClock(page);
  expect(clock?.day).toMatch(/^Día \d+$/);
  expect(clock?.time).toMatch(/^\d\d:\d\d$/);
  expect((await hudMoney(page))?.visible).toBe(true);
  expect(await hudEnergy(page)).toMatch(/^Energía: \d+\/100$/);
});

test('Escenario 4: Amanecer', async ({ page }) => {
  test.setTimeout(90_000);
  await startWith(page, { minutes: at(6) });
  expect(await screenDarkness(page)).toBeGreaterThan(0.95);

  // Al pasar 1 hora de juego (60 segundos reales), la luz es normal.
  await page.waitForTimeout(61_000);

  expect((await currentGameState(page))!.minutes).toBeGreaterThanOrEqual(at(7));
  expect(await screenDarkness(page)).toBe(0);
});
