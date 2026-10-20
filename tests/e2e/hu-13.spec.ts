import { expect, test } from '@playwright/test';
import { activeScenes, inventoryView, isScenePaused, playerInfo, press, startWith } from './helpers';

// HU-13. Ver el inventario

test('Escenario 1: Abrir el inventario con objetos', async ({ page }) => {
  await startWith(page, {
    inventory: [
      { item: 'manzana', quantity: 3 },
      { item: 'pala', quantity: 1 },
    ],
  });

  await press(page, 'i');

  const view = await inventoryView(page);
  expect(view?.slots[0]).toEqual({ item: 'manzana', name: 'Manzana', quantity: 3, icon: 'objeto-manzana' });
  expect(view?.slots[1]).toEqual({ item: 'pala', name: 'Pala', quantity: 1, icon: 'objeto-pala' });
});

test('Escenario 2: Inventario vacío', async ({ page }) => {
  await startWith(page, { inventory: [] });

  await press(page, 'i');

  const view = await inventoryView(page);
  expect(view?.slots).toHaveLength(20);
  expect(view?.slots.every((slot) => slot === null)).toBe(true);
});

test('Escenario 3: Cerrar el inventario', async ({ page }) => {
  await startWith(page, { inventory: [] });

  for (const key of ['i', 'Escape']) {
    await press(page, 'i');
    expect(await inventoryView(page)).not.toBeNull();
    expect(await isScenePaused(page, 'GameScene')).toBe(true);

    await press(page, key);

    expect(await inventoryView(page)).toBeNull();
    expect(await activeScenes(page)).toContain('GameScene');
    expect(await isScenePaused(page, 'GameScene')).toBe(false);
    expect(await activeScenes(page)).not.toContain('PauseScene'); // Escape cierra el inventario, no abre la pausa
  }
});

test('Escenario 4: Movimiento bloqueado', async ({ page }) => {
  await startWith(page, { inventory: [] });
  await press(page, 'i');
  const before = await playerInfo(page);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');

  const after = await playerInfo(page);
  expect(after.x).toBe(before.x);
  expect(after.y).toBe(before.y);
});
