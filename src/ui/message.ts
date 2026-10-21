import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';

const DEPTH = 200;
// Distancia al borde de la pantalla y entre mensajes que se ven a la vez (HU-65).
const EDGE = 18;
const STACK_GAP = 8;
// Ancho máximo del texto: un mensaje largo pasa a dos líneas antes de tapar el día, la hora,
// el dinero o la energía de la interfaz.
const MAX_TEXT_WIDTH = 500;

// Mensajes visibles en cada escena y posición, para apilarlos.
const visible = new Map<string, Phaser.GameObjects.Text[]>();

// Mensaje breve, centrado abajo (por defecto) o arriba, como "Partida guardada".
// Durante la partida se usa arriba, para que no lo tape el cuadro de diálogo.
// Desaparece solo al cabo de `durationMs` milisegundos reales. Si ya hay otros mensajes en esa posición,
// se coloca debajo (arriba) o encima (abajo) del último.
export function showMessage(
  scene: Phaser.Scene,
  message: string,
  durationMs: number,
  position: 'top' | 'bottom' = 'bottom',
): void {
  const key = `${scene.scene.key}:${position}`;
  const others = (visible.get(key) ?? []).filter((other) => other.active);
  const last = others.at(-1);
  const text = scene.add
    .text(scene.scale.width / 2, 0, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.text,
      backgroundColor: COLORS.background,
      padding: { x: 16, y: 8 },
      align: 'center',
      wordWrap: { width: MAX_TEXT_WIDTH },
    })
    .setDepth(DEPTH);
  if (position === 'top') {
    text.setOrigin(0.5, 0).setY(last ? last.getBounds().bottom + STACK_GAP : EDGE);
  } else {
    text.setOrigin(0.5, 1).setY(last ? last.getBounds().top - STACK_GAP : scene.scale.height - EDGE - 20);
  }
  visible.set(key, [...others, text]);

  // Se usa tiempo real y no el reloj de Phaser, que puede quedarse atrás si el equipo va lento:
  // el mensaje debe durar los segundos indicados en la historia.
  window.setTimeout(() => {
    if (text.active) {
      text.destroy();
    }
  }, durationMs);
}
