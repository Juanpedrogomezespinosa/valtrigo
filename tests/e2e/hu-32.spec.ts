import { expect, test } from './fixtures';
import {
  at,
  dialogState,
  openGame,
  playedEffects,
  press,
  recordEffects,
  sceneTexts,
  selectShopRow,
  startAtWith,
  startNewGame,
  startNextTo,
  talkUntilChoiceOrEnd,
} from './helpers';

// HU-32. Efectos de sonido en las acciones

const NAVIGATE = 'sfx-menu-navegar';
const CONFIRM = 'sfx-menu-confirmar';
const DIALOG_LETTER = 'sfx-dialogo-letra';
const DIALOG_NEXT = 'sfx-dialogo-siguiente';
// Con el reloj reparado, el alcalde dice sus dos líneas `clockRepaired` (HU-11, escenario 5).
const CLOCK_REPAIRED = { completedQuests: ['encargo-1', 'encargo-2', 'encargo-3', 'encargo-4', 'encargo-5'] };

test('Escenario 1: Andar', async ({ page }) => {
  await startNewGame(page); // centro de la plaza, sin obstáculos cerca
  await recordEffects(page);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowRight');

  const steps = (await playedEffects(page)).filter((key) => key === 'sfx-pasos');
  expect(steps.length).toBeGreaterThanOrEqual(2);
});

test('Escenario 2: Comprar', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 100, inventory: [] });
  await press(page, 'e'); // abre la tienda
  await selectShopRow(page, 'semilla');
  await recordEffects(page);

  await press(page, 'Enter');

  expect(await playedEffects(page)).toEqual(['sfx-compra']);
});

test('Escenario 3: Abrir un cofre', async ({ page }) => {
  // Junto al cofre 1, detrás del granero.
  await startAtWith(page, 'granja', { x: 8, y: 2 }, { inventory: [] });
  await recordEffects(page);

  await press(page, 'e');

  expect(await playedEffects(page)).toContain('sfx-cofre');
});

test('Escenario 4: Completar un encargo', async ({ page }) => {
  await startNextTo(page, 'alcalde', { activeQuests: ['encargo-1'], inventory: [{ item: 'carta-del-alcalde', quantity: 1 }] });
  await recordEffects(page);

  await talkUntilChoiceOrEnd(page); // se completa al terminar de hablar con el alcalde

  expect(await sceneTexts(page, 'HudScene')).toContain('Encargo completado');
  expect(await playedEffects(page)).toContain('sfx-encargo-completado');
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
  await press(page, 'ArrowDown'); // "Partidas de práctica"
  await press(page, 'ArrowDown'); // "Guardar partida"
  await press(page, 'ArrowDown'); // "Opciones"
  await recordEffects(page);
  await press(page, 'Enter');
  expect(await playedEffects(page)).toEqual([CONFIRM]);
});

test('Escenario 7: Letras de un diálogo', async ({ page }) => {
  await startNextTo(page, 'alcalde', CLOCK_REPAIRED);
  await recordEffects(page);

  await press(page, 'e');
  await expect.poll(async () => (await dialogState(page))?.typing, { intervals: [25] }).toBe(false);

  const letters = (await playedEffects(page)).filter((key) => key === DIALOG_LETTER);
  expect(letters.length).toBeGreaterThanOrEqual(2);
});

test('Escenario 8: Siguiente cuadro de diálogo', async ({ page }) => {
  await startNextTo(page, 'alcalde', CLOCK_REPAIRED);
  await press(page, 'e');
  await expect.poll(async () => (await dialogState(page))?.typing, { intervals: [25] }).toBe(false);
  await recordEffects(page);

  await press(page, 'e');

  expect((await dialogState(page))?.lineIndex).toBe(1);
  expect((await playedEffects(page))[0]).toBe(DIALOG_NEXT);
});
