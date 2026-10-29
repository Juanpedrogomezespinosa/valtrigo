import Phaser from 'phaser';
import diary from '../data/diary.json';
import dialogues from '../data/dialogues.json';
import { COLORS, FONT_FAMILY } from '../config';
import { getGameState } from '../systems/gameState';
import { activeOrders, BOARD_NAME } from '../systems/orders';
import { activeMissions } from '../systems/missions';
import { getActiveQuest } from '../systems/quests';
import { todayTasks } from '../systems/tasks';
import { playEffect } from '../systems/audio';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

// Dos columnas: a la izquierda los encargos y pedidos activos; a la derecha las tareas del día.
const LEFT_X = 50;
const LEFT_WIDTH = 500;
const RIGHT_X = 590;
const RIGHT_WIDTH = 330;
const TOP = 150;
const ENTRY_GAP = 12;
// Tareas del día que caben en la pantalla. Si hay más, se dejan fuera primero las ya hechas.
const MAX_TASKS = 6;

type Tab = 'Encargos' | 'Misiones' | 'Notas';
const TABS: Tab[] = ['Encargos', 'Misiones', 'Notas'];
const TAB_SPACING = 180;
const TABS_Y = 115;
const NOTE_LABEL_WIDTH = 130;

interface Objective {
  name: string;
  description: string;
  by: string;
}

// Lista de objetivos (HU-21), con tres apartados que se cambian con ← → (HU-55 y HU-72):
// - "Encargos": primero el encargo principal y después los pedidos del tablón (HU-53), cada uno con su nombre,
//   su descripción y quién lo encargó; y, en la otra columna, las tareas del día (HU-63).
// - "Misiones": las misiones secundarias activas (HU-72), con su hora límite si la tienen (HU-74).
// - "Notas": las páginas del diario de la relojera, en orden. Las que faltan, como "Página sin encontrar".
// Se abre con O encima de la partida y se cierra con O o Escape. El tiempo sigue mientras está abierta.
export class ObjectivesScene extends Phaser.Scene {
  private onClose!: () => void;
  private tab: Tab = 'Encargos';
  private tabTexts: Phaser.GameObjects.Text[] = [];
  // Lo que se ve en el apartado actual. Se vuelve a crear al cambiar de apartado.
  private content: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('ObjectivesScene');
  }

  init(data: OverlaySceneData): void {
    this.onClose = data.onClose;
    this.tab = 'Encargos';
  }

  create(): void {
    const { width } = this.scale;
    this.add.rectangle(0, 0, width, this.scale.height, 0x000000, 0.75).setOrigin(0);
    addTitle(this, 'Objetivos', 60);

    this.tabTexts = TABS.map((tab, index) =>
      this.add.text(width / 2 + (index - 1) * TAB_SPACING, TABS_Y, tab, { fontFamily: FONT_FAMILY, fontSize: '24px' }).setOrigin(0.5),
    );
    this.showTab();

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-LEFT', () => this.switchTab(TABS[Math.max(0, TABS.indexOf(this.tab) - 1)]));
    keyboard.on('keydown-RIGHT', () => this.switchTab(TABS[Math.min(TABS.length - 1, TABS.indexOf(this.tab) + 1)]));
    keyboard.on('keydown-O', () => this.close());
    keyboard.on('keydown-ESC', () => this.close());
  }

  private switchTab(tab: Tab): void {
    if (tab !== this.tab) {
      this.tab = tab;
      playEffect(this, 'menuNavigate');
      this.showTab();
    }
  }

  private showTab(): void {
    this.tabTexts.forEach((text, index) => {
      const active = TABS[index] === this.tab;
      text.setColor(active ? COLORS.selected : COLORS.text);
      text.setText(active ? `[ ${TABS[index]} ]` : TABS[index]);
    });
    for (const object of this.content) object.destroy();
    this.content = [];
    if (this.tab === 'Encargos') {
      this.addObjectives();
      this.addTasks();
    } else if (this.tab === 'Misiones') {
      this.addMissions();
    } else {
      this.addNotes();
    }
  }

  // Añade un texto al apartado actual.
  private text(x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
    const object = this.add.text(x, y, text, { fontFamily: FONT_FAMILY, ...style });
    this.content.push(object);
    return object;
  }

  // HU-55: las páginas del diario, en orden.
  private addNotes(): void {
    const found = getGameState().diaryPages;
    let y = TOP;
    Object.entries(diary.pages).forEach(([id, pageText], index) => {
      this.text(LEFT_X, y, `Página ${index + 1}`, { fontSize: '20px', color: COLORS.selected });
      const body = this.text(LEFT_X + NOTE_LABEL_WIDTH, y, found.includes(id) ? pageText : diary.missing, {
        fontSize: '18px',
        color: COLORS.text,
        wordWrap: { width: this.scale.width - LEFT_X * 2 - NOTE_LABEL_WIDTH },
        lineSpacing: 4,
      });
      y += Math.max(body.height, 24) + 16;
    });
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

    this.text(LEFT_X, TOP, 'Encargos activos', { fontSize: '22px', color: COLORS.selected });
    if (objectives.length === 0) {
      this.text(LEFT_X, TOP + 38, 'No tienes encargos activos', { fontSize: '20px', color: COLORS.text });
      return;
    }

    let y = TOP + 38;
    for (const { name, description, by } of objectives) {
      const nameText = this.text(LEFT_X, y, name, { fontSize: '18px', color: COLORS.selected });
      y += nameText.height + 2;
      const descriptionText = this.text(LEFT_X, y, description, {
        fontSize: '16px',
        color: COLORS.text,
        wordWrap: { width: LEFT_WIDTH },
        lineSpacing: 2,
      });
      y += descriptionText.height + 2;
      const byText = this.text(LEFT_X, y, `Encargado por: ${by}`, { fontSize: '16px', color: COLORS.text });
      y += byText.height + ENTRY_GAP;
    }
  }

  // HU-72: las misiones activas, con "Antes de las HH:MM" si tienen hora límite (HU-74).
  private addMissions(): void {
    const missions = activeMissions();
    this.text(LEFT_X, TOP, 'Misiones activas', { fontSize: '22px', color: COLORS.selected });
    if (missions.length === 0) {
      this.text(LEFT_X, TOP + 38, 'No tienes misiones activas', { fontSize: '20px', color: COLORS.text });
      return;
    }
    const width = this.scale.width - LEFT_X * 2;
    let y = TOP + 38;
    for (const mission of missions) {
      const name = this.text(LEFT_X, y, mission.name, { fontSize: '20px', color: COLORS.selected });
      y += name.height + 2;
      const description = this.text(LEFT_X, y, mission.description, { fontSize: '18px', color: COLORS.text, wordWrap: { width } });
      y += description.height + 2;
      const npc = dialogues.npcs[mission.npc as keyof typeof dialogues.npcs];
      const deadline = 'deadline' in mission && mission.deadline ? ` · Antes de las ${mission.deadline}` : '';
      const by = this.text(LEFT_X, y, `Encargada por: ${npc.name}${deadline}`, { fontSize: '18px', color: COLORS.text });
      y += by.height + ENTRY_GAP + 6;
    }
  }

  // HU-63: "Tareas de hoy (día N)", con ☑ las hechas y ☐ las pendientes.
  private addTasks(): void {
    this.text(RIGHT_X, TOP, `Tareas de hoy (día ${getGameState().day})`, { fontSize: '22px', color: COLORS.selected });

    let tasks = todayTasks();
    if (tasks.length === 0) {
      this.text(RIGHT_X, TOP + 38, 'No hay tareas para hoy', { fontSize: '20px', color: COLORS.text });
      return;
    }
    if (tasks.length > MAX_TASKS) {
      tasks = tasks.filter((task) => !task.done).slice(0, MAX_TASKS);
    }
    let y = TOP + 38;
    for (const task of tasks) {
      // Mismo color para hechas y pendientes: el gris no llega a 4,5:1 sobre algunos fondos (HU-36).
      const text = this.text(RIGHT_X, y, `${task.done ? '☑' : '☐'} ${task.text}`, {
        fontSize: '18px',
        color: COLORS.text,
        wordWrap: { width: RIGHT_WIDTH },
      });
      y += text.height + 6;
    }
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }
}
