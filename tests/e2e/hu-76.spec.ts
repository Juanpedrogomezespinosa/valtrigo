import { expect, test } from './fixtures';
import { at, currentGameState, FRONT_OF_PLOT, plotState, press, startAtWith, waitForHudText } from './helpers';

// HU-76. Energía más exigente
// Para correr se usa el camino principal de la plaza (fila 14), libre de obstáculos entre las casillas 3 y 36.

const ON_MAIN_PATH = { x: 5, y: 14 };
const WALK_SPEED = 64;

async function velocityX(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return (game.scene.getScene('GameScene') as unknown as { player: { body: { velocity: { x: number } } } }).player.body.velocity.x;
  });
}

test('Escenario 1: Cavar cuesta el doble', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, { minutes: at(10), energy: 50, inventory: [{ item: 'pala', quantity: 1 }] });

  await press(page, 'e');

  expect((await plotState(page)).dug).toBe(true);
  expect((await currentGameState(page))?.energy).toBe(42);
});

test('Escenario 2: Correr gasta energía', async ({ page }) => {
  await startAtWith(page, 'plaza', ON_MAIN_PATH, { minutes: at(10), energy: 50 });
  await press(page, 'Shift');

  // Algo más de 6 segundos corriendo, de ida y vuelta por el camino.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3200);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(3200);
  await page.keyboard.up('ArrowLeft');

  expect((await currentGameState(page))?.energy).toBe(48);
});

test('Escenario 3: Correr sin moverse no gasta', async ({ page }) => {
  await startAtWith(page, 'plaza', ON_MAIN_PATH, { minutes: at(10), energy: 50 });
  await press(page, 'Shift');

  await page.waitForTimeout(6000);

  expect((await currentGameState(page))?.energy).toBe(50);
});

test('Escenario 4: Demasiado cansado para correr', async ({ page }) => {
  await startAtWith(page, 'plaza', ON_MAIN_PATH, { minutes: at(10), energy: 11 });
  await press(page, 'Shift');
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => velocityX(page), { intervals: [25] }).toBe(WALK_SPEED * 1.5);

  await waitForHudText(page, 'Estás demasiado cansado para correr', 5000);

  expect((await currentGameState(page))?.energy).toBe(10);
  await expect.poll(() => velocityX(page), { intervals: [25] }).toBe(WALK_SPEED);
  await page.keyboard.up('ArrowRight');
});

test('Escenario 5: Mayús sin energía', async ({ page }) => {
  await startAtWith(page, 'plaza', ON_MAIN_PATH, { minutes: at(10), energy: 8 });

  await press(page, 'Shift');

  await waitForHudText(page, 'Estás demasiado cansado para correr');
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => velocityX(page), { intervals: [25] }).toBe(WALK_SPEED);
  await page.keyboard.up('ArrowRight');
});
