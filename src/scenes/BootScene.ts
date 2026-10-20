import Phaser from 'phaser';

// Escena de arranque. De momento solo comprueba que Phaser se inicia.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Valtrigo', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
