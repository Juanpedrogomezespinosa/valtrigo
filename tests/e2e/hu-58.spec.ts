import { expect, test } from './fixtures';
import dialogues from '../../src/data/dialogues.json' with { type: 'json' };
import {
  answerSleep,
  at,
  closeDaySummary,
  currentGameState,
  expectClockAt,
  fairView,
  isChangingZone,
  NEXT_TO_BED,
  sceneTexts,
  startAtWith,
  startNextTo,
  talkUntilChoiceOrEnd,
  VISITORS,
  waitForHudText,
  waitForMorning,
  waitForZone,
} from './helpers';

// HU-58. La feria
// Se entra en la plaza saliendo de la tienda (puerta en la casilla 6, 8, caminando hacia abajo).

const NOTHING = { harvestStall: false, fishingStall: false, garland: false, stage: false, podium: false, visitors: [] };

async function enterPlaza(page: import('@playwright/test').Page, day: number): Promise<void> {
  await startAtWith(page, 'tienda', { x: 6, y: 6 }, { day, minutes: at(13) });
  await page.keyboard.down('ArrowDown');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowDown');
  await waitForZone(page, 'plaza');
}

test('Escenario 1: Día de feria', async ({ page }) => {
  await enterPlaza(page, 7);

  expect(await fairView(page)).toEqual({
    harvestStall: true,
    fishingStall: true,
    garland: true,
    stage: true,
    podium: true,
    visitors: VISITORS,
  });
});

test('Escenario 2: Antes de la feria', async ({ page }) => {
  await enterPlaza(page, 6);

  expect(await fairView(page)).toEqual(NOTHING);
});

test('Escenario 3: Después de la feria', async ({ page }) => {
  await enterPlaza(page, 8);

  expect(await fairView(page)).toEqual(NOTHING);
});

test('Escenario 4: Encargo final después de la feria', async ({ page }) => {
  await startNextTo(page, 'alcalde', {
    day: 8,
    minutes: at(10),
    completedQuests: ['encargo-1', 'encargo-2', 'encargo-3', 'encargo-4', 'encargo-5'],
    activeQuests: ['encargo-6'],
  });

  await talkUntilChoiceOrEnd(page); // hasta que el alcalde termina de hablar

  expect(await sceneTexts(page, 'HudScene')).toContain('Encargo completado');
  const state = await currentGameState(page);
  expect(state?.completedQuests).toContain('encargo-6');
  expect(state?.activeQuests).toEqual([]);
});

test('Escenario 5: Despertar el día de la feria', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 6, minutes: at(21) });

  await answerSleep(page, 'Sí');
  await closeDaySummary(page);

  await waitForMorning(page, 7);
  expectClockAt((await currentGameState(page))?.minutes, at(12));
});

test('Escenario 6: Hablar con un visitante', async ({ page }) => {
  // Rosa pasea junto al puesto de pesca, en la casilla (21, 15).
  await startAtWith(page, 'plaza', { x: 21, y: 16 }, { day: 7, minutes: at(13) });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(dialogues.npcs.rosa.greeting);
});

test('Escenario 7: Fin de los concursos', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 17 }, { day: 7, minutes: at(16, 59) });

  await waitForHudText(page, 'Los concursos han terminado. Ceremonia a las 18:00 en la plaza', 5000);
  expectClockAt((await currentGameState(page))?.minutes, at(17));
});
