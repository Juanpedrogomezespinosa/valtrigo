import { expect, test } from './fixtures';
import { openPause, playerInfo, startNewGame } from './helpers';

// HU-06. Mover al personaje con el teclado
// La posición de inicio de la partida nueva está en la plaza, con espacio libre alrededor.

test('Escenario 1: Movimiento con las flechas', async ({ page }) => {
  await startNewGame(page);
  const start = await playerInfo(page);

  await page.keyboard.down('ArrowRight');
  const samples = [];
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(250);
    samples.push(await playerInfo(page));
  }
  await page.keyboard.up('ArrowRight');

  const end = samples[samples.length - 1];
  expect(end.x).toBeGreaterThan(start.x);
  expect(end.y).toBe(start.y);
  expect(end.facing).toBe('right');

  // Velocidad constante: la misma en todas las muestras, y el desplazamiento crece de forma pareja.
  const speeds = samples.map((sample) => sample.velocity.x);
  expect(new Set(speeds).size).toBe(1);
  expect(speeds[0]).toBeGreaterThan(0);
  const steps = samples.slice(1).map((sample, i) => sample.x - samples[i].x);
  for (const step of steps) {
    expect(step).toBeGreaterThan(steps[0] * 0.6);
    expect(step).toBeLessThan(steps[0] * 1.4);
  }
});

test('Escenario 2: Movimiento con WASD', async ({ page }) => {
  await startNewGame(page);
  const start = await playerInfo(page);

  await page.keyboard.down('w');
  await page.waitForTimeout(300);
  await page.keyboard.up('w');

  const end = await playerInfo(page);
  expect(end.y).toBeLessThan(start.y);
  expect(end.x).toBe(start.x);
  expect(end.facing).toBe('up');
});

test('Escenario 3: Dos direcciones a la vez', async ({ page }) => {
  await startNewGame(page);

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(100);
  const before = await playerInfo(page);
  await page.waitForTimeout(300);
  const after = await playerInfo(page);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowUp');

  expect(after.x).toBeGreaterThan(before.x);
  expect(after.y).toBe(before.y); // sin diagonales
  expect(after.facing).toBe('right');
});

test('Escenario 4: Movimiento bloqueado en pausa', async ({ page }) => {
  await startNewGame(page);
  await openPause(page);
  const before = await playerInfo(page);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');

  const after = await playerInfo(page);
  expect(after.x).toBe(before.x);
  expect(after.y).toBe(before.y);
});
