import { expect, test } from './fixtures';
import { audioState, openOptionsAt, optionsView, press, setSoundSettings } from './helpers';

// HU-28. Ajustar el volumen de la música
// El volumen de la música se aplica con un nodo de ganancia: barras / 10.

test('Escenario 1: Subir el volumen', async ({ page }) => {
  await setSoundSettings(page, { musicBars: 5, effectBars: 5, muted: false });
  await openOptionsAt(page, 'Música');

  await press(page, 'ArrowRight');

  expect((await optionsView(page))?.musicBars).toBe(6);
  expect((await audioState(page)).musicGain).toBeCloseTo(0.6);
});

test('Escenario 2: Volumen en cero', async ({ page }) => {
  await setSoundSettings(page, { musicBars: 1, effectBars: 5, muted: false });
  await openOptionsAt(page, 'Música');

  await press(page, 'ArrowLeft');

  expect((await optionsView(page))?.musicBars).toBe(0);
  expect((await audioState(page)).musicGain).toBe(0);
});

test('Escenario 3: Límite máximo', async ({ page }) => {
  await setSoundSettings(page, { musicBars: 10, effectBars: 5, muted: false });
  await openOptionsAt(page, 'Música');

  await press(page, 'ArrowRight');

  expect((await optionsView(page))?.musicBars).toBe(10);
  expect((await audioState(page)).musicGain).toBe(1);
});
