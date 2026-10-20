import { expect, test } from '@playwright/test';
import { dialogState, playerInfo, press, startAt, talkIndicator, waitForDialogLineComplete } from './helpers';

// HU-10. Interactuar con personajes (NPC)
// El alcalde está en la plaza, en la casilla (24, 13). Su diálogo tiene tres líneas.

const NEXT_TO_MAYOR = { x: 24, y: 14 };

test('Escenario 1: Iniciar un diálogo', async ({ page }) => {
  await startAt(page, 'plaza', NEXT_TO_MAYOR);
  await expect.poll(() => talkIndicator(page)).toEqual({ visible: true, target: 'alcalde' });

  await press(page, 'e');

  // Aparecen el retrato del alcalde y su diálogo.
  const portrait = await page.evaluate(() => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const image = game.scene.getScene('DialogScene').children.getByName('retrato') as import('phaser').GameObjects.Image;
    return { texture: image.texture.key, visible: image.visible };
  });
  expect(portrait).toEqual({ texture: 'retrato-alcalde', visible: true });

  // El texto se escribe letra a letra: primero aparece una parte y luego crece hasta la línea completa.
  const first = await dialogState(page);
  expect(first?.npc).toBe('alcalde');
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
  await startAt(page, 'plaza', NEXT_TO_MAYOR);
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
  await startAt(page, 'plaza', NEXT_TO_MAYOR);
  await press(page, 'e');

  // Hasta la última línea, con el texto completo.
  for (let line = 0; line < 2; line++) {
    await waitForDialogLineComplete(page);
    await press(page, 'e');
  }
  await waitForDialogLineComplete(page);
  expect((await dialogState(page))?.lineIndex).toBe(2);

  await press(page, 'e');

  expect(await dialogState(page)).toBeNull();
  const before = await playerInfo(page);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowDown');
  expect((await playerInfo(page)).y).toBeGreaterThan(before.y);
});

test('Escenario 4: Fuera de alcance', async ({ page }) => {
  await startAt(page, 'plaza', { x: 24, y: 16 }); // tres casillas por debajo del alcalde
  expect(await talkIndicator(page)).toEqual({ visible: false, target: null });

  await press(page, 'e');
  await page.waitForTimeout(100);

  expect(await dialogState(page)).toBeNull();
});
