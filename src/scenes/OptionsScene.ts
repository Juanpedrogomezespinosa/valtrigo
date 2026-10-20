import Phaser from 'phaser';
import { addBackButton } from '../ui/backButton';
import { addTitle } from '../ui/title';
import type { MenuSceneData } from './MenuScene';

// Pantalla de opciones. Su contenido se añade en HU-28 a HU-34.
export class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create(): void {
    addTitle(this, 'Opciones');

    addBackButton(this, this.scale.width / 2, this.scale.height - 80, () => {
      const data: MenuSceneData = { selected: 'Opciones' };
      this.scene.start('MenuScene', data);
    });
  }
}
