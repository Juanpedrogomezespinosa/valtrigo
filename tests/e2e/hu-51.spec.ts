import { expect, test } from './fixtures';
import { at, audioState, isChangingZone, playerTile, startAtWith, waitForZone } from './helpers';

// HU-51. Nueva zona: el bosque
// En el lago, el camino del oeste sale por el borde izquierdo (filas 11 y 12) y se llega al lago en (1, 11).
// En el bosque, la salida hacia el lago está en el borde derecho (filas 10 y 11) y se llega al bosque en (28, 10).

async function walkThroughDoor(page: import('@playwright/test').Page, key: string, zone: string): Promise<void> {
  await page.keyboard.down(key);
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up(key);
  await waitForZone(page, zone);
}

test('Escenario 1: Entrar al bosque', async ({ page }) => {
  await startAtWith(page, 'lago', { x: 3, y: 11 }, { minutes: at(10) });

  await walkThroughDoor(page, 'ArrowLeft', 'bosque');

  expect(await playerTile(page)).toEqual({ x: 28, y: 10 });
  // La pista se descarga la primera vez que se entra (HU-31).
  await expect.poll(async () => (await audioState(page)).music, { timeout: 10_000 }).toBe('music-bosque');
});

test('Escenario 2: Volver al lago', async ({ page }) => {
  await startAtWith(page, 'bosque', { x: 26, y: 10 }, { minutes: at(10) });

  await walkThroughDoor(page, 'ArrowRight', 'lago');

  expect(await playerTile(page)).toEqual({ x: 1, y: 11 });
});
