import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { currentGameState, expectClockAt, expectSameGame, isChestOpen, openGame, press, savedGame, setSavedGame, waitForScene } from './helpers';

// HU-03. Continuar una partida guardada

type MenuSceneApi = { getSelectedOption(): string; isOptionEnabled(label: string): boolean };

async function isContinueEnabled(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return (game.scene.getScene('MenuScene') as unknown as MenuSceneApi).isOptionEnabled('Continuar');
  });
}

async function playerTile(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const scene = game.scene.getScene('GameScene') as unknown as { player: { getTilePosition(): { x: number; y: number } } };
    return scene.player.getTilePosition();
  });
}

test('Escenario 1: Continuar una partida guardada', async ({ page }) => {
  const saved = savedGame({
    zone: 'casa',
    position: { x: 5, y: 5 },
    day: 3,
    minutes: 14 * 60,
    money: 250,
    energy: 60,
    inventory: [{ item: 'semilla', quantity: 3 }],
    activeQuests: ['encargo-2'],
    openedChests: ['cofre-1'],
  });
  await setSavedGame(page, saved);
  await openGame(page);

  await press(page, 'ArrowDown'); // "Continuar"
  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');

  const state = await currentGameState(page);
  expect(state?.zone).toBe('casa');
  expect(await playerTile(page)).toEqual(saved.position);
  expect(state?.day).toBe(3);
  expectClockAt(state?.minutes, 14 * 60);
  expect(state?.money).toBe(250);
  // El resto de datos guardados (energía, inventario, encargos y cofres) también se restaura.
  expectSameGame(state, saved);
});

test('Escenario 2: Los cofres abiertos se mantienen', async ({ page }) => {
  // El cofre 1 está en el cercado del granero (granja, casilla 5, 7).
  await setSavedGame(page, savedGame({ zone: 'granja', position: { x: 6, y: 7 }, inventory: [], openedChests: ['cofre-1'] }));
  await openGame(page);
  await press(page, 'ArrowDown'); // "Continuar"
  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');

  // Aparece vacío (abierto)...
  expect(await isChestOpen(page, 'cofre-1')).toBe(true);
  // ...y no se puede volver a abrir.
  await press(page, 'e');
  await page.waitForTimeout(100);
  expect((await currentGameState(page))?.inventory).toEqual([]);
});

test('Escenario 3: Sin partida guardada', async ({ page }) => {
  await openGame(page);

  expect(await isContinueEnabled(page)).toBe(false);
});
