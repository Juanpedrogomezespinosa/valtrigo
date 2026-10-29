import { expect, test } from './fixtures';
import {
  at,
  currentGameState,
  isScenePaused,
  NEXT_TO_BED,
  openPause,
  press,
  sceneTexts,
  selectShopRow,
  startAtWith,
  startNextTo,
  startWith,
  waitForScene,
} from './helpers';

// HU-82. Confirmar con E

test('Escenario 1: Comprar con E', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 100, inventory: [] });
  await press(page, 'e'); // abre la tienda
  await waitForScene(page, 'ShopScene');
  await selectShopRow(page, 'pala');

  await press(page, 'e');

  await expect.poll(async () => (await currentGameState(page))?.money).toBe(70);
  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'pala', quantity: 1 }]);
});

test('Escenario 2: Usar un objeto con E', async ({ page }) => {
  await startWith(page, { energy: 60, inventory: [{ item: 'manzana', quantity: 1 }] });
  await press(page, 'i');
  await waitForScene(page, 'InventoryScene');

  await press(page, 'e');

  await expect.poll(async () => (await currentGameState(page))?.energy).toBe(75);
});

test('Escenario 3: Dormir con E', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { minutes: at(21) });
  await press(page, 'e');
  expect(await sceneTexts(page, 'HudScene')).toContain('¿Dormir?');

  await press(page, 'ArrowLeft'); // "Sí"
  await press(page, 'e');

  await waitForScene(page, 'DaySummaryScene');
});

test('Escenario 4: La E que abre no confirma', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { minutes: at(21) });

  await press(page, 'e');
  await page.waitForTimeout(300);

  expect(await sceneTexts(page, 'HudScene')).toContain('¿Dormir?');
});

test('Escenario 5: Menú de pausa con E', async ({ page }) => {
  await startWith(page, {});
  await openPause(page);

  await press(page, 'e');

  await expect.poll(() => isScenePaused(page, 'GameScene')).toBe(false);
});
