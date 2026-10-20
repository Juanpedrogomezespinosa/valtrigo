import { expect, test } from './fixtures';
import { currentGameState, pickUp, sceneTexts, startWith } from './helpers';

// HU-15. Límite de espacio en el inventario
// Los objetos se recogen con window.pickUp, la misma función que usan cofres y tienda.

// 20 casillas ocupadas por objetos distintos (se repiten tipos, pero cada casilla es independiente).
const FULL_INVENTORY = [
  'manzana', 'semilla', 'carta-del-alcalde', 'pieza-del-reloj-1', 'pieza-del-reloj-2',
  'pieza-del-reloj-3', 'manzana', 'semilla', 'carta-del-alcalde', 'pieza-del-reloj-1',
  'pieza-del-reloj-2', 'pieza-del-reloj-3', 'manzana', 'semilla', 'carta-del-alcalde',
  'pieza-del-reloj-1', 'pieza-del-reloj-2', 'pieza-del-reloj-3', 'manzana', 'semilla',
].map((item) => ({ item, quantity: 99 }));

test('Escenario 1: Inventario completo', async ({ page }) => {
  await startWith(page, { inventory: FULL_INVENTORY });

  expect(await pickUp(page, 'pala', 1)).toBe(false);

  expect(await sceneTexts(page, 'HudScene')).toContain('Inventario lleno');
  const inventory = (await currentGameState(page))?.inventory;
  expect(inventory).toHaveLength(20);
  expect(inventory?.some((slot) => slot.item === 'pala')).toBe(false);
});

test('Escenario 2: Apilar hasta 99', async ({ page }) => {
  await startWith(page, { inventory: [{ item: 'semilla', quantity: 98 }] });

  expect(await pickUp(page, 'semilla', 3)).toBe(true);

  expect((await currentGameState(page))?.inventory).toEqual([
    { item: 'semilla', quantity: 99 },
    { item: 'semilla', quantity: 2 },
  ]);
});

test('Escenario 3: Completar una casilla sin espacio libre', async ({ page }) => {
  const inventory = FULL_INVENTORY.map((slot) => ({ ...slot }));
  inventory[1] = { item: 'semilla', quantity: 98 };
  await startWith(page, { inventory });

  expect(await pickUp(page, 'semilla', 1)).toBe(true);

  const after = (await currentGameState(page))?.inventory;
  expect(after?.[1]).toEqual({ item: 'semilla', quantity: 99 });
  expect(after).toHaveLength(20);
});
