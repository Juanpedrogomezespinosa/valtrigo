import { expect, test } from './fixtures';
import { at, currentGameState, dialogState, itemChoice, NEXT_TO_HARVEST_STALL, press, sceneTexts, startAtWith } from './helpers';

// HU-59. Concurso de la cosecha

test('Escenario 1: Participar', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_HARVEST_STALL, {
    day: 7,
    minutes: at(10),
    money: 100,
    inventory: [{ item: 'calabaza', quantity: 1 }],
  });

  await press(page, 'e');
  expect((await itemChoice(page))?.options).toEqual(['Calabaza']);
  await press(page, 'Enter');

  const state = await currentGameState(page);
  expect(state?.money).toBe(200);
  expect(state?.inventory).toEqual([]);
});

test('Escenario 2: Solo una vez', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_HARVEST_STALL, {
    day: 7,
    minutes: at(10),
    inventory: [{ item: 'nabo', quantity: 1 }],
    harvestContestDone: true,
  });

  await press(page, 'e');

  expect((await dialogState(page))?.fullText).toBe('Ya has participado');
  expect(await itemChoice(page)).toBeNull();
});

test('Escenario 3: Sin cosechas', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_HARVEST_STALL, { day: 7, minutes: at(10), inventory: [{ item: 'manzana', quantity: 2 }] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Necesitas una cosecha para participar');
  expect(await itemChoice(page)).toBeNull();
});
