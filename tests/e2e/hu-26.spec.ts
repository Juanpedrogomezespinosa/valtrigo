import { expect, test } from '@playwright/test';
import {
  activeScenes,
  choosePauseOption,
  clickText,
  currentGameState,
  expectSceneActive,
  isScenePaused,
  openPause,
  sceneTexts,
  startNewGame,
  measureTextVisible,
} from './helpers';

// HU-26. Abrir el menú de pausa

const PAUSE_OPTIONS = ['Continuar', 'Opciones', 'Guardar partida', 'Salir al menú principal'];

test('Escenario 1: Abrir la pausa', async ({ page }) => {
  await startNewGame(page);

  await openPause(page);

  const texts = await sceneTexts(page, 'PauseScene');
  const optionsInOrder = texts.filter((text) => PAUSE_OPTIONS.includes(text));
  expect(optionsInOrder).toEqual(PAUSE_OPTIONS);
  expect(await isScenePaused(page, 'GameScene')).toBe(true);
});

test('Escenario 2: Guardar desde la pausa', async ({ page }) => {
  await startNewGame(page);
  await openPause(page);

  // "Partida guardada" se muestra durante 2 segundos.
  const visibleFor = await measureTextVisible(page, 'PauseScene', 'Partida guardada', () =>
    choosePauseOption(page, 'Guardar partida'),
  );
  expect(visibleFor).toBeGreaterThanOrEqual(1900);
  expect(visibleFor).toBeLessThan(2400);
});

test('Escenario 3: Salir al menú principal sin guardar', async ({ page }) => {
  await startNewGame(page); // partida nueva sin guardar: tiene cambios sin guardar
  await openPause(page);

  await choosePauseOption(page, 'Salir al menú principal');

  expect(await sceneTexts(page, 'PauseScene')).toContain('¿Salir sin guardar? Se perderá el progreso no guardado');

  await clickText(page, 'PauseScene', 'Sí');

  await expectSceneActive(page, 'MenuScene');
  expect(await activeScenes(page)).toEqual(['MenuScene']);
  expect(await currentGameState(page)).toBeNull();
});
