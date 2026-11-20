import recipes from '../data/recipes.json';
import { getGameState } from './gameState';
import { addItem, canAdd, countItem, ITEMS, removeItem, type ItemId } from './inventory';
import { recordEvent } from './tasks';

// Cocina (HU-84). Las recetas están en src/data/recipes.json: cada una da un plato con sus ingredientes.

export interface Recipe {
  dish: ItemId;
  ingredients: { item: ItemId; quantity: number }[];
}

export const RECIPES = recipes.recipes as Recipe[];
export const COOKING_TEXTS = { title: recipes.title, missing: recipes.missing };

export function cookedMessage(recipe: Recipe): string {
  return recipes.cooked.replace('{plato}', ITEMS[recipe.dish].name);
}

export function hasIngredients(recipe: Recipe): boolean {
  return recipe.ingredients.every(({ item, quantity }) => countItem(item) >= quantity);
}

export type CookResult = 'cooked' | 'missing' | 'inventory-full';

// Cocina un plato. Si faltan ingredientes, o el plato no cabe ni con las casillas que dejan libres los
// ingredientes, no se gasta nada.
export function cook(recipe: Recipe): CookResult {
  if (!hasIngredients(recipe)) {
    return 'missing';
  }
  const state = getGameState();
  const before = state.inventory.map((slot) => ({ ...slot }));
  recipe.ingredients.forEach(({ item, quantity }) => removeItem(item, quantity));
  if (!canAdd(recipe.dish, 1)) {
    state.inventory = before;
    return 'inventory-full';
  }
  addItem(recipe.dish, 1);
  recordEvent('cook'); // HU-63
  return 'cooked';
}
