import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';
import { ITEMS, type ItemId } from '../systems/inventory';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

export interface MechanismSceneData extends OverlaySceneData {
  // Las piezas que se pueden colocar, en el orden en que se listan.
  pieces: ItemId[];
  // Se llama con las piezas colocadas, de abajo arriba, al llenar el tercer hueco.
  onDone: (order: ItemId[]) => void;
}

const HOLES = 3;
const HOLE_SIZE = 64;
const HOLES_X = 280;
const HOLE_BOTTOM_Y = 400;
const HOLE_GAP = 90;
const LIST_X = 480;
const LIST_TOP = 200;
const ROW_HEIGHT = 50;

// Mecanismo del reloj de la torre (HU-56). Tres huecos que se llenan de abajo arriba: ↑ ↓ eligen la pieza,
// Enter o E la colocan en el siguiente hueco. Al llenar el tercero se comprueba el orden. Escape cierra sin
// colocar nada: las piezas siguen en el inventario.
export class MechanismScene extends Phaser.Scene {
  private pieces: ItemId[] = [];
  private placed: ItemId[] = [];
  private selected = 0;
  private onDone!: (order: ItemId[]) => void;
  private onClose!: () => void;
  private holeIcons: Phaser.GameObjects.Image[] = [];
  private holeFrames: Phaser.GameObjects.Rectangle[] = [];
  private rows: { icon: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text }[] = [];
  private cursor!: Phaser.GameObjects.Text;

  constructor() {
    super('MechanismScene');
  }

  init(data: MechanismSceneData): void {
    this.pieces = data.pieces;
    this.onDone = data.onDone;
    this.onClose = data.onClose;
    this.placed = [];
    this.selected = 0;
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    addTitle(this, 'Mecanismo del reloj', 60);

    const frameColor = Phaser.Display.Color.HexStringToColor(COLORS.text).color;
    this.holeFrames = [];
    this.holeIcons = [];
    for (let hole = 0; hole < HOLES; hole++) {
      const y = HOLE_BOTTOM_Y - hole * HOLE_GAP;
      this.holeFrames.push(this.add.rectangle(HOLES_X, y, HOLE_SIZE, HOLE_SIZE).setStrokeStyle(2, frameColor));
      this.holeIcons.push(this.add.image(HOLES_X, y, '__DEFAULT').setScale(3).setVisible(false));
      this.add
        .text(HOLES_X - HOLE_SIZE, y, `Hueco ${hole + 1}`, { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.text })
        .setOrigin(1, 0.5);
    }

    this.rows = this.pieces.map((_, index) => {
      const y = LIST_TOP + index * ROW_HEIGHT;
      return {
        icon: this.add.image(LIST_X, y, '__DEFAULT').setScale(2),
        name: this.add.text(LIST_X + 30, y, '', { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.text }).setOrigin(0, 0.5),
      };
    });
    this.cursor = this.add
      .text(LIST_X - 24, LIST_TOP, '▶', { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.selected })
      .setOrigin(1, 0.5);
    this.add
      .text(width / 2, height - 50, 'Enter: colocar · Escape: salir', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.selected })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-UP', () => this.move(-1));
    keyboard.on('keydown-DOWN', () => this.move(1));
    keyboard.on('keydown-ENTER', () => this.place());
    keyboard.on('keydown-E', () => this.place());
    keyboard.on('keydown-ESC', () => this.close());

    this.refresh();
  }

  // Estado del mecanismo, para los tests: lo colocado en cada hueco (de abajo arriba) y las piezas que quedan.
  getState(): { holes: (string | null)[]; options: string[]; selected: number } {
    return {
      holes: Array.from({ length: HOLES }, (_, hole) => (this.placed[hole] ? ITEMS[this.placed[hole]].name : null)),
      options: this.remaining().map((item) => ITEMS[item].name),
      selected: this.selected,
    };
  }

  private remaining(): ItemId[] {
    return this.pieces.filter((piece) => !this.placed.includes(piece));
  }

  private move(delta: number): void {
    const index = Phaser.Math.Clamp(this.selected + delta, 0, this.remaining().length - 1);
    if (index !== this.selected) {
      this.selected = index;
      playEffect(this, 'menuNavigate');
      this.refresh();
    }
  }

  private place(): void {
    const piece = this.remaining()[this.selected];
    if (!piece) return;
    playEffect(this, 'menuConfirm');
    this.placed.push(piece);
    this.selected = 0;
    if (this.placed.length < HOLES) {
      this.refresh();
      return;
    }
    const order = [...this.placed];
    this.close();
    this.onDone(order);
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }

  private refresh(): void {
    this.holeIcons.forEach((icon, hole) => {
      const piece = this.placed[hole];
      icon.setVisible(!!piece);
      if (piece) icon.setTexture(`objeto-${piece}`);
    });
    // El siguiente hueco que se va a llenar se resalta.
    this.holeFrames.forEach((frame, hole) => {
      const color = hole === this.placed.length ? COLORS.selected : COLORS.text;
      frame.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    });
    const remaining = this.remaining();
    this.rows.forEach((row, index) => {
      const piece = remaining[index];
      row.icon.setVisible(!!piece);
      row.name.setText(piece ? ITEMS[piece].name : '');
      if (piece) row.icon.setTexture(`objeto-${piece}`);
    });
    this.cursor.setY(LIST_TOP + this.selected * ROW_HEIGHT);
  }
}
