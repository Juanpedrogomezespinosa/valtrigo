import { expect, test } from './fixtures';
import {
  at,
  catchFish,
  clickText,
  currentGameState,
  dialogState,
  FISHING_SPOT,
  isFishing,
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
// En los escenarios 3, 4 y 8 se adelanta el reloj, para no esperar en tiempo real; el 5 y el 6 miden el tiempo real.
// Durante el concurso, cada pez usa tres valores al azar: la espera hasta "¡Pica!" (0: 2 s), la especie
// (menos de 1/3: Trucha; hasta 2/3: Carpa; el resto: Siluro) y el tamaño.

const SIGNED_UP = { day: 7, inventory: [ROD], fishingContestDone: true, fishingContest: { endsAt: null, best: 0 } };

async function countdown(page: import('@playwright/test').Page): Promise<string | undefined> {
  return (await sceneTexts(page, 'HudScene')).find((text) => text.startsWith('Concurso de pesca:'));
}

// Lanza la caña para empezar el concurso y la recoge enseguida.
async function startContest(page: import('@playwright/test').Page): Promise<void> {
  await press(page, 'e');
  await press(page, 'ArrowUp');
  expect(await isFishing(page)).toBe(false);
}

test('Escenario 1: Inscribirse', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FISHING_STALL, { day: 7, minutes: at(13) });

  await press(page, 'e');
  expect(await sceneTexts(page, 'HudScene')).toContain('¿Inscribirte en el concurso de pesca?');
  await clickText(page, 'HudScene', 'Sí');

  expect((await dialogState(page))?.fullText).toBe('Ve al lago y lanza la caña para empezar');
  expect((await currentGameState(page))?.fishingContest).toEqual({ endsAt: null, best: 0 });
  expect(await countdown(page)).toBeUndefined();
});

test('Escenario 2: Empezar en el lago', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { ...SIGNED_UP, minutes: at(13) });
  expect(await countdown(page)).toBeUndefined();

  await press(page, 'e'); // lanza la caña

  expect(['Concurso de pesca: 1:30', 'Concurso de pesca: 1:29']).toContain(await countdown(page));
  // Empezó al lanzar (13:00, o 13:01 si el reloj avanzó al cargar) y dura 90 minutos de juego.
  const start = (await currentGameState(page))!.fishingContest!.endsAt! - 90;
  expect(start).toBeGreaterThanOrEqual(at(13));
  expect(start).toBeLessThanOrEqual(at(13, 1));
});

test('Escenario 3: Mejor pez', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { ...SIGNED_UP, minutes: at(13), energy: 50 });
  await setRandom(page, [0, 0.5, 0.385, 0, 0.1, 0.77]);

  expect(await catchFish(page)).toBe('Has pescado una Carpa de 30 cm');
  expect(await catchFish(page)).toBe('Has pescado una Trucha de 45 cm');
  await setClock(page, (await currentGameState(page))!.fishingContest!.endsAt!);

  await waitForHudText(page, 'Concurso terminado: tu mejor pez mide 45 cm');
  const state = await currentGameState(page);
  expect(state?.fishingResult).toBe(45);
  expect(state?.energy).toBe(50); // pescar durante el concurso no gasta energía
  expect(state?.inventory).toEqual([ROD, { item: 'carpa', quantity: 1 }, { item: 'trucha', quantity: 1 }]);
});

test('Escenario 4: Sin peces', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { ...SIGNED_UP, minutes: at(13), fishingContest: { endsAt: at(14, 30), best: 0 } });

  await setClock(page, at(14, 30));

  await waitForHudText(page, 'Concurso terminado: no has pescado nada');
  expect((await currentGameState(page))?.fishingResult).toBe(0);
});

test('Escenario 5: Duración', async ({ page }) => {
  test.setTimeout(150_000);
  await startAtWith(page, 'lago', FISHING_SPOT, { ...SIGNED_UP, minutes: at(13) });

  await startContest(page);
  // Hora a la que empezó: la de fin menos 90 (el reloj puede haber avanzado al leerla).
  const start = (await currentGameState(page))!.fishingContest!.endsAt! - 90;
  expect(start - at(13)).toBeLessThanOrEqual(1);

  await waitForHudText(page, 'Concurso terminado: no has pescado nada', 100_000);
  const end = (await currentGameState(page))!.minutes;
  expect(end - start).toBeGreaterThanOrEqual(90);
  expect(end - start).toBeLessThanOrEqual(91);
  expect(end - at(14, 30)).toBeLessThanOrEqual(1);
});

test('Escenario 6: Cuenta atrás', async ({ page }) => {
  await startAtWith(page, 'lago', FISHING_SPOT, { ...SIGNED_UP, minutes: at(13) });
  await startContest(page);
  const start = (await currentGameState(page))!.fishingContest!.endsAt! - 90;

  // 10 segundos reales después de empezar: la hora y la cuenta atrás se leen a la vez, en el mismo fotograma.
  await expect
    .poll(
      () =>
        page.evaluate((target) => {
          const state = (window as unknown as { gameState: () => { minutes: number } }).gameState();
          if (state.minutes !== target) return null;
          const game = (window as unknown as { game: import('phaser').Game }).game;
          return (game.scene.getScene('HudScene').children.getByName('concurso') as import('phaser').GameObjects.Text).text;
        }, start + 10),
      { timeout: 15_000, intervals: [20] },
    )
    .toBe('Concurso de pesca: 1:20');
});

test('Escenario 7: Todas las especies', async ({ page }) => {
  // A las 15:00, fuera del concurso, solo picarían Carpas (HU-49).
  await startAtWith(page, 'lago', FISHING_SPOT, { ...SIGNED_UP, minutes: at(15) });
  await setRandom(page, [0, 0.1, 0.5, 0, 0.5, 0.5, 0, 0.9, 0.5]);

  expect(await catchFish(page)).toMatch(/^Has pescado una Trucha/);
  expect(await catchFish(page)).toMatch(/^Has pescado una Carpa/);
  expect(await catchFish(page)).toMatch(/^Has pescado un Siluro/);

  const inventory = (await currentGameState(page))?.inventory;
  expect(inventory).toContainEqual({ item: 'trucha', quantity: 1 });
  expect(inventory).toContainEqual({ item: 'carpa', quantity: 1 });
  expect(inventory).toContainEqual({ item: 'siluro', quantity: 1 });
});

test('Escenario 8: Fin a las 17:00', async ({ page }) => {
  // Empezó a las 16:30: sin el cierre, terminaría a las 18:00.
  await startAtWith(page, 'lago', FISHING_SPOT, { ...SIGNED_UP, minutes: at(16, 59), fishingContest: { endsAt: at(18), best: 0 } });

  await waitForHudText(page, 'Concurso terminado: no has pescado nada', 5000);

  const state = await currentGameState(page);
  expect(state?.fishingContest).toBeNull();
  expect(state?.minutes).toBeLessThanOrEqual(at(17, 1));
});

test('Escenario 9: Solo una vez', async ({ page }) => {
  await startAtWith(page, 'plaza', NEXT_TO_FISHING_STALL, { day: 7, minutes: at(13), fishingContestDone: true });

  await press(page, 'e');

  expect((await dialogState(page))?.fullText).toBe('Ya has participado');
  expect(await sceneTexts(page, 'HudScene')).not.toContain('¿Inscribirte en el concurso de pesca?');
});
