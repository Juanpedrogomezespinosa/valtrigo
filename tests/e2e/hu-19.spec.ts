import { expect, test } from './fixtures';
import dialogues from '../../src/data/dialogues.json' with { type: 'json' };
import {
  chooseDialogOption,
  currentGameState,
  dialogState,
  objectivesTexts,
  press,
  startNextTo,
  talkUntilChoiceOrEnd,
} from './helpers';

// HU-19. Aceptar un encargo

test('Escenario 1: Aceptar un encargo', async ({ page }) => {
  await startNextTo(page, 'alcalde', {});
  await talkUntilChoiceOrEnd(page);

  await chooseDialogOption(page, 'Aceptar');

  // El alcalde sigue con su diálogo de encargo en curso.
  const after = await talkUntilChoiceOrEnd(page);
  expect(after).toEqual(dialogues.npcs.alcalde.quests['encargo-1'].active);
  expect(await dialogState(page)).toBeNull();

  // El encargo aparece en la lista de objetivos.
  await press(page, 'o');
  expect(await objectivesTexts(page)).toContain('Entregar la Carta del alcalde');
});

test('Escenario 2: Rechazar un encargo', async ({ page }) => {
  await startNextTo(page, 'alcalde', {});
  await talkUntilChoiceOrEnd(page);

  await chooseDialogOption(page, 'Rechazar');

  expect(await dialogState(page)).toBeNull();
  expect((await currentGameState(page))?.activeQuests).toEqual([]);
  await press(page, 'o');
  const objectives = await objectivesTexts(page);
  expect(objectives).not.toContain('Entregar la Carta del alcalde');
  expect(objectives).toContain('No tienes encargos activos');
  await press(page, 'o');

  // Al volver a hablar con él, vuelve a ofrecer el encargo.
  const lines = await talkUntilChoiceOrEnd(page);
  expect(lines).toEqual(dialogues.npcs.alcalde.quests['encargo-1'].offer);
  expect((await dialogState(page))?.choice?.options).toEqual(['Aceptar', 'Rechazar']);
});

test('Escenario 3: Encargo activo en curso', async ({ page }) => {
  // El granjero tiene encargos pendientes.
  await startNextTo(page, 'granjero', { activeQuests: ['encargo-1'] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(['Termina tu encargo actual primero']);
  expect(await dialogState(page)).toBeNull(); // sin opciones: no ofrece su encargo
  expect((await currentGameState(page))?.activeQuests).toEqual(['encargo-1']);
});
