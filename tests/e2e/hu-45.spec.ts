import { expect, test } from './fixtures';
import { at, currentGameState, isAppleOnTree, moveTo, NEXT_TO_APPLE_TREE, press, sleepUntil, startAtWith, talkIndicator } from './helpers';

// HU-45. El manzano
// El tronco del manzano está en la casilla (12, 5) de la granja.

test('Escenario 1: Recoger una Manzana', async ({ page }) => {
  await startAtWith(page, 'granja', NEXT_TO_APPLE_TREE, { minutes: at(10), energy: 50, inventory: [], applePickedDay: null });
  expect(await isAppleOnTree(page)).toBe(true);

  await press(page, 'e');

  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([{ item: 'manzana', quantity: 1 }]);
  expect(state?.energy).toBe(50); // no gasta energía
  expect(await isAppleOnTree(page)).toBe(false);
});

test('Escenario 2: Vuelve a dar fruta', async ({ page }) => {
  await startAtWith(page, 'granja', NEXT_TO_APPLE_TREE, { day: 3, minutes: at(10), applePickedDay: 2 });
  expect(await isAppleOnTree(page)).toBe(false);

  await sleepUntil(page, 4);
  await moveTo(page, 'granja', NEXT_TO_APPLE_TREE);

  expect(await isAppleOnTree(page)).toBe(true);
});

test('Escenario 3: Todavía sin fruta', async ({ page }) => {
  await startAtWith(page, 'granja', NEXT_TO_APPLE_TREE, { day: 2, minutes: at(10), applePickedDay: 2, inventory: [] });

  await sleepUntil(page, 3);
  await moveTo(page, 'granja', NEXT_TO_APPLE_TREE);

  expect(await isAppleOnTree(page)).toBe(false);
  // Sin fruta no aparece el indicador "E" y E no hace nada.
  await page.waitForTimeout(100);
  expect((await talkIndicator(page)).visible).toBe(false);
  await press(page, 'e');
  expect((await currentGameState(page))?.inventory).toEqual([]);
});
