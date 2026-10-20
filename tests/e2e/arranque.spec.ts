import { expect, test } from '@playwright/test';

// Comprobación del entorno: el juego carga y Phaser abre el menú principal.
// No corresponde a ninguna historia de usuario.
test('el juego arranca y abre el menú principal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#game canvas')).toBeVisible();

  await page.waitForFunction(() => {
    const game = (window as unknown as { game?: { scene: { isActive(key: string): boolean } } }).game;
    return game?.scene.isActive('MenuScene') ?? false;
  });

  expect(errors).toEqual([]);
});
