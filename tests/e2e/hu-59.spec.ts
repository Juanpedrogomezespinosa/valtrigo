import { expect, test } from './fixtures';
import { at, currentGameState, dialogState, itemChoice, NEXT_TO_HARVEST_STALL, press, sceneTexts, startAtWith } from './helpers';

// HU-59. Concurso de la cosecha
// El resultado se anuncia en la ceremonia (HU-66).

test('Escenario 1: Participar', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_HARVEST_STALL, {
    day: 7,
    minutes: at(13),
    money: 100,
    inventory: [{ item: 'calabaza', quantity: 1 }],
  });

  await press(page, 'e');
  expect((await itemChoice(page))?.options).toEqual(['Calabaza']);
  await press(page, 'Enter');

  const state = await currentGameState(page);
  expect(state?.inventory).toEqual([]);
  expect(state?.money).toBe(100); // el premio se cobra en la ceremonia
  const message = (await sceneTexts(page, 'HudScene')).find((text) => text.startsWith('Has presentado'));
  const weight = Number(message?.match(/^Has presentado una Calabaza de (\d+) kg\. Resultados en la ceremonia de las 18:00$/)?.[1]);
  expect(weight).toBeGreaterThanOrEqual(6);
  expect(weight).toBeLessThanOrEqual(15);
  expect(state?.harvestEntry).toEqual({ item: 'calabaza', weight });
});

test('Escenario 2: Solo una vez', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_HARVEST_STALL, {
    day: 7,
    minutes: at(13),
    inventory: [{ item: 'nabo', quantity: 1 }],
    harvestEntry: { item: 'calabaza', weight: 9 },
  });

  await press(page, 'e');

  expect((await dialogState(page))?.fullText).toBe('Ya has participado');
  expect(await itemChoice(page)).toBeNull();
});

test('Escenario 3: Sin cosechas', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_HARVEST_STALL, { day: 7, minutes: at(13), inventory: [{ item: 'manzana', quantity: 2 }] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Necesitas una cosecha para participar');
  expect(await itemChoice(page)).toBeNull();
});

test('Escenario 4: Concurso terminado', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_HARVEST_STALL, { day: 7, minutes: at(17, 30), inventory: [{ item: 'calabaza', quantity: 1 }] });

  await press(page, 'e');

  expect((await dialogState(page))?.fullText).toBe('El concurso ya ha terminado');
  expect(await itemChoice(page)).toBeNull();
  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'calabaza', quantity: 1 }]);
});
