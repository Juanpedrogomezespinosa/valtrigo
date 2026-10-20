import Phaser from 'phaser';
import { COLORS } from '../config';
import { addBackButton } from '../ui/backButton';
import { addTitle } from '../ui/title';
import type { MenuSceneData } from './MenuScene';
import type { PauseSceneData } from './PauseScene';

export interface OptionsSceneData {
  // Escena a la que se vuelve con "Volver": el menú principal (por defecto) o el menú de pausa.
  returnTo?: 'MenuScene' | 'PauseScene';
}

// Pantalla de opciones. Su contenido se añade en HU-28 a HU-34.
export class OptionsScene extends Phaser.Scene {
  private returnTo: 'MenuScene' | 'PauseScene' = 'MenuScene';

  constructor() {
    super('OptionsScene');
  }

  init(data: OptionsSceneData): void {
    this.returnTo = data.returnTo ?? 'MenuScene';
  }

  create(): void {
    // Fondo opaco: desde la pausa, la partida detenida sigue dibujándose debajo.
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, Phaser.Display.Color.HexStringToColor(COLORS.background).color)
      .setOrigin(0);
    addTitle(this, 'Opciones');

    addBackButton(this, this.scale.width / 2, this.scale.height - 80, () => {
      const data: MenuSceneData & PauseSceneData = { selected: 'Opciones' };
      this.scene.start(this.returnTo, data);
    });
  }
}
