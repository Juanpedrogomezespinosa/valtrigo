import { expect, test } from './fixtures';
import {
  at,
  currentGameState,
  fairView,
  isChangingZone,
  sceneTexts,
  startAtWith,
  startNextTo,
  talkUntilChoiceOrEnd,
  waitForZone,
} from './helpers';

// HU-58. La feria
// Se entra en la plaza saliendo de la tienda (puerta en la casilla 6, 8, caminando hacia abajo).

async function enterPlaza(page: import('@playwright/test').Page, day: number): Promise<void> {
  await startAtWith(page, 'tienda', { x: 6, y: 6 }, { day, minutes: at(10) });
  await page.keyboard.down('ArrowDown');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowDown');
  await waitForZone(page, 'plaza');
}

test('Escenario 1: Día de feria', async ({ page }) => {
  await enterPlaza(page, 7);

  expect(await fairView(page)).toEqual({ harvestStall: true, fishingStall: true, garland: true });
});

test('Escenario 2: Antes de la feria', async ({ page }) => {
  await enterPlaza(page, 6);

  expect(await fairView(page)).toEqual({ harvestStall: false, fishingStall: false, garland: false });
});

test('Escenario 3: Después de la feria', async ({ page }) => {
  await enterPlaza(page, 8);

  expect(await fairView(page)).toEqual({ harvestStall: false, fishingStall: false, garland: false });
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
