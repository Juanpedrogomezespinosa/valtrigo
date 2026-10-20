import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect, playMusic } from '../systems/audio';
import { createNewGameState, isGameInProgress, startGame } from '../systems/gameState';
import { hasSavedGame, writeSave } from '../systems/save';
import { showConfirmDialog } from '../ui/confirmDialog';
import { addTitle } from '../ui/title';

export const MENU_OPTIONS = ['Nueva partida', 'Continuar', 'Guardar partida', 'Opciones', 'Créditos', 'Salir'] as const;

export type MenuOption = (typeof MENU_OPTIONS)[number];

export interface MenuSceneData {
  // Opción que aparece seleccionada al abrir el menú (por ejemplo, al volver de Opciones).
  selected?: MenuOption;
}

interface MenuItem {
  label: MenuOption;
  enabled: boolean;
  text: Phaser.GameObjects.Text;
}

const FIRST_OPTION_Y = 200;
const OPTION_SPACING = 50;

// Menú principal (HU-01).
export class MenuScene extends Phaser.Scene {
  private items: MenuItem[] = [];
  private selectedIndex = 0;
  private dialogOpen = false;
  private cursor!: Phaser.GameObjects.Text;

  constructor() {
    super('MenuScene');
  }

  init(data: MenuSceneData): void {
    this.selectedIndex = data.selected ? MENU_OPTIONS.indexOf(data.selected) : 0;
  }

  create(): void {
    playMusic(this, 'music-menu');

    addTitle(this, 'Valtrigo');

    const enabled: Record<MenuOption, boolean> = {
      'Nueva partida': true,
      Continuar: hasSavedGame(),
      'Guardar partida': isGameInProgress(),
      Opciones: true,
      Créditos: true,
      Salir: true,
    };

    const x = this.scale.width / 2 - 100;
    this.items = MENU_OPTIONS.map((label, index) => {
      const text = this.add
        .text(x, FIRST_OPTION_Y + index * OPTION_SPACING, label, {
          fontFamily: FONT_FAMILY,
          fontSize: '28px',
        })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });

      // Con el ratón no suena el efecto de navegación: el clic ya reproduce el de confirmación.
      text.on('pointerdown', () => {
        this.selectedIndex = index;
        this.refresh();
        this.activateSelected();
      });

      return { label, enabled: enabled[label], text };
    });

    this.cursor = this.add
      .text(x - 16, 0, '▶', { fontFamily: FONT_FAMILY, fontSize: '28px', color: COLORS.selected })
      .setOrigin(1, 0.5);

    const keyboard = this.input.keyboard!;
    // Mientras hay un cuadro de confirmación abierto, el menú no responde al teclado.
    keyboard.on('keydown-UP', () => !this.dialogOpen && this.select(this.selectedIndex - 1));
    keyboard.on('keydown-DOWN', () => !this.dialogOpen && this.select(this.selectedIndex + 1));
    keyboard.on('keydown-ENTER', () => !this.dialogOpen && this.activateSelected());

    this.refresh();
  }

  getSelectedOption(): MenuOption {
    return this.items[this.selectedIndex].label;
  }

  isOptionEnabled(label: MenuOption): boolean {
    return this.items.find((item) => item.label === label)?.enabled ?? false;
  }

  // Las flechas recorren todas las opciones, también las desactivadas, y se detienen en los extremos.
  private select(index: number): void {
    const newIndex = Phaser.Math.Clamp(index, 0, this.items.length - 1);
    if (newIndex === this.selectedIndex) {
      return;
    }

    this.selectedIndex = newIndex;
    playEffect(this, 'menuNavigate');
    this.refresh();
  }

  private activateSelected(): void {
    const item = this.items[this.selectedIndex];
    if (!item.enabled) {
      return;
    }

    playEffect(this, 'menuConfirm');

    switch (item.label) {
      case 'Nueva partida':
        this.newGame();
        break;
      case 'Opciones':
        this.scene.start('OptionsScene');
        break;
      case 'Créditos':
        this.scene.start('CreditsScene');
        break;
      // "Continuar" (HU-03), "Guardar partida" (HU-04) y "Salir" (HU-05) se implementan en sus historias.
    }
  }

  // Si ya hay una partida guardada, se pide confirmación y, al aceptar,
  // la partida nueva sustituye a la guardada.
  private newGame(): void {
    if (!hasSavedGame()) {
      this.startNewGame();
      return;
    }

    this.dialogOpen = true;
    showConfirmDialog(this, '¿Sobrescribir la partida guardada?', (yes) => {
      this.dialogOpen = false;
      if (yes) {
        this.startNewGame({ overwriteSave: true });
      }
    });
  }

  private startNewGame({ overwriteSave = false } = {}): void {
    const state = createNewGameState(this);
    if (overwriteSave) {
      writeSave(state);
    }
    startGame(state);
    this.scene.start('GameScene');
  }

  private refresh(): void {
    this.items.forEach((item, index) => {
      const color = !item.enabled ? COLORS.disabled : index === this.selectedIndex ? COLORS.selected : COLORS.text;
      item.text.setColor(color);
    });

    this.cursor.setY(this.items[this.selectedIndex].text.y);
  }
}
