import dialogues from '../data/dialogues.json';
import quests from '../data/quests.json';
import { isFairDay } from './fair';
import { getGameState } from './gameState';
import { addItem, canAdd, countItem, ITEMS, removeItem, type ItemId } from './inventory';

// Encargos (HU-11, HU-19, HU-20 y HU-21). Todo cambio en los encargos pasa por aquí.
// Decisiones del autor (ver CLAUDE.md):
// - Los encargos se hacen en el orden de quests.json: un NPC solo ofrece su encargo cuando
//   todos los anteriores están completados y ha llegado su día (`day`, HU-38).
// - Mientras el encargo 1 está activo, la vendedora entrega la Carta del alcalde.
// Tipos de condición: `deliver` (entregar objetos al NPC), `sell` (vender en la tienda), `talk` (hablar con
// el NPC) y `mechanism` (colocar los objetos en el mecanismo del reloj, HU-56). Un encargo con `ceremony`
// se completa con el discurso del alcalde en la ceremonia de la feria (HU-66) o, después de la feria, hablando con él.

export type NpcId = keyof typeof dialogues.npcs;
export type Quest = (typeof quests)[number];
type QuestDialogue = { offer: string[]; active: string[]; complete: string[]; thanks: string[] };

export const QUESTS: Quest[] = quests;

// Qué pasa al hablar con un NPC, según el estado de los encargos.
export type Conversation =
  | { kind: 'greeting'; lines: string[] }
  | { kind: 'offer'; quest: Quest; lines: string[] }
  | { kind: 'active'; quest: Quest; lines: string[] }
  | { kind: 'complete'; quest: Quest; lines: string[] }
  | { kind: 'thanks'; quest: Quest; lines: string[] }
  | { kind: 'busy'; lines: string[] }
  | { kind: 'give-letter'; lines: string[] }
  | { kind: 'clock-repaired'; lines: string[] };

// El encargo cuyo final repara el reloj de la torre, y el último de la historia.
const CLOCK_QUEST = 'encargo-4';
export const LAST_QUEST = 'encargo-6';

export function getActiveQuest(): Quest | null {
  const id = getGameState().activeQuests[0];
  return QUESTS.find((quest) => quest.id === id) ?? null;
}

function isCompleted(quest: Quest): boolean {
  return getGameState().completedQuests.includes(quest.id);
}

// El primer encargo de la lista que aún no se ha completado.
function nextQuest(): Quest | null {
  return QUESTS.find((quest) => !isCompleted(quest)) ?? null;
}

function questDialogue(npc: NpcId, quest: Quest): QuestDialogue {
  return (dialogues.npcs[npc].quests as Record<string, QuestDialogue>)[quest.id];
}

// Indica si se cumplen las condiciones del encargo.
export function isRequirementMet(quest: Quest): boolean {
  const { requirement } = quest;
  switch (requirement.type) {
    case 'deliver':
    case 'mechanism':
      return requirement.items!.every(({ item, quantity }) => countItem(item as ItemId) >= quantity);
    case 'sell':
      return (getGameState().questProgress[quest.id] ?? 0) >= requirement.quantity!;
    default:
      // "talk": hablar con el NPC con el encargo activo ya lo cumple.
      return true;
  }
}

export function conversationWith(npc: NpcId): Conversation {
  const state = getGameState();
  const active = getActiveQuest();
  const npcData = dialogues.npcs[npc];
  const ownQuests = QUESTS.filter((quest) => quest.npc === npc);

  if (active?.npc === npc) {
    const lines = questDialogue(npc, active);
    // HU-56: el encargo de las piezas del reloj se completa en el mecanismo, no hablando con la relojera.
    // HU-66: el de la feria se completa con el discurso de la ceremonia, salvo después de la feria.
    const waitsForCeremony = 'ceremony' in active.requirement && isFairDay() && !state.ceremonyDone;
    if (active.requirement.type === 'mechanism' || waitsForCeremony) {
      return { kind: 'active', quest: active, lines: lines.active };
    }
    return isRequirementMet(active)
      ? { kind: 'complete', quest: active, lines: lines.complete }
      : { kind: 'active', quest: active, lines: lines.active };
  }

  if (active) {
    // Excepción del encargo 1: la vendedora entrega la carta.
    if (npc === 'vendedora' && active.id === 'encargo-1' && countItem('carta-del-alcalde') === 0) {
      return { kind: 'give-letter', lines: dialogues.npcs.vendedora.giveLetter };
    }
    // HU-19: un NPC que todavía tiene encargos pendientes no los ofrece mientras haya otro activo.
    if (ownQuests.some((quest) => !isCompleted(quest))) {
      return { kind: 'busy', lines: dialogues.busy };
    }
  }

  // HU-38: el siguiente encargo solo se ofrece a partir de su día. Antes, el NPC habla como siempre.
  const next = nextQuest();
  if (!active && next?.npc === npc && state.day >= next.day) {
    return { kind: 'offer', quest: next, lines: questDialogue(npc, next).offer };
  }

  // HU-11 (escenario 5): con el reloj reparado, el NPC que no tiene nada de encargos que decir lo comenta.
  if (state.completedQuests.includes(CLOCK_QUEST)) {
    return { kind: 'clock-repaired', lines: npcData.clockRepaired };
  }

  // HU-11: después de completar un encargo, el NPC da las gracias (por el último que completó).
  const lastCompleted = [...ownQuests].reverse().find((quest) => state.completedQuests.includes(quest.id));
  if (lastCompleted) {
    return { kind: 'thanks', quest: lastCompleted, lines: questDialogue(npc, lastCompleted).thanks };
  }

  return { kind: 'greeting', lines: npcData.greeting };
}

// HU-19: aceptar un encargo. Solo puede haber uno activo.
export function acceptQuest(quest: Quest): boolean {
  const state = getGameState();
  if (state.activeQuests.length > 0) {
    return false;
  }
  state.activeQuests = [quest.id];
  return true;
}

// Indica si caben en el inventario los objetos de la recompensa, tal y como está ahora el inventario.
export function canReceiveReward(quest: Quest): boolean {
  return quest.reward.items.every(({ item, quantity }) => canAdd(item as ItemId, quantity));
}

// HU-20: completa el encargo activo: entrega los objetos pedidos, da la recompensa y lo marca como completado.
// Si la recompensa no cabe en el inventario, no se completa y devuelve false.
export function completeQuest(quest: Quest): boolean {
  const state = getGameState();
  if (!state.activeQuests.includes(quest.id) || !isRequirementMet(quest) || !canReceiveReward(quest)) {
    return false;
  }

  if (quest.requirement.type === 'deliver' || quest.requirement.type === 'mechanism') {
    for (const { item, quantity } of quest.requirement.items!) {
      removeItem(item as ItemId, quantity);
    }
  }
  state.money += quest.reward.money;
  state.dayStats.moneyEarned += quest.reward.money; // HU-39
  for (const { item, quantity } of quest.reward.items) {
    addItem(item as ItemId, quantity);
  }
  state.activeQuests = [];
  state.completedQuests.push(quest.id);
  delete state.questProgress[quest.id];
  return true;
}

// Anota una venta en la tienda (HU-18) para los encargos de tipo "sell" que estén activos.
export function recordSale(item: ItemId, quantity: number): void {
  const active = getActiveQuest();
  if (active?.requirement.type === 'sell' && active.requirement.item === item) {
    const progress = getGameState().questProgress;
    progress[active.id] = (progress[active.id] ?? 0) + quantity;
  }
}

// HU-65: mensaje al recibir un objeto de un NPC: "Recibiste Manzana de parte del alcalde" o, con varias
// unidades, "Recibiste 2 Manzanas de parte de la relojera".
export function receivedMessage(npc: NpcId, item: ItemId, quantity: number): string {
  const { name, plural } = ITEMS[item];
  const itemText = quantity === 1 ? name : `${quantity} ${plural}`;
  return dialogues.received.replace('{objeto}', itemText).replace('{de}', dialogues.npcs[npc].from);
}

// HU-56: el encargo que se completa colocando sus objetos en el mecanismo del reloj, si es el activo.
// El orden correcto de las piezas, de abajo arriba, es el de la lista de objetos del encargo.
export function activeMechanismQuest(): Quest | null {
  const active = getActiveQuest();
  return active?.requirement.type === 'mechanism' ? active : null;
}

export function mechanismOrder(quest: Quest): ItemId[] {
  return quest.requirement.items!.map(({ item }) => item as ItemId);
}

// HU-66: el encargo que se completa con el discurso de la ceremonia de la feria, si está activo o es el
// siguiente que toca (ya ha llegado su día y no hay otro activo). Si no, null.
export function ceremonyQuest(): Quest | null {
  const state = getGameState();
  const active = getActiveQuest();
  if (active) {
    return 'ceremony' in active.requirement ? active : null;
  }
  const next = nextQuest();
  return next && 'ceremony' in next.requirement && state.day >= next.day ? next : null;
}
