import { expect, test } from '@playwright/test';
import { hudMoney, openPause, startNewGame } from './helpers';

// HU-16. Ver el dinero actual

test('Escenario 1: Dinero inicial', async ({ page }) => {
  await startNewGame(page);

  const money = await hudMoney(page);
  expect(money?.text).toBe('100 monedas');
  // Esquina superior derecha de la pantalla (960×540).
  expect(money?.x).toBeGreaterThan(960 * 0.75);
  expect(money?.y).toBeLessThan(540 * 0.15);
});

// Pendiente: la tienda se implementa en HU-17.
test.fixme('Escenario 2: Actualización al comprar', async () => {
  // Con 100 monedas, comprar un objeto de 30: aparece "70 monedas".
});

// Pendiente: completar encargos se implementa en HU-20.
test.fixme('Escenario 3: Actualización al completar un encargo', async () => {
  // Con 70 monedas, completar un encargo que paga 50: aparece "120 monedas".
});

test('Escenario 4: Dinero visible en pausa', async ({ page }) => {
  await startNewGame(page);

  await openPause(page);

  const money = await hudMoney(page);
  expect(money?.visible).toBe(true);
  expect(money?.text).toBe('100 monedas');
  expect(money?.x).toBeGreaterThan(960 * 0.75);
  expect(money?.y).toBeLessThan(540 * 0.15);
  // La interfaz se dibuja por encima del menú de pausa.
  const order = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return { hud: game.scene.getIndex('HudScene'), pause: game.scene.getIndex('PauseScene') };
  });
  expect(order.hud).toBeGreaterThan(order.pause);
});
