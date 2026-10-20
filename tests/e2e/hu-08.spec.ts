import { expect, test } from './fixtures';
import { isChangingZone, measureZoneChange, playerTile, startAt, waitForZone } from './helpers';

// HU-08. Cambiar de zona
// En la plaza, la puerta de la tienda está en la casilla (31, 10) y se llega a la plaza en la (31, 11).
// En la tienda, la puerta de salida está en la (6, 8) y se llega a la tienda en la (6, 7).

test('Escenario 1: Entrar a la tienda', async ({ page }) => {
  await startAt(page, 'plaza', { x: 31, y: 12 });

  const change = await measureZoneChange(page, async () => {
    await page.keyboard.down('ArrowUp');
    await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
    await page.keyboard.up('ArrowUp');
  });

  // A mitad de la transición la pantalla se está fundiendo a negro, y el fundido dura 0,5 s.
  expect(change.halfway.running).toBe(true);
  expect(change.halfway.towardsBlack).toBe(true);
  expect(change.halfway.progress).toBeGreaterThan(0);
  expect(change.halfway.progress).toBeLessThan(1);
  expect(change.duration).toBeGreaterThanOrEqual(480);
  expect(change.duration).toBeLessThan(700);

  await waitForZone(page, 'tienda');
  expect(await playerTile(page)).toEqual({ x: 6, y: 7 }); // junto a la puerta de salida
});

test('Escenario 2: Salir de la tienda', async ({ page }) => {
  await startAt(page, 'tienda', { x: 6, y: 6 });

  await page.keyboard.down('ArrowDown');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowDown');

  await waitForZone(page, 'plaza');
  expect(await playerTile(page)).toEqual({ x: 31, y: 11 }); // junto a la puerta de la tienda
});

test('Escenario 3: Transición en curso', async ({ page }) => {
  await startAt(page, 'plaza', { x: 31, y: 12 });

  const change = await measureZoneChange(page, async () => {
    await page.keyboard.down('ArrowUp');
    await page.waitForFunction(() => {
      const game = (window as unknown as { game: import('phaser').Game }).game;
      return (game.scene.getScene('GameScene') as unknown as { isChangingZone(): boolean }).isChangingZone();
    });
    // Durante el fundido se pulsan otras flechas.
    await page.keyboard.down('ArrowLeft');
    await page.keyboard.down('ArrowRight');
  });
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowUp');

  // Las flechas llegaron durante el fundido y el personaje no se movió hasta que terminó.
  expect(change.arrowPresses.length).toBeGreaterThan(0);
  const first = change.positions[0];
  for (const position of change.positions) {
    expect(position).toEqual(first);
  }

  await waitForZone(page, 'tienda');
  expect(await playerTile(page)).toEqual({ x: 6, y: 7 });
});
