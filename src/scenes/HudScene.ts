import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { getGameState, isGameInProgress } from '../systems/gameState';

const MARGIN = 16;

// Interfaz fija durante la partida. Se dibuja por encima de la partida y del menú de pausa.
// HU-16: el dinero, en la esquina superior derecha, con el formato "[cantidad] monedas".
export class HudScene extends Phaser.Scene {
  private money!: Phaser.GameObjects.Text;

  constructor() {
    super('HudScene');
  }

  create(): void {
    this.money = this.add
      .text(this.scale.width - MARGIN, MARGIN, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: COLORS.text,
        backgroundColor: COLORS.background,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setName('dinero');
  }

  // Se actualiza en cada fotograma, así que cualquier cambio de dinero se ve al instante.
  update(): void {
    if (isGameInProgress()) {
      this.money.setText(`${getGameState().money} monedas`);
    }
  }
}
