import { expect, test } from './fixtures';
import { currentGameState, press, sceneTexts, startNextTo, talkUntilChoiceOrEnd } from './helpers';

// HU-20. Completar un encargo

test('Escenario 1: Completar el encargo', async ({ page }) => {
  await startNextTo(page, 'alcalde', {
    money: 100,
    activeQuests: ['encargo-1'],
    inventory: [{ item: 'carta-del-alcalde', quantity: 1 }],
  });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Encargo completado');
  const state = await currentGameState(page);
  expect(state?.money).toBe(150);
  expect(state?.inventory).toEqual([{ item: 'manzana', quantity: 1 }]);
  expect(state?.completedQuests).toEqual(['encargo-1']);
  expect(state?.activeQuests).toEqual([]);
});

test('Escenario 2: Reclamar un encargo ya completado', async ({ page }) => {
  await startNextTo(page, 'alcalde', { money: 150, completedQuests: ['encargo-1'], inventory: [] });

  await talkUntilChoiceOrEnd(page);

  const state = await currentGameState(page);
  expect(state?.money).toBe(150);
  expect(state?.inventory).toEqual([]);
  expect(await sceneTexts(page, 'HudScene')).not.toContain('Encargo completado');
});

test('Escenario 3: Inventario lleno al completar', async ({ page }) => {
  // 20 casillas ocupadas: la Carta y 19 casillas llenas de Manzanas. La recompensa (1 Manzana) no cabe.
  const inventory = [
    { item: 'carta-del-alcalde', quantity: 1 },
    ...Array.from({ length: 19 }, () => ({ item: 'manzana', quantity: 99 })),
  ];
  await startNextTo(page, 'alcalde', { money: 100, activeQuests: ['encargo-1'], inventory });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Inventario lleno');
  const state = await currentGameState(page);
  expect(state?.completedQuests).toEqual([]);
  expect(state?.activeQuests).toEqual(['encargo-1']);
  expect(state?.money).toBe(100);
  expect(state?.inventory).toEqual(inventory);
});
