import { expect, test } from './fixtures';
import { activeScenes, choosePauseOption, isScenePaused, openPause, press, startNewGame } from './helpers';

// HU-27. Reanudar desde la pausa

test('Escenario 1: Reanudar con el botón', async ({ page }) => {
  await startNewGame(page);
  await openPause(page);

  await choosePauseOption(page, 'Continuar');

  await expect.poll(() => activeScenes(page)).not.toContain('PauseScene');
  expect(await activeScenes(page)).toContain('GameScene');
  expect(await isScenePaused(page, 'GameScene')).toBe(false);
});

test('Escenario 2: Reanudar con Escape', async ({ page }) => {
  await startNewGame(page);
  await openPause(page);

  await press(page, 'Escape');

  await expect.poll(() => activeScenes(page)).not.toContain('PauseScene');
  expect(await activeScenes(page)).toContain('GameScene');
  expect(await isScenePaused(page, 'GameScene')).toBe(false);
});

// Pendiente: necesita los NPC (HU-10) y que el reloj avance (HU-22).
test.fixme('Escenario 3: Misma posición y hora', async () => {
  // Colocar al personaje junto a un NPC a las 10:00, abrir la pausa y reanudar:
  // sigue junto al NPC, el reloj marca las 10:00 y continúa avanzando.
});
