import { expect, test } from './fixtures';
import {
  at,
  currentGameState,
  FRONT_OF_PLOT,
  hudEnergy,
  plotState,
  press,
  selectShopRow,
  shopView,
  startAtWith,
  startNextTo,
} from './helpers';

// HU-46. Gasto de energía por acción
// Los costes están en src/data/energy.json y se aplican con GameScene.work() (src/systems/energy.ts).

test('Escenario 1: Gastar energía', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 50, inventory: [{ item: 'pala', quantity: 1 }] });

  await press(page, 'e'); // cava la parcela

  expect((await plotState(page)).dug).toBe(true);
  expect((await currentGameState(page))?.energy).toBe(42);
  // La energía en pantalla se actualiza en cuanto se gasta.
  await expect.poll(() => hudEnergy(page), { intervals: [25] }).toBe('42/100');
});

test('Escenario 2: Acciones gratuitas', async ({ page }) => {
  await startNextTo(page, 'vendedora', { energy: 50, minutes: at(10), money: 100, inventory: [] });

  // Hablar con la vendedora (sin nada del encargo que decir, abre la tienda) y comprar una Semilla.
  await press(page, 'e');
  expect(await shopView(page)).not.toBeNull();
  await selectShopRow(page, 'semilla');
  await press(page, 'Enter');

  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([{ item: 'semilla', quantity: 1 }]);
  expect(state?.energy).toBe(50);
  expect(await hudEnergy(page)).toBe('50/100');
});
