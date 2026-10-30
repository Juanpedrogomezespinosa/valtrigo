import Phaser from 'phaser';
import { startGame } from '../systems/gameState';
import { createPracticeState, PRACTICE_TITLES } from '../systems/practice';
import { MenuList } from '../ui/menuList';
import { addTitle } from '../ui/title';
import type { Direction } from '../entities/Player';
import type { GameSceneData } from './GameScene';
import type { MenuSceneData } from './MenuScene';

const BACK = 'Volver';

// Lista de partidas de práctica (HU-61), desde el menú principal. Se maneja como el menú principal (flechas,
// Enter o un clic). Al elegir una partida, empieza directamente, sin introducción ni nombre, y la partida
// guardada no cambia. "Volver" o Escape regresan al menú con "Partidas de práctica" seleccionada.
export class PracticeScene extends Phaser.Scene {
  private menu!: MenuList<string>;

  constructor() {
    super('PracticeScene');
  }

  create(): void {
    addTitle(this, 'Partidas de práctica', 70);
    this.menu = new MenuList(
      this,
      [...PRACTICE_TITLES, BACK].map((label) => ({ label, enabled: true })),
      {
        x: this.scale.width / 2 - 160,
        y: 140,
        // Con 8 partidas y "Volver", las opciones van más juntas que en el menú principal para que quepan.
        spacing: 42,
        onActivate: (label) => (label === BACK ? this.back() : this.start(label)),
      },
    );
    this.input.keyboard!.on('keydown-ESC', () => this.back());
  }

  getSelectedOption(): string {
    return this.menu.getSelected();
  }

  getOptions(): string[] {
    return [...PRACTICE_TITLES, BACK];
  }

  private start(title: string): void {
    const { state, facing } = createPracticeState(this, title);
    startGame(state);
    const data: GameSceneData = { facing: facing as Direction | undefined };
    this.scene.start('GameScene', data);
  }

  private back(): void {
    const data: MenuSceneData = { selected: 'Partidas de práctica' };
    this.scene.start('MenuScene', data);
  }
}
