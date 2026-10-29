import houses from '../data/houses.json';
import shop from '../data/shop.json';
import { isShopOpen } from './economy';
import { getGameState } from './gameState';
import { npcHoursIn } from './schedules';
import { spokenTime } from './time';
import { ZONES, type ZoneId } from './zones';

// Edificios que no siempre se pueden visitar (HU-17 y HU-57). Datos en src/data/zones.json:
// - `opensOnDay`: la zona está cerrada antes de ese día (la torre, hasta el día 5).
// - La tienda solo se visita en su horario (src/data/shop.json).
// - `closedMessage`: lo que aparece al caminar hacia la puerta cerrada. `{apertura}` se sustituye por la hora
//   a la que abre la tienda, sin ceros delante ("vuelve a las 7").
// - `firstVisit`: aviso que aparece la primera vez que se entra (HU-64), con el horario de un NPC en esa
//   zona: `{desde}` y `{hasta}` se sustituyen por sus horas.
interface ZoneAccess {
  opensOnDay?: number;
  closedMessage?: string;
  firstVisit?: { npc: string; text: string };
}

// Mensaje de la puerta si la zona está cerrada ahora mismo, o null si se puede entrar.
export function closedDoorMessage(zone: ZoneId): string | null {
  const { opensOnDay, closedMessage } = ZONES[zone] as ZoneAccess;
  if (!closedMessage) {
    return null;
  }
  const closed = (opensOnDay !== undefined && getGameState().day < opensOnDay) || (zone === 'tienda' && !isShopOpen());
  return closed ? closedMessage.replace('{apertura}', openingHour()) : null;
}

// Hora de apertura de la tienda tal como se dice: "07:00" es "7" y "07:30" es "7:30".
function openingHour(): string {
  const [hours, minutes] = shop.opensAt.split(':');
  return minutes === '00' ? String(Number(hours)) : `${Number(hours)}:${minutes}`;
}

// HU-70: casas del barrio en las que no se puede entrar. Datos en src/data/houses.json.
export function closedHouse(house: string): { title: string; message: string } {
  return { title: houses.houses[house as keyof typeof houses.houses], message: houses.closedMessage };
}

// HU-64: aviso de la primera visita a una zona, o null si no tiene o ya se había visitado.
export function firstVisitNotice(zone: ZoneId): string | null {
  const { firstVisit } = ZONES[zone] as ZoneAccess;
  const hours = firstVisit && npcHoursIn(firstVisit.npc, zone);
  if (!firstVisit || !hours || getGameState().visitedZones.includes(zone)) {
    return null;
  }
  return firstVisit.text.replace('{desde}', spokenTime(hours.from)).replace('{hasta}', spokenTime(hours.to));
}
