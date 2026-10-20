import { expect, test } from '@playwright/test';
import { openGame, playedEffects, press, recordEffects } from './helpers';

// HU-32. Efectos de sonido en las acciones

const NAVIGATE = 'sfx-menu-navegar';
const CONFIRM = 'sfx-menu-confirmar';

// Pendientes: dependen de historias aún no implementadas.
test.fixme('Escenario 1: Andar', async () => {
  // HU-06: movimiento del personaje.
});

test.fixme('Escenario 2: Comprar', async () => {
  // HU-17: tienda.
});

test.fixme('Escenario 3: Abrir un cofre', async () => {
  // HU-12: cofres.
});

test.fixme('Escenario 4: Completar un encargo', async () => {
  // HU-20: encargos.
});

test('Escenario 5: Navegar por un menú', async ({ page }) => {
  await openGame(page);
  await recordEffects(page);

  await press(page, 'ArrowDown');
  expect(await playedEffects(page)).toEqual([NAVIGATE]);

  // En la primera opción, la flecha arriba no cambia la selección y no suena nada.
  await press(page, 'ArrowUp');
  await press(page, 'ArrowUp');
  expect(await playedEffects(page)).toEqual([NAVIGATE, NAVIGATE]);
});

test('Escenario 6: Activar una opción', async ({ page }) => {
  await openGame(page);

  // "Continuar" está desactivada: Enter no reproduce ningún efecto.
  await press(page, 'ArrowDown');
  await recordEffects(page);
  await press(page, 'Enter');
  expect(await playedEffects(page)).toEqual([]);

  // "Opciones" está activa: Enter reproduce el efecto de confirmación.
  await press(page, 'ArrowDown');
  await press(page, 'ArrowDown');
  await recordEffects(page);
  await press(page, 'Enter');
  expect(await playedEffects(page)).toEqual([CONFIRM]);
});
