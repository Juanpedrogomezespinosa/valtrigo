import { expect, test } from './fixtures';
import { at, currentGameState, press, sceneTexts, selectShopRow, shopView, startNextTo } from './helpers';

// HU-17. Comprar objetos en la tienda
// En estas partidas no hay encargos en curso, así que hablar con la vendedora abre la tienda directamente.

const FULL_INVENTORY = Array.from({ length: 20 }, () => ({ item: 'manzana', quantity: 99 }));

test('Escenario 1: Compra correcta', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 100, inventory: [] });

  await press(page, 'e');
  const view = await shopView(page);
  // Cada objeto muestra su icono, su nombre y su precio.
  expect(view?.rows).toContainEqual({ item: 'pala', name: 'Pala', price: 30, icon: 'objeto-pala' });
  await selectShopRow(page, 'pala');
  await press(page, 'Enter');

  const state = await currentGameState(page);
  expect(state?.money).toBe(70);
  expect(state?.inventory).toEqual([{ item: 'pala', quantity: 1 }]);
});

test('Escenario 2: Dinero insuficiente', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 20, inventory: [] });

  await press(page, 'e');
  await selectShopRow(page, 'pala');
  await press(page, 'Enter');

  expect(await sceneTexts(page, 'ShopScene')).toContain('Dinero insuficiente');
  const state = await currentGameState(page);
  expect(state?.money).toBe(20);
  expect(state?.inventory).toEqual([]);
});

test('Escenario 3: Inventario lleno', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 100, inventory: FULL_INVENTORY });

  await press(page, 'e');
  await selectShopRow(page, 'pala');
  await press(page, 'Enter');

  expect(await sceneTexts(page, 'ShopScene')).toContain('Inventario lleno');
  const state = await currentGameState(page);
  expect(state?.money).toBe(100);
  expect(state?.inventory).toEqual(FULL_INVENTORY);
});

test('Escenario 4: Tienda cerrada', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(20), money: 100, inventory: [] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('La tienda está cerrada');
  expect(await shopView(page)).toBeNull();
});
