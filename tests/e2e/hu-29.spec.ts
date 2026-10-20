import { expect, test } from './fixtures';
import { audioState, openOptionsAt, optionsView, playedEffectVolumes, press, recordEffects, setSoundSettings } from './helpers';

// HU-29. Ajustar el volumen de los efectos
// Los efectos se reproducen con volumen = barras / 10. El efecto de prueba es el de confirmación.

test('Escenario 1: Efectos independientes de la música', async ({ page }) => {
  await setSoundSettings(page, { musicBars: 5, effectBars: 5, muted: false });
  await openOptionsAt(page, 'Efectos');

  for (let i = 0; i < 5; i++) await press(page, 'ArrowLeft');

  expect((await optionsView(page))?.effectBars).toBe(0);
  // La música sigue a 5 barras...
  expect((await optionsView(page))?.musicBars).toBe(5);
  expect((await audioState(page)).musicGain).toBeCloseTo(0.5);
  // ...y los efectos no se escuchan.
  await recordEffects(page);
  await press(page, 'ArrowUp');
  expect(await playedEffectVolumes(page)).toEqual([{ key: 'sfx-menu-navegar', volume: 0 }]);
});

test('Escenario 2: Efecto de prueba', async ({ page }) => {
  await setSoundSettings(page, { musicBars: 5, effectBars: 5, muted: false });
  await openOptionsAt(page, 'Efectos');
  await press(page, 'ArrowRight'); // 6

  await recordEffects(page);
  await press(page, 'ArrowRight'); // se pulsa y se suelta en 7

  expect((await optionsView(page))?.effectBars).toBe(7);
  expect(await playedEffectVolumes(page)).toEqual([{ key: 'sfx-menu-confirmar', volume: 0.7 }]);
});
