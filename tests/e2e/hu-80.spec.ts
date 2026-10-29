import { expect, test } from './fixtures';
import { at, hudEnergy, hudIcons, hudMoney, startNewGame, startWith, textContrasts } from './helpers';

// HU-80. Interfaz con iconos

const GREEN = 0x6abe30;
const YELLOW = 0xf2c94c;
const RED = 0xd9483b;

test('Escenario 1: Sol de día', async ({ page }) => {
  await startWith(page, { minutes: at(10) });

  await expect.poll(async () => (await hudIcons(page))?.timeIcon).toBe('icono-sol');
});

test('Escenario 2: Luna de noche', async ({ page }) => {
  await startWith(page, { minutes: at(21) });

  await expect.poll(async () => (await hudIcons(page))?.timeIcon).toBe('icono-luna');
});

test('Escenario 3: Dinero con icono', async ({ page }) => {
  await startNewGame(page);

  expect((await hudMoney(page))?.text).toBe('100');
  expect((await hudIcons(page))?.coinBeforeMoney).toBe(true);
});

for (const { scenario, energy, color } of [
  { scenario: 'Escenario 4: Barra de energía verde', energy: 80, color: GREEN },
  { scenario: 'Escenario 5: Barra de energía amarilla', energy: 40, color: YELLOW },
  { scenario: 'Escenario 6: Barra de energía roja', energy: 20, color: RED },
]) {
  test(scenario, async ({ page }) => {
    await startWith(page, { energy, minutes: at(10) });

    await expect.poll(() => hudEnergy(page)).toBe(`${energy}/100`);
    const icons = await hudIcons(page);
    expect(icons?.barFill).toBeCloseTo(energy / 100, 2);
    expect(icons?.barColor).toBe(color);
  });
}

test('Escenario 7: Interfaz legible', async ({ page }) => {
  await startWith(page, { minutes: at(10), money: 100, energy: 100 });
  await expect.poll(async () => (await hudMoney(page))?.text).toBe('100');

  const contrasts = await textContrasts(page, 'HudScene');
  expect(contrasts.map(({ text }) => text)).toEqual(expect.arrayContaining(['100', '100/100']));
  for (const { text, ratio } of contrasts) {
    expect(ratio, `Contraste de "${text}"`).toBeGreaterThanOrEqual(4.5);
  }
});
