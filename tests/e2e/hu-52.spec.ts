import { expect, test } from './fixtures';
import { at, chooseDialogOption, currentGameState, dialogState, NEXT_TO_BOARD, objectivesTexts, press, startAtWith } from './helpers';

// HU-52. Tablón de anuncios
// Pedidos en src/data/orders.json.

test('Escenario 1: Leer el pedido', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, { day: 1, minutes: at(10) });

  await press(page, 'e');

  const dialog = await dialogState(page);
  expect(dialog?.fullText).toContain('Leña para el horno');
  expect(dialog?.fullText).toContain('3 Leñas');
  expect(dialog?.choice?.options).toEqual(['Aceptar', 'Rechazar']);
});

test('Escenario 2: Aceptar', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, { day: 1, minutes: at(10) });
  await press(page, 'e');

  await chooseDialogOption(page, 'Aceptar');

  expect(await dialogState(page)).toBeNull();
  expect((await currentGameState(page))?.activeOrders).toEqual([1]);
  await press(page, 'o');
  const texts = await objectivesTexts(page);
  expect(texts).toContain('Leña para el horno');
  expect(texts).toContain('Encargado por: Tablón de anuncios');
});

test('Escenario 3: Ya aceptado', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, { day: 1, minutes: at(10) });
  await press(page, 'e');
  await chooseDialogOption(page, 'Aceptar');

  await press(page, 'e');

  const dialog = await dialogState(page);
  expect(dialog?.fullText).toBe('Ya has aceptado el pedido de hoy');
  expect(dialog?.choice).toBeNull();
});

test('Escenario 4: Mismo pedido cada partida', async ({ page, context }) => {
  // Dos partidas distintas en el día 3.
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, { day: 3, minutes: at(9), money: 10 });
  await press(page, 'e');
  const first = (await dialogState(page))?.fullText;

  const other = await context.newPage();
  await startAtWith(other, 'plaza', NEXT_TO_BOARD, { day: 3, minutes: at(16), money: 500, completedQuests: ['encargo-1'] });
  await press(other, 'e');
  const second = (await dialogState(other))?.fullText;

  expect(first).toContain('Trucha para la cena');
  expect(second).toBe(first);
});
