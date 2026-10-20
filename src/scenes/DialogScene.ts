import Phaser from 'phaser';
import dialogues from '../data/dialogues.json';
import { COLORS, DIALOG_MS_PER_LETTER, FONT_FAMILY } from '../config';

export type NpcId = keyof typeof dialogues;

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
export class DialogScene extends Phaser.Scene {
  private dialog!: DialogSceneData;
  private lines: string[] = [];
  private lineIndex = 0;
  private shownLetters = 0;
  private text!: Phaser.GameObjects.Text;
  private typing?: Phaser.Time.TimerEvent;

  constructor() {
    super('DialogScene');
  }

  init(data: DialogSceneData): void {
    this.dialog = data;
    this.lines = data.lines;
    this.lineIndex = 0;
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

    this.input.keyboard!.on('keydown-E', () => this.onInteract());

    this.showLine(0);
  }

  // Estado del diálogo, para los tests.
  getState(): { speaker: string; lineIndex: number; shownText: string; fullText: string; typing: boolean } {
    return {
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

  private showLine(index: number): void {
    this.lineIndex = index;
    this.typing?.remove();
    if (!this.dialog.typewriter) {
      this.shownLetters = this.lines[index].length;
      this.text.setText(this.lines[index]);
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
    this.dialog.onClose();
  }
}
