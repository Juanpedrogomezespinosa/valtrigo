import Phaser from 'phaser';
import credits from '../data/credits.json';
import { COLORS, FONT_FAMILY } from '../config';
import { addBackButton } from '../ui/backButton';
import { addTitle } from '../ui/title';
import type { MenuSceneData } from './MenuScene';

const LEFT = 90;

// Pantalla de créditos (HU-35): el autor, Phaser y los recursos externos con su licencia
// (datos en src/data/credits.json). "Volver" o Escape vuelven al menú principal con "Créditos" seleccionada.
export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('CreditsScene');
  }

  create(): void {
    addTitle(this, 'Créditos', 60);

    const heading = { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.selected };
    const body = { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.text };

    let y = 105;
    this.add.text(LEFT, y, 'Autor', heading);
    this.add.text(LEFT + 260, y, credits.author, body).setName('autor');

    y += 40;
    this.add.text(LEFT, y, 'Motor', heading);
    const { engine } = credits;
    this.add.text(LEFT + 260, y, `${engine.name}, de ${engine.by} (${engine.license})`, body).setName('motor');

    y += 48;
    this.add.text(LEFT, y, 'Recursos', heading);
    credits.resources.forEach((resource, index) => {
      y += 34;
      this.add.text(LEFT, y, resource.name, body);
      this.add
        .text(LEFT + 20, y + 24, `${resource.by} · ${resource.license}`, { ...body, fontSize: '18px' })
        .setName(`recurso-${index}`);
      y += 20;
    });

    addBackButton(this, this.scale.width / 2, this.scale.height - 40, () => {
      const data: MenuSceneData = { selected: 'Créditos' };
      this.scene.start('MenuScene', data);
    });
  }
}
