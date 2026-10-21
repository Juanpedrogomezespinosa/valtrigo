import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';
import type { SeedId } from '../systems/farm';
import { countItem, ITEMS } from '../systems/inventory';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

export interface SeedSceneData extends OverlaySceneData {
  // Semillas que tiene el jugador, en el orden de src/data/crops.json.
  seeds: SeedId[];
  // Se llama con la semilla elegida, antes de cerrar.
  onChoose: (seed: SeedId) => void;
}

const LIST_TOP = 200;
const ROW_HEIGHT = 50;

// Lista de semillas para sembrar una parcela (HU-42). Se abre encima de la partida, como el inventario:
// el tiempo sigue y el personaje no se mueve.
// - ↑ ↓ eligen la semilla; Enter o E la siembran; Escape cierra sin sembrar.
export class SeedScene extends Phaser.Scene {
  private seeds: SeedId[] = [];
  private selected = 0;
  private onChoose!: (seed: SeedId) => void;
  private onClose!: () => void;
  private cursor!: Phaser.GameObjects.Text;

  constructor() {
    super('SeedScene');
  }

  init(data: SeedSceneData): void {
    this.seeds = data.seeds;
    this.onChoose = data.onChoose;
    this.onClose = data.onClose;
    this.selected = 0;
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    addTitle(this, '¿Qué quieres sembrar?', 110);

    const left = width / 2 - 200;
    this.seeds.forEach((seed, index) => {
      const y = LIST_TOP + index * ROW_HEIGHT;
      this.add.image(left, y, `objeto-${seed}`).setScale(2);
      this.add
        .text(left + 30, y, `${ITEMS[seed].name} x${countItem(seed)}`, { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.text })
        .setOrigin(0, 0.5);
    });
    this.cursor = this.add
      .text(left - 24, LIST_TOP, '▶', { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.selected })
      .setOrigin(1, 0.5);
    this.add
      .text(width / 2, height - 60, 'Enter: sembrar · Escape: cancelar', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.selected })
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
    return { options: this.seeds.map((seed) => ITEMS[seed].name), selected: this.selected };
  }

  private move(delta: number): void {
    const index = Phaser.Math.Clamp(this.selected + delta, 0, this.seeds.length - 1);
    if (index !== this.selected) {
      this.selected = index;
      playEffect(this, 'menuNavigate');
      this.cursor.setY(LIST_TOP + index * ROW_HEIGHT);
    }
  }

  private choose(): void {
    playEffect(this, 'menuConfirm');
    const seed = this.seeds[this.selected];
    this.close();
    this.onChoose(seed);
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }
}
