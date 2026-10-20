import items from '../data/items.json';
import { INVENTORY_SLOTS, MAX_ENERGY, MAX_STACK } from '../config';
import { getGameState, type InventoryItem } from './gameState';

// Inventario (HU-13, HU-14 y HU-15). Todo cambio en el inventario pasa por aquí.
// El inventario es la lista de casillas ocupadas, en orden. Cada casilla guarda un objeto y su cantidad.

export type ItemId = keyof typeof items;

export const ITEMS = items;

export function getSlots(): InventoryItem[] {
  return getGameState().inventory;
}

export function countItem(item: ItemId): number {
  return getSlots()
    .filter((slot) => slot.item === item)
    .reduce((total, slot) => total + slot.quantity, 0);
}

// Indica si caben `quantity` unidades: primero en las casillas del mismo objeto que no estén llenas
// y, si no basta, en casillas libres.
export function canAdd(item: ItemId, quantity: number): boolean {
  const slots = getSlots();
  const partialSpace = slots
    .filter((slot) => slot.item === item)
    .reduce((space, slot) => space + (MAX_STACK - slot.quantity), 0);
  const freeSpace = (INVENTORY_SLOTS - slots.length) * MAX_STACK;
  return partialSpace + freeSpace >= quantity;
}

// Añade objetos al inventario. Si no caben todos, no se añade ninguno y devuelve false.
export function addItem(item: ItemId, quantity: number): boolean {
  if (!canAdd(item, quantity)) {
    return false;
  }

  const slots = getSlots();
  let remaining = quantity;
  for (const slot of slots) {
    if (slot.item === item && slot.quantity < MAX_STACK) {
      const added = Math.min(MAX_STACK - slot.quantity, remaining);
      slot.quantity += added;
      remaining -= added;
    }
  }
  while (remaining > 0) {
    const added = Math.min(MAX_STACK, remaining);
    slots.push({ item, quantity: added });
    remaining -= added;
  }
  return true;
}

// Quita objetos del inventario, empezando por las últimas casillas. Las casillas que se quedan a 0 desaparecen.
export function removeItem(item: ItemId, quantity: number): boolean {
  if (countItem(item) < quantity) {
    return false;
  }

  const slots = getSlots();
  let remaining = quantity;
  for (let index = slots.length - 1; index >= 0 && remaining > 0; index--) {
    const slot = slots[index];
    if (slot.item !== item) {
      continue;
    }
    const removed = Math.min(slot.quantity, remaining);
    slot.quantity -= removed;
    remaining -= removed;
    if (slot.quantity === 0) {
      slots.splice(index, 1);
    }
  }
  return true;
}

export type UseResult = 'used' | 'energy-full' | 'not-usable' | 'empty';

// HU-14: usa el objeto de una casilla. Una Manzana recupera energía sin pasar del máximo;
// con la energía al máximo no se consume. Los objetos no consumibles no se pueden usar.
export function useSlot(index: number): UseResult {
  const slot = getSlots()[index];
  if (!slot) {
    return 'empty';
  }

  const data = ITEMS[slot.item as ItemId];
  if (!data.consumable) {
    return 'not-usable';
  }

  const state = getGameState();
  if (state.energy >= MAX_ENERGY) {
    return 'energy-full';
  }

  state.energy = Math.min(MAX_ENERGY, state.energy + ('energy' in data ? data.energy : 0));
  slot.quantity -= 1;
  if (slot.quantity === 0) {
    getSlots().splice(index, 1);
  }
  return 'used';
}
