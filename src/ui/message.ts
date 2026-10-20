import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';

const DEPTH = 200;

// Mensaje breve en la parte inferior de la pantalla, como "Partida guardada".
// Desaparece solo al cabo de `durationMs`.
export function showMessage(scene: Phaser.Scene, message: string, durationMs: number): void {
  const text = scene.add
    .text(scene.scale.width / 2, scene.scale.height - 60, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.text,
      backgroundColor: COLORS.background,
      padding: { x: 16, y: 8 },
    })
    .setOrigin(0.5)
    .setDepth(DEPTH);

  scene.time.delayedCall(durationMs, () => text.destroy());
}
