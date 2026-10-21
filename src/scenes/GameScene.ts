import Phaser from 'phaser';
import {
  COLORS,
  FISH_BITE_MAX_MS,
  FISH_BITE_MIN_MS,
  FISH_REACTION_MS,
  FONT_FAMILY,
  MESSAGE_MS,
  SLEEP_FADE_MS,
  STEP_SOUND_MS,
  TALK_DISTANCE,
  TILE_SIZE,
  WATERED_TINT,
  WORLD_ZOOM,
  ZONE_FADE_MS,
} from '../config';
import chests from '../data/chests.json';
import dialogues from '../data/dialogues.json';
import signs from '../data/signs.json';
import forage from '../data/forage.json';
import worldItems from '../data/worldItems.json';
import { Chest } from '../entities/Chest';
import { Npc } from '../entities/Npc';
import { Player, type Direction } from '../entities/Player';
import { getGameState, startGame } from '../systems/gameState';
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
import { closedDoorMessage, firstVisitNotice } from '../systems/doors';
import { catchAt, caughtMessage, type Catch } from '../systems/fishing';
import { randomInt } from '../systems/random';
import { spendEnergy, type WorkAction } from '../systems/energy';
import { isShopOpen } from '../systems/economy';
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
  receivedMessage,
  type NpcId,
} from '../systems/quests';
import { findMapPoint, getProperty, mapKey, mapObjects, pointTile, ZONES, type MapObject, type ZoneId } from '../systems/zones';
import { showConfirmDialog } from '../ui/confirmDialog';
import { showMessage } from '../ui/message';
import type { DaySummarySceneData } from './DaySummaryScene';
import type { DialogSceneData } from './DialogScene';
import type { OverlaySceneData } from './InventoryScene';
import type { SeedSceneData } from './SeedScene';

export interface GameSceneData {
  // Hacia dónde mira el personaje al aparecer (al llegar por una puerta).
  facing?: Direction;
  // Aviso que aparece al llegar, la primera vez que se entra en la zona (HU-64).
  notice?: string;
}

interface Door {
  area: Phaser.Geom.Rectangle;
  zone: ZoneId;
  // Dirección en la que hay que caminar para cruzarla.
  direction: Direction;
}

// Algo con lo que se interactúa pulsando E a menos de una casilla: NPC, cofres, carteles y objetos sueltos.
interface Interactable {
  kind: 'npc' | 'cofre' | 'cartel' | 'objeto' | 'cama' | 'manzano' | 'parcela' | 'agua' | 'recurso';
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
  // Quién habla en el diálogo abierto (un NPC, "cartel"...), o null si no hay diálogo.
  private dialogSpeaker: string | null = null;
  private indicator!: Phaser.GameObjects.Text;
  private changingZone = false;
  // Puerta cerrada que ya ha mostrado su aviso (HU-17 y HU-57). No vuelve a avisar hasta que el personaje
  // deja de caminar hacia ella.
  private warnedDoor: Door | null = null;
  private sleeping = false;
  private sleepPromptOpen = false;
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
    this.sleepPromptOpen = false;
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

    this.player = new Player(this, state.position, this.facing);
    this.player.setObstacles(obstacles);
    this.physics.add.collider(this.player, obstacles);

    const objects = mapObjects(this, state.zone);
    this.doors = objects.filter((object) => object.name === 'puerta').map((object) => this.createDoor(object));
    this.interactables = [];
    this.chests = [];
    this.npcs = [];
    this.garden = null;
    this.plotViews.clear();
    this.apple = null;
    for (const object of objects) {
      if (object.name === 'npc') this.addNpc(object);
      if (object.name === 'cofre') this.addChest(object);
      if (object.name === 'cartel') this.addSign(object);
      if (object.name === 'objeto') this.addWorldItem(object);
      if (object.name === 'cama') this.addBed(object);
      if (object.name === 'huerto') this.addGarden(object);
      if (object.name === 'manzano') this.addAppleTree(object);
      if (object.name === 'recurso') this.addForageSpot(object);
    }
    this.updateNpcPresence();

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
    playZoneMusic(this, `music-${state.zone}`, ZONES[state.zone].music);

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
    this.updateNpcPresence();

    // Durante un cambio de zona, un diálogo o con el inventario abierto, el personaje no se mueve.
    if (this.isBusy()) {
      return;
    }

    this.player.update();
    this.playSteps(delta);
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
    showMessage(this.scene.get('HudScene'), 'Estás demasiado cansado', MESSAGE_MS, 'top');
    return false;
  }

  // HU-32: mientras el personaje anda (se desplaza de verdad, no contra un obstáculo), suenan sus pasos.
  private playSteps(delta: number): void {
    const body = this.player.body;
    const walking = body.velocity.lengthSq() > 0 && (body.deltaAbsX() > 0 || body.deltaAbsY() > 0);
    if (!walking) {
      this.stepMs = STEP_SOUND_MS; // al empezar a andar, el primer paso suena enseguida
      return;
    }
    this.stepMs += delta;
    if (this.stepMs >= STEP_SOUND_MS) {
      this.stepMs = 0;
      playEffect(this, 'steps');
    }
  }

  // --- Consultas para los tests ---

  isChangingZone(): boolean {
    return this.changingZone;
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
    keyboard.on('keydown-I', () => this.openOverlay('InventoryScene'));
    keyboard.on('keydown-O', () => this.openOverlay('ObjectivesScene'));

    // Escape abre el menú de pausa y detiene la partida (HU-26), salvo durante un cambio de zona.
    // Con el inventario o los objetivos abiertos, Escape los cierra y no abre la pausa.
    keyboard.on('keydown-ESC', () => {
      // Con "¿Dormir?" abierto, Escape equivale a "No" (lo gestiona el propio cuadro).
      if (this.changingZone || this.sleeping || this.sleepPromptOpen || this.overlayOpen) {
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
      this.changingZone || this.sleeping || this.sleepPromptOpen || this.dialogOpen || this.overlayOpen || this.fishing !== null
    );
  }

  // HU-24: E junto a la cama pregunta "¿Dormir?". El cuadro se dibuja en la capa de interfaz.
  private askToSleep(): void {
    this.sleepPromptOpen = true;
    this.player.stand();
    this.indicator.setVisible(false);
    showConfirmDialog(this.scene.get('HudScene'), '¿Dormir?', (yes) => {
      this.sleepPromptOpen = false;
      if (yes) {
        this.goToBed();
      }
    });
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
    for (const key of ['DialogScene', 'InventoryScene', 'ObjectivesScene', 'ShopScene', 'SeedScene']) {
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
  private openOverlay(sceneKey: 'InventoryScene' | 'ObjectivesScene' | 'ShopScene' | 'SeedScene', extra: object = {}): void {
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
      this.indicator.setPosition(target.area.centerX, target.area.top - 1);
    }
  }

  // Abre un diálogo. `afterClose` se ejecuta al cerrarlo (por ejemplo, abrir la tienda).
  private openDialog(data: Omit<DialogSceneData, 'onClose'>, afterClose?: () => void): void {
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
    this.interactables.push({
      kind: 'npc',
      id,
      area: bodyArea(npc.body),
      isAvailable: () => npc.isPresent(),
      interact: () => this.talkTo(id),
    });
  }

  // HU-40: cada NPC aparece o desaparece según su horario, también con el jugador en la zona.
  // Si el jugador está hablando con él, se queda hasta que se cierra el diálogo. Si el jugador está
  // en su sitio, el NPC espera a que se aparte para aparecer: así no lo deja encerrado.
  private updateNpcPresence(): void {
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
        completeQuest(conversation.quest);
        showMessage(this.scene.get('HudScene'), 'Encargo completado', MESSAGE_MS, 'top');
        // HU-65: un mensaje por cada objeto de la recompensa, debajo de "Encargo completado".
        for (const { item, quantity } of conversation.quest.reward.items) {
          showMessage(this.scene.get('HudScene'), receivedMessage(id, item as ItemId, quantity), MESSAGE_MS, 'top');
        }
        playEffect(this, 'questComplete');
        // HU-37: al completar el último encargo, cuando se cierra el diálogo aparece el mensaje de final.
        const afterThanks = conversation.quest.id === LAST_QUEST ? () => this.showEnding() : afterClose;
        this.openDialog({ ...npcDialog, lines: conversation.lines }, afterThanks);
        return;
      }

      case 'give-letter':
        // Decisión del autor: con el encargo 1 activo, la vendedora entrega la Carta del alcalde.
        if (this.pickUp('carta-del-alcalde', 1)) {
          showMessage(this.scene.get('HudScene'), receivedMessage(id, 'carta-del-alcalde', 1), MESSAGE_MS, 'top'); // HU-65
          this.openDialog({ ...npcDialog, lines: conversation.lines }, afterClose);
        } else {
          afterClose?.();
        }
        return;

      default:
        this.openDialog({ ...npcDialog, lines: conversation.lines });
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
      const data: Omit<SeedSceneData, 'onClose'> = {
        seeds,
        onChoose: (seed: SeedId) => {
          if (this.work('sow')) {
            removeItem(seed, 1);
            sow(tile, seed);
            this.refreshPlot(tile);
          }
        },
      };
      this.openOverlay('SeedScene', data);
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
        recordEvent('water'); // HU-63
      }
    }
    this.refreshPlot(tile);
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

  // Lanza la caña (3 de energía). "¡Pica!" aparece entre 2 y 5 segundos después. Los temporizadores son
  // del reloj de la escena: con la pausa abierta se detienen y la pesca sigue al reanudar.
  private castRod(tile: { x: number; y: number }): void {
    if (countItem('cana-de-pescar') === 0) {
      showMessage(this.scene.get('HudScene'), 'Necesitas una Caña de pescar', MESSAGE_MS, 'top');
      return;
    }
    if (!this.work('cast')) {
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
      timer: this.time.delayedCall(randomInt(FISH_BITE_MIN_MS, FISH_BITE_MAX_MS), () => this.bite()),
    };
  }

  // "¡Pica!": hay 1 segundo para pulsar E. Si no, el pez se escapa.
  private bite(): void {
    if (!this.fishing) return;
    this.fishing.biting = true;
    this.fishing.bobber.setY(this.fishing.bobber.y + 2);
    showMessage(this.scene.get('HudScene'), '¡Pica!', FISH_REACTION_MS, 'top');
    this.fishing.timer = this.time.delayedCall(FISH_REACTION_MS, () => {
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
    const fish = catchAt(getGameState().minutes);
    if (!canAdd(fish.item, 1)) {
      showMessage(hud, 'Inventario lleno', MESSAGE_MS, 'top');
      return;
    }
    addItem(fish.item, 1);
    this.lastCatch = fish;
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
  private useDoor(door: Door): void {
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

// Casilla completa en la que está un punto del mapa.
function tileArea(object: MapObject): Phaser.Geom.Rectangle {
  const { x, y } = pointTile(object);
  return new Phaser.Geom.Rectangle(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}
