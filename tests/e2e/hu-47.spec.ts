import { expect, test } from './fixtures';
import { at, currentGameState, FRONT_OF_PLOT, plotState, press, sceneTexts, startAtWith } from './helpers';

// HU-47. Agotamiento
// La acción de trabajo de estos escenarios es cavar una parcela del huerto (4 de energía, HU-41).

const PALA = { item: 'pala', quantity: 1 };

test('Escenario 1: Energía insuficiente', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 3, inventory: [PALA] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Estás demasiado cansado');
  expect((await plotState(page)).dug).toBe(false);
  expect((await currentGameState(page))?.energy).toBe(3);
});

test('Escenario 2: Energía justa', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 8, inventory: [PALA] });

  await press(page, 'e');

  expect((await plotState(page)).dug).toBe(true);
  expect((await currentGameState(page))?.energy).toBe(0);
});

test('Escenario 3: Recuperarse comiendo', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, {
    minutes: at(10),
    energy: 0,
    inventory: [{ item: 'manzana', quantity: 1 }, PALA],
  });

  // Usa la Manzana desde el inventario (primera casilla).
  await press(page, 'i');
  await press(page, 'Enter');
  await press(page, 'i');
  expect((await currentGameState(page))?.energy).toBe(15);

  // Y puede volver a trabajar.
  await press(page, 'e');
  expect((await plotState(page)).dug).toBe(true);
  expect((await currentGameState(page))?.energy).toBe(7);
});
