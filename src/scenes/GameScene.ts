import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, MESSAGE_MS, TALK_DISTANCE, WORLD_ZOOM, ZONE_FADE_MS } from '../config';
import dialogues from '../data/dialogues.json';
import { Npc } from '../entities/Npc';
import { Player, type Direction } from '../entities/Player';
import type { DialogSceneData, NpcId } from './DialogScene';
import { getGameState } from '../systems/gameState';
import { addItem, type ItemId } from '../systems/inventory';
import { showMessage } from '../ui/message';
import { findMapPoint, getProperty, mapKey, mapObjects, pointTile, type ZoneId } from '../systems/zones';

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

// Escena de juego: dibuja la zona actual y al personaje.
export class GameScene extends Phaser.Scene {
  player!: Player;

  private facing?: Direction;
  private doors: Door[] = [];
  private changingZone = false;
  private npcs: Npc[] = [];
  private talkIndicator!: Phaser.GameObjects.Text;
  private dialogOpen = false;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.facing = data.facing;
  }

  create(): void {
    const state = getGameState();
    this.changingZone = false;
    this.dialogOpen = false;

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

    // NPC de la zona (HU-10): son obstáculos para el personaje (HU-07).
    this.npcs = mapObjects(this, state.zone)
      .filter((object) => object.name === 'npc')
      .map((object) => new Npc(this, getProperty(object, 'personaje')!, pointTile(object)));
    this.physics.add.collider(this.player, this.npcs);

    // Indicador "E" sobre el NPC con el que se puede hablar.
    this.talkIndicator = this.add
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

    this.input.keyboard!.on('keydown-E', () => this.talk());
    this.input.keyboard!.on('keydown-I', () => this.openInventory());

    // Interfaz fija (dinero), por encima de la partida.
    if (!this.scene.isActive('HudScene')) {
      this.scene.launch('HudScene');
    }

    this.doors = mapObjects(this, state.zone)
      .filter((object) => object.name === 'puerta')
      .map((object) => ({
        area: new Phaser.Geom.Rectangle(object.x, object.y, object.width, object.height),
        zone: getProperty(object, 'zona') as ZoneId,
        direction: getProperty(object, 'direccion') as Direction,
      }));

    this.setUpCamera(map.widthInPixels, map.heightInPixels);

    // Escape abre el menú de pausa y detiene la partida (HU-26), salvo durante un cambio de zona.
    // Con la pausa abierta el personaje no se mueve (HU-06).
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.changingZone) {
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
    const onResume = () => this.input.keyboard!.resetKeys();
    this.events.on(Phaser.Scenes.Events.RESUME, onResume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));
  }

  // HU-15: recoge objetos. Si no caben, no se recoge ninguno y aparece "Inventario lleno".
  pickUp(item: ItemId, quantity: number): boolean {
    if (addItem(item, quantity)) {
      return true;
    }
    showMessage(this.scene.get('HudScene'), 'Inventario lleno', MESSAGE_MS);
    return false;
  }

  // HU-13: I abre el inventario. La partida se detiene mientras está abierto.
  private openInventory(): void {
    if (this.changingZone || this.dialogOpen) {
      return;
    }
    this.player.stand();
    this.scene.pause();
    this.scene.launch('InventoryScene');
  }

  isChangingZone(): boolean {
    return this.changingZone;
  }

  isDialogOpen(): boolean {
    return this.dialogOpen;
  }

  // NPC con el que se puede hablar ahora mismo, si hay alguno.
  getTalkTarget(): string | null {
    return this.talkTarget()?.character ?? null;
  }

  isTalkIndicatorVisible(): boolean {
    return this.talkIndicator.visible;
  }

  // El NPC más cercano que esté a menos de una casilla del personaje.
  private talkTarget(): Npc | null {
    let nearest: Npc | null = null;
    let nearestGap = Infinity;
    for (const npc of this.npcs) {
      const gap = npc.gapTo(this.player.body);
      if (gap < TALK_DISTANCE && gap < nearestGap) {
        nearest = npc;
        nearestGap = gap;
      }
    }
    return nearest;
  }

  // HU-10: E junto a un NPC abre su diálogo. Mientras está abierto, el personaje no se mueve.
  private talk(): void {
    if (this.changingZone || this.dialogOpen) {
      return;
    }
    const npc = this.talkTarget();
    if (!npc) {
      return;
    }

    const id = npc.character as NpcId;
    this.dialogOpen = true;
    this.player.stand();
    this.talkIndicator.setVisible(false);
    const data: DialogSceneData = {
      npc: id,
      lines: dialogues[id].greeting,
      onClose: () => {
        this.dialogOpen = false;
      },
    };
    this.scene.launch('DialogScene', data);
  }

  private updateTalkIndicator(): void {
    const npc = this.talkTarget();
    this.talkIndicator.setVisible(npc !== null);
    if (npc) {
      this.talkIndicator.setPosition(npc.x, npc.y - npc.height / 2 - 1);
    }
  }

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

  update(): void {
    // Durante el fundido de un cambio de zona el personaje no se mueve (HU-08).
    if (this.changingZone || this.dialogOpen) {
      return;
    }

    this.player.update();
    this.updateTalkIndicator();
    getGameState().position = this.player.getTilePosition();

    const door = this.doors.find((candidate) => this.isCrossing(candidate));
    if (door) {
      this.changeZone(door);
    }
  }

  // El personaje cruza una puerta si camina hacia ella y su cuerpo la toca con al menos la mitad de su anchura.
  // Las puertas de los edificios son sólidas: basta con llegar a tocarlas, sin tener que alinearse al píxel.
  private isCrossing(door: Door): boolean {
    if (this.player.facing !== door.direction) {
      return false;
    }

    const body = this.player.body;
    const bodyArea = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
    const touchArea = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(door.area), 1, 1);
    const overlap = Phaser.Geom.Rectangle.Intersection(bodyArea, touchArea);
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
