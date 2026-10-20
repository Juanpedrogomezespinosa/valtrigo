import Phaser from 'phaser';
import { SFX } from '../systems/audio';
import { ITEMS } from '../systems/inventory';
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
    for (const character of ['jugador', 'vendedora', 'alcalde', 'relojera', 'granjero']) {
      this.load.spritesheet(character, `assets/sprites/personajes/${character}.png`, { frameWidth: 16, frameHeight: 16 });
    }
    this.load.spritesheet('cofre', 'assets/sprites/cofre.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('cama', 'assets/sprites/cama.png');
    for (const item of Object.keys(ITEMS)) {
      this.load.image(`objeto-${item}`, `assets/sprites/objetos/${item}.png`);
    }
    for (const npc of ['vendedora', 'alcalde', 'relojera', 'granjero']) {
      this.load.image(`retrato-${npc}`, `assets/sprites/retratos/${npc}.png`);
    }
    for (const [zone, { map }] of Object.entries(ZONES)) {
      this.load.tilemapTiledJSON(mapKey(zone as ZoneId), map);
    }
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
