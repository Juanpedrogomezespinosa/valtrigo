import { expect, test } from './fixtures';
import { dialogState, playerInfo, press, startAt, talkIndicator, waitForDialogLineComplete } from './helpers';

// HU-10. Interactuar con personajes (NPC)
// Se usa al granjero (granja, casilla 16, 9). En una partida sin encargos completados su encargo
// todavía no toca, así que dice su saludo, de dos líneas.

const NEXT_TO_FARMER = { x: 16, y: 10 };

test('Escenario 1: Iniciar un diálogo', async ({ page }) => {
  await startAt(page, 'granja', NEXT_TO_FARMER);
  await expect.poll(() => talkIndicator(page)).toEqual({ visible: true, target: 'granjero' });

  await press(page, 'e');

  // Aparecen el retrato del granjero y su diálogo.
  const portrait = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const image = game.scene.getScene('DialogScene').children.getByName('retrato') as import('phaser').GameObjects.Image;
    return { texture: image.texture.key, visible: image.visible };
  });
  expect(portrait).toEqual({ texture: 'retrato-granjero', visible: true });

  // El texto se escribe letra a letra: primero aparece una parte y luego crece hasta la línea completa.
  const first = await dialogState(page);
  expect(first?.speaker).toBe('granjero');
  expect(first?.typing).toBe(true);
  expect(first!.shownText.length).toBeLessThan(first!.fullText.length);
  expect(first!.fullText.startsWith(first!.shownText)).toBe(true);
  await page.waitForTimeout(200);
  const later = await dialogState(page);
  expect(later!.shownText.length).toBeGreaterThan(first!.shownText.length);
  await waitForDialogLineComplete(page);
  const complete = await dialogState(page);
  expect(complete?.shownText).toBe(complete?.fullText);
});

test('Escenario 2: Mostrar el texto completo', async ({ page }) => {
  await startAt(page, 'granja', NEXT_TO_FARMER);
  await press(page, 'e');
  expect((await dialogState(page))?.typing).toBe(true);

  await press(page, 'e');

  const full = await dialogState(page);
  expect(full?.lineIndex).toBe(0);
  expect(full?.shownText).toBe(full?.fullText);

  await press(page, 'e');

  const next = await dialogState(page);
  expect(next?.lineIndex).toBe(1);
  expect(next?.fullText).not.toBe(full?.fullText);
});

test('Escenario 3: Cerrar el diálogo', async ({ page }) => {
  await startAt(page, 'granja', NEXT_TO_FARMER);
  await press(page, 'e');

  // Hasta la última línea, con el texto completo.
  await waitForDialogLineComplete(page);
  await press(page, 'e');
  await waitForDialogLineComplete(page);
  expect((await dialogState(page))?.lineIndex).toBe(1);

  await press(page, 'e');

  expect(await dialogState(page)).toBeNull();
  const before = await playerInfo(page);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowDown');
  expect((await playerInfo(page)).y).toBeGreaterThan(before.y);
});

test('Escenario 4: Fuera de alcance', async ({ page }) => {
  await startAt(page, 'granja', { x: 16, y: 12 }); // tres casillas por debajo del granjero
  expect(await talkIndicator(page)).toEqual({ visible: false, target: null });

  await press(page, 'e');
  await page.waitForTimeout(100);

  expect(await dialogState(page)).toBeNull();
});
