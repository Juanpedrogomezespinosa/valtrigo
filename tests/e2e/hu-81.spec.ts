import { expect, test } from './fixtures';
import { at, currentGameState, isChangingZone, openOptionsAt, optionsView, press, startAtWith, startWith, waitForZone } from './helpers';

// HU-81. Correr
// La partida empieza en la plaza (20, 17), con espacio libre a la derecha. La velocidad normal es de 64 px/s
// (4 casillas por segundo, HU-06) y al correr, 1,5 veces más. Mayús activa y desactiva correr.

const WALK_SPEED = 64;
const RUN_SPEED = WALK_SPEED * 1.5;

async function velocity(page: import('@playwright/test').Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const { body } = (game.scene.getScene('GameScene') as unknown as { player: { body: { velocity: { x: number; y: number } } } }).player;
    return { x: body.velocity.x, y: body.velocity.y };
  });
}

test('Escenario 1: Activar correr', async ({ page }) => {
  await startWith(page, {});

  await press(page, 'Shift');
  await page.keyboard.down('ArrowRight');

  await expect.poll(async () => (await velocity(page)).x, { intervals: [25] }).toBe(RUN_SPEED);
  expect((await velocity(page)).y).toBe(0);
});

test('Escenario 2: Desactivar correr', async ({ page }) => {
  await startWith(page, {});
  await press(page, 'Shift');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await velocity(page)).x, { intervals: [25] }).toBe(RUN_SPEED);

  await press(page, 'Shift');

  await expect.poll(async () => (await velocity(page)).x, { intervals: [25] }).toBe(WALK_SPEED);
});

test('Escenario 3: Mayús no mueve', async ({ page }) => {
  await startWith(page, {});
  const before = (await currentGameState(page))!.position;

  await press(page, 'Shift');
  await page.waitForTimeout(500);

  expect(await velocity(page)).toEqual({ x: 0, y: 0 });
  expect((await currentGameState(page))!.position).toEqual(before);
});

test('Escenario 4: Andar no gasta energía', async ({ page }) => {
  await startWith(page, { energy: 50 });

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowRight');

  expect((await currentGameState(page))!.energy).toBe(50);
});

test('Escenario 5: Al cambiar de zona', async ({ page }) => {
  // Frente a la puerta de la tienda, en la plaza.
  await startAtWith(page, 'plaza', { x: 31, y: 12 }, { minutes: at(10) });
  await press(page, 'Shift');

  await page.keyboard.down('ArrowUp');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowUp');
  await waitForZone(page, 'tienda');

  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await velocity(page)).x, { intervals: [25] }).toBe(-RUN_SPEED);
});

test('Escenario 6: Controles', async ({ page }) => {
  await openOptionsAt(page, 'Música');

  expect((await optionsView(page))?.controls).toContainEqual(['Correr', 'Mayús']);
});
