import { expect, test } from './fixtures';
import diary from '../../src/data/diary.json' with { type: 'json' };
import { at, currentGameState, isDiaryPageOnMap, objectivesTexts, press, sceneTexts, startAtWith } from './helpers';

// HU-55. Páginas del diario
// Página 1 en la plaza, 2 en la granja, 3 en el lago, 4 en el bosque y 5 en la torre (src/data/diary.json).

test('Escenario 1: Encontrar una página', async ({ page }) => {
  // La página del lago está en la casilla (27, 11), en el claro del este.
  await startAtWith(page, 'lago', { x: 26, y: 11 }, { minutes: at(10), inventory: [] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Has encontrado una página del diario');
  expect(await isDiaryPageOnMap(page, 'pagina-3')).toBe(false);
  const state = await currentGameState(page);
  expect(state?.diaryPages).toEqual(['pagina-3']);
  expect(state?.inventory).toEqual([]); // no ocupa sitio en el inventario
});

test('Escenario 2: Leer las notas', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 17 }, { minutes: at(10), diaryPages: ['pagina-3'] });

  await press(page, 'o');
  await press(page, 'ArrowRight'); // "Notas"

  const texts = (await objectivesTexts(page))!;
  expect(texts).toContain('[ Notas ]');
  expect(texts).toContain(diary.pages['pagina-3']);
  expect(texts.filter((text) => text === 'Página sin encontrar')).toHaveLength(4);
  // En orden: la página 3 entre la 2 y la 4.
  const third = texts.indexOf('Página 3');
  expect(texts[third + 1]).toBe(diary.pages['pagina-3']);
});
