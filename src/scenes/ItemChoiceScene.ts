import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';
import { countItem, ITEMS, type ItemId } from '../systems/inventory';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

export interface ItemChoiceSceneData extends OverlaySceneData {
  title: string;
  // Lo que hace Enter, para la ayuda de abajo ("sembrar", "presentar").
  action: string;
  // Objetos que se pueden elegir, en este orden.
  items: ItemId[];
  // Se llama con el objeto elegido, después de cerrar.
  onChoose: (item: ItemId) => void;
}

const LIST_TOP = 200;
const ROW_HEIGHT = 50;

// Lista para elegir un objeto del inventario: la semilla que se siembra (HU-42) o la cosecha que se presenta
// al concurso de la feria (HU-59). Se abre encima de la partida, como el inventario: el tiempo sigue y el
// personaje no se mueve.
// - ↑ ↓ eligen el objeto; Enter o E lo confirman; Escape cierra sin elegir nada.
export class ItemChoiceScene extends Phaser.Scene {
  private items: ItemId[] = [];
  private title = '';
  private action = '';
  private selected = 0;
  private onChoose!: (item: ItemId) => void;
  private onClose!: () => void;
  private cursor!: Phaser.GameObjects.Text;

  constructor() {
    super('ItemChoiceScene');
  }

  init(data: ItemChoiceSceneData): void {
    this.items = data.items;
    this.title = data.title;
    this.action = data.action;
    this.onChoose = data.onChoose;
    this.onClose = data.onClose;
    this.selected = 0;
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    addTitle(this, this.title, 110);

    const left = width / 2 - 200;
    this.items.forEach((item, index) => {
      const y = LIST_TOP + index * ROW_HEIGHT;
      this.add.image(left, y, `objeto-${item}`).setScale(2);
      this.add
        .text(left + 30, y, `${ITEMS[item].name} x${countItem(item)}`, { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.text })
        .setOrigin(0, 0.5);
    });
    this.cursor = this.add
      .text(left - 24, LIST_TOP, '▶', { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.selected })
      .setOrigin(1, 0.5);
    this.add
      .text(width / 2, height - 60, `Enter: ${this.action} · Escape: cancelar`, { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.selected })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-UP', () => this.move(-1));
    keyboard.on('keydown-DOWN', () => this.move(1));
    keyboard.on('keydown-ENTER', () => this.choose());
    keyboard.on('keydown-E', () => this.choose());
    keyboard.on('keydown-ESC', () => this.close());
  }

  // Estado de la lista, para los tests.
  getState(): { options: string[]; selected: number } {
    return { options: this.items.map((item) => ITEMS[item].name), selected: this.selected };
  }

  private move(delta: number): void {
    const index = Phaser.Math.Clamp(this.selected + delta, 0, this.items.length - 1);
    if (index !== this.selected) {
      this.selected = index;
      playEffect(this, 'menuNavigate');
      this.cursor.setY(LIST_TOP + index * ROW_HEIGHT);
    }
  }

  private choose(): void {
    playEffect(this, 'menuConfirm');
    const item = this.items[this.selected];
    this.close();
    this.onChoose(item);
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }
}
