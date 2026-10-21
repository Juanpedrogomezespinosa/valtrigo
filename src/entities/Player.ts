import Phaser from 'phaser';
import { PLAYER_SPEED, TILE_SIZE } from '../config';
import type { TilePosition } from '../systems/zones';

export type Direction = 'down' | 'up' | 'left' | 'right';

// En las hojas de personajes de Ninja Adventure cada columna es una dirección
// y las 4 primeras filas son la animación de andar.
const DIRECTION_COLUMN: Record<Direction, number> = { down: 0, up: 1, left: 2, right: 3 };
const SHEET_COLUMNS = 4;
const WALK_FRAMES = 4;
const WALK_FRAME_RATE = 8;

// Cuerpo de colisión: 14×14 centrado en la casilla de 16×16 del personaje (HU-07).
const BODY_SIZE = 14;

const VELOCITY: Record<Direction, { x: number; y: number }> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Personaje del jugador (HU-06).
// - Se mueve en cuatro direcciones con las flechas o WASD, a velocidad constante y sin diagonales.
// - Si hay varias direcciones pulsadas, manda la última que se pulsó.
// - Mira hacia la dirección en la que se mueve, y la mantiene al pararse.
// - No atraviesa obstáculos. Si la dirección que manda está bloqueada y otra de las pulsadas
//   está libre, se mueve en la libre (HU-07).
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  facing: Direction = 'down';

  private keys: { key: Phaser.Input.Keyboard.Key; direction: Direction }[];
  private obstacles: Phaser.Tilemaps.TilemapLayer | null = null;

  constructor(scene: Phaser.Scene, position: TilePosition, facing: Direction = 'down') {
    super(scene, position.x * TILE_SIZE + TILE_SIZE / 2, position.y * TILE_SIZE + TILE_SIZE / 2, 'jugador', DIRECTION_COLUMN[facing]);
    this.facing = facing;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(BODY_SIZE, BODY_SIZE);
    this.setCollideWorldBounds(true);

    const { KeyCodes } = Phaser.Input.Keyboard;
    const keyboard = scene.input.keyboard!;
    const bindings: [number, Direction][] = [
      [KeyCodes.UP, 'up'],
      [KeyCodes.DOWN, 'down'],
      [KeyCodes.LEFT, 'left'],
      [KeyCodes.RIGHT, 'right'],
      [KeyCodes.W, 'up'],
      [KeyCodes.S, 'down'],
      [KeyCodes.A, 'left'],
      [KeyCodes.D, 'right'],
    ];
    this.keys = bindings.map(([code, direction]) => ({ key: keyboard.addKey(code), direction }));

    createWalkAnimations(scene);
  }

  // Capa de obstáculos del mapa, para saber de antemano si una dirección está bloqueada.
  setObstacles(layer: Phaser.Tilemaps.TilemapLayer): void {
    this.obstacles = layer;
  }

  // Se llama en cada fotograma desde GameScene.
  update(): void {
    const pressed = this.pressedDirections();
    if (pressed.length === 0) {
      this.stand();
      return;
    }

    const direction = pressed.find((candidate) => this.canMove(candidate));
    if (!direction) {
      // Todas las direcciones pulsadas están bloqueadas: mira hacia la que manda, sin andar.
      this.facing = pressed[0];
      this.stand();
      return;
    }

    this.facing = direction;
    const { x, y } = VELOCITY[direction];
    this.setVelocity(x * PLAYER_SPEED, y * PLAYER_SPEED);
    this.anims.play(`jugador-andar-${direction}`, true);
  }

  // Detiene al personaje mirando hacia donde miraba.
  stand(): void {
    this.setVelocity(0, 0);
    this.anims.stop();
    this.setFrame(DIRECTION_COLUMN[this.facing]);
  }

  getTilePosition(): TilePosition {
    return { x: Math.floor(this.x / TILE_SIZE), y: Math.floor(this.y / TILE_SIZE) };
  }

  // Direcciones pulsadas, de la pulsada más tarde a la más antigua, sin repetir.
  private pressedDirections(): Direction[] {
    const held = this.keys.filter(({ key }) => key.isDown).sort((a, b) => b.key.timeDown - a.key.timeDown);
    return [...new Set(held.map(({ direction }) => direction))];
  }

  // Comprueba si el cuerpo, desplazado una fracción de píxel en esa dirección, chocaría con un obstáculo
  // o con el borde del mapa. Solo cuenta como bloqueada si ya está tocando el obstáculo: hasta entonces
  // el personaje avanza y la física lo detiene justo al lado.
  private canMove(direction: Direction): boolean {
    const probe = 0.05;
    const dx = VELOCITY[direction].x * probe;
    const dy = VELOCITY[direction].y * probe;
    // En el eje perpendicular se encoge un poco, para no contar como bloqueo un obstáculo que solo roza el lateral.
    const margin = 0.1;
    const area = new Phaser.Geom.Rectangle(
      this.body.x + dx + (dx === 0 ? margin : 0),
      this.body.y + dy + (dy === 0 ? margin : 0),
      this.body.width - (dx === 0 ? margin * 2 : 0),
      this.body.height - (dy === 0 ? margin * 2 : 0),
    );

    const bounds = this.scene.physics.world.bounds;
    if (area.left < bounds.left || area.top < bounds.top || area.right > bounds.right || area.bottom > bounds.bottom) {
      return false;
    }

    const blockingTiles = this.obstacles?.getTilesWithinWorldXY(area.x, area.y, area.width, area.height, {
      isColliding: true,
    });
    // Los NPC tienen cuerpos estáticos: también bloquean el paso, salvo los desactivados (un NPC fuera de su
    // horario, HU-40), que siguen en el árbol de cuerpos estáticos de Phaser.
    const blockingBodies = this.scene.physics
      .overlapRect(area.x, area.y, area.width, area.height, false, true)
      .filter((body) => body.enable);
    return !blockingTiles?.length && blockingBodies.length === 0;
  }
}

function createWalkAnimations(scene: Phaser.Scene): void {
  for (const [direction, column] of Object.entries(DIRECTION_COLUMN)) {
    const key = `jugador-andar-${direction}`;
    if (scene.anims.exists(key)) {
      continue;
    }
    const frames = Array.from({ length: WALK_FRAMES }, (_, row) => row * SHEET_COLUMNS + column);
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers('jugador', { frames }),
      frameRate: WALK_FRAME_RATE,
      repeat: -1,
    });
  }
}
