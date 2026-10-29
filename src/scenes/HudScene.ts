import Phaser from 'phaser';
import { COLORS, ENERGY_COLORS, FONT_FAMILY, HUD_BORDER, MAX_ENERGY } from '../config';
import { getDay, getTimeText, isDaytime } from '../systems/time';
import { contestCountdown } from '../systems/fair';
import { getGameState, isGameInProgress } from '../systems/gameState';

const MARGIN = 16;
const PADDING = 10;
const GAP = 8;
// Los iconos miden 16×16 y se dibujan al doble.
const ICON_SIZE = 32;
const ROW_HEIGHT = ICON_SIZE;
const BAR_HEIGHT = 10;
const PANEL_RADIUS = 6;
const BACKGROUND = Phaser.Display.Color.HexStringToColor(COLORS.background).color;

// Interfaz fija durante la partida. Se dibuja por encima de la partida y del menú de pausa.
// HU-80: paneles con fondo oscuro y borde claro.
// - Arriba a la izquierda, el sol o la luna, el día ("Día N") y la hora (HH:MM) (HU-22).
// - Arriba a la derecha, la moneda y el dinero (HU-16) y, debajo, el rayo, la energía ("[actual]/100") y su
//   barra de colores (HU-14).
// - HU-60: durante el concurso de pesca, la cuenta atrás en un panel debajo del día y la hora.
export class HudScene extends Phaser.Scene {
  private panels!: Phaser.GameObjects.Graphics;
  private timeIcon!: Phaser.GameObjects.Image;
  private day!: Phaser.GameObjects.Text;
  private clock!: Phaser.GameObjects.Text;
  private contest!: Phaser.GameObjects.Text;
  private money!: Phaser.GameObjects.Text;
  private energy!: Phaser.GameObjects.Text;
  private energyBar!: Phaser.GameObjects.Rectangle;
  private rightPanel!: Phaser.Geom.Rectangle;

  constructor() {
    super('HudScene');
  }

  create(): void {
    const style = { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.text };
    const rowCenter = (row: number) => MARGIN + PADDING + row * (ROW_HEIGHT + 4) + ROW_HEIGHT / 2;
    this.panels = this.add.graphics();

    // Panel del día y la hora.
    this.timeIcon = this.icon('icono-sol', MARGIN + PADDING, rowCenter(0)).setName('icono-hora');
    this.day = this.add.text(this.timeIcon.x + ICON_SIZE + GAP, rowCenter(0), 'Día 1', style).setOrigin(0, 0.5).setName('dia');
    this.clock = this.add.text(0, rowCenter(0), '00:00', style).setOrigin(0, 0.5).setName('hora');
    const leftBottom = MARGIN + PADDING * 2 + ROW_HEIGHT;
    this.contest = this.add
      .text(MARGIN + PADDING, leftBottom + 6 + PADDING, '', { ...style, color: COLORS.selected })
      .setName('concurso')
      .setVisible(false);

    // Panel del dinero y la energía. Su ancho es fijo, el que ocupa la energía máxima.
    const textWidth = this.add.text(0, 0, `${MAX_ENERGY}/${MAX_ENERGY}`, style).setVisible(false);
    const innerWidth = ICON_SIZE + GAP + Math.ceil(textWidth.width);
    textWidth.destroy();
    const left = this.scale.width - MARGIN - PADDING * 2 - innerWidth;
    const contentLeft = left + PADDING;
    this.add.image(contentLeft, rowCenter(0), 'icono-moneda').setOrigin(0, 0.5).setScale(2).setName('icono-moneda');
    this.money = this.add.text(contentLeft + ICON_SIZE + GAP, rowCenter(0), '0', style).setOrigin(0, 0.5).setName('dinero');
    this.icon('icono-energia', contentLeft, rowCenter(1)).setName('icono-energia');
    this.energy = this.add.text(contentLeft + ICON_SIZE + GAP, rowCenter(1), '', style).setOrigin(0, 0.5).setName('energia');
    const barY = rowCenter(1) + ROW_HEIGHT / 2 + 6;
    this.add.rectangle(contentLeft, barY, innerWidth, BAR_HEIGHT, ENERGY_COLORS.empty).setOrigin(0, 0).setName('barra-energia-fondo');
    this.energyBar = this.add.rectangle(contentLeft, barY, innerWidth, BAR_HEIGHT, ENERGY_COLORS.high).setOrigin(0, 0).setName('barra-energia');
    this.rightPanel = new Phaser.Geom.Rectangle(left, MARGIN, innerWidth + PADDING * 2, barY + BAR_HEIGHT + PADDING - MARGIN);
  }

  // Se actualiza en cada fotograma, así que cualquier cambio de dinero se ve al instante.
  update(): void {
    if (!isGameInProgress()) return;
    const state = getGameState();
    this.timeIcon.setTexture(isDaytime() ? 'icono-sol' : 'icono-luna');
    this.day.setText(`Día ${getDay()}`);
    this.clock.setText(getTimeText()).setX(this.day.x + this.day.width + GAP);
    const countdown = contestCountdown();
    this.contest.setVisible(countdown !== null).setText(countdown ? `Concurso de pesca: ${countdown}` : '');

    this.money.setText(`${state.money}`);
    this.energy.setText(`${state.energy}/${MAX_ENERGY}`);
    this.energyBar.setScale(Math.max(0, Math.min(1, state.energy / MAX_ENERGY)), 1).setFillStyle(energyColor(state.energy));

    this.drawPanels();
  }

  private icon(key: string, x: number, y: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, key).setOrigin(0, 0.5).setScale(2);
  }

  // Los paneles se redibujan en cada fotograma porque el de la izquierda cambia de ancho con el día y la hora.
  private drawPanels(): void {
    this.panels.clear();
    const leftWidth = this.clock.x + this.clock.width + PADDING - MARGIN;
    this.panel(new Phaser.Geom.Rectangle(MARGIN, MARGIN, leftWidth, ROW_HEIGHT + PADDING * 2));
    this.panel(this.rightPanel);
    if (this.contest.visible) {
      this.panel(
        new Phaser.Geom.Rectangle(MARGIN, this.contest.y - PADDING, this.contest.width + PADDING * 2, this.contest.height + PADDING * 2),
      );
    }
  }

  private panel(area: Phaser.Geom.Rectangle): void {
    this.panels.fillStyle(BACKGROUND, 1).fillRoundedRect(area.x, area.y, area.width, area.height, PANEL_RADIUS);
    this.panels.lineStyle(2, HUD_BORDER, 1).strokeRoundedRect(area.x, area.y, area.width, area.height, PANEL_RADIUS);
  }
}

// HU-80: verde por encima de 50, amarilla de 26 a 50 y roja de 25 o menos.
export function energyColor(energy: number): number {
  if (energy > 50) return ENERGY_COLORS.high;
  if (energy > 25) return ENERGY_COLORS.medium;
  return ENERGY_COLORS.low;
}
