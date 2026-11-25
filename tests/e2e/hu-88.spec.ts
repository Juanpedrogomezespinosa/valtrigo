import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  activeScenes,
  audioState,
  currentGameState,
  dialogState,
  openGame,
  playerInfo,
  press,
  sceneTexts,
  startNextTo,
  talkUntilChoiceOrEnd,
  waitForScene,
} from './helpers';

// HU-88. Créditos finales

const QA = [
  'José Antonio Amaya Postigo',
  'Antonio Consuegra Rosa',
  'María Femenía Solero',
  'Francisco Javier García José',
  'Aurora García López',
  'Nicolás García López',
  'Tania Leticia López Vega',
  'Juan Ignacio Lozupone Moratinos',
  'Daniel Montañez Núñez',
  'Mateo José Moya Jiménez',
  'Moisés Muley Álvarez',
  'Jessica Pérez Fernández',
  'Matthew Aaron Powell Delgado',
  'José Rodríguez Ripoll',
  'Sergio Rodríguez Vázquez',
  'Sebastian Alessandro Rojas Francia',
  'Juan Moisés Sánchez Cordero',
];
const INTRO_SECONDS = 34;
const BEFORE_LAST = ['encargo-1', 'encargo-2', 'encargo-3', 'encargo-4', 'encargo-5'];

type Card = { role: string; name: string };
type EndCreditsApi = { getCards(): Card[]; getVisibleCard(): Card | null; getElapsed(): number };

function credits<T>(page: Page, read: (scene: EndCreditsApi) => T): Promise<T> {
  return page.evaluate(
    (source) => {
      const game = (window as unknown as { game: import('phaser').Game }).game;
      const scene = game.scene.getScene('EndCreditsScene') as unknown as EndCreditsApi;
      return new Function('scene', `return (${source})(scene)`)(scene);
    },
    read.toString(),
  ) as Promise<T>;
}

// Abre los créditos desde el menú y espera a que suene su canción.
async function openFromMenu(page: Page): Promise<void> {
  await openGame(page);
  for (let i = 0; i < 5; i++) await press(page, 'ArrowDown'); // "Créditos"
  await press(page, 'Enter');
  await waitForScene(page, 'EndCreditsScene');
  await expect.poll(async () => (await audioState(page)).music, { timeout: 15000 }).toBe('music-creditos');
}

// Completa el último encargo y cierra el mensaje de final con E.
async function openFromEnding(page: Page): Promise<void> {
  await startNextTo(page, 'alcalde', { completedQuests: BEFORE_LAST, activeQuests: ['encargo-6'] });
  await talkUntilChoiceOrEnd(page);
  await expect.poll(async () => (await dialogState(page))?.speaker).toBe('fin');
  await press(page, 'e');
  await waitForScene(page, 'EndCreditsScene');
}

test('Escenario 1: Créditos desde el menú', async ({ page }) => {
  await openFromMenu(page);

  expect((await audioState(page)).music).toBe('music-creditos');
});

test('Escenario 2: Cinemática al principio', async ({ page }) => {
  test.setTimeout(90_000);
  await openFromMenu(page);

  // Durante la cinemática no aparece ningún nombre.
  const seen = new Set<string>();
  for (;;) {
    const elapsed = await credits(page, (scene) => scene.getElapsed());
    if (elapsed >= INTRO_SECONDS - 0.5) break;
    expect(await credits(page, (scene) => scene.getVisibleCard())).toBeNull();
    for (const text of await sceneTexts(page, 'EndCreditsScene')) seen.add(text);
    await page.waitForTimeout(500);
  }
  // Se ve el pueblo (la cámara ampliada sobre la plaza) y el título "Valtrigo".
  expect(seen).toContain('Valtrigo');
  const zoom = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    return game.scene.getScene('EndCreditsScene').cameras.main.zoom;
  });
  expect(zoom).toBe(3);
});

test('Escenario 3: Los nombres', async ({ page }) => {
  test.setTimeout(90_000);
  await openFromMenu(page);

  // Todos los nombres, en orden: el equipo de QA y, el último, Juanpe Gómez.
  expect(await credits(page, (scene) => scene.getCards())).toEqual([
    ...QA.map((name) => ({ role: 'QA', name })),
    { role: 'Desarrollo', name: 'Juanpe Gómez' },
  ]);

  // Pasada la cinemática aparece el primer nombre, con "QA" encima.
  await expect
    .poll(() => credits(page, (scene) => scene.getVisibleCard()), { timeout: 60_000, intervals: [500] })
    .toEqual({ role: 'QA', name: QA[0] });
  const texts = await sceneTexts(page, 'EndCreditsScene');
  expect(texts).toContain('QA');
  expect(texts).toContain(QA[0]);
});

test('Escenario 4: Saltar los créditos desde el menú', async ({ page }) => {
  await openFromMenu(page);

  await press(page, 'Escape');

  await waitForScene(page, 'CreditsScene');
  expect(await activeScenes(page)).not.toContain('EndCreditsScene');
  expect((await audioState(page)).music).toBe('music-menu');
});

test('Escenario 5: Créditos al terminar el juego', async ({ page }) => {
  await openFromEnding(page);

  expect(await activeScenes(page)).toContain('EndCreditsScene');
  await expect.poll(async () => (await audioState(page)).music, { timeout: 15000 }).toBe('music-creditos');
});

test('Escenario 6: Volver a la partida', async ({ page }) => {
  await openFromEnding(page);

  await press(page, 'Escape');

  await expect.poll(async () => (await activeScenes(page)).includes('EndCreditsScene')).toBe(false);
  expect(await activeScenes(page)).toContain('GameScene');
  await expect.poll(async () => (await audioState(page)).music).toBe('music-plaza');
  const before = await playerInfo(page);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowDown');
  expect((await playerInfo(page)).y).toBeGreaterThan(before.y);
});

test('Escenario 7: La partida se detiene', async ({ page }) => {
  await openFromEnding(page);
  const before = (await currentGameState(page))!.minutes;

  await page.waitForTimeout(3000); // 3 minutos de juego si el reloj avanzara

  expect((await currentGameState(page))!.minutes).toBe(before);
});
