import { expect, test } from './fixtures';
import {
  at,
  catchFish,
  currentGameState,
  FISHING_SPOT,
  isFishing,
  press,
  ROD,
  sceneTexts,
  setRandom,
  startAtWith,
  waitForHudText,
} from './helpers';

// HU-48. Pescar en el lago
// Con setRandom([0]), "¡Pica!" aparece a los 2 segundos de lanzar la caña.

test('Escenario 1: Pescar a tiempo', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), energy: 50, inventory: [ROD] });
  await setRandom(page, [0]);

  await catchFish(page);

  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([ROD, { item: 'carpa', quantity: 1 }]);
  expect(state?.energy).toBe(44);
  expect(await isFishing(page)).toBe(false);
});

test('Escenario 2: Demasiado tarde', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), inventory: [ROD] });
  await setRandom(page, [0]);
  await press(page, 'e');
  await waitForHudText(page, '¡Pica!');

  // No pulsa E.
  await waitForHudText(page, 'Se ha escapado', 2000);

  expect((await currentGameState(page))?.inventory).toEqual([ROD]);
  expect(await isFishing(page)).toBe(false);
});

test('Escenario 3: Demasiado pronto', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), inventory: [ROD] });
  await setRandom(page, [0]);
  await press(page, 'e');
  expect(await isFishing(page)).toBe(true);

  await press(page, 'e'); // antes de los 2 segundos

  expect(await sceneTexts(page, 'HudScene')).toContain('Has tirado demasiado pronto');
  expect(await sceneTexts(page, 'HudScene')).not.toContain('¡Pica!');
  expect((await currentGameState(page))?.inventory).toEqual([ROD]);
  expect(await isFishing(page)).toBe(false);
});

test('Escenario 4: Recoger la caña', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), energy: 50, inventory: [ROD] });
  await setRandom(page, [0]);
  await press(page, 'e');
  expect(await isFishing(page)).toBe(true);

  await press(page, 'ArrowUp');

  expect(await isFishing(page)).toBe(false);
  await page.waitForTimeout(2500); // pasado el momento en que habría picado, no pasa nada
  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([ROD]);
  expect(state?.energy).toBe(44); // la energía gastada no se devuelve
  expect(await sceneTexts(page, 'HudScene')).not.toContain('¡Pica!');
});

test('Escenario 5: Sin caña', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), energy: 50, inventory: [] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Necesitas una Caña de pescar');
  expect(await isFishing(page)).toBe(false);
  expect((await currentGameState(page))?.energy).toBe(50);
});
