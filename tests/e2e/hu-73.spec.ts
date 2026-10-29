import { expect, test } from './fixtures';
import { at, npcMarker, startAtWith } from './helpers';

// HU-73. Indicadores sobre los NPC
// El jugador se queda lejos del NPC, para que no se vea el indicador "E" en lugar del marcador.
// El alcalde está en la plaza (24, 13) y Bruno en el bosque (18, 17).

const PLAZA_FAR = { x: 20, y: 17 };
const FOREST_FAR = { x: 24, y: 11 };

test('Escenario 1: Encargo para ofrecer', async ({ page }) => {
  await startAtWith(page, 'plaza', PLAZA_FAR, { day: 1, minutes: at(8, 30) });

  await expect.poll(() => npcMarker(page, 'alcalde')).toBe('!');
});

test('Escenario 2: Misión lista para entregar', async ({ page }) => {
  await startAtWith(page, 'bosque', FOREST_FAR, {
    day: 3,
    minutes: at(10),
    inventory: [{ item: 'lena', quantity: 3 }],
    activeMissions: [{ id: 'mision-6', day: 3 }],
  });

  await expect.poll(() => npcMarker(page, 'bruno')).toBe('?');
});

test('Escenario 3: Misión sin terminar', async ({ page }) => {
  await startAtWith(page, 'bosque', FOREST_FAR, {
    day: 3,
    minutes: at(10),
    inventory: [{ item: 'lena', quantity: 1 }],
    activeMissions: [{ id: 'mision-6', day: 3 }],
  });
  await page.waitForTimeout(300);

  expect(await npcMarker(page, 'bruno')).toBeNull();
});

test('Escenario 4: Destinatario de un recado', async ({ page }) => {
  await startAtWith(page, 'plaza', PLAZA_FAR, {
    day: 4,
    minutes: at(10),
    completedQuests: ['encargo-1', 'encargo-2'],
    activeMissions: [{ id: 'mision-8', day: 4 }],
  });

  await expect.poll(() => npcMarker(page, 'alcalde')).toBe('?');
});

test('Escenario 5: Sin nada que ofrecer', async ({ page }) => {
  await startAtWith(page, 'bosque', FOREST_FAR, { day: 3, minutes: at(10), completedMissions: ['mision-6'] });
  await page.waitForTimeout(300);

  expect(await npcMarker(page, 'bruno')).toBeNull();
});
