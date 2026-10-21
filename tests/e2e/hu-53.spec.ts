import { expect, test } from './fixtures';
import {
  at,
  chooseDialogOption,
  currentGameState,
  dialogState,
  NEXT_TO_BED,
  NEXT_TO_BOARD,
  press,
  sleepUntil,
  startAtWith,
  startNextTo,
  talkUntilChoiceOrEnd,
} from './helpers';

// HU-53. Pedidos simultáneos

test('Escenario 1: Pedido y encargo a la vez', async ({ page }) => {
  await startNextTo(page, 'alcalde', { day: 1, minutes: at(10), activeOrders: [1], acceptedOrderDays: [1] });

  await talkUntilChoiceOrEnd(page);
  expect((await dialogState(page))?.choice?.options).toEqual(['Aceptar', 'Rechazar']);
  await chooseDialogOption(page, 'Aceptar');

  const state = await currentGameState(page);
  expect(state?.activeQuests).toEqual(['encargo-1']);
  expect(state?.activeOrders).toEqual([1]);
});

test('Escenario 2: Límite de pedidos', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_BOARD, {
    day: 4,
    minutes: at(10),
    inventory: [],
    activeOrders: [1, 2, 3],
    acceptedOrderDays: [1, 2, 3],
  });

  await press(page, 'e');

  const dialog = await dialogState(page);
  expect(dialog?.fullText).toBe('Ya tienes 3 pedidos activos');
  expect(dialog?.choice).toBeNull();
  expect((await currentGameState(page))?.activeOrders).toEqual([1, 2, 3]);
});

test('Escenario 3: Sin fecha límite', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 2, minutes: at(21), activeOrders: [1], acceptedOrderDays: [1] });

  await sleepUntil(page, 3);

  expect((await currentGameState(page))?.activeOrders).toEqual([1]);
});
