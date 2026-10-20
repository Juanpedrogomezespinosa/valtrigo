import Phaser from 'phaser';
import { DEFAULT_MUSIC_VOLUME, DEFAULT_SFX_VOLUME } from '../config';
import { LoopingTrack } from './music';

// Efectos de sonido. La clave es la que se usa al cargarlos y la ruta es relativa a public/.
export const SFX = {
  menuNavigate: { key: 'sfx-menu-navegar', path: 'assets/audio/sfx/menu-navegar.wav' },
  menuConfirm: { key: 'sfx-menu-confirmar', path: 'assets/audio/sfx/menu-confirmar.wav' },
} as const;

export type SfxName = keyof typeof SFX;

let currentMusic: { key: string; track: LoopingTrack } | null = null;
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
    musicVolume.gain.value = DEFAULT_MUSIC_VOLUME;
    musicVolume.connect(sound.destination);
  }

  const buffer = scene.cache.audio.get(key) as AudioBuffer;
  const track = new LoopingTrack(sound.context, buffer, musicVolume);

  currentMusic?.track.stop();
  track.play();
  currentMusic = { key, track };

  // Se anota en el registro del juego para que los tests sepan qué música suena.
  scene.registry.set('music', key);
}

// Reproduce un efecto de sonido con el volumen de efectos.
export function playEffect(scene: Phaser.Scene, name: SfxName): void {
  scene.sound.play(SFX[name].key, { volume: DEFAULT_SFX_VOLUME });
}
