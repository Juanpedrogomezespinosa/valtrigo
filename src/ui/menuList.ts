import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { onConfirmKeys } from './confirmKeys';
import { playEffect } from '../systems/audio';

export interface MenuListOption<T extends string> {
  label: T;
  enabled: boolean;
}

export interface MenuListConfig<T extends string> {
  x: number;
  y: number;
  spacing?: number;
  // Opción seleccionada al crear la lista. Si no se indica, la primera.
  selected?: T;
  onActivate: (label: T) => void;
  // Dentro de la partida (el menú de pausa), E también activa la opción.
  confirmWithE?: boolean;
}

// Lista vertical de opciones de un menú (HU-01).
// - Las flechas arriba y abajo recorren todas las opciones, también las desactivadas, y se detienen en los extremos.
// - Enter (y E, si se indica) o un clic activan la opción seleccionada. Las desactivadas se ven en gris y no hacen nada.
// - Efectos de sonido de navegación y confirmación (HU-32).
export class MenuList<T extends string> {
  // Mientras está inactiva (por ejemplo, con un cuadro de confirmación abierto) no responde al teclado.
  active = true;

  private items: { label: T; enabled: boolean; text: Phaser.GameObjects.Text }[];
  private selectedIndex: number;
  private cursor: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    options: MenuListOption<T>[],
    private config: MenuListConfig<T>,
  ) {
    const spacing = config.spacing ?? 50;

    this.items = options.map(({ label, enabled }, index) => {
      const text = scene.add
        .text(config.x, config.y + index * spacing, label, { fontFamily: FONT_FAMILY, fontSize: '28px' })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });

      // Con el ratón no suena el efecto de navegación: el clic ya reproduce el de confirmación.
      text.on('pointerdown', () => {
        if (!this.active) {
          return;
        }
        this.selectedIndex = index;
        this.refresh();
        this.activateSelected();
      });

      return { label, enabled, text };
    });

    const selected = config.selected ? this.items.findIndex((item) => item.label === config.selected) : 0;
    this.selectedIndex = Math.max(0, selected);

    this.cursor = scene.add
      .text(config.x - 16, 0, '▶', { fontFamily: FONT_FAMILY, fontSize: '28px', color: COLORS.selected })
      .setOrigin(1, 0.5);

    const keyboard = scene.input.keyboard!;
    keyboard.on('keydown-UP', () => this.active && this.select(this.selectedIndex - 1));
    keyboard.on('keydown-DOWN', () => this.active && this.select(this.selectedIndex + 1));
    onConfirmKeys(keyboard, config.confirmWithE ?? false, () => this.active && this.activateSelected());

    this.refresh();
  }

  getSelected(): T {
    return this.items[this.selectedIndex].label;
  }

  isEnabled(label: T): boolean {
    return this.items.find((item) => item.label === label)?.enabled ?? false;
  }

  private select(index: number): void {
    const newIndex = Phaser.Math.Clamp(index, 0, this.items.length - 1);
    if (newIndex === this.selectedIndex) {
      return;
    }

    this.selectedIndex = newIndex;
    playEffect(this.scene, 'menuNavigate');
    this.refresh();
  }

  private activateSelected(): void {
    const item = this.items[this.selectedIndex];
    if (!item.enabled) {
      return;
    }

    playEffect(this.scene, 'menuConfirm');
    this.config.onActivate(item.label);
  }

  private refresh(): void {
    this.items.forEach((item, index) => {
      const color = !item.enabled ? COLORS.disabled : index === this.selectedIndex ? COLORS.selected : COLORS.text;
      item.text.setColor(color);
    });

    this.cursor.setY(this.items[this.selectedIndex].text.y);
  }
}
