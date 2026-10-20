import Phaser from 'phaser';
import { NIGHT_COLOR, NIGHT_MAX_ALPHA } from '../config';
import { isGameInProgress } from '../systems/gameState';
import { darkness } from '../systems/time';

// Ciclo día y noche (HU-23): una capa oscura sobre la partida, cuya opacidad depende de la hora.
// Está justo encima de la partida y por debajo de diálogos, menús e interfaz, que se siguen leyendo bien.
export class NightScene extends Phaser.Scene {
  private shade!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('NightScene');
  }

  create(): void {
    this.shade = this.add.rectangle(0, 0, this.scale.width, this.scale.height, NIGHT_COLOR).setOrigin(0).setAlpha(0);
    this.update();
  }

  update(): void {
    if (isGameInProgress()) {
      this.shade.setAlpha(darkness() * NIGHT_MAX_ALPHA);
    }
  }

  // Oscuridad actual entre 0 y 1, para los tests.
  getDarkness(): number {
    return this.shade.alpha / NIGHT_MAX_ALPHA;
  }
}
