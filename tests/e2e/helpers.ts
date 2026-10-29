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
    const target = window as unknown as GameWindow & {
      playedEffects?: string[];
      playedEffectVolumes?: { key: string; volume: number }[];
    };
    // Si ya se estaban anotando, solo se vacía la lista.
    if (target.playedEffects) {
      target.playedEffects = [];
      target.playedEffectVolumes = [];
      return;
    }
    target.playedEffects = [];
    target.playedEffectVolumes = [];
    const sound = target.game.sound;
    const originalPlay = sound.play.bind(sound);
    sound.play = (key: string, extra?: unknown) => {
      target.playedEffects?.push(key);
      target.playedEffectVolumes?.push({ key, volume: (extra as { volume?: number } | undefined)?.volume ?? 1 });
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
  playerName: string;
  appearance?: { gender: string; skin: string; hair: string };
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
  dayStats: { moneyEarned: number; harvests: number; fish: number };
  dayEvents: string[];
  visitedZones: string[];
  plots: Record<string, { dug: boolean; seed: string | null; grown: number; watered: boolean }>;
  applePickedDay: number | null;
  foraged: string[];
  activeOrders: number[];
  acceptedOrderDays: number[];
  diaryPages: string[];
  harvestEntry: { item: string; weight: number } | null;
  fishingContestDone: boolean;
  fishingContest: { endsAt: number | null; best: number } | null;
  fishingResult: number | null;
  ceremonyDone: boolean;
  activeMissions: { id: string; day: number }[];
  completedMissions: string[];
  missionProgress: string[];
  fountainDay: number | null;
  solvedPuzzles: string[];
}

// Partida guardada de ejemplo, con el formato de src/systems/save.ts.
export function savedGame(overrides: Partial<TestGameState> = {}): TestGameState {
  return {
    playerName: 'Juan',
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
    dayStats: { moneyEarned: 0, harvests: 0, fish: 0 },
    dayEvents: [],
    visitedZones: [],
    plots: {},
    applePickedDay: null,
    foraged: [],
    activeOrders: [],
    acceptedOrderDays: [],
    diaryPages: [],
    harvestEntry: null,
    fishingContestDone: false,
    fishingContest: null,
    fishingResult: null,
    ceremonyDone: false,
    activeMissions: [],
    completedMissions: [],
    missionProgress: [],
    fountainDay: null,
    solvedPuzzles: [],
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

// Abre el juego y empieza una partida nueva (sin partida guardada previa), pasando la introducción.
export async function startNewGame(page: Page): Promise<void> {
  await openGame(page);
  await press(page, 'Enter'); // "Nueva partida"
  await passIntro(page);
}

// Introducción de una partida nueva (HU-62): la pantalla que se muestra, o null si no está abierta.
export async function introPage(page: Page): Promise<{ index: number; total: number; text: string } | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('IntroScene')) return null;
    return (game.scene.getScene('IntroScene') as unknown as { getPage(): { index: number; total: number; text: string } }).getPage();
  });
}

// Pasa todas las pantallas de la introducción con E, escribe el nombre (HU-67) y espera a que empiece la partida.
export async function passIntro(page: Page, name = 'Juan'): Promise<void> {
  await waitForScene(page, 'IntroScene');
  const { total } = (await introPage(page))!;
  for (let i = 0; i < total; i++) {
    await press(page, 'e');
  }
  await enterName(page, name);
}

// Nombre escrito en la pantalla del nombre (HU-67), o null si no está abierta.
export async function nameInput(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('NameScene')) return null;
    return (game.scene.getScene('NameScene') as unknown as { getName(): string }).getName();
  });
}

// Escribe el nombre en la pantalla del nombre y lo confirma con Enter: se pasa a elegir el aspecto (HU-68).
export async function typeName(page: Page, name: string): Promise<void> {
  await waitForScene(page, 'NameScene');
  await page.keyboard.type(name);
  await press(page, 'Enter');
  await waitForScene(page, 'AppearanceScene');
}

// Escribe el nombre, confirma el aspecto inicial (HU-68) y espera a que empiece la partida.
export async function enterName(page: Page, name: string): Promise<void> {
  await typeName(page, name);
  await press(page, 'Enter');
  await waitForScene(page, 'GameScene');
}

// Pantalla del aspecto (HU-68): opción elegida, aspecto y hoja de la vista previa, o null si no está abierta.
export async function appearanceView(
  page: Page,
): Promise<{ selected: string; appearance: { gender: string; skin: string; hair: string }; previewTexture: string } | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('AppearanceScene')) return null;
    return (game.scene.getScene('AppearanceScene') as unknown as { getState(): never }).getState();
  });
}

// Colores (#rrggbb) del primer fotograma de una hoja de personaje, para comprobar la piel y el pelo (HU-68).
// Sin `texture`, la hoja del personaje en la partida.
export async function spriteColors(page: Page, texture?: string): Promise<{ texture: string; colors: string[] }> {
  return page.evaluate((key) => {
    const game = (window as unknown as GameWindow).game;
    const scene = game.scene.getScene('GameScene') as unknown as { player: { texture: { key: string } } };
    const sheet = key ?? scene.player.texture.key;
    const source = game.textures.get(sheet).getSourceImage() as CanvasImageSource;
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext('2d')!;
    context.drawImage(source, 0, 0, 16, 16, 0, 0, 16, 16);
    const data = context.getImageData(0, 0, 16, 16).data;
    const colors = new Set<string>();
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] === 0) continue;
      colors.add('#' + [data[index], data[index + 1], data[index + 2]].map((value) => value.toString(16).padStart(2, '0')).join(''));
    }
    return { texture: sheet, colors: [...colors] };
  }, texture);
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

// Interfaz con iconos (HU-80): el icono de la hora, la moneda y la barra de energía (su relleno y su color).
export async function hudIcons(
  page: Page,
): Promise<{ timeIcon: string; coinBeforeMoney: boolean; barFill: number; barColor: number } | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('HudScene')) return null;
    const hud = game.scene.getScene('HudScene');
    const byName = <T,>(name: string) => hud.children.getByName(name) as T;
    type Image = import('phaser').GameObjects.Image;
    type Rectangle = import('phaser').GameObjects.Rectangle;
    const coin = byName<Image>('icono-moneda').getBounds();
    const money = byName<import('phaser').GameObjects.Text>('dinero').getBounds();
    const bar = byName<Rectangle>('barra-energia');
    return {
      timeIcon: byName<Image>('icono-hora').texture.key,
      coinBeforeMoney: coin.right <= money.left && Math.abs(coin.centerY - money.centerY) < 4,
      barFill: bar.displayWidth / byName<Rectangle>('barra-energia-fondo').displayWidth,
      barColor: bar.fillColor,
    };
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

// HU-40: si un NPC está ahora en la zona del jugador.
export async function isNpcPresent(page: Page, id: string): Promise<boolean> {
  return page.evaluate((id) => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { isNpcPresent(id: string): boolean }).isNpcPresent(id);
  }, id);
}

// --- Puzles (HU-77 a HU-79) ---

// Coloca al personaje en el centro de una casilla de la zona actual, sin reiniciar la escena (al contrario que
// moveTo). Sirve para ir de una losa a otra o junto a una campana sin depender de cuánto avanza en cada fotograma.
export async function placePlayer(page: Page, tile: { x: number; y: number }): Promise<void> {
  await page.evaluate((tile) => {
    const game = (window as unknown as GameWindow).game;
    const player = (game.scene.getScene('GameScene') as unknown as {
      player: { body: { reset(x: number, y: number): void } };
    }).player;
    player.body.reset(tile.x * 16 + 8, tile.y * 16 + 8);
  }, tile);
  await expect.poll(() => playerTile(page), { intervals: [10] }).toEqual(tile);
  await page.waitForTimeout(50); // la escena procesa la casilla nueva
}

// Mantiene pulsada una tecla hasta que una caja del corral llega a la casilla indicada (HU-79). Suelta la tecla
// desde el navegador en cuanto llega: desde Playwright llegaría tarde si el equipo va cargado y la empujaría otra vez.
export async function pushCrateTo(page: Page, key: string, index: number, tile: { x: number; y: number }): Promise<void> {
  const keyCode = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[key];
  await page.keyboard.down(key);
  const reached = await page.evaluate(
    ({ index, tile, key, keyCode }) =>
      new Promise<boolean>((resolve) => {
        const game = (window as unknown as GameWindow).game;
        const scene = game.scene.getScene('GameScene') as unknown as { getCrates(): { x: number; y: number }[] };
        const deadline = performance.now() + 5000;
        const check = () => {
          const crate = scene.getCrates()[index];
          if (crate.x === tile.x && crate.y === tile.y) {
            window.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, keyCode } as KeyboardEventInit));
            resolve(true);
          } else if (performance.now() > deadline) resolve(false);
          else requestAnimationFrame(check);
        };
        check();
      }),
    { index, tile, key, keyCode },
  );
  await page.keyboard.up(key);
  expect(reached, `La caja ${index} no llega a la casilla ${tile.x}, ${tile.y}`).toBe(true);
  await page.waitForTimeout(200); // termina el empujón
}

// Losas encendidas del bosque, como "x,y" (HU-77).
export async function litSlabs(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { getLitSlabs(): string[] }).getLitSlabs().sort();
  });
}

// Casillas de las cajas del corral (HU-79).
export async function crates(page: Page): Promise<{ x: number; y: number }[]> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { getCrates(): { x: number; y: number }[] }).getCrates();
  });
}

// --- Misiones secundarias (HU-72 a HU-74) ---

// Marcador que se ve sobre un NPC ("!" o "?"), o null (HU-73).
export async function npcMarker(page: Page, id: string): Promise<string | null> {
  return page.evaluate((id) => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { getNpcMarker(id: string): string | null }).getNpcMarker(id);
  }, id);
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
// cada una se escriba entera, hasta que aparecen opciones, se cierra o pasa a hablar otro (por ejemplo,
// el mensaje de final). Devuelve las líneas mostradas.
export async function talkUntilChoiceOrEnd(page: Page): Promise<string[]> {
  if (!(await dialogState(page))) {
    await press(page, 'e');
  }
  const lines: string[] = [];
  let speaker: string | null = null;
  for (;;) {
    await expect
      .poll(async () => {
        const state = await dialogState(page);
        return state === null || !state.typing;
      }, { intervals: [25] })
      .toBe(true);
    const state = await dialogState(page);
    if (!state) return lines;
    speaker ??= state.speaker;
    if (state.speaker !== speaker) return lines;
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

// --- Tienda ---

export interface ShopView {
  tab: string;
  selected: number;
  rows: { item: string; name: string; quantity?: number; price: number; icon: string }[];
}

export async function shopView(page: Page): Promise<ShopView | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('ShopScene')) return null;
    return (game.scene.getScene('ShopScene') as unknown as { getState(): ShopView }).getState();
  });
}

// Selecciona un objeto de la pestaña actual de la tienda.
export async function selectShopRow(page: Page, item: string): Promise<void> {
  const view = (await shopView(page))!;
  const target = view.rows.findIndex((row) => row.item === item);
  const delta = target - view.selected;
  for (let i = 0; i < Math.abs(delta); i++) {
    await press(page, delta > 0 ? 'ArrowDown' : 'ArrowUp');
  }
}

// Las horas en el formato del estado: minutos desde las 00:00.
export const at = (hours: number, minutes = 0) => hours * 60 + minutes;

// Compara dos estados de partida. Como el reloj avanza 1 minuto por segundo real, entre leer uno y otro
// puede haber pasado un minuto: los minutos pueden diferir en 1 como mucho; todo lo demás debe coincidir.
export function expectSameGame(actual: TestGameState | null, expected: TestGameState | null): void {
  expect(actual).not.toBeNull();
  expect(expected).not.toBeNull();
  const { minutes: actualMinutes, ...actualRest } = actual!;
  const { minutes: expectedMinutes, ...expectedRest } = expected!;
  expect(actualRest).toEqual(expectedRest);
  expect(Math.abs(actualMinutes - expectedMinutes)).toBeLessThanOrEqual(1);
}

// El reloj marca la hora indicada. Puede haber avanzado 1 minuto desde que se cargó la partida,
// porque avanza 1 minuto por segundo real.
export function expectClockAt(minutes: number | undefined, expected: number): void {
  expect(minutes).toBeGreaterThanOrEqual(expected);
  expect(minutes).toBeLessThanOrEqual(expected + 1);
}

export async function hudClock(page: Page): Promise<{ day: string; time: string } | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('HudScene')) return null;
    const hud = game.scene.getScene('HudScene');
    return {
      day: (hud.children.getByName('dia') as import('phaser').GameObjects.Text).text,
      time: (hud.children.getByName('hora') as import('phaser').GameObjects.Text).text,
    };
  });
}

export const clockText = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

// Oscuridad de la capa de noche, entre 0 (luz normal) y 1 (completamente oscura).
export async function screenDarkness(page: Page): Promise<number> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('NightScene') as unknown as { getDarkness(): number }).getDarkness();
  });
}

// --- Dormir (HU-24 y HU-25) ---

// Junto a la cama de la casa (la cama ocupa las casillas 1,3 y 1,4).
export const NEXT_TO_BED = { x: 2, y: 4 };

export async function isSleeping(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    return game.scene.isActive('GameScene') && (game.scene.getScene('GameScene') as unknown as { isSleeping(): boolean }).isSleeping();
  });
}

// Espera a que termine el sueño y la partida siga en el día siguiente.
export async function waitForMorning(page: Page, day: number): Promise<void> {
  await expect
    .poll(async () => (await currentGameState(page))?.day === day && !(await isSleeping(page)), { timeout: 5000, intervals: [25] })
    .toBe(true);
}

// Resumen del día (HU-39): los textos de la pantalla, o null si no está abierta.
export async function daySummaryTexts(page: Page): Promise<string[] | null> {
  const open = await page.evaluate(() => (window as unknown as GameWindow).game.scene.isActive('DaySummaryScene'));
  return open ? sceneTexts(page, 'DaySummaryScene') : null;
}

// Espera a que aparezca el resumen del día y lo cierra con E.
export async function closeDaySummary(page: Page): Promise<void> {
  await expect.poll(() => daySummaryTexts(page), { timeout: 5000, intervals: [25] }).not.toBeNull();
  await press(page, 'e');
}

// Lleva al personaje a otra zona y casilla sin recorrer el camino, para preparar un escenario.
// Espera a que la escena se haya creado de nuevo (el estado cambia antes de que termine de reiniciarse).
export async function moveTo(page: Page, zone: string, position: { x: number; y: number }): Promise<void> {
  await page.evaluate(
    ({ zone, position }) =>
      new Promise<void>((resolve) => {
        const state = (window as unknown as { gameState: () => TestGameState }).gameState();
        state.zone = zone;
        state.position = position;
        const scene = (window as unknown as GameWindow).game.scene.getScene('GameScene');
        scene.events.once('create', () => resolve());
        scene.scene.restart({ facing: 'down' });
      }),
    { zone, position },
  );
  await waitForZone(page, zone);
}

// Pulsa E junto a la cama y responde a "¿Dormir?".
export async function answerSleep(page: Page, answer: 'Sí' | 'No'): Promise<void> {
  await press(page, 'e');
  expect(await sceneTexts(page, 'HudScene')).toContain('¿Dormir?');
  await clickText(page, 'HudScene', answer);
}

// Efectos anotados por recordEffects, con el volumen con el que se reprodujeron (0 a 1).
export async function playedEffectVolumes(page: Page): Promise<{ key: string; volume: number }[]> {
  return page.evaluate(() => (window as unknown as { playedEffectVolumes: { key: string; volume: number }[] }).playedEffectVolumes);
}

// --- Opciones de sonido ---

const SETTINGS_KEY = 'valtrigo.opciones';

// Deja unos ajustes de sonido guardados antes de abrir el juego (solo la primera vez en la página).
export async function setSoundSettings(
  page: Page,
  settings: { musicBars: number; effectBars: number; muted: boolean },
): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      if (!sessionStorage.getItem('opciones-preparadas')) {
        localStorage.setItem(key, value);
        sessionStorage.setItem('opciones-preparadas', '1');
      }
    },
    { key: SETTINGS_KEY, value: JSON.stringify(settings) },
  );
}

export interface OptionsView {
  selected: string;
  musicBars: number;
  effectBars: number;
  muted: boolean;
  fullscreen: boolean;
  controls: [string, string][];
}

export async function optionsView(page: Page): Promise<OptionsView | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('OptionsScene')) return null;
    return (game.scene.getScene('OptionsScene') as unknown as { getState(): OptionsView }).getState();
  });
}

export interface AudioState {
  musicGain: number | null;
  muted: boolean;
  music: string | null;
  musicStarts: number;
  running: boolean;
}

export async function audioState(page: Page): Promise<AudioState> {
  return page.evaluate(() => (window as unknown as { audioState(): AudioState }).audioState());
}

// Abre Opciones desde el menú principal y selecciona una fila.
export async function openOptionsAt(
  page: Page,
  row: 'Música' | 'Efectos' | 'Silenciar' | 'Pantalla completa' | 'Volver',
): Promise<void> {
  await openGame(page);
  for (let i = 0; i < 4; i++) await press(page, 'ArrowDown'); // "Opciones"
  await press(page, 'Enter');
  await waitForScene(page, 'OptionsScene');
  const rows = ['Música', 'Efectos', 'Silenciar', 'Pantalla completa', 'Volver'];
  for (let i = 0; i < rows.indexOf(row); i++) await press(page, 'ArrowDown');
  expect((await optionsView(page))?.selected).toBe(row);
}

// --- Legibilidad (HU-36) ---

export interface TextContrast {
  text: string;
  ratio: number;
}

// Contraste real en pantalla de cada texto visible de una escena: se captura la zona del texto, se toma
// como fondo el color más frecuente que no es el del texto y se calcula el contraste según WCAG.
export async function textContrasts(page: Page, sceneKey: string): Promise<TextContrast[]> {
  return page.evaluate(async (sceneKey) => {
    const game = (window as unknown as GameWindow).game;
    type Text = import('phaser').GameObjects.Text;
    const texts = game.scene
      .getScene(sceneKey)
      .children.list.filter((child) => child.type === 'Text' && (child as Text).visible && (child as Text).text.trim() !== '') as Text[];

    const luminance = ([r, g, b]: number[]) => {
      const [R, G, B] = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

    const results: { text: string; ratio: number }[] = [];
    for (const text of texts) {
      const bounds = text.getBounds();
      const image = await new Promise<HTMLImageElement>((resolve) =>
        game.renderer.snapshotArea(
          Math.max(0, Math.floor(bounds.x)),
          Math.max(0, Math.floor(bounds.y)),
          Math.max(1, Math.ceil(bounds.width)),
          Math.max(1, Math.ceil(bounds.height)),
          (snapshot) => resolve(snapshot as HTMLImageElement),
        ),
      );
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;

      const textColor = hexToRgb(text.style.color as string);
      const counts = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const pixel = [data[i], data[i + 1], data[i + 2]];
        const distance = Math.hypot(pixel[0] - textColor[0], pixel[1] - textColor[1], pixel[2] - textColor[2]);
        if (distance < 60) continue; // píxeles del propio texto o de su borde suavizado
        const key = pixel.join(',');
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const background = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0].split(',').map(Number);
      if (!background) continue;
      const [light, dark] = [luminance(textColor), luminance(background)].sort((a, b) => b - a);
      results.push({ text: text.text, ratio: (light + 0.05) / (dark + 0.05) });
    }
    return results;
  }, sceneKey);
}

// --- Huerto y manzano (HU-41 a HU-45) ---

// El huerto ocupa las casillas 17 a 22 y las filas 4 a 7 de la granja. Desde la casilla (17, 3), mirando
// hacia abajo (como aparece el personaje al cargar la partida), se tiene delante la parcela (17, 4).
export const FRONT_OF_PLOT = { x: 17, y: 3 };
export const PLOT = '17,4';
// Junto al manzano, cuyo tronco está en la casilla (12, 5).
export const NEXT_TO_APPLE_TREE = { x: 12, y: 6 };

export const DUG = { dug: true, seed: null, grown: 0, watered: false };

export async function plotView(
  page: Page,
  key = PLOT,
): Promise<{ soilVisible: boolean; watered: boolean; cropFrame: number | null } | null> {
  const [x, y] = key.split(',').map(Number);
  return page.evaluate(
    ({ x, y }) => {
      const game = (window as unknown as GameWindow).game;
      const scene = game.scene.getScene('GameScene') as unknown as {
        getPlotView(x: number, y: number): { soilVisible: boolean; watered: boolean; cropFrame: number | null } | null;
      };
      return scene.getPlotView(x, y);
    },
    { x, y },
  );
}

// Estado guardado en la partida de una parcela (sin cavar si no aparece).
export async function plotState(page: Page, key = PLOT) {
  const state = await currentGameState(page);
  return state?.plots[key] ?? { dug: false, seed: null, grown: 0, watered: false };
}

// Lista para elegir un objeto, o null si no está abierta: las semillas para sembrar (HU-42) o las cosechas
// para el concurso de la feria (HU-59).
export async function itemChoice(page: Page): Promise<{ options: string[]; selected: number } | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('ItemChoiceScene')) return null;
    return (game.scene.getScene('ItemChoiceScene') as unknown as { getState(): { options: string[]; selected: number } }).getState();
  });
}

export const seedMenu = itemChoice;

export async function isAppleOnTree(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { isAppleOnTree(): boolean }).isAppleOnTree();
  });
}

// Duerme en la cama (desde la casa, junto a ella), cierra el resumen del día y espera al día siguiente.
export async function sleepUntil(page: Page, day: number): Promise<void> {
  await moveTo(page, 'casa', NEXT_TO_BED);
  await answerSleep(page, 'Sí');
  await closeDaySummary(page);
  await waitForMorning(page, day);
}

// --- Pesca (HU-48 y HU-49) ---

// En el lago, desde la casilla (15, 7) y mirando hacia abajo (como aparece al cargar la partida),
// se tiene delante el agua.
export const FISHING_SPOT = { x: 15, y: 7 };
export const ROD = { item: 'cana-de-pescar', quantity: 1 };

// Fija los valores al azar del juego (window.setRandom, solo en desarrollo). Con 0, "¡Pica!" aparece
// a los 2 segundos y el pez sale con el tamaño mínimo de su especie.
export async function setRandom(page: Page, values: number[]): Promise<void> {
  await page.evaluate((values) => (window as unknown as { setRandom(v: number[]): void }).setRandom(values), values);
}

export async function isFishing(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { isFishing(): boolean }).isFishing();
  });
}

// Espera a que aparezca un texto en la capa de interfaz.
export async function waitForHudText(page: Page, text: string, timeout = 7000): Promise<void> {
  await expect.poll(async () => (await sceneTexts(page, 'HudScene')).includes(text), { timeout, intervals: [25] }).toBe(true);
}

// Lanza la caña, espera a "¡Pica!" y saca el pez. Devuelve el mensaje "Has pescado...".
// Si aún se ve el mensaje del pez anterior, espera a que desaparezca para no confundirlo con el nuevo.
export async function catchFish(page: Page): Promise<string> {
  const caughtVisible = async () => (await sceneTexts(page, 'HudScene')).some((text) => text.startsWith('Has pescado'));
  await expect.poll(caughtVisible, { timeout: 5000, intervals: [50] }).toBe(false);
  await press(page, 'e');
  await waitForHudText(page, '¡Pica!');
  await press(page, 'e');
  await expect
    .poll(async () => (await sceneTexts(page, 'HudScene')).find((text) => text.startsWith('Has pescado')), { intervals: [25] })
    .toBeTruthy();
  return (await sceneTexts(page, 'HudScene')).find((text) => text.startsWith('Has pescado'))!;
}

// --- Bosque (HU-50) ---

// Dónde ponerse para recoger algunos puntos del bosque.
export const NEXT_TO_FORAGE = {
  'setas-1': { x: 5, y: 4 }, // Setas en (5, 3)
  'moras-3': { x: 4, y: 11 }, // Moras en (4, 12)
  'tronco-5': { x: 13, y: 11 }, // tronco en (13, 12)
};

export async function isForageSpotOnMap(page: Page, id: string): Promise<boolean> {
  return page.evaluate((id) => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { isForageSpotOnMap(id: string): boolean }).isForageSpotOnMap(id);
  }, id);
}

// --- Tablón de anuncios (HU-52 a HU-54) ---

// El tablón está en la casilla (17, 11) de la plaza; justo debajo se puede pulsar E.
export const NEXT_TO_BOARD = { x: 17, y: 12 };

// --- Misterio del reloj (HU-55 y HU-56) ---

// Junto al mecanismo del reloj, que está en la casilla (5, 2) de la torre.
export const NEXT_TO_MECHANISM = { x: 5, y: 3 };
export const CLOCK_PIECES = [
  { item: 'pieza-del-reloj-1', quantity: 1 }, // Engranaje de cobre
  { item: 'pieza-del-reloj-2', quantity: 1 }, // Muelle de plata
  { item: 'pieza-del-reloj-3', quantity: 1 }, // Péndulo de oro
];

export async function mechanismState(page: Page): Promise<{ holes: (string | null)[]; options: string[]; selected: number } | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('MechanismScene')) return null;
    return (
      game.scene.getScene('MechanismScene') as unknown as { getState(): { holes: (string | null)[]; options: string[]; selected: number } }
    ).getState();
  });
}

// Coloca las piezas en los huecos del mecanismo, en el orden indicado (de abajo arriba).
export async function placePieces(page: Page, names: string[]): Promise<void> {
  for (const name of names) {
    const state = (await mechanismState(page))!;
    const delta = state.options.indexOf(name) - state.selected;
    for (let i = 0; i < Math.abs(delta); i++) {
      await press(page, delta > 0 ? 'ArrowDown' : 'ArrowUp');
    }
    await press(page, 'Enter');
  }
}

export async function isDiaryPageOnMap(page: Page, id: string): Promise<boolean> {
  return page.evaluate((id) => {
    const game = (window as unknown as GameWindow).game;
    return (game.scene.getScene('GameScene') as unknown as { isDiaryPageOnMap(id: string): boolean }).isDiaryPageOnMap(id);
  }, id);
}

// --- Feria (HU-58 a HU-60) ---

// Debajo de cada puesto de la plaza: el de la cosecha está en (15, 14) y el de pesca en (19, 14).
export const NEXT_TO_HARVEST_STALL = { x: 15, y: 15 };
export const NEXT_TO_FISHING_STALL = { x: 19, y: 15 };

export const VISITORS = ['rosa', 'lucia', 'tomas', 'pablo', 'fran', 'elena'];

// Casillas de la guirnalda de la feria y de sus postes (HU-58).
export async function garlandView(page: Page): Promise<{ tiles: { x: number; y: number }[]; posts: { x: number; y: number }[] }> {
  return page.evaluate(() =>
    ((window as unknown as GameWindow).game.scene.getScene('GameScene') as unknown as { getGarland(): never }).getGarland(),
  );
}

// Casillas de la capa de obstáculos de la zona (índice de la casilla, o -1 si está vacía), para HU-69.
export async function obstacleGrid(page: Page): Promise<number[][]> {
  return page.evaluate(() =>
    ((window as unknown as GameWindow).game.scene.getScene('GameScene') as unknown as { getObstacleGrid(): number[][] }).getObstacleGrid(),
  );
}

// Lo que hay de la feria en la plaza: puestos, guirnalda, escenario, podio y visitantes presentes.
export async function fairView(
  page: Page,
): Promise<{ harvestStall: boolean; fishingStall: boolean; garland: boolean; stage: boolean; podium: boolean; visitors: string[] }> {
  return page.evaluate((visitors) => {
    const game = (window as unknown as GameWindow).game;
    const scene = game.scene.getScene('GameScene') as unknown as {
      isStallOnMap(kind: string): boolean;
      isGarlandOnMap(): boolean;
      isCeremonyPlatformOnMap(): { stage: boolean; podium: boolean };
      isNpcPresent(id: string): boolean;
    };
    return {
      harvestStall: scene.isStallOnMap('cosecha'),
      fishingStall: scene.isStallOnMap('pesca'),
      garland: scene.isGarlandOnMap(),
      ...scene.isCeremonyPlatformOnMap(),
      visitors: visitors.filter((id) => scene.isNpcPresent(id)),
    };
  }, VISITORS);
}

// --- Ceremonia (HU-66) ---

export async function ceremonyView(
  page: Page,
): Promise<{ inCeremony: boolean; podium: string[]; mayor: { x: number; y: number } | null; stage: { x: number; y: number; width: number; height: number } | null }> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    const scene = game.scene.getScene('GameScene') as unknown as {
      isInCeremony(): boolean;
      getPodium(): string[];
      getNpcPosition(id: string): { x: number; y: number } | null;
      getStageArea(): { x: number; y: number; width: number; height: number } | null;
    };
    return { inCeremony: scene.isInCeremony(), podium: scene.getPodium(), mayor: scene.getNpcPosition('alcalde'), stage: scene.getStageArea() };
  });
}

// Avanza el diálogo con E hasta que aparece una línea que empieza por `prefix` (y se termina de escribir).
export async function advanceDialogUntil(page: Page, prefix: string, timeout = 30_000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const state = await dialogState(page);
    if (state?.fullText.startsWith(prefix)) {
      await expect.poll(async () => (await dialogState(page))?.typing, { intervals: [25] }).toBe(false);
      return;
    }
    if (state && !state.typing) await press(page, 'e');
    else await page.waitForTimeout(50);
  }
  throw new Error(`No ha aparecido la línea "${prefix}"`);
}

// Pone el reloj en una hora concreta, para no esperar en tiempo real (por ejemplo, al final de un concurso).
export async function setClock(page: Page, minutes: number): Promise<void> {
  await page.evaluate((minutes) => {
    (window as unknown as { gameState: () => TestGameState }).gameState().minutes = minutes;
  }, minutes);
}

// --- Partidas de práctica (HU-61) ---

export async function practiceMenu(page: Page): Promise<{ options: string[]; selected: string } | null> {
  return page.evaluate(() => {
    const game = (window as unknown as GameWindow).game;
    if (!game.scene.isActive('PracticeScene')) return null;
    const scene = game.scene.getScene('PracticeScene') as unknown as { getOptions(): string[]; getSelectedOption(): string };
    return { options: scene.getOptions(), selected: scene.getSelectedOption() };
  });
}

// Abre la lista de partidas de práctica desde el menú principal (tercera opción).
export async function openPracticeMenu(page: Page): Promise<void> {
  await openGame(page);
  await press(page, 'ArrowDown');
  await press(page, 'ArrowDown');
  await press(page, 'Enter');
  await waitForScene(page, 'PracticeScene');
}
