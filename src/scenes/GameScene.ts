import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, MESSAGE_MS, SLEEP_FADE_MS, TALK_DISTANCE, TILE_SIZE, WORLD_ZOOM, ZONE_FADE_MS } from '../config';
import chests from '../data/chests.json';
import dialogues from '../data/dialogues.json';
import signs from '../data/signs.json';
import worldItems from '../data/worldItems.json';
import { Chest } from '../entities/Chest';
import { Npc } from '../entities/Npc';
import { Player, type Direction } from '../entities/Player';
import { getGameState, startGame } from '../systems/gameState';
import { addItem, type ItemId } from '../systems/inventory';
import { isShopOpen } from '../systems/economy';
import { writeSave } from '../systems/save';
import { playZoneMusic } from '../systems/audio';
import { stateAfterMidnight, stateAfterSleeping } from '../systems/sleep';
import { advanceTime } from '../systems/time';
import { acceptQuest, canReceiveReward, completeQuest, conversationWith, type NpcId } from '../systems/quests';
import { findMapPoint, getProperty, mapKey, mapObjects, pointTile, ZONES, type MapObject, type ZoneId } from '../systems/zones';
import { showConfirmDialog } from '../ui/confirmDialog';
import { showMessage } from '../ui/message';
import type { DialogSceneData } from './DialogScene';
import type { OverlaySceneData } from './InventoryScene';

export interface GameSceneData {
  // Hacia dónde mira el personaje al aparecer (al llegar por una puerta).
  facing?: Direction;
}

interface Door {
  area: Phaser.Geom.Rectangle;
  zone: ZoneId;
  // Dirección en la que hay que caminar para cruzarla.
  direction: Direction;
}

// Algo con lo que se interactúa pulsando E a menos de una casilla: NPC, cofres, carteles y objetos sueltos.
interface Interactable {
  kind: 'npc' | 'cofre' | 'cartel' | 'objeto' | 'cama';
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
  private doors: Door[] = [];
  private interactables: Interactable[] = [];
  private chests: Chest[] = [];
  private indicator!: Phaser.GameObjects.Text;
  private changingZone = false;
  private sleeping = false;
  private sleepPromptOpen = false;
  private dialogOpen = false;
  // Inventario (HU-13) o lista de objetivos (HU-21) abiertos: el tiempo sigue, pero el personaje no se mueve.
  private overlayOpen = false;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.facing = data.facing;
  }

  create(): void {
    const state = getGameState();
    this.changingZone = false;
    this.sleeping = false;
    this.sleepPromptOpen = false;
    this.dialogOpen = false;
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
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, state.position, this.facing);
    this.player.setObstacles(obstacles);
    this.physics.add.collider(this.player, obstacles);

    const objects = mapObjects(this, state.zone);
    this.doors = objects.filter((object) => object.name === 'puerta').map((object) => this.createDoor(object));
    this.interactables = [];
    this.chests = [];
    for (const object of objects) {
      if (object.name === 'npc') this.addNpc(object);
      if (object.name === 'cofre') this.addChest(object);
      if (object.name === 'cartel') this.addSign(object);
      if (object.name === 'objeto') this.addWorldItem(object);
      if (object.name === 'cama') this.addBed(object);
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
    playZoneMusic(this, `music-${state.zone}`, ZONES[state.zone].music);

    // Capa de noche (HU-23) e interfaz fija (día, hora, dinero y energía), por encima de la partida.
    for (const key of ['NightScene', 'HudScene']) {
      if (!this.scene.isActive(key)) {
        this.scene.launch(key);
      }
    }
  }

  update(_time: number, delta: number): void {
    // HU-22: el reloj avanza mientras la partida no está en pausa (esta escena en pausa no se actualiza),
    // también con diálogos, inventario, objetivos o tienda abiertos.
    if (!this.sleeping && advanceTime(delta)) {
      this.fallAsleepAtMidnight();
    }

    // Durante un cambio de zona, un diálogo o con el inventario abierto, el personaje no se mueve.
    if (this.isBusy()) {
      return;
    }

    this.player.update();
    this.updateIndicator();
    getGameState().position = this.player.getTilePosition();

    const door = this.doors.find((candidate) => this.isCrossing(candidate));
    if (door) {
      this.changeZone(door);
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

  isWorldItemOnMap(id: string): boolean {
    return this.interactables.some((interactable) => interactable.kind === 'objeto' && interactable.id === id);
  }

  // --- Teclas ---

  private setUpKeys(): void {
    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-E', () => this.interact());
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
    return this.changingZone || this.sleeping || this.sleepPromptOpen || this.dialogOpen || this.overlayOpen;
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
  // "la del día 4" si se duerme el día 4), aparece "Partida guardada", la pantalla se funde a negro
  // y empieza el día siguiente a las 06:00 con la energía a 100.
  private goToBed(): void {
    if (writeSave(getGameState())) {
      showMessage(this.scene.get('HudScene'), 'Partida guardada', MESSAGE_MS, 'top');
    }
    this.sleepUntilMorning(() => stateAfterSleeping(this));
  }

  // Funde a negro y empieza el día siguiente con el estado que devuelve `nextState`.
  private sleepUntilMorning(nextState: () => ReturnType<typeof stateAfterSleeping>): void {
    this.sleeping = true;
    this.player.stand();
    this.indicator.setVisible(false);
    const camera = this.cameras.main;
    camera.fadeOut(SLEEP_FADE_MS, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      startGame(nextState());
      const data: GameSceneData = { facing: 'down' };
      this.scene.restart(data);
    });
  }

  // HU-22 (escenario 4) y HU-24 (escenario 3): a medianoche el personaje se duerme. Se cierra lo que
  // estuviera abierto, la pantalla se funde a negro y empieza el día siguiente en su casa.
  private fallAsleepAtMidnight(): void {
    this.sleeping = true;
    this.player.stand();
    this.indicator.setVisible(false);
    for (const key of ['DialogScene', 'InventoryScene', 'ObjectivesScene', 'ShopScene']) {
      this.scene.stop(key);
    }
    this.dialogOpen = false;
    this.overlayOpen = false;
    this.sleepUntilMorning(() => stateAfterMidnight(this));
  }

  isSleeping(): boolean {
    return this.sleeping;
  }

  // HU-13 (I) y HU-21 (O): inventario y lista de objetivos. Mientras están abiertos el personaje
  // no se mueve, pero el tiempo sigue (decisión del autor).
  private openOverlay(sceneKey: 'InventoryScene' | 'ObjectivesScene' | 'ShopScene'): void {
    if (this.isBusy()) {
      return;
    }
    this.overlayOpen = true;
    this.player.stand();
    this.indicator.setVisible(false);
    const data: OverlaySceneData = {
      onClose: () => {
        this.overlayOpen = false;
      },
    };
    this.scene.launch(sceneKey, data);
  }

  // --- Interacciones con E (HU-10 y HU-12) ---

  // Lo más cercano a menos de una casilla del personaje con lo que se puede interactuar.
  private interactTarget(): Interactable | null {
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
    this.player.stand();
    this.indicator.setVisible(false);
    this.scene.launch('DialogScene', {
      ...data,
      onClose: () => {
        this.dialogOpen = false;
        afterClose?.();
      },
    } satisfies DialogSceneData);
  }

  // HU-10: los NPC son obstáculos (HU-07). E junto a uno abre su diálogo.
  private addNpc(object: MapObject): void {
    const id = getProperty(object, 'personaje') as NpcId;
    const npc = new Npc(this, id, pointTile(object));
    this.physics.add.collider(this.player, npc);
    this.interactables.push({
      kind: 'npc',
      id,
      area: bodyArea(npc.body),
      isAvailable: () => true,
      interact: () => this.talkTo(id),
    });
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
        this.openDialog({ ...npcDialog, lines: conversation.lines }, afterClose);
        return;
      }

      case 'give-letter':
        // Decisión del autor: con el encargo 1 activo, la vendedora entrega la Carta del alcalde.
        if (this.pickUp('carta-del-alcalde', 1)) {
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
      interact: () => this.openDialog({ speaker: 'cartel', title: 'Cartel', lines: [signs[id]], typewriter: false }),
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
      state.zone = door.zone;
      state.position = pointTile(arrival);
      const data: GameSceneData = { facing: getProperty(arrival, 'mirando') as Direction };
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
