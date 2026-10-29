import { expect, test } from './fixtures';
import { at, chooseDialogOption, currentGameState, dialogState, press, startAtWith, talkUntilChoiceOrEnd, waitForHudText } from './helpers';

// HU-75. La fuente de la plaza
// La fuente está en la casilla (17, 16) de la plaza; el jugador se pone debajo, en (17, 17).

const NEXT_TO_FOUNTAIN = { x: 17, y: 17 };

async function useFountain(page: import('@playwright/test').Page, option: string): Promise<void> {
  await talkUntilChoiceOrEnd(page); // E: aparece "Fuente" con sus opciones
  expect((await dialogState(page))?.choice?.options).toEqual(['Beber', 'Echar una moneda', 'Nada']);
  await chooseDialogOption(page, option);
}

test('Escenario 1: Beber', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FOUNTAIN, { day: 2, minutes: at(10), energy: 60 });

  await useFountain(page, 'Beber');

  await waitForHudText(page, 'Te sientes con más energía');
  expect((await currentGameState(page))?.energy).toBe(75);
});

test('Escenario 2: Beber dos veces el mismo día', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FOUNTAIN, { day: 2, minutes: at(10), energy: 75, fountainDay: 2 });

  await useFountain(page, 'Beber');

  await waitForHudText(page, 'Ya has bebido hoy');
  expect((await currentGameState(page))?.energy).toBe(75);
});

test('Escenario 3: Al día siguiente', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FOUNTAIN, { day: 3, minutes: at(10), energy: 60, fountainDay: 2 });

  await useFountain(page, 'Beber');

  await expect.poll(async () => (await currentGameState(page))?.energy).toBe(75);
});

test('Escenario 4: Echar una moneda', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FOUNTAIN, { day: 2, minutes: at(10), money: 20, openedChests: [] });

  await useFountain(page, 'Echar una moneda');

  expect((await currentGameState(page))?.money).toBe(15);
  expect((await dialogState(page))?.fullText).toBe('Detrás del granero hay algo que brilla.');
});

test('Escenario 5: Sin monedas', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FOUNTAIN, { day: 2, minutes: at(10), money: 3 });

  await useFountain(page, 'Echar una moneda');

  await waitForHudText(page, 'No tienes monedas suficientes');
  expect((await currentGameState(page))?.money).toBe(3);
});

test('Escenario 6: Pista siguiente', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FOUNTAIN, {
    day: 3,
    minutes: at(10),
    money: 20,
    openedChests: ['cofre-1'],
    pickedUpItems: ['pala-de-la-granja'],
  });

  await useFountain(page, 'Echar una moneda');

  expect((await dialogState(page))?.fullText).toBe('Al suroeste del lago, entre los árboles, se abre un sendero.');
});

test('Escenario 7: Opciones legibles', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FOUNTAIN, { day: 2, minutes: at(10) });
  await talkUntilChoiceOrEnd(page);

  // Con cada opción seleccionada (el "▶" la alarga), ninguna se monta sobre la siguiente.
  for (let selected = 0; selected < 3; selected++) {
    const bounds = await page.evaluate(() => {
      const game = (window as unknown as { game: import('phaser').Game }).game;
      const scene = game.scene.getScene('DialogScene') as unknown as { choiceTexts: import('phaser').GameObjects.Text[] };
      return scene.choiceTexts.map((text) => {
        const box = text.getBounds();
        return { left: box.left, right: box.right };
      });
    });
    expect(bounds).toHaveLength(3);
    for (let i = 0; i < bounds.length - 1; i++) {
      expect(bounds[i].right, `Opción ${i + 1} con la ${selected + 1} seleccionada`).toBeLessThanOrEqual(bounds[i + 1].left);
    }
    await press(page, 'ArrowRight');
  }
});
