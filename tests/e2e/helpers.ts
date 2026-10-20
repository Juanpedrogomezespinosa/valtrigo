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
  completedQuests: string[];
  questProgress: Record<string, number>;
  openedChests: string[];
  pickedUpItems: string[];
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
    completedQuests: [],
    questProgress: {},
    openedChests: [],
    pickedUpItems: [],
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

// --- Personaje ---

export interface PlayerInfo {
  x: number;
  y: number;
  facing: string;
  velocity: { x: number; y: number };
}

export async function playerInfo(page: Page): Promise<PlayerInfo> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    const player = (game.scene.getScene('GameScene') as unknown as {
      player: { x: number; y: number; facing: string; body: { velocity: { x: number; y: number } } };
    }).player;
    return {
      x: player.x,
      y: player.y,
      facing: player.facing,
      velocity: { x: player.body.velocity.x, y: player.body.velocity.y },
    };
  });
}

// Abre el juego y continúa una partida guardada con el personaje en una zona y casilla concretas.
export async function startAt(page: Page, zone: string, position: { x: number; y: number }): Promise<void> {
  await setSavedGame(page, savedGame({ zone, position }));
  await openGame(page);
  await press(page, 'ArrowDown'); // "Continuar"
  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');
}

export async function playerBody(page: Page): Promise<{ left: number; right: number; top: number; bottom: number }> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    const body = (game.scene.getScene('GameScene') as unknown as { player: { body: import('phaser').Physics.Arcade.Body } })
      .player.body;
    return { left: body.left, right: body.right, top: body.top, bottom: body.bottom };
  });
}

export interface CameraInfo {
  // Parte del mundo que se ve, en píxeles del mundo.
  view: { left: number; top: number; right: number; bottom: number };
  // Posición del personaje en pantalla, en píxeles de la pantalla del juego (960×540).
  playerOnScreen: { x: number; y: number };
  screen: { width: number; height: number };
}

export async function cameraInfo(page: Page): Promise<CameraInfo> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    const scene = game.scene.getScene('GameScene') as import('phaser').Scene & { player: { x: number; y: number } };
    const camera = scene.cameras.main;
    const view = camera.worldView;
    return {
      view: { left: view.left, top: view.top, right: view.right, bottom: view.bottom },
      playerOnScreen: {
        x: (scene.player.x - view.left) * camera.zoom,
        y: (scene.player.y - view.top) * camera.zoom,
      },
      screen: { width: camera.width, height: camera.height },
    };
  });
}

// --- Cambios de zona ---

export async function isChangingZone(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    const scene = game.scene.getScene('GameScene') as unknown as { isChangingZone(): boolean };
    return game.scene.isActive('GameScene') && scene.isChangingZone();
  });
}

export async function playerTile(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    const scene = game.scene.getScene('GameScene') as unknown as { player: { getTilePosition(): { x: number; y: number } } };
    return scene.player.getTilePosition();
  });
}

// Espera a que el personaje esté en la zona indicada, con el cambio de zona terminado.
export async function waitForZone(page: Page, zone: string): Promise<void> {
  await expect
    .poll(async () => (await currentGameState(page))?.zone === zone && !(await isChangingZone(page)), {
      timeout: 5000,
      intervals: [25],
    })
    .toBe(true);
}

// --- Mediciones de tiempo ---
// Se miden dentro del navegador, fotograma a fotograma. Si se midieran desde Playwright, cada consulta
// tardaría lo que tarde la comunicación con el navegador, que con varios tests en paralelo puede ser mucho.
// La medición empieza antes de `trigger`, para no perderse el principio.

// Cuánto tiempo (ms) está visible un texto en una escena desde que aparece hasta que desaparece.
export async function measureTextVisible(
  page: Page,
  sceneKey: string,
  text: string,
  trigger: () => Promise<void>,
): Promise<number> {
  const measuring = page.evaluate(
    ({ sceneKey, text }) =>
      new Promise<number>((resolve) => {
        const game = (window as unknown as GameWindow).game;
        const isVisible = () =>
          game.scene
            .getScene(sceneKey)
            .children.list.some(
              (child) =>
                child.type === 'Text' &&
                (child as import('phaser').GameObjects.Text).text === text &&
                (child as import('phaser').GameObjects.Text).visible,
            );
        let shownAt: number | null = null;
        const tick = () => {
          const now = performance.now();
          const visible = isVisible();
          if (shownAt === null && visible) shownAt = now;
          if (shownAt !== null && !visible) return resolve(now - shownAt);
          requestAnimationFrame(tick);
        };
        tick();
      }),
    { sceneKey, text },
  );
  await trigger();
  return measuring;
}

export interface ZoneChangeMeasure {
  // Desde que empieza el fundido hasta que el personaje está en la nueva zona.
  duration: number;
  // Estado del fundido a mitad de la transición.
  halfway: { running: boolean; towardsBlack: boolean; progress: number };
  // Posiciones del personaje durante el fundido.
  positions: { x: number; y: number }[];
  // Momentos (ms desde el inicio del fundido) en que se pulsó una flecha durante el fundido.
  arrowPresses: number[];
}

// Observa el próximo cambio de zona: empieza a medir y después ejecuta `trigger`.
export async function measureZoneChange(page: Page, trigger: () => Promise<void>): Promise<ZoneChangeMeasure> {
  const measuring = page.evaluate(
    () =>
      new Promise<ZoneChangeMeasure>((resolve) => {
        const game = (window as unknown as GameWindow).game;
        type Scene = import('phaser').Scene & {
          isChangingZone(): boolean;
          player: { x: number; y: number };
        };
        const scene = () => game.scene.getScene('GameScene') as Scene;
        const changing = () => game.scene.isActive('GameScene') && scene().isChangingZone();
        let start: number | null = null;
        let halfway: ZoneChangeMeasure['halfway'] | null = null;
        const positions: ZoneChangeMeasure['positions'] = [];
        const arrowPresses: number[] = [];
        let leftOldZone = false;

        const onKey = (event: KeyboardEvent) => {
          if (start !== null && changing() && event.key.startsWith('Arrow')) arrowPresses.push(performance.now() - start);
        };
        window.addEventListener('keydown', onKey);

        const tick = () => {
          const now = performance.now();
          if (start === null) {
            if (changing()) start = now;
          } else if (!leftOldZone) {
            if (changing()) {
              positions.push({ x: scene().player.x, y: scene().player.y });
              if (halfway === null && now - start >= 250) {
                const effect = scene().cameras.main.fadeEffect;
                halfway = { running: effect.isRunning, towardsBlack: effect.direction, progress: effect.progress };
              }
            } else {
              leftOldZone = true;
            }
          }
          // Termina cuando la escena vuelve a estar activa en la nueva zona.
          if (leftOldZone && game.scene.isActive('GameScene') && !scene().isChangingZone()) {
            window.removeEventListener('keydown', onKey);
            return resolve({ duration: now - start!, halfway: halfway!, positions, arrowPresses });
          }
          requestAnimationFrame(tick);
        };
        tick();
      }),
  );
  await trigger();
  return measuring;
}

// --- NPC y diálogos ---

export interface DialogState {
  speaker: string;
  lineIndex: number;
  shownText: string;
  fullText: string;
  typing: boolean;
}

export async function dialogState(page: Page): Promise<DialogState | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('DialogScene')) return null;
    return (game.scene.getScene('DialogScene') as unknown as { getState(): DialogState }).getState();
  });
}

export async function talkIndicator(page: Page): Promise<{ visible: boolean; target: string | null }> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    const scene = game.scene.getScene('GameScene') as unknown as {
      isTalkIndicatorVisible(): boolean;
      getTalkTarget(): string | null;
    };
    return { visible: scene.isTalkIndicatorVisible(), target: scene.getTalkTarget() };
  });
}

export async function waitForDialogLineComplete(page: Page): Promise<void> {
  await expect.poll(async () => (await dialogState(page))?.typing, { intervals: [25] }).toBe(false);
}

// --- Inventario y dinero ---

export interface InventoryView {
  selected: number;
  slots: ({ item: string; name: string; quantity: number; icon: string } | null)[];
}

export async function inventoryView(page: Page): Promise<InventoryView | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('InventoryScene')) return null;
    return (game.scene.getScene('InventoryScene') as unknown as { getState(): InventoryView }).getState();
  });
}

// Abre el juego y continúa una partida guardada con los datos indicados, en la plaza.
export async function startWith(page: Page, overrides: Partial<TestGameState>): Promise<void> {
  await setSavedGame(page, savedGame({ zone: 'plaza', position: { x: 20, y: 17 }, ...overrides }));
  await openGame(page);
  await press(page, 'ArrowDown'); // "Continuar"
  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');
}

// Recoge objetos igual que lo hace el juego (window.pickUp, solo en desarrollo).
export async function pickUp(page: Page, item: string, quantity: number): Promise<boolean> {
  return page.evaluate(
    ({ item, quantity }) => (window as unknown as { pickUp(i: string, q: number): boolean }).pickUp(item, quantity),
    { item, quantity },
  );
}

export async function hudMoney(page: Page): Promise<{ text: string; x: number; y: number; visible: boolean } | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('HudScene')) return null;
    const text = game.scene.getScene('HudScene').children.getByName('dinero') as import('phaser').GameObjects.Text;
    const bounds = text.getBounds();
    return { text: text.text, x: bounds.centerX, y: bounds.centerY, visible: text.visible };
  });
}

export async function hudEnergy(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('HudScene')) return null;
    return (game.scene.getScene('HudScene').children.getByName('energia') as import('phaser').GameObjects.Text).text;
  });
}

// --- Objetos del mundo (HU-12) ---

export async function isChestOpen(page: Page, id: string): Promise<boolean> {
  return page.evaluate((id) => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { isChestOpen(id: string): boolean }).isChestOpen(id);
  }, id);
}

export async function isWorldItemOnMap(page: Page, id: string): Promise<boolean> {
  return page.evaluate((id) => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { isWorldItemOnMap(id: string): boolean }).isWorldItemOnMap(id);
  }, id);
}

// Abre el juego y continúa una partida guardada en una zona y casilla concretas, con otros datos.
export async function startAtWith(
  page: Page,
  zone: string,
  position: { x: number; y: number },
  overrides: Partial<TestGameState>,
): Promise<void> {
  await startWith(page, { zone, position, ...overrides });
}

// --- Encargos ---

// Dónde ponerse para hablar con cada NPC.
export const NEXT_TO: Record<string, { zone: string; position: { x: number; y: number } }> = {
  alcalde: { zone: 'plaza', position: { x: 24, y: 14 } },
  vendedora: { zone: 'tienda', position: { x: 9, y: 5 } },
  relojera: { zone: 'torre', position: { x: 5, y: 6 } },
  granjero: { zone: 'granja', position: { x: 16, y: 10 } },
};

// Continúa una partida junto a un NPC, con los datos indicados.
export async function startNextTo(page: Page, npc: string, overrides: Partial<TestGameState>): Promise<void> {
  await startWith(page, { zone: NEXT_TO[npc].zone, position: NEXT_TO[npc].position, ...overrides });
}

// Habla con el NPC (si no hay un diálogo abierto) y avanza el diálogo línea a línea, esperando a que
// cada una se escriba entera, hasta que aparecen opciones o se cierra. Devuelve las líneas mostradas.
export async function talkUntilChoiceOrEnd(page: Page): Promise<string[]> {
  if (!(await dialogState(page))) {
    await press(page, 'e');
  }
  const lines: string[] = [];
  for (;;) {
    await expect
      .poll(async () => {
        const state = await dialogState(page);
        return state === null || !state.typing;
      }, { intervals: [25] })
      .toBe(true);
    const state = await dialogState(page);
    if (!state) return lines;
    lines.push(state.fullText);
    if (state.choice) return lines;
    await press(page, 'e');
  }
}

// Elige una opción del diálogo con las flechas y la confirma con Enter.
export async function chooseDialogOption(page: Page, option: string): Promise<void> {
  const state = await dialogState(page);
  const target = state!.choice!.options.indexOf(option);
  const delta = target - state!.choice!.selected;
  for (let i = 0; i < Math.abs(delta); i++) {
    await press(page, delta > 0 ? 'ArrowRight' : 'ArrowLeft');
  }
  await press(page, 'Enter');
}

export async function objectivesTexts(page: Page): Promise<string[] | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('ObjectivesScene')) return null;
    return game.scene
      .getScene('ObjectivesScene')
      .children.list.filter((child) => child.type === 'Text')
      .map((child) => (child as import('phaser').GameObjects.Text).text);
  });
}
