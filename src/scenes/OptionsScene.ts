import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, VOLUME_BARS } from '../config';
import { changeSoundSettings, playEffect } from '../systems/audio';
import { getSettings } from '../systems/settings';
import { addTitle } from '../ui/title';
import type { MenuSceneData } from './MenuScene';
import type { PauseSceneData } from './PauseScene';

export interface OptionsSceneData {
  // Escena a la que se vuelve con "Volver": el menú principal (por defecto) o el menú de pausa.
  returnTo?: 'MenuScene' | 'PauseScene';
}

type Row = 'Música' | 'Efectos' | 'Silenciar' | 'Volver';
const ROWS: Row[] = ['Música', 'Efectos', 'Silenciar', 'Volver'];

// HU-33: tabla de controles, de solo lectura.
const CONTROLS: [string, string][] = [
  ['Mover', 'Flechas o WASD'],
  ['Correr', 'Mayús'],
  ['Interactuar', 'E'],
  ['Inventario', 'I'],
  ['Objetivos', 'O'],
  ['Pausa', 'Escape'],
  ['Usar objeto', 'E o Enter'],
];

const LEFT = 90;
const ROW_Y = [170, 230, 310, 480];
const BAR_LEFT = 230;
const BAR_WIDTH = 18;
const BAR_GAP = 4;
const BAR_HEIGHT = 26;
const TABLE_LEFT = 560;

// Pantalla de opciones.
// - HU-28 y HU-29: volumen de música y de efectos, de 0 a 10 barras. ↑ ↓ eligen la fila, ← → cambian el
//   volumen y el cambio se aplica al instante. Al soltar la tecla (o el clic) en "Efectos" suena un
//   efecto de prueba con el nuevo volumen.
// - HU-30: "Silenciar", separado de los volúmenes. Enter o un clic lo activan y lo desactivan.
// - HU-33: tabla de controles, de solo lectura.
// - "Volver" (Enter o clic) y Escape vuelven a la pantalla anterior.
export class OptionsScene extends Phaser.Scene {
  private returnTo: 'MenuScene' | 'PauseScene' = 'MenuScene';
  private selected = 0;
  private labels: Phaser.GameObjects.Text[] = [];
  private bars: Record<'Música' | 'Efectos', Phaser.GameObjects.Rectangle[]> = { Música: [], Efectos: [] };
  private barValues: Record<'Música' | 'Efectos', Phaser.GameObjects.Text> = {} as never;
  private muteValue!: Phaser.GameObjects.Text;
  private cursor!: Phaser.GameObjects.Text;
  // Barras de efectos al empezar a cambiarlas, para saber si al soltar hay que sonar el efecto de prueba.
  private effectBarsAtPress: number | null = null;

  constructor() {
    super('OptionsScene');
  }

  init(data: OptionsSceneData): void {
    this.returnTo = data.returnTo ?? 'MenuScene';
    this.selected = 0;
  }

  create(): void {
    // Fondo opaco: desde la pausa, la partida detenida sigue dibujándose debajo.
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, Phaser.Display.Color.HexStringToColor(COLORS.background).color)
      .setOrigin(0);
    addTitle(this, 'Opciones', 70);

    this.labels = ROWS.map((row, index) =>
      this.add
        .text(row === 'Volver' ? this.scale.width / 2 : LEFT, ROW_Y[index], row, { fontFamily: FONT_FAMILY, fontSize: '26px' })
        .setOrigin(row === 'Volver' ? 0.5 : 0, 0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.select(index);
          if (row === 'Silenciar') this.toggleMute();
          if (row === 'Volver') this.back();
        }),
    );

    for (const row of ['Música', 'Efectos'] as const) {
      const y = ROW_Y[ROWS.indexOf(row)];
      this.bars[row] = Array.from({ length: VOLUME_BARS }, (_, index) =>
        this.add
          .rectangle(BAR_LEFT + index * (BAR_WIDTH + BAR_GAP), y, BAR_WIDTH, BAR_HEIGHT)
          .setOrigin(0, 0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            this.select(ROWS.indexOf(row));
            this.startEffectChange(row);
            this.setBars(row, index + 1);
          })
          .on('pointerup', () => this.endEffectChange()),
      );
      this.barValues[row] = this.add
        .text(BAR_LEFT + VOLUME_BARS * (BAR_WIDTH + BAR_GAP) + 10, y, '', { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.text })
        .setOrigin(0, 0.5)
        .setName(row === 'Música' ? 'barras-musica' : 'barras-efectos');
    }
    this.muteValue = this.add
      .text(BAR_LEFT, ROW_Y[ROWS.indexOf('Silenciar')], '', { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.text })
      .setOrigin(0, 0.5)
      .setName('silenciar');

    this.addControlsTable();

    this.cursor = this.add
      .text(0, 0, '▶', { fontFamily: FONT_FAMILY, fontSize: '26px', color: COLORS.selected })
      .setOrigin(1, 0.5);

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-UP', () => this.select(this.selected - 1, true));
    keyboard.on('keydown-DOWN', () => this.select(this.selected + 1, true));
    keyboard.on('keydown-LEFT', () => this.adjust(-1));
    keyboard.on('keydown-RIGHT', () => this.adjust(1));
    keyboard.on('keyup-LEFT', () => this.endEffectChange());
    keyboard.on('keyup-RIGHT', () => this.endEffectChange());
    keyboard.on('keydown-ENTER', () => this.activate());
    keyboard.on('keydown-ESC', () => this.back());

    this.refresh();
  }

  // Estado de la pantalla, para los tests.
  getState(): { selected: Row; musicBars: number; effectBars: number; muted: boolean; controls: [string, string][] } {
    const settings = getSettings();
    return { selected: ROWS[this.selected], ...settings, controls: CONTROLS };
  }

  private addControlsTable(): void {
    this.add.text(TABLE_LEFT, 140, 'Controles', { fontFamily: FONT_FAMILY, fontSize: '26px', color: COLORS.selected });
    CONTROLS.forEach(([action, key], index) => {
      const y = 190 + index * 40;
      this.add.text(TABLE_LEFT, y, action, { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.text }).setName(`accion-${index}`);
      // Las teclas no se pueden cambiar: pulsar sobre ellas no hace nada.
      this.add
        .text(TABLE_LEFT + 160, y, key, { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.text })
        .setName(`tecla-${index}`);
    });
  }

  private select(index: number, withSound = false): void {
    const clamped = Phaser.Math.Clamp(index, 0, ROWS.length - 1);
    if (clamped === this.selected) {
      return;
    }
    this.selected = clamped;
    if (withSound) {
      playEffect(this, 'menuNavigate');
    }
    this.refresh();
  }

  private adjust(delta: number): void {
    const row = ROWS[this.selected];
    if (row !== 'Música' && row !== 'Efectos') {
      return;
    }
    this.startEffectChange(row);
    const settings = getSettings();
    this.setBars(row, (row === 'Música' ? settings.musicBars : settings.effectBars) + delta);
  }

  private setBars(row: 'Música' | 'Efectos', bars: number): void {
    changeSoundSettings(this.game, row === 'Música' ? { musicBars: bars } : { effectBars: bars });
    this.refresh();
  }

  private startEffectChange(row: 'Música' | 'Efectos'): void {
    if (row === 'Efectos' && this.effectBarsAtPress === null) {
      this.effectBarsAtPress = getSettings().effectBars;
    }
  }

  // HU-29: al soltar el control de efectos, suena el efecto de prueba con el nuevo volumen.
  private endEffectChange(): void {
    if (this.effectBarsAtPress === null) {
      return;
    }
    const changed = this.effectBarsAtPress !== getSettings().effectBars;
    this.effectBarsAtPress = null;
    if (changed) {
      playEffect(this, 'menuConfirm');
    }
  }

  private activate(): void {
    const row = ROWS[this.selected];
    if (row === 'Silenciar') this.toggleMute();
    if (row === 'Volver') this.back();
  }

  private toggleMute(): void {
    changeSoundSettings(this.game, { muted: !getSettings().muted });
    playEffect(this, 'menuConfirm');
    this.refresh();
  }

  private back(): void {
    playEffect(this, 'menuConfirm');
    const data: MenuSceneData & PauseSceneData = { selected: 'Opciones' };
    this.scene.start(this.returnTo, data);
  }

  private refresh(): void {
    const settings = getSettings();
    const filled = Phaser.Display.Color.HexStringToColor(COLORS.selected).color;
    const outline = Phaser.Display.Color.HexStringToColor(COLORS.disabled).color;
    for (const row of ['Música', 'Efectos'] as const) {
      const value = row === 'Música' ? settings.musicBars : settings.effectBars;
      this.bars[row].forEach((bar, index) => {
        bar.setFillStyle(filled, index < value ? 1 : 0).setStrokeStyle(2, index < value ? filled : outline);
      });
      this.barValues[row].setText(String(value));
    }
    this.muteValue.setText(settings.muted ? 'Activado' : 'Desactivado');

    this.labels.forEach((label, index) => label.setColor(index === this.selected ? COLORS.selected : COLORS.text));
    const label = this.labels[this.selected];
    this.cursor.setPosition(label.getBounds().left - 12, label.y);
  }
}
