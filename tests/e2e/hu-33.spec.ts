import { expect, test } from './fixtures';
import { openOptionsAt, optionsView, sceneTexts } from './helpers';

// HU-33. Cambiar los controles (consultar la tabla de controles)

const CONTROLS = [
  ['Mover', 'Flechas o WASD'],
  ['Correr', 'Mayús'],
  ['Interactuar', 'E'],
  ['Inventario', 'I'],
  ['Objetivos', 'O'],
  ['Pausa', 'Escape'],
  ['Usar objeto', 'E o Enter'],
  ['Pantalla completa', 'F'],
];

test('Escenario 1: Consultar los controles', async ({ page }) => {
  await openOptionsAt(page, 'Música');

  const texts = await sceneTexts(page, 'OptionsScene');
  expect(texts).toContain('Controles');
  for (const [action, key] of CONTROLS) {
    expect(texts).toContain(action);
    expect(texts).toContain(key);
  }
});

test('Escenario 2: Intentar cambiar una tecla', async ({ page }) => {
  await openOptionsAt(page, 'Música');
  const before = await optionsView(page);

  // Clic sobre la tecla de "Interactuar".
  const index = CONTROLS.findIndex(([action]) => action === 'Interactuar');
  const point = await page.evaluate((index) => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const text = game.scene.getScene('OptionsScene').children.getByName(`tecla-${index}`) as import('phaser').GameObjects.Text;
    const bounds = text.getBounds();
    const canvas = game.canvas.getBoundingClientRect();
    const ratio = canvas.width / game.scale.width;
    return { x: canvas.left + bounds.centerX * ratio, y: canvas.top + bounds.centerY * ratio };
  }, index);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.press('q'); // por si se esperase una tecla nueva

  const after = await optionsView(page);
  expect(after?.controls).toEqual(before?.controls);
  expect(after?.controls[index]).toEqual(['Interactuar', 'E']);
});

test('Escenario 3: Contenido completo', async ({ page }) => {
  await openOptionsAt(page, 'Música');

  expect((await optionsView(page))?.controls).toEqual(CONTROLS);
});
