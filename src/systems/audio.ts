import Phaser from 'phaser';
import { VOLUME_BARS } from '../config';
import { LoopingTrack } from './music';
import { getSettings, updateSettings, type Settings } from './settings';

// Efectos de sonido. La clave es la que se usa al cargarlos y la ruta es relativa a public/.
export const SFX = {
  menuNavigate: { key: 'sfx-menu-navegar', path: 'assets/audio/sfx/menu-navegar.wav' },
  menuConfirm: { key: 'sfx-menu-confirmar', path: 'assets/audio/sfx/menu-confirmar.wav' },
  // HU-32: efectos de las acciones principales (Ninja Adventure, ver CREDITOS.md).
  steps: { key: 'sfx-pasos', path: 'assets/audio/sfx/pasos.wav' },
  openMenu: { key: 'sfx-abrir-menu', path: 'assets/audio/sfx/abrir-menu.wav' },
  buy: { key: 'sfx-compra', path: 'assets/audio/sfx/compra.wav' },
  sell: { key: 'sfx-venta', path: 'assets/audio/sfx/venta.wav' },
  chest: { key: 'sfx-cofre', path: 'assets/audio/sfx/cofre.wav' },
  questComplete: { key: 'sfx-encargo-completado', path: 'assets/audio/sfx/encargo-completado.wav' },
  // HU-32: cuadros de diálogo, al escribirse las letras y al pasar al siguiente cuadro con E (generados con
  // tools/generar-efectos.mjs).
  dialogLetter: { key: 'sfx-dialogo-letra', path: 'assets/audio/sfx/dialogo-letra.wav' },
  dialogNext: { key: 'sfx-dialogo-siguiente', path: 'assets/audio/sfx/dialogo-siguiente.wav' },
  // HU-78: las campanas de la torre (generadas con tools/generar-efectos.mjs).
  bellLarge: { key: 'sfx-campana-grande', path: 'assets/audio/sfx/campana-grande.wav' },
  bellMedium: { key: 'sfx-campana-mediana', path: 'assets/audio/sfx/campana-mediana.wav' },
  bellSmall: { key: 'sfx-campana-pequena', path: 'assets/audio/sfx/campana-pequena.wav' },
} as const;

export type SfxName = keyof typeof SFX;

let currentMusic: { key: string; track: LoopingTrack } | null = null;
// Cuántas veces ha empezado a sonar una pista. Sirve para comprobar que la música no se reinicia.
let musicStarts = 0;
let musicVolume: GainNode | null = null;

// Reproduce una música en bucle. Si ya está sonando, no la reinicia,
// para que no se corte al pasar entre pantallas que comparten música.
// Al cambiar de música, la anterior se desvanece mientras entra la nueva.
export function playMusic(scene: Phaser.Scene, key: string): void {
  if (currentMusic?.key === key) {
    return;
  }

  // La música usa el contexto de Web Audio de Phaser, que se activa con el primer gesto del jugador.
  // Si el navegador no tiene Web Audio, el juego sigue sin música.
  const sound = scene.sound;
  if (!(sound instanceof Phaser.Sound.WebAudioSoundManager)) {
    return;
  }

  if (!musicVolume) {
    musicVolume = sound.context.createGain();
    musicVolume.gain.value = getSettings().musicBars / VOLUME_BARS;
    musicVolume.connect(sound.destination);
  }

  const buffer = scene.cache.audio.get(key) as AudioBuffer;
  const track = new LoopingTrack(sound.context, buffer, musicVolume);

  currentMusic?.track.stop();
  track.play();
  currentMusic = { key, track };
  musicStarts++;

  // Se anota en el registro del juego para que los tests sepan qué música suena.
  scene.registry.set('music', key);
}

// Detiene la música al momento (al cerrar el juego).
export function stopMusic(): void {
  currentMusic?.track.stop(0);
  currentMusic = null;
}

// Reproduce un efecto de sonido con el volumen de efectos (HU-29).
export function playEffect(scene: Phaser.Scene, name: SfxName): void {
  scene.sound.play(SFX[name].key, { volume: getSettings().effectBars / VOLUME_BARS });
}

// Aplica las opciones de sonido al instante (HU-28 a HU-30) y las guarda (HU-34).
// El silencio usa el silencio general de Phaser, por el que pasan la música y los efectos:
// así los volúmenes conservan sus valores mientras está activo.
export function changeSoundSettings(game: Phaser.Game, changes: Partial<Settings>): Settings {
  const settings = updateSettings(changes);
  applySoundSettings(game);
  return settings;
}

export function applySoundSettings(game: Phaser.Game): void {
  const settings = getSettings();
  game.sound.mute = settings.muted;
  if (musicVolume) {
    musicVolume.gain.value = settings.musicBars / VOLUME_BARS;
  }
}

// Estado real del audio, para los tests.
export function getAudioState(game: Phaser.Game): {
  musicGain: number | null;
  muted: boolean;
  music: string | null;
  musicStarts: number;
  // Si la salida de sonido del juego está en marcha: Phaser la suspende cuando la página pierde el foco.
  running: boolean;
} {
  const context = (game.sound as Phaser.Sound.WebAudioSoundManager).context;
  return {
    musicGain: musicVolume?.gain.value ?? null,
    muted: game.sound.mute,
    music: currentMusic?.key ?? null,
    musicStarts,
    running: context?.state === 'running',
  };
}

// HU-31: reproduce la música de una zona. Las pistas pesan varios MB, así que cada una se descarga
// la primera vez que se entra en su zona; mientras tanto sigue sonando la anterior.
export function playZoneMusic(scene: Phaser.Scene, key: string, path: string): void {
  if (scene.cache.audio.exists(key)) {
    playMusic(scene, key);
    return;
  }
  scene.load.audio(key, path);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    // Si mientras tanto se ha salido de la partida, no se pone la música.
    if (scene.sys.isActive()) {
      playMusic(scene, key);
    }
  });
  scene.load.start();
}
