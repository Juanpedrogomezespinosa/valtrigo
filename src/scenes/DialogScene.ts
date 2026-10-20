import Phaser from 'phaser';
import dialogues from '../data/dialogues.json';
import { COLORS, DIALOG_MS_PER_LETTER, FONT_FAMILY } from '../config';

export type NpcId = keyof typeof dialogues;

export interface DialogSceneData {
  npc: NpcId;
  lines: string[];
  // Se llama al cerrar el diálogo, después de la última línea.
  onClose: () => void;
}

const BOX_HEIGHT = 160;
const MARGIN = 20;
const PORTRAIT_SIZE = 96;

// Cuadro de diálogo de un NPC (HU-10), en la parte inferior de la pantalla, sobre la partida.
// - Muestra el retrato y el nombre del NPC, y escribe cada línea letra a letra.
// - E durante la escritura muestra la línea completa; E con la línea completa pasa a la siguiente.
// - E en la última línea completa cierra el diálogo.
export class DialogScene extends Phaser.Scene {
  private npc!: NpcId;
  private lines: string[] = [];
  private onClose!: () => void;
  private lineIndex = 0;
  private shownLetters = 0;
  private text!: Phaser.GameObjects.Text;
  private typing?: Phaser.Time.TimerEvent;

  constructor() {
    super('DialogScene');
  }

  init(data: DialogSceneData): void {
    this.npc = data.npc;
    this.lines = data.lines;
    this.onClose = data.onClose;
    this.lineIndex = 0;
  }

  create(): void {
    const { width, height } = this.scale;
    const top = height - BOX_HEIGHT - MARGIN;

    this.add
      .rectangle(MARGIN, top, width - MARGIN * 2, BOX_HEIGHT, Phaser.Display.Color.HexStringToColor(COLORS.background).color)
      .setOrigin(0)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.text).color);

    // Retrato: el NPC mirando de frente, ampliado.
    this.add
      .image(MARGIN * 2, top + (BOX_HEIGHT - PORTRAIT_SIZE) / 2, this.npc, 0)
      .setOrigin(0)
      .setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE)
      .setName('retrato');

    const textLeft = MARGIN * 3 + PORTRAIT_SIZE;
    this.add.text(textLeft, top + 16, dialogues[this.npc].name, {
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

    this.input.keyboard!.on('keydown-E', () => this.onInteract());

    this.showLine(0);
  }

  // Estado del diálogo, para los tests.
  getState(): { npc: NpcId; lineIndex: number; shownText: string; fullText: string; typing: boolean } {
    return {
      npc: this.npc,
      lineIndex: this.lineIndex,
      shownText: this.text.text,
      fullText: this.lines[this.lineIndex],
      typing: this.isTyping(),
    };
  }

  private isTyping(): boolean {
    return this.shownLetters < this.lines[this.lineIndex].length;
  }

  private showLine(index: number): void {
    this.lineIndex = index;
    this.shownLetters = 0;
    this.text.setText('');
    this.typing?.remove();
    this.typing = this.time.addEvent({
      delay: DIALOG_MS_PER_LETTER,
      repeat: this.lines[index].length - 1,
      callback: () => {
        this.shownLetters++;
        this.text.setText(this.lines[this.lineIndex].slice(0, this.shownLetters));
      },
    });
  }

  private onInteract(): void {
    if (this.isTyping()) {
      this.typing?.remove();
      this.shownLetters = this.lines[this.lineIndex].length;
      this.text.setText(this.lines[this.lineIndex]);
      return;
    }

    if (this.lineIndex < this.lines.length - 1) {
      this.showLine(this.lineIndex + 1);
      return;
    }

    this.scene.stop();
    this.onClose();
  }
}
