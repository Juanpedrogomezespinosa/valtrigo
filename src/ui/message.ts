import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';

const DEPTH = 200;

// Mensaje breve, centrado abajo (por defecto) o arriba, como "Partida guardada".
// Durante la partida se usa arriba, para que no lo tape el cuadro de diálogo.
// Desaparece solo al cabo de `durationMs` milisegundos reales.
export function showMessage(
  scene: Phaser.Scene,
  message: string,
  durationMs: number,
  position: 'top' | 'bottom' = 'bottom',
): void {
  const y = position === 'top' ? 40 : scene.scale.height - 60;
  const text = scene.add
    .text(scene.scale.width / 2, y, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.text,
      backgroundColor: COLORS.background,
      padding: { x: 16, y: 8 },
    })
    .setOrigin(0.5)
    .setDepth(DEPTH);

  // Se usa tiempo real y no el reloj de Phaser, que puede quedarse atrás si el equipo va lento:
  // el mensaje debe durar los segundos indicados en la historia.
  window.setTimeout(() => {
    if (text.active) {
      text.destroy();
    }
  }, durationMs);
}
