import { expect, test } from './fixtures';
import { playerBody, playerInfo, playerTile, startAt } from './helpers';

// HU-07. Colisiones con obstáculos

const TILE = 16;

test('Escenario 1: Árbol', async ({ page }) => {
  // En la plaza hay un árbol en la casilla (11, 3) y libres las casillas a su izquierda.
  await startAt(page, 'plaza', { x: 8, y: 3 });
  const treeLeft = 11 * TILE;

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1500); // de sobra para llegar al árbol
  const first = await playerBody(page);
  await page.waitForTimeout(300);
  const second = await playerBody(page);
  await page.keyboard.up('ArrowRight');

  // Se detiene justo al lado del árbol, sin superponerse.
  expect(second.right).toBeCloseTo(treeLeft, 0);
  expect(second.right).toBeLessThanOrEqual(treeLeft);
  expect(second.left).toBe(first.left);
});

test('Escenario 2: Agua', async ({ page }) => {
  // En el lago, el agua empieza en la fila 8 bajo el camino que llega desde la plaza.
  await startAt(page, 'lago', { x: 15, y: 5 });
  const shore = 8 * TILE;

  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(1200);
  const first = await playerBody(page);
  await page.waitForTimeout(300);
  const second = await playerBody(page);
  await page.keyboard.up('ArrowDown');

  // Se detiene en la orilla, sin entrar en el agua.
  expect(second.bottom).toBeCloseTo(shore, 0);
  expect(second.bottom).toBeLessThanOrEqual(shore);
  expect(second.top).toBe(first.top);
});

test('Escenario 3: Dirección libre con otra bloqueada', async ({ page }) => {
  // En la casa del jugador, la casilla (5, 2) tiene el muro justo encima y espacio libre a la derecha.
  await startAt(page, 'casa', { x: 5, y: 2 });
  // Primero se acerca hasta tocar el muro.
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowUp');
  const before = await playerInfo(page);
  expect((await playerBody(page)).top).toBe(2 * TILE);

  // Arriba se pulsa la última, así que es la que mandaría, pero está bloqueada.
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(400);
  const after = await playerInfo(page);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');

  expect(after.x).toBeGreaterThan(before.x);
  expect(after.y).toBe(before.y);
});

test('Escenario 4: NPC en el camino', async ({ page }) => {
  // El alcalde está en la plaza, en la casilla (24, 13). El personaje empieza dos casillas a su izquierda.
  await startAt(page, 'plaza', { x: 22, y: 13 });
  const npcLeft = 24 * TILE + 1; // cuerpo de 14×14 centrado en su casilla

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(800);
  const first = await playerBody(page);
  await page.waitForTimeout(300);
  const second = await playerBody(page);
  await page.keyboard.up('ArrowRight');

  // Se detiene junto al NPC, sin superponerse.
  expect(second.right).toBeCloseTo(npcLeft, 0);
  expect(second.right).toBeLessThanOrEqual(npcLeft);
  expect(second.left).toBe(first.left);
});

test('Escenario 5: Hueco estrecho', async ({ page }) => {
  // En la granja, la entrada del cercado del granero es la casilla (6, 9), entre dos muros de piedra. El
  // personaje empieza debajo, en (6, 10), desviado 5 px a la izquierda: su cuerpo pisa el muro de la izquierda.
  await startAt(page, 'granja', { x: 6, y: 10 });
  await page.evaluate(() => {
    const player = (window as unknown as { game: import('phaser').Game }).game.scene.getScene('GameScene') as unknown as {
      player: { x: number; y: number; body: { reset(x: number, y: number): void } };
    };
    player.player.body.reset(player.player.x - 5, player.player.y);
  });

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1200);
  await page.keyboard.up('ArrowUp');

  // Se ha alineado con la entrada (el cuerpo cabe entero en la casilla 6) y está dentro del cercado.
  const body = await playerBody(page);
  expect(body.left).toBeGreaterThanOrEqual(6 * TILE);
  expect(body.right).toBeLessThanOrEqual(7 * TILE);
  expect((await playerTile(page)).y).toBeLessThanOrEqual(8);
});

