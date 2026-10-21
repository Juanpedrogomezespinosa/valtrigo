import Phaser from 'phaser';
import intro from '../data/intro.json';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';

const TEXT_WIDTH = 720;

// Introducción al empezar una partida nueva (HU-62). Textos en src/data/intro.json.
// Cada pantalla se pasa con E; al pasar la última, o con Escape, empieza la partida.
// La partida ya está creada, pero el reloj no avanza hasta que se abre GameScene.
export class IntroScene extends Phaser.Scene {
  private page = 0;
  private text!: Phaser.GameObjects.Text;
  private counter!: Phaser.GameObjects.Text;

  constructor() {
    super('IntroScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.page = 0;
    this.text = this.add
      .text(width / 2, height / 2 - 20, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        color: COLORS.text,
        align: 'center',
        wordWrap: { width: TEXT_WIDTH },
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setName('texto');
    this.counter = this.add
      .text(width / 2, height - 90, '', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.text })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height - 50, 'E: continuar · Escape: saltar', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.selected })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-E', () => this.next());
    keyboard.on('keydown-ESC', () => this.startGame());

    this.showPage();
  }

  // Pantalla que se está mostrando, para los tests.
  getPage(): { index: number; total: number; text: string } {
    return { index: this.page, total: intro.pages.length, text: intro.pages[this.page] };
  }

  private showPage(): void {
    this.text.setText(intro.pages[this.page]);
    this.counter.setText(`${this.page + 1} / ${intro.pages.length}`);
  }

  private next(): void {
    if (this.page < intro.pages.length - 1) {
      this.page++;
      playEffect(this, 'menuNavigate');
      this.showPage();
      return;
    }
    this.startGame();
  }

  private startGame(): void {
    playEffect(this, 'menuConfirm');
    this.scene.start('GameScene');
  }
}
