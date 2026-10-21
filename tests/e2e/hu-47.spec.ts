import { test } from './fixtures';

// HU-47. Agotamiento
// Los tres escenarios necesitan una acción de trabajo; la primera que existirá es cavar (HU-41, fase de cultivo).
// La lógica ya está en src/systems/energy.ts y GameScene.work(): hay que activarlos al implementar HU-41.

test.fixme('Escenario 1: Energía insuficiente', async () => {
  // Continuar en la granja con 3 de energía y una Pala, junto a una parcela sin cavar. Pulsar E:
  // aparece "Estás demasiado cansado", la parcela sigue sin cavar y la energía sigue siendo 3.
});

test.fixme('Escenario 2: Energía justa', async () => {
  // Igual, con 4 de energía. Pulsar E: la parcela queda cavada y la energía es 0.
});

test.fixme('Escenario 3: Recuperarse comiendo', async () => {
  // Continuar en la granja con 0 de energía, una Pala y una Manzana, junto a una parcela sin cavar.
  // Abrir el inventario (I) y usar la Manzana (Enter): la energía sube (15).
  // Cerrar el inventario y pulsar E junto a la parcela: queda cavada y la energía es 11.
});
