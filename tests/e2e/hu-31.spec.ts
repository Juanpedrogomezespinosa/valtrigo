import { expect, test } from './fixtures';
import {
  audioState,
  choosePauseOption,
  clickText,
  isChangingZone,
  openPause,
  startAt,
  startNewGame,
  waitForScene,
  waitForZone,
} from './helpers';

// HU-31. Música de fondo según la zona
// Cada zona tiene su pista ("music-<zona>") y el menú la suya ("music-menu").
// Las pistas de las zonas se descargan al entrar por primera vez, así que se espera a que suenen.

test('Escenario 1: Cambio de zona', async ({ page }) => {
  // Frente a la puerta de la tienda, en el exterior del pueblo.
  await startAt(page, 'plaza', { x: 31, y: 12 });
  await expect.poll(async () => (await audioState(page)).music, { timeout: 10_000 }).toBe('music-plaza');

  await page.keyboard.down('ArrowUp');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowUp');
  await waitForZone(page, 'tienda');

  await expect.poll(async () => (await audioState(page)).music, { timeout: 10_000 }).toBe('music-tienda');
});

test('Escenario 2: Misma zona', async ({ page }) => {
  await startAt(page, 'tienda', { x: 6, y: 6 });
  await expect.poll(async () => (await audioState(page)).music, { timeout: 10_000 }).toBe('music-tienda');
  const before = await audioState(page);

  for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight']) {
    await page.keyboard.down(key);
    await page.waitForTimeout(300);
    await page.keyboard.up(key);
  }

  const after = await audioState(page);
  expect(after.music).toBe('music-tienda');
  expect(after.musicStarts).toBe(before.musicStarts); // no ha vuelto a empezar
});

test('Escenario 3: Música del menú', async ({ page }) => {
  // Partida nueva sin guardar: al salir pide confirmación.
  await startNewGame(page);
  await expect.poll(async () => (await audioState(page)).music, { timeout: 10_000 }).toBe('music-plaza');

  // Volver al menú principal desde la pausa.
  await openPause(page);
  await choosePauseOption(page, 'Salir al menú principal');
  await clickText(page, 'PauseScene', 'Sí');
  await waitForScene(page, 'MenuScene');

  expect((await audioState(page)).music).toBe('music-menu');
});
