import { expect, test } from './fixtures';
import { objectivesTexts, press, startWith } from './helpers';

// HU-21. Ver la lista de objetivos

test('Escenario 1: Ver un encargo activo', async ({ page }) => {
  await startWith(page, { activeQuests: ['encargo-1'] });

  await press(page, 'o');

  const texts = await objectivesTexts(page);
  expect(texts).toContain('Entregar la Carta del alcalde');
  expect(texts).toContain('La vendedora de la tienda tiene una carta para el alcalde. Recógela y llévasela.');
  expect(texts).toContain('Encargado por: Alcalde');

  // Se cierra con O y con Escape.
  await press(page, 'o');
  expect(await objectivesTexts(page)).toBeNull();
  await press(page, 'o');
  await press(page, 'Escape');
  expect(await objectivesTexts(page)).toBeNull();
});

test('Escenario 2: Sin encargos activos', async ({ page }) => {
  await startWith(page, { activeQuests: [] });

  await press(page, 'o');

  expect(await objectivesTexts(page)).toContain('No tienes encargos activos');
});

test('Escenario 3: Encargo completado', async ({ page }) => {
  await startWith(page, { activeQuests: [], completedQuests: ['encargo-1'] });

  await press(page, 'o');

  const texts = await objectivesTexts(page);
  expect(texts).not.toContain('Entregar la Carta del alcalde');
  expect(texts).toContain('No tienes encargos activos');
});
