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
// Durante el concurso, cada pez usa tres valores al azar: la espera hasta "¡Pica!" (0: 2 s), la especie
// (menos de 1/3: Trucha; hasta 2/3: Carpa; el resto: Siluro) y el tamaño.

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
  // Concurso en marcha: primero pica una Carpa de 30 cm y después una Trucha de 45 cm.
  await startAtWith(page, 'lago', FISHING_SPOT, {
    day: 7,
    minutes: at(10),
    money: 100,
    energy: 50,
    inventory: [ROD],
    fishingContestDone: true,
    fishingContest: { endsAt: at(11, 30), best: 0 },
  });
  await setRandom(page, [0, 0.5, 0.385, 0, 0.1, 0.77]);

  expect(await catchFish(page)).toBe('Has pescado una Carpa de 30 cm');
  expect(await catchFish(page)).toBe('Has pescado una Trucha de 45 cm');

  await setClock(page, at(11, 30));
  await waitForHudText(page, 'Concurso terminado: tu mejor pez mide 45 cm');

  const state = await currentGameState(page);
  expect(state?.money).toBe(150);
  expect(state?.energy).toBe(50); // pescar durante el concurso no gasta energía
  expect(state?.inventory).toEqual([ROD, { item: 'carpa', quantity: 1 }, { item: 'trucha', quantity: 1 }]);
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

test('Escenario 6: Cuenta atrás', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FISHING_STALL, { day: 7, minutes: at(10) });

  await signUp(page);

  const countdown = async () => (await sceneTexts(page, 'HudScene')).find((text) => text.startsWith('Concurso de pesca:'));
  expect(['Concurso de pesca: 1:30', 'Concurso de pesca: 1:29']).toContain(await countdown());
  const start = (await currentGameState(page))!.minutes;
  // 10 segundos reales después.
  await expect.poll(async () => (await currentGameState(page))!.minutes, { timeout: 15_000, intervals: [50] }).toBe(start + 10);
  const endsAt = (await currentGameState(page))!.fishingContest!.endsAt;
  const left = endsAt - (start + 10);
  expect(await countdown()).toBe(`Concurso de pesca: ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
  expect([80, 79]).toContain(left); // 1:20 (o 1:19 si el reloj avanzó al inscribirse)
});

test('Escenario 7: Todas las especies', async ({ page }) => {
  // A las 15:00, fuera del concurso, solo picarían Carpas (HU-49).
  await startAtWith(page, 'lago', FISHING_SPOT, {
    day: 7,
    minutes: at(15),
    inventory: [ROD],
    fishingContestDone: true,
    fishingContest: { endsAt: at(16, 30), best: 0 },
  });
  await setRandom(page, [0, 0.1, 0.5, 0, 0.5, 0.5, 0, 0.9, 0.5]);

  expect(await catchFish(page)).toMatch(/^Has pescado una Trucha/);
  expect(await catchFish(page)).toMatch(/^Has pescado una Carpa/);
  expect(await catchFish(page)).toMatch(/^Has pescado un Siluro/);

  const inventory = (await currentGameState(page))?.inventory;
  expect(inventory).toContainEqual({ item: 'trucha', quantity: 1 });
  expect(inventory).toContainEqual({ item: 'carpa', quantity: 1 });
  expect(inventory).toContainEqual({ item: 'siluro', quantity: 1 });
});
