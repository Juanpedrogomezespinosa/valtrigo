import upgrades from '../data/upgrades.json';
import { FISH_BITE_MAX_MS, FISH_BITE_MIN_MS, FISH_REACTION_MS, INVENTORY_SLOTS } from '../config';
import { getGameState } from './gameState';

// Mejoras de la tienda (HU-85). Datos en src/data/upgrades.json. Las compradas se guardan en
// `GameState.upgrades`; no ocupan inventario. La compra está en economy.ts, con el resto de compras.

export interface UpgradeData {
  id: string;
  name: string;
  price: number;
  // Textura del icono en la tienda.
  icon: string;
  // Mochila grande: casillas del inventario.
  inventorySlots?: number;
  // Caña buena: espera hasta "¡Pica!" y tiempo para pulsar E, en milisegundos.
  biteMinMs?: number;
  biteMaxMs?: number;
  reactionMs?: number;
}

export const UPGRADES: UpgradeData[] = upgrades.upgrades;
export const UPGRADE_TEXTS = { tab: upgrades.tab, bought: upgrades.bought, alreadyBought: upgrades.alreadyBought };

function upgrade(id: string): UpgradeData {
  return UPGRADES.find((candidate) => candidate.id === id)!;
}

export function hasUpgrade(id: string): boolean {
  return getGameState().upgrades.includes(id);
}

// Casillas del inventario: 20, o 30 con la Mochila grande (HU-13, HU-15 y HU-85).
export function inventorySlots(): number {
  return hasUpgrade('mochila-grande') ? upgrade('mochila-grande').inventorySlots! : INVENTORY_SLOTS;
}

// Regadera grande: al regar, también se riegan las parcelas de los dos lados.
export function watersSides(): boolean {
  return hasUpgrade('regadera-grande');
}

// Tiempos de la pesca (HU-48): con la Caña buena el pez pica antes y hay más tiempo para pulsar E.
export function fishingTimes(): { biteMinMs: number; biteMaxMs: number; reactionMs: number } {
  if (!hasUpgrade('cana-buena')) {
    return { biteMinMs: FISH_BITE_MIN_MS, biteMaxMs: FISH_BITE_MAX_MS, reactionMs: FISH_REACTION_MS };
  }
  const { biteMinMs, biteMaxMs, reactionMs } = upgrade('cana-buena');
  return { biteMinMs: biteMinMs!, biteMaxMs: biteMaxMs!, reactionMs: reactionMs! };
}
