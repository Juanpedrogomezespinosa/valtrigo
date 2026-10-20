import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';

// Título centrado en la parte superior de una pantalla.
export function addTitle(scene: Phaser.Scene, text: string, y = 80): Phaser.GameObjects.Text {
  return scene.add
    .text(scene.scale.width / 2, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: COLORS.text,
    })
    .setOrigin(0.5);
}
