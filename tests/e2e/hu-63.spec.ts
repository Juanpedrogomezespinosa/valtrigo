import { expect, test } from './fixtures';
import {
  at,
  chooseDialogOption,
  objectivesTexts,
  press,
  startNewGame,
  startNextTo,
  startWith,
  talkUntilChoiceOrEnd,
} from './helpers';

// HU-63. Tareas del día
// Las tareas están en src/data/tasks.json.

const ALL_QUESTS = ['encargo-1', 'encargo-2', 'encargo-3', 'encargo-4', 'encargo-5', 'encargo-6'];

test('Escenario 1: Ver las tareas del día', async ({ page }) => {
  await startNewGame(page);

  await press(page, 'o');

  const texts = await objectivesTexts(page);
  expect(texts).toContain('Tareas de hoy (día 1)');
  expect(texts).toContain('☐ Habla con el alcalde en la plaza');
});

test('Escenario 2: Tarea hecha', async ({ page }) => {
  await startNextTo(page, 'alcalde', { day: 1, minutes: at(9) });

  await talkUntilChoiceOrEnd(page);
  await chooseDialogOption(page, 'Rechazar');
  await press(page, 'o');

  const texts = await objectivesTexts(page);
  expect(texts).toContain('☑ Habla con el alcalde en la plaza');
  expect(texts).not.toContain('☐ Habla con el alcalde en la plaza');
});

test('Escenario 3: Tarea pendiente de un día anterior', async ({ page }) => {
  await startWith(page, { day: 3, completedQuests: ['encargo-1'], activeQuests: [] });

  await press(page, 'o');

  const texts = await objectivesTexts(page);
  expect(texts).toContain('Tareas de hoy (día 3)');
  expect(texts).toContain('☐ Lleva 3 Semillas al granjero');
});

test('Escenario 4: Tareas que solo son de su día', async ({ page }) => {
  await startWith(page, { day: 2, completedQuests: ['encargo-1'], inventory: [] });

  await press(page, 'o');

  const texts = (await objectivesTexts(page))!;
  expect(texts).toContain('Tareas de hoy (día 2)');
  expect(texts.some((text) => text.includes('Compra Semillas en la tienda'))).toBe(false);
});

test('Escenario 5: Sin tareas', async ({ page }) => {
  await startWith(page, {
    day: 8,
    completedQuests: ALL_QUESTS,
    openedChests: ['cofre-1', 'cofre-2', 'cofre-3'],
    pickedUpItems: ['pala-de-la-granja'],
  });

  await press(page, 'o');

  const texts = await objectivesTexts(page);
  expect(texts).toContain('Tareas de hoy (día 8)');
  expect(texts).toContain('No hay tareas para hoy');
});
