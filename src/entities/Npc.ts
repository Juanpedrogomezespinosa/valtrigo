import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import type { TilePosition } from '../systems/zones';

// Mismo cuerpo de colisión que el personaje (14×14).
const BODY_SIZE = 14;

// Personaje no jugador (HU-10). Está quieto, mirando hacia abajo, y es un obstáculo (HU-07).
// `character` es su identificador en src/data/dialogues.json y la clave de su hoja de sprites.
export class Npc extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody;

  constructor(
    scene: Phaser.Scene,
    readonly character: string,
    position: TilePosition,
  ) {
    super(scene, position.x * TILE_SIZE + TILE_SIZE / 2, position.y * TILE_SIZE + TILE_SIZE / 2, character, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.body.setSize(BODY_SIZE, BODY_SIZE);
  }

  // HU-40: fuera de su horario el NPC no está: no se ve y deja de ser un obstáculo.
  setPresent(present: boolean): void {
    this.setVisible(present);
    this.body.enable = present;
  }

  isPresent(): boolean {
    return this.visible;
  }

  // Hueco en píxeles entre el cuerpo del NPC y otro cuerpo (0 si se tocan).
  gapTo(other: Phaser.Physics.Arcade.Body): number {
    const dx = Math.max(this.body.left - other.right, other.left - this.body.right, 0);
    const dy = Math.max(this.body.top - other.bottom, other.top - this.body.bottom, 0);
    return Math.hypot(dx, dy);
  }
}
