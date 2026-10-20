import { expect, test } from './fixtures';
import { dialogState, playerInfo, press, startNextTo, talkUntilChoiceOrEnd } from './helpers';

// HU-37. Final del juego
// El último encargo es "La feria de Valtrigo" (encargo-6), del alcalde: se completa al hablar con él.

const BEFORE_LAST = ['encargo-1', 'encargo-2', 'encargo-3', 'encargo-4', 'encargo-5'];

test('Escenario 1: Ver el final', async ({ page }) => {
  await startNextTo(page, 'alcalde', { completedQuests: BEFORE_LAST, activeQuests: ['encargo-6'] });

  await talkUntilChoiceOrEnd(page); // diálogo del alcalde, hasta su última línea

  // Al cerrarse el diálogo del alcalde aparece el mensaje de final.
  await expect.poll(async () => (await dialogState(page))?.speaker).toBe('fin');
  expect((await dialogState(page))?.fullText).toContain('Gracias por jugar');
});

test('Escenario 2: Seguir jugando', async ({ page }) => {
  await startNextTo(page, 'alcalde', { completedQuests: BEFORE_LAST, activeQuests: ['encargo-6'] });
  await talkUntilChoiceOrEnd(page);
  await expect.poll(async () => (await dialogState(page))?.speaker).toBe('fin');

  await press(page, 'e');

  expect(await dialogState(page)).toBeNull();
  const before = await playerInfo(page);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowDown');
  expect((await playerInfo(page)).y).toBeGreaterThan(before.y);
});

test('Escenario 3: Solo una vez', async ({ page }) => {
  await startNextTo(page, 'alcalde', { completedQuests: [...BEFORE_LAST, 'encargo-6'] });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines.length).toBeGreaterThan(0);
  await page.waitForTimeout(200);
  expect(await dialogState(page)).toBeNull(); // no aparece el mensaje de final
});
