import { expect, test } from './fixtures';
import dialogues from '../../src/data/dialogues.json' with { type: 'json' };
import { at, dialogState, shopView, startNextTo, talkUntilChoiceOrEnd } from './helpers';

// HU-38. Encargos principales por día

const seedsOffer = dialogues.npcs.granjero.quests['encargo-2'].offer;

test('Escenario 1: Antes de su día', async ({ page }) => {
  await startNextTo(page, 'granjero', { day: 1, minutes: at(10), completedQuests: ['encargo-1'] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).not.toEqual(seedsOffer);
  expect(lines).toEqual(dialogues.npcs.granjero.greeting);
  expect(await dialogState(page)).toBeNull(); // sin "Aceptar" ni "Rechazar"
});

test('Escenario 2: El día del encargo', async ({ page }) => {
  await startNextTo(page, 'granjero', { day: 2, minutes: at(10), completedQuests: ['encargo-1'] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(seedsOffer);
  expect((await dialogState(page))?.choice?.options).toEqual(['Aceptar', 'Rechazar']);
});

test('Escenario 3: Después de su día', async ({ page }) => {
  await startNextTo(page, 'granjero', { day: 3, minutes: at(10), completedQuests: ['encargo-1'], activeQuests: [] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(seedsOffer);
  expect((await dialogState(page))?.choice?.options).toEqual(['Aceptar', 'Rechazar']);
});

test('Escenario 4: Encargo anterior sin completar', async ({ page }) => {
  // Con la tienda abierta y nada del encargo que decir, hablar con la vendedora abre la tienda directamente.
  await startNextTo(page, 'vendedora', { day: 4, minutes: at(10), completedQuests: ['encargo-1'] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).not.toEqual(dialogues.npcs.vendedora.quests['encargo-3'].offer);
  expect(await dialogState(page)).toBeNull();
  expect(await shopView(page)).not.toBeNull();
});
