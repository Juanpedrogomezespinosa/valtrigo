import { expect, test } from './fixtures';
import {
  appearanceView,
  at,
  currentGameState,
  FRONT_OF_PLOT,
  openGame,
  press,
  sceneTexts,
  spriteColors,
  startAtWith,
  typeName,
  waitForScene,
} from './helpers';

// HU-68. Aspecto del personaje
// Colores de src/data/appearance.json: el claro de la piel y el claro del pelo de cada valor.
const SKIN = { clara: '#f8c08c', media: '#ef914f', oscura: '#a3754e' };
const HAIR = { castano: '#965c3a', negro: '#4e484a', pelirrojo: '#d14b34', rubio: '#f0c460' };

async function openAppearanceScreen(page: import('@playwright/test').Page): Promise<void> {
  await openGame(page);
  await press(page, 'Enter'); // "Nueva partida"
  await waitForScene(page, 'IntroScene');
  await press(page, 'Escape'); // salta la introducción
  await typeName(page, 'Juan');
}

test('Escenario 1: Elegir el aspecto', async ({ page }) => {
  await openAppearanceScreen(page);

  await press(page, 'ArrowRight'); // Género: Mujer
  await press(page, 'ArrowDown');
  await press(page, 'ArrowLeft'); // Piel: Clara
  await press(page, 'ArrowDown');
  await press(page, 'ArrowRight'); // Pelo: Rubio
  await press(page, 'Enter');

  await waitForScene(page, 'GameScene');
  expect((await currentGameState(page))?.appearance).toEqual({ gender: 'mujer', skin: 'clara', hair: 'rubio' });
  const { texture, colors } = await spriteColors(page);
  expect(texture).toBe('jugador-mujer-clara-rubio');
  expect(colors).toContain(SKIN.clara);
  expect(colors).toContain(HAIR.rubio);
});

test('Escenario 2: Aspecto inicial', async ({ page }) => {
  await openAppearanceScreen(page);

  const view = await appearanceView(page);
  expect(view?.selected).toBe('Género');
  expect(view?.appearance).toEqual({ gender: 'hombre', skin: 'media', hair: 'pelirrojo' });
});

test('Escenario 3: Vista previa', async ({ page }) => {
  await openAppearanceScreen(page);

  await press(page, 'ArrowDown');
  await press(page, 'ArrowDown');
  await press(page, 'ArrowLeft'); // Pelo: de Pelirrojo a Negro

  const view = await appearanceView(page);
  expect(view?.appearance.hair).toBe('negro');
  const { colors } = await spriteColors(page, view!.previewTexture);
  expect(colors).toContain(HAIR.negro);
  expect(colors).not.toContain(HAIR.pelirrojo);
});

test('Escenario 4: Aspecto guardado', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 17 }, { appearance: { gender: 'mujer', skin: 'oscura', hair: 'castano' } });

  const { texture, colors } = await spriteColors(page);
  expect(texture).toBe('jugador-mujer-oscura-castano');
  expect(colors).toContain(SKIN.oscura);
  expect(colors).toContain(HAIR.castano);
});

test('Escenario 5: Textos según el género', async ({ page }) => {
  await startAtWith(page, 'granja', FRONT_OF_PLOT, {
    minutes: at(10),
    energy: 2,
    inventory: [{ item: 'pala', quantity: 1 }],
    appearance: { gender: 'mujer', skin: 'media', hair: 'pelirrojo' },
  });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Estás demasiado cansada');
});
