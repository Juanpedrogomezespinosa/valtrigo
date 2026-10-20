import { expect, test } from './fixtures';
import {
  answerSleep,
  at,
  currentGameState,
  expectClockAt,
  isSleeping,
  NEXT_TO_BED,
  savedGame,
  setSavedGame,
  startAtWith,
  openGame,
  press,
  waitForMorning,
  waitForScene,
  waitForZone,
} from './helpers';

// HU-24. Dormir para avanzar de día

test('Escenario 1: Dormir por la noche', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 3, minutes: at(21), energy: 60 });

  await answerSleep(page, 'Sí');

  // La pantalla se funde a negro...
  await expect.poll(() => isSleeping(page), { intervals: [25] }).toBe(true);
  const fade = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const effect = game.scene.getScene('GameScene').cameras.main.fadeEffect;
    return { running: effect.isRunning, towardsBlack: effect.direction };
  });
  expect(fade).toEqual({ running: true, towardsBlack: true });

  // ...y empieza el día siguiente a las 06:00 con la energía a 100.
  await waitForMorning(page, 4);
  const state = await currentGameState(page);
  expectClockAt(state?.minutes, at(6));
  expect(state?.energy).toBe(100);
});

test('Escenario 2: Cancelar', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 3, minutes: at(21), energy: 60 });

  await answerSleep(page, 'No');
  await page.waitForTimeout(700); // más que el fundido: no debe ocurrir nada

  const state = await currentGameState(page);
  expect(state?.day).toBe(3);
  expectClockAt(state?.minutes, at(21));
  expect(state?.energy).toBe(60);
  expect(await isSleeping(page)).toBe(false);
});

test('Escenario 3: Dormirse a medianoche', async ({ page }) => {
  // Partida guardada con 250 monedas. Durante el día se gana dinero sin guardar.
  await setSavedGame(page, savedGame({ zone: 'plaza', position: { x: 20, y: 17 }, day: 3, minutes: at(23, 59), money: 250, energy: 40 }));
  await openGame(page);
  await press(page, 'ArrowDown'); // "Continuar"
  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');
  await page.evaluate(() => {
    (window as unknown as { gameState: () => { money: number } }).gameState().money = 999;
  });

  // Al llegar a las 00:00 se duerme solo y empieza el día siguiente a las 06:00, en su casa.
  await waitForZone(page, 'casa');
  await waitForMorning(page, 4);
  const state = await currentGameState(page);
  expectClockAt(state?.minutes, at(6));
  expect(state?.position).toEqual(NEXT_TO_BED);
  expect(state?.energy).toBe(100);
  // El progreso no guardado del día se pierde.
  expect(state?.money).toBe(250);
});

test('Escenario 4: Energía baja', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 3, minutes: at(15), energy: 20 });

  await answerSleep(page, 'Sí');

  await waitForMorning(page, 4);
  expect((await currentGameState(page))?.energy).toBe(100);
});
