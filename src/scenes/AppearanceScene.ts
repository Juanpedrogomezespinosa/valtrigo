import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { GENDERS, HAIRS, SKINS, defaultAppearance, playerTexture, type Appearance, type Gender } from '../systems/appearance';
import { playEffect } from '../systems/audio';
import { getGameState } from '../systems/gameState';
import { writeSave } from '../systems/save';
import { addTitle } from '../ui/title';
import type { NewGameData } from './NameScene';

type Row = 'Género' | 'Piel' | 'Pelo';
const ROWS: Row[] = ['Género', 'Piel', 'Pelo'];
const OPTIONS: Record<Row, { id: string; name: string }[]> = { Género: GENDERS, Piel: SKINS, Pelo: HAIRS };

const LEFT = 140;
// Valor de cada opción, centrado entre sus flechas.
const VALUE_X = 430;
const ARROW_OFFSET = 110;
const ROW_Y = [200, 270, 340];
const PREVIEW_X = 700;
const PREVIEW_Y = 270;
const PREVIEW_SCALE = 10;
// La vista previa gira: abajo, izquierda, arriba y derecha (columnas de la hoja), un segundo hacia cada lado.
const TURN_COLUMNS = [0, 2, 1, 3];
const TURN_MS = 1000;

// Aspecto del personaje (HU-68), después de elegir el nombre (HU-67). ↑ ↓ eligen la opción y ← → su valor
// (sin dar la vuelta); la vista previa cambia al momento. Enter confirma y empieza la partida.
export class AppearanceScene extends Phaser.Scene {
  private appearance: Appearance = defaultAppearance();
  private selected = 0;
  private newGame: NewGameData = { overwriteSave: false };
  private labels: Phaser.GameObjects.Text[] = [];
  private values: Phaser.GameObjects.Text[] = [];
  private arrows: [Phaser.GameObjects.Text, Phaser.GameObjects.Text][] = [];
  private cursor!: Phaser.GameObjects.Text;
  private preview!: Phaser.GameObjects.Sprite;
  private turn = 0;
  private openedAt = 0;

  constructor() {
    super('AppearanceScene');
  }

  init(data: NewGameData): void {
    this.newGame = data;
    this.appearance = defaultAppearance();
    this.selected = 0;
    this.turn = 0;
  }

  create(): void {
    this.openedAt = performance.now();
    addTitle(this, '¿Cómo eres?', 80);
    this.labels = ROWS.map((row, index) =>
      this.add.text(LEFT, ROW_Y[index], row, { fontFamily: FONT_FAMILY, fontSize: '28px' }).setOrigin(0, 0.5),
    );
    this.values = ROWS.map((row, index) =>
      this.add
        .text(VALUE_X, ROW_Y[index], '', { fontFamily: FONT_FAMILY, fontSize: '28px', color: COLORS.text })
        .setOrigin(0.5)
        .setName(`valor-${row}`),
    );
    this.arrows = ROW_Y.map((y) => [
      this.add.text(VALUE_X - ARROW_OFFSET, y, '<', { fontFamily: FONT_FAMILY, fontSize: '28px', color: COLORS.text }).setOrigin(0.5),
      this.add.text(VALUE_X + ARROW_OFFSET, y, '>', { fontFamily: FONT_FAMILY, fontSize: '28px', color: COLORS.text }).setOrigin(0.5),
    ]);
    this.cursor = this.add.text(0, 0, '▶', { fontFamily: FONT_FAMILY, fontSize: '28px', color: COLORS.selected }).setOrigin(1, 0.5);
    this.preview = this.add.sprite(PREVIEW_X, PREVIEW_Y, playerTexture(this, this.appearance), 0).setScale(PREVIEW_SCALE);
    this.add
      .text(this.scale.width / 2, this.scale.height - 50, '↑ ↓: elegir · ← →: cambiar · Enter: confirmar', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: COLORS.selected,
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: TURN_MS,
      loop: true,
      callback: () => {
        this.turn = (this.turn + 1) % TURN_COLUMNS.length;
        this.refresh();
      },
    });

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-UP', (event: KeyboardEvent) => this.isNew(event) && this.select(this.selected - 1));
    keyboard.on('keydown-DOWN', (event: KeyboardEvent) => this.isNew(event) && this.select(this.selected + 1));
    keyboard.on('keydown-LEFT', (event: KeyboardEvent) => this.isNew(event) && this.change(-1));
    keyboard.on('keydown-RIGHT', (event: KeyboardEvent) => this.isNew(event) && this.change(1));
    keyboard.on('keydown-ENTER', (event: KeyboardEvent) => this.isNew(event) && this.confirm());
    this.refresh();
  }

  // Estado de la pantalla, para los tests: opción elegida, aspecto y hoja de la vista previa.
  getState(): { selected: Row; appearance: Appearance; previewTexture: string } {
    return { selected: ROWS[this.selected], appearance: { ...this.appearance }, previewTexture: this.preview.texture.key };
  }

  // El Enter que confirmó el nombre llega también a esta escena, que se abre en el mismo momento: las teclas
  // pulsadas antes de abrirla no cuentan.
  private isNew(event: KeyboardEvent): boolean {
    return event.timeStamp >= this.openedAt;
  }

  private select(index: number): void {
    const clamped = Phaser.Math.Clamp(index, 0, ROWS.length - 1);
    if (clamped === this.selected) return;
    this.selected = clamped;
    playEffect(this, 'menuNavigate');
    this.refresh();
  }

  private change(delta: number): void {
    const row = ROWS[this.selected];
    const options = OPTIONS[row];
    const current = options.findIndex(({ id }) => id === this.valueOf(row));
    const next = Phaser.Math.Clamp(current + delta, 0, options.length - 1);
    if (next === current) return;
    const id = options[next].id;
    if (row === 'Género') this.appearance.gender = id as Gender;
    if (row === 'Piel') this.appearance.skin = id;
    if (row === 'Pelo') this.appearance.hair = id;
    playEffect(this, 'menuNavigate');
    this.refresh();
  }

  private confirm(): void {
    playEffect(this, 'menuConfirm');
    const state = getGameState();
    state.appearance = { ...this.appearance };
    // HU-02: la partida nueva sustituye a la guardada, ya con el nombre y el aspecto elegidos.
    if (this.newGame.overwriteSave) {
      writeSave(state);
    }
    this.scene.start('GameScene');
  }

  private valueOf(row: Row): string {
    return row === 'Género' ? this.appearance.gender : row === 'Piel' ? this.appearance.skin : this.appearance.hair;
  }

  private refresh(): void {
    ROWS.forEach((row, index) => {
      const options = OPTIONS[row];
      const current = options.findIndex(({ id }) => id === this.valueOf(row));
      // Las flechas solo se ven si hay más valores hacia ese lado.
      this.values[index].setText(options[current].name);
      this.arrows[index][0].setVisible(current > 0);
      this.arrows[index][1].setVisible(current < options.length - 1);
      this.labels[index].setColor(index === this.selected ? COLORS.selected : COLORS.text);
    });
    const label = this.labels[this.selected];
    this.cursor.setPosition(label.x - 12, label.y);
    this.preview.setTexture(playerTexture(this, this.appearance), TURN_COLUMNS[this.turn]);
  }
}
