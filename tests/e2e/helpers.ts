import { expect, type Page } from '@playwright/test';

// Ayudas compartidas por los tests. Consultan el juego a través de window.game,
// que main.ts solo expone en desarrollo.

type GameWindow = Window & { game: import('phaser').Game };

export async function openGame(page: Page): Promise<void> {
  await page.goto('/');
  await waitForScene(page, 'MenuScene');
}

export async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((key) => (window as unknown as GameWindow).game?.scene.isActive(key) ?? false, sceneKey);
}

export async function activeScenes(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    (window as unknown as GameWindow).game.scene.getScenes(true).map((scene) => scene.scene.key),
  );
}

// Pulsa una tecla y deja pasar un par de fotogramas para que Phaser la procese.
export async function press(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

// Hace clic sobre el texto visible de una escena, convirtiendo sus coordenadas del juego a la página.
export async function clickText(page: Page, sceneKey: string, label: string): Promise<void> {
  const point = await page.evaluate(
    ({ sceneKey, label }) => {
      const game = (window as unknown as GameWindow).game;
      const scene = game.scene.getScene(sceneKey);
      const text = scene.children.list.find(
        (child) => child.type === 'Text' && (child as import('phaser').GameObjects.Text).text.includes(label),
      ) as import('phaser').GameObjects.Text | undefined;
      if (!text) {
        throw new Error(`No hay ningún texto "${label}" en ${sceneKey}`);
      }
      const bounds = text.getBounds();
      const canvas = game.canvas.getBoundingClientRect();
      const ratio = canvas.width / game.scale.width;
      return { x: canvas.left + bounds.centerX * ratio, y: canvas.top + bounds.centerY * ratio };
    },
    { sceneKey, label },
  );
  await page.mouse.click(point.x, point.y);
}

export async function expectSceneActive(page: Page, sceneKey: string): Promise<void> {
  await expect.poll(() => activeScenes(page)).toContain(sceneKey);
}

// Empieza a anotar los efectos de sonido que reproduce el juego, o vacía la lista si ya se anotaban.
export async function recordEffects(page: Page): Promise<void> {
  await page.evaluate(() => {
    const target = window as unknown as GameWindow & { playedEffects?: string[] };
    // Si ya se estaban anotando, solo se vacía la lista.
    if (target.playedEffects) {
      target.playedEffects = [];
      return;
    }
    target.playedEffects = [];
    const sound = target.game.sound;
    const originalPlay = sound.play.bind(sound);
    sound.play = (key: string, extra?: unknown) => {
      target.playedEffects?.push(key);
      return originalPlay(key, extra as never);
    };
  });
}

export async function playedEffects(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { playedEffects: string[] }).playedEffects);
}
