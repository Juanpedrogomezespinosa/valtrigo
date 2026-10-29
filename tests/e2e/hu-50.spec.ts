import { expect, test } from './fixtures';
import {
  at,
  currentGameState,
  isForageSpotOnMap,
  moveTo,
  NEXT_TO_FORAGE,
  press,
  sceneTexts,
  sleepUntil,
  startAtWith,
} from './helpers';

// HU-50. Recoger en el bosque
// Puntos fijos del bosque en public/assets/maps/bosque.json (puntos "recurso", con su id y su tipo).

const FULL_INVENTORY = Array.from({ length: 20 }, () => ({ item: 'manzana', quantity: 99 }));

test('Escenario 1: Recoger', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_FORAGE['setas-1'], { minutes: at(10), energy: 50, inventory: [] });

  await press(page, 'e');

  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([{ item: 'seta', quantity: 1 }]);
  expect(state?.energy).toBe(48);
  expect(await isForageSpotOnMap(page, 'setas-1')).toBe(false);
});

test('Escenario 2: Talar', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_FORAGE['tronco-5'], {
    minutes: at(10),
    energy: 100,
    inventory: [{ item: 'hacha', quantity: 1 }],
  });

  await press(page, 'e');

  const state = await currentGameState(page);
  expect(state?.inventory).toContainEqual({ item: 'lena', quantity: 1 });
  expect(state?.energy).toBe(90);
  expect(await isForageSpotOnMap(page, 'tronco-5')).toBe(false);
});

test('Escenario 3: Sin Hacha', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_FORAGE['tronco-5'], { minutes: at(10), energy: 100, inventory: [] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Necesitas un Hacha');
  expect(await isForageSpotOnMap(page, 'tronco-5')).toBe(true);
  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([]);
  expect(state?.energy).toBe(100);
});

test('Escenario 4: Vuelve al día siguiente', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_FORAGE['setas-1'], { day: 3, minutes: at(10), inventory: [] });
  await press(page, 'e');
  expect(await isForageSpotOnMap(page, 'setas-1')).toBe(false);

  await sleepUntil(page, 4);
  await moveTo(page, 'bosque', NEXT_TO_FORAGE['setas-1']);

  expect(await isForageSpotOnMap(page, 'setas-1')).toBe(true);
});

test('Escenario 5: Inventario lleno', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_FORAGE['moras-3'], { minutes: at(10), energy: 50, inventory: FULL_INVENTORY });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Inventario lleno');
  expect(await isForageSpotOnMap(page, 'moras-3')).toBe(true);
  expect((await currentGameState(page))?.energy).toBe(50);
});
