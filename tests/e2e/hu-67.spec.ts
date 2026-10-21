import { expect, test } from './fixtures';
import {
  advanceDialogUntil,
  at,
  ceremonyView,
  currentGameState,
  dialogState,
  enterName,
  nameInput,
  openGame,
  press,
  startAtWith,
  waitForScene,
} from './helpers';

// HU-67. Nombre del jugador

async function openNameScreen(page: import('@playwright/test').Page): Promise<void> {
  await openGame(page);
  await press(page, 'Enter'); // "Nueva partida"
  await waitForScene(page, 'IntroScene');
  await press(page, 'Escape'); // salta la introducción
  await waitForScene(page, 'NameScene');
}

test('Escenario 1: Elegir el nombre', async ({ page }) => {
  await openNameScreen(page);

  await enterName(page, 'Juan');

  expect((await currentGameState(page))?.playerName).toBe('Juan');
});

test('Escenario 2: Nombre demasiado largo', async ({ page }) => {
  await openNameScreen(page);

  await page.keyboard.type('Maximilianoooo');

  expect(await nameInput(page)).toBe('Maximilianoo');
  expect((await nameInput(page))?.length).toBe(12);
});

test('Escenario 3: Nombre vacío', async ({ page }) => {
  await openNameScreen(page);

  await press(page, 'Enter');

  expect(await nameInput(page)).toBe('');
  await page.waitForTimeout(200);
  expect(await nameInput(page)).not.toBeNull(); // sigue en la pantalla del nombre
});

test('Escenario 4: Nombre en el podio', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 22, y: 14 }, {
    playerName: 'Juan',
    day: 7,
    minutes: at(17, 59),
    harvestEntry: { item: 'calabaza', weight: 12 },
  });
  await expect.poll(async () => (await ceremonyView(page)).inCeremony, { timeout: 5000 }).toBe(true);

  await advanceDialogUntil(page, 'Concurso de la cosecha');

  expect((await dialogState(page))?.fullText).toBe('Concurso de la cosecha. Primer puesto: Juan, con una Calabaza de 12 kg.');
});
