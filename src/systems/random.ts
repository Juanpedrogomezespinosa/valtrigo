// Azar del juego (pesca, HU-48 y HU-49). Todo valor al azar pasa por aquí, para que en desarrollo los tests
// puedan fijar los valores (main.ts expone window.setRandom).

let source: () => number = Math.random;

// Número al azar entre 0 (incluido) y 1 (sin incluir).
export function random(): number {
  return source();
}

// Entero al azar entre `min` y `max`, los dos incluidos.
export function randomInt(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

// Solo para pruebas: los siguientes valores al azar salen de esta lista, en orden y volviendo a empezar.
// Sin valores, vuelve al azar normal.
export function setRandomValues(values: number[]): void {
  let next = 0;
  source = values.length === 0 ? Math.random : () => values[next++ % values.length];
}
