import { expect, test } from './fixtures';
import { at, crates, currentGameState, moveTo, placePlayer, pushCrateTo, startAtWith, waitForHudText } from './helpers';

// HU-79. Las cajas del granero
// Corral de la granja: interior en las casillas 16 a 20 y filas 14 a 17, con la entrada arriba (18, 13) y el cartel en (20, 12).
// Cajas en (17, 15) y (19, 15), marcas en (16, 17) y (20, 17) y un barril en (18, 17).
// Solución: cada caja se empuja hacia fuera (izquierda o derecha) y después hacia abajo hasta su marca.
// El personaje se coloca junto a la caja con placePlayer y la empuja con el teclado.

type Page = import('@playwright/test').Page;

async function placeLeftCrate(page: Page): Promise<void> {
  await placePlayer(page, { x: 18, y: 15 });
  await pushCrateTo(page, 'ArrowLeft', 0, { x: 16, y: 15 });
  await placePlayer(page, { x: 16, y: 14 });
  await pushCrateTo(page, 'ArrowDown', 0, { x: 16, y: 17 });
}

test('Escenario 1: Empujar una caja', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 17, y: 14 }, { day: 2, minutes: at(10) });

  await pushCrateTo(page, 'ArrowDown', 0, { x: 17, y: 16 });

  expect(await crates(page)).toEqual([{ x: 17, y: 16 }, { x: 19, y: 15 }]);
});

test('Escenario 2: Caja bloqueada', async ({ page }) => {
  // La caja de la izquierda bajada hasta la última fila: detrás está la valla.
  await startAtWith(page, 'granja', { x: 17, y: 14 }, { day: 2, minutes: at(10) });
  await pushCrateTo(page, 'ArrowDown', 0, { x: 17, y: 17 });

  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowDown');

  expect((await crates(page))[0]).toEqual({ x: 17, y: 17 });
});

test('Escenario 3: Resolver el acertijo', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 18, y: 14 }, { day: 2, minutes: at(10), money: 100, inventory: [] });
  await placeLeftCrate(page);
  expect((await crates(page))[0]).toEqual({ x: 16, y: 17 }); // una caja ya está sobre su marca

  await placePlayer(page, { x: 18, y: 15 });
  await pushCrateTo(page, 'ArrowRight', 1, { x: 20, y: 15 });
  await placePlayer(page, { x: 20, y: 14 });
  await pushCrateTo(page, 'ArrowDown', 1, { x: 20, y: 17 });

  await waitForHudText(page, 'Las cajas están en su sitio');
  const state = await currentGameState(page);
  expect(state?.money).toBe(150);
  expect(state?.inventory).toEqual([{ item: 'semilla-de-zanahoria', quantity: 3 }]);
  expect(state?.solvedPuzzles).toEqual(['cajas']);
});

test('Escenario 4: Volver a empezar', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 17, y: 14 }, { day: 2, minutes: at(10) });
  await pushCrateTo(page, 'ArrowDown', 0, { x: 17, y: 16 });

  await moveTo(page, 'plaza', { x: 20, y: 17 });
  await moveTo(page, 'granja', { x: 17, y: 12 });

  expect(await crates(page)).toEqual([{ x: 17, y: 15 }, { x: 19, y: 15 }]);
});
