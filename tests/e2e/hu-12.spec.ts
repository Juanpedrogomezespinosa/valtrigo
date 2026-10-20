import { expect, test } from './fixtures';
import {
  currentGameState,
  dialogState,
  isChestOpen,
  isWorldItemOnMap,
  press,
  sceneTexts,
  startAtWith,
} from './helpers';

// HU-12. Interactuar con objetos del mundo
// Cofre 1: detrás del granero (granja, casilla 7, 2), con el Engranaje de cobre.
// Cofre 2: en el almacén de la torre (1, 10). Cartel de la plaza: (23, 11). Pala: granja (10, 7).

const FULL_INVENTORY = Array.from({ length: 20 }, () => ({ item: 'manzana', quantity: 99 }));

test('Escenario 1: Abrir un cofre', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 8, y: 2 }, { inventory: [] });
  expect(await isChestOpen(page, 'cofre-1')).toBe(false);

  await press(page, 'e');

  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'pieza-del-reloj-1', quantity: 1 }]);
  expect(await isChestOpen(page, 'cofre-1')).toBe(true);
});

test('Escenario 2: Cofre ya abierto', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 8, y: 2 }, { inventory: [], openedChests: ['cofre-1'] });
  expect(await isChestOpen(page, 'cofre-1')).toBe(true);

  await press(page, 'e');
  await page.waitForTimeout(100);

  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([]);
  expect(state?.openedChests).toEqual(['cofre-1']);
  expect(await dialogState(page)).toBeNull();
  expect(await sceneTexts(page, 'HudScene')).not.toContain('Inventario lleno');
});

test('Escenario 3: Inventario lleno', async ({ page }) => {
  await startAtWith(page, 'torre', { x: 2, y: 10 }, { inventory: FULL_INVENTORY });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Inventario lleno');
  expect(await isChestOpen(page, 'cofre-2')).toBe(false);
  expect((await currentGameState(page))?.openedChests).toEqual([]);
});

test('Escenario 4: Leer un cartel', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 22, y: 12 }, {});

  await press(page, 'e');

  const dialog = await dialogState(page);
  expect(dialog?.speaker).toBe('cartel');
  expect(dialog?.shownText).toBe(dialog?.fullText);
  expect(dialog?.fullText).toContain('Plaza de Valtrigo');

  await press(page, 'e');

  expect(await dialogState(page)).toBeNull();
});

test('Escenario 5: Recoger la Pala', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 10, y: 8 }, { inventory: [] });
  expect(await isWorldItemOnMap(page, 'pala-de-la-granja')).toBe(true);

  await press(page, 'e');

  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'pala', quantity: 1 }]);
  expect(await isWorldItemOnMap(page, 'pala-de-la-granja')).toBe(false);
});
