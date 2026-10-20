import { expect, test, type Page } from '@playwright/test';
import { currentGameState, openGame, press, savedGame, setSavedGame, waitForScene } from './helpers';

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
  expect(state?.minutes).toBe(14 * 60);
  expect(state?.money).toBe(250);
  // El resto de datos guardados (energía, inventario, encargos y cofres) también se restaura.
  expect(state).toEqual(saved);
});

// Pendiente: los cofres y la tecla E se implementan en HU-12.
test.fixme('Escenario 2: Los cofres abiertos se mantienen', async () => {
  // Guardar una partida con 'cofre-1' en openedChests, pulsar "Continuar",
  // comprobar que el cofre 1 aparece vacío y que E junto a él no hace nada.
});

test('Escenario 3: Sin partida guardada', async ({ page }) => {
  await openGame(page);

  expect(await isContinueEnabled(page)).toBe(false);
});
