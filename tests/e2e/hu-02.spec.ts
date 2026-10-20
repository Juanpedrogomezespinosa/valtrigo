import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  activeScenes,
  clickText,
  currentGameState,
  openGame,
  press,
  readSavedGame,
  savedGame,
  sceneTexts,
  setSavedGame,
  waitForScene,
} from './helpers';

// HU-02. Empezar una nueva partida

// Posición de inicio definida en el mapa de la zona inicial (capa "puntos", objeto "inicio").
async function startPosition(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const map = game.cache.tilemap.get('map-plaza').data as {
      layers: { name: string; objects?: { name: string; x: number; y: number }[] }[];
    };
    const point = map.layers.find((layer) => layer.name === 'puntos')!.objects!.find((o) => o.name === 'inicio')!;
    return { x: Math.floor(point.x / 16), y: Math.floor(point.y / 16) };
  });
}

async function playerTile(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const scene = game.scene.getScene('GameScene') as unknown as { player: { getTilePosition(): { x: number; y: number } } };
    return scene.player.getTilePosition();
  });
}

test('Escenario 1: Nueva partida sin partida guardada', async ({ page }) => {
  await openGame(page);

  await press(page, 'Enter'); // "Nueva partida" está seleccionada al abrir el menú
  await waitForScene(page, 'GameScene');

  const state = await currentGameState(page);
  expect(state?.zone).toBe('plaza');
  expect(await playerTile(page)).toEqual(await startPosition(page));
  expect(state?.day).toBe(1);
  expect(state?.minutes).toBe(6 * 60);
});

test('Escenario 2: Confirmación al sobrescribir', async ({ page }) => {
  const saved = savedGame({ day: 4 });
  await setSavedGame(page, saved);
  await openGame(page);

  await press(page, 'Enter');

  const texts = await sceneTexts(page, 'MenuScene');
  expect(texts).toContain('¿Sobrescribir la partida guardada?');
  expect(texts.some((text) => text.endsWith('Sí'))).toBe(true);
  expect(texts.some((text) => text.endsWith('No'))).toBe(true);

  await clickText(page, 'MenuScene', 'No');

  expect(await sceneTexts(page, 'MenuScene')).not.toContain('¿Sobrescribir la partida guardada?');
  expect(await activeScenes(page)).toEqual(['MenuScene']);
  expect(await currentGameState(page)).toBeNull();
  expect(await readSavedGame(page)).toEqual(saved);
});

test('Escenario 3: Confirmar la sobrescritura', async ({ page }) => {
  await setSavedGame(page, savedGame({ day: 4 }));
  await openGame(page);

  await press(page, 'Enter');
  await clickText(page, 'MenuScene', 'Sí');
  await waitForScene(page, 'GameScene');

  const state = await currentGameState(page);
  expect(state?.zone).toBe('plaza');
  expect(state?.day).toBe(1);
  expect(state?.minutes).toBe(6 * 60);
  expect(await readSavedGame(page)).toEqual(state);
});

test('Escenario 4: Datos iniciales', async ({ page }) => {
  await openGame(page);

  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');

  const state = await currentGameState(page);
  expect(state?.money).toBe(100);
  expect(state?.energy).toBe(100);
  expect(state?.inventory).toEqual([]);
});
