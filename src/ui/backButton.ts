import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';

// Botón "Volver" de las pantallas secundarias.
// Se activa al hacer clic sobre él, con Enter o con Escape.
export function addBackButton(scene: Phaser.Scene, x: number, y: number, onBack: () => void): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, '▶ Volver', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: COLORS.selected,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  const back = () => {
    playEffect(scene, 'menuConfirm');
    onBack();
  };

  button.on('pointerdown', back);
  scene.input.keyboard?.on('keydown-ENTER', back);
  scene.input.keyboard?.on('keydown-ESC', back);

  return button;
}
