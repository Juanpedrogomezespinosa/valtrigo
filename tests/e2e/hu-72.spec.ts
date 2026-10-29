import { expect, test } from './fixtures';
import {
  at,
  chooseDialogOption,
  currentGameState,
  isNpcPresent,
  moveTo,
  objectivesTexts,
  press,
  startAtWith,
  talkUntilChoiceOrEnd,
  waitForHudText,
} from './helpers';

// HU-72. Misiones secundarias
// Dónde ponerse para hablar con cada vecino (debajo de su punto, dentro de su horario):
// Bruno en el bosque (18, 17), Marta en la plaza (28, 14) de 08:00 a 10:00, Tomás en la plaza (11, 13) de 09:00 a
// 13:00, Pablo en el barrio (13, 11) de 09:00 a 12:00, Lucía en el barrio (19, 8) de 07:00 a 12:00 y Bigotes,
// cuando se escapa, en la granja (13, 6).

const NEXT_TO_BRUNO = { x: 18, y: 18 };
const NEXT_TO_PABLO = { x: 13, y: 12 };

async function acceptOffer(page: import('@playwright/test').Page): Promise<void> {
  await talkUntilChoiceOrEnd(page);
  await chooseDialogOption(page, 'Aceptar');
  await talkUntilChoiceOrEnd(page); // el vecino sigue hablando hasta cerrar el diálogo
}

async function openTab(page: import('@playwright/test').Page, rightPresses: number): Promise<string[]> {
  await press(page, 'o');
  for (let i = 0; i < rightPresses; i++) await press(page, 'ArrowRight');
  return (await objectivesTexts(page))!;
}

test('Escenario 1: Aceptar una misión', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_BRUNO, { day: 3, minutes: at(10) });

  await acceptOffer(page);

  const texts = await openTab(page, 1); // "Misiones"
  expect(texts).toContain('[ Misiones ]');
  expect(texts).toContain('Leña para el invierno');
  expect(texts).toContain('Encargada por: Bruno');
});

test('Escenario 2: Completar una misión', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_BRUNO, {
    day: 3,
    minutes: at(10),
    money: 100,
    inventory: [{ item: 'lena', quantity: 3 }],
    activeMissions: [{ id: 'mision-6', day: 3 }],
  });

  await talkUntilChoiceOrEnd(page);

  await waitForHudText(page, 'Misión completada');
  const state = await currentGameState(page);
  expect(state?.money).toBe(145);
  expect(state?.inventory).toEqual([]);
  expect(state?.activeMissions).toEqual([]);
  expect(state?.completedMissions).toEqual(['mision-6']);
});

test('Escenario 3: Límite de misiones', async ({ page }) => {
  await startAtWith(page, 'bosque', NEXT_TO_BRUNO, {
    day: 3,
    minutes: at(10),
    activeMissions: [
      { id: 'mision-3', day: 2 },
      { id: 'mision-7', day: 3 },
      { id: 'mision-10', day: 3 },
    ],
  });

  const lines = await talkUntilChoiceOrEnd(page);

  expect(lines).toEqual(['Ya tienes 3 misiones activas']);
  expect((await currentGameState(page))?.activeMissions).toHaveLength(3);
});

test('Escenario 4: Misión y encargo a la vez', async ({ page }) => {
  await startAtWith(page, 'barrio', { x: 19, y: 9 }, { day: 2, minutes: at(10), completedQuests: ['encargo-1'], activeQuests: ['encargo-2'] });

  await acceptOffer(page);

  const quests = await openTab(page, 0);
  expect(quests).toContain('Semillas para la cosecha');
  await press(page, 'ArrowRight');
  expect(await objectivesTexts(page)).toContain('Semillas para Lucía');
  expect((await currentGameState(page))?.activeQuests).toEqual(['encargo-2']);
});

test('Escenario 5: Llevar un objeto a otro vecino', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 28, y: 15 }, { day: 1, minutes: at(9), inventory: [] });

  await acceptOffer(page);
  await waitForHudText(page, 'Recibiste Carta para Tomás de parte de Marta');
  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'carta-para-tomas', quantity: 1 }]);

  await moveTo(page, 'plaza', { x: 11, y: 14 });
  await talkUntilChoiceOrEnd(page);

  await waitForHudText(page, 'Misión completada');
  expect((await currentGameState(page))?.inventory).toEqual([]);
});

test('Escenario 6: Encontrar a Bigotes', async ({ page }) => {
  await startAtWith(page, 'granja', { x: 13, y: 7 }, { day: 1, minutes: at(10), inventory: [], activeMissions: [{ id: 'mision-2', day: 1 }] });
  expect(await isNpcPresent(page, 'bigotes')).toBe(true);

  expect(await talkUntilChoiceOrEnd(page)).toEqual(['¡Miau!']);
  // Al encontrarlo, vuelve al barrio.
  await expect.poll(() => isNpcPresent(page, 'bigotes')).toBe(false);

  await moveTo(page, 'barrio', NEXT_TO_PABLO);
  await talkUntilChoiceOrEnd(page);

  await waitForHudText(page, 'Misión completada');
  expect((await currentGameState(page))?.inventory).toEqual([{ item: 'manzana', quantity: 2 }]);
});

test('Escenario 7: Recompensa que no cabe', async ({ page }) => {
  const full = Array.from({ length: 20 }, () => ({ item: 'semilla', quantity: 99 }));
  await startAtWith(page, 'barrio', NEXT_TO_PABLO, {
    day: 1,
    minutes: at(10),
    inventory: full,
    activeMissions: [{ id: 'mision-2', day: 1 }],
    missionProgress: ['mision-2'], // Bigotes ya encontrado
  });

  await press(page, 'e');

  await waitForHudText(page, 'Inventario lleno');
  expect((await currentGameState(page))?.activeMissions).toEqual([{ id: 'mision-2', day: 1 }]);
});
