import { expect, test } from './fixtures';
import { audioState, openOptionsAt, optionsView, press } from './helpers';

// HU-34. Guardar las opciones
// "Cerrar y volver a abrir el juego" se simula recargando la página.

test('Escenario 1: Ajustes que se mantienen', async ({ page }) => {
  // Valores iniciales: música 6 y efectos 5.
  await openOptionsAt(page, 'Música');
  await press(page, 'ArrowLeft');
  await press(page, 'ArrowLeft'); // música 4
  await press(page, 'ArrowDown');
  for (let i = 0; i < 3; i++) await press(page, 'ArrowRight'); // efectos 8

  await page.reload();
  await openOptionsAt(page, 'Música');

  const view = await optionsView(page);
  expect(view?.musicBars).toBe(4);
  expect(view?.effectBars).toBe(8);
});

test('Escenario 2: Silencio que se mantiene', async ({ page }) => {
  await openOptionsAt(page, 'Silenciar');
  await press(page, 'Enter');

  await page.reload();
  await openOptionsAt(page, 'Silenciar');

  expect((await optionsView(page))?.muted).toBe(true);
  expect((await audioState(page)).muted).toBe(true);
});

test('Escenario 3: Navegador sin almacenamiento', async ({ page }) => {
  // El navegador no permite guardar datos.
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Almacenamiento no disponible', 'SecurityError');
    };
    Storage.prototype.getItem = () => {
      throw new DOMException('Almacenamiento no disponible', 'SecurityError');
    };
  });
  await openOptionsAt(page, 'Música');

  // El juego funciona con normalidad: el cambio se aplica.
  await press(page, 'ArrowRight');
  expect((await optionsView(page))?.musicBars).toBe(7);
  expect((await audioState(page)).musicGain).toBeCloseTo(0.7);

  // Al volver a abrir el juego, los ajustes no se han conservado.
  await page.reload();
  await openOptionsAt(page, 'Música');
  expect((await optionsView(page))?.musicBars).toBe(6);
});
