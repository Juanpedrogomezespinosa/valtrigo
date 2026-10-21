import { isShopOpen } from './economy';
import { getGameState } from './gameState';
import { ZONES, type ZoneId } from './zones';

// Edificios que no siempre se pueden visitar (HU-17 y HU-57). Datos en src/data/zones.json:
// - `opensOnDay`: la zona está cerrada antes de ese día (la torre, hasta el día 5).
// - La tienda solo se visita en su horario (src/data/shop.json).
// - `closedMessage`: lo que aparece al caminar hacia la puerta cerrada.
interface ZoneAccess {
  opensOnDay?: number;
  closedMessage?: string;
}

// Mensaje de la puerta si la zona está cerrada ahora mismo, o null si se puede entrar.
export function closedDoorMessage(zone: ZoneId): string | null {
  const { opensOnDay, closedMessage } = ZONES[zone] as ZoneAccess;
  if (!closedMessage) {
    return null;
  }
  const closed = (opensOnDay !== undefined && getGameState().day < opensOnDay) || (zone === 'tienda' && !isShopOpen());
  return closed ? closedMessage : null;
}
