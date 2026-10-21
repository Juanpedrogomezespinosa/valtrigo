import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  activeScenes,
  clickText,
  expectSceneActive,
  openGame,
  press,
  savedGame,
  setSavedGame,
  waitForScene,
} from './helpers';

// HU-01. Ver el menú principal al abrir el juego

const OPTIONS = ['Nueva partida', 'Continuar', 'Partidas de práctica', 'Guardar partida', 'Opciones', 'Créditos', 'Salir'];

type MenuSceneApi = {
  getSelectedOption(): string;
  isOptionEnabled(label: string): boolean;
};

function selectedOption(page: Page): Promise<string> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return (game.scene.getScene('MenuScene') as unknown as MenuSceneApi).getSelectedOption();
  });
}

function isEnabled(page: Page, label: string): Promise<boolean> {
  return page.evaluate((label) => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return (game.scene.getScene('MenuScene') as unknown as MenuSceneApi).isOptionEnabled(label);
  }, label);
}

async function visibleMenuTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return game.scene
      .getScene('MenuScene')
      .children.list.filter((child) => child.type === 'Text')
      .sort((a, b) => (a as import('phaser').GameObjects.Text).y - (b as import('phaser').GameObjects.Text).y)
      .map((child) => (child as import('phaser').GameObjects.Text).text);
  });
}

async function isMenuMusicPlaying(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const context = (game.sound as unknown as { context: AudioContext }).context;
    return game.registry.get('music') === 'music-menu' && context.state === 'running';
  });
}

test('Escenario 1: Primera apertura del juego', async ({ page }) => {
  await openGame(page);

  await expect.poll(() => isMenuMusicPlaying(page)).toBe(true);

  const texts = await visibleMenuTexts(page);
  const optionsInOrder = texts.filter((text) => OPTIONS.includes(text));
  expect(optionsInOrder).toEqual(OPTIONS);

  expect(await isEnabled(page, 'Continuar')).toBe(false);
  expect(await isEnabled(page, 'Guardar partida')).toBe(false);
});

test('Escenario 2: Con partida guardada', async ({ page }) => {
  await setSavedGame(page, savedGame());
  await openGame(page);

  expect(await isEnabled(page, 'Continuar')).toBe(true);
});

test('Escenario 3: Navegación con teclado', async ({ page }) => {
  await openGame(page);
  expect(await selectedOption(page)).toBe(OPTIONS[0]);

  for (let i = 1; i < OPTIONS.length; i++) {
    await press(page, 'ArrowDown');
    expect(await selectedOption(page)).toBe(OPTIONS[i]);
  }

  for (let i = OPTIONS.length - 2; i >= 0; i--) {
    await press(page, 'ArrowUp');
    expect(await selectedOption(page)).toBe(OPTIONS[i]);
  }

  // Enter activa la opción seleccionada.
  const indexOfCredits = OPTIONS.indexOf('Créditos');
  for (let i = 0; i < indexOfCredits; i++) {
    await press(page, 'ArrowDown');
  }
  expect(await selectedOption(page)).toBe('Créditos');
  await press(page, 'Enter');
  await waitForScene(page, 'CreditsScene');
});

test('Escenario 4: Opción desactivada', async ({ page }) => {
  await openGame(page);

  await press(page, 'ArrowDown');
  expect(await selectedOption(page)).toBe('Continuar');

  await press(page, 'Enter');

  expect(await activeScenes(page)).toEqual(['MenuScene']);
  expect(await selectedOption(page)).toBe('Continuar');
});

test('Escenario 5: Volver desde Opciones', async ({ page }) => {
  await openGame(page);

  // Con Escape
  await clickText(page, 'MenuScene', 'Opciones');
  await waitForScene(page, 'OptionsScene');
  await press(page, 'Escape');
  await expectSceneActive(page, 'MenuScene');
  expect(await selectedOption(page)).toBe('Opciones');

  // Con el botón "Volver"
  await press(page, 'Enter');
  await waitForScene(page, 'OptionsScene');
  await clickText(page, 'OptionsScene', 'Volver');
  await expectSceneActive(page, 'MenuScene');
  expect(await selectedOption(page)).toBe('Opciones');
});
