import Phaser from 'phaser';
import { endGame, getGameState } from '../systems/gameState';
import { isSaved, writeSave } from '../systems/save';
import { showConfirmDialog } from '../ui/confirmDialog';
import { MenuList } from '../ui/menuList';
import { showMessage } from '../ui/message';
import { addTitle } from '../ui/title';

export const PAUSE_OPTIONS = ['Continuar', 'Opciones', 'Guardar partida', 'Salir al menú principal'] as const;

export type PauseOption = (typeof PAUSE_OPTIONS)[number];

export interface PauseSceneData {
  // Opción que aparece seleccionada al abrir la pausa (por ejemplo, al volver de Opciones).
  selected?: PauseOption;
}

const SAVED_MESSAGE_MS = 2000;

// Menú de pausa (HU-26 y HU-27). Se abre encima de GameScene, que queda detenida.
export class PauseScene extends Phaser.Scene {
  private menu!: MenuList<PauseOption>;
  private selected?: PauseOption;

  constructor() {
    super('PauseScene');
  }

  init(data: PauseSceneData): void {
    this.selected = data.selected;
  }

  create(): void {
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.75).setOrigin(0);
    addTitle(this, 'Pausa');

    this.menu = new MenuList(
      this,
      PAUSE_OPTIONS.map((label) => ({ label, enabled: true })),
      {
        x: this.scale.width / 2 - 150,
        y: 200,
        selected: this.selected,
        onActivate: (label) => this.activate(label),
        confirmWithE: true,
      },
    );

    // Volver a pulsar Escape reanuda la partida (HU-27).
    this.input.keyboard!.on('keydown-ESC', () => this.menu.active && this.resumeGame());
  }

  getSelectedOption(): PauseOption {
    return this.menu.getSelected();
  }

  private activate(label: PauseOption): void {
    switch (label) {
      case 'Continuar':
        this.resumeGame();
        break;
      case 'Opciones':
        this.scene.start('OptionsScene', { returnTo: 'PauseScene' });
        break;
      case 'Guardar partida':
        this.saveGame();
        break;
      case 'Salir al menú principal':
        this.exitToMainMenu();
        break;
    }
  }

  private resumeGame(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
    if (this.scene.isPaused('DialogScene')) {
      this.scene.resume('DialogScene');
    }
  }

  // HU-04: guarda la partida, sobrescribiendo la anterior, y muestra "Partida guardada" durante 2 segundos.
  private saveGame(): void {
    const state = getGameState();
    if (writeSave(state.zone === 'lago' ? { ...state, position: { x: 15, y: 1 } } : state)) {
      this.sound.mute = false;
      showMessage(this, 'Partida guardada', SAVED_MESSAGE_MS);
    }
  }

  // Si hay cambios sin guardar, se pide confirmación. Al salir, la partida en curso se pierde.
  private exitToMainMenu(): void {
    if (isSaved(getGameState())) {
      this.quitGame();
      return;
    }

    this.menu.active = false;
    showConfirmDialog(this, '¿Salir sin guardar? Se perderá el progreso no guardado', (yes) => {
      this.menu.active = true;
      if (yes) {
        this.quitGame();
      }
    }, true);
  }

  private quitGame(): void {
    endGame();
    this.scene.stop('DialogScene');
    this.scene.stop('InventoryScene');
    this.scene.stop('ObjectivesScene');
    this.scene.stop('ShopScene');
    this.scene.stop('HudScene');
    this.scene.stop('NightScene');
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }
}
