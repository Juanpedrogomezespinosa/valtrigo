import { expect, test } from './fixtures';
import {
  audioState,
  openOptionsAt,
  openPause,
  playerInfo,
  optionsView,
  playedEffectVolumes,
  press,
  recordEffects,
  setSoundSettings,
  startNewGame,
  waitForScene,
} from './helpers';

// HU-30. Silenciar todo el sonido
// "Silenciar" usa el silencio general, por el que pasan la música y los efectos.

test('Escenario 1: Silenciar', async ({ page }) => {
  await setSoundSettings(page, { musicBars: 7, effectBars: 6, muted: false });
  await openOptionsAt(page, 'Silenciar');

  await press(page, 'Enter');

  expect((await audioState(page)).muted).toBe(true);
  const view = await optionsView(page);
  expect(view?.muted).toBe(true);
  expect(view?.musicBars).toBe(7);
  expect(view?.effectBars).toBe(6);
});

test('Escenario 2: Silencio al reanudar', async ({ page }) => {
  await setSoundSettings(page, { musicBars: 7, effectBars: 6, muted: true });
  await startNewGame(page);
  await openPause(page);

  await press(page, 'Escape');
  await waitForScene(page, 'GameScene');

  expect((await audioState(page)).muted).toBe(true);
});

test('Escenario 3: Recuperar el sonido', async ({ page }) => {
  await setSoundSettings(page, { musicBars: 7, effectBars: 6, muted: true });
  await openOptionsAt(page, 'Silenciar');
  expect((await audioState(page)).muted).toBe(true);

  await press(page, 'Enter');

  const audio = await audioState(page);
  expect(audio.muted).toBe(false);
  expect(audio.musicGain).toBeCloseTo(0.7);
  await recordEffects(page);
  await press(page, 'ArrowUp');
  expect(await playedEffectVolumes(page)).toEqual([{ key: 'sfx-menu-navegar', volume: 0.6 }]);
});

test('Escenario 4: Tecla Tab', async ({ page }) => {
  await startNewGame(page);
  await expect.poll(async () => (await audioState(page)).music).toBe('music-plaza');
  expect((await audioState(page)).running).toBe(true);

  await press(page, 'Tab');
  await page.waitForTimeout(300);

  // La música sigue sonando: el juego no ha perdido el foco ni se ha suspendido el sonido.
  const audio = await audioState(page);
  expect(audio.running).toBe(true);
  expect(audio.muted).toBe(false);
  expect(audio.music).toBe('music-plaza');
  expect(await page.evaluate(() => document.hasFocus())).toBe(true);
  // Y sigue respondiendo al teclado.
  const before = await playerInfo(page);
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowLeft');
  expect((await playerInfo(page)).x).toBeLessThan(before.x);
});

