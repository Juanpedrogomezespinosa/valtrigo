import Phaser from 'phaser';
import { WORLD_ZOOM } from '../config';
import { Player } from '../entities/Player';
import { getGameState } from '../systems/gameState';
import { mapKey } from '../systems/zones';

// Escena de juego: dibuja la zona actual y al personaje.
export class GameScene extends Phaser.Scene {
  player!: Player;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const state = getGameState();

    const map = this.make.tilemap({ key: mapKey(state.zone) });
    const tiles = map.addTilesetImage('kenney-tiny-town', 'tiles-town')!;
    map.createLayer('suelo', tiles);
    map.createLayer('obstaculos', tiles);

    this.player = new Player(this, state.position);

    // La cámara se centra en el personaje sin salirse del mapa.
    // El seguimiento mientras se mueve es de HU-09.
    const camera = this.cameras.main;
    camera.setZoom(WORLD_ZOOM);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.centerOn(this.player.x, this.player.y);
  }
}
