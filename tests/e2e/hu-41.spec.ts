import { expect, test } from './fixtures';
import { at, currentGameState, FRONT_OF_PLOT, moveTo, plotState, plotView, press, sceneTexts, sleepUntil, startAtWith } from './helpers';

// HU-41. Cavar parcelas con la Pala
// Huerto de 6×4 en la granja (casillas 17 a 22, filas 4 a 7). Ver FRONT_OF_PLOT en helpers.ts.

const PALA = { item: 'pala', quantity: 1 };

test('Escenario 1: Cavar', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 100, inventory: [PALA] });

  await press(page, 'e');

  expect((await plotState(page)).dug).toBe(true);
  expect((await plotView(page))?.soilVisible).toBe(true);
  expect((await currentGameState(page))?.energy).toBe(96);
});

test('Escenario 2: Sin Pala', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 100, inventory: [] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Necesitas una Pala');
  expect((await plotState(page)).dug).toBe(false);
  expect((await plotView(page))?.soilVisible).toBe(false);
  expect((await currentGameState(page))?.energy).toBe(100);
});

test('Escenario 3: Fuera del huerto', async ({ page }) => {
  // En (25, 3), mirando hacia abajo: delante hay tierra, pero no es del huerto.
  await startAtWith(page, 'granja', { x: 25, y: 3 }, { minutes: at(10), energy: 100, inventory: [PALA] });

  await press(page, 'e');

  const state = await currentGameState(page);
  expect(state?.plots).toEqual({});
  expect(state?.energy).toBe(100);
  expect(await sceneTexts(page, 'HudScene')).not.toContain('Necesitas una Pala');
});

test('Escenario 4: Al día siguiente', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { day: 2, minutes: at(10), inventory: [PALA] });
  await press(page, 'e');
  expect((await plotState(page)).dug).toBe(true);

  await sleepUntil(page, 3);
  await moveTo(page, 'granja', FRONT_OF_PLOT);

  expect((await plotState(page)).dug).toBe(true);
  expect((await plotView(page))?.soilVisible).toBe(true);
});
