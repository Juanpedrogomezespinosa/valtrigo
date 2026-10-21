import { expect, test } from './fixtures';
import { openPause, playerInfo, startNewGame } from './helpers';

// HU-06. Mover al personaje con el teclado
// La posición de inicio de la partida nueva está en la plaza, con espacio libre alrededor.

test('Escenario 1: Movimiento con las flechas', async ({ page }) => {
  await startNewGame(page);
  const start = await playerInfo(page);

  await page.keyboard.down('ArrowRight');
  // Muestras tomadas dentro del navegador cada ~250 ms, con la hora real de cada una. Desde Playwright las
  // esperas se alargan si el equipo va cargado y el tramo parecería más largo de lo que es.
  const samples = await page.evaluate(
    () =>
      new Promise<{ t: number; x: number; y: number; vx: number; facing: string }[]>((resolve) => {
        const game = (window as unknown as { game: import('phaser').Game }).game;
        const player = (game.scene.getScene('GameScene') as unknown as {
          player: { x: number; y: number; facing: string; body: { velocity: { x: number } } };
        }).player;
        const result: { t: number; x: number; y: number; vx: number; facing: string }[] = [];
        let next = performance.now() + 250;
        const sample = (now: number) => {
          if (now >= next) {
            result.push({ t: now, x: player.x, y: player.y, vx: player.body.velocity.x, facing: player.facing });
            next += 250;
          }
          if (result.length < 4) requestAnimationFrame(sample);
          else resolve(result);
        };
        requestAnimationFrame(sample);
      }),
  );
  await page.keyboard.up('ArrowRight');

  const end = samples[samples.length - 1];
  expect(end.x).toBeGreaterThan(start.x);
  expect(end.y).toBe(start.y);
  expect(end.facing).toBe('right');

  // Velocidad constante: la misma en todas las muestras, y lo que avanza por segundo es parejo entre tramos.
  const speeds = samples.map((sample) => sample.vx);
  expect(new Set(speeds).size).toBe(1);
  expect(speeds[0]).toBeGreaterThan(0);
  const rates = samples.slice(1).map((sample, i) => (sample.x - samples[i].x) / ((sample.t - samples[i].t) / 1000));
  for (const rate of rates) {
    expect(rate).toBeGreaterThan(rates[0] * 0.6);
    expect(rate).toBeLessThan(rates[0] * 1.4);
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
