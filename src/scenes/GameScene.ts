import Phaser from 'phaser';
import { WORLD_ZOOM } from '../config';
import { Player } from '../entities/Player';
import { getGameState } from '../systems/gameState';
import { mapKey } from '../systems/zones';

// Escena de juego: dibuja la zona actual y al personaje.
export class GameScene extends Phaser.Scene {
  player!: Player;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const state = getGameState();

    const map = this.make.tilemap({ key: mapKey(state.zone) });
    const tiles = [
      map.addTilesetImage('kenney-tiny-town', 'tiles-town')!,
      map.addTilesetImage('kenney-tiny-dungeon', 'tiles-dungeon')!,
    ];
    map.createLayer('suelo', tiles);
    // Todo lo que hay en la capa "obstaculos" es sólido (HU-07).
    const obstacles = map.createLayer('obstaculos', tiles)!;
    obstacles.setCollisionByExclusion([-1]);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, state.position);
    this.player.setObstacles(obstacles);
    this.physics.add.collider(this.player, obstacles);

    this.setUpCamera(map.widthInPixels, map.heightInPixels);

    // Escape abre el menú de pausa y detiene la partida (HU-26).
    // Con la pausa abierta el personaje no se mueve (HU-06).
    this.input.keyboard!.on('keydown-ESC', () => {
      this.player.stand();
      this.scene.pause();
      this.scene.launch('PauseScene');
    });

    // Las teclas que se soltaron durante la pausa no llegan a esta escena:
    // al reanudar se dan todas por sueltas para que el personaje no siga andando solo.
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.input.keyboard!.resetKeys());
  }

  // HU-09: la cámara sigue al personaje y lo mantiene centrado, pero se detiene en los bordes del mapa.
  // En un eje en el que el mapa es más pequeño que la vista, los límites se amplían hasta el tamaño
  // de la vista y se centran sobre el mapa: la cámara no se mueve en ese eje y la zona se ve centrada.
  private setUpCamera(mapWidth: number, mapHeight: number): void {
    const camera = this.cameras.main;
    camera.setZoom(WORLD_ZOOM);
    camera.setRoundPixels(true);

    const viewWidth = camera.width / WORLD_ZOOM;
    const viewHeight = camera.height / WORLD_ZOOM;
    const boundsWidth = Math.max(mapWidth, viewWidth);
    const boundsHeight = Math.max(mapHeight, viewHeight);
    camera.setBounds((mapWidth - boundsWidth) / 2, (mapHeight - boundsHeight) / 2, boundsWidth, boundsHeight);
    camera.startFollow(this.player, true);
  }

  update(): void {
    this.player.update();
    getGameState().position = this.player.getTilePosition();
  }
}
