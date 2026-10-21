import Phaser from 'phaser';
import { playMusic, stopMusic } from '../systems/audio';
import { createNewGameState, isGameInProgress, startGame } from '../systems/gameState';
import { hasSavedGame, readSave } from '../systems/save';
import { showConfirmDialog } from '../ui/confirmDialog';
import { MenuList } from '../ui/menuList';
import { addTitle } from '../ui/title';
import type { NewGameData } from './NameScene';

export const MENU_OPTIONS = ['Nueva partida', 'Continuar', 'Guardar partida', 'Opciones', 'Créditos', 'Salir'] as const;

export type MenuOption = (typeof MENU_OPTIONS)[number];

export interface MenuSceneData {
  // Opción que aparece seleccionada al abrir el menú (por ejemplo, al volver de Opciones).
  selected?: MenuOption;
}

// Menú principal (HU-01).
export class MenuScene extends Phaser.Scene {
  private menu!: MenuList<MenuOption>;
  private selected?: MenuOption;

  constructor() {
    super('MenuScene');
  }

  init(data: MenuSceneData): void {
    this.selected = data.selected;
  }

  create(): void {
    playMusic(this, 'music-menu');

    addTitle(this, 'Valtrigo');

    // "Guardar partida" depende de que haya una partida en curso. Como al volver al menú principal
    // se pierde la partida (HU-26), en la práctica siempre aparece desactivada (ver CLAUDE.md).
    const enabled: Record<MenuOption, boolean> = {
      'Nueva partida': true,
      Continuar: hasSavedGame(),
      'Guardar partida': isGameInProgress(),
      Opciones: true,
      Créditos: true,
      Salir: true,
    };

    this.menu = new MenuList(
      this,
      MENU_OPTIONS.map((label) => ({ label, enabled: enabled[label] })),
      {
        x: this.scale.width / 2 - 100,
        y: 200,
        selected: this.selected,
        onActivate: (label) => this.activate(label),
      },
    );
  }

  getSelectedOption(): MenuOption {
    return this.menu.getSelected();
  }

  isOptionEnabled(label: MenuOption): boolean {
    return this.menu.isEnabled(label);
  }

  private activate(label: MenuOption): void {
    switch (label) {
      case 'Nueva partida':
        this.newGame();
        break;
      case 'Continuar':
        this.continueGame();
        break;
      case 'Opciones':
        this.scene.start('OptionsScene');
        break;
      case 'Créditos':
        this.scene.start('CreditsScene');
        break;
      case 'Salir':
        this.exit();
        break;
    }
  }

  // Si ya hay una partida guardada, se pide confirmación y, al aceptar,
  // la partida nueva sustituye a la guardada.
  private newGame(): void {
    if (!hasSavedGame()) {
      this.startNewGame();
      return;
    }

    this.menu.active = false;
    showConfirmDialog(this, '¿Sobrescribir la partida guardada?', (yes) => {
      this.menu.active = true;
      if (yes) {
        this.startNewGame({ overwriteSave: true });
      }
    });
  }

  // La partida nueva empieza con la introducción (HU-62) y la elección del nombre (HU-67), que después abre
  // GameScene. Si sustituye a una partida guardada, se guarda al confirmar el nombre, ya completa.
  private startNewGame({ overwriteSave = false } = {}): void {
    startGame(createNewGameState(this));
    const data: NewGameData = { overwriteSave };
    this.scene.start('IntroScene', data);
  }

  // HU-05: pide confirmación y cierra el juego. "No" deja el menú con "Salir" seleccionada.
  private exit(): void {
    this.menu.active = false;
    showConfirmDialog(this, '¿Salir del juego?', (yes) => {
      this.menu.active = true;
      if (yes) {
        this.closeGame();
      }
    });
  }

  // Una página web no puede cerrar su propia pestaña, así que el juego se apaga:
  // se para la música, se destruye Phaser (con su lienzo) y queda una pantalla de despedida.
  // La partida guardada no se toca.
  private closeGame(): void {
    stopMusic();
    this.game.destroy(true);
    document.getElementById('game')?.remove();
    document.getElementById('farewell')?.classList.add('visible');
  }

  // Carga la partida guardada directamente, sin selector (HU-03).
  private continueGame(): void {
    const state = readSave();
    if (!state) {
      return;
    }
    startGame(state);
    this.scene.start('GameScene');
  }
}
