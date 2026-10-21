import { expect, test } from './fixtures';
import {
  at,
  catchFish,
  clickText,
  currentGameState,
  dialogState,
  FISHING_SPOT,
  NEXT_TO_FISHING_STALL,
  press,
  ROD,
  sceneTexts,
  setClock,
  setRandom,
  startAtWith,
  waitForHudText,
} from './helpers';

// HU-60. Concurso de pesca
// En los escenarios 2 y 3 se adelanta el reloj hasta la hora de fin del concurso, para no esperar 90 s reales;
// el escenario 4 comprueba la duración en tiempo real.

async function signUp(page: import('@playwright/test').Page): Promise<void> {
  await press(page, 'e');
  expect(await sceneTexts(page, 'HudScene')).toContain('¿Inscribirte en el concurso de pesca?');
  await clickText(page, 'HudScene', 'Sí');
}

test('Escenario 1: Inscribirse', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FISHING_STALL, { day: 7, minutes: at(10) });

  await signUp(page);

  const state = await currentGameState(page);
  expect(state?.fishingContest).not.toBeNull();
  expect(state?.fishingContestDone).toBe(true);
});

test('Escenario 2: Ganar un premio', async ({ page }) => {
  // Concurso en marcha desde las 09:55. Primero pica una Trucha de 45 cm y, después de las 10:00, una Carpa de 30.
  await startAtWith(page, 'lago', FISHING_SPOT, {
    day: 7,
    minutes: at(9, 55),
    money: 100,
    energy: 50,
    inventory: [ROD],
    fishingContestDone: true,
    fishingContest: { endsAt: at(11, 25), best: 0 },
  });
  await setRandom(page, [0, 0.77, 0, 0.385]);

  expect(await catchFish(page)).toBe('Has pescado una Trucha de 45 cm');
  await setClock(page, at(10, 30));
  expect(await catchFish(page)).toBe('Has pescado una Carpa de 30 cm');

  await setClock(page, at(11, 25));
  await waitForHudText(page, 'Concurso terminado: tu mejor pez mide 45 cm');

  const state = await currentGameState(page);
  expect(state?.money).toBe(150);
  expect(state?.energy).toBe(50); // pescar durante el concurso no gasta energía
  expect(state?.inventory).toEqual([ROD, { item: 'trucha', quantity: 1 }, { item: 'carpa', quantity: 1 }]);
  expect(state?.fishingContest).toBeNull();
});

test('Escenario 3: Sin peces', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, {
    day: 7,
    minutes: at(10),
    money: 100,
    inventory: [ROD],
    fishingContestDone: true,
    fishingContest: { endsAt: at(11, 30), best: 0 },
  });

  await setClock(page, at(11, 30));

  await waitForHudText(page, 'Concurso terminado: no has pescado nada');
  expect((await currentGameState(page))?.money).toBe(100);
});

test('Escenario 4: Duración', async ({ page }) => {
  test.setTimeout(150_000);
  await startAtWith(page, 'plaza', NEXT_TO_FISHING_STALL, { day: 7, minutes: at(10) });

  await signUp(page);
  const start = (await currentGameState(page))!.minutes;
  expect(start - at(10)).toBeLessThanOrEqual(1);
  expect((await currentGameState(page))?.fishingContest?.endsAt).toBe(start + 90);

  // Pasan 1 minuto y 30 segundos reales: el concurso termina 90 minutos de juego después (a las 11:30).
  await waitForHudText(page, 'Concurso terminado: no has pescado nada', 100_000);
  const end = (await currentGameState(page))!.minutes;
  expect(end - start).toBeGreaterThanOrEqual(90);
  expect(end - start).toBeLessThanOrEqual(91);
  expect(end - at(11, 30)).toBeLessThanOrEqual(1);
});

test('Escenario 5: Solo una vez', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FISHING_STALL, { day: 7, minutes: at(10), fishingContestDone: true });

  await press(page, 'e');

  expect((await dialogState(page))?.fullText).toBe('Ya has participado');
  expect(await sceneTexts(page, 'HudScene')).not.toContain('¿Inscribirte en el concurso de pesca?');
});
