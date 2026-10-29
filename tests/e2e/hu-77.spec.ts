import { expect, test } from './fixtures';
import { at, currentGameState, litSlabs, moveTo, placePlayer, startAtWith, waitForHudText } from './helpers';

// HU-77. Las losas del bosque
// Las losas ocupan las casillas 3 a 5 y las filas 15 a 17 del bosque. Se entra por la esquina de arriba a la
// izquierda, desde el sendero (3, 14). Para encenderlas todas sin repetir, se recorren en zigzag.
// El personaje se coloca en cada losa con placePlayer: el test comprueba qué pasa al pisarlas, no el movimiento.

const ENTRANCE = { x: 3, y: 14 };
const ZIGZAG = [
  { x: 3, y: 15 },
  { x: 4, y: 15 },
  { x: 5, y: 15 },
  { x: 5, y: 16 },
  { x: 4, y: 16 },
  { x: 3, y: 16 },
  { x: 3, y: 17 },
  { x: 4, y: 17 },
  { x: 5, y: 17 },
];

async function walk(page: import('@playwright/test').Page, steps: number): Promise<void> {
  for (const tile of ZIGZAG.slice(0, steps)) {
    await placePlayer(page, tile);
  }
}

test('Escenario 1: Encender una losa', async ({ page }) => {
  await startAtWith(page, 'bosque', ENTRANCE, { day: 3, minutes: at(10) });

  await walk(page, 1);

  expect(await litSlabs(page)).toEqual(['3,15']);
});

test('Escenario 2: Pisar una losa encendida', async ({ page }) => {
  await startAtWith(page, 'bosque', ENTRANCE, { day: 3, minutes: at(10) });
  await walk(page, 3);
  expect(await litSlabs(page)).toHaveLength(3);

  await placePlayer(page, { x: 4, y: 15 });

  expect(await litSlabs(page)).toEqual([]);
  await waitForHudText(page, 'Las losas se apagan');
});

test('Escenario 3: Resolver el acertijo', async ({ page }) => {
  await startAtWith(page, 'bosque', ENTRANCE, { day: 3, minutes: at(10), money: 100, inventory: [] });
  await walk(page, 8);
  expect(await litSlabs(page)).toHaveLength(8);

  await placePlayer(page, ZIGZAG[8]);

  await waitForHudText(page, 'Las losas brillan');
  const state = await currentGameState(page);
  expect(state?.money).toBe(160);
  expect(state?.inventory).toEqual([{ item: 'semilla-de-calabaza', quantity: 2 }]);
  expect(state?.solvedPuzzles).toEqual(['losas']);
});

test('Escenario 4: Acertijo resuelto', async ({ page }) => {
  await startAtWith(page, 'bosque', ENTRANCE, { day: 3, minutes: at(10), money: 100, inventory: [], solvedPuzzles: ['losas'] });
  expect(await litSlabs(page)).toHaveLength(9);

  await walk(page, 2);

  expect(await litSlabs(page)).toHaveLength(9);
  expect((await currentGameState(page))?.money).toBe(100);
});

test('Escenario 5: Salir del bosque', async ({ page }) => {
  await startAtWith(page, 'bosque', ENTRANCE, { day: 3, minutes: at(10) });
  await walk(page, 4);
  expect(await litSlabs(page)).toHaveLength(4);

  await moveTo(page, 'lago', { x: 3, y: 11 });
  await moveTo(page, 'bosque', ENTRANCE);

  expect(await litSlabs(page)).toEqual([]);
});
