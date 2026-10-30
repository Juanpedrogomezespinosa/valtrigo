import { expect, test } from './fixtures';
import {
  advanceDialogUntil,
  at,
  ceremonyView,
  currentGameState,
  dialogState,
  isChangingZone,
  sceneTexts,
  startAtWith,
  talkUntilChoiceOrEnd,
  textWasShown,
  watchForText,
  waitForZone,
} from './helpers';

// HU-66. Ceremonia de la feria
// Rivales con resultados fijos (src/data/fair.json): cosecha, Lucía 11 kg, Tomás 4 kg y Pablo 2 kg;
// pesca, Rosa 62 cm, Tomás 48 cm y Pablo 35 cm.

const IN_PLAZA = { x: 22, y: 14 };

async function waitForCeremony(page: import('@playwright/test').Page): Promise<void> {
  await expect.poll(async () => (await ceremonyView(page)).inCeremony, { timeout: 5000, intervals: [25] }).toBe(true);
  await expect.poll(async () => (await dialogState(page))?.speaker, { intervals: [25] }).toBe('alcalde');
}

test('Escenario 1: Empieza la ceremonia', async ({ page }) => {
  await startAtWith(page, 'plaza', IN_PLAZA, { day: 7, minutes: at(17, 59) });
  expect((await ceremonyView(page)).inCeremony).toBe(false);

  await waitForCeremony(page);

  // El alcalde está en el escenario.
  const { mayor, stage } = await ceremonyView(page);
  expect(mayor!.x).toBeGreaterThan(stage!.x);
  expect(mayor!.x).toBeLessThan(stage!.x + stage!.width);
  expect(mayor!.y).toBeGreaterThanOrEqual(stage!.y);
  expect(mayor!.y).toBeLessThan(stage!.y + stage!.height);
  expect((await currentGameState(page))?.ceremonyDone).toBe(true);
});

test('Escenario 2: Llegar tarde', async ({ page }) => {
  await startAtWith(page, 'tienda', { x: 6, y: 6 }, { day: 7, minutes: at(19) });
  expect((await currentGameState(page))?.ceremonyDone).toBe(false);

  await page.keyboard.down('ArrowDown');
  await expect.poll(() => isChangingZone(page), { intervals: [25] }).toBe(true);
  await page.keyboard.up('ArrowDown');
  await waitForZone(page, 'plaza');

  await waitForCeremony(page);
});

test('Escenario 3: Podio y premio', async ({ page }) => {
  await startAtWith(page, 'plaza', IN_PLAZA, { day: 7, minutes: at(17, 59), money: 100, harvestEntry: { item: 'calabaza', weight: 12 } });
  await waitForCeremony(page);

  await advanceDialogUntil(page, 'Concurso de la cosecha');

  expect((await ceremonyView(page)).podium).toEqual(['jugador', 'lucia', 'tomas']);
  expect((await dialogState(page))?.fullText).toBe('Concurso de la cosecha. Primer puesto: Juan, con una Calabaza de 12 kg.');
  // Al terminar el anuncio de la cosecha cobra su premio. El mensaje dura 2 segundos y la línea siguiente tarda
  // más en escribirse, así que se vigila dentro del navegador mientras avanza el diálogo.
  await watchForText(page, 'HudScene', 'Premio: 100 monedas');
  await advanceDialogUntil(page, 'Concurso de pesca');
  expect(await textWasShown(page, 'Premio: 100 monedas')).toBe(true);
  expect((await currentGameState(page))?.money).toBe(200);
});

test('Escenario 4: Fuera del podio', async ({ page }) => {
  await startAtWith(page, 'plaza', IN_PLAZA, { day: 7, minutes: at(17, 59), money: 100, fishingResult: 30 });
  await waitForCeremony(page);

  await advanceDialogUntil(page, 'Concurso de pesca');

  expect((await ceremonyView(page)).podium).toEqual(['rosa', 'tomas', 'pablo']);
  await talkUntilChoiceOrEnd(page);
  await expect.poll(async () => (await ceremonyView(page)).inCeremony).toBe(false);
  expect((await currentGameState(page))?.money).toBe(100);
});

test('Escenario 5: Discurso final', async ({ page }) => {
  await startAtWith(page, 'plaza', IN_PLAZA, {
    day: 7,
    minutes: at(17, 59),
    completedQuests: ['encargo-1', 'encargo-2', 'encargo-3', 'encargo-4', 'encargo-5'],
    activeQuests: ['encargo-6'],
  });
  await waitForCeremony(page);

  // Anuncios de los concursos y discurso del alcalde, hasta el mensaje de final.
  await talkUntilChoiceOrEnd(page);
  await expect.poll(async () => (await dialogState(page))?.speaker).toBe('fin');

  expect(await sceneTexts(page, 'HudScene')).toContain('Encargo completado');
  const state = await currentGameState(page);
  expect(state?.completedQuests).toContain('encargo-6');
  expect(state?.inventory).toContainEqual({ item: 'copa-de-valtrigo', quantity: 1 });
});
