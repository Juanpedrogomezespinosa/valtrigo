import { expect, test } from '@playwright/test';
import { cameraInfo, startAt, startNewGame } from './helpers';

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

// Pendiente: los cambios de zona por puertas se implementan en HU-08.
test.fixme('Escenario 4: Cambio de zona', async () => {
  // Cruzar una puerta y comprobar que, al terminar el fundido, la cámara ya está centrada en la nueva zona.
});
