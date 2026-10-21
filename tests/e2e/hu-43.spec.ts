import { expect, test } from './fixtures';
import { at, currentGameState, FRONT_OF_PLOT, moveTo, PLOT, plotState, plotView, press, sceneTexts, sleepUntil, startAtWith } from './helpers';

// HU-43. Regar con la Regadera

const SOWN = { dug: true, seed: 'semilla', grown: 0, watered: false };
const REGADERA = { item: 'regadera', quantity: 1 };

test('Escenario 1: Regar', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 100, inventory: [REGADERA], plots: { [PLOT]: SOWN } });

  await press(page, 'e');

  expect((await plotState(page)).watered).toBe(true);
  // Se ve más oscura.
  expect((await plotView(page))?.watered).toBe(true);
  expect((await currentGameState(page))?.energy).toBe(98);
});

test('Escenario 2: Ya regada', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, {
    minutes: at(10),
    energy: 100,
    inventory: [REGADERA],
    plots: { [PLOT]: { ...SOWN, watered: true } },
  });

  await press(page, 'e');

  expect((await currentGameState(page))?.energy).toBe(100);
  expect((await plotState(page)).watered).toBe(true);
});

test('Escenario 3: Sin Regadera', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 100, inventory: [], plots: { [PLOT]: SOWN } });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Necesitas una Regadera');
  expect((await plotState(page)).watered).toBe(false);
  expect((await currentGameState(page))?.energy).toBe(100);
});

test('Escenario 4: Nuevo día', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { day: 2, minutes: at(10), inventory: [REGADERA], plots: { [PLOT]: SOWN } });
  await press(page, 'e');
  expect((await plotState(page)).watered).toBe(true);

  await sleepUntil(page, 3);
  await moveTo(page, 'granja', FRONT_OF_PLOT);

  expect((await plotState(page)).watered).toBe(false);
  expect((await plotView(page))?.watered).toBe(false);
});
