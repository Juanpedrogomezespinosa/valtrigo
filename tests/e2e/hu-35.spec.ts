import { expect, test } from './fixtures';
import { openGame, press, sceneTexts, waitForScene } from './helpers';

// HU-35. Pantalla de créditos

async function openCredits(page: import('@playwright/test').Page): Promise<void> {
  await openGame(page);
  for (let i = 0; i < 4; i++) await press(page, 'ArrowDown'); // "Créditos"
  await press(page, 'Enter');
  await waitForScene(page, 'CreditsScene');
}

test('Escenario 1: Abrir los créditos', async ({ page }) => {
  await openCredits(page);

  expect(await sceneTexts(page, 'CreditsScene')).toContain('Créditos');
});

test('Escenario 2: Contenido de los créditos', async ({ page }) => {
  await openCredits(page);

  const texts = (await sceneTexts(page, 'CreditsScene')).join('\n');
  expect(texts).toContain('Juanpe Gómez'); // autor
  expect(texts).toContain('Phaser 3');
  expect(texts).toContain('Licencia MIT');
  // Cada recurso externo con su licencia.
  expect(texts).toMatch(/Kenney.*CC0 1\.0/);
  expect(texts).toMatch(/Pixel-boy y AAA.*CC0 1\.0/);
});

test('Escenario 3: Volver al menú', async ({ page }) => {
  await openCredits(page);

  await press(page, 'Escape');

  await waitForScene(page, 'MenuScene');
  const selected = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return (game.scene.getScene('MenuScene') as unknown as { getSelectedOption(): string }).getSelectedOption();
  });
  expect(selected).toBe('Créditos');
});
