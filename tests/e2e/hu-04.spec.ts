import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  choosePauseOption,
  clickText,
  currentGameState,
  expectSceneActive,
  openGame,
  passIntro,
  openPause,
  press,
  readSavedGame,
  savedGame,
  sceneTexts,
  setSavedGame,
  startNewGame,
  waitForScene,
  expectSameGame,
  measureTextVisible,
} from './helpers';

// HU-04. Guardar partida desde el menú principal

async function isSaveEnabledInMainMenu(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const scene = game.scene.getScene('MenuScene') as unknown as { isOptionEnabled(label: string): boolean };
    return scene.isOptionEnabled('Guardar partida');
  });
}

test('Escenario 1: Guardar una partida en curso', async ({ page }) => {
  await startNewGame(page);
  await openPause(page);

  // "Partida guardada" se muestra durante 2 segundos.
  const visibleFor = await measureTextVisible(page, 'PauseScene', 'Partida guardada', () =>
    choosePauseOption(page, 'Guardar partida'),
  );
  expect(visibleFor).toBeGreaterThanOrEqual(1900);
  expect(visibleFor).toBeLessThan(2400);
  expectSameGame(await readSavedGame(page), await currentGameState(page));
});

test('Escenario 2: Guardar desactivado sin partida en curso', async ({ page }) => {
  await openGame(page);
  expect(await isSaveEnabledInMainMenu(page)).toBe(false);

  // Tampoco al volver al menú principal desde una partida: al salir, la partida se pierde (HU-26).
  await press(page, 'Enter'); // "Nueva partida"
  await passIntro(page); // HU-62
  await openPause(page);
  await choosePauseOption(page, 'Salir al menú principal');
  await clickText(page, 'PauseScene', 'Sí');
  await expectSceneActive(page, 'MenuScene');

  expect(await isSaveEnabledInMainMenu(page)).toBe(false);
});

test('Escenario 3: Sobrescribir la partida guardada', async ({ page }) => {
  await setSavedGame(page, savedGame({ day: 2 }));
  await openGame(page);
  await press(page, 'ArrowDown'); // "Continuar"
  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');

  // La partida avanza hasta el día 4.
  await page.evaluate(() => {
    (window as unknown as { gameState: () => { day: number } }).gameState().day = 4;
  });

  await openPause(page);
  await choosePauseOption(page, 'Guardar partida');

  expect((await readSavedGame(page))?.day).toBe(4);
});
