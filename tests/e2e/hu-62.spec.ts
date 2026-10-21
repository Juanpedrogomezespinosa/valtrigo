import { expect, test } from './fixtures';
import intro from '../../src/data/intro.json' with { type: 'json' };
import {
  activeScenes,
  at,
  currentGameState,
  expectClockAt,
  introPage,
  openGame,
  press,
  savedGame,
  setSavedGame,
  waitForScene,
} from './helpers';

// HU-62. Introducción al empezar
// Los textos de la introducción están en src/data/intro.json.

test('Escenario 1: Ver la introducción', async ({ page }) => {
  await openGame(page);

  await press(page, 'Enter'); // "Nueva partida"

  await waitForScene(page, 'IntroScene');
  expect(await introPage(page)).toEqual({ index: 0, total: intro.pages.length, text: intro.pages[0] });
  expect(await activeScenes(page)).not.toContain('GameScene');
});

test('Escenario 2: Pasar las pantallas', async ({ page }) => {
  await openGame(page);
  await press(page, 'Enter');
  await waitForScene(page, 'IntroScene');

  for (let index = 0; index < intro.pages.length; index++) {
    expect((await introPage(page))?.text).toBe(intro.pages[index]);
    // El reloj no avanza mientras se lee la introducción.
    expect((await currentGameState(page))?.minutes).toBe(at(8));
    if (index === 0) await page.waitForTimeout(1500);
    await press(page, 'e');
  }

  await waitForScene(page, 'GameScene');
  const state = await currentGameState(page);
  expect(state?.zone).toBe('plaza');
  expect(state?.day).toBe(1);
  expectClockAt(state?.minutes, at(8));
});

test('Escenario 3: Saltar la introducción', async ({ page }) => {
  await openGame(page);
  await press(page, 'Enter');
  await waitForScene(page, 'IntroScene');

  await press(page, 'Escape');

  await waitForScene(page, 'GameScene');
  expect(await introPage(page)).toBeNull();
  const state = await currentGameState(page);
  expect(state?.zone).toBe('plaza');
  expect(state?.day).toBe(1);
  expectClockAt(state?.minutes, at(8));
  // Escape no abre también la pausa.
  expect(await activeScenes(page)).not.toContain('PauseScene');
});

test('Escenario 4: Continuar sin introducción', async ({ page }) => {
  await setSavedGame(page, savedGame({ day: 3 }));
  await openGame(page);

  await press(page, 'ArrowDown'); // "Continuar"
  await press(page, 'Enter');

  await waitForScene(page, 'GameScene');
  expect(await introPage(page)).toBeNull();
  expect((await currentGameState(page))?.day).toBe(3);
});
