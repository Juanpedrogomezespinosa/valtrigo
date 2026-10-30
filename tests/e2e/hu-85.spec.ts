import { expect, test } from './fixtures';
import {
  at,
  currentGameState,
  FISHING_SPOT,
  fishingState,
  inventoryView,
  pickUp,
  plotState,
  press,
  ROD,
  sceneTexts,
  selectShopRow,
  setRandom,
  shopView,
  startAtWith,
  startNextTo,
  waitForHudText,
} from './helpers';

// HU-85. Mejoras
// En la tienda, → → pasa a la pestaña "Mejoras".

async function openUpgradesTab(page: import('@playwright/test').Page): Promise<void> {
  await press(page, 'e');
  await press(page, 'ArrowRight'); // "Vender"
  await press(page, 'ArrowRight'); // "Mejoras"
  expect((await shopView(page))?.tab).toBe('Mejoras');
}

const FULL_OF_FIREWOOD = Array.from({ length: 20 }, () => ({ item: 'lena', quantity: 99 }));
const SOWN = { dug: true, seed: 'semilla', grown: 0, watered: false };

test('Escenario 1: Ver las mejoras', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 100 });
  await press(page, 'e');
  await press(page, 'ArrowRight');
  expect((await shopView(page))?.tab).toBe('Vender');

  await press(page, 'ArrowRight');

  const view = (await shopView(page))!;
  expect(view.tab).toBe('Mejoras');
  expect(view.rows.map(({ name, price, bought }) => ({ name, price, bought }))).toEqual([
    { name: 'Mochila grande', price: 150, bought: false },
    { name: 'Regadera grande', price: 120, bought: false },
    { name: 'Caña buena', price: 100, bought: false },
  ]);
});

test('Escenario 2: Comprar una mejora', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 200, inventory: [] });
  await openUpgradesTab(page);

  await selectShopRow(page, 'mochila-grande');
  await press(page, 'Enter');

  const state = await currentGameState(page);
  expect(state?.money).toBe(50);
  expect(state?.upgrades).toEqual(['mochila-grande']);
  expect(state?.inventory).toEqual([]);
  expect((await shopView(page))?.rows[0]).toMatchObject({ item: 'mochila-grande', bought: true });
  expect(await sceneTexts(page, 'ShopScene')).toContain('Comprada');
});

test('Escenario 3: Dinero insuficiente', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 50 });
  await openUpgradesTab(page);

  await selectShopRow(page, 'cana-buena');
  await press(page, 'Enter');

  expect(await sceneTexts(page, 'ShopScene')).toContain('Dinero insuficiente');
  const state = await currentGameState(page);
  expect(state?.money).toBe(50);
  expect(state?.upgrades).toEqual([]);
});

test('Escenario 4: Mejora ya comprada', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 200, upgrades: ['cana-buena'] });
  await openUpgradesTab(page);

  await selectShopRow(page, 'cana-buena');
  await press(page, 'Enter');

  expect(await sceneTexts(page, 'ShopScene')).toContain('Ya tienes esta mejora');
  const state = await currentGameState(page);
  expect(state?.money).toBe(200);
  expect(state?.upgrades).toEqual(['cana-buena']);
});

test('Escenario 5: Mochila grande', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 17 }, { minutes: at(10), inventory: FULL_OF_FIREWOOD, upgrades: ['mochila-grande'] });

  expect(await pickUp(page, 'seta', 1)).toBe(true);

  expect((await currentGameState(page))?.inventory[20]).toEqual({ item: 'seta', quantity: 1 });
  await press(page, 'i');
  const view = (await inventoryView(page))!;
  expect(view.slots).toHaveLength(30);
  expect(view.slots[20]?.item).toBe('seta');
});

test('Escenario 6: Regadera grande', async ({ page }) => {
  // Desde la casilla (18, 3), mirando hacia abajo, se tiene delante la parcela (18, 4); las de los lados son
  // la (17, 4) y la (19, 4).
  await startAtWith(page, 'granja', { x: 18, y: 3 }, {
    minutes: at(10),
    energy: 100,
    inventory: [{ item: 'regadera', quantity: 1 }],
    upgrades: ['regadera-grande'],
    plots: { '17,4': SOWN, '18,4': SOWN, '19,4': SOWN },
  });

  await press(page, 'e');

  for (const plot of ['17,4', '18,4', '19,4']) {
    expect((await plotState(page, plot)).watered).toBe(true);
  }
  expect((await currentGameState(page))?.energy).toBe(96);
});

test('Escenario 7: Caña buena', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), inventory: [ROD], upgrades: ['cana-buena'] });
  await setRandom(page, [0]);

  await press(page, 'e');
  await waitForHudText(page, '¡Pica!');
  await press(page, 'e');

  expect((await fishingState(page))?.game?.zoneSize).toBe(40);
});
