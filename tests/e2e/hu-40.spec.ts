import { expect, test } from './fixtures';
import {
  at,
  currentGameState,
  dialogState,
  isChangingZone,
  isNpcPresent,
  NEXT_TO,
  playerTile,
  press,
  startAtWith,
  startNextTo,
  talkUntilChoiceOrEnd,
  waitForZone,
} from './helpers';

// HU-40. Horario de los NPC
// Para entrar en la plaza se sale de la tienda (puerta en la casilla 6, 8, caminando hacia abajo).
// Para entrar en el lago se baja por el camino del sur de la plaza (puerta en las casillas 19 a 21, 29).

async function walkThroughDoor(page: import('@playwright/test').Page, key: string, zone: string): Promise<void> {
  await page.keyboard.down(key);
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up(key);
  await waitForZone(page, zone);
}

async function waitForClock(page: import('@playwright/test').Page, minutes: number): Promise<void> {
  await expect.poll(async () => (await currentGameState(page))?.minutes, { timeout: 5000, intervals: [25] }).toBe(minutes);
}

test('Escenario 1: Dentro del horario', async ({ page }) => {
  await startAtWith(page, 'tienda', { x: 6, y: 6 }, { minutes: at(10) });

  await walkThroughDoor(page, 'ArrowDown', 'plaza');

  expect(await isNpcPresent(page, 'alcalde')).toBe(true);
});

test('Escenario 2: Fuera del horario', async ({ page }) => {
  await startAtWith(page, 'tienda', { x: 6, y: 6 }, { minutes: at(21) });

  await walkThroughDoor(page, 'ArrowDown', 'plaza');

  expect(await isNpcPresent(page, 'alcalde')).toBe(false);
});

test('Escenario 3: Cambio de zona del granjero', async ({ page, context }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 27 }, { minutes: at(17, 30) });

  await walkThroughDoor(page, 'ArrowDown', 'lago');

  expect(await isNpcPresent(page, 'granjero')).toBe(true);

  // A la misma hora, en la granja no está.
  const farm = await context.newPage();
  await startAtWith(farm, 'granja', { x: 16, y: 12 }, { minutes: at(17, 30) });
  expect(await isNpcPresent(farm, 'granjero')).toBe(false);
});

test('Escenario 4: Llega la hora con el jugador en la zona', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 17 }, { minutes: at(19, 59) });
  expect(await isNpcPresent(page, 'alcalde')).toBe(true);

  await waitForClock(page, at(20));

  expect(await isNpcPresent(page, 'alcalde')).toBe(false);
});

test('Escenario 5: Llega la hora durante un diálogo', async ({ page }) => {
  // Con el encargo 1 completado, el alcalde da las gracias.
  await startNextTo(page, 'alcalde', { minutes: at(19, 59), completedQuests: ['encargo-1'] });
  await press(page, 'e');
  expect((await dialogState(page))?.speaker).toBe('alcalde');

  await waitForClock(page, at(20));

  // El diálogo continúa y el alcalde sigue ahí...
  expect((await dialogState(page))?.speaker).toBe('alcalde');
  expect(await isNpcPresent(page, 'alcalde')).toBe(true);

  // ...hasta que se cierra.
  await talkUntilChoiceOrEnd(page);
  expect(await dialogState(page)).toBeNull();
  expect(await isNpcPresent(page, 'alcalde')).toBe(false);
  expect((await currentGameState(page))?.position).toEqual(NEXT_TO.alcalde.position);
});

test('Escenario 6: Un NPC ausente no bloquea el paso', async ({ page }) => {
  // El alcalde está en la casilla (24, 13). A las 21:00 no está: se puede cruzar su sitio.
  await startAtWith(page, 'plaza', { x: 22, y: 13 }, { minutes: at(21) });

  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await playerTile(page)).x, { timeout: 3000, intervals: [25] }).toBe(26);
  await page.keyboard.up('ArrowRight');

  // Y desde ahí se puede volver.
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await playerTile(page)).x, { timeout: 3000, intervals: [25] }).toBe(22);
  await page.keyboard.up('ArrowLeft');
});

test('Escenario 7: Llega la hora con el jugador en el sitio del NPC', async ({ page }) => {
  // Con el encargo 1 completado, el alcalde solo da las gracias (sin opciones).
  await startAtWith(page, 'plaza', { x: 24, y: 13 }, { minutes: at(7, 59), completedQuests: ['encargo-1'] });

  await waitForClock(page, at(8));
  await page.waitForTimeout(100);

  // El alcalde espera a que el jugador se aparte y el jugador puede moverse.
  expect(await isNpcPresent(page, 'alcalde')).toBe(false);
  await page.keyboard.down('ArrowDown');
  await expect.poll(async () => (await playerTile(page)).y, { timeout: 3000, intervals: [25] }).toBe(15);
  await page.keyboard.up('ArrowDown');
  await expect.poll(() => isNpcPresent(page, 'alcalde'), { intervals: [25] }).toBe(true);

  // Después de hablar con él, el jugador sigue pudiendo moverse.
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await playerTile(page)).y, { timeout: 3000, intervals: [25] }).toBe(14);
  await page.keyboard.up('ArrowUp');
  await talkUntilChoiceOrEnd(page);
  expect(await dialogState(page)).toBeNull();
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await playerTile(page)).x, { timeout: 3000, intervals: [25] }).toBeLessThan(24);
  await page.keyboard.up('ArrowLeft');
});
