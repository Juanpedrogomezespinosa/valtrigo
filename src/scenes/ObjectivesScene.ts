import Phaser from 'phaser';
import dialogues from '../data/dialogues.json';
import { COLORS, FONT_FAMILY } from '../config';
import { getActiveQuest } from '../systems/quests';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

const WIDTH = 720;

// Lista de objetivos (HU-21): los encargos activos con su nombre, su descripción y el NPC que los encargó.
// Se abre con O encima de la partida y se cierra con O o Escape. El tiempo sigue mientras está abierta.
export class ObjectivesScene extends Phaser.Scene {
  private onClose!: () => void;

  constructor() {
    super('ObjectivesScene');
  }

  init(data: OverlaySceneData): void {
    this.onClose = data.onClose;
  }

  create(): void {
    const { width } = this.scale;
    this.add.rectangle(0, 0, width, this.scale.height, 0x000000, 0.75).setOrigin(0);
    addTitle(this, 'Objetivos', 70);

    const left = (width - WIDTH) / 2;
    const quest = getActiveQuest();
    if (!quest) {
      this.add
        .text(width / 2, 200, 'No tienes encargos activos', { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.text })
        .setOrigin(0.5);
    } else {
      this.add.text(left, 150, quest.name, { fontFamily: FONT_FAMILY, fontSize: '26px', color: COLORS.selected }).setName('nombre');
      this.add
        .text(left, 195, quest.description, {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
          color: COLORS.text,
          wordWrap: { width: WIDTH },
          lineSpacing: 6,
        })
        .setName('descripcion');
      this.add
        .text(left, 290, `Encargado por: ${dialogues.npcs[quest.npc as keyof typeof dialogues.npcs].name}`, {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
          color: COLORS.text,
        })
        .setName('npc');
    }

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-O', () => this.close());
    keyboard.on('keydown-ESC', () => this.close());
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }
}
