import { expect, test } from './fixtures';
import { at, currentGameState, placePlayer, playedEffects, press, recordEffects, sceneTexts, startAtWith, waitForHudText } from './helpers';

// HU-78. Las campanas de la torre
// Campanas: grande (1, 2), pequeña (3, 2) y mediana (7, 3). El jugador las toca desde (1, 3), (3, 3) y (7, 4).

type Page = import('@playwright/test').Page;

// El personaje se coloca junto a cada campana con placePlayer: el test comprueba el orden, no el movimiento.
async function toLarge(page: Page): Promise<void> {
  await placePlayer(page, { x: 1, y: 3 });
}
async function toSmall(page: Page): Promise<void> {
  await placePlayer(page, { x: 3, y: 3 });
}
async function toMedium(page: Page): Promise<void> {
  await placePlayer(page, { x: 7, y: 4 });
}

test('Escenario 1: Tocar una campana', async ({ page }) => {
  await startAtWith(page, 'torre', { x: 1, y: 3 }, { day: 5, minutes: at(10) });
  await recordEffects(page);

  await press(page, 'e');

  expect(await playedEffects(page)).toContain('sfx-campana-grande');
});

test('Escenario 2: Orden correcto', async ({ page }) => {
  await startAtWith(page, 'torre', { x: 1, y: 3 }, { day: 5, minutes: at(10), money: 100 });

  await press(page, 'e'); // grande
  await toSmall(page);
  await press(page, 'e'); // pequeña
  await toMedium(page);
  await press(page, 'e'); // mediana

  await waitForHudText(page, 'Suena la melodía de la relojera');
  const state = await currentGameState(page);
  expect(state?.money).toBe(180);
  expect(state?.solvedPuzzles).toEqual(['campanas']);
});

test('Escenario 3: Orden incorrecto', async ({ page }) => {
  // Mediana, grande y pequeña.
  await startAtWith(page, 'torre', { x: 7, y: 4 }, { day: 5, minutes: at(10), money: 100 });

  await press(page, 'e'); // mediana
  await toLarge(page);
  await press(page, 'e'); // grande
  await toSmall(page);
  await press(page, 'e'); // pequeña

  await waitForHudText(page, 'Las campanas desafinan');
  expect((await currentGameState(page))?.money).toBe(100);
});

test('Escenario 4: Una sola vez', async ({ page }) => {
  await startAtWith(page, 'torre', { x: 1, y: 3 }, { day: 5, minutes: at(10), money: 100, solvedPuzzles: ['campanas'] });

  await press(page, 'e');
  await toSmall(page);
  await press(page, 'e');
  await toMedium(page);
  await press(page, 'e');
  await page.waitForTimeout(300);

  const texts = await sceneTexts(page, 'HudScene');
  expect(texts).not.toContain('Suena la melodía de la relojera');
  expect(texts).not.toContain('Las campanas desafinan');
  expect((await currentGameState(page))?.money).toBe(100);
});
