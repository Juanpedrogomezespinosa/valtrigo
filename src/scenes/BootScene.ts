import Phaser from 'phaser';
import { SFX } from '../systems/audio';
import { mapKey, ZONES, type ZoneId } from '../systems/zones';

// Escena de arranque: carga los recursos y abre el menú principal.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // Solo se carga la música del menú. La de cada zona se cargará con su zona (HU-31),
    // para no descargar todas las pistas al arrancar.
    this.load.audio('music-menu', 'assets/audio/menu.mp3');

    for (const { key, path } of Object.values(SFX)) {
      this.load.audio(key, path);
    }

    this.load.image('tiles-town', 'assets/tilesets/kenney-tiny-town.png');
    this.load.image('tiles-dungeon', 'assets/sprites/kenney-tiny-dungeon.png');
    this.load.image('tiles-agua', 'assets/tilesets/agua.png');
    this.load.spritesheet('jugador', 'assets/sprites/personajes/jugador.png', { frameWidth: 16, frameHeight: 16 });
    for (const [zone, { map }] of Object.entries(ZONES)) {
      this.load.tilemapTiledJSON(mapKey(zone as ZoneId), map);
    }
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
