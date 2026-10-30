import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, MESSAGE_MS } from '../config';
import { playEffect } from '../systems/audio';
import { cook, cookedMessage, COOKING_TEXTS, RECIPES, type Recipe } from '../systems/cooking';
import { countItem, ITEMS } from '../systems/inventory';
import { onConfirmKeys } from '../ui/confirmKeys';
import { showMessage } from '../ui/message';
import { addTitle } from '../ui/title';
import type { OverlaySceneData } from './InventoryScene';

const LIST_LEFT = 200;
const LIST_TOP = 165;
const ROW_HEIGHT = 80;

// Fogón de la casa del jugador (HU-84). Se abre encima de la partida, como el inventario: el tiempo sigue y el
// personaje no se mueve.
// - Cada receta muestra su plato y sus ingredientes con lo que tiene el jugador ("Seta 1/2").
// - ↑ ↓ eligen la receta; E o Enter la cocinan (la pantalla sigue abierta); Escape cierra.
// - Los mensajes salen arriba, porque abajo está la ayuda de las teclas.
export class CookScene extends Phaser.Scene {
  private selected = 0;
  private onClose!: () => void;
  private ingredientTexts: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Text;

  constructor() {
    super('CookScene');
  }

  init(data: OverlaySceneData): void {
    this.onClose = data.onClose;
    this.selected = 0;
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    addTitle(this, COOKING_TEXTS.title, 100);

    this.ingredientTexts = RECIPES.map((recipe, index) => {
      const y = LIST_TOP + index * ROW_HEIGHT;
      this.add.image(LIST_LEFT, y + 14, `objeto-${recipe.dish}`).setScale(2);
      this.add.text(LIST_LEFT + 30, y, ITEMS[recipe.dish].name, { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.text });
      return this.add.text(LIST_LEFT + 30, y + 32, '', { fontFamily: FONT_FAMILY, fontSize: '18px', color: COLORS.text });
    });
    this.cursor = this.add
      .text(LIST_LEFT - 24, 0, '▶', { fontFamily: FONT_FAMILY, fontSize: '24px', color: COLORS.selected })
      .setOrigin(1, 0);
    this.add
      .text(width / 2, height - 50, 'E: cocinar · Escape: cerrar', { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.selected })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-UP', () => this.move(-1));
    keyboard.on('keydown-DOWN', () => this.move(1));
    onConfirmKeys(keyboard, true, () => this.cookSelected());
    keyboard.on('keydown-ESC', () => this.close());

    this.refresh();
  }

  // Estado del fogón, para los tests.
  getState(): { selected: number; recipes: { dish: string; name: string; ingredients: string }[] } {
    return {
      selected: this.selected,
      recipes: RECIPES.map((recipe, index) => ({
        dish: recipe.dish,
        name: ITEMS[recipe.dish].name,
        ingredients: this.ingredientTexts[index].text,
      })),
    };
  }

  // Ingredientes de una receta con lo que tiene el jugador: "Seta 1/2 · Nabo 0/1".
  private ingredientsLine(recipe: Recipe): string {
    return recipe.ingredients.map(({ item, quantity }) => `${ITEMS[item].name} ${countItem(item)}/${quantity}`).join(' · ');
  }

  private move(delta: number): void {
    const index = Phaser.Math.Clamp(this.selected + delta, 0, RECIPES.length - 1);
    if (index !== this.selected) {
      this.selected = index;
      playEffect(this, 'menuNavigate');
      this.refresh();
    }
  }

  private cookSelected(): void {
    const recipe = RECIPES[this.selected];
    const result = cook(recipe);
    if (result === 'cooked') {
      playEffect(this, 'menuConfirm');
      showMessage(this, cookedMessage(recipe), MESSAGE_MS, 'top');
    } else {
      showMessage(this, result === 'missing' ? COOKING_TEXTS.missing : 'Inventario lleno', MESSAGE_MS, 'top');
    }
    this.refresh();
  }

  private close(): void {
    this.scene.stop();
    this.onClose();
  }

  private refresh(): void {
    RECIPES.forEach((recipe, index) => this.ingredientTexts[index].setText(this.ingredientsLine(recipe)));
    this.cursor.setY(LIST_TOP + this.selected * ROW_HEIGHT);
  }
}
