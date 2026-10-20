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
// Cofre 1: en el cercado del granero (granja, casilla 5, 7), con el Engranaje de cobre.
// Cofre 2: en el claro del lago (26, 11). Cartel de la plaza: (23, 11). Pala: granja (10, 7).

const FULL_INVENTORY = Array.from({ length: 20 }, () => ({ item: 'manzana', quantity: 99 }));

test('Escenario 1: Abrir un cofre', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 6, y: 7 }, { inventory: [] });
  expect(await isChestOpen(page, 'cofre-1')).toBe(false);

  await press(page, 'e');

  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'pieza-del-reloj-1', quantity: 1 }]);
  expect(await isChestOpen(page, 'cofre-1')).toBe(true);
});

test('Escenario 2: Cofre ya abierto', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 6, y: 7 }, { inventory: [], openedChests: ['cofre-1'] });
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
  await startAtWith(page, 'lago', { x: 25, y: 11 }, { inventory: FULL_INVENTORY });

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
