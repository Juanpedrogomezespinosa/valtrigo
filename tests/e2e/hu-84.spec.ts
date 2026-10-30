import { expect, test } from './fixtures';
import { at, cookView, currentGameState, inventoryView, NEXT_TO_STOVE, press, sceneTexts, selectShopRow, startAtWith, startNextTo } from './helpers';

// HU-84. Cocinar
// El fogón está en la casa del jugador, en la casilla (6, 2). Las recetas aparecen en el orden de
// src/data/recipes.json: Sopa de setas, Tarta de moras, Carpa asada y Guiso de calabaza.

const FULL_OF_FIREWOOD = Array.from({ length: 18 }, () => ({ item: 'lena', quantity: 99 }));

async function openStove(page: import('@playwright/test').Page, inventory: { item: string; quantity: number }[]): Promise<void> {
  await startAtWith(page, 'casa', NEXT_TO_STOVE, { minutes: at(10), inventory });
  await press(page, 'e');
  await expect.poll(() => cookView(page)).not.toBeNull();
}

async function selectRecipe(page: import('@playwright/test').Page, dish: string): Promise<void> {
  const view = (await cookView(page))!;
  const target = view.recipes.findIndex((recipe) => recipe.dish === dish);
  for (let i = view.selected; i < target; i++) {
    await press(page, 'ArrowDown');
  }
}

test('Escenario 1: Abrir el fogón', async ({ page }) => {
  await openStove(page, [{ item: 'seta', quantity: 1 }]);

  const view = (await cookView(page))!;
  expect(view.recipes.map((recipe) => recipe.name)).toEqual(['Sopa de setas', 'Tarta de moras', 'Carpa asada', 'Guiso de calabaza']);
  expect(view.recipes[0].ingredients).toBe('Seta 1/2 · Nabo 0/1');
});

test('Escenario 2: Cocinar', async ({ page }) => {
  await openStove(page, [
    { item: 'seta', quantity: 2 },
    { item: 'nabo', quantity: 1 },
  ]);

  await selectRecipe(page, 'sopa-de-setas');
  await press(page, 'e');

  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'sopa-de-setas', quantity: 1 }]);
  expect(await sceneTexts(page, 'CookScene')).toContain('Has cocinado Sopa de setas');
  // La pantalla sigue abierta.
  expect(await cookView(page)).not.toBeNull();
});

test('Escenario 3: Faltan ingredientes', async ({ page }) => {
  const inventory = [
    { item: 'seta', quantity: 1 },
    { item: 'nabo', quantity: 1 },
  ];
  await openStove(page, inventory);

  await selectRecipe(page, 'sopa-de-setas');
  await press(page, 'e');

  expect(await sceneTexts(page, 'CookScene')).toContain('Te faltan ingredientes');
  expect((await currentGameState(page))?.inventory).toEqual(inventory);
});

test('Escenario 4: Inventario lleno', async ({ page }) => {
  const inventory = [...FULL_OF_FIREWOOD, { item: 'mora', quantity: 4 }, { item: 'manzana', quantity: 2 }];
  await openStove(page, inventory);

  await selectRecipe(page, 'tarta-de-moras');
  await press(page, 'e');

  expect(await sceneTexts(page, 'CookScene')).toContain('Inventario lleno');
  expect((await currentGameState(page))?.inventory).toEqual(inventory);
});

test('Escenario 5: Comer un plato', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 17 }, { minutes: at(10), energy: 50, inventory: [{ item: 'carpa-asada', quantity: 1 }] });
  await press(page, 'i');
  expect((await inventoryView(page))?.slots[0]?.item).toBe('carpa-asada');

  await press(page, 'Enter');

  expect((await currentGameState(page))?.energy).toBe(100);
});

test('Escenario 6: Vender un plato', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 0, inventory: [{ item: 'guiso-de-calabaza', quantity: 1 }] });
  await press(page, 'e');
  await press(page, 'ArrowRight'); // "Vender"

  await selectShopRow(page, 'guiso-de-calabaza');
  await press(page, 'Enter');

  expect((await currentGameState(page))?.money).toBe(150);
});
