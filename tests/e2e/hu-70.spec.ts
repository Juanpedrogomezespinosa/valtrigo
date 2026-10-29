import { expect, test } from './fixtures';
import { at, audioState, currentGameState, dialogState, isChangingZone, playerTile, press, startAtWith, waitForZone } from './helpers';

// HU-70. Nueva zona: el barrio
// En la plaza, el camino del oeste sale por el borde izquierdo (filas 13 a 15) y se llega a la plaza en (1, 14).
// En el barrio, la salida hacia la plaza está en el borde derecho (filas 10 a 12) y se llega al barrio en (28, 11).
// Puertas del barrio: casa de Tomás y Pablo (6, 7), casa de Lucía (16, 7), casa de Rosa (6, 16), casa de Fran
// (16, 16) y casa de Elena (23, 16). El cartel de la casa de Tomás y Pablo está en (4, 7).

async function walkThroughDoor(page: import('@playwright/test').Page, key: string, zone: string): Promise<void> {
  await page.keyboard.down(key);
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up(key);
  await waitForZone(page, zone);
}

test('Escenario 1: Entrar al barrio', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 3, y: 14 }, { minutes: at(10) });

  await walkThroughDoor(page, 'ArrowLeft', 'barrio');

  expect(await playerTile(page)).toEqual({ x: 28, y: 11 });
  // Su propia música (HU-31).
  await expect.poll(async () => (await audioState(page)).music, { timeout: 10_000 }).toBe('music-barrio');
});

test('Escenario 2: Volver a la plaza', async ({ page }) => {
  await startAtWith(page, 'barrio', { x: 26, y: 11 }, { minutes: at(10) });

  await walkThroughDoor(page, 'ArrowRight', 'plaza');

  expect(await playerTile(page)).toEqual({ x: 1, y: 14 });
});

test('Escenario 3: Entrar en una casa', async ({ page }) => {
  await startAtWith(page, 'barrio', { x: 16, y: 9 }, { minutes: at(10) });

  await walkThroughDoor(page, 'ArrowUp', 'casa-lucia');

  // Las casas usan la música de la casa del jugador.
  await expect.poll(async () => (await audioState(page)).music, { timeout: 10_000 }).toBe('music-casa');
});

test('Escenario 4: Casa cerrada', async ({ page }) => {
  await startAtWith(page, 'barrio', { x: 6, y: 18 }, { minutes: at(10) });

  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await dialogState(page))?.fullText, { intervals: [25] }).toBe('La puerta está cerrada');
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(700); // más que el fundido de un cambio de zona

  expect(await isChangingZone(page)).toBe(false);
  expect((await currentGameState(page))?.zone).toBe('barrio');
});

test('Escenario 5: Carteles de las casas', async ({ page }) => {
  await startAtWith(page, 'barrio', { x: 4, y: 8 }, { minutes: at(10) });

  await press(page, 'e');

  const dialog = await dialogState(page);
  expect(dialog?.speaker).toBe('cartel');
  expect(dialog?.fullText).toBe('Casa de Tomás y Pablo');
});
