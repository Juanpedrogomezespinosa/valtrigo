import { expect, test } from './fixtures';
import { cameraInfo, isChangingZone, playerInfo, startAt, startNewGame, waitForZone } from './helpers';

// HU-09. Cámara que sigue al personaje

const TILE = 16;
// La plaza mide 40×30 casillas y la casa 12×9.
const PLAZA = { width: 40 * TILE, height: 30 * TILE };
const CASA = { width: 12 * TILE, height: 9 * TILE };

test('Escenario 1: Seguimiento en una zona grande', async ({ page }) => {
  await startNewGame(page); // centro de la plaza, que es más grande que la pantalla
  const before = await cameraInfo(page);

  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(200);
    const during = await cameraInfo(page);
    expect(during.playerOnScreen.x).toBeCloseTo(during.screen.width / 2, -1);
    expect(during.playerOnScreen.y).toBeCloseTo(during.screen.height / 2, -1);
  }
  await page.keyboard.up('ArrowRight');

  const after = await cameraInfo(page);
  expect(after.view.left).toBeGreaterThan(before.view.left);
});

test('Escenario 2: Borde del mapa', async ({ page }) => {
  // Fila 14 de la plaza: casillas 2 a 5 libres, y en las casillas 0 y 1 hay árboles en el borde.
  await startAt(page, 'plaza', { x: 4, y: 14 });

  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowLeft');

  const camera = await cameraInfo(page);
  expect(camera.view.left).toBe(0);
  expect(camera.view.top).toBeGreaterThanOrEqual(0);
  expect(camera.view.right).toBeLessThanOrEqual(PLAZA.width);
  expect(camera.view.bottom).toBeLessThanOrEqual(PLAZA.height);
  // Con la cámara en el borde, el personaje ya no está centrado: queda a la izquierda.
  expect(camera.playerOnScreen.x).toBeLessThan(camera.screen.width / 2);
});

test('Escenario 3: Zona más pequeña que la pantalla', async ({ page }) => {
  await startAt(page, 'casa', { x: 3, y: 4 });
  const before = await cameraInfo(page);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowDown');

  const after = await cameraInfo(page);
  expect(after.view).toEqual(before.view);

  // La casa se ve completa y centrada.
  expect(after.view.left).toBeLessThanOrEqual(0);
  expect(after.view.top).toBeLessThanOrEqual(0);
  expect(after.view.right).toBeGreaterThanOrEqual(CASA.width);
  expect(after.view.bottom).toBeGreaterThanOrEqual(CASA.height);
  expect((after.view.left + after.view.right) / 2).toBeCloseTo(CASA.width / 2, 0);
  expect((after.view.top + after.view.bottom) / 2).toBeCloseTo(CASA.height / 2, 0);
});

test('Escenario 4: Cambio de zona', async ({ page }) => {
  // Salir de la tienda a la plaza: se aparece en la casilla (31, 11), cerca del borde derecho del mapa.
  await startAt(page, 'tienda', { x: 6, y: 6 });

  await page.keyboard.down('ArrowDown');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowDown');
  await waitForZone(page, 'plaza');

  // Nada más terminar el fundido, la cámara ya sigue al personaje en la plaza, sin salirse del mapa.
  const camera = await cameraInfo(page);
  const player = await playerInfo(page);
  const viewWidth = camera.view.right - camera.view.left;
  const viewHeight = camera.view.bottom - camera.view.top;
  const expectedLeft = Math.min(Math.max(player.x - viewWidth / 2, 0), PLAZA.width - viewWidth);
  const expectedTop = Math.min(Math.max(player.y - viewHeight / 2, 0), PLAZA.height - viewHeight);
  expect(camera.view.left).toBeCloseTo(expectedLeft, -1);
  expect(camera.view.top).toBeCloseTo(expectedTop, -1);
});
