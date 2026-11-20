import Phaser from 'phaser';

// Teclas para confirmar: Enter y, dentro de la partida, también E, la tecla de las acciones (decisión del autor).
// Solo cuentan las pulsaciones posteriores a este momento: la E que abre una pantalla (la cama, la tienda...)
// también llega a ella y no debe confirmar nada nada más abrirse.
// Devuelve una función que quita los manejadores.
export function onConfirmKeys(
  keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
  withE: boolean,
  handler: () => void,
): () => void {
  const since = performance.now();
  const listener = (event: KeyboardEvent) => {
    if (event.timeStamp < since) return;
    // La tecla que confirma no llega a las escenas de debajo. Tras un cambio de zona, GameScene recibe las teclas
    // después de HudScene: sin esto, la E que contesta "No" cerraba el cuadro y GameScene lo volvía a abrir.
    event.stopPropagation();
    handler();
  };
  const events = withE ? ['keydown-ENTER', 'keydown-E'] : ['keydown-ENTER'];
  events.forEach((name) => keyboard.on(name, listener));
  return () => events.forEach((name) => keyboard.off(name, listener));
}
