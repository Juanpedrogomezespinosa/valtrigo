import { expect, test } from './fixtures';
import { at, currentGameState, press, sceneTexts, selectShopRow, shopView, startNextTo } from './helpers';

// HU-18. Vender objetos en la tienda
// En la tienda, → pasa a la pestaña "Vender". Cada Enter vende una unidad (decisión del autor).

async function openSellTab(page: import('@playwright/test').Page): Promise<void> {
  await press(page, 'e');
  await press(page, 'ArrowRight');
  expect((await shopView(page))?.tab).toBe('Vender');
}

test('Escenario 1: Venta de un objeto', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 100, inventory: [{ item: 'pala', quantity: 1 }] });
  await openSellTab(page);

  await selectShopRow(page, 'pala');
  await press(page, 'Enter');

  const state = await currentGameState(page);
  expect(state?.money).toBe(115);
  expect(state?.inventory).toEqual([]);
});

test('Escenario 2: Venta de varias unidades', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 100, inventory: [{ item: 'semilla', quantity: 5 }] });
  await openSellTab(page);
  expect((await shopView(page))?.rows[0]).toMatchObject({ item: 'semilla', price: 5 });

  for (let i = 0; i < 3; i++) {
    await press(page, 'Enter');
  }

  const state = await currentGameState(page);
  expect(state?.money).toBe(115);
  expect(state?.inventory).toEqual([{ item: 'semilla', quantity: 2 }]);
});

test('Escenario 3: Objeto de encargo', async ({ page }) => {
  await startNextTo(page, 'vendedora', {
    minutes: at(10),
    money: 100,
    completedQuests: ['encargo-1'],
    inventory: [{ item: 'carta-del-alcalde', quantity: 1 }],
  });
  await openSellTab(page);

  await press(page, 'Enter');

  expect(await sceneTexts(page, 'ShopScene')).toContain('Este objeto no se puede vender');
  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([{ item: 'carta-del-alcalde', quantity: 1 }]);
  expect(state?.money).toBe(100);
});

test('Escenario 4: Tienda cerrada', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(19, 30), money: 100, inventory: [{ item: 'semilla', quantity: 5 }] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('La tienda está cerrada');
  expect(await shopView(page)).toBeNull();
  const state = await currentGameState(page);
  expect(state?.money).toBe(100);
  expect(state?.inventory).toEqual([{ item: 'semilla', quantity: 5 }]);
});
