import Phaser from 'phaser';
import { addBackButton } from '../ui/backButton';
import { addTitle } from '../ui/title';
import type { MenuSceneData } from './MenuScene';

// Pantalla de créditos. Su contenido se añade en HU-35.
export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('CreditsScene');
  }

  create(): void {
    addTitle(this, 'Créditos');

    addBackButton(this, this.scale.width / 2, this.scale.height - 80, () => {
      const data: MenuSceneData = { selected: 'Créditos' };
      this.scene.start('MenuScene', data);
    });
  }
}
