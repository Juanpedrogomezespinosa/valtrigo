import { expect, test } from './fixtures';
import dialogues from '../../src/data/dialogues.json' with { type: 'json' };
import { dialogState, startNextTo, talkUntilChoiceOrEnd } from './helpers';

// HU-11. Diálogos distintos según el progreso

const mayor = dialogues.npcs.alcalde.quests['encargo-1'];

test('Escenario 1: Antes de aceptar el encargo', async ({ page }) => {
  await startNextTo(page, 'alcalde', {});

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(mayor.offer);
  expect((await dialogState(page))?.choice?.options).toEqual(['Aceptar', 'Rechazar']);
});

test('Escenario 2: Encargo activo', async ({ page }) => {
  await startNextTo(page, 'alcalde', { activeQuests: ['encargo-1'], inventory: [] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(mayor.active);
  expect(lines).not.toEqual(mayor.offer);
});

test('Escenario 3: Encargo completado', async ({ page }) => {
  await startNextTo(page, 'alcalde', { completedQuests: ['encargo-1'] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(mayor.thanks);
  expect(lines).not.toEqual(mayor.offer);
  expect(lines).not.toEqual(mayor.active);
  expect(lines).not.toEqual(mayor.complete);
});

test('Escenario 4: Siguiente encargo del mismo NPC', async ({ page }) => {
  // El granjero tiene los encargos 2 y 5. Con los anteriores completados, ofrece el 5.
  await startNextTo(page, 'granjero', { completedQuests: ['encargo-1', 'encargo-2', 'encargo-3', 'encargo-4'] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(dialogues.npcs.granjero.quests['encargo-5'].offer);
  expect((await dialogState(page))?.choice?.options).toEqual(['Aceptar', 'Rechazar']);
});
