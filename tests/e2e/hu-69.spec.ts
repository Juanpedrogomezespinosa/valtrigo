import { expect, test } from './fixtures';
import { obstacleGrid, playerBody, startAt } from './helpers';

// HU-69. Árboles completos
// Casillas de árbol de Tiny Town, con su índice en el mapa (el de la hoja más 1): los árboles altos tienen
// copa y tronco; los pequeños ocupan una sola casilla.
const TALL = {
  verde: { top: 5, bottom: 17 },
  otoñal: { top: 4, bottom: 16 },
};
const TOPS = Object.values(TALL).map(({ top }) => top);
const BOTTOMS = Object.values(TALL).map(({ bottom }) => bottom);
const EXTERIORS: [string, { x: number; y: number }][] = [
  ['plaza', { x: 20, y: 17 }],
  ['granja', { x: 1, y: 11 }],
  ['lago', { x: 15, y: 5 }],
  ['bosque', { x: 28, y: 10 }],
];
const TILE = 16;

// Copa y tronco de los árboles altos de la zona: la casilla de debajo de cada copa y la de encima de cada tronco.
async function tallTrees(page: import('@playwright/test').Page) {
  const grid = await obstacleGrid(page);
  const at = (x: number, y: number) => grid[y]?.[x] ?? -1;
  const tops: { top: number; below: number }[] = [];
  const bottoms: { bottom: number; above: number }[] = [];
  grid.forEach((row, y) =>
    row.forEach((index, x) => {
      if (TOPS.includes(index)) tops.push({ top: index, below: at(x, y + 1) });
      if (BOTTOMS.includes(index)) bottoms.push({ bottom: index, above: at(x, y - 1) });
    }),
  );
  return { tops, bottoms };
}

test('Escenario 1: Árboles altos completos', async ({ page }) => {
  for (const [zone, position] of EXTERIORS) {
    await startAt(page, zone, position);
    const { tops } = await tallTrees(page);

    // Hay árboles altos, y debajo de cada copa está el tronco del mismo árbol (mismo color).
    expect(tops.length, zone).toBeGreaterThan(0);
    for (const { top, below } of tops) {
      const tree = Object.values(TALL).find((candidate) => candidate.top === top)!;
      expect(below, zone).toBe(tree.bottom);
    }
  }
});

test('Escenario 2: Ningún árbol cortado', async ({ page }) => {
  for (const [zone, position] of EXTERIORS) {
    await startAt(page, zone, position);
    const { tops, bottoms } = await tallTrees(page);

    // Ninguna copa sin su tronco debajo ni ningún tronco sin su copa encima.
    for (const { top, below } of tops) {
      expect(below, zone).toBe(Object.values(TALL).find((tree) => tree.top === top)!.bottom);
    }
    for (const { bottom, above } of bottoms) {
      expect(above, zone).toBe(Object.values(TALL).find((tree) => tree.bottom === bottom)!.top);
    }
  }
});

test('Escenario 3: Árboles sólidos', async ({ page }) => {
  // En la plaza hay un árbol alto con la copa en (11, 2) y el tronco en (11, 3). Debajo, las casillas están libres.
  await startAt(page, 'plaza', { x: 11, y: 6 });
  const grid = await obstacleGrid(page);
  expect(TOPS).toContain(grid[2][11]);
  expect(BOTTOMS).toContain(grid[3][11]);

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1200);
  const first = await playerBody(page);
  await page.waitForTimeout(300);
  const second = await playerBody(page);
  await page.keyboard.up('ArrowUp');

  // Se detiene justo debajo del tronco, sin superponerse.
  expect(second.top).toBeCloseTo(4 * TILE, 0);
  expect(second.top).toBeGreaterThanOrEqual(4 * TILE);
  expect(second.top).toBe(first.top);
});
