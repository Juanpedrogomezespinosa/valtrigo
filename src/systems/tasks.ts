import tasks from '../data/tasks.json';
import { getGameState } from './gameState';
import { countItem, type ItemId } from './inventory';

// Tareas del día (HU-63). Datos en src/data/tasks.json: el día de cada tarea, su texto y cuándo está hecha.
// Condiciones:
// - `event`: algo que se hace ese día ("talk:<npc>", "visit:<zona>", "buy:<objeto>", "read:<cartel>").
//   Estas tareas solo aparecen en su día.
// - `questAccepted`, `questCompleted`, `questProgress`, `hasItem`, `pickedUp` y `chestOpened`: el estado
//   de la partida. Si quedan pendientes, siguen apareciendo los días siguientes hasta que se hacen.
// - `anyOf`: basta con que se cumpla una de las condiciones.

interface Condition {
  event?: string;
  questAccepted?: string;
  questCompleted?: string;
  questProgress?: string;
  quantity?: number;
  hasItem?: string;
  pickedUp?: string;
  chestOpened?: string;
  anyOf?: Condition[];
}

interface Task {
  day: number;
  text: string;
  done: Condition;
}

export interface TaskView {
  text: string;
  done: boolean;
}

const TASKS: Task[] = tasks;

// Anota algo que el jugador ha hecho hoy (hablar con alguien, entrar en una zona, comprar o leer un cartel).
export function recordEvent(event: string): void {
  const events = getGameState().dayEvents;
  if (!events.includes(event)) {
    events.push(event);
  }
}

function isMet(condition: Condition): boolean {
  const state = getGameState();
  if (condition.anyOf) return condition.anyOf.some(isMet);
  if (condition.event) return state.dayEvents.includes(condition.event);
  if (condition.questAccepted) {
    return state.activeQuests.includes(condition.questAccepted) || state.completedQuests.includes(condition.questAccepted);
  }
  if (condition.questCompleted) return state.completedQuests.includes(condition.questCompleted);
  if (condition.questProgress) return (state.questProgress[condition.questProgress] ?? 0) >= condition.quantity!;
  if (condition.hasItem) return countItem(condition.hasItem as ItemId) > 0;
  if (condition.pickedUp) return state.pickedUpItems.includes(condition.pickedUp);
  if (condition.chestOpened) return state.openedChests.includes(condition.chestOpened);
  return false;
}

// Una tarea es "del día" si se cumple haciendo algo ese día (una condición `event`, sola o dentro de `anyOf`).
function isDailyOnly(condition: Condition): boolean {
  return condition.event !== undefined || (condition.anyOf?.some(isDailyOnly) ?? false);
}

// Tareas que se ven hoy: primero las pendientes de días anteriores y después las de hoy.
export function todayTasks(): TaskView[] {
  const day = getGameState().day;
  const pending = TASKS.filter((task) => task.day < day && !isDailyOnly(task.done) && !isMet(task.done));
  const today = TASKS.filter((task) => task.day === day);
  return [...pending, ...today].map((task) => ({ text: task.text, done: isMet(task.done) }));
}
