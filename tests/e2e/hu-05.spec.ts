import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { activeScenes, clickText, openGame, press, readSavedGame, savedGame, sceneTexts, setSavedGame } from './helpers';

// HU-05. Salir del juego

type MenuSceneApi = { getSelectedOption(): string; isOptionEnabled(label: string): boolean };

function menu(page: Page): Promise<{ selected: string; continueEnabled: boolean }> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const scene = game.scene.getScene('MenuScene') as unknown as MenuSceneApi;
    return { selected: scene.getSelectedOption(), continueEnabled: scene.isOptionEnabled('Continuar') };
  });
}

async function chooseExit(page: Page): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await press(page, 'ArrowDown');
  }
  expect((await menu(page)).selected).toBe('Salir');
  await press(page, 'Enter');
  expect(await sceneTexts(page, 'MenuScene')).toContain('¿Salir del juego?');
}

// "Cerrar el juego" en un navegador: el juego se apaga (desaparece el lienzo) y queda la pantalla de despedida.
async function expectGameClosed(page: Page): Promise<void> {
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByText('Has salido de Valtrigo.')).toBeVisible();
}

test('Escenario 1: Confirmar la salida', async ({ page }) => {
  await openGame(page);

  await chooseExit(page);
  await clickText(page, 'MenuScene', 'Sí');

  await expectGameClosed(page);
});

test('Escenario 2: Cancelar la salida', async ({ page }) => {
  await openGame(page);

  await chooseExit(page);
  await clickText(page, 'MenuScene', 'No');

  expect(await sceneTexts(page, 'MenuScene')).not.toContain('¿Salir del juego?');
  expect(await activeScenes(page)).toEqual(['MenuScene']);
  expect((await menu(page)).selected).toBe('Salir');
});

test('Escenario 3: La partida guardada se mantiene', async ({ page }) => {
  const saved = savedGame();
  await setSavedGame(page, saved);
  await openGame(page);

  await chooseExit(page);
  await clickText(page, 'MenuScene', 'Sí');
  await expectGameClosed(page);

  // Volver a abrir el juego.
  await openGame(page);

  expect((await menu(page)).continueEnabled).toBe(true);
  expect(await readSavedGame(page)).toEqual(saved);
});
