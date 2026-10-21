import shop from '../data/shop.json';
import { getGameState } from './gameState';
import { toMinutes } from './time';
import { addItem, canAdd, getSlots, ITEMS, removeItem, type ItemId } from './inventory';
import { recordSale } from './quests';
import { recordEvent } from './tasks';

// Tienda (HU-17 y HU-18). Todo cambio de dinero por compras y ventas pasa por aquí.
// - Precios de compra en src/data/items.json (`price`). Al vender se recibe el 50 %, salvo los objetos que
//   tienen su propio precio de venta (`sellPrice`): cosechas, la Manzana, peces...  (HU-18).
// - Catálogo y horario en src/data/shop.json. La tienda está abierta desde `opensAt` hasta antes de `closesAt`.

export const SHOP_ITEMS = shop.items as ItemId[];

export function isShopOpen(): boolean {
  const minutes = getGameState().minutes;
  return minutes >= toMinutes(shop.opensAt) && minutes < toMinutes(shop.closesAt);
}

export function buyPrice(item: ItemId): number {
  return ITEMS[item].price ?? 0;
}

export function sellPrice(item: ItemId): number {
  const { price = 0, sellPrice } = ITEMS[item];
  return sellPrice ?? Math.floor(price / 2);
}

export type BuyResult = 'bought' | 'shop-closed' | 'no-money' | 'inventory-full';

export function buy(item: ItemId): BuyResult {
  const state = getGameState();
  if (!isShopOpen()) {
    return 'shop-closed';
  }
  if (state.money < buyPrice(item)) {
    return 'no-money';
  }
  if (!canAdd(item, 1)) {
    return 'inventory-full';
  }
  state.money -= buyPrice(item);
  addItem(item, 1);
  recordEvent(`buy:${item}`); // HU-63
  return 'bought';
}

export type SellResult = 'sold' | 'shop-closed' | 'quest-item' | 'empty';

// Vende una unidad del objeto de una casilla del inventario.
export function sellOne(slotIndex: number): SellResult {
  const slot = getSlots()[slotIndex];
  if (!slot) {
    return 'empty';
  }
  if (!isShopOpen()) {
    return 'shop-closed';
  }
  const item = slot.item as ItemId;
  if (ITEMS[item].questItem) {
    return 'quest-item';
  }
  removeItem(item, 1);
  const state = getGameState();
  state.money += sellPrice(item);
  state.dayStats.moneyEarned += sellPrice(item); // HU-39
  recordSale(item, 1);
  return 'sold';
}
