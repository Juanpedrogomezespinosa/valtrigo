import dialogues from '../../src/data/dialogues.json' with { type: 'json' };
import { expect, test } from './fixtures';
import {
  at,
  chooseDialogOption,
  currentGameState,
  dialogState,
  objectivesTexts,
  press,
  startAtWith,
  talkUntilChoiceOrEnd,
  waitForHudText,
} from './helpers';

// HU-74. Misiones con hora límite
// Rosa está en el lago (25, 9) de 06:00 a 12:00 y en la plaza (21, 15) de 12:00 a 19:00.

const NEXT_TO_ROSA_LAKE = { x: 25, y: 10 };

test('Escenario 1: Hora límite en la lista', async ({ page }) => {
  await startAtWith(page, 'lago', NEXT_TO_ROSA_LAKE, { day: 3, minutes: at(9) });
  await talkUntilChoiceOrEnd(page);
  await chooseDialogOption(page, 'Aceptar');
  await talkUntilChoiceOrEnd(page);

  await press(page, 'o');
  await press(page, 'ArrowRight'); // "Misiones"

  expect(await objectivesTexts(page)).toContain('Encargada por: Rosa · Antes de las 12:00');
});

test('Escenario 2: Completar a tiempo', async ({ page }) => {
  await startAtWith(page, 'lago', NEXT_TO_ROSA_LAKE, {
    day: 3,
    minutes: at(11, 30),
    inventory: [{ item: 'trucha', quantity: 1 }],
    activeMissions: [{ id: 'mision-5', day: 3 }],
  });

  await talkUntilChoiceOrEnd(page);

  await waitForHudText(page, 'Misión completada');
});

test('Escenario 3: Misión fallida', async ({ page }) => {
  await startAtWith(page, 'lago', { x: 15, y: 3 }, { day: 3, minutes: at(11, 59), activeMissions: [{ id: 'mision-5', day: 3 }] });

  await waitForHudText(page, 'Misión fallida: Una trucha para Rosa', 5000);

  expect((await currentGameState(page))?.activeMissions).toEqual([]);
  await press(page, 'o');
  await press(page, 'ArrowRight'); // "Misiones"
  const texts = (await objectivesTexts(page))!;
  expect(texts).not.toContain('Una trucha para Rosa');
  expect(texts).toContain('No tienes misiones activas');
});

test('Escenario 4: Objeto de misión al fallar', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 17 }, {
    day: 4,
    minutes: at(14, 59),
    inventory: [{ item: 'paquete', quantity: 1 }],
    activeMissions: [{ id: 'mision-9', day: 4 }],
  });

  await waitForHudText(page, 'Misión fallida: Paquete urgente', 5000);

  expect((await currentGameState(page))?.inventory).toEqual([]);
});

test('Escenario 5: Fuera de hora', async ({ page }) => {
  // A las 13:00 Rosa está en la plaza.
  await startAtWith(page, 'plaza', { x: 21, y: 16 }, { day: 3, minutes: at(13) });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(dialogues.npcs.rosa.greeting);
  expect((await currentGameState(page))?.activeMissions).toEqual([]);
});

test('Escenario 6: Otra oportunidad', async ({ page }) => {
  await startAtWith(page, 'lago', NEXT_TO_ROSA_LAKE, { day: 4, minutes: at(9) });

  await talkUntilChoiceOrEnd(page);

  expect((await dialogState(page))?.choice?.options).toEqual(['Aceptar', 'Rechazar']);
});
