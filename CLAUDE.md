# Valtrigo

Juego de navegador en 2D, estilo Stardew Valley / Pokémon, de unas 2 horas.
Es un proyecto público con un fin doble: servir de base para un curso de testing manual de videojuegos y mostrar un ejemplo de trabajo de QA. Por eso el código debe ser legible y los requisitos deben ser la fuente de verdad.

## Stack

- Phaser 3 + TypeScript + Vite
- Sin backend. Guardado en localStorage.
- Tests end-to-end con Playwright.

## Comandos

- `npm run dev`: servidor de desarrollo
- `npm run build`: compilación para publicar en dist/
- `npm test`: tests Playwright

## Reglas

- Las historias de usuario de docs/requisitos/ son la fuente de verdad. Si algo no está claro, pregunta antes de decidir.
- Cada historia tiene un test en tests/e2e/ con el mismo ID (HU-01, HU-02...), con un test por escenario.
- Los tests describen el requisito. Nunca los modifiques ni los relajes para que pasen si el juego incumple una historia.
- No añadas funcionalidades que no estén en las historias.
- No introduzcas bugs salvo cuando se pida explícitamente en la fase de siembra. El catálogo de bugs está en docs/bugs.md.
- Los datos del juego (objetos, encargos, diálogos) van en src/data/, nunca escritos a mano dentro de las escenas.

## Decisiones tomadas

(Se irán añadiendo aquí las decisiones que no estén en las historias.)

- Resolución interna de 960×540 (16:9), definida en src/config.ts. Phaser la escala con `Scale.FIT` y la centra, sin deformarla. `pixelArt: true` para que los sprites no se vean borrosos al escalar.
- `npm run build` ejecuta `tsc` antes de `vite build`, para que un error de tipos haga fallar la compilación.
- `base: './'` en vite.config.ts, para que dist/ funcione aunque se publique en una subruta.
- Los tests de Playwright arrancan el servidor de desarrollo (`npm run dev`, puerto 5173 fijo) y se ejecutan solo en Chromium.
- En desarrollo, main.ts expone la instancia del juego en `window.game` para que los tests consulten el estado de las escenas. En la build de producción no se expone.
- tests/e2e/arranque.spec.ts es una comprobación del entorno y no corresponde a ninguna historia.

### Menú principal (HU-01)

- Los navegadores no dejan reproducir audio hasta la primera interacción del jugador. En el juego real la música del menú empieza con la primera tecla o clic. Para poder comprobar la música, Playwright lanza Chromium con `--autoplay-policy=no-user-gesture-required`.
- La música del menú sigue sonando, sin reiniciarse, al pasar a Opciones o Créditos y al volver.
- Al abrir el juego aparece seleccionada "Nueva partida".
- Las flechas recorren todas las opciones, también las desactivadas, y se detienen en la primera y en la última (no dan la vuelta).
- Una opción desactivada se muestra en gris (#8c978e, contraste 4,9:1) y se puede seleccionar, pero Enter o un clic sobre ella no hacen nada.
- Las opciones también se activan con un clic del ratón. Un clic selecciona la opción y la activa.
- Los colores de la interfaz están en `COLORS` (src/config.ts), con su contraste sobre el fondo anotado.
- En OptionsScene y CreditsScene el botón "Volver" responde a clic, Enter y Escape, y el menú vuelve con la opción de la que se venía seleccionada.
- Hasta sus historias, "Nueva partida" (HU-02), "Continuar" (HU-03), "Guardar partida" (HU-04) y "Salir" (HU-05) no hacen nada al activarse.
- El escenario 2 de HU-01 está marcado como `test.fixme` porque depende de la partida guardada (HU-02/HU-03). Hay que activarlo al implementar HU-03.

- La música en bucle usa crossfade por código (systems/music.ts, clase LoopingTrack con Web Audio).
  Los archivos de public/assets/audio/ no se recortan ni se editan.
- LoopingTrack usa el AudioContext de Phaser, que se crea al arrancar y queda suspendido hasta el primer gesto del usuario. Phaser lo reanuda solo.
- La música sale por un nodo de volumen propio (systems/audio.ts) conectado a la salida de Phaser, para que el volumen y el silencio de HU-28 a HU-30 se apliquen en un único punto.
- Al cambiar de música, la anterior se desvanece en 2 segundos mientras entra la nueva (el mismo solapamiento que entre vueltas).
- Créditos de la música (para HU-35): todas las pistas de public/assets/audio/ son de Juanpe Gómez, generadas con IA (Flow, de Google).
- BootScene solo carga menu.mp3. Cada pista pesa unos 3-4 MB, así que la música de cada zona se cargará con su zona (HU-31).
- systems/audio.ts anota la música que suena en `game.registry` ('music') para que los tests puedan comprobarla.

### Efectos de sonido (HU-32)

- Se han añadido a HU-32 dos criterios y los escenarios 5 y 6: efecto de navegación al cambiar de opción en un menú y efecto de confirmación al activar una opción. Las opciones desactivadas no suenan, para no contradecir el escenario 4 de HU-01 ("no ocurre nada").
- **Los efectos son provisionales.** Se generan por código con `node tools/generar-efectos.mjs`, que escribe archivos WAV en public/assets/audio/sfx/. Para cambiar uno por un archivo definitivo, basta con sustituir el WAV o la ruta en `SFX` (src/systems/audio.ts).
- Los efectos se cargan en BootScene a partir de la lista `SFX` de systems/audio.ts y se reproducen con `playEffect()`, con el volumen `DEFAULT_SFX_VOLUME` hasta HU-29.
- Si la flecha no cambia la selección (por ejemplo, arriba en la primera opción), no suena nada.
- Con el ratón, un clic en una opción solo reproduce el efecto de confirmación, no el de navegación.
- "Volver" (con clic, Enter o Escape) reproduce el efecto de confirmación.
- Los escenarios 1 a 4 de HU-32 están como `test.fixme` hasta que existan sus historias (HU-06, HU-17, HU-12 y HU-20).

### Mundo y gráficos

- Gráficos: paquetes Tiny Town y Tiny Dungeon de Kenney (CC0), casillas de 16×16. Están en public/assets/tilesets/ y public/assets/sprites/, sin modificar. public/assets/CREDITOS.md recoge el autor y la licencia de cada recurso (para HU-35).
- Mapas en formato Tiled (JSON) en public/assets/maps/, con tres capas: `suelo`, `obstaculos` (todo lo que hay en ella será sólido en HU-07) y `puntos` (objetos con nombre, como `inicio`).
- `node tools/generar-mapas.mjs` genera la versión inicial de los mapas. Después se pueden retocar en Tiled; volver a ejecutar el script sobrescribe esos cambios.
- Las 6 zonas son: exterior del pueblo (`plaza`, zona inicial), casa del jugador, tienda, granja (con el granero), lago y torre. Cada zona usa la pista de música con su nombre. src/data/zones.json lista las zonas y su mapa.
- En la plaza: casa del jugador al oeste, torre del reloj al norte, tienda al este, camino al este hacia la granja y camino al sur hacia el lago. Árboles otoñales, por la historia del juego.
- La cámara de las zonas usa zoom ×3 (`WORLD_ZOOM`): se ven unas 20×11 casillas.
- Personaje del jugador: fotograma 85 de Tiny Dungeon. **Estos personajes solo tienen una postura**: para "mira hacia arriba/abajo" (HU-06) habrá que buscar otros sprites o añadir un indicador de dirección.

### Nueva partida y guardado (HU-02)

- El estado de la partida (`GameState`, src/systems/gameState.ts) guarda la zona, la posición en casillas, el día, los minutos desde las 00:00, el dinero, la energía, el inventario, los encargos activos y los cofres abiertos. Los valores iniciales están en `NEW_GAME` (src/config.ts) y la posición de inicio sale del punto `inicio` del mapa.
- La partida guardada está en localStorage con la clave `valtrigo.partida` y el formato `{ version: 1, state }`. Si no se puede leer o es de otra versión, se considera que no hay partida guardada.
- **Interpretación de HU-02, escenario 3:** al confirmar "Sí", la partida nueva se guarda en ese momento y sustituye a la anterior. Sin partida guardada previa, empezar una partida nueva no guarda nada (el guardado normal es al dormir, HU-25, o desde el menú, HU-04).
- Cuadro de confirmación reutilizable (src/ui/confirmDialog.ts): empieza con "No" seleccionado, se maneja con ← →, Enter, Escape (equivale a "No") o el ratón, y usa los efectos de navegación y confirmación. Mientras está abierto, el menú de debajo no responde.
- `hasGameInProgress()` ha pasado de save.ts a gameState.ts (`isGameInProgress()`), porque la partida en curso no es parte del guardado.
- En desarrollo, main.ts expone también `window.gameState()` para que los tests consulten la partida en curso.
- El escenario 2 de HU-01 ya está activo: una partida guardada válida activa "Continuar" (que aún no hace nada hasta HU-03).
- Hasta HU-31, en la plaza sigue sonando la música del menú. Hasta HU-22 no se muestra el reloj en pantalla, y hasta HU-06 el personaje no se mueve.
