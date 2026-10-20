import { DEFAULT_EFFECT_BARS, DEFAULT_MUSIC_BARS, VOLUME_BARS } from '../config';

// Opciones de sonido (HU-28, HU-29, HU-30 y HU-34): volumen de música y de efectos (0 a 10 barras)
// y silencio. Se guardan en el navegador y se cargan al abrir el juego. Si el navegador no permite
// guardar, el juego funciona igual, pero los ajustes no se conservan.

export interface Settings {
  musicBars: number;
  effectBars: number;
  muted: boolean;
}

const SETTINGS_KEY = 'valtrigo.opciones';

let current: Settings = defaults();

function defaults(): Settings {
  return { musicBars: DEFAULT_MUSIC_BARS, effectBars: DEFAULT_EFFECT_BARS, muted: false };
}

const clampBars = (bars: number) => Math.min(VOLUME_BARS, Math.max(0, Math.round(bars)));

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    current = {
      musicBars: clampBars(saved.musicBars ?? DEFAULT_MUSIC_BARS),
      effectBars: clampBars(saved.effectBars ?? DEFAULT_EFFECT_BARS),
      muted: saved.muted ?? false,
    };
  } catch {
    current = defaults();
  }
  return getSettings();
}

export function getSettings(): Settings {
  return { ...current };
}

// Cambia los ajustes y los guarda. Devuelve los ajustes resultantes.
export function updateSettings(changes: Partial<Settings>): Settings {
  current = {
    musicBars: clampBars(changes.musicBars ?? current.musicBars),
    effectBars: clampBars(changes.effectBars ?? current.effectBars),
    muted: changes.muted ?? current.muted,
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch {
    // Sin almacenamiento: el ajuste se aplica igual, pero no se conservará al volver a abrir el juego.
  }
  return getSettings();
}
