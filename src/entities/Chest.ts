import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import type { TilePosition } from '../systems/zones';

const CLOSED_FRAME = 0;
const OPEN_FRAME = 1;

// Cofre (HU-12). Es un obstáculo. Se muestra abierto (y vacío) cuando ya se ha abierto.
export class Chest extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    position: TilePosition,
    open: boolean,
  ) {
    super(scene, position.x * TILE_SIZE + TILE_SIZE / 2, position.y * TILE_SIZE + TILE_SIZE / 2, 'cofre', CLOSED_FRAME);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOpen(open);
  }

  isOpen(): boolean {
    return Number(this.frame.name) === OPEN_FRAME;
  }

  setOpen(open: boolean): void {
    this.setFrame(open ? OPEN_FRAME : CLOSED_FRAME);
  }
}
