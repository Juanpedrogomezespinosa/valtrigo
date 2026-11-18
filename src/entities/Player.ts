import Phaser from 'phaser';
import { PLAYER_SPEED, RUN_SPEED_FACTOR, TILE_SIZE } from '../config';
import { isRunning } from '../systems/gameState';
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

// Ayuda en las esquinas: si la dirección está bloqueada pero quedaría libre desplazándose de lado como mucho
// estos píxeles, el personaje se desliza de lado hasta alinearse con el hueco (por ejemplo, una entrada de
// una casilla). Sin ella, el cuerpo de 14 px solo cabe en un hueco de 16 px llegando casi perfectamente alineado.
const CORNER_ASSIST = 6;

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
// - Si choca por poco con la esquina de un hueco, se desliza de lado hasta entrar en él (CORNER_ASSIST).
// - Corriendo (HU-81, Mayús en GameScene) va 1,5 veces más rápido y la animación también.
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  facing: Direction = 'down';

  private keys: { key: Phaser.Input.Keyboard.Key; direction: Direction }[];
  private obstacles: Phaser.Tilemaps.TilemapLayer | null = null;

  // `texture` es la hoja con el aspecto elegido (HU-68).
  constructor(scene: Phaser.Scene, position: TilePosition, facing: Direction = 'down', texture = 'jugador') {
    super(scene, position.x * TILE_SIZE + TILE_SIZE / 2, position.y * TILE_SIZE + TILE_SIZE / 2, texture, DIRECTION_COLUMN[facing]);
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

    createWalkAnimations(scene, texture);
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
    this.anims.timeScale = this.isRunning() ? RUN_SPEED_FACTOR : 1;

    const slide = this.canMove(pressed[0]) ? null : this.cornerSlide(pressed[0]);
    if (slide) {
      this.facing = pressed[0];
      this.setVelocity(slide.x, slide.y);
      this.anims.play(`${this.texture.key}-andar-${pressed[0]}`, true);
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
    this.setVelocity(x * this.speed(), y * this.speed());
    this.anims.play(`${this.texture.key}-andar-${direction}`, true);
  }

  // Detiene al personaje mirando hacia donde miraba.
  stand(): void {
    this.setVelocity(0, 0);
    this.anims.stop();
    this.setFrame(DIRECTION_COLUMN[this.facing]);
  }

  isRunning(): boolean {
    return isRunning();
  }

  private speed(): number {
    return this.isRunning() ? PLAYER_SPEED * RUN_SPEED_FACTOR : PLAYER_SPEED;
  }

  // La dirección que manda entre las pulsadas, o null si no hay ninguna (para empujar cajas, HU-79).
  heldDirection(): Direction | null {
    return this.pressedDirections()[0] ?? null;
  }

  getTilePosition(): TilePosition {
    return { x: Math.floor(this.x / TILE_SIZE), y: Math.floor(this.y / TILE_SIZE) };
  }

  // Direcciones pulsadas, de la pulsada más tarde a la más antigua, sin repetir.
  private pressedDirections(): Direction[] {
    const held = this.keys.filter(({ key }) => key.isDown).sort((a, b) => b.key.timeDown - a.key.timeDown);
    return [...new Set(held.map(({ direction }) => direction))];
  }

  // Velocidad para deslizarse de lado hacia el hueco más cercano por el que se podría avanzar en esa dirección,
  // o null si no hay ninguno a CORNER_ASSIST píxeles o menos. Al final del deslizamiento la velocidad se ajusta
  // para quedar alineado justo en este fotograma, sin pasarse.
  private cornerSlide(direction: Direction): { x: number; y: number } | null {
    const horizontal = VELOCITY[direction].x !== 0;
    for (let distance = 1; distance <= CORNER_ASSIST; distance++) {
      for (const sign of [-1, 1]) {
        const shift = horizontal ? { x: 0, y: sign * distance } : { x: sign * distance, y: 0 };
        const side: Direction = horizontal ? (sign < 0 ? 'up' : 'down') : sign < 0 ? 'left' : 'right';
        if (!this.canMove(direction, shift) || !this.canMove(side)) continue;
        const frameSeconds = this.scene.game.loop.delta / 1000;
        const speed = frameSeconds > 0 ? Math.min(this.speed(), distance / frameSeconds) : this.speed();
        return { x: shift.x === 0 ? 0 : sign * speed, y: shift.y === 0 ? 0 : sign * speed };
      }
    }
    return null;
  }

  // Comprueba si el cuerpo, desplazado una fracción de píxel en esa dirección, chocaría con un obstáculo
  // o con el borde del mapa. Solo cuenta como bloqueada si ya está tocando el obstáculo: hasta entonces
  // el personaje avanza y la física lo detiene justo al lado. `shift` mueve antes el cuerpo (ayuda en las esquinas).
  private canMove(direction: Direction, shift = { x: 0, y: 0 }): boolean {
    const probe = 0.05;
    const dx = VELOCITY[direction].x * probe;
    const dy = VELOCITY[direction].y * probe;
    // En el eje perpendicular se encoge un poco, para no contar como bloqueo un obstáculo que solo roza el lateral.
    const margin = 0.1;
    const area = new Phaser.Geom.Rectangle(
      this.body.x + shift.x + dx + (dx === 0 ? margin : 0),
      this.body.y + shift.y + dy + (dy === 0 ? margin : 0),
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

function createWalkAnimations(scene: Phaser.Scene, texture: string): void {
  for (const [direction, column] of Object.entries(DIRECTION_COLUMN)) {
    const key = `${texture}-andar-${direction}`;
    if (scene.anims.exists(key)) {
      continue;
    }
    const frames = Array.from({ length: WALK_FRAMES }, (_, row) => row * SHEET_COLUMNS + column);
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(texture, { frames }),
      frameRate: WALK_FRAME_RATE,
      repeat: -1,
    });
  }
}
