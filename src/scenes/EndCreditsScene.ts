import Phaser from 'phaser';
import credits from '../data/endCredits.json';
import { COLORS, FONT_FAMILY, NIGHT_COLOR, NIGHT_MAX_ALPHA, TILE_SIZE, WORLD_ZOOM } from '../config';
import { musicElapsed, playZoneMusic } from '../systems/audio';
import { mapKey, type ZoneId } from '../systems/zones';

// Créditos finales (HU-88): una cinemática por la plaza mientras arranca la canción y, después, los nombres
// uno a uno sobre el pueblo oscurecido. Todo lo que se ve depende solo del segundo de la canción en el que se está
// (`elapsed`), así que la imagen sigue a la música aunque el equipo vaya lento.
// Se abren desde el menú principal (HU-35) y al cerrar el mensaje de final (HU-37). Escape los salta.

export type EndCreditsSceneData = {
  // Se ejecuta al terminar la canción o al saltar los créditos.
  onFinish: (scene: Phaser.Scene) => void;
};

type Card = { role: string; name: string };

const SHEET_COLUMNS = 4; // hojas de personajes de Ninja Adventure: abajo, arriba, izquierda y derecha
const FADE_IN = 3; // segundos: fundido desde negro al empezar
const FADE_OUT = 3; // segundos: fundido a negro al terminar
const NIGHT_UNTIL = 20; // segundo en el que ya es de día
const TITLE = { in: 26.5, out: 32 }; // el título aparece al llegar a la torre y se va antes de los nombres
const DIM_ALPHA = 0.7; // oscurecimiento del pueblo detrás de los nombres
const CARD_FADE = 1.2; // segundos de fundido de cada nombre

const { cinematic } = credits;

export class EndCreditsScene extends Phaser.Scene {
  private onFinish!: EndCreditsSceneData['onFinish'];
  private cards: Card[] = [];
  private finished = false;
  private musicReady = false;
  private readyAt = 0; // hora de la escena en que se pudo empezar (si no hay reloj de audio)
  private world: Phaser.GameObjects.GameObject[] = [];
  private night!: Phaser.GameObjects.Rectangle;
  private dim!: Phaser.GameObjects.Rectangle;
  private black!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private role!: Phaser.GameObjects.Text;
  private name!: Phaser.GameObjects.Text;
  private walker: { sprite: Phaser.GameObjects.Sprite; x: number; walkTo: number; from: number; to: number } | null = null;

  constructor() {
    super('EndCreditsScene');
  }

  init(data: EndCreditsSceneData): void {
    this.onFinish = data.onFinish;
    this.finished = false;
    this.musicReady = false;
    this.world = [];
    this.walker = null;
    this.cards = credits.sections.flatMap((section) => section.names.map((name) => ({ role: section.role, name })));
  }

  create(): void {
    const { width, height } = this.scale;

    // El pueblo, con su cámara ampliada como en la partida.
    const map = this.make.tilemap({ key: mapKey(cinematic.zone as ZoneId) });
    const tiles = [
      map.addTilesetImage('kenney-tiny-town', 'tiles-town')!,
      map.addTilesetImage('kenney-tiny-dungeon', 'tiles-dungeon')!,
      map.addTilesetImage('agua', 'tiles-agua')!,
    ];
    this.world.push(map.createLayer('suelo', tiles)!, map.createLayer('obstaculos', tiles)!);
    for (const character of cinematic.characters) {
      const sprite = this.add.sprite(tileCenter(character.x), tileCenter(character.y), character.id, 0);
      this.world.push(sprite);
      // Un personaje con `walkTo` cruza la plaza hacia la derecha entre los segundos `from` y `to`.
      const { walkTo, from, to } = character as { walkTo?: number; from?: number; to?: number };
      if (walkTo !== undefined && from !== undefined && to !== undefined) {
        this.walker = { sprite, x: character.x, walkTo, from, to };
        this.createWalkRight(character.id);
      }
    }
    const camera = this.cameras.main;
    camera.setZoom(WORLD_ZOOM).setBounds(0, 0, map.widthInPixels, map.heightInPixels).setRoundPixels(true);
    camera.setBackgroundColor('#000000');

    // Encima, sin ampliar: la noche, el oscurecimiento de los nombres, los textos y el negro de los fundidos.
    this.night = this.add.rectangle(0, 0, width, height, NIGHT_COLOR).setOrigin(0);
    this.dim = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setAlpha(0);
    const shadow = { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true };
    this.title = this.add
      .text(width / 2, height / 2, credits.title, { fontFamily: FONT_FAMILY, fontSize: '72px', color: COLORS.text, shadow })
      .setOrigin(0.5)
      .setName('titulo');
    this.role = this.add
      .text(width / 2, height / 2 - 34, '', { fontFamily: FONT_FAMILY, fontSize: '26px', color: COLORS.selected, shadow })
      .setOrigin(0.5)
      .setName('papel');
    this.name = this.add
      .text(width / 2, height / 2 + 14, '', { fontFamily: FONT_FAMILY, fontSize: '40px', color: COLORS.text, shadow })
      .setOrigin(0.5)
      .setName('nombre');
    const hint = this.add
      .text(width - 20, height - 16, 'Escape: saltar', { fontFamily: FONT_FAMILY, fontSize: '16px', color: COLORS.text })
      .setOrigin(1, 1)
      .setAlpha(0.8);
    this.black = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
    const overlay = [this.night, this.dim, this.title, this.role, this.name, hint, this.black];

    const ui = this.cameras.add(0, 0, width, height);
    camera.ignore(overlay);
    ui.ignore(this.world);

    // La canción empieza desde el principio. Si aún no se ha descargado, la pantalla espera en negro.
    const { key, path } = credits.music;
    const markReady = () => {
      this.musicReady = true;
      this.readyAt = this.time.now;
    };
    if (this.cache.audio.exists(key)) {
      markReady();
    } else {
      this.load.once(Phaser.Loader.Events.COMPLETE, markReady);
    }
    playZoneMusic(this, key, path);

    this.input.keyboard!.on('keydown-ESC', () => this.finish());
    this.update();
  }

  update(): void {
    if (this.finished) return;
    const t = this.elapsed();
    const duration = this.duration();
    if (t >= duration) {
      this.finish();
      return;
    }

    this.moveCamera(t);
    this.moveWalker(t);

    const intro = credits.introSeconds;
    this.night.setAlpha(NIGHT_MAX_ALPHA * (1 - clamp01(t / NIGHT_UNTIL)));
    this.dim.setAlpha(DIM_ALPHA * clamp01((t - (intro - 1)) / 2));
    this.black.setAlpha(this.musicReady ? Math.max(1 - t / FADE_IN, clamp01((t - (duration - FADE_OUT)) / FADE_OUT)) : 1);
    this.title.setAlpha(fadeWindow(t, TITLE.in, TITLE.out, 1.5));

    const card = this.cardAt(t);
    this.role.setVisible(card !== null);
    this.name.setVisible(card !== null);
    if (card) {
      this.role.setText(card.card.role).setAlpha(card.alpha);
      this.name.setText(card.card.name).setAlpha(card.alpha);
    }
  }

  // --- Para los tests ---

  // Los nombres en el orden en que aparecen, con su papel.
  getCards(): Card[] {
    return this.cards;
  }

  // El nombre que se ve ahora, o null durante la cinemática y entre dos nombres.
  getVisibleCard(): Card | null {
    return this.cardAt(this.elapsed())?.card ?? null;
  }

  getElapsed(): number {
    return this.elapsed();
  }

  // --- Línea de tiempo ---

  // Segundo de la canción. Si hay reloj de audio, se usa ese; si no (el navegador no tiene Web Audio), el de la escena.
  private elapsed(): number {
    const fromMusic = musicElapsed(this, credits.music.key);
    if (fromMusic !== null) return fromMusic;
    return this.musicReady ? (this.time.now - this.readyAt) / 1000 : 0;
  }

  private duration(): number {
    const buffer = this.cache.audio.get(credits.music.key) as AudioBuffer | undefined;
    return buffer?.duration ?? credits.music.seconds;
  }

  // Cada nombre tiene el mismo tiempo, desde que acaba la cinemática hasta el fundido final. El último se queda
  // hasta el final de la canción.
  private cardAt(t: number): { card: Card; alpha: number } | null {
    const start = credits.introSeconds;
    if (t < start) return null;
    const end = this.duration() - FADE_OUT;
    const slot = (end - start) / this.cards.length;
    const index = Math.min(Math.floor((t - start) / slot), this.cards.length - 1);
    const from = start + index * slot;
    const to = index === this.cards.length - 1 ? Infinity : from + slot;
    const alpha = fadeWindow(t, from, to, CARD_FADE);
    return alpha > 0 ? { card: this.cards[index], alpha } : null;
  }

  private moveCamera(t: number): void {
    const path = cinematic.path;
    let next = path.findIndex((point) => point.at > t);
    if (next === -1) next = path.length - 1;
    const a = path[Math.max(0, next - 1)];
    const b = path[next];
    const progress = b.at === a.at ? 1 : clamp01((t - a.at) / (b.at - a.at));
    const eased = (1 - Math.cos(progress * Math.PI)) / 2;
    this.cameras.main.centerOn(tileCenter(a.x + (b.x - a.x) * eased), tileCenter(a.y + (b.y - a.y) * eased));
  }

  private moveWalker(t: number): void {
    if (!this.walker) return;
    const { sprite, x, walkTo, from, to } = this.walker;
    const progress = clamp01((t - from) / (to - from));
    sprite.setX(tileCenter(x + (walkTo - x) * progress));
    const walking = progress > 0 && progress < 1;
    if (walking && !sprite.anims.isPlaying) sprite.play(`${sprite.texture.key}-creditos-derecha`);
    if (!walking && sprite.anims.isPlaying) sprite.anims.stop();
    sprite.setVisible(progress < 1);
  }

  private createWalkRight(texture: string): void {
    const key = `${texture}-creditos-derecha`;
    if (this.anims.exists(key)) return;
    const right = 3;
    const frames = [0, 1, 2, 3].map((row) => row * SHEET_COLUMNS + right);
    this.anims.create({ key, frames: this.anims.generateFrameNumbers(texture, { frames }), frameRate: 8, repeat: -1 });
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.onFinish(this);
  }
}

function tileCenter(tile: number): number {
  return tile * TILE_SIZE + TILE_SIZE / 2;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// Opacidad de algo que se ve entre `from` y `to`, con un fundido de `fade` segundos al entrar y al salir.
function fadeWindow(t: number, from: number, to: number, fade: number): number {
  return clamp01(Math.min((t - from) / fade, (to - t) / fade));
}
