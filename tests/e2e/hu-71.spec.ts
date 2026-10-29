import { expect, test } from './fixtures';
import { at, dialogState, isChangingZone, isNpcPresent, press, startAtWith, waitForDialogLineComplete, waitForZone } from './helpers';

// HU-71. Los vecinos
// Se entra en cada zona por su puerta: en la plaza, saliendo de la tienda (6, 8 hacia abajo); en el barrio, por
// el camino del oeste de la plaza; en la granja, por el camino del este de la plaza; y en el bosque, por el
// camino del oeste del lago.

async function walkThroughDoor(page: import('@playwright/test').Page, key: string, zone: string): Promise<void> {
  await page.keyboard.down(key);
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up(key);
  await waitForZone(page, zone);
}

test('Escenario 1: Vecino en su sitio', async ({ page }) => {
  await startAtWith(page, 'tienda', { x: 6, y: 6 }, { day: 2, minutes: at(10) });

  await walkThroughDoor(page, 'ArrowDown', 'plaza');

  expect(await isNpcPresent(page, 'tomas')).toBe(true);
});

test('Escenario 2: Vecino que cambia de zona', async ({ page, context }) => {
  await startAtWith(page, 'plaza', { x: 3, y: 14 }, { day: 2, minutes: at(14) });

  await walkThroughDoor(page, 'ArrowLeft', 'barrio');

  expect(await isNpcPresent(page, 'tomas')).toBe(true);

  // A la misma hora, en la plaza no está.
  const plaza = await context.newPage();
  await startAtWith(plaza, 'plaza', { x: 20, y: 17 }, { day: 2, minutes: at(14) });
  expect(await isNpcPresent(plaza, 'tomas')).toBe(false);
});

test('Escenario 3: Bruno en el bosque', async ({ page }) => {
  await startAtWith(page, 'lago', { x: 3, y: 11 }, { day: 3, minutes: at(10) });

  await walkThroughDoor(page, 'ArrowLeft', 'bosque');

  expect(await isNpcPresent(page, 'bruno')).toBe(true);
});

test('Escenario 4: La ronda de Marta', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 37, y: 14 }, { day: 2, minutes: at(13) });

  await walkThroughDoor(page, 'ArrowRight', 'granja');

  expect(await isNpcPresent(page, 'marta')).toBe(true);
});

test('Escenario 5: Hablar con Bigotes', async ({ page }) => {
  // Bigotes está en el barrio, en la casilla (9, 9).
  await startAtWith(page, 'barrio', { x: 9, y: 10 }, { day: 2, minutes: at(10) });

  await press(page, 'e');
  await waitForDialogLineComplete(page);

  const dialog = await dialogState(page);
  expect(dialog?.speaker).toBe('bigotes');
  expect(dialog?.fullText).toBe('¡Miau!');
});

test('Escenario 6: Día de la feria', async ({ page, context }) => {
  await startAtWith(page, 'tienda', { x: 6, y: 6 }, { day: 7, minutes: at(13) });

  await walkThroughDoor(page, 'ArrowDown', 'plaza');

  for (const neighbour of ['rosa', 'lucia', 'tomas', 'pablo', 'fran', 'elena']) {
    expect(await isNpcPresent(page, neighbour), neighbour).toBe(true);
  }
  // Marta no reparte: ni en la plaza ni en la granja, donde estaría a esta hora.
  expect(await isNpcPresent(page, 'marta')).toBe(false);
  const farm = await context.newPage();
  await startAtWith(farm, 'granja', { x: 16, y: 12 }, { day: 7, minutes: at(13) });
  expect(await isNpcPresent(farm, 'marta')).toBe(false);
});
