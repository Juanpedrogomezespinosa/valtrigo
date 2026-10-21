import { expect, test } from './fixtures';
import {
  answerSleep,
  at,
  currentGameState,
  daySummaryTexts,
  expectClockAt,
  isSleeping,
  moveTo,
  NEXT_TO_BED,
  press,
  selectShopRow,
  startAtWith,
  startNextTo,
  waitForMorning,
} from './helpers';

// HU-39. Resumen del día al dormir

async function waitForSummary(page: import('@playwright/test').Page): Promise<string[]> {
  await expect.poll(() => daySummaryTexts(page), { timeout: 5000, intervals: [25] }).not.toBeNull();
  return (await daySummaryTexts(page))!;
}

test.fixme('Escenario 1: Ver el resumen', async () => {
  // Pendiente de HU-44 (cosechar Nabos) y HU-48 (pescar). Día 2: vender 2 Nabos en la tienda (30 monedas)
  // y pescar 1 Trucha en el lago. Dormir en la cama: aparece "Día 2 terminado" con
  // "Monedas ganadas: 30", "Cosechas: 0" y "Peces: 1".
});

test('Escenario 2: Cerrar el resumen', async ({ page }) => {
  await startAtWith(page, 'casa', NEXT_TO_BED, { day: 2, minutes: at(21) });
  await answerSleep(page, 'Sí');
  await waitForSummary(page);
  // Mientras el resumen está visible, el día siguiente no ha empezado.
  expect((await currentGameState(page))?.day).toBe(2);

  await press(page, 'e');

  await waitForMorning(page, 3);
  expect(await daySummaryTexts(page)).toBeNull();
  expectClockAt((await currentGameState(page))?.minutes, at(6));
});

test('Escenario 3: Las compras no restan', async ({ page }) => {
  await startNextTo(page, 'vendedora', { day: 1, minutes: at(10), money: 100, inventory: [] });
  await press(page, 'e'); // la tienda se abre directamente
  await selectShopRow(page, 'pala');
  await press(page, 'Enter');
  await press(page, 'Escape');
  expect((await currentGameState(page))?.money).toBe(70);

  await moveTo(page, 'casa', NEXT_TO_BED);
  await answerSleep(page, 'Sí');

  const summary = await waitForSummary(page);
  expect(summary).toContain('Día 1 terminado');
  expect(summary).toContain('Monedas ganadas: 0');
});

test('Escenario 4: Dormirse a medianoche', async ({ page }) => {
  await startAtWith(page, 'plaza', { x: 20, y: 17 }, { day: 3, minutes: at(23, 59) });

  // Se comprueba en cada fotograma, desde la medianoche hasta que empieza el día siguiente.
  const summaryShown = page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const game = (window as unknown as { game: import('phaser').Game }).game;
        const gameState = (window as unknown as { gameState: () => { day: number } }).gameState;
        const check = () => {
          if (game.scene.isActive('DaySummaryScene')) return resolve(true);
          if (gameState().day === 4) return resolve(false);
          requestAnimationFrame(check);
        };
        check();
      }),
  );

  expect(await summaryShown).toBe(false);
  await waitForMorning(page, 4);
  expect(await isSleeping(page)).toBe(false);
});
