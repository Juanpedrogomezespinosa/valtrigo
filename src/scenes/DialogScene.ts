import Phaser from 'phaser';
import { COLORS, DIALOG_MS_PER_LETTER, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';

// Opciones al final de un diálogo, como "Aceptar" y "Rechazar" un encargo (HU-19).
export interface DialogChoice {
  options: string[];
  // Recibe la opción elegida y devuelve las líneas con las que sigue el diálogo, o null para cerrarlo.
  onChoose: (index: number) => string[] | null;
}

export interface DialogSceneData {
  // Quién habla: el identificador del NPC o "cartel".
  speaker: string;
  // Título del cuadro: el nombre del NPC o "Cartel".
  title: string;
  // Clave de la imagen del retrato. Los carteles no tienen.
  portrait?: string;
  lines: string[];
  // Si el texto se escribe letra a letra (NPC, HU-10) o aparece completo (carteles, HU-12).
  typewriter: boolean;
  // Opciones que aparecen cuando la última línea está completa.
  choice?: DialogChoice;
  // Se llama al cerrar el diálogo, después de la última línea.
  onClose: () => void;
}

const BOX_HEIGHT = 160;
const MARGIN = 20;
// Los retratos miden 38×38: se amplían ×3 sin suavizar.
const PORTRAIT_SIZE = 114;

// Cuadro de diálogo en la parte inferior de la pantalla, sobre la partida.
// - NPC (HU-10): retrato y nombre, y cada línea se escribe letra a letra. E durante la escritura muestra
//   la línea completa; E con la línea completa pasa a la siguiente; E en la última línea cierra el diálogo.
// - Carteles (HU-12): el texto aparece completo y E lo cierra.
// - Con opciones (HU-19): al completarse la última línea aparecen las opciones. Se eligen con ← →
//   y se confirman con E, Enter o un clic.
export class DialogScene extends Phaser.Scene {
  private dialog!: DialogSceneData;
  private lines: string[] = [];
  private lineIndex = 0;
  private shownLetters = 0;
  private text!: Phaser.GameObjects.Text;
  private typing?: Phaser.Time.TimerEvent;
  private choice?: DialogChoice;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private selectedChoice = 0;

  constructor() {
    super('DialogScene');
  }

  init(data: DialogSceneData): void {
    this.dialog = data;
    this.lines = data.lines;
    this.lineIndex = 0;
    this.choice = data.choice;
    this.selectedChoice = 0;
  }

  create(): void {
    const { width, height } = this.scale;
    const top = height - BOX_HEIGHT - MARGIN;

    this.add
      .rectangle(MARGIN, top, width - MARGIN * 2, BOX_HEIGHT, Phaser.Display.Color.HexStringToColor(COLORS.background).color)
      .setOrigin(0)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.text).color);

    if (this.dialog.portrait) {
      this.add
        .image(MARGIN * 2, top + (BOX_HEIGHT - PORTRAIT_SIZE) / 2, this.dialog.portrait)
        .setOrigin(0)
        .setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE)
        .setName('retrato');
    }

    const textLeft = this.dialog.portrait ? MARGIN * 3 + PORTRAIT_SIZE : MARGIN * 2;
    this.add.text(textLeft, top + 16, this.dialog.title, {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: COLORS.selected,
    });
    this.text = this.add.text(textLeft, top + 50, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: COLORS.text,
      wordWrap: { width: width - textLeft - MARGIN * 2 },
      lineSpacing: 6,
    });

    // Opciones, abajo a la derecha del cuadro. Están ocultas hasta que toca elegir.
    this.choiceTexts = (this.choice?.options ?? []).map((option, index, options) =>
      this.add
        .text(width - MARGIN * 2 - (options.length - 1 - index) * 170, height - MARGIN - 16, option, {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
        })
        .setOrigin(1, 1)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (this.isChoosing()) {
            this.selectedChoice = index;
            this.choose();
          }
        }),
    );

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-E', () => this.onInteract());
    keyboard.on('keydown-ENTER', () => this.isChoosing() && this.choose());
    keyboard.on('keydown-LEFT', () => this.moveChoice(-1));
    keyboard.on('keydown-RIGHT', () => this.moveChoice(1));

    this.showLine(0);
  }

  // Estado del diálogo, para los tests.
  getState(): {
    speaker: string;
    lineIndex: number;
    shownText: string;
    fullText: string;
    typing: boolean;
    choice: { options: string[]; selected: number } | null;
  } {
    return {
      choice: this.isChoosing() ? { options: this.choice!.options, selected: this.selectedChoice } : null,
      speaker: this.dialog.speaker,
      lineIndex: this.lineIndex,
      shownText: this.text.text,
      fullText: this.lines[this.lineIndex],
      typing: this.isTyping(),
    };
  }

  private isTyping(): boolean {
    return this.shownLetters < this.lines[this.lineIndex].length;
  }

  // Toca elegir cuando la última línea está completa y hay opciones pendientes.
  private isChoosing(): boolean {
    return !!this.choice && this.lineIndex === this.lines.length - 1 && !this.isTyping();
  }

  private refreshChoice(): void {
    const choosing = this.isChoosing();
    this.choiceTexts.forEach((text, index) => {
      text.setVisible(choosing);
      if (!choosing) {
        return;
      }
      const selected = index === this.selectedChoice;
      text.setText(selected ? `▶ ${this.choice!.options[index]}` : this.choice!.options[index]);
      text.setColor(selected ? COLORS.selected : COLORS.text);
    });
  }

  private moveChoice(delta: number): void {
    if (!this.isChoosing()) {
      return;
    }
    const index = Phaser.Math.Clamp(this.selectedChoice + delta, 0, this.choice!.options.length - 1);
    if (index !== this.selectedChoice) {
      this.selectedChoice = index;
      playEffect(this, 'menuNavigate');
      this.refreshChoice();
    }
  }

  private choose(): void {
    playEffect(this, 'menuConfirm');
    const next = this.choice!.onChoose(this.selectedChoice);
    this.choice = undefined;
    this.refreshChoice();
    if (next) {
      this.lines = next;
      this.showLine(0);
    } else {
      this.close();
    }
  }

  private close(): void {
    this.scene.stop();
    this.dialog.onClose();
  }

  private showLine(index: number): void {
    this.lineIndex = index;
    this.typing?.remove();
    if (!this.dialog.typewriter) {
      this.shownLetters = this.lines[index].length;
      this.text.setText(this.lines[index]);
      this.refreshChoice();
      return;
    }
    this.shownLetters = 0;
    this.text.setText('');
    this.typing = this.time.addEvent({
      delay: DIALOG_MS_PER_LETTER,
      repeat: this.lines[index].length - 1,
      callback: () => {
        this.shownLetters++;
        this.text.setText(this.lines[this.lineIndex].slice(0, this.shownLetters));
        this.refreshChoice();
      },
    });
  }

  private onInteract(): void {
    if (this.isTyping()) {
      this.typing?.remove();
      this.shownLetters = this.lines[this.lineIndex].length;
      this.text.setText(this.lines[this.lineIndex]);
      this.refreshChoice();
      return;
    }

    if (this.isChoosing()) {
      this.choose();
      return;
    }

    if (this.lineIndex < this.lines.length - 1) {
      this.showLine(this.lineIndex + 1);
      return;
    }

    this.close();
  }
}
