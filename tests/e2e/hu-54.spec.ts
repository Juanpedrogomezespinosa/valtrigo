import { expect, test } from './fixtures';
import { at, currentGameState, NEXT_TO_BOARD, press, sceneTexts, startAtWith } from './helpers';

// HU-54. Entregar un pedido

test('Escenario 1: Entregar', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, {
    day: 2,
    minutes: at(10),
    money: 100,
    inventory: [{ item: 'lena', quantity: 3 }],
    activeOrders: [1],
    acceptedOrderDays: [1],
  });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Pedido completado');
  const state = await currentGameState(page);
  expect(state?.money).toBe(120);
  expect(state?.inventory).toEqual([]);
  expect(state?.activeOrders).toEqual([]);
});

test('Escenario 2: Faltan objetos', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, {
    day: 2,
    minutes: at(10),
    money: 100,
    inventory: [{ item: 'lena', quantity: 2 }],
    activeOrders: [1],
    acceptedOrderDays: [1],
  });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).not.toContain('Pedido completado');
  const state = await currentGameState(page);
  expect(state?.activeOrders).toEqual([1]);
  expect(state?.inventory).toEqual([{ item: 'lena', quantity: 2 }]);
  expect(state?.money).toBe(100);
});

test('Escenario 3: Inventario lleno', async ({ page }) => {
  // La recompensa del pedido del día 4 incluye 2 Semillas de zanahoria, que no caben.
  const inventory = [
    ...Array.from({ length: 19 }, () => ({ item: 'manzana', quantity: 99 })),
    { item: 'nabo', quantity: 2 },
  ];
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, {
    day: 5,
    minutes: at(10),
    money: 100,
    inventory,
    activeOrders: [4],
    acceptedOrderDays: [4],
  });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Inventario lleno');
  const state = await currentGameState(page);
  expect(state?.activeOrders).toEqual([4]);
  expect(state?.inventory).toEqual(inventory);
  expect(state?.money).toBe(100);
});
