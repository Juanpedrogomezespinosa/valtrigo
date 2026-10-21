import { expect, test } from './fixtures';
import { at, currentGameState, dialogState, isChangingZone, playerTile, press, startAtWith, waitForZone } from './helpers';

// HU-57. Torre cerrada hasta el día 5
// La puerta de la torre está en la casilla (19, 6) de la plaza. Se llega a ella caminando hacia arriba.

const BELOW_TOWER_DOOR = { x: 19, y: 8 };

test('Escenario 1: Antes del día 5', async ({ page }) => {
  await startAtWith(page, 'plaza', BELOW_TOWER_DOOR, { day: 4, minutes: at(10) });

  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await dialogState(page))?.fullText, { intervals: [25] }).toBe('La torre está cerrada');
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(700); // más que el fundido de un cambio de zona

  expect(await isChangingZone(page)).toBe(false);
  expect((await currentGameState(page))?.zone).toBe('plaza');
});

test('Escenario 2: Cerrar el aviso', async ({ page }) => {
  await startAtWith(page, 'plaza', BELOW_TOWER_DOOR, { day: 4, minutes: at(10) });
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await dialogState(page))?.fullText, { intervals: [25] }).toBe('La torre está cerrada');
  await page.keyboard.up('ArrowUp');

  await press(page, 'e');

  expect(await dialogState(page)).toBeNull();
  // Puede moverse: se aleja de la puerta sin que el aviso vuelva a aparecer.
  const before = await playerTile(page);
  await page.keyboard.down('ArrowDown');
  await expect.poll(async () => (await playerTile(page)).y, { intervals: [25] }).toBeGreaterThan(before.y);
  await page.keyboard.up('ArrowDown');
  expect(await dialogState(page)).toBeNull();
});

test('Escenario 3: Desde el día 5', async ({ page }) => {
  await startAtWith(page, 'plaza', BELOW_TOWER_DOOR, { day: 5, minutes: at(10) });

  await page.keyboard.down('ArrowUp');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowUp');

  await waitForZone(page, 'torre');
  expect(await dialogState(page)).toBeNull();
});
