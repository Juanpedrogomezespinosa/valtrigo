import { expect, test } from './fixtures';
import { currentGameState, hudEnergy, inventoryView, press, sceneTexts, startWith } from './helpers';

// HU-14. Usar objetos del inventario
// Al abrir el inventario está seleccionada la primera casilla.

test('Escenario 1: Usar una Manzana', async ({ page }) => {
  await startWith(page, { energy: 60, inventory: [{ item: 'manzana', quantity: 3 }] });
  await press(page, 'i');

  await press(page, 'Enter');

  expect((await currentGameState(page))?.energy).toBe(75);
  expect((await inventoryView(page))?.slots[0]?.quantity).toBe(2);
});

test('Escenario 2: Usar el último objeto', async ({ page }) => {
  await startWith(page, { energy: 60, inventory: [{ item: 'manzana', quantity: 1 }] });
  await press(page, 'i');

  await press(page, 'Enter');

  expect((await inventoryView(page))?.slots.some((slot) => slot?.item === 'manzana')).toBe(false);
  expect((await currentGameState(page))?.inventory).toEqual([]);
});

test('Escenario 3: Energía al máximo', async ({ page }) => {
  await startWith(page, { energy: 100, inventory: [{ item: 'manzana', quantity: 1 }] });
  await press(page, 'i');

  await press(page, 'Enter');

  expect((await currentGameState(page))?.energy).toBe(100);
  expect((await inventoryView(page))?.slots[0]?.quantity).toBe(1);
});

test('Escenario 4: Objeto no consumible', async ({ page }) => {
  await startWith(page, {
    inventory: [
      { item: 'manzana', quantity: 1 },
      { item: 'pala', quantity: 1 },
    ],
  });
  await press(page, 'i');
  await press(page, 'ArrowRight'); // la Pala está en la segunda casilla
  expect((await inventoryView(page))?.selected).toBe(1);

  await press(page, 'Enter');

  expect(await sceneTexts(page, 'InventoryScene')).toContain('No se puede usar');
  expect((await inventoryView(page))?.slots[1]?.quantity).toBe(1);
});

test('Escenario 5: Ver la energía', async ({ page }) => {
  await startWith(page, { energy: 60, inventory: [{ item: 'manzana', quantity: 1 }] });
  await expect.poll(() => hudEnergy(page)).toBe('Energía: 60/100');

  await press(page, 'i');
  await press(page, 'Enter');

  await expect.poll(() => hudEnergy(page)).toBe('Energía: 75/100');
  // Debajo del dinero, en la esquina superior derecha.
  const layout = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const hud = game.scene.getScene('HudScene');
    const money = (hud.children.getByName('dinero') as import('phaser').GameObjects.Text).getBounds();
    const energy = (hud.children.getByName('energia') as import('phaser').GameObjects.Text).getBounds();
    return { moneyBottom: money.bottom, energyTop: energy.top, energyRight: energy.right };
  });
  expect(layout.energyTop).toBeGreaterThanOrEqual(layout.moneyBottom);
  expect(layout.energyRight).toBeGreaterThan(960 * 0.9);
});
