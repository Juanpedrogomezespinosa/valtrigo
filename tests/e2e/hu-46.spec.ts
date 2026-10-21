import { expect, test } from './fixtures';
import { at, currentGameState, hudEnergy, press, selectShopRow, shopView, startNextTo } from './helpers';

// HU-46. Gasto de energía por acción
// Los costes están en src/data/energy.json y se aplican con GameScene.work() (src/systems/energy.ts).

test.fixme('Escenario 1: Gastar energía', async () => {
  // Pendiente de HU-41 (cavar parcelas con la Pala).
  // Continuar una partida en la granja con 50 de energía y una Pala, junto a una parcela sin cavar.
  // Pulsar E: la parcela queda cavada, la energía es 46 y la interfaz muestra "Energía: 46/100" enseguida.
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
  expect(await hudEnergy(page)).toBe('Energía: 50/100');
});
