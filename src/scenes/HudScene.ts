import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, MAX_ENERGY } from '../config';
import { getDay, getTimeText } from '../systems/time';
import { contestCountdown } from '../systems/fair';
import { getGameState, isGameInProgress } from '../systems/gameState';

const MARGIN = 16;

// Interfaz fija durante la partida. Se dibuja por encima de la partida y del menú de pausa.
// - HU-16: el dinero, en la esquina superior derecha, con el formato "[cantidad] monedas".
// - HU-14: la energía, debajo del dinero, con el formato "Energía: [actual]/100".
// - HU-22: el día ("Día N") y la hora (HH:MM), en la esquina superior izquierda.
// - HU-60: durante el concurso de pesca, la cuenta atrás debajo del día y la hora.
export class HudScene extends Phaser.Scene {
  private money!: Phaser.GameObjects.Text;
  private energy!: Phaser.GameObjects.Text;
  private day!: Phaser.GameObjects.Text;
  private clock!: Phaser.GameObjects.Text;
  private contest!: Phaser.GameObjects.Text;

  constructor() {
    super('HudScene');
  }

  create(): void {
    const style = {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.text,
      backgroundColor: COLORS.background,
      padding: { x: 10, y: 6 },
    };
    this.day = this.add.text(MARGIN, MARGIN, 'Día 1', style).setName('dia');
    this.clock = this.add.text(this.day.x + this.day.width + 6, MARGIN, '00:00', style).setName('hora');
    this.contest = this.add
      .text(MARGIN, this.day.y + this.day.height + 6, '', { ...style, color: COLORS.selected })
      .setName('concurso')
      .setVisible(false);

    this.money = this.add
      .text(this.scale.width - MARGIN, MARGIN, '0 monedas', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: COLORS.text,
        backgroundColor: COLORS.background,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setName('dinero');
    this.energy = this.add
      .text(this.scale.width - MARGIN, this.money.y + this.money.height + 6, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: COLORS.text,
        backgroundColor: COLORS.background,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setName('energia');
  }

  // Se actualiza en cada fotograma, así que cualquier cambio de dinero se ve al instante.
  update(): void {
    if (isGameInProgress()) {
      const state = getGameState();
      this.money.setText(`${state.money} monedas`);
      this.energy.setText(`Energía: ${state.energy}/${MAX_ENERGY}`);
      this.day.setText(`Día ${getDay()}`);
      this.clock.setText(getTimeText()).setX(this.day.x + this.day.width + 6);
      const countdown = contestCountdown();
      this.contest.setVisible(countdown !== null).setText(countdown ? `Concurso de pesca: ${countdown}` : '');
    }
  }
}
