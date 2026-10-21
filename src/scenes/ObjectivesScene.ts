import Phaser from 'phaser';
import dialogues from '../data/dialogues.json';
import { COLORS, FONT_FAMILY } from '../config';
import { getGameState } from '../systems/gameState';
import { activeOrders, BOARD_NAME } from '../systems/orders';
import { getActiveQuest } from '../systems/quests';
import { todayTasks } from '../systems/tasks';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

// Dos columnas: a la izquierda los encargos y pedidos activos; a la derecha las tareas del día.
const LEFT_X = 50;
const LEFT_WIDTH = 430;
const RIGHT_X = 520;
const RIGHT_WIDTH = 400;
const TOP = 120;
const ENTRY_GAP = 18;
// Tareas del día que caben en la pantalla. Si hay más, se dejan fuera primero las ya hechas.
const MAX_TASKS = 6;

interface Objective {
  name: string;
  description: string;
  by: string;
}

// Lista de objetivos (HU-21): primero el encargo principal y después los pedidos del tablón (HU-53), cada uno con
// su nombre, su descripción y quién lo encargó; y, en la otra columna, las tareas del día (HU-63).
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
    addTitle(this, 'Objetivos', 60);

    this.addObjectives();
    this.addTasks();

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-O', () => this.close());
    keyboard.on('keydown-ESC', () => this.close());
  }

  private addObjectives(): void {
    const objectives: Objective[] = [];
    const quest = getActiveQuest();
    if (quest) {
      const npc = dialogues.npcs[quest.npc as keyof typeof dialogues.npcs];
      objectives.push({ name: quest.name, description: quest.description, by: npc.name });
    }
    for (const order of activeOrders()) {
      objectives.push({ name: order.title, description: order.description, by: BOARD_NAME });
    }

    this.add.text(LEFT_X, TOP, 'Encargos', { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.selected });
    if (objectives.length === 0) {
      this.add.text(LEFT_X, TOP + 44, 'No tienes encargos activos', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.text });
      return;
    }

    let y = TOP + 44;
    for (const { name, description, by } of objectives) {
      const nameText = this.add.text(LEFT_X, y, name, { fontFamily: FONT_FAMILY, fontSize: '22px', color: COLORS.selected });
      y += nameText.height + 4;
      const descriptionText = this.add.text(LEFT_X, y, description, {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: COLORS.text,
        wordWrap: { width: LEFT_WIDTH },
        lineSpacing: 4,
      });
      y += descriptionText.height + 4;
      const byText = this.add.text(LEFT_X, y, `Encargado por: ${by}`, { fontFamily: FONT_FAMILY, fontSize: '18px', color: COLORS.text });
      y += byText.height + ENTRY_GAP;
    }
  }

  // HU-63: "Tareas de hoy (día N)", con ☑ las hechas y ☐ las pendientes.
  private addTasks(): void {
    this.add.text(RIGHT_X, TOP, `Tareas de hoy (día ${getGameState().day})`, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.selected,
    });

    let tasks = todayTasks();
    if (tasks.length === 0) {
      this.add.text(RIGHT_X, TOP + 44, 'No hay tareas para hoy', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.text });
      return;
    }
    if (tasks.length > MAX_TASKS) {
      tasks = tasks.filter((task) => !task.done).slice(0, MAX_TASKS);
    }
    let y = TOP + 44;
    for (const task of tasks) {
      // Mismo color para hechas y pendientes: el gris no llega a 4,5:1 sobre algunos fondos (HU-36).
      const text = this.add.text(RIGHT_X, y, `${task.done ? '☑' : '☐'} ${task.text}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: COLORS.text,
        wordWrap: { width: RIGHT_WIDTH },
      });
      y += text.height + 8;
    }
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }
}
