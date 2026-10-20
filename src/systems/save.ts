// Sistema de guardado. Todo acceso a localStorage pasa por aquí.

// Indica si existe una partida guardada.
// Pendiente: se implementa en HU-02/HU-03. De momento nunca hay partida guardada.
export function hasSavedGame(): boolean {
  return false;
}

// Indica si hay una partida en curso en esta sesión.
// Pendiente: se implementa en HU-02/HU-04. De momento nunca hay partida en curso.
export function hasGameInProgress(): boolean {
  return false;
}
