import costs from '../data/energy.json';
import { getGameState } from './gameState';

// Gasto de energía por acción (HU-46) y agotamiento (HU-47). Costes en src/data/energy.json:
// cavar (dig), sembrar (sow), regar (water), cosechar (harvest), lanzar la caña (cast), talar (chop)
// y recoger setas o moras (forage). Andar, hablar, abrir cofres, comprar y vender no gastan energía.

export type WorkAction = keyof typeof costs;

export function energyCost(action: WorkAction): number {
  return costs[action];
}

// Gasta la energía de una acción de trabajo. Si no alcanza, no gasta nada y devuelve false
// (la acción no se hace). Así la energía nunca baja de 0.
export function spendEnergy(action: WorkAction): boolean {
  const state = getGameState();
  const cost = energyCost(action);
  if (state.energy < cost) {
    return false;
  }
  state.energy -= cost;
  return true;
}
