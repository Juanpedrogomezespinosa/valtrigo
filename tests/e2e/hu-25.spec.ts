import { expect, test } from './fixtures';
import {
  answerSleep,
  at,
  currentGameState,
  expectSameGame,
  NEXT_TO_BED,
  readSavedGame,
  savedGame,
  sceneTexts,
  startAtWith,
  waitForMorning,
} from './helpers';

// HU-25. Guardado automático
// Decisión del autor: al dormir se guarda la partida tal como está al acostarse.

test('Escenario 1: Guardado al dormir', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 3, minutes: at(21), money: 180 });
  const beforeSleeping = await currentGameState(page);

  await answerSleep(page, 'Sí');

  expect(await sceneTexts(page, 'HudScene')).toContain('Partida guardada');
  expectSameGame(await readSavedGame(page), beforeSleeping);
  await waitForMorning(page, 4);
});

test('Escenario 2: Sin guardado a medianoche', async ({ page }) => {
  const saved = savedGame({ zone: 'casa', position: NEXT_TO_BED, day: 3, minutes: at(23, 59) });
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 3, minutes: at(23, 59) });

  await waitForMorning(page, 4);

  expect(await readSavedGame(page)).toEqual(saved);
  expect(await sceneTexts(page, 'HudScene')).not.toContain('Partida guardada');
});

test('Escenario 3: Sobrescritura', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 2, minutes: at(21) });
  // La partida avanza hasta el día 4 sin guardar.
  await page.evaluate(() => {
    (window as unknown as { gameState: () => { day: number } }).gameState().day = 4;
  });

  await answerSleep(page, 'Sí');

  expect((await readSavedGame(page))?.day).toBe(4);
  await waitForMorning(page, 5);
});
