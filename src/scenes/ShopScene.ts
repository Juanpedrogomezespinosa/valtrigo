import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, MESSAGE_MS } from '../config';
import { buy, buyPrice, buyUpgrade, sellOne, sellPrice, SHOP_ITEMS, type BuyResult, type SellResult, type UpgradeResult } from '../systems/economy';
import { getSlots, ITEMS, type ItemId } from '../systems/inventory';
import { playEffect } from '../systems/audio';
import { hasUpgrade, UPGRADE_TEXTS, UPGRADES } from '../systems/upgrades';
import { onConfirmKeys } from '../ui/confirmKeys';
import { showMessage } from '../ui/message';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

type Tab = 'Comprar' | 'Vender' | 'Mejoras';
const TABS: Tab[] = ['Comprar', 'Vender', 'Mejoras'];
// Distancia entre los títulos de las pestañas.
const TAB_GAP = 180;

const LIST_LEFT = 180;
const LIST_TOP = 170;
const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 7;

const MESSAGES: Partial<Record<BuyResult | SellResult | UpgradeResult, string>> = {
  'shop-closed': 'La tienda está cerrada',
  'no-money': 'Dinero insuficiente',
  'inventory-full': 'Inventario lleno',
  'quest-item': 'Este objeto no se puede vender',
  'already-bought': UPGRADE_TEXTS.alreadyBought,
};

// Una fila de la lista: un objeto (Comprar y Vender) o una mejora (Mejoras, HU-85).
interface Row {
  id: string;
  name: string;
  icon: string;
  quantity?: number;
  price: number;
  // Solo en las mejoras: si ya se ha comprado.
  bought?: boolean;
}

// Tienda (HU-17 y HU-18). Se abre al hablar con la vendedora, encima de la partida.
// Como el inventario, no detiene el tiempo y el personaje no se mueve mientras está abierta.
// - ← → cambian entre "Comprar", "Vender" y "Mejoras" (HU-85); ↑ ↓ eligen un objeto; E o Enter compran o venden
//   una unidad, o compran la mejora.
// - Escape cierra la tienda.
export class ShopScene extends Phaser.Scene {
  private onClose!: () => void;
  private tab: Tab = 'Comprar';
  private selected = 0;
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private rowTexts: { icon: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text; price: Phaser.GameObjects.Text }[] = [];
  private cursor!: Phaser.GameObjects.Text;
  private emptyText!: Phaser.GameObjects.Text;

  constructor() {
    super('ShopScene');
  }

  init(data: OverlaySceneData): void {
    this.onClose = data.onClose;
    this.tab = 'Comprar';
    this.selected = 0;
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    addTitle(this, 'Tienda', 60);

    this.tabTexts = TABS.map((tab, index) =>
      this.add.text(width / 2 + (index - 1) * TAB_GAP, 115, tab, { fontFamily: FONT_FAMILY, fontSize: '26px' }).setOrigin(0.5),
    );

    this.rowTexts = Array.from({ length: VISIBLE_ROWS }, (_, index) => {
      const y = LIST_TOP + index * ROW_HEIGHT;
      return {
        icon: this.add.image(LIST_LEFT, y, '__DEFAULT').setScale(2),
        name: this.add.text(LIST_LEFT + 30, y, '', { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.text }).setOrigin(0, 0.5),
        price: this.add
          .text(width - LIST_LEFT, y, '', { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.text })
          .setOrigin(1, 0.5),
      };
    });
    this.cursor = this.add
      .text(LIST_LEFT - 24, 0, '▶', { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.selected })
      .setOrigin(1, 0.5);
    this.emptyText = this.add
      .text(width / 2, LIST_TOP, 'No tienes objetos', { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.text })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-LEFT', () => this.switchTab(-1));
    keyboard.on('keydown-RIGHT', () => this.switchTab(1));
    keyboard.on('keydown-UP', () => this.move(-1));
    keyboard.on('keydown-DOWN', () => this.move(1));
    onConfirmKeys(keyboard, true, () => this.confirm());
    keyboard.on('keydown-ESC', () => this.close());

    this.refresh();
  }

  // Estado de la tienda, para los tests.
  getState(): {
    tab: Tab;
    selected: number;
    rows: { item: string; name: string; quantity?: number; price: number; icon: string; bought?: boolean }[];
  } {
    return {
      tab: this.tab,
      selected: this.selected,
      rows: this.rows().map(({ id, ...row }) => ({ item: id, ...row })),
    };
  }

  // Comprar: el catálogo con su precio. Vender: el inventario con lo que se recibe por unidad.
  // Mejoras: las mejoras con su precio y si ya se han comprado.
  private rows(): Row[] {
    const itemRow = (item: ItemId) => ({ id: item, name: ITEMS[item].name, icon: `objeto-${item}` });
    if (this.tab === 'Comprar') {
      return SHOP_ITEMS.map((item) => ({ ...itemRow(item), price: buyPrice(item) }));
    }
    if (this.tab === 'Mejoras') {
      return UPGRADES.map((upgrade) => ({
        id: upgrade.id,
        name: upgrade.name,
        icon: upgrade.icon,
        price: upgrade.price,
        bought: hasUpgrade(upgrade.id),
      }));
    }
    return getSlots().map((slot) => ({
      ...itemRow(slot.item as ItemId),
      quantity: slot.quantity,
      price: sellPrice(slot.item as ItemId),
    }));
  }

  // Cambia a la pestaña de la izquierda (-1) o de la derecha (1). En los extremos no hace nada.
  private switchTab(delta: number): void {
    const index = TABS.indexOf(this.tab) + delta;
    if (index >= 0 && index < TABS.length) {
      this.tab = TABS[index];
      this.selected = 0;
      playEffect(this, 'menuNavigate');
      this.refresh();
    }
  }

  private move(delta: number): void {
    const count = this.rows().length;
    const index = Phaser.Math.Clamp(this.selected + delta, 0, Math.max(0, count - 1));
    if (index !== this.selected) {
      this.selected = index;
      playEffect(this, 'menuNavigate');
      this.refresh();
    }
  }

  private confirm(): void {
    const row = this.rows()[this.selected];
    if (!row) {
      return;
    }
    const result =
      this.tab === 'Comprar' ? buy(row.id as ItemId) : this.tab === 'Mejoras' ? buyUpgrade(row.id) : sellOne(this.selected);
    const message = MESSAGES[result];
    if (message) {
      showMessage(this, message, MESSAGE_MS);
    } else {
      // HU-32: efecto de compra o de venta.
      playEffect(this, this.tab === 'Vender' ? 'sell' : 'buy');
    }
    // Si se vendió la última unidad de la última casilla, la selección sube.
    this.selected = Math.min(this.selected, Math.max(0, this.rows().length - 1));
    this.refresh();
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }

  private refresh(): void {
    this.tabTexts.forEach((text, index) => {
      const active = TABS[index] === this.tab;
      text.setColor(active ? COLORS.selected : COLORS.text);
      text.setText(active ? `[ ${TABS[index]} ]` : TABS[index]);
    });

    const rows = this.rows();
    const first = Math.max(0, Math.min(this.selected - VISIBLE_ROWS + 1, rows.length - VISIBLE_ROWS));
    this.rowTexts.forEach((view, index) => {
      const row = rows[first + index];
      view.icon.setVisible(!!row);
      view.name.setText(row ? `${row.name}${row.quantity ? ` x${row.quantity}` : ''}` : '');
      view.price.setText(row ? (row.bought ? UPGRADE_TEXTS.bought : `${row.price} monedas`) : '');
      if (row) {
        view.icon.setTexture(row.icon);
      }
    });

    this.emptyText.setVisible(rows.length === 0);
    this.cursor.setVisible(rows.length > 0);
    this.cursor.setY(LIST_TOP + (this.selected - first) * ROW_HEIGHT);
  }
}
