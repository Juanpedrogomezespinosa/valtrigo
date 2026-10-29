import { expect, test } from './fixtures';
import { nameInput, openGame, openOptionsAt, optionsView, press, waitForScene } from './helpers';

// HU-83. Pantalla completa

async function isFullscreen(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { game: import('phaser').Game }).game.scale.isFullscreen);
}

test('Escenario 1: Activar con F', async ({ page }) => {
  await openGame(page);
  expect(await isFullscreen(page)).toBe(false);

  await press(page, 'f');

  await expect.poll(() => isFullscreen(page)).toBe(true);
  expect(await page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
});

test('Escenario 2: Desactivar con F', async ({ page }) => {
  await openGame(page);
  await press(page, 'f');
  await expect.poll(() => isFullscreen(page)).toBe(true);

  await press(page, 'f');

  await expect.poll(() => isFullscreen(page)).toBe(false);
});

test('Escenario 3: Desde las opciones', async ({ page }) => {
  await openOptionsAt(page, 'Pantalla completa');
  expect((await optionsView(page))?.fullscreen).toBe(false);

  await press(page, 'Enter');

  await expect.poll(() => isFullscreen(page)).toBe(true);
  await expect.poll(async () => (await optionsView(page))?.fullscreen).toBe(true);
  const value = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return (game.scene.getScene('OptionsScene').children.getByName('pantalla-completa') as import('phaser').GameObjects.Text).text;
  });
  expect(value).toBe('Sí');
});

test('Escenario 4: La F en el nombre', async ({ page }) => {
  await openGame(page);
  await press(page, 'Enter'); // "Nueva partida"
  await waitForScene(page, 'IntroScene');
  await press(page, 'Escape'); // salta la introducción
  await waitForScene(page, 'NameScene');

  await press(page, 'F');

  expect(await nameInput(page)).toBe('F');
  expect(await isFullscreen(page)).toBe(false);
});

test('Escenario 5: Controles', async ({ page }) => {
  await openOptionsAt(page, 'Música');

  expect((await optionsView(page))?.controls).toContainEqual(['Pantalla completa', 'F']);
});
