import { expect, test } from './fixtures';
import { at, catchFish, currentGameState, FISHING_SPOT, press, ROD, setRandom, startAtWith, waitForHudText } from './helpers';

// HU-49. Peces según la hora
// El primer valor al azar es la espera hasta "¡Pica!" (0: 2 segundos); el segundo, el tamaño del pez.

test('Escenario 1: Por la mañana', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(7), inventory: [ROD] });
  // Tamaño al azar real.
  await setRandom(page, []);

  const message = await catchFish(page);

  expect((await currentGameState(page))?.inventory).toContainEqual({ item: 'trucha', quantity: 1 });
  const size = Number(message.match(/^Has pescado una Trucha de (\d+) cm$/)?.[1]);
  expect(size).toBeGreaterThanOrEqual(25);
  expect(size).toBeLessThanOrEqual(50);
});

test('Escenario 2: Por la tarde', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(15), inventory: [ROD] });
  await setRandom(page, [0]);

  const message = await catchFish(page);

  expect((await currentGameState(page))?.inventory).toContainEqual({ item: 'carpa', quantity: 1 });
  expect(message).toBe('Has pescado una Carpa de 20 cm');
});

test('Escenario 3: Por la noche', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(22), inventory: [ROD] });
  await setRandom(page, [0, 0.999]);

  const message = await catchFish(page);

  expect((await currentGameState(page))?.inventory).toContainEqual({ item: 'siluro', quantity: 1 });
  expect(message).toBe('Has pescado un Siluro de 120 cm');
});

test('Escenario 4: Cambio de franja', async ({ page }) => {
  // Empieza a las 09:58 y "¡Pica!" sale unos 3 segundos después de lanzar: la caña se lanza antes de las 10:00
  // aunque el equipo vaya cargado, y el pez pica ya en la franja de la Carpa.
  await startAtWith(page, 'lago', FISHING_SPOT, { minutes: at(9, 58), inventory: [ROD] });
  await setRandom(page, [0.34]);

  await press(page, 'e');
  expect((await currentGameState(page))?.minutes).toBeLessThanOrEqual(at(9, 59)); // lanza antes de las 10:00
  await waitForHudText(page, '¡Pica!');
  expect((await currentGameState(page))?.minutes).toBeGreaterThanOrEqual(at(10)); // pica a partir de las 10:00
  await press(page, 'e');

  expect((await currentGameState(page))?.inventory).toContainEqual({ item: 'carpa', quantity: 1 });
});
