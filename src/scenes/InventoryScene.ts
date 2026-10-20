import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, INVENTORY_SLOTS, MESSAGE_MS } from '../config';
import { getSlots, ITEMS, useSlot, type ItemId } from '../systems/inventory';
import { showMessage } from '../ui/message';
import { addTitle } from '../ui/title';

const COLUMNS = 5;
const SLOT_WIDTH = 170;
const SLOT_HEIGHT = 86;
const GAP = 8;
const GRID_TOP = 130;
const ICON_SCALE = 2;

interface SlotView {
  frame: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  name: Phaser.GameObjects.Text;
  quantity: Phaser.GameObjects.Text;
}

export interface InventorySceneData {
  // Se llama al cerrar el inventario.
  onClose: () => void;
}

// Inventario (HU-13 y HU-14). Se abre encima de la partida. El tiempo sigue corriendo,
// pero el personaje no se mueve mientras está abierto.
// - 20 casillas en una cuadrícula de 5×4. Cada objeto muestra su icono, su nombre y su cantidad.
// - Las flechas mueven la selección y Enter usa el objeto seleccionado.
// - I o Escape lo cierran.
export class InventoryScene extends Phaser.Scene {
  private views: SlotView[] = [];
  private selected = 0;
  private onClose!: () => void;

  constructor() {
    super('InventoryScene');
  }

  init(data: InventorySceneData): void {
    this.onClose = data.onClose;
  }

  create(): void {
    this.selected = 0;
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.75).setOrigin(0);
    addTitle(this, 'Inventario', 70);

    const gridWidth = COLUMNS * SLOT_WIDTH + (COLUMNS - 1) * GAP;
    const left = (this.scale.width - gridWidth) / 2;
    const background = Phaser.Display.Color.HexStringToColor(COLORS.background).color;

    this.views = Array.from({ length: INVENTORY_SLOTS }, (_, index) => {
      const x = left + (index % COLUMNS) * (SLOT_WIDTH + GAP);
      const y = GRID_TOP + Math.floor(index / COLUMNS) * (SLOT_HEIGHT + GAP);
      const frame = this.add.rectangle(x, y, SLOT_WIDTH, SLOT_HEIGHT, background).setOrigin(0);
      const icon = this.add.image(x + 26, y + SLOT_HEIGHT / 2, '__DEFAULT').setScale(ICON_SCALE);
      const name = this.add.text(x + 52, y + 12, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: COLORS.text,
        wordWrap: { width: SLOT_WIDTH - 60 },
      });
      const quantity = this.add
        .text(x + SLOT_WIDTH - 10, y + SLOT_HEIGHT - 8, '', { fontFamily: FONT_FAMILY, fontSize: '18px', color: COLORS.text })
        .setOrigin(1, 1);
      return { frame, icon, name, quantity };
    });

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-LEFT', () => this.move(-1, 0));
    keyboard.on('keydown-RIGHT', () => this.move(1, 0));
    keyboard.on('keydown-UP', () => this.move(0, -1));
    keyboard.on('keydown-DOWN', () => this.move(0, 1));
    keyboard.on('keydown-ENTER', () => this.useSelected());
    keyboard.on('keydown-I', () => this.close());
    keyboard.on('keydown-ESC', () => this.close());

    this.refresh();
  }

  // Contenido de las 20 casillas y casilla seleccionada, para los tests.
  getState(): { selected: number; slots: ({ item: string; name: string; quantity: number; icon: string } | null)[] } {
    return {
      selected: this.selected,
      slots: this.views.map((view, index) => {
        const slot = getSlots()[index];
        return slot ? { item: slot.item, name: view.name.text, quantity: slot.quantity, icon: view.icon.texture.key } : null;
      }),
    };
  }

  // La selección se mueve por la cuadrícula y se detiene en los bordes.
  private move(dx: number, dy: number): void {
    const column = (this.selected % COLUMNS) + dx;
    const row = Math.floor(this.selected / COLUMNS) + dy;
    const rows = INVENTORY_SLOTS / COLUMNS;
    if (column < 0 || column >= COLUMNS || row < 0 || row >= rows) {
      return;
    }
    this.selected = row * COLUMNS + column;
    this.refresh();
  }

  private useSelected(): void {
    const result = useSlot(this.selected);
    if (result === 'not-usable') {
      showMessage(this, 'No se puede usar', MESSAGE_MS);
    }
    this.refresh();
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }

  private refresh(): void {
    const slots = getSlots();
    this.views.forEach((view, index) => {
      const slot = slots[index];
      const selected = index === this.selected;
      view.frame.setStrokeStyle(selected ? 3 : 1, Phaser.Display.Color.HexStringToColor(selected ? COLORS.selected : COLORS.disabled).color);
      view.icon.setVisible(!!slot);
      view.name.setText(slot ? ITEMS[slot.item as ItemId].name : '');
      view.quantity.setText(slot ? `x${slot.quantity}` : '');
      if (slot) {
        view.icon.setTexture(`objeto-${slot.item}`);
      }
    });
  }
}
