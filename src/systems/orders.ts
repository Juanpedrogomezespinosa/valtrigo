import orders from '../data/orders.json';
import { getGameState } from './gameState';
import { addItem, canAdd, countItem, ITEMS, removeItem, type ItemId } from './inventory';

// Pedidos del tablón de anuncios (HU-52 a HU-54). Datos en src/data/orders.json: un pedido por día, del día 1
// al 6, y a partir del día 7 se repite la lista. Cada pedido se identifica por el día en que se ofreció.
// Son independientes de los encargos principales (HU-53): no cuentan como encargo activo.

export const BOARD_NAME = orders.board;
export const MAX_ACTIVE_ORDERS = 3;

export type Order = (typeof orders.orders)[number] & { day: number };

// El pedido que se ofrece un día.
export function orderForDay(day: number): Order {
  return { ...orders.orders[(day - 1) % orders.orders.length], day };
}

export function activeOrders(): Order[] {
  return getGameState().activeOrders.map(orderForDay);
}

// Lo que muestra hoy el tablón: el pedido, que ya se aceptó hoy o que no caben más pedidos.
export function todayOrderStatus(): 'available' | 'accepted' | 'full' {
  const state = getGameState();
  if (state.acceptedOrderDays.includes(state.day)) return 'accepted';
  if (state.activeOrders.length >= MAX_ACTIVE_ORDERS) return 'full';
  return 'available';
}

export function acceptTodayOrder(): void {
  const state = getGameState();
  if (todayOrderStatus() === 'available') {
    state.activeOrders.push(state.day);
    state.acceptedOrderDays.push(state.day);
  }
}

// Texto del pedido en el tablón: título, qué pide y la recompensa.
export function orderText(order: Order): string {
  const rewards = [`${order.reward.money} monedas`];
  for (const { item, quantity } of order.reward.items) {
    const { name, plural } = ITEMS[item as ItemId];
    rewards.push(quantity === 1 ? name : `${quantity} ${plural}`);
  }
  return `${order.title}. ${order.description} Recompensa: ${rewards.join(' y ')}.`;
}

// Pedidos activos con todos sus objetos en el inventario.
export function deliverableOrders(): Order[] {
  return activeOrders().filter((order) => order.items.every(({ item, quantity }) => countItem(item as ItemId) >= quantity));
}

// HU-54: si la recompensa cabe en el inventario tal y como está, entrega los objetos, cobra la recompensa y
// el pedido deja de estar activo. Si no cabe, devuelve false y no cambia nada.
export function deliverOrder(order: Order): boolean {
  if (!order.reward.items.every(({ item, quantity }) => canAdd(item as ItemId, quantity))) {
    return false;
  }
  const state = getGameState();
  for (const { item, quantity } of order.items) {
    removeItem(item as ItemId, quantity);
  }
  state.money += order.reward.money;
  state.dayStats.moneyEarned += order.reward.money; // HU-39
  for (const { item, quantity } of order.reward.items) {
    addItem(item as ItemId, quantity);
  }
  state.activeOrders = state.activeOrders.filter((day) => day !== order.day);
  return true;
}
