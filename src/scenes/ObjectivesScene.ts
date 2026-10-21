import Phaser from 'phaser';
import dialogues from '../data/dialogues.json';
import { COLORS, FONT_FAMILY } from '../config';
import { getGameState } from '../systems/gameState';
import { getActiveQuest } from '../systems/quests';
import { todayTasks } from '../systems/tasks';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

const WIDTH = 720;
// Tareas del día que caben en la pantalla. Si hay más, se dejan fuera primero las ya hechas.
const MAX_TASKS = 6;

// Lista de objetivos (HU-21): los encargos activos con su nombre, su descripción y el NPC que los encargó,
// y debajo las tareas del día (HU-63).
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

    this.addTasks(left);

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-O', () => this.close());
    keyboard.on('keydown-ESC', () => this.close());
  }

  // HU-63: "Tareas de hoy (día N)", con ☑ las hechas y ☐ las pendientes.
  private addTasks(left: number): void {
    const top = 340;
    this.add.text(left, top, `Tareas de hoy (día ${getGameState().day})`, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.selected,
    });

    let tasks = todayTasks();
    if (tasks.length === 0) {
      this.add.text(left, top + 40, 'No hay tareas para hoy', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.text });
      return;
    }
    if (tasks.length > MAX_TASKS) {
      tasks = tasks.filter((task) => !task.done).slice(0, MAX_TASKS);
    }
    tasks.forEach((task, index) => {
      this.add.text(left, top + 40 + index * 26, `${task.done ? '☑' : '☐'} ${task.text}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        // Mismo color para hechas y pendientes: el gris no llega a 4,5:1 sobre algunos fondos (HU-36).
        color: COLORS.text,
      });
    });
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }
}
