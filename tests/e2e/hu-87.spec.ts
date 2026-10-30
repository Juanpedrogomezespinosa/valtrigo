import { expect, test } from './fixtures';
import {
  at,
  catchFish,
  currentGameState,
  FISHING_SPOT,
  fishingState,
  isFishing,
  playedEffects,
  playFishingGame,
  press,
  recordEffects,
  ROD,
  sceneTexts,
  setRandom,
  startAtWith,
  waitForHudText,
  waitForScene,
} from './helpers';

// HU-87. Minijuego de pesca
// A las 15:00 pica una Carpa, que sube y baja despacio desde el centro de la barra. Con setRandom([0]), "¡Pica!"
// aparece al segundo de lanzar la caña.

async function startMinigame(page: import('@playwright/test').Page): Promise<void> {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), energy: 50, inventory: [ROD] });
  await setRandom(page, [0]);
  await press(page, 'e');
  await waitForHudText(page, '¡Pica!');
  await press(page, 'e');
}

test('Escenario 1: Empieza el minijuego', async ({ page }) => {
  await startMinigame(page);

  await waitForScene(page, 'FishingScene');
  const state = (await fishingState(page))!;
  expect(state.phase).toBe('fighting');
  const game = state.game!;
  expect(game.item).toBe('carpa');
  expect(game.zoneSize).toBe(28);
  // La Carpa empieza en el centro (50) y la zona, centrada en ella (de 36 a 64), con el medidor a un 30 %. Cuando
  // el test lo lee ya han pasado unos fotogramas sin pulsar E: la zona ha bajado a 120 por segundo y el medidor ha
  // subido a 25 % por segundo mientras el pez estaba dentro. La E que empieza el minijuego puede seguir pulsada uno o
  // dos fotogramas, en los que la zona sube en vez de bajar: se admiten 10 de diferencia.
  expect(Math.abs(game.zoneBottom - Math.max(0, 36 - 120 * game.seconds))).toBeLessThanOrEqual(10);
  expect(game.progress).toBeGreaterThanOrEqual(30 - 15 * game.seconds - 0.01);
  expect(game.progress).toBeLessThanOrEqual(30 + 25 * game.seconds + 0.01);
  expect(await sceneTexts(page, 'FishingScene')).toContain('Mantén E');
});

test('Escenario 2: Subir y bajar la zona', async ({ page }) => {
  await startMinigame(page);
  const start = (await fishingState(page))!.game!.zoneBottom;

  await page.keyboard.down('e');
  await page.waitForTimeout(200);
  const raised = (await fishingState(page))!.game!.zoneBottom;
  await page.keyboard.up('e');
  await page.waitForTimeout(200);
  const lowered = (await fishingState(page))!.game!.zoneBottom;

  expect(raised).toBeGreaterThan(start);
  expect(lowered).toBeLessThan(raised);
});

test('Escenario 3: Pescar el pez', async ({ page }) => {
  await startMinigame(page);

  await playFishingGame(page);

  await waitForHudText(page, 'Has pescado una Carpa de 20 cm');
  expect((await currentGameState(page))?.inventory).toEqual([ROD, { item: 'carpa', quantity: 1 }]);
  expect(await isFishing(page)).toBe(false);
});

test('Escenario 4: Se escapa', async ({ page }) => {
  await startMinigame(page);

  // No pulsa nada: la zona cae al fondo y la Carpa sube, así que el medidor se vacía.
  await waitForHudText(page, 'Se ha escapado', 8000);

  expect((await currentGameState(page))?.inventory).toEqual([ROD]);
  expect(await isFishing(page)).toBe(false);
});

test('Escenario 5: Pausa', async ({ page }) => {
  await startMinigame(page);

  await press(page, 'Escape');
  await waitForScene(page, 'PauseScene');
  const paused = (await fishingState(page))!.game!;
  await page.waitForTimeout(1000);
  const stillPaused = (await fishingState(page))!.game!;
  expect(stillPaused.progress).toBe(paused.progress);
  expect(stillPaused.seconds).toBe(paused.seconds);

  await press(page, 'Escape'); // reanuda
  await page.waitForTimeout(300);
  expect((await fishingState(page))?.game?.seconds).toBeGreaterThan(paused.seconds);
});

test('Escenario 6: Sonidos', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), energy: 50, inventory: [ROD] });
  await setRandom(page, [0]);
  await recordEffects(page);

  await catchFish(page);

  const effects = await playedEffects(page);
  for (const effect of ['sfx-pesca-lanzar', 'sfx-pesca-pica', 'sfx-pesca-carrete', 'sfx-pesca-captura']) {
    expect(effects).toContain(effect);
  }
});
