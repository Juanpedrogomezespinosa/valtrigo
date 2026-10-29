import { expect, test } from './fixtures';
import {
  at,
  currentGameState,
  DUG,
  FRONT_OF_PLOT,
  moveTo,
  PLOT,
  plotState,
  plotView,
  press,
  sceneTexts,
  sleepUntil,
  startAtWith,
} from './helpers';

// HU-44. Crecimiento y cosecha
// Fotogramas de public/assets/sprites/cultivos.png: 1 recién sembrado, 4 nabo listo.

const READY_TURNIP = { dug: true, seed: 'semilla', grown: 2, watered: false };
const FULL_INVENTORY = Array.from({ length: 20 }, () => ({ item: 'manzana', quantity: 99 }));

async function sowAndWater(page: import('@playwright/test').Page): Promise<void> {
  await press(page, 'e'); // lista de semillas
  await press(page, 'Enter'); // "Semilla"
  await press(page, 'e'); // regar
}

test('Escenario 1: Crece con riego', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, {
    day: 2,
    minutes: at(10),
    inventory: [
      { item: 'semilla', quantity: 1 },
      { item: 'regadera', quantity: 1 },
    ],
    plots: { [PLOT]: DUG },
  });
  await sowAndWater(page);
  expect(await plotState(page)).toEqual({ dug: true, seed: 'semilla', grown: 0, watered: true });

  // Día 3: lo vuelve a regar.
  await sleepUntil(page, 3);
  await moveTo(page, 'granja', FRONT_OF_PLOT);
  await press(page, 'e');
  expect((await plotState(page)).watered).toBe(true);

  // Empieza el día 4: el Nabo está listo.
  await sleepUntil(page, 4);
  await moveTo(page, 'granja', FRONT_OF_PLOT);
  expect((await plotState(page)).grown).toBe(2);
  expect((await plotView(page))?.cropFrame).toBe(4);
});

test('Escenario 2: No crece sin riego', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, {
    day: 2,
    minutes: at(10),
    inventory: [{ item: 'semilla', quantity: 1 }],
    plots: { [PLOT]: DUG },
  });
  await press(page, 'e');
  await press(page, 'Enter');
  expect((await plotState(page)).seed).toBe('semilla');

  await sleepUntil(page, 3);
  await moveTo(page, 'granja', FRONT_OF_PLOT);

  expect(await plotState(page)).toEqual({ dug: true, seed: 'semilla', grown: 0, watered: false });
  expect((await plotView(page))?.cropFrame).toBe(1);
});

test('Escenario 3: Cosechar', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 50, inventory: [], plots: { [PLOT]: READY_TURNIP } });

  await press(page, 'e');

  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([{ item: 'nabo', quantity: 1 }]);
  expect(state?.energy).toBe(48);
  expect(await plotState(page)).toEqual(DUG);
  expect((await plotView(page))?.cropFrame).toBeNull();
});

test('Escenario 4: Inventario lleno', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), inventory: FULL_INVENTORY, plots: { [PLOT]: READY_TURNIP } });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Inventario lleno');
  expect(await plotState(page)).toEqual(READY_TURNIP);
  expect((await plotView(page))?.cropFrame).toBe(4);
});
