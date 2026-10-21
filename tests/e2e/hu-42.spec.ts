import { expect, test } from './fixtures';
import { at, currentGameState, DUG, FRONT_OF_PLOT, PLOT, plotState, plotView, press, sceneTexts, seedMenu, startAtWith } from './helpers';

// HU-42. Sembrar semillas

test('Escenario 1: Sembrar', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, {
    minutes: at(10),
    energy: 50,
    inventory: [{ item: 'semilla', quantity: 3 }],
    plots: { [PLOT]: DUG },
  });

  await press(page, 'e');
  expect((await seedMenu(page))?.options).toEqual(['Semilla']);
  await press(page, 'Enter');

  expect(await seedMenu(page)).toBeNull();
  expect(await plotState(page)).toEqual({ dug: true, seed: 'semilla', grown: 0, watered: false });
  expect((await plotView(page))?.cropFrame).not.toBeNull();
  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([{ item: 'semilla', quantity: 2 }]);
  expect(state?.energy).toBe(49);
});

test('Escenario 2: Elegir entre varias semillas', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, {
    minutes: at(10),
    inventory: [
      { item: 'semilla-de-calabaza', quantity: 1 },
      { item: 'semilla', quantity: 2 },
    ],
    plots: { [PLOT]: DUG },
  });

  await press(page, 'e');

  expect((await seedMenu(page))?.options).toEqual(['Semilla', 'Semilla de calabaza']);
  // Se puede elegir la segunda.
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  expect((await plotState(page)).seed).toBe('semilla-de-calabaza');
});

test('Escenario 3: Sin semillas', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 50, inventory: [], plots: { [PLOT]: DUG } });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('No tienes semillas');
  expect(await seedMenu(page)).toBeNull();
  expect(await plotState(page)).toEqual(DUG);
  expect((await currentGameState(page))?.energy).toBe(50);
});

test('Escenario 4: Parcela sin cavar', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), inventory: [{ item: 'semilla', quantity: 3 }] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Necesitas una Pala');
  expect(await seedMenu(page)).toBeNull();
  expect((await plotState(page)).seed).toBeNull();
  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'semilla', quantity: 3 }]);
});
