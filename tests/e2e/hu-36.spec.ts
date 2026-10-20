import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';
import {
  openGame,
  openOptionsAt,
  openPause,
  press,
  sceneTexts,
  startNewGame,
  startNextTo,
  textContrasts,
  waitForDialogLineComplete,
  waitForScene,
} from './helpers';

// HU-36. Texto legible
// El contraste se mide en pantalla (ver textContrasts en helpers.ts).

const MIN_CONTRAST = 4.5;

function expectReadable(contrasts: { text: string; ratio: number }[]): void {
  expect(contrasts.length).toBeGreaterThan(0);
  for (const { text, ratio } of contrasts) {
    expect(ratio, `Contraste de "${text}"`).toBeGreaterThanOrEqual(MIN_CONTRAST);
  }
}

test('Escenario 1: Contraste en diálogos', async ({ page }) => {
  await startNextTo(page, 'granjero', {});
  await press(page, 'e');
  await waitForDialogLineComplete(page);

  expectReadable(await textContrasts(page, 'DialogScene'));
});

test('Escenario 2: Contraste en menús', async ({ page }) => {
  await startNewGame(page);
  await openPause(page);

  expectReadable(await textContrasts(page, 'PauseScene'));
});

// Palabras en inglés que delatarían un texto sin traducir.
const ENGLISH = /\b(the|and|press|start|new game|continue|options|credits|exit|save|load|yes|inventory|shop|buy|sell|back|settings|music|sound|volume|pause|resume|quit|score|game over|loading|close|open|use|item)\b/i;

test('Escenario 3: Idioma', async ({ page }) => {
  // Textos de las pantallas.
  const screens: string[] = [];
  await openGame(page);
  screens.push(...(await sceneTexts(page, 'MenuScene')));
  await openOptionsAt(page, 'Música');
  screens.push(...(await sceneTexts(page, 'OptionsScene')));
  await press(page, 'Escape'); // vuelve al menú con "Opciones" seleccionada
  await press(page, 'ArrowDown'); // "Créditos"
  await press(page, 'Enter');
  await waitForScene(page, 'CreditsScene');
  screens.push(...(await sceneTexts(page, 'CreditsScene')).filter((text) => !/Kenney|Tiny|Ninja|Pixel-boy|Phaser|Flow|MIT|CC0/.test(text)));

  // Textos de los datos del juego (diálogos, objetos, encargos, carteles).
  const data = ['dialogues', 'items', 'quests', 'signs', 'zones'].map((name) =>
    readFileSync(new URL(`../../src/data/${name}.json`, import.meta.url), 'utf8'),
  );
  const dataTexts = data.flatMap((json) => [...json.matchAll(/"([^"]*[ ][^"]*)"/g)].map((match) => match[1]));

  for (const text of [...screens, ...dataTexts]) {
    expect(text, `Texto: "${text}"`).not.toMatch(ENGLISH);
  }
});
