import data from '../data/missions.json';
import { getGameState } from './gameState';
import { addItem, canAdd, countItem, removeItem, type ItemId } from './inventory';
import { toMinutes } from './time';

// Misiones secundarias de los vecinos (HU-72 a HU-74). Datos en src/data/missions.json.
// - Se ofrecen a partir de su día, como mucho 3 activas a la vez, y cada una se completa una sola vez.
// - Son independientes del encargo principal y de los pedidos del tablón.
// - Tipos: `deliver` (entregar objetos a quien la encarga), `carry` (llevar a otro vecino el objeto que se recibe
//   al aceptar), `talk` (hablar con otro vecino) y `find` (encontrar a Bigotes, que mientras tanto está en otra
//   zona, y volver a hablar con quien la encarga).
// - Las que tienen `deadline` hay que completarlas antes de esa hora del día en que se aceptan (HU-74). Pasada la
//   hora (o si termina el día) fallan; al día siguiente se vuelven a ofrecer.

export type Mission = (typeof data.missions)[number];
interface Requirement {
  type: 'deliver' | 'carry' | 'talk' | 'find';
  items?: { item: string; quantity: number }[];
  item?: string;
  to?: string;
  npc?: string;
  zone?: string;
}

export const MISSIONS: Mission[] = data.missions;
export const MAX_ACTIVE_MISSIONS = 3;
export const MISSIONS_FULL_LINES = data.full;
export const MISSION_COMPLETED = data.completed;

const requirement = (mission: Mission) => mission.requirement as Requirement;

export function missionById(id: string): Mission {
  return MISSIONS.find((mission) => mission.id === id)!;
}

export function activeMissions(): Mission[] {
  return getGameState().activeMissions.map(({ id }) => missionById(id));
}

function isActive(mission: Mission): boolean {
  return getGameState().activeMissions.some(({ id }) => id === mission.id);
}

// Hora límite de la misión en minutos, o null si no tiene (HU-74).
export function deadlineMinutes(mission: Mission): number | null {
  return 'deadline' in mission && mission.deadline ? toMinutes(mission.deadline) : null;
}

// La misión que el vecino ofrecería ahora, sin tener en cuenta el límite de 3: la primera de las suyas que ya ha
// llegado su día, no está activa ni completada y, si tiene hora límite, aún no ha pasado.
export function missionToOffer(npc: string): Mission | null {
  const state = getGameState();
  return (
    MISSIONS.find((mission) => {
      if (mission.npc !== npc || state.day < mission.day || isActive(mission)) return false;
      if (state.completedMissions.includes(mission.id)) return false;
      const deadline = deadlineMinutes(mission);
      return deadline === null || state.minutes < deadline;
    }) ?? null
  );
}

export function canAcceptMoreMissions(): boolean {
  return getGameState().activeMissions.length < MAX_ACTIVE_MISSIONS;
}

// HU-72: aceptar. En las de tipo `carry` se recibe el objeto que hay que llevar; si no cabe, no se acepta.
export function acceptMission(mission: Mission): boolean {
  const state = getGameState();
  const { type, item } = requirement(mission);
  if (!canAcceptMoreMissions() || isActive(mission)) return false;
  if (type === 'carry') {
    if (!canAdd(item as ItemId, 1)) return false;
    addItem(item as ItemId, 1);
  }
  state.activeMissions.push({ id: mission.id, day: state.day });
  return true;
}

// Objeto que se recibe al aceptar la misión, si es de tipo `carry`.
export function carriedItem(mission: Mission): ItemId | null {
  const { type, item } = requirement(mission);
  return type === 'carry' ? (item as ItemId) : null;
}

// La misión activa que se completa al hablar con este vecino, si la hay.
export function missionToComplete(npc: string): Mission | null {
  const state = getGameState();
  return (
    activeMissions().find((mission) => {
      const { type, items, item, to } = requirement(mission);
      switch (type) {
        case 'deliver':
          return mission.npc === npc && items!.every((needed) => countItem(needed.item as ItemId) >= needed.quantity);
        case 'carry':
          return to === npc && countItem(item as ItemId) > 0;
        case 'talk':
          return to === npc;
        case 'find':
          return mission.npc === npc && state.missionProgress.includes(mission.id);
      }
    }) ?? null
  );
}

// HU-72, misión de encontrar a Bigotes: la misión activa en la que hay que encontrar a este NPC, si aún no se ha
// encontrado.
export function missionToFind(npc: string): Mission | null {
  const state = getGameState();
  return activeMissions().find((mission) => requirement(mission).type === 'find' && requirement(mission).npc === npc && !state.missionProgress.includes(mission.id)) ?? null;
}

export function markFound(mission: Mission): void {
  getGameState().missionProgress.push(mission.id);
}

// Zona en la que está el NPC mientras hay que encontrarlo (Bigotes en la granja), o null si sigue su horario.
export function hidingZone(npc: string): string | null {
  const mission = missionToFind(npc);
  return mission ? requirement(mission).zone! : null;
}

// La misión activa del vecino que aún no se puede completar (para su diálogo de seguimiento).
export function ownActiveMission(npc: string): Mission | null {
  return activeMissions().find((mission) => mission.npc === npc) ?? null;
}

export function canReceiveMissionReward(mission: Mission): boolean {
  return mission.reward.items.every(({ item, quantity }) => canAdd(item as ItemId, quantity));
}

// HU-72: completar. Si la recompensa no cabe en el inventario tal y como está, no se completa y devuelve false.
export function completeMission(mission: Mission): boolean {
  const state = getGameState();
  if (!isActive(mission) || !canReceiveMissionReward(mission)) return false;
  const { type, items, item } = requirement(mission);
  if (type === 'deliver') {
    for (const needed of items!) removeItem(needed.item as ItemId, needed.quantity);
  }
  if (type === 'carry') removeItem(item as ItemId, countItem(item as ItemId));
  state.money += mission.reward.money;
  state.dayStats.moneyEarned += mission.reward.money; // HU-39
  for (const reward of mission.reward.items) addItem(reward.item as ItemId, reward.quantity);
  forget(mission);
  state.completedMissions.push(mission.id);
  return true;
}

// HU-74: las misiones activas cuya hora límite ha llegado, o que se aceptaron un día anterior, fallan: dejan de
// estar activas y se pierde el objeto de misión. Devuelve las que han fallado.
export function failExpiredMissions(): Mission[] {
  const state = getGameState();
  const failed = state.activeMissions
    .filter(({ id, day }) => {
      const deadline = deadlineMinutes(missionById(id));
      return deadline !== null && (state.day > day || state.minutes >= deadline);
    })
    .map(({ id }) => missionById(id));
  for (const mission of failed) {
    const item = carriedItem(mission);
    if (item) removeItem(item, countItem(item));
    forget(mission);
  }
  return failed;
}

export function failedMessage(mission: Mission): string {
  return data.failed.replace('{nombre}', mission.name);
}

function forget(mission: Mission): void {
  const state = getGameState();
  state.activeMissions = state.activeMissions.filter(({ id }) => id !== mission.id);
  state.missionProgress = state.missionProgress.filter((id) => id !== mission.id);
}
