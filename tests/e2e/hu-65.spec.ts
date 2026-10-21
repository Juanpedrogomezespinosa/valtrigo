import { expect, test } from './fixtures';
import {
  at,
  NEXT_TO_MECHANISM,
  placePieces,
  press,
  sceneTexts,
  selectShopRow,
  startAtWith,
  startNextTo,
  talkUntilChoiceOrEnd,
} from './helpers';

// HU-65. Aviso al recibir un objeto
// Los mensajes de la partida aparecen arriba, en la capa de interfaz (HudScene).

const PIECES = [
  { item: 'pieza-del-reloj-1', quantity: 1 },
  { item: 'pieza-del-reloj-2', quantity: 1 },
  { item: 'pieza-del-reloj-3', quantity: 1 },
];

async function messageBounds(page: import('@playwright/test').Page, message: string) {
  return page.evaluate((message) => {
    const game = (window as unknown as { game: import('phaser').Game }).game;
    const text = game.scene
      .getScene('HudScene')
      .children.list.find((child) => (child as import('phaser').GameObjects.Text).text === message) as import('phaser').GameObjects.Text;
    const bounds = text.getBounds();
    return { top: bounds.top, bottom: bounds.bottom };
  }, message);
}

test('Escenario 1: La carta', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), activeQuests: ['encargo-1'], inventory: [] });

  await press(page, 'e');

  expect(await sceneTexts(page, 'HudScene')).toContain('Recibiste Carta del alcalde de parte de la vendedora');
});

test('Escenario 2: Recompensa de un encargo', async ({ page }) => {
  await startNextTo(page, 'alcalde', {
    minutes: at(10),
    activeQuests: ['encargo-1'],
    inventory: [{ item: 'carta-del-alcalde', quantity: 1 }],
  });

  await press(page, 'e');

  const texts = await sceneTexts(page, 'HudScene');
  expect(texts).toContain('Encargo completado');
  expect(texts).toContain('Recibiste Manzana de parte del alcalde');
  // Se ven los dos, uno debajo del otro.
  const completed = await messageBounds(page, 'Encargo completado');
  const received = await messageBounds(page, 'Recibiste Manzana de parte del alcalde');
  expect(received.top).toBeGreaterThanOrEqual(completed.bottom);
  await talkUntilChoiceOrEnd(page);
});

test('Escenario 3: Varias unidades', async ({ page }) => {
  // El encargo de la relojera se completa colocando las piezas en el mecanismo del reloj (HU-56).
  await startAtWith(page, 'torre', NEXT_TO_MECHANISM, {
    day: 6,
    minutes: at(10),
    completedQuests: ['encargo-1', 'encargo-2', 'encargo-3'],
    activeQuests: ['encargo-4'],
    inventory: PIECES,
  });

  await press(page, 'e');
  await placePieces(page, ['Engranaje de cobre', 'Muelle de plata', 'Péndulo de oro']);

  expect(await sceneTexts(page, 'HudScene')).toContain('Recibiste 2 Manzanas de parte de la relojera');
});

test('Escenario 4: Objetos comprados', async ({ page }) => {
  await startNextTo(page, 'vendedora', { minutes: at(10), money: 100, inventory: [] });
  await press(page, 'e'); // sin nada del encargo que decir, la tienda se abre directamente

  await selectShopRow(page, 'pala');
  await press(page, 'Enter');

  const texts = [...(await sceneTexts(page, 'HudScene')), ...(await sceneTexts(page, 'ShopScene'))];
  expect(texts.some((text) => text.startsWith('Recibiste'))).toBe(false);
});
