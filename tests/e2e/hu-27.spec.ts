import { expect, test } from './fixtures';
import {
  activeScenes,
  at,
  choosePauseOption,
  hudClock,
  isScenePaused,
  openPause,
  press,
  startNewGame,
  startNextTo,
  talkIndicator,
} from './helpers';

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

test('Escenario 3: Misma posición y hora', async ({ page }) => {
  await startNextTo(page, 'alcalde', { minutes: at(10) });
  await openPause(page);
  const paused = await hudClock(page);
  expect(['10:00', '10:01']).toContain(paused?.time);
  await page.waitForTimeout(3000);

  await press(page, 'Escape');

  // Sigue junto al alcalde y el reloj marca la misma hora que al pausar...
  expect((await talkIndicator(page)).target).toBe('alcalde');
  expect(await hudClock(page)).toEqual(paused);
  // ...y continúa avanzando.
  await page.waitForTimeout(2500);
  expect((await hudClock(page))?.time).not.toBe(paused?.time);
});
