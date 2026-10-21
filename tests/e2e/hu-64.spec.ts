import { expect, test } from './fixtures';
import { at, dialogState, isChangingZone, playerTile, press, startAtWith, waitForZone } from './helpers';

// HU-64. Horario de la relojera
// La puerta de la torre está en la casilla (19, 6) de la plaza. El horario de la relojera está en
// src/data/schedules.json (de 09:00 a 22:00).

const BELOW_TOWER_DOOR = { x: 19, y: 8 };
const NOTICE = 'La relojera viene a la torre de 9:00 a 22:00';

async function enterTower(page: import('@playwright/test').Page): Promise<void> {
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowUp');
  await waitForZone(page, 'torre');
}

test('Escenario 1: Primera visita', async ({ page }) => {
  await startAtWith(page, 'plaza', BELOW_TOWER_DOOR, { day: 5, minutes: at(8), visitedZones: [] });

  await enterTower(page);

  await expect.poll(async () => (await dialogState(page))?.fullText, { intervals: [25] }).toBe(NOTICE);
});

test('Escenario 2: Cerrar el aviso', async ({ page }) => {
  await startAtWith(page, 'plaza', BELOW_TOWER_DOOR, { day: 5, minutes: at(8), visitedZones: [] });
  await enterTower(page);
  await expect.poll(async () => (await dialogState(page))?.fullText, { intervals: [25] }).toBe(NOTICE);

  await press(page, 'e');

  expect(await dialogState(page)).toBeNull();
  const before = await playerTile(page);
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await playerTile(page)).y, { intervals: [25] }).toBeLessThan(before.y);
  await page.keyboard.up('ArrowUp');
});

test('Escenario 3: Visitas siguientes', async ({ page }) => {
  // Partida guardada en la que ya se había entrado en la torre.
  await startAtWith(page, 'plaza', BELOW_TOWER_DOOR, { day: 5, minutes: at(8), visitedZones: ['torre'] });

  await enterTower(page);
  await page.waitForTimeout(300);

  expect(await dialogState(page)).toBeNull();
});
