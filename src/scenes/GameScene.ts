import Phaser from 'phaser';
import {
  COLORS,
  FONT_FAMILY,
  MESSAGE_MS,
  SLEEP_FADE_MS,
  RUN_ENERGY_MS,
  RUN_MIN_ENERGY,
  RUN_SPEED_FACTOR,
  STEP_SOUND_MS,
  TALK_DISTANCE,
  TILE_SIZE,
  WATERED_TINT,
  WORLD_ZOOM,
  ZONE_FADE_MS,
} from '../config';
import { byGender, genderText, playerTexture } from '../systems/appearance';
import chests from '../data/chests.json';
import dialogues from '../data/dialogues.json';
import signs from '../data/signs.json';
import diary from '../data/diary.json';
import forage from '../data/forage.json';
import worldItems from '../data/worldItems.json';
import { Chest } from '../entities/Chest';
import { Npc } from '../entities/Npc';
import { Player, type Direction } from '../entities/Player';
import { getGameState, isRunning, setRunning, startGame } from '../systems/gameState';
import { addItem, canAdd, countItem, removeItem, type ItemId } from '../systems/inventory';
import {
  clearPlot,
  cropFrame,
  cropOf,
  dig,
  FRAME,
  getPlot,
  hasApple,
  isReady,
  pickApple,
  SEEDS,
  sow,
  water,
  type SeedId,
} from '../systems/farm';
import { closedDoorMessage, closedHouse, firstVisitNotice } from '../systems/doors';
import {
  areContestsOpen,
  awardPrize,
  CONTESTS_CLOSE_MINUTES,
  CONTESTS_CLOSED_MESSAGE,
  cropDetail,
  enterHarvestContest,
  finishFishingContestIfDue,
  FISHING_CONTEST,
  fishingRanking,
  HARVEST_CONTEST,
  harvestRanking,
  isCeremonyDue,
  isFairDay,
  isFishingContestRunning,
  presentableCrops,
  recordContestCatch,
  signUpForFishingContest,
  startFishingContestIfSignedUp,
  type Entry,
} from '../systems/fair';
import { catchAt, caughtMessage, type Catch } from '../systems/fishing';
import {
  acceptTodayOrder,
  BOARD_NAME,
  deliverableOrders,
  deliverOrder,
  orderForDay,
  orderText,
  todayOrderStatus,
} from '../systems/orders';
import { randomInt } from '../systems/random';
import { spendEnergy, type WorkAction } from '../systems/energy';
import { isShopOpen } from '../systems/economy';
import { fishingTimes, watersSides } from '../systems/upgrades';
import { writeSave } from '../systems/save';
import { playEffect, playZoneMusic } from '../systems/audio';
import { isNpcInZone } from '../systems/schedules';
import { recordEvent } from '../systems/tasks';
import { stateAfterMidnight, stateAfterSleeping } from '../systems/sleep';
import { advanceTime } from '../systems/time';
import {
  acceptQuest,
  canReceiveReward,
  completeQuest,
  conversationWith,
  LAST_QUEST,
  activeMechanismQuest,
  ceremonyQuest,
  mechanismOrder,
  receivedMessage,
  type NpcId,
  type Quest,
  saysFairGreeting,
} from '../systems/quests';
import { findMapPoint, getProperty, mapKey, mapObjects, musicKey, pointTile, ZONES, type MapObject, type TilePosition, type ZoneId } from '../systems/zones';
import { showConfirmDialog } from '../ui/confirmDialog';
import { showMessage } from '../ui/message';
import { drink, FOUNTAIN, throwCoin } from '../systems/fountain';
import { canReceivePuzzleReward, isSolved, PUZZLES, solvePuzzle, type PuzzleId } from '../systems/puzzles';
import {
  acceptMission,
  canAcceptMoreMissions,
  canReceiveMissionReward,
  carriedItem,
  completeMission,
  failedMessage,
  failExpiredMissions,
  markFound,
  MISSION_COMPLETED,
  missionToComplete,
  missionToFind,
  missionToOffer,
  MISSIONS_FULL_LINES,
  ownActiveMission,
  type Mission,
} from '../systems/missions';
import type { DaySummarySceneData } from './DaySummaryScene';
import type { DialogSceneData } from './DialogScene';
import type { OverlaySceneData } from './InventoryScene';
import type { MechanismSceneData } from './MechanismScene';
import type { ItemChoiceSceneData } from './ItemChoiceScene';

export interface GameSceneData {
  // Hacia dónde mira el personaje al aparecer (al llegar por una puerta).
  facing?: Direction;
  // Aviso que aparece al llegar, la primera vez que se entra en la zona (HU-64).
  notice?: string;
}

interface Door {
  area: Phaser.Geom.Rectangle;
  zone: ZoneId;
  // Casa en la que no se puede entrar (HU-70): la puerta no lleva a ninguna zona.
  closedHouse?: string;
  // Dirección en la que hay que caminar para cruzarla.
  direction: Direction;
}

// Algo con lo que se interactúa pulsando E a menos de una casilla: NPC, cofres, carteles y objetos sueltos.
interface Interactable {
  kind:
    | 'npc'
    | 'cofre'
    | 'cartel'
    | 'objeto'
    | 'cama'
    | 'manzano'
    | 'parcela'
    | 'agua'
    | 'recurso'
    | 'tablon'
    | 'fuente'
    | 'campana'
    | 'mecanismo'
    | 'fogon'
    | 'pagina'
    | 'puesto';
  id: string;
  // Lo que ocupa en el mundo.
  area: Phaser.Geom.Rectangle;
  // Si pulsar E hace algo ahora mismo (un cofre abierto o un objeto ya recogido, no).
  isAvailable(): boolean;
  interact(): void;
}

// Escena de juego: dibuja la zona actual y al personaje.
export class GameScene extends Phaser.Scene {
  player!: Player;

  private facing?: Direction;
  private notice?: string;
  private doors: Door[] = [];
  private interactables: Interactable[] = [];
  private chests: Chest[] = [];
  private npcs: Npc[] = [];
  // Puzles (HU-77 a HU-79). Lo que se lleva a medias solo vive en la escena: al salir de la zona, se empieza de nuevo.
  private slabs = new Map<string, Phaser.GameObjects.Image>();
  private litSlabs = new Set<string>();
  private lastTile = '';
  private bellSequence: string[] = [];
  private crates: Phaser.Physics.Arcade.Image[] = [];
  private marks: TilePosition[] = [];
  private corral: Phaser.Geom.Rectangle | null = null;
  private pushingCrate = false;
  // Tiempo corriendo que aún no ha llegado a gastar un punto de energía (HU-76).
  private runningMs = 0;
  // Marcador "!" o "?" de cada NPC (HU-73).
  private npcMarkers = new Map<Npc, Phaser.GameObjects.Text>();
  // Huerto de la granja (HU-41): sus casillas y lo que se dibuja en cada parcela.
  private garden: Phaser.Geom.Rectangle | null = null;
  private plotViews = new Map<string, { soil: Phaser.GameObjects.Image; crop: Phaser.GameObjects.Image }>();
  private apple: Phaser.GameObjects.Image | null = null;
  private obstacles!: Phaser.Tilemaps.TilemapLayer;
  // Pesca en curso (HU-48): el temporizador de lo que pasa después ("¡Pica!" o que se escape), si el pez
  // ya ha picado y el corcho que se ve en el agua.
  private fishing: { timer: Phaser.Time.TimerEvent; biting: boolean; bobber: Phaser.GameObjects.Arc } | null = null;
  // Último pez pescado, con su tamaño.
  private lastCatch: Catch | null = null;
  // Ceremonia de la feria (HU-66): escenario, podio, sitios del público, lo que se dibuja en el podio, si está
  // en curso y la hora del fotograma anterior (para el aviso de las 17:00, HU-58).
  private stage: Phaser.Geom.Rectangle | null = null;
  private podium: Phaser.Geom.Rectangle | null = null;
  private audience = new Map<string, { x: number; y: number }>();
  private podiumFigures: Phaser.GameObjects.Image[] = [];
  private inCeremony = false;
  private previousMinutes = 0;
  // Zona de cada NPC para interactuar con él: se mueve con él en la ceremonia.
  private npcAreas = new Map<string, Phaser.Geom.Rectangle>();
  // Quién habla en el diálogo abierto (un NPC, "cartel"...), o null si no hay diálogo.
  private dialogSpeaker: string | null = null;
  private indicator!: Phaser.GameObjects.Text;
  private changingZone = false;
  // Puerta cerrada que ya ha mostrado su aviso (HU-17 y HU-57). No vuelve a avisar hasta que el personaje
  // deja de caminar hacia ella.
  private warnedDoor: Door | null = null;
  private sleeping = false;
  // Cuadro de "Sí" y "No" abierto en la capa de interfaz ("¿Dormir?", inscripción al concurso de pesca).
  private promptOpen = false;
  private dialogOpen = false;
  // Tiempo andando desde el último paso que sonó (HU-32).
  private stepMs = 0;
  // Inventario (HU-13) o lista de objetivos (HU-21) abiertos: el tiempo sigue, pero el personaje no se mueve.
  private overlayOpen = false;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.facing = data.facing;
    this.notice = data.notice;
  }

  create(): void {
    const state = getGameState();
    this.changingZone = false;
    this.warnedDoor = null;
    this.sleeping = false;
    this.promptOpen = false;
    this.dialogOpen = false;
    this.dialogSpeaker = null;
    this.overlayOpen = false;

    const map = this.make.tilemap({ key: mapKey(state.zone) });
    const tiles = [
      map.addTilesetImage('kenney-tiny-town', 'tiles-town')!,
      map.addTilesetImage('kenney-tiny-dungeon', 'tiles-dungeon')!,
      map.addTilesetImage('agua', 'tiles-agua')!,
    ];
    map.createLayer('suelo', tiles);
    // Todo lo que hay en la capa "obstaculos" es sólido (HU-07).
    const obstacles = map.createLayer('obstaculos', tiles)!;
    obstacles.setCollisionByExclusion([-1]);
    this.obstacles = obstacles;
    this.fishing = null;
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, state.position, this.facing, playerTexture(this, state.appearance));
    this.player.setObstacles(obstacles);
    this.physics.add.collider(this.player, obstacles);

    const objects = mapObjects(this, state.zone);
    this.doors = objects.filter((object) => object.name === 'puerta').map((object) => this.createDoor(object));
    this.interactables = [];
    this.chests = [];
    this.npcs = [];
    this.npcMarkers.clear();
    this.npcAreas.clear();
    this.stage = null;
    this.podium = null;
    this.audience.clear();
    this.podiumFigures = [];
    this.inCeremony = false;
    this.previousMinutes = state.minutes;
    this.garden = null;
    this.plotViews.clear();
    this.apple = null;
    this.slabs.clear();
    this.litSlabs.clear();
    this.bellSequence = [];
    this.crates = [];
    this.marks = [];
    this.corral = null;
    this.pushingCrate = false;
    for (const object of objects) {
      if (object.name === 'npc' || object.name === 'visitante') this.addNpc(object);
      if (object.name === 'cofre') this.addChest(object);
      if (object.name === 'cartel') this.addSign(object);
      if (object.name === 'objeto') this.addWorldItem(object);
      if (object.name === 'cama') this.addBed(object);
      if (object.name === 'huerto') this.addGarden(object);
      if (object.name === 'manzano') this.addAppleTree(object);
      if (object.name === 'recurso') this.addForageSpot(object);
      if (object.name === 'tablon') this.addNoticeBoard(object);
      if (object.name === 'fuente') this.addFountain(object);
      if (object.name === 'mecanismo') this.addMechanism(object);
      if (object.name === 'fogon') this.addStove(object);
      if (object.name === 'pagina') this.addDiaryPage(object);
      if (object.name === 'losa') this.addSlab(object);
      if (object.name === 'campana') this.addBell(object);
      if (object.name === 'marca') this.addMark(object);
      if (object.name === 'caja') this.addCrate(object);
      if (object.name === 'corral') this.corral = corralArea(object);
      // HU-58: los puestos y las guirnaldas de la feria solo están el día 7.
      if (object.name === 'puesto' && isFairDay()) this.addStall(object);
      if (object.name === 'guirnalda' && isFairDay()) this.addGarland(object);
      if (object.name === 'escenario' && isFairDay()) this.stage = this.addCeremonyPlatform(object, 'escenario');
      if (object.name === 'podio' && isFairDay()) this.podium = this.addCeremonyPlatform(object, 'podio');
      if (object.name === 'publico') this.audience.set(getProperty(object, 'personaje') as string, pointTile(object));
    }
    // HU-79: con el puzle resuelto, las cajas están sobre las marcas.
    if (isSolved('cajas')) {
      this.crates.forEach((crate, index) => this.placeCrate(crate, this.marks[index]));
    }
    // Pisar la casilla en la que se aparece no cuenta como pisar una losa (HU-77).
    this.lastTile = tileKey(this.player.getTilePosition());
    this.updateNpcPresence();
    // Después de la ceremonia, el alcalde sigue en el escenario y los visitantes delante (HU-66).
    if (isFairDay() && state.ceremonyDone) {
      this.arrangeCeremony(false);
    }

    // Indicador "E" sobre aquello con lo que se puede interactuar (HU-10).
    this.indicator = this.add
      .text(0, 0, 'E', {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        color: COLORS.background,
        backgroundColor: COLORS.text,
        padding: { x: 2, y: 0 },
      })
      .setResolution(WORLD_ZOOM * 2)
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setVisible(false);

    this.setUpCamera(map.widthInPixels, map.heightInPixels);
    this.setUpKeys();

    // HU-31: la música de la zona. Si es la misma que ya suena, no se reinicia.
    playZoneMusic(this, musicKey(state.zone), ZONES[state.zone].music);

    // Capa de noche (HU-23) e interfaz fija (día, hora, dinero y energía), por encima de la partida.
    for (const key of ['NightScene', 'HudScene']) {
      if (!this.scene.isActive(key)) {
        this.scene.launch(key);
      }
    }

    if (this.notice) {
      this.openDialog({ speaker: 'aviso', title: ZONES[state.zone].name, lines: [this.notice], typewriter: false });
    }
  }

  update(_time: number, delta: number): void {
    // HU-22: el reloj avanza mientras la partida no está en pausa (esta escena en pausa no se actualiza),
    // también con diálogos, inventario, objetivos o tienda abiertos.
    if (!this.sleeping && advanceTime(delta)) {
      this.fallAsleepAtMidnight();
    }
    if (!this.sleeping) {
      this.updateFair();
      this.failExpiredMissions();
    }
    this.updateNpcPresence();
    this.updateNpcMarkers();

    // Durante un cambio de zona, un diálogo o con el inventario abierto, el personaje no se mueve.
    if (this.isBusy()) {
      return;
    }

    this.player.update();
    this.playSteps(delta);
    this.checkSlabStep();
    this.pushCrate();
    this.updateIndicator();
    getGameState().position = this.player.getTilePosition();

    if (this.warnedDoor && !this.isCrossing(this.warnedDoor)) {
      this.warnedDoor = null;
    }
    const door = this.doors.find((candidate) => candidate !== this.warnedDoor && this.isCrossing(candidate));
    if (door) {
      this.useDoor(door);
    }
  }

  // HU-15: recoge objetos. Si no caben, no se recoge ninguno y aparece "Inventario lleno".
  pickUp(item: ItemId, quantity: number): boolean {
    if (addItem(item, quantity)) {
      return true;
    }
    showMessage(this.scene.get('HudScene'), 'Inventario lleno', MESSAGE_MS, 'top');
    return false;
  }

  // HU-46 y HU-47: toda acción de trabajo pasa por aquí antes de hacerse. Si la energía no alcanza,
  // aparece "Estás demasiado cansado", no se gasta nada y devuelve false: la acción no se hace.
  work(action: WorkAction): boolean {
    if (spendEnergy(action)) {
      return true;
    }
    showMessage(this.scene.get('HudScene'), byGender(getGameState().appearance, 'Estás demasiado cansado', 'Estás demasiado cansada'), MESSAGE_MS, 'top');
    return false;
  }

  // HU-32: mientras el personaje anda (se desplaza de verdad, no contra un obstáculo), suenan sus pasos.
  // Al correr (HU-81), el doble de seguidos.
  private playSteps(delta: number): void {
    const body = this.player.body;
    const walking = body.velocity.lengthSq() > 0 && (body.deltaAbsX() > 0 || body.deltaAbsY() > 0);
    this.spendRunningEnergy(walking, delta);
    if (!walking) {
      this.stepMs = STEP_SOUND_MS; // al empezar a andar, el primer paso suena enseguida
      return;
    }
    this.stepMs += delta;
    const interval = this.player.isRunning() ? STEP_SOUND_MS / RUN_SPEED_FACTOR : STEP_SOUND_MS;
    if (this.stepMs >= interval) {
      this.stepMs = 0;
      playEffect(this, 'steps');
    }
  }

  // HU-81 y HU-76: con 10 de energía o menos no se puede empezar a correr.
  private toggleRunning(): void {
    if (isRunning()) {
      setRunning(false);
    } else if (getGameState().energy > RUN_MIN_ENERGY) {
      setRunning(true);
    } else {
      this.showTooTiredToRun();
    }
  }

  // HU-76: correr gasta 1 punto de energía por cada 3 segundos que el personaje se desplaza corriendo. Si la
  // energía baja a 10 o menos (corriendo o trabajando), el personaje pasa a andar.
  private spendRunningEnergy(moving: boolean, delta: number): void {
    if (!isRunning()) {
      return;
    }
    const state = getGameState();
    if (moving) {
      this.runningMs += delta;
      while (this.runningMs >= RUN_ENERGY_MS) {
        this.runningMs -= RUN_ENERGY_MS;
        state.energy = Math.max(0, state.energy - 1);
      }
    }
    if (state.energy <= RUN_MIN_ENERGY) {
      setRunning(false);
      this.showTooTiredToRun();
    }
  }

  private showTooTiredToRun(): void {
    const text = byGender(getGameState().appearance, 'Estás demasiado cansado para correr', 'Estás demasiado cansada para correr');
    showMessage(this.scene.get('HudScene'), text, MESSAGE_MS, 'top');
  }

  // --- Consultas para los tests ---

  isChangingZone(): boolean {
    return this.changingZone;
  }

  // HU-73: el marcador que se ve sobre el NPC ("!" o "?"), o null si no se ve ninguno.
  getNpcMarker(id: string): string | null {
    const npc = this.npcs.find((candidate) => candidate.character === id);
    const marker = npc && this.npcMarkers.get(npc);
    return marker?.visible ? marker.text : null;
  }

  isDialogOpen(): boolean {
    return this.dialogOpen;
  }

  isOverlayOpen(): boolean {
    return this.overlayOpen;
  }

  // Identificador de aquello con lo que se puede interactuar ahora mismo, si hay algo.
  getTalkTarget(): string | null {
    return this.interactTarget()?.id ?? null;
  }

  isTalkIndicatorVisible(): boolean {
    return this.indicator.visible;
  }

  isChestOpen(id: string): boolean {
    return this.chests.find((chest) => chest.id === id)?.isOpen() ?? false;
  }

  isNpcPresent(id: string): boolean {
    return this.npcs.some((npc) => npc.character === id && npc.isPresent());
  }

  isWorldItemOnMap(id: string): boolean {
    return this.interactables.some((interactable) => interactable.kind === 'objeto' && interactable.id === id);
  }

  // --- Teclas ---

  private setUpKeys(): void {
    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-E', () => this.interact());
    // HU-48: una flecha (o WASD) recoge la caña sin pescar nada.
    for (const key of ['UP', 'DOWN', 'LEFT', 'RIGHT', 'W', 'A', 'S', 'D']) {
      keyboard.on(`keydown-${key}`, () => this.fishing && this.stopFishing());
    }
    // HU-81: Mayús activa y desactiva correr.
    keyboard.on('keydown-SHIFT', (event: KeyboardEvent) => !event.repeat && this.toggleRunning());
    keyboard.on('keydown-I', () => this.openOverlay('InventoryScene'));
    keyboard.on('keydown-O', () => this.openOverlay('ObjectivesScene'));

    // Escape abre el menú de pausa y detiene la partida (HU-26), salvo durante un cambio de zona.
    // Con el inventario o los objetivos abiertos, Escape los cierra y no abre la pausa.
    keyboard.on('keydown-ESC', () => {
      // Con "¿Dormir?" u otro cuadro de "Sí" y "No" abierto, Escape equivale a "No" (lo gestiona el propio cuadro).
      if (this.changingZone || this.sleeping || this.promptOpen || this.overlayOpen) {
        return;
      }
      this.player.stand();
      playEffect(this, 'openMenu');
      this.scene.pause();
      // Con la pausa abierta, un diálogo abierto también se detiene (HU-26).
      if (this.scene.isActive('DialogScene')) {
        this.scene.pause('DialogScene');
      }
      this.scene.launch('PauseScene');
    });

    // Las teclas que se soltaron durante la pausa no llegan a esta escena:
    // al reanudar se dan todas por sueltas para que el personaje no siga andando solo.
    const onResume = () => keyboard.resetKeys();
    this.events.on(Phaser.Scenes.Events.RESUME, onResume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));
  }

  // Hay algo en curso que impide moverse, abrir la pausa o interactuar.
  private isBusy(): boolean {
    return (
      this.changingZone ||
      this.sleeping ||
      this.promptOpen ||
      this.dialogOpen ||
      this.overlayOpen ||
      this.fishing !== null ||
      this.inCeremony
    );
  }

  // HU-24: E junto a la cama pregunta "¿Dormir?". El cuadro se dibuja en la capa de interfaz.
  private askToSleep(): void {
    this.promptOpen = true;
    this.player.stand();
    this.indicator.setVisible(false);
    showConfirmDialog(this.scene.get('HudScene'), '¿Dormir?', (yes) => {
      this.promptOpen = false;
      if (yes) {
        this.goToBed();
      }
    }, true);
  }

  // HU-24 y HU-25: al dormir se guarda la partida tal como está al acostarse (decisión del autor:
  // "la del día 4" si se duerme el día 4), aparece "Partida guardada" y la pantalla se funde a negro.
  // HU-39: después aparece el resumen del día y, al cerrarlo con E, empieza el día siguiente a las 06:00
  // con la energía a 100.
  private goToBed(): void {
    if (writeSave(getGameState())) {
      showMessage(this.scene.get('HudScene'), 'Partida guardada', MESSAGE_MS, 'top');
    }
    this.sleepUntilMorning(() => stateAfterSleeping(this), true);
  }

  // Funde a negro y empieza el día siguiente con el estado que devuelve `nextState`, después del resumen
  // del día si `withSummary`.
  private sleepUntilMorning(nextState: () => ReturnType<typeof stateAfterSleeping>, withSummary = false): void {
    this.sleeping = true;
    this.player.stand();
    this.indicator.setVisible(false);
    const wakeUp = () => {
      startGame(nextState());
      const data: GameSceneData = { facing: 'down' };
      this.scene.restart(data);
    };
    const camera = this.cameras.main;
    camera.fadeOut(SLEEP_FADE_MS, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (!withSummary) {
        wakeUp();
        return;
      }
      const { day, dayStats } = getGameState();
      this.scene.launch('DaySummaryScene', { day, stats: { ...dayStats }, onClose: wakeUp } satisfies DaySummarySceneData);
    });
  }

  // HU-22 (escenario 4) y HU-24 (escenario 3): a medianoche el personaje se duerme. Se cierra lo que
  // estuviera abierto, la pantalla se funde a negro y empieza el día siguiente en su casa.
  private fallAsleepAtMidnight(): void {
    this.sleeping = true;
    this.player.stand();
    this.indicator.setVisible(false);
    for (const key of ['DialogScene', 'InventoryScene', 'ObjectivesScene', 'ShopScene', 'ItemChoiceScene', 'MechanismScene', 'CookScene']) {
      this.scene.stop(key);
    }
    this.stopFishing();
    this.dialogOpen = false;
    this.dialogSpeaker = null;
    this.overlayOpen = false;
    this.sleepUntilMorning(() => stateAfterMidnight(this));
  }

  isSleeping(): boolean {
    return this.sleeping;
  }

  // HU-13 (I) y HU-21 (O): inventario y lista de objetivos. Mientras están abiertos el personaje
  // no se mueve, pero el tiempo sigue (decisión del autor).
  private openOverlay(
    sceneKey: 'InventoryScene' | 'ObjectivesScene' | 'ShopScene' | 'ItemChoiceScene' | 'MechanismScene' | 'CookScene',
    extra: object = {},
  ): void {
    if (this.isBusy()) {
      return;
    }
    this.overlayOpen = true;
    this.player.stand();
    this.indicator.setVisible(false);
    playEffect(this, 'openMenu');
    const data: OverlaySceneData = {
      ...extra,
      onClose: () => {
        this.overlayOpen = false;
      },
    };
    this.scene.launch(sceneKey, data);
  }

  // --- Interacciones con E (HU-10 y HU-12) ---

  // Aquello con lo que se interactúa al pulsar E: lo más cercano a menos de una casilla y, si no hay nada,
  // la parcela del huerto que el personaje tiene delante (HU-41).
  private interactTarget(): Interactable | null {
    return this.nearestInteractable() ?? this.plotInFront() ?? this.waterInFront();
  }

  // Casilla que el personaje tiene justo delante, en la dirección en la que mira.
  private tileInFront(): { x: number; y: number } {
    const step = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.player.facing];
    const center = this.player.body.center;
    return {
      x: Math.floor((center.x + step[0] * TILE_SIZE * 0.75) / TILE_SIZE),
      y: Math.floor((center.y + step[1] * TILE_SIZE * 0.75) / TILE_SIZE),
    };
  }

  // Lo más cercano a menos de una casilla del personaje con lo que se puede interactuar.
  private nearestInteractable(): Interactable | null {
    const body = this.player.body;
    let nearest: Interactable | null = null;
    let nearestGap = Infinity;
    for (const interactable of this.interactables) {
      if (!interactable.isAvailable()) {
        continue;
      }
      const { area } = interactable;
      const dx = Math.max(area.left - body.right, body.left - area.right, 0);
      const dy = Math.max(area.top - body.bottom, body.top - area.bottom, 0);
      const gap = Math.hypot(dx, dy);
      if (gap < TALK_DISTANCE && gap < nearestGap) {
        nearest = interactable;
        nearestGap = gap;
      }
    }
    return nearest;
  }

  private interact(): void {
    // HU-48: con la caña lanzada, E tira de ella.
    if (this.fishing && !this.changingZone && !this.sleeping) {
      this.reel();
      return;
    }
    if (!this.isBusy()) {
      this.interactTarget()?.interact();
    }
  }

  private updateIndicator(): void {
    const target = this.interactTarget();
    this.indicator.setVisible(target !== null);
    if (target) {
      // Sobre el agua, el indicador va dentro de la casilla: encima taparía la cara del personaje.
      const y = target.kind === 'agua' ? target.area.centerY + 4 : target.area.top - 1;
      this.indicator.setPosition(target.area.centerX, y);
    }
  }

  // Abre un diálogo. `afterClose` se ejecuta al cerrarlo (por ejemplo, abrir la tienda).
  // `{nombre}` en las líneas se sustituye por el nombre del jugador (HU-67) y `{masculino|femenino}`, por la forma
  // que corresponde a su género (HU-68).
  private openDialog(data: Omit<DialogSceneData, 'onClose'>, afterClose?: () => void): void {
    const { playerName, appearance } = getGameState();
    data = { ...data, lines: data.lines.map((line) => genderText(appearance, line.replaceAll('{nombre}', playerName))) };
    this.dialogOpen = true;
    this.dialogSpeaker = data.speaker;
    this.player.stand();
    this.indicator.setVisible(false);
    this.scene.launch('DialogScene', {
      ...data,
      onClose: () => {
        this.dialogOpen = false;
        this.dialogSpeaker = null;
        afterClose?.();
      },
    } satisfies DialogSceneData);
  }

  // HU-10: los NPC son obstáculos (HU-07). E junto a uno abre su diálogo.
  private addNpc(object: MapObject): void {
    const id = getProperty(object, 'personaje') as NpcId;
    const npc = new Npc(this, id, pointTile(object));
    this.physics.add.collider(this.player, npc);
    this.npcs.push(npc);
    this.npcMarkers.set(
      npc,
      this.add
        .text(npc.x, npc.y - TILE_SIZE / 2 - 1, '', {
          fontFamily: FONT_FAMILY,
          fontSize: '8px',
          fontStyle: 'bold',
          color: COLORS.background,
          backgroundColor: COLORS.selected,
          padding: { x: 2, y: 0 },
        })
        .setResolution(WORLD_ZOOM * 2)
        .setOrigin(0.5, 1)
        .setDepth(10)
        .setVisible(false),
    );
    const area = bodyArea(npc.body);
    this.npcAreas.set(id, area);
    this.interactables.push({
      kind: 'npc',
      id,
      area,
      isAvailable: () => npc.isPresent(),
      interact: () => this.talkTo(id),
    });
  }

  // HU-40: cada NPC aparece o desaparece según su horario, también con el jugador en la zona.
  // Si el jugador está hablando con él, se queda hasta que se cierra el diálogo. Si el jugador está
  // en su sitio, el NPC espera a que se aparte para aparecer: así no lo deja encerrado.
  private updateNpcPresence(): void {
    // Durante la ceremonia, el alcalde y los visitantes se quedan aunque acabe su horario.
    if (this.inCeremony) return;
    const zone = getGameState().zone;
    const playerArea = bodyArea(this.player.body);
    for (const npc of this.npcs) {
      if (npc.character === this.dialogSpeaker) {
        continue;
      }
      const present = isNpcInZone(npc.character, zone);
      if (present && !npc.isPresent() && Phaser.Geom.Intersects.RectangleToRectangle(playerArea, bodyArea(npc.body))) {
        continue;
      }
      npc.setPresent(present);
    }
  }

  // HU-20 y HU-65: "Encargo completado" y, debajo, un "Recibiste..." por cada objeto de la recompensa, que es de
  // quien hizo el encargo. Suena el efecto de encargo completado (HU-32).
  private announceQuestCompleted(quest: Quest): void {
    const hud = this.scene.get('HudScene');
    showMessage(hud, 'Encargo completado', MESSAGE_MS, 'top');
    for (const { item, quantity } of quest.reward.items) {
      showMessage(hud, receivedMessage(quest.npc as NpcId, item as ItemId, quantity), MESSAGE_MS, 'top');
    }
    playEffect(this, 'questComplete');
  }

  // HU-37: mensaje de final. Se cierra con E y se sigue jugando.
  private showEnding(): void {
    this.openDialog({ speaker: 'fin', title: dialogues.ending.title, lines: dialogues.ending.lines, typewriter: false });
  }

  // HU-11, HU-19 y HU-20: lo que dice el NPC depende del estado de los encargos (src/systems/quests.ts).
  // La vendedora atiende la tienda (HU-17 y HU-18). Decisión del autor: con la tienda cerrada solo
  // dice "La tienda está cerrada"; con la tienda abierta, si tiene algo del encargo que decir (dar la
  // carta, ofrecer o completar su encargo), lo dice y después se abre la tienda; si no, la tienda se
  // abre directamente.
  private talkTo(id: NpcId): void {
    if (id === 'vendedora' && !isShopOpen()) {
      showMessage(this.scene.get('HudScene'), 'La tienda está cerrada', MESSAGE_MS, 'top');
      return;
    }

    recordEvent(`talk:${id}`); // HU-63
    const conversation = conversationWith(id);
    const afterClose = id === 'vendedora' ? () => this.openOverlay('ShopScene') : undefined;
    if (id === 'vendedora' && !['give-letter', 'offer', 'complete'].includes(conversation.kind)) {
      this.openOverlay('ShopScene');
      return;
    }

    const npcDialog = {
      speaker: id,
      title: dialogues.npcs[id].name,
      portrait: `retrato-${id}`,
      typewriter: true,
    };

    // HU-72: lo del encargo principal va primero. Si no hay nada de eso, el vecino habla de sus misiones.
    // HU-71: el día de la feria, los vecinos de la feria solo dicen su frase de la feria.
    const missionTalk = !['offer', 'active', 'complete', 'give-letter'].includes(conversation.kind) && !saysFairGreeting(id);
    if (missionTalk && this.talkAboutMissions(id, npcDialog)) {
      return;
    }

    switch (conversation.kind) {
      case 'offer': {
        // HU-19: "Aceptar" o "Rechazar". Al aceptar, el NPC sigue con su diálogo de encargo en curso.
        const { quest } = conversation;
        const questLines = dialogues.npcs[id].quests as Record<string, { active: string[] }>;
        this.openDialog(
          {
            ...npcDialog,
            lines: conversation.lines,
            choice: {
              options: ['Aceptar', 'Rechazar'],
              onChoose: (index) => (index === 0 && acceptQuest(quest) ? questLines[quest.id].active : null),
            },
          },
          afterClose,
        );
        return;
      }

      case 'complete': {
        // HU-20: si la recompensa no cabe en el inventario, el encargo no se completa.
        if (!canReceiveReward(conversation.quest)) {
          showMessage(this.scene.get('HudScene'), 'Inventario lleno', MESSAGE_MS, 'top');
          afterClose?.();
          return;
        }
        // La recompensa ya está en el inventario, pero los avisos salen al terminar el diálogo, cuando el NPC
        // la entrega ("Esto es para ti"). HU-37: al completar el último encargo aparece después el mensaje de final.
        const { quest } = conversation;
        completeQuest(quest);
        this.openDialog({ ...npcDialog, lines: conversation.lines }, () => {
          this.announceQuestCompleted(quest);
          if (quest.id === LAST_QUEST) this.showEnding();
          else afterClose?.();
        });
        return;
      }

      case 'give-letter':
        // Decisión del autor: con el encargo 1 activo, la vendedora entrega la Carta del alcalde.
        if (this.pickUp('carta-del-alcalde', 1)) {
          // HU-65: el aviso sale cuando la vendedora termina de hablar y entrega la carta.
          this.openDialog({ ...npcDialog, lines: conversation.lines }, () => {
            showMessage(this.scene.get('HudScene'), receivedMessage(id, 'carta-del-alcalde', 1), MESSAGE_MS, 'top');
            afterClose?.();
          });
        } else {
          afterClose?.();
        }
        return;

      default:
        this.openDialog({ ...npcDialog, lines: conversation.lines });
    }
  }

  // HU-72: misiones secundarias al hablar con un vecino. Devuelve false si no tiene nada que decir de ellas.
  private talkAboutMissions(id: NpcId, npcDialog: Omit<DialogSceneData, 'onClose' | 'lines'>): boolean {
    const hud = this.scene.get('HudScene');

    // Encontrar a Bigotes: al hablar con él, vuelve a casa.
    const toFind = missionToFind(id);
    if (toFind) {
      markFound(toFind);
      this.openDialog({ ...npcDialog, lines: dialogues.npcs[id].greeting });
      return true;
    }

    const toComplete = missionToComplete(id);
    if (toComplete) {
      // Como en HU-20: si la recompensa no cabe, la misión sigue activa.
      if (!canReceiveMissionReward(toComplete)) {
        showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
        return true;
      }
      completeMission(toComplete);
      this.openDialog({ ...npcDialog, lines: toComplete.lines.complete }, () => this.announceMissionCompleted(id, toComplete));
      return true;
    }

    const toOffer = missionToOffer(id);
    if (toOffer) {
      if (!canAcceptMoreMissions()) {
        this.openDialog({ ...npcDialog, lines: MISSIONS_FULL_LINES });
        return true;
      }
      // Las misiones en las que hay que llevar algo dan el objeto al aceptar (con el aviso de HU-65 al cerrar).
      let received: ItemId | null = null;
      this.openDialog(
        {
          ...npcDialog,
          lines: toOffer.lines.offer,
          choice: {
            options: ['Aceptar', 'Rechazar'],
            onChoose: (index) => {
              if (index !== 0) return null;
              if (!acceptMission(toOffer)) {
                showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
                return null;
              }
              received = carriedItem(toOffer);
              return toOffer.lines.active;
            },
          },
        },
        () => received && showMessage(hud, receivedMessage(id, received, 1), MESSAGE_MS, 'top'),
      );
      return true;
    }

    const active = ownActiveMission(id);
    if (active) {
      this.openDialog({ ...npcDialog, lines: active.lines.active });
      return true;
    }
    return false;
  }

  private announceMissionCompleted(npc: NpcId, mission: Mission): void {
    const hud = this.scene.get('HudScene');
    showMessage(hud, MISSION_COMPLETED, MESSAGE_MS, 'top');
    for (const { item, quantity } of mission.reward.items) {
      showMessage(hud, receivedMessage(npc, item as ItemId, quantity), MESSAGE_MS, 'top');
    }
    playEffect(this, 'questComplete');
  }

  // HU-74: al llegar la hora límite, la misión falla.
  private failExpiredMissions(): void {
    for (const mission of failExpiredMissions()) {
      showMessage(this.scene.get('HudScene'), failedMessage(mission), MESSAGE_MS, 'top');
    }
  }

  // HU-73: "?" sobre el NPC si se puede completar algo hablando con él y "!" si ofrecería un encargo o una misión.
  npcMarker(id: NpcId): '?' | '!' | null {
    const conversation = conversationWith(id);
    if (saysFairGreeting(id)) return null;
    if (conversation.kind === 'complete' || missionToComplete(id) || missionToFind(id)) return '?';
    if (conversation.kind === 'offer' || (missionToOffer(id) && canAcceptMoreMissions())) return '!';
    return null;
  }

  // El marcador se ve sobre los NPC presentes, salvo sobre el que tiene encima el indicador "E".
  private updateNpcMarkers(): void {
    const target = this.indicator.visible ? this.interactTarget() : null;
    for (const npc of this.npcs) {
      const marker = this.npcMarkers.get(npc)!;
      const symbol = npc.isPresent() ? this.npcMarker(npc.character as NpcId) : null;
      const covered = target?.kind === 'npc' && target.id === npc.character;
      marker.setVisible(symbol !== null && !covered && !this.dialogOpen);
      if (symbol) marker.setText(symbol).setPosition(npc.x, npc.y - TILE_SIZE / 2 - 1);
    }
  }

  // HU-12: un cofre se abre una sola vez y da su objeto. Si el inventario está lleno, sigue cerrado.
  private addChest(object: MapObject): void {
    const id = getProperty(object, 'id') as keyof typeof chests;
    const state = getGameState();
    const chest = new Chest(this, id, pointTile(object), state.openedChests.includes(id));
    this.physics.add.collider(this.player, chest);
    this.chests.push(chest);
    this.interactables.push({
      kind: 'cofre',
      id,
      area: bodyArea(chest.body),
      isAvailable: () => !chest.isOpen(),
      interact: () => {
        const { item, quantity } = chests[id];
        if (this.pickUp(item as ItemId, quantity)) {
          state.openedChests.push(id);
          chest.setOpen(true);
          playEffect(this, 'chest');
        }
      },
    });
  }

  // HU-12: los carteles muestran su texto completo. E lo cierra.
  private addSign(object: MapObject): void {
    const id = getProperty(object, 'id') as keyof typeof signs;
    this.interactables.push({
      kind: 'cartel',
      id,
      area: tileArea(object),
      isAvailable: () => true,
      interact: () => {
        recordEvent(`read:${id}`); // HU-63
        this.openDialog({ speaker: 'cartel', title: 'Cartel', lines: [signs[id]], typewriter: false });
      },
    });
  }

  // HU-12: objetos sueltos en el suelo (la Pala de la granja). Al recogerlos desaparecen del mapa.
  private addWorldItem(object: MapObject): void {
    const id = getProperty(object, 'id') as keyof typeof worldItems;
    const state = getGameState();
    if (state.pickedUpItems.includes(id)) {
      return;
    }
    const area = tileArea(object);
    const { item, quantity } = worldItems[id];
    const sprite = this.add.image(area.centerX, area.centerY, `objeto-${item}`);
    const interactable: Interactable = {
      kind: 'objeto',
      id,
      area,
      isAvailable: () => true,
      interact: () => {
        if (this.pickUp(item as ItemId, quantity)) {
          state.pickedUpItems.push(id);
          sprite.destroy();
          this.interactables = this.interactables.filter((other) => other !== interactable);
        }
      },
    };
    this.interactables.push(interactable);
  }

  // Cama de la casa del jugador: ocupa dos casillas de alto y es un obstáculo. E junto a ella para dormir (HU-24).
  private addBed(object: MapObject): void {
    const tile = tileArea(object);
    const bed = this.physics.add.staticImage(tile.centerX, tile.top + TILE_SIZE, 'cama');
    this.physics.add.collider(this.player, bed);
    this.interactables.push({
      kind: 'cama',
      id: 'cama',
      area: new Phaser.Geom.Rectangle(tile.x, tile.y, TILE_SIZE, TILE_SIZE * 2),
      isAvailable: () => true,
      interact: () => this.askToSleep(),
    });
  }

  // --- Huerto y manzano (HU-41 a HU-45) ---

  // El huerto es un punto en su casilla de arriba a la izquierda, con su tamaño en parcelas.
  private addGarden(object: MapObject): void {
    const { x, y } = pointTile(object);
    const columns = Number(getProperty(object, 'columnas'));
    const rows = Number(getProperty(object, 'filas'));
    this.garden = new Phaser.Geom.Rectangle(x, y, columns, rows);
    for (let row = y; row < y + rows; row++) {
      for (let column = x; column < x + columns; column++) {
        const centerX = column * TILE_SIZE + TILE_SIZE / 2;
        const centerY = row * TILE_SIZE + TILE_SIZE / 2;
        const soil = this.add.image(centerX, centerY, 'cultivos', FRAME.soil);
        const crop = this.add.image(centerX, centerY, 'cultivos', FRAME.seeds);
        // Se puede andar por el huerto: las parcelas se dibujan por debajo del personaje.
        this.children.moveBelow(soil, this.player);
        this.children.moveBelow(crop, this.player);
        this.plotViews.set(`${column},${row}`, { soil, crop });
        this.refreshPlot({ x: column, y: row });
      }
    }
  }

  // Dibuja una parcela según su estado: tierra cavada (más oscura si está regada, HU-43) y su cultivo.
  private refreshPlot(tile: { x: number; y: number }): void {
    const view = this.plotViews.get(`${tile.x},${tile.y}`);
    if (!view) return;
    const plot = getPlot(tile);
    view.soil.setVisible(plot.dug);
    if (plot.watered) view.soil.setTint(WATERED_TINT);
    else view.soil.clearTint();
    const frame = cropFrame(plot);
    view.crop.setVisible(frame !== null);
    if (frame !== null) view.crop.setFrame(frame);
  }

  // La parcela del huerto que el personaje tiene justo delante, si la hay.
  private plotInFront(): Interactable | null {
    if (!this.garden) return null;
    const tile = this.tileInFront();
    if (!this.garden.contains(tile.x + 0.5, tile.y + 0.5)) return null;
    return {
      kind: 'parcela',
      id: `parcela-${tile.x},${tile.y}`,
      area: new Phaser.Geom.Rectangle(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE),
      // Una parcela sembrada y ya regada hoy, que aún no está lista, no tiene nada que hacer.
      isAvailable: () => {
        const plot = getPlot(tile);
        return !(plot.seed && plot.watered && !isReady(plot));
      },
      interact: () => this.workPlot(tile),
    };
  }

  // E delante de una parcela: cavar (HU-41), sembrar (HU-42), regar (HU-43) o cosechar (HU-44), según su estado.
  private workPlot(tile: { x: number; y: number }): void {
    const plot = getPlot(tile);
    const hud = this.scene.get('HudScene');

    if (!plot.dug) {
      if (countItem('pala') === 0) {
        showMessage(hud, 'Necesitas una Pala', MESSAGE_MS, 'top');
      } else if (this.work('dig')) {
        dig(tile);
      }
    } else if (!plot.seed) {
      const seeds = SEEDS.filter((seed) => countItem(seed) > 0);
      if (seeds.length === 0) {
        showMessage(hud, 'No tienes semillas', MESSAGE_MS, 'top');
        return;
      }
      const data: Omit<ItemChoiceSceneData, 'onClose'> = {
        title: '¿Qué quieres sembrar?',
        action: 'sembrar',
        items: seeds,
        onChoose: (seed) => {
          if (this.work('sow')) {
            removeItem(seed, 1);
            sow(tile, seed as SeedId);
            this.refreshPlot(tile);
          }
        },
      };
      this.openOverlay('ItemChoiceScene', data);
    } else if (isReady(plot)) {
      const crop = cropOf(plot.seed as SeedId);
      if (!canAdd(crop, 1)) {
        showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
      } else if (this.work('harvest')) {
        addItem(crop, 1);
        clearPlot(tile);
        getGameState().dayStats.harvests += 1; // HU-39
        recordEvent('harvest'); // HU-63
      }
    } else if (!plot.watered) {
      if (countItem('regadera') === 0) {
        showMessage(hud, 'Necesitas una Regadera', MESSAGE_MS, 'top');
      } else if (this.work('water')) {
        water(tile);
        // HU-85: con la Regadera grande también se riegan las parcelas de los lados, con el mismo gasto.
        if (watersSides()) {
          for (const side of this.sideTiles(tile)) {
            const sidePlot = getPlot(side);
            if (this.garden!.contains(side.x + 0.5, side.y + 0.5) && sidePlot.seed && !sidePlot.watered) {
              water(side);
              this.refreshPlot(side);
            }
          }
        }
        recordEvent('water'); // HU-63
      }
    }
    this.refreshPlot(tile);
  }

  // Las dos casillas de los lados de otra, vistas desde el personaje (HU-85).
  private sideTiles(tile: { x: number; y: number }): { x: number; y: number }[] {
    const vertical = this.player.facing === 'up' || this.player.facing === 'down';
    return vertical
      ? [{ x: tile.x - 1, y: tile.y }, { x: tile.x + 1, y: tile.y }]
      : [{ x: tile.x, y: tile.y - 1 }, { x: tile.x, y: tile.y + 1 }];
  }

  // HU-45: el manzano es un obstáculo (su tronco). Con fruta, E recoge la Manzana; sin fruta no hay indicador.
  private addAppleTree(object: MapObject): void {
    const tile = tileArea(object);
    this.add.image(tile.centerX, tile.bottom, 'manzano').setOrigin(0.5, 1).setDepth(5);
    this.apple = this.add.image(tile.centerX + 3, tile.top - 8, 'objeto-manzana').setDepth(6).setVisible(hasApple());
    const trunk = this.add.zone(tile.centerX, tile.centerY, TILE_SIZE, TILE_SIZE);
    this.physics.add.existing(trunk, true);
    this.physics.add.collider(this.player, trunk);
    this.interactables.push({
      kind: 'manzano',
      id: 'manzano',
      area: tile,
      isAvailable: () => hasApple(),
      interact: () => {
        if (this.pickUp('manzana', 1)) {
          pickApple();
          this.apple?.setVisible(false);
        }
      },
    });
  }

  // --- Feria (HU-58 a HU-60) ---

  // Guirnalda de banderines: decoración por encima del personaje, a lo largo de varias casillas, sujeta por un
  // poste de madera en la primera y en la última. Los postes son obstáculos.
  private addGarland(object: MapObject): void {
    const area = tileArea(object);
    const tiles = Number(getProperty(object, 'casillas'));
    for (const index of [0, tiles - 1]) {
      const x = area.centerX + index * TILE_SIZE;
      this.add.image(x, area.bottom, 'poste-guirnalda').setOrigin(0.5, 1).setDepth(7);
      const post = this.add.zone(x, area.centerY, TILE_SIZE, TILE_SIZE);
      this.physics.add.existing(post, true);
      this.physics.add.collider(this.player, post);
    }
    for (let index = 0; index < tiles; index++) {
      this.add.image(area.centerX + index * TILE_SIZE, area.centerY, 'guirnalda').setDepth(7);
    }
  }

  // Puesto de la feria (16×32): el mostrador, abajo, es un obstáculo; el toldo queda por encima del personaje.
  private addStall(object: MapObject): void {
    const kind = getProperty(object, 'tipo') as 'cosecha' | 'pesca';
    const area = tileArea(object);
    this.add.image(area.centerX, area.bottom, `puesto-${kind}`).setOrigin(0.5, 1).setDepth(5);
    const counter = this.add.zone(area.centerX, area.centerY, TILE_SIZE, TILE_SIZE);
    this.physics.add.existing(counter, true);
    this.physics.add.collider(this.player, counter);
    this.interactables.push({
      kind: 'puesto',
      id: `puesto-${kind}`,
      area,
      isAvailable: () => true,
      interact: () => (kind === 'cosecha' ? this.useHarvestStall() : this.useFishingStall()),
    });
  }

  // HU-59: se elige una cosecha del inventario y se entrega. El resultado se anuncia en la ceremonia.
  private useHarvestStall(): void {
    if (getGameState().harvestEntry) {
      this.stallMessage(HARVEST_CONTEST, 'Ya has participado');
      return;
    }
    if (!areContestsOpen()) {
      this.stallMessage(HARVEST_CONTEST, 'El concurso ya ha terminado');
      return;
    }
    const crops = presentableCrops();
    if (crops.length === 0) {
      showMessage(this.scene.get('HudScene'), 'Necesitas una cosecha para participar', MESSAGE_MS, 'top');
      return;
    }
    const data: Omit<ItemChoiceSceneData, 'onClose'> = {
      title: '¿Qué cosecha presentas?',
      action: 'presentar',
      items: crops,
      onChoose: (crop) => {
        const weight = enterHarvestContest(crop);
        recordEvent('contest:cosecha'); // HU-63
        playEffect(this, 'menuConfirm');
        const text = `Has presentado ${cropDetail(crop, weight)}. Resultados en la ceremonia de las 18:00`;
        showMessage(this.scene.get('HudScene'), text, MESSAGE_MS, 'top');
      },
    };
    this.openOverlay('ItemChoiceScene', data);
  }

  // HU-60: "¿Inscribirte en el concurso de pesca?" con "Sí" y "No". El concurso empieza al lanzar la caña en
  // el lago. Solo una vez por partida.
  private useFishingStall(): void {
    if (getGameState().fishingContestDone) {
      this.stallMessage(FISHING_CONTEST, 'Ya has participado');
      return;
    }
    if (!areContestsOpen()) {
      this.stallMessage(FISHING_CONTEST, 'El concurso ya ha terminado');
      return;
    }
    this.promptOpen = true;
    this.player.stand();
    this.indicator.setVisible(false);
    showConfirmDialog(this.scene.get('HudScene'), '¿Inscribirte en el concurso de pesca?', (yes) => {
      this.promptOpen = false;
      if (yes) {
        signUpForFishingContest();
        recordEvent('contest:pesca'); // HU-63
        this.stallMessage(FISHING_CONTEST, 'Ve al lago y lanza la caña para empezar');
      }
    }, true);
  }

  // Cuadro de diálogo de un puesto de la feria, con el texto completo.
  private stallMessage(title: string, text: string): void {
    this.openDialog({ speaker: 'puesto', title, lines: [text], typewriter: false });
  }

  // HU-58 y HU-60: a las 17:00 se cierran los concursos; el de pesca termina a su hora o a las 17:00.
  // HU-66: la ceremonia empieza a las 18:00 si el jugador está en la plaza, o en cuanto llega.
  private updateFair(): void {
    const state = getGameState();
    const hud = this.scene.get('HudScene');
    if (isFairDay() && this.previousMinutes < CONTESTS_CLOSE_MINUTES && state.minutes >= CONTESTS_CLOSE_MINUTES) {
      showMessage(hud, CONTESTS_CLOSED_MESSAGE, MESSAGE_MS, 'top');
    }
    this.previousMinutes = state.minutes;

    const contestResult = finishFishingContestIfDue();
    if (contestResult) {
      showMessage(hud, contestResult, MESSAGE_MS, 'top');
      playEffect(this, 'questComplete');
    }

    if (state.zone === 'plaza' && isCeremonyDue() && !this.inCeremony && !this.isBusy()) {
      this.startCeremony();
    }
  }

  // --- Ceremonia (HU-66) ---

  // Escenario o podio de la ceremonia (48×32): obstáculo de 3×2 casillas, con el punto en la casilla central de
  // abajo. Devuelve lo que ocupa.
  private addCeremonyPlatform(object: MapObject, texture: 'escenario' | 'podio'): Phaser.Geom.Rectangle {
    const tile = tileArea(object);
    const area = new Phaser.Geom.Rectangle(tile.x - TILE_SIZE, tile.y - TILE_SIZE, TILE_SIZE * 3, TILE_SIZE * 2);
    this.add.image(area.centerX, area.bottom, texture).setOrigin(0.5, 1).setDepth(4);
    const body = this.add.zone(area.centerX, area.centerY, area.width, area.height);
    this.physics.add.existing(body, true);
    this.physics.add.collider(this.player, body);
    return area;
  }

  // Coloca al alcalde en el escenario y a los visitantes delante. Al empezar la ceremonia también al jugador.
  private arrangeCeremony(withPlayer: boolean): void {
    for (const npc of this.npcs) {
      const seat = this.audience.get(npc.character);
      if (npc.character === 'alcalde' && this.stage) {
        // De pie sobre la tarima, en el centro.
        this.moveNpc(npc, this.stage.centerX, this.stage.y + 5);
      } else if (seat) {
        this.moveNpc(npc, seat.x * TILE_SIZE + TILE_SIZE / 2, seat.y * TILE_SIZE + TILE_SIZE / 2);
      }
    }
    const seat = this.audience.get('jugador');
    if (withPlayer && seat) {
      this.player.setPosition(seat.x * TILE_SIZE + TILE_SIZE / 2, seat.y * TILE_SIZE + TILE_SIZE / 2);
      this.player.facing = 'up';
      this.player.stand();
      getGameState().position = seat;
    }
  }

  private moveNpc(npc: Npc, x: number, y: number): void {
    npc.moveTo(x, y);
    npc.setDepth(6);
    const area = this.npcAreas.get(npc.character);
    if (area) Phaser.Geom.Rectangle.CopyFrom(bodyArea(npc.body), area);
  }

  private startCeremony(): void {
    const state = getGameState();
    state.ceremonyDone = true;
    recordEvent('ceremony'); // HU-63
    this.inCeremony = true;
    this.player.stand();
    this.indicator.setVisible(false);
    for (const npc of this.npcs) {
      if (npc.character === 'alcalde' || this.audience.has(npc.character)) npc.setPresent(true);
    }
    this.arrangeCeremony(true);

    const mayor = { speaker: 'alcalde', title: dialogues.npcs.alcalde.name, portrait: 'retrato-alcalde', typewriter: true };
    this.openDialog({ ...mayor, lines: dialogues.ceremony.intro }, () =>
      this.announceContest(HARVEST_CONTEST, harvestRanking(), () =>
        this.announceContest(FISHING_CONTEST, fishingRanking(), () => this.finalSpeech()),
      ),
    );
  }

  // El alcalde anuncia los tres primeros de un concurso, que aparecen en el podio. Al terminar, el jugador cobra
  // su premio si está entre ellos.
  private announceContest(title: string, ranking: Entry[], next: () => void): void {
    this.showPodium(ranking);
    const { places, prize } = dialogues.ceremony;
    const name = (entry: Entry) => (entry.npc ? dialogues.npcs[entry.npc as NpcId].name : getGameState().playerName);
    const lines = ranking.map((entry, index) => `${index === 0 ? `${title}. ` : ''}${places[index]}: ${name(entry)}, con ${entry.detail}.`);
    const mayor = { speaker: 'alcalde', title: dialogues.npcs.alcalde.name, portrait: 'retrato-alcalde', typewriter: true };
    this.openDialog({ ...mayor, lines }, () => {
      const amount = awardPrize(ranking);
      if (amount > 0) {
        showMessage(this.scene.get('HudScene'), prize.replace('{cantidad}', String(amount)), MESSAGE_MS, 'top');
        playEffect(this, 'questComplete');
      }
      next();
    });
  }

  // Los tres primeros de pie sobre el podio: en medio el 1.º, a la izquierda el 2.º y a la derecha el 3.º.
  private showPodium(ranking: Entry[]): void {
    for (const figure of this.podiumFigures) figure.destroy();
    this.podiumFigures = [];
    if (!this.podium) return;
    // Altura de cada bloque desde arriba de la imagen del podio (ver tools/generar-sprites.mjs).
    const spots = [
      { x: this.podium.centerX, top: 8 },
      { x: this.podium.centerX - TILE_SIZE, top: 14 },
      { x: this.podium.centerX + TILE_SIZE, top: 18 },
    ];
    ranking.forEach((entry, index) => {
      const texture = entry.npc ?? this.player.texture.key;
      const figure = this.add
        .image(spots[index].x, this.podium!.y + spots[index].top + 1, texture, 0)
        .setOrigin(0.5, 1)
        .setDepth(6)
        .setName(`podio-${index + 1}-${entry.npc ?? 'jugador'}`);
      this.podiumFigures.push(figure);
    });
  }

  // Si el encargo "La feria de Valtrigo" está activo o es el siguiente, el alcalde da su discurso desde el
  // escenario y el encargo se completa (HU-20). Después, el mensaje de final (HU-37).
  private finalSpeech(): void {
    const quest = ceremonyQuest();
    const end = () => {
      this.inCeremony = false;
    };
    if (!quest) {
      end();
      return;
    }
    const state = getGameState();
    if (!state.activeQuests.includes(quest.id)) {
      state.activeQuests = [quest.id];
    }
    if (!canReceiveReward(quest)) {
      showMessage(this.scene.get('HudScene'), 'Inventario lleno', MESSAGE_MS, 'top');
      end();
      return;
    }
    completeQuest(quest);
    const mayor = { speaker: 'alcalde', title: dialogues.npcs.alcalde.name, portrait: 'retrato-alcalde', typewriter: true };
    const lines = (dialogues.npcs.alcalde.quests as Record<string, { complete: string[] }>)[quest.id].complete;
    this.openDialog({ ...mayor, lines }, () => {
      end();
      this.announceQuestCompleted(quest);
      if (quest.id === LAST_QUEST) this.showEnding();
    });
  }

  isInCeremony(): boolean {
    return this.inCeremony;
  }

  // Quién está en el podio, para los tests: los ids de los tres primeros ("jugador" para el jugador), en orden.
  getPodium(): string[] {
    return this.podiumFigures.map((figure) => figure.name.split('-').slice(2).join('-'));
  }

  getNpcPosition(id: string): { x: number; y: number } | null {
    const npc = this.npcs.find((candidate) => candidate.character === id);
    return npc ? { x: npc.x, y: npc.y } : null;
  }

  getStageArea(): { x: number; y: number; width: number; height: number } | null {
    return this.stage ? { x: this.stage.x, y: this.stage.y, width: this.stage.width, height: this.stage.height } : null;
  }

  isStallOnMap(kind: string): boolean {
    return this.interactables.some((interactable) => interactable.id === `puesto-${kind}`);
  }

  isCeremonyPlatformOnMap(): { stage: boolean; podium: boolean } {
    return { stage: this.stage !== null, podium: this.podium !== null };
  }

  isGarlandOnMap(): boolean {
    return this.children.list.some((child) => child instanceof Phaser.GameObjects.Image && child.texture.key === 'guirnalda');
  }

  // Casillas de la guirnalda y de sus postes (HU-58), para los tests.
  getGarland(): { tiles: { x: number; y: number }[]; posts: { x: number; y: number }[] } {
    const tilesOf = (key: string) =>
      this.children.list
        .filter((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image && child.texture.key === key)
        .map((image) => ({ x: Math.floor(image.x / TILE_SIZE), y: Math.floor((image.getBottomCenter().y! - 1) / TILE_SIZE) }));
    return { tiles: tilesOf('guirnalda'), posts: tilesOf('poste-guirnalda') };
  }

  // Casillas de la capa de obstáculos (índice de la casilla, o -1 si está vacía), para los tests de HU-69.
  getObstacleGrid(): number[][] {
    return this.obstacles.layer.data.map((row) => row.map((tile) => tile.index));
  }

  // --- Misterio del reloj (HU-55 y HU-56) ---

  // HU-56: el mecanismo del reloj es un obstáculo de la torre. Con el encargo de las piezas activo y las tres
  // piezas en el inventario, E abre el mecanismo. Sin el encargo, "Habla primero con la relojera"; con el
  // encargo pero sin todas las piezas, "Faltan piezas".
  private addMechanism(object: MapObject): void {
    const area = tileArea(object);
    const sprite = this.physics.add.staticImage(area.centerX, area.centerY, 'mecanismo');
    this.physics.add.collider(this.player, sprite);
    this.interactables.push({
      kind: 'mecanismo',
      id: 'mecanismo',
      area,
      isAvailable: () => true,
      interact: () => this.useMechanism(),
    });
  }

  private useMechanism(): void {
    const hud = this.scene.get('HudScene');
    const quest = activeMechanismQuest();
    if (!quest) {
      showMessage(hud, 'Habla primero con la relojera', MESSAGE_MS, 'top');
      return;
    }
    const pieces = mechanismOrder(quest);
    if (pieces.some((piece) => countItem(piece) === 0)) {
      showMessage(hud, 'Faltan piezas', MESSAGE_MS, 'top');
      return;
    }
    const data: Omit<MechanismSceneData, 'onClose'> = {
      pieces,
      onDone: (order) => {
        if (order.some((piece, index) => piece !== pieces[index])) {
          showMessage(hud, 'El reloj no arranca', MESSAGE_MS, 'top');
          return;
        }
        if (!completeQuest(quest)) {
          showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
          return;
        }
        this.announceQuestCompleted(quest);
      },
    };
    this.openOverlay('MechanismScene', data);
  }

  // HU-84: el fogón de la casa es un obstáculo. E abre la pantalla de las recetas.
  private addStove(object: MapObject): void {
    const area = tileArea(object);
    const sprite = this.physics.add.staticImage(area.centerX, area.centerY, 'fogon');
    this.physics.add.collider(this.player, sprite);
    this.interactables.push({
      kind: 'fogon',
      id: 'fogon',
      area,
      isAvailable: () => true,
      interact: () => this.openOverlay('CookScene'),
    });
  }

  // HU-55: páginas del diario de la relojera, en el suelo. Al recogerlas desaparecen y no ocupan inventario.
  private addDiaryPage(object: MapObject): void {
    const id = getProperty(object, 'id') as string;
    const state = getGameState();
    if (state.diaryPages.includes(id)) {
      return;
    }
    const area = tileArea(object);
    const sprite = this.add.image(area.centerX, area.centerY, 'pagina');
    this.children.moveBelow(sprite, this.player);
    const interactable: Interactable = {
      kind: 'pagina',
      id,
      area,
      isAvailable: () => true,
      interact: () => {
        state.diaryPages.push(id);
        recordEvent('page'); // HU-63
        showMessage(this.scene.get('HudScene'), diary.found, MESSAGE_MS, 'top');
        sprite.destroy();
        this.interactables = this.interactables.filter((other) => other !== interactable);
      },
    };
    this.interactables.push(interactable);
  }

  isDiaryPageOnMap(id: string): boolean {
    return this.interactables.some((interactable) => interactable.kind === 'pagina' && interactable.id === id);
  }

  // --- Tablón de anuncios (HU-52 a HU-54) ---

  // El tablón es una casilla sólida de la capa de obstáculos. E junto a él entrega los pedidos que se pueden
  // entregar y, si no hay ninguno, muestra el pedido del día.
  // --- Puzles (HU-77 a HU-79) ---

  // HU-77: losas del bosque. Se encienden al pisarlas; pisar una encendida las apaga todas.
  private addSlab(object: MapObject): void {
    const area = tileArea(object);
    const image = this.add.image(area.centerX, area.centerY, 'losas', isSolved('losas') ? 1 : 0);
    this.children.moveBelow(image, this.player); // se pisan: por debajo del personaje
    this.slabs.set(tileKey(pointTile(object)), image);
  }

  private checkSlabStep(): void {
    const tile = tileKey(this.player.getTilePosition());
    if (tile === this.lastTile) return;
    this.lastTile = tile;
    const slab = this.slabs.get(tile);
    if (!slab || isSolved('losas')) return;

    const hud = this.scene.get('HudScene');
    if (this.litSlabs.has(tile)) {
      this.litSlabs.clear();
      this.slabs.forEach((image) => image.setFrame(0));
      showMessage(hud, PUZZLES.losas.reset, MESSAGE_MS, 'top');
      return;
    }
    if (this.litSlabs.size === this.slabs.size - 1) {
      // La última: si la recompensa no cabe, no se enciende (se puede volver a pisar con sitio).
      if (!canReceivePuzzleReward('losas')) {
        showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
        return;
      }
      slab.setFrame(1);
      this.finishPuzzle('losas');
      return;
    }
    this.litSlabs.add(tile);
    slab.setFrame(1);
  }

  // HU-78: campanas de la torre. Suenan al pulsar E; las tres últimas tocadas deben seguir el orden de la partitura.
  private addBell(object: MapObject): void {
    const size = getProperty(object, 'tamano') as 'grande' | 'mediana' | 'pequena';
    const frame = { grande: 0, mediana: 1, pequena: 2 }[size];
    const sound = ({ grande: 'bellLarge', mediana: 'bellMedium', pequena: 'bellSmall' } as const)[size];
    const area = tileArea(object);
    const sprite = this.physics.add.staticImage(area.centerX, area.centerY, 'campanas', frame);
    this.physics.add.collider(this.player, sprite);
    this.interactables.push({
      kind: 'campana',
      id: size,
      area,
      isAvailable: () => true,
      interact: () => {
        playEffect(this, sound);
        if (!isSolved('campanas')) this.ringBell(size);
      },
    });
  }

  private ringBell(size: string): void {
    this.bellSequence.push(size);
    if (this.bellSequence.length < PUZZLES.campanas.order.length) return;
    const correct = this.bellSequence.every((bell, index) => bell === PUZZLES.campanas.order[index]);
    this.bellSequence = [];
    if (correct) {
      this.finishPuzzle('campanas');
    } else {
      showMessage(this.scene.get('HudScene'), PUZZLES.campanas.wrong, MESSAGE_MS, 'top');
    }
  }

  // HU-79: cajas del corral. Se empujan caminando contra ellas, una casilla cada vez.
  private addMark(object: MapObject): void {
    const area = tileArea(object);
    this.children.moveBelow(this.add.image(area.centerX, area.centerY, 'marca'), this.player);
    this.marks.push(pointTile(object));
  }

  private addCrate(object: MapObject): void {
    const area = tileArea(object);
    const crate = this.physics.add.staticImage(area.centerX, area.centerY, 'caja');
    this.physics.add.collider(this.player, crate);
    this.crates.push(crate);
  }

  private placeCrate(crate: Phaser.Physics.Arcade.Image, tile: TilePosition): void {
    crate.setPosition(tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE + TILE_SIZE / 2);
    (crate.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
  }

  private crateTile(crate: Phaser.Physics.Arcade.Image): TilePosition {
    return { x: Math.floor(crate.x / TILE_SIZE), y: Math.floor(crate.y / TILE_SIZE) };
  }

  // Si el personaje camina contra una caja que tiene al lado, la empuja si la casilla de detrás
  // está libre (dentro del corral, sin obstáculos ni otra caja).
  private pushCrate(): void {
    if (this.pushingCrate || this.crates.length === 0 || isSolved('cajas') || !this.corral) return;
    const direction = this.player.heldDirection();
    if (!direction || direction !== this.player.facing) return;
    const step = DIRECTION_STEP[direction];
    // La caja tiene que estar en la casilla de al lado (según el centro del personaje) y tocando su cuerpo.
    const body = bodyArea(this.player.body);
    const tile = this.player.getTilePosition();
    const next = tileKey({ x: tile.x + step.x, y: tile.y + step.y });
    const crate = this.crates.find((candidate) => {
      if (tileKey(this.crateTile(candidate)) !== next) return false;
      const area = new Phaser.Geom.Rectangle(candidate.x - TILE_SIZE / 2, candidate.y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
      const gap = step.x > 0 ? area.left - body.right : step.x < 0 ? body.left - area.right : step.y > 0 ? area.top - body.bottom : body.top - area.bottom;
      return gap >= -0.5 && gap <= 1.5;
    });
    if (!crate) return;

    const from = this.crateTile(crate);
    const to = { x: from.x + step.x, y: from.y + step.y };
    const blocked =
      !insideTiles(this.corral, to) ||
      this.obstacles.hasTileAt(to.x, to.y) ||
      this.crates.some((other) => other !== crate && tileKey(this.crateTile(other)) === tileKey(to));
    if (blocked) return;

    // Si con este empujón quedan las dos sobre las marcas, la recompensa tiene que caber.
    const onMarks = (tiles: TilePosition[]) => tiles.every((tile) => this.marks.some((mark) => tileKey(mark) === tileKey(tile)));
    const solves = onMarks(this.crates.map((other) => (other === crate ? to : this.crateTile(other))));
    if (solves && !canReceivePuzzleReward('cajas')) {
      showMessage(this.scene.get('HudScene'), 'Inventario lleno', MESSAGE_MS, 'top');
      return;
    }

    this.pushingCrate = true;
    this.tweens.add({
      targets: crate,
      x: to.x * TILE_SIZE + TILE_SIZE / 2,
      y: to.y * TILE_SIZE + TILE_SIZE / 2,
      duration: CRATE_PUSH_MS,
      onUpdate: () => (crate.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject(),
      onComplete: () => {
        this.pushingCrate = false;
        if (solves) this.finishPuzzle('cajas');
      },
    });
  }

  private finishPuzzle(puzzle: PuzzleId): void {
    solvePuzzle(puzzle);
    showMessage(this.scene.get('HudScene'), PUZZLES[puzzle].solved, MESSAGE_MS, 'top');
    playEffect(this, 'questComplete');
  }

  // Consultas para los tests.
  getLitSlabs(): string[] {
    return isSolved('losas') ? [...this.slabs.keys()] : [...this.litSlabs];
  }

  getCrates(): TilePosition[] {
    return this.crates.map((crate) => this.crateTile(crate));
  }

  // HU-75: la fuente de la plaza. "Beber" recupera energía una vez al día y "Echar una moneda" da una pista.
  private addFountain(object: MapObject): void {
    this.interactables.push({
      kind: 'fuente',
      id: 'fuente',
      area: tileArea(object),
      isAvailable: () => true,
      interact: () => this.useFountain(),
    });
  }

  private useFountain(): void {
    const hud = this.scene.get('HudScene');
    this.openDialog({
      speaker: 'fuente',
      title: FOUNTAIN.title,
      lines: [FOUNTAIN.text],
      typewriter: false,
      choice: {
        options: FOUNTAIN.options,
        onChoose: (index) => {
          if (index === 0) {
            showMessage(hud, drink(), MESSAGE_MS, 'top');
          } else if (index === 1) {
            const hint = throwCoin();
            if (hint) return [hint];
            showMessage(hud, FOUNTAIN.coin.notEnough, MESSAGE_MS, 'top');
          }
          return null;
        },
      },
    });
  }

  private addNoticeBoard(object: MapObject): void {
    this.interactables.push({
      kind: 'tablon',
      id: 'tablon',
      area: tileArea(object),
      isAvailable: () => true,
      interact: () => this.useNoticeBoard(),
    });
  }

  private useNoticeBoard(): void {
    const hud = this.scene.get('HudScene');
    const deliverable = deliverableOrders();
    if (deliverable.length > 0) {
      // HU-54: se entregan todos los que se pueden. Uno cuya recompensa no cabe sigue activo.
      const delivered = deliverable.filter((order) => deliverOrder(order));
      if (delivered.length > 0) {
        showMessage(hud, 'Pedido completado', MESSAGE_MS, 'top');
        playEffect(this, 'questComplete');
      }
      if (delivered.length < deliverable.length) {
        showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
      }
      return;
    }

    const board = { speaker: 'tablon', title: BOARD_NAME, typewriter: false };
    switch (todayOrderStatus()) {
      case 'accepted':
        this.openDialog({ ...board, lines: ['Ya has aceptado el pedido de hoy'] });
        return;
      case 'full':
        this.openDialog({ ...board, lines: ['Ya tienes 3 pedidos activos'] });
        return;
      default:
        this.openDialog({
          ...board,
          lines: [orderText(orderForDay(getGameState().day))],
          choice: {
            options: ['Aceptar', 'Rechazar'],
            onChoose: (index) => {
              if (index === 0) acceptTodayOrder();
              return null;
            },
          },
        });
    }
  }

  // --- Bosque (HU-50) ---

  // Puntos de Setas y Moras y troncos (src/data/forage.json). Son obstáculos. Al recogerlos desaparecen
  // hasta el día siguiente.
  private addForageSpot(object: MapObject): void {
    const id = getProperty(object, 'id') as string;
    const spot = forage[getProperty(object, 'tipo') as keyof typeof forage];
    const state = getGameState();
    if (state.foraged.includes(id)) {
      return;
    }
    const area = tileArea(object);
    const sprite = this.physics.add.staticImage(area.centerX, area.centerY, spot.sprite);
    sprite.body.setSize(TILE_SIZE - 2, TILE_SIZE - 2);
    const collider = this.physics.add.collider(this.player, sprite);
    const interactable: Interactable = {
      kind: 'recurso',
      id,
      area,
      isAvailable: () => true,
      interact: () => {
        const item = spot.item as ItemId;
        const hud = this.scene.get('HudScene');
        if ('tool' in spot && countItem(spot.tool as ItemId) === 0) {
          showMessage(hud, spot.noTool, MESSAGE_MS, 'top');
          return;
        }
        // Primero se comprueba que cabe: si no, el punto sigue ahí y no se gasta energía.
        if (!canAdd(item, 1)) {
          showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
          return;
        }
        if (!this.work(spot.action as 'forage' | 'chop')) {
          return;
        }
        addItem(item, 1);
        state.foraged.push(id);
        recordEvent(spot.action); // HU-63
        collider.destroy();
        sprite.destroy();
        this.interactables = this.interactables.filter((other) => other !== interactable);
      },
    };
    this.interactables.push(interactable);
  }

  isForageSpotOnMap(id: string): boolean {
    return this.interactables.some((interactable) => interactable.kind === 'recurso' && interactable.id === id);
  }

  // --- Pesca (HU-48 y HU-49) ---

  // El agua del lago que el personaje tiene justo delante, si la hay (las casillas de la hoja "agua").
  private waterInFront(): Interactable | null {
    const tile = this.tileInFront();
    if (this.obstacles.getTileAt(tile.x, tile.y)?.tileset?.name !== 'agua') return null;
    return {
      kind: 'agua',
      id: 'agua',
      area: new Phaser.Geom.Rectangle(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE),
      isAvailable: () => true,
      interact: () => this.castRod(tile),
    };
  }

  // Lanza la caña. "¡Pica!" aparece entre 2 y 5 segundos después (entre 1 y 3 con la Caña buena, HU-85). Los
  // temporizadores son del reloj de la escena: con la pausa abierta se detienen y la pesca sigue al reanudar.
  private castRod(tile: { x: number; y: number }): void {
    if (countItem('cana-de-pescar') === 0) {
      showMessage(this.scene.get('HudScene'), 'Necesitas una Caña de pescar', MESSAGE_MS, 'top');
      return;
    }
    // HU-60: la primera vez que se lanza la caña después de inscribirse empieza el concurso. Durante el
    // concurso, lanzar la caña no gasta energía.
    startFishingContestIfSignedUp();
    if (!isFishingContestRunning() && !this.work('cast')) {
      return;
    }
    this.player.stand();
    this.indicator.setVisible(false);
    const bobber = this.add
      .circle(tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE + TILE_SIZE / 2, 2, 0xd83c3c)
      .setStrokeStyle(1, 0xf2f2f2);
    this.fishing = {
      biting: false,
      bobber,
      timer: this.time.delayedCall(randomInt(fishingTimes().biteMinMs, fishingTimes().biteMaxMs), () => this.bite()),
    };
  }

  // "¡Pica!": hay 1 segundo para pulsar E (2 con la Caña buena, HU-85). Si no, el pez se escapa.
  private bite(): void {
    if (!this.fishing) return;
    this.fishing.biting = true;
    this.fishing.bobber.setY(this.fishing.bobber.y + 2);
    const { reactionMs } = fishingTimes();
    showMessage(this.scene.get('HudScene'), '¡Pica!', reactionMs, 'top');
    this.fishing.timer = this.time.delayedCall(reactionMs, () => {
      this.stopFishing();
      showMessage(this.scene.get('HudScene'), 'Se ha escapado', MESSAGE_MS, 'top');
    });
  }

  // E con la caña lanzada: demasiado pronto, o el pez (HU-49: según la hora a la que ha picado).
  private reel(): void {
    const hud = this.scene.get('HudScene');
    const biting = this.fishing?.biting;
    this.stopFishing();
    if (!biting) {
      showMessage(hud, 'Has tirado demasiado pronto', MESSAGE_MS, 'top');
      return;
    }
    const fish = catchAt(getGameState().minutes, isFishingContestRunning());
    if (!canAdd(fish.item, 1)) {
      showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
      return;
    }
    addItem(fish.item, 1);
    this.lastCatch = fish;
    recordContestCatch(fish.size); // HU-60, si hay concurso
    getGameState().dayStats.fish += 1; // HU-39
    recordEvent('fish'); // HU-63
    showMessage(hud, caughtMessage(fish), MESSAGE_MS, 'top');
  }

  // Deja de pescar (también al recoger la caña con una flecha: la energía gastada no se devuelve).
  private stopFishing(): void {
    if (!this.fishing) return;
    this.fishing.timer.remove();
    this.fishing.bobber.destroy();
    this.fishing = null;
  }

  isFishing(): boolean {
    return this.fishing !== null;
  }

  // Para los tests de HU-85: si el pez ya ha picado y cuánto dura la espera actual, en milisegundos (hasta
  // "¡Pica!" o, después, el tiempo para pulsar E). Null si no se está pescando.
  getFishingTimer(): { biting: boolean; delayMs: number } | null {
    return this.fishing ? { biting: this.fishing.biting, delayMs: this.fishing.timer.delay } : null;
  }

  getLastCatch(): Catch | null {
    return this.lastCatch;
  }

  // --- Consultas del huerto para los tests ---

  getPlotView(x: number, y: number): { soilVisible: boolean; watered: boolean; cropFrame: number | null } | null {
    const view = this.plotViews.get(`${x},${y}`);
    if (!view) return null;
    return {
      soilVisible: view.soil.visible,
      watered: view.soil.isTinted,
      cropFrame: view.crop.visible ? Number(view.crop.frame.name) : null,
    };
  }

  isAppleOnTree(): boolean {
    return this.apple?.visible ?? false;
  }

  // --- Cámara ---

  // HU-09: la cámara sigue al personaje y lo mantiene centrado, pero se detiene en los bordes del mapa.
  // En un eje en el que el mapa es más pequeño que la vista, los límites se amplían hasta el tamaño
  // de la vista y se centran sobre el mapa: la cámara no se mueve en ese eje y la zona se ve centrada.
  private setUpCamera(mapWidth: number, mapHeight: number): void {
    const camera = this.cameras.main;
    camera.setZoom(WORLD_ZOOM);
    camera.setRoundPixels(true);

    const viewWidth = camera.width / WORLD_ZOOM;
    const viewHeight = camera.height / WORLD_ZOOM;
    const boundsWidth = Math.max(mapWidth, viewWidth);
    const boundsHeight = Math.max(mapHeight, viewHeight);
    camera.setBounds((mapWidth - boundsWidth) / 2, (mapHeight - boundsHeight) / 2, boundsWidth, boundsHeight);
    camera.startFollow(this.player, true);
  }

  // --- Puertas (HU-08) ---

  private createDoor(object: MapObject): Door {
    return {
      area: new Phaser.Geom.Rectangle(object.x, object.y, object.width, object.height),
      zone: getProperty(object, 'zona') as ZoneId,
      closedHouse: getProperty(object, 'cerrada'),
      direction: getProperty(object, 'direccion') as Direction,
    };
  }

  // El personaje cruza una puerta si camina hacia ella y su cuerpo la toca con al menos la mitad de su anchura.
  // Las puertas de los edificios son sólidas: basta con llegar a tocarlas, sin tener que alinearse al píxel.
  private isCrossing(door: Door): boolean {
    if (this.player.facing !== door.direction) {
      return false;
    }

    const body = this.player.body;
    const touchArea = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(door.area), 1, 1);
    const overlap = Phaser.Geom.Rectangle.Intersection(bodyArea(body), touchArea);
    if (overlap.isEmpty()) {
      return false;
    }

    const vertical = door.direction === 'up' || door.direction === 'down';
    const sideOverlap = vertical ? overlap.width : overlap.height;
    return sideOverlap >= (vertical ? body.width : body.height) / 2;
  }

  // HU-17 y HU-57: si el edificio está cerrado, aparece un aviso (se cierra con E) y no se cambia de zona.
  // HU-70: lo mismo con las casas del barrio en las que no se puede entrar.
  private useDoor(door: Door): void {
    if (door.closedHouse) {
      const { title, message } = closedHouse(door.closedHouse);
      this.warnedDoor = door;
      this.openDialog({ speaker: 'puerta', title, lines: [message], typewriter: false });
      return;
    }
    const closedMessage = closedDoorMessage(door.zone);
    if (!closedMessage) {
      this.changeZone(door);
      return;
    }
    this.warnedDoor = door;
    this.openDialog({ speaker: 'puerta', title: ZONES[door.zone].name, lines: [closedMessage], typewriter: false });
  }

  // HU-08: fundido a negro en 0,5 s y el personaje aparece junto a la puerta de la zona de destino.
  private changeZone(door: Door): void {
    this.changingZone = true;
    this.player.stand();
    this.indicator.setVisible(false);

    const state = getGameState();
    const camera = this.cameras.main;
    camera.fadeOut(ZONE_FADE_MS, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const arrival = findMapPoint(this, door.zone, `llegada-${state.zone}`);
      const notice = firstVisitNotice(door.zone) ?? undefined;
      state.zone = door.zone;
      state.position = pointTile(arrival);
      recordEvent(`visit:${door.zone}`); // HU-63: entrar en una zona por su puerta
      if (!state.visitedZones.includes(door.zone)) {
        state.visitedZones.push(door.zone);
      }
      const data: GameSceneData = { facing: getProperty(arrival, 'mirando') as Direction, notice };
      this.scene.restart(data);
    });
  }
}

function bodyArea(body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): Phaser.Geom.Rectangle {
  return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
}

const tileKey = ({ x, y }: TilePosition) => `${x},${y}`;

// Desplazamiento de una casilla en cada dirección (HU-79).
const DIRECTION_STEP: Record<Direction, TilePosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
// Lo que tarda una caja en avanzar una casilla al empujarla.
const CRATE_PUSH_MS = 150;

// Interior del corral de las cajas (HU-79), en casillas.
function corralArea(object: MapObject): Phaser.Geom.Rectangle {
  const { x, y } = pointTile(object);
  return new Phaser.Geom.Rectangle(x, y, Number(getProperty(object, 'columnas')), Number(getProperty(object, 'filas')));
}

function insideTiles(area: Phaser.Geom.Rectangle, tile: TilePosition): boolean {
  return tile.x >= area.left && tile.x < area.right && tile.y >= area.top && tile.y < area.bottom;
}

// Casilla completa en la que está un punto del mapa.
function tileArea(object: MapObject): Phaser.Geom.Rectangle {
  const { x, y } = pointTile(object);
  return new Phaser.Geom.Rectangle(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}
