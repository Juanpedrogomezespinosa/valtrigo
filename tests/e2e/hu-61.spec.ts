import { expect, test } from './fixtures';
import practice from '../../src/data/practice.json' with { type: 'json' };
import {
  at,
  currentGameState,
  expectClockAt,
  openGame,
  openPracticeMenu,
  practiceMenu,
  press,
  readSavedGame,
  savedGame,
  setSavedGame,
  waitForScene,
} from './helpers';

// HU-61. Partidas de práctica
// Partidas en src/data/practice.json.

const TITLES = practice.games.map((game) => game.title);

async function choose(page: import('@playwright/test').Page, title: string): Promise<void> {
  const menu = (await practiceMenu(page))!;
  for (let i = menu.options.indexOf(menu.selected); i < menu.options.indexOf(title); i++) {
    await press(page, 'ArrowDown');
  }
  expect((await practiceMenu(page))?.selected).toBe(title);
  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');
}

test('Escenario 1: Abrir la lista', async ({ page }) => {
  await openPracticeMenu(page);

  expect((await practiceMenu(page))?.options).toEqual([...TITLES, 'Volver']);
  expect(TITLES).toEqual([
    'Día 2: la granja',
    'Día 3: el lago',
    'Día 4: día de mercado',
    'Día 5: la torre',
    'Día 5: cocina y mejoras',
    'Día 6: la reparación',
    'Día 7: la feria',
    'Inventario lleno',
  ]);
});

test('Escenario 2: Empezar una partida preparada', async ({ page }) => {
  await openPracticeMenu(page);

  await choose(page, 'Día 5: la torre');

  const state = await currentGameState(page);
  expect(state?.day).toBe(5);
  expectClockAt(state?.minutes, at(6));
  expect(state?.zone).toBe('plaza');
  expect(state?.inventory).toEqual([
    { item: 'pieza-del-reloj-1', quantity: 1 }, // Engranaje de cobre
    { item: 'pieza-del-reloj-2', quantity: 1 }, // Muelle de plata
  ]);
  expect(state?.completedQuests).toEqual(['encargo-1', 'encargo-2', 'encargo-3']);
});

test('Escenario 3: La partida guardada no cambia', async ({ page }) => {
  const saved = savedGame({ day: 3, money: 999 });
  await setSavedGame(page, saved);
  await openGame(page);
  await press(page, 'ArrowDown');
  await press(page, 'ArrowDown'); // "Partidas de práctica"
  await press(page, 'Enter');
  await waitForScene(page, 'PracticeScene');

  await choose(page, 'Día 7: la feria');

  expect(await readSavedGame(page)).toEqual(saved);
  // El día de la feria empieza a las 12:00 (HU-58).
  expectClockAt((await currentGameState(page))?.minutes, at(12));
});

test('Escenario 4: Volver', async ({ page }) => {
  await openPracticeMenu(page);

  await press(page, 'Escape');

  await waitForScene(page, 'MenuScene');
  const selected = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return (game.scene.getScene('MenuScene') as unknown as { getSelectedOption(): string }).getSelectedOption();
  });
  expect(selected).toBe('Partidas de práctica');
});

test('Escenario 5: Cocina y mejoras', async ({ page }) => {
  await openPracticeMenu(page);

  await choose(page, 'Día 5: cocina y mejoras');

  const state = await currentGameState(page);
  expect(state?.day).toBe(5);
  expectClockAt(state?.minutes, at(6));
  expect(state?.zone).toBe('casa');
  expect(state?.money).toBe(400);
  expect(state?.inventory).toEqual([
    { item: 'seta', quantity: 3 },
    { item: 'nabo', quantity: 2 },
    { item: 'mora', quantity: 3 },
    { item: 'manzana', quantity: 1 },
    { item: 'carpa', quantity: 1 },
    { item: 'zanahoria', quantity: 1 },
    { item: 'calabaza', quantity: 1 },
  ]);
});
