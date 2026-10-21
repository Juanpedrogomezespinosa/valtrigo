import { expect, test } from './fixtures';
import dialogues from '../../src/data/dialogues.json' with { type: 'json' };
import {
  at,
  CLOCK_PIECES,
  currentGameState,
  mechanismState,
  NEXT_TO_MECHANISM,
  placePieces,
  press,
  sceneTexts,
  startAtWith,
} from './helpers';

// HU-56. Puzle del reloj
// El mecanismo está en la casilla (5, 2) de la torre. Los huecos se llenan de abajo arriba.

const QUEST_ACTIVE = {
  day: 6,
  minutes: at(10),
  money: 100,
  completedQuests: ['encargo-1', 'encargo-2', 'encargo-3'],
  activeQuests: ['encargo-4'],
};

test('Escenario 1: Orden correcto', async ({ page }) => {
  await startAtWith(page, 'torre', NEXT_TO_MECHANISM, { ...QUEST_ACTIVE, inventory: CLOCK_PIECES });

  await press(page, 'e');
  expect((await mechanismState(page))?.options).toEqual(['Engranaje de cobre', 'Muelle de plata', 'Péndulo de oro']);
  await placePieces(page, ['Engranaje de cobre', 'Muelle de plata', 'Péndulo de oro']);

  expect(await sceneTexts(page, 'HudScene')).toContain('Encargo completado');
  const state = await currentGameState(page);
  expect(state?.money).toBe(200);
  expect(state?.inventory).toEqual([{ item: 'manzana', quantity: 2 }]);
  expect(state?.completedQuests).toContain('encargo-4');
  expect(state?.activeQuests).toEqual([]);

  // Criterio: la relojera da la pista del orden en su diálogo de encargo en curso.
  expect(dialogues.npcs.relojera.quests['encargo-4'].active.join(' ')).toContain(
    'primero lo que gira, luego lo que empuja y arriba lo que marca el compás',
  );
});

test('Escenario 2: Orden incorrecto', async ({ page }) => {
  await startAtWith(page, 'torre', NEXT_TO_MECHANISM, { ...QUEST_ACTIVE, inventory: CLOCK_PIECES });

  await press(page, 'e');
  await placePieces(page, ['Péndulo de oro']);
  expect((await mechanismState(page))?.holes).toEqual(['Péndulo de oro', null, null]);
  await placePieces(page, ['Engranaje de cobre', 'Muelle de plata']);

  expect(await sceneTexts(page, 'HudScene')).toContain('El reloj no arranca');
  const state = await currentGameState(page);
  expect(state?.inventory).toEqual(CLOCK_PIECES);
  expect(state?.activeQuests).toEqual(['encargo-4']);
  expect(state?.money).toBe(100);

  // Se puede volver a intentar.
  await press(page, 'e');
  expect(await mechanismState(page)).not.toBeNull();
});

test('Escenario 3: Faltan piezas', async ({ page }) => {
  await startAtWith(page, 'torre', NEXT_TO_MECHANISM, { ...QUEST_ACTIVE, inventory: CLOCK_PIECES.slice(0, 2) });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Faltan piezas');
  expect(await mechanismState(page)).toBeNull();
});

test('Escenario 4: Sin el encargo', async ({ page }) => {
  // Día 5: el encargo de la relojera aún no se ofrece (HU-38), pero el jugador ya tiene las tres piezas.
  await startAtWith(page, 'torre', NEXT_TO_MECHANISM, {
    day: 5,
    minutes: at(10),
    completedQuests: ['encargo-1', 'encargo-2', 'encargo-3'],
    activeQuests: [],
    inventory: CLOCK_PIECES,
  });

  await press(page, 'e');

  const texts = await sceneTexts(page, 'HudScene');
  expect(texts).toContain('Habla primero con la relojera');
  expect(texts).not.toContain('Faltan piezas');
  expect(await mechanismState(page)).toBeNull();
  expect((await currentGameState(page))?.inventory).toEqual(CLOCK_PIECES);
});
