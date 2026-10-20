import Phaser from 'phaser';
import { SFX } from '../systems/audio';

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
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
