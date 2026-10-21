import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import type { DayStats } from '../systems/gameState';
import { addTitle } from '../ui/title';

export interface DaySummarySceneData {
  // El día que termina.
  day: number;
  stats: DayStats;
  // Se llama al cerrar el resumen con E: entonces empieza el día siguiente.
  onClose: () => void;
}

const PANEL_WIDTH = 520;
const PANEL_HEIGHT = 300;

// Resumen del día al dormir en la cama (HU-39). Aparece después del fundido a negro, con lo conseguido
// en el día: monedas ganadas (ventas y recompensas), cosechas recogidas y peces pescados. E lo cierra.
export class DaySummaryScene extends Phaser.Scene {
  private summary!: DaySummarySceneData;

  constructor() {
    super('DaySummaryScene');
  }

  init(data: DaySummarySceneData): void {
    this.summary = data;
  }

  create(): void {
    const { width, height } = this.scale;
    const { day, stats } = this.summary;
    const top = (height - PANEL_HEIGHT) / 2;
    this.add
      .rectangle(width / 2, height / 2, PANEL_WIDTH, PANEL_HEIGHT, Phaser.Display.Color.HexStringToColor(COLORS.background).color)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.text).color);
    addTitle(this, `Día ${day} terminado`, top + 40);

    const rows: [name: string, text: string][] = [
      ['monedas', `Monedas ganadas: ${stats.moneyEarned}`],
      ['cosechas', `Cosechas: ${stats.harvests}`],
      ['peces', `Peces: ${stats.fish}`],
    ];
    rows.forEach(([name, text], index) => {
      this.add
        .text(width / 2, top + 110 + index * 40, text, { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.text })
        .setOrigin(0.5)
        .setName(name);
    });
    this.add
      .text(width / 2, top + PANEL_HEIGHT - 30, 'Pulsa E para continuar', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.selected })
      .setOrigin(0.5);

    this.input.keyboard!.once('keydown-E', () => {
      this.scene.stop();
      this.summary.onClose();
    });
  }
}
