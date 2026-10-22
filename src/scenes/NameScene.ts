import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';
import { getGameState } from '../systems/gameState';
import { addTitle } from '../ui/title';

// HU-67: letras (con tilde, ñ y ü) y espacios, hasta 12 caracteres.
const MAX_LENGTH = 12;
const ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]$/;

// Datos de una partida nueva, del menú a la introducción y de ahí a esta escena: si sustituye a la partida
// guardada (HU-02, escenario 3).
export interface NewGameData {
  overwriteSave: boolean;
}

// Nombre del jugador (HU-67), después de la introducción de una partida nueva. Se escribe con el teclado;
// Retroceso borra y Enter confirma (con el nombre vacío no hace nada). Al confirmar se elige el aspecto (HU-68).
export class NameScene extends Phaser.Scene {
  private typed = '';
  private text!: Phaser.GameObjects.Text;
  private newGame: NewGameData = { overwriteSave: false };

  constructor() {
    super('NameScene');
  }

  init(data: NewGameData): void {
    this.newGame = data;
  }

  create(): void {
    const { width, height } = this.scale;
    this.typed = '';
    addTitle(this, '¿Cómo te llamas?', height / 2 - 90);
    this.add
      .rectangle(width / 2, height / 2, 420, 64, Phaser.Display.Color.HexStringToColor(COLORS.background).color)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.text).color);
    this.text = this.add
      .text(width / 2, height / 2, '', { fontFamily: FONT_FAMILY, fontSize: '32px', color: COLORS.selected })
      .setOrigin(0.5)
      .setName('nombre');
    this.add
      .text(width / 2, height - 50, 'Enter: confirmar · Retroceso: borrar', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.selected })
      .setOrigin(0.5);

    // Se escucha el teclado del navegador: con el evento genérico de Phaser, varias teclas pulsadas en el mismo
    // fotograma (al escribir deprisa) llegaban repetidas.
    const onKeyDown = (event: KeyboardEvent) => this.onKey(event.key);
    window.addEventListener('keydown', onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', onKeyDown));
    this.refresh();
  }

  // Nombre escrito hasta ahora, para los tests.
  getName(): string {
    return this.typed;
  }

  private onKey(key: string): void {
    if (key === 'Enter') {
      this.confirm();
    } else if (key === 'Backspace') {
      this.typed = this.typed.slice(0, -1);
    } else if (ALLOWED.test(key) && this.typed.length < MAX_LENGTH && !(key === ' ' && this.typed === '')) {
      this.typed += key;
    }
    this.refresh();
  }

  private confirm(): void {
    const name = this.typed.trim();
    if (!name) return;
    playEffect(this, 'menuConfirm');
    getGameState().playerName = name;
    this.scene.start('AppearanceScene', this.newGame);
  }

  private refresh(): void {
    this.text.setText(`${this.typed}_`);
  }
}
