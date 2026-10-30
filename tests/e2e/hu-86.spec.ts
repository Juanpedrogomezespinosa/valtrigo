import { expect, test } from './fixtures';
import {
  at,
  chooseDialogOption,
  currentGameState,
  dialogState,
  NEXT_TO_BOARD,
  press,
  sceneTexts,
  startAtWith,
  talkUntilChoiceOrEnd,
  waitForHudText,
} from './helpers';

// HU-86. Platos por encargo
// Bruno está en el bosque, en la casilla (18, 17). Su misión del día 3 ya está hecha, así que el día 5 ofrece la
// nueva.

const NEXT_TO_BRUNO = { x: 18, y: 18 };
const SOUP = { item: 'sopa-de-setas', quantity: 1 };

test('Escenario 1: Misión de un plato', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_BRUNO, { day: 5, minutes: at(10), money: 100, inventory: [SOUP], completedMissions: ['mision-6'] });
  await talkUntilChoiceOrEnd(page);
  await chooseDialogOption(page, 'Aceptar');
  await talkUntilChoiceOrEnd(page); // Bruno sigue hablando hasta cerrar el diálogo
  expect((await currentGameState(page))?.activeMissions.map(({ id }) => id)).toEqual(['mision-13']);

  await talkUntilChoiceOrEnd(page);

  await waitForHudText(page, 'Misión completada');
  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([]);
  expect(state?.money).toBe(160);
});

test('Escenario 2: Pedido de un plato en el tablón', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, { day: 6, minutes: at(10) });

  await press(page, 'e');

  const dialog = await dialogState(page);
  expect(dialog?.fullText).toContain('Guiso para la feria');
  expect(dialog?.fullText).toContain('1 Guiso de calabaza');
});

test('Escenario 3: Entregar un pedido de un plato', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, {
    day: 6,
    minutes: at(10),
    money: 100,
    inventory: [SOUP],
    activeOrders: [5],
    acceptedOrderDays: [5],
  });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Pedido completado');
  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([]);
  expect(state?.money).toBe(170);
  expect(state?.activeOrders).toEqual([]);
});
