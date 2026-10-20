import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import type { TilePosition } from '../systems/zones';

// Fotograma del personaje en la hoja de Tiny Dungeon.
const PLAYER_FRAME = 85;

// Personaje del jugador. El movimiento se implementa en HU-06.
export class Player extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, position: TilePosition) {
    super(
      scene,
      position.x * TILE_SIZE + TILE_SIZE / 2,
      position.y * TILE_SIZE + TILE_SIZE / 2,
      'characters',
      PLAYER_FRAME,
    );
    scene.add.existing(this);
  }

  getTilePosition(): TilePosition {
    return { x: Math.floor(this.x / TILE_SIZE), y: Math.floor(this.y / TILE_SIZE) };
  }
}
