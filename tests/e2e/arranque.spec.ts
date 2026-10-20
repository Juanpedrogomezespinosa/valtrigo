import { expect, test } from '@playwright/test';

// Comprobación del entorno: el juego carga y Phaser arranca la escena inicial.
// No corresponde a ninguna historia de usuario.
test('el juego arranca y muestra la escena inicial', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#game canvas')).toBeVisible();

  await page.waitForFunction(() => {
    const game = (window as unknown as { game?: { scene: { isActive(key: string): boolean } } }).game;
    return game?.scene.isActive('BootScene') ?? false;
  });

  expect(errors).toEqual([]);
});
