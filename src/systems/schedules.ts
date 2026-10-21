import schedules from '../data/schedules.json';
import { getGameState } from './gameState';
import { toMinutes } from './time';
import type { ZoneId } from './zones';

// Horario de los NPC (HU-40). Datos en src/data/schedules.json: en qué zona está cada NPC y de qué hora
// a qué hora (desde `from` hasta antes de `to`). Fuera de su horario no está en ninguna zona.
// La vendedora no tiene horario: está siempre en la tienda, que solo se puede visitar en su horario (HU-17).

interface ScheduleEntry {
  zone: string;
  from: string;
  to: string;
}

const SCHEDULES: Record<string, ScheduleEntry[]> = schedules;

// Indica si el NPC está ahora en la zona. Los NPC sin horario están siempre en su zona.
export function isNpcInZone(npc: string, zone: ZoneId, minutes = getGameState().minutes): boolean {
  const schedule = SCHEDULES[npc];
  if (!schedule) {
    return true;
  }
  return schedule.some((entry) => entry.zone === zone && minutes >= toMinutes(entry.from) && minutes < toMinutes(entry.to));
}
