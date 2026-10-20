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

// --- Partida guardada y estado de la partida ---

const SAVE_KEY = 'valtrigo.partida';

export interface TestGameState {
  zone: string;
  position: { x: number; y: number };
  day: number;
  minutes: number;
  money: number;
  energy: number;
  inventory: { item: string; quantity: number }[];
  activeQuests: string[];
  openedChests: string[];
}

// Partida guardada de ejemplo, con el formato de src/systems/save.ts.
export function savedGame(overrides: Partial<TestGameState> = {}): TestGameState {
  return {
    zone: 'plaza',
    position: { x: 10, y: 14 },
    day: 4,
    minutes: 14 * 60,
    money: 250,
    energy: 80,
    inventory: [{ item: 'semilla', quantity: 3 }],
    activeQuests: [],
    openedChests: [],
    ...overrides,
  };
}

// Deja una partida guardada en el navegador antes de abrir el juego. Llamar antes de openGame().
export async function setSavedGame(page: Page, state: TestGameState): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      // Solo la primera vez: si el juego guarda después, no se pisa al recargar.
      if (!sessionStorage.getItem('partida-preparada')) {
        localStorage.setItem(key, value);
        sessionStorage.setItem('partida-preparada', '1');
      }
    },
    { key: SAVE_KEY, value: JSON.stringify({ version: 1, state }) },
  );
}

export async function readSavedGame(page: Page): Promise<TestGameState | null> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  return raw ? (JSON.parse(raw) as { state: TestGameState }).state : null;
}

export async function currentGameState(page: Page): Promise<TestGameState | null> {
  return page.evaluate(() => (window as unknown as { gameState: () => TestGameState | null }).gameState());
}

// Textos visibles de una escena, de arriba abajo.
export async function sceneTexts(page: Page, sceneKey: string): Promise<string[]> {
  return page.evaluate((sceneKey) => {
    const game = (window as unknown as GameWindow).game;
    return game.scene
      .getScene(sceneKey)
      .children.list.filter((child) => child.type === 'Text' && (child as import('phaser').GameObjects.Text).visible)
      .map((child) => (child as import('phaser').GameObjects.Text).text);
  }, sceneKey);
}

// --- Partida en curso y menú de pausa ---

// Abre el juego y empieza una partida nueva (sin partida guardada previa).
export async function startNewGame(page: Page): Promise<void> {
  await openGame(page);
  await press(page, 'Enter'); // "Nueva partida"
  await waitForScene(page, 'GameScene');
}

export async function openPause(page: Page): Promise<void> {
  await press(page, 'Escape');
  await waitForScene(page, 'PauseScene');
}

export async function isScenePaused(page: Page, sceneKey: string): Promise<boolean> {
  return page.evaluate((key) => (window as unknown as GameWindow).game.scene.isPaused(key), sceneKey);
}

export async function pauseSelectedOption(page: Page): Promise<string> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('PauseScene') as unknown as { getSelectedOption(): string }).getSelectedOption();
  });
}

// Selecciona una opción del menú de pausa con las flechas y la activa con Enter.
export async function choosePauseOption(page: Page, label: string): Promise<void> {
  const options = ['Continuar', 'Opciones', 'Guardar partida', 'Salir al menú principal'];
  const target = options.indexOf(label);
  const current = options.indexOf(await pauseSelectedOption(page));
  for (let i = 0; i < Math.abs(target - current); i++) {
    await press(page, target > current ? 'ArrowDown' : 'ArrowUp');
  }
  await press(page, 'Enter');
}
