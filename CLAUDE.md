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
- Personajes: hojas de Ninja Adventure (CC0) en public/assets/sprites/personajes/: jugador (Boy), vendedora (Woman), alcalde (Noble), relojera (OldWoman) y granjero (OldMan). Cada hoja tiene 4 columnas (abajo, arriba, izquierda, derecha) y las 4 primeras filas son la animación de andar. Del paquete solo se han copiado los archivos que usa el juego; la lista exacta está en public/assets/CREDITOS.md.

### Nueva partida y guardado (HU-02)

- El estado de la partida (`GameState`, src/systems/gameState.ts) guarda la zona, la posición en casillas, el día, los minutos desde las 00:00, el dinero, la energía, el inventario, los encargos activos y los cofres abiertos. Los valores iniciales están en `NEW_GAME` (src/config.ts) y la posición de inicio sale del punto `inicio` del mapa.
- La partida guardada está en localStorage con la clave `valtrigo.partida` y el formato `{ version: 1, state }`. Si no se puede leer o es de otra versión, se considera que no hay partida guardada.
- **Interpretación de HU-02, escenario 3:** al confirmar "Sí", la partida nueva se guarda en ese momento y sustituye a la anterior. Sin partida guardada previa, empezar una partida nueva no guarda nada (el guardado normal es al dormir, HU-25, o desde el menú, HU-04).
- Cuadro de confirmación reutilizable (src/ui/confirmDialog.ts): empieza con "No" seleccionado, se maneja con ← →, Enter, Escape (equivale a "No") o el ratón, y usa los efectos de navegación y confirmación. Mientras está abierto, el menú de debajo no responde.
- `hasGameInProgress()` ha pasado de save.ts a gameState.ts (`isGameInProgress()`), porque la partida en curso no es parte del guardado.
- En desarrollo, main.ts expone también `window.gameState()` para que los tests consulten la partida en curso.
- El escenario 2 de HU-01 ya está activo: una partida guardada válida activa "Continuar" (que aún no hace nada hasta HU-03).
- Hasta HU-31, en la plaza sigue sonando la música del menú. Hasta HU-22 no se muestra el reloj en pantalla, y hasta HU-06 el personaje no se mueve.

### Continuar partida (HU-03)

- "Continuar" lee la partida guardada (`readSave()` en save.ts) y abre GameScene con ese estado, sin selector.
- Se restaura todo `GameState`: zona, posición, día, hora, dinero, energía, inventario, encargos activos y cofres abiertos (`openedChests`, con identificadores como `cofre-1`).
- El escenario 2 de HU-03 (cofre 1 vacío y que no se reabre) está como `test.fixme` hasta HU-12, que crea los cofres y la interacción con E.
- Casa del jugador: mapa de 12×9 casillas con las casillas de interior de Tiny Dungeon. Los mapas incluyen las dos hojas (Tiny Town y Tiny Dungeon) y GameScene usa la de Tiny Dungeon también como hoja de casillas.
- La cama de HU-24 es public/assets/sprites/cama.png (16×32, recortada de Ninja Adventure).

### Pausa, reanudar y guardar (HU-26, HU-27, HU-04)

- **"Guardar partida" del menú principal siempre aparece desactivada.** Requisito literal (HU-01 y HU-04: desactivada sin partida en curso) más HU-26 (al salir al menú principal se pierde la partida): nunca se llega al menú principal con una partida en curso. Decisión del autor: se deja así a propósito.
- PauseScene se abre encima de GameScene, que queda en pausa (`scene.pause`). El orden de las escenas en main.ts marca qué se dibuja encima: partida, pausa y, sobre ellas, opciones.
- Menú de pausa: "Continuar", "Opciones", "Guardar partida" y "Salir al menú principal", con la misma navegación, colores y sonidos que el menú principal (src/ui/menuList.ts, compartido por los dos).
- Al abrir la pausa aparece seleccionada "Continuar".
- "Opciones" desde la pausa abre OptionsScene, y "Volver" o Escape regresan a la pausa con "Opciones" seleccionada. La partida sigue detenida.
- Escape: en la partida abre la pausa; en la pausa la reanuda; con un cuadro de confirmación abierto equivale a "No".
- "Guardar partida" en la pausa guarda (sobrescribe la única partida guardada) y muestra "Partida guardada" durante 2 segundos en la parte inferior (src/ui/message.ts). Los mensajes temporales cuentan tiempo real (`setTimeout`), no el reloj de Phaser, que se retrasa si el equipo va cargado. Si el navegador no permite guardar, no se muestra el mensaje.
- "Salir al menú principal": hay "cambios sin guardar" si la partida en curso no coincide exactamente con la guardada (o no hay partida guardada). Con cambios, pide confirmación; sin cambios, sale directamente. "No" deja la pausa abierta. Al salir, la partida en curso termina (`endGame()`) y el menú principal se abre con "Nueva partida" seleccionada.
- El cuadro de confirmación parte el mensaje en varias líneas si no cabe.
- El escenario 3 de HU-27 está como `test.fixme` hasta que existan los NPC (HU-10) y el avance del reloj (HU-22).

### Salir del juego (HU-05)

- Una página web no puede cerrar su propia pestaña. Decisión del autor (opción 1): al confirmar "Sí", el juego se apaga. Se para la música, se destruye Phaser (desaparece el lienzo) y queda una pantalla de despedida: "Has salido de Valtrigo. Puedes cerrar esta pestaña." (#farewell en index.html). Para volver a jugar hay que recargar la página.
- El texto de HU-05 ("el juego se cierra") no se ha modificado.
- "No" o Escape cierran el cuadro y el menú queda con "Salir" seleccionada.
- Salir no toca la partida guardada.

### Movimiento (HU-06)

- El personaje se mueve con física Arcade de Phaser a 64 px/s (`PLAYER_SPEED`, 4 casillas por segundo), con movimiento libre, no casilla a casilla.
- Con varias direcciones pulsadas manda la última pulsada (la tecla con `timeDown` más reciente). Al soltarla, vuelve a mandar la que siga pulsada.
- Animación de andar a 8 fotogramas por segundo. Al pararse, el personaje mantiene la dirección hacia la que miraba.
- Al abrir la pausa el personaje se para. Al reanudar, todas las teclas se dan por sueltas, porque las que se soltaron durante la pausa no llegan a la escena de juego.
- La posición en casillas de `GameState` se actualiza en cada fotograma con la casilla en la que está el centro del personaje.
- Seis efectos de Ninja Adventure ya están en public/assets/audio/sfx/ (pasos, abrir menú, compra, venta, cofre y encargo completado) para HU-32, pero todavía no se usan.

### Colisiones (HU-07)

- Todas las casillas de la capa `obstaculos` son sólidas: árboles, edificios, muros, muebles, el pozo y el cartel. El agua irá en esa capa cuando exista el lago (HU-08).
- El cuerpo de colisión del personaje mide 14×14 y está centrado en su casilla de 16×16. Los gráficos tienen bordes transparentes, así que no se ve superposición, y queda algo de margen para pasar por huecos de una casilla.
- El personaje no puede salir de los límites del mapa. Las salidas de la plaza hacia la granja y el lago se convertirán en cambios de zona en HU-08.
- Si la dirección que manda (la última pulsada) está bloqueada, se usa la siguiente pulsada que esté libre. Si todas están bloqueadas, el personaje se queda quieto mirando hacia la que manda.
- Para saber si una dirección está bloqueada se desplaza 1 px el cuerpo y se miran las casillas sólidas que tocaría.
- Los escenarios 2 (agua) y 4 (NPC) de HU-07 están como `test.fixme` hasta HU-08 (lago) y HU-10 (NPC).

### Cámara (HU-09)

- La cámara sigue al personaje sin retardo (`startFollow`), así que siempre lo mantiene centrado, y redondea a píxeles enteros para que el pixel art no tiemble.
- Sus límites son los del mapa, ampliados en cada eje en el que el mapa sea más pequeño que la vista (320×180 px de mundo con zoom ×3) y centrados sobre él. En los mapas grandes se detiene en los bordes. En los ejes pequeños no se mueve y la zona queda centrada, con el color de fondo alrededor.
- El escenario 4 de HU-09 (cámara tras cruzar una puerta) está como `test.fixme` hasta HU-08.
