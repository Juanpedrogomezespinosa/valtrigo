import { expect, test } from './fixtures';
import { at, currentGameState, hudClock, openPause, startNewGame, startWith, waitForZone } from './helpers';

// HU-22. Ver el día y la hora
// Estos tests esperan tiempo real: la hora avanza 1 minuto de juego por segundo real.

test('Escenario 1: Hora inicial', async ({ page }) => {
  await startNewGame(page);

  const clock = await hudClock(page);
  expect(clock?.day).toBe('Día 1');
  expect(['06:00', '06:01']).toContain(clock?.time);
  // Esquina superior izquierda.
  const position = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const bounds = (game.scene.getScene('HudScene').children.getByName('dia') as import('phaser').GameObjects.Text).getBounds();
    return { x: bounds.left, y: bounds.top };
  });
  expect(position.x).toBeLessThan(960 * 0.1);
  expect(position.y).toBeLessThan(540 * 0.1);
});

test('Escenario 2: Avance del tiempo', async ({ page }) => {
  test.setTimeout(90_000);
  await startNewGame(page);
  const start = (await currentGameState(page))!.minutes;
  expect(start - at(6)).toBeLessThanOrEqual(1);

  await page.waitForTimeout(60_000);

  // 60 segundos reales después de las 06:00 son las 07:00 (con 1 minuto de margen por la carga).
  const minutes = (await currentGameState(page))!.minutes;
  expect(minutes - start).toBeGreaterThanOrEqual(59);
  expect(minutes - start).toBeLessThanOrEqual(61);
  expect(['06:59', '07:00', '07:01']).toContain((await hudClock(page))?.time);
});

test('Escenario 3: Pausa', async ({ page }) => {
  test.setTimeout(60_000);
  await startWith(page, { minutes: at(10) });
  await openPause(page);
  const paused = await hudClock(page);
  expect(['10:00', '10:01']).toContain(paused?.time);

  await page.waitForTimeout(30_000);

  expect(await hudClock(page)).toEqual(paused);
});

test('Escenario 4: Medianoche', async ({ page }) => {
  await startWith(page, { day: 3, minutes: at(23, 59) });

  // Pasa 1 segundo: el personaje se duerme y empieza el día siguiente a las 06:00.
  await waitForZone(page, 'casa');
  const state = await currentGameState(page);
  expect(state?.day).toBe(4);
  expect(state!.minutes - at(6)).toBeLessThanOrEqual(1);
  expect((await hudClock(page))?.day).toBe('Día 4');
});
