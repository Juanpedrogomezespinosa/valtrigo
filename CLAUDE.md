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
- BootScene solo carga menu.mp3. Cada pista pesa unos 3-4 MB, así que la de cada zona se descarga la primera vez que se entra en ella (HU-31).
- systems/audio.ts anota la música que suena en `game.registry` ('music') para que los tests puedan comprobarla.

### Efectos de sonido (HU-32)

- Se han añadido a HU-32 dos criterios y los escenarios 5 y 6: efecto de navegación al cambiar de opción en un menú y efecto de confirmación al activar una opción. Las opciones desactivadas no suenan, para no contradecir el escenario 4 de HU-01 ("no ocurre nada").
- **Los efectos son provisionales.** Se generan por código con `node tools/generar-efectos.mjs`, que escribe archivos WAV en public/assets/audio/sfx/. Para cambiar uno por un archivo definitivo, basta con sustituir el WAV o la ruta en `SFX` (src/systems/audio.ts).
- Los efectos se cargan en BootScene a partir de la lista `SFX` de systems/audio.ts y se reproducen con `playEffect()`, con el volumen de efectos de las opciones (HU-29).
- Si la flecha no cambia la selección (por ejemplo, arriba en la primera opción), no suena nada.
- Con el ratón, un clic en una opción solo reproduce el efecto de confirmación, no el de navegación.
- "Volver" (con clic, Enter o Escape) reproduce el efecto de confirmación.
- Efectos de las acciones (Ninja Adventure): pasos al andar (cada 250 ms mientras el personaje se desplaza de verdad; contra un obstáculo no suena), abrir menús (inventario, objetivos, pausa y tienda), comprar, vender, abrir un cofre y completar un encargo. En la tienda, una compra o venta correcta suena con su efecto en lugar del de confirmación.

### Mundo y gráficos

- Gráficos: paquetes Tiny Town y Tiny Dungeon de Kenney (CC0), casillas de 16×16. Están en public/assets/tilesets/ y public/assets/sprites/, sin modificar. public/assets/CREDITOS.md recoge el autor y la licencia de cada recurso (para HU-35).
- Mapas en formato Tiled (JSON) en public/assets/maps/, con tres capas: `suelo`, `obstaculos` (todo lo que hay en ella es sólido) y `puntos` (el punto `inicio`, los puntos de llegada y las puertas).
- `node tools/generar-mapas.mjs` genera la versión inicial de los mapas. Después se pueden retocar en Tiled; volver a ejecutar el script sobrescribe esos cambios.
- Las 7 zonas son: exterior del pueblo (`plaza`, zona inicial), casa del jugador, tienda, granja (con el granero), lago, torre y bosque (HU-51). Cada zona usa la pista de música con su nombre. Desde HU-70 hay 10: el barrio y las casas de Tomás y Pablo y de Lucía. src/data/zones.json lista las zonas y su mapa.
- En la plaza: casa del jugador al oeste, torre del reloj al norte, tienda al este, camino al este hacia la granja y camino al sur hacia el lago. Árboles otoñales, por la historia del juego.
- La cámara de las zonas usa zoom ×3 (`WORLD_ZOOM`): se ven unas 20×11 casillas.
- Personajes: hojas de Ninja Adventure (CC0) en public/assets/sprites/personajes/: jugador (Boy), vendedora (Woman), alcalde (Noble), relojera (OldWoman) y granjero (OldMan). Cada hoja tiene 4 columnas (abajo, arriba, izquierda, derecha) y las 4 primeras filas son la animación de andar. Del paquete solo se han copiado los archivos que usa el juego; la lista exacta está en public/assets/CREDITOS.md.

### Nueva partida y guardado (HU-02)

- El estado de la partida (`GameState`, src/systems/gameState.ts) guarda la zona, la posición en casillas, el día, los minutos desde las 00:00, el dinero, la energía, el inventario, los encargos activos y los cofres abiertos. Los valores iniciales están en `NEW_GAME` (src/config.ts) y la posición de inicio sale del punto `inicio` del mapa.
- La partida guardada está en localStorage con la clave `valtrigo.partida` y el formato `{ version: 1, state }`. Si no se puede leer o es de otra versión, se considera que no hay partida guardada.
- **Interpretación de HU-02, escenario 3:** al confirmar "Sí", la partida nueva sustituye a la anterior. Desde HU-68 se guarda al confirmar el aspecto, ya completa: el menú pasa `overwriteSave` a IntroScene, esta a NameScene y esta a AppearanceScene. Sin partida guardada previa, empezar una partida nueva no guarda nada (el guardado normal es al dormir, HU-25, o desde el menú, HU-04).
- Cuadro de confirmación reutilizable (src/ui/confirmDialog.ts): empieza con "No" seleccionado, se maneja con ← →, Enter, Escape (equivale a "No") o el ratón, y usa los efectos de navegación y confirmación. Mientras está abierto, el menú de debajo no responde.
- `hasGameInProgress()` ha pasado de save.ts a gameState.ts (`isGameInProgress()`), porque la partida en curso no es parte del guardado.
- En desarrollo, main.ts expone también `window.gameState()` para que los tests consulten la partida en curso.
- El escenario 2 de HU-01 ya está activo: una partida guardada válida activa "Continuar" (que aún no hace nada hasta HU-03).

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

- Todas las casillas de la capa `obstaculos` son sólidas: árboles, edificios, muros, muebles, el pozo, el cartel y el agua.
- El cuerpo de colisión del personaje mide 14×14 y está centrado en su casilla de 16×16. Los gráficos tienen bordes transparentes, así que no se ve superposición, y queda algo de margen para pasar por huecos de una casilla.
- El personaje no puede salir de los límites del mapa.
- Si la dirección que manda (la última pulsada) está bloqueada, se usa la siguiente pulsada que esté libre. Si todas están bloqueadas, el personaje se queda quieto mirando hacia la que manda.
- Para saber si una dirección está bloqueada se desplaza el cuerpo una fracción de píxel (0,05) y se miran las casillas sólidas y los NPC que tocaría. Solo cuenta como bloqueada si ya está tocando el obstáculo; así el personaje se detiene pegado a él y no a 1 px.

### Cámara (HU-09)

- La cámara sigue al personaje sin retardo (`startFollow`), así que siempre lo mantiene centrado, y redondea a píxeles enteros para que el pixel art no tiemble.
- Sus límites son los del mapa, ampliados en cada eje en el que el mapa sea más pequeño que la vista (320×180 px de mundo con zoom ×3) y centrados sobre él. En los mapas grandes se detiene en los bordes. En los ejes pequeños no se mueve y la zona queda centrada, con el color de fondo alrededor.

### Cambios de zona (HU-08)

- Las 6 zonas y sus conexiones: plaza ↔ casa, plaza ↔ tienda y plaza ↔ torre (puertas de los edificios), plaza ↔ granja (camino del este) y plaza ↔ lago (camino del sur). Las salidas por los caminos funcionan como puertas: un rectángulo en el borde del mapa.
- Mapas nuevos: tienda (12×9) y torre (10×12), que son interiores más pequeños que la pantalla; granja (30×22), con el granero y un cercado delante; y lago (30×22), con el lago en el centro, bosque alrededor y un claro al este. El granero no tiene puerta, porque no se puede entrar.
- **El agua no está en los paquetes de Kenney.** public/assets/tilesets/agua.png se genera con `node tools/generar-agua.mjs` (centro, brillo y orillas) con la paleta de Kenney. Los mapas usan ahora tres hojas: Tiny Town, Tiny Dungeon y agua.
- En Tiled, cada puerta es un rectángulo llamado `puerta` en la capa `puntos`, con las propiedades `zona` (destino) y `direccion` (hacia dónde hay que caminar para cruzarla). Al llegar, el personaje aparece en el punto `llegada-<zona de origen>` del mapa de destino, mirando hacia su propiedad `mirando` (alejándose de la puerta).
- Una puerta se cruza al caminar hacia ella (el personaje mira en su `direccion`) cuando su cuerpo la toca con al menos la mitad de su anchura. Las puertas de los edificios son casillas sólidas: basta con llegar a ellas, sin alinearse al píxel.
- Transición: fundido a negro de 0,5 s (`ZONE_FADE_MS`) y, al terminar, la nueva zona aparece directamente, sin fundido de entrada, porque la historia solo describe el fundido a negro. Durante el fundido el personaje no se mueve y Escape no abre la pausa.
- Las teclas que se mantienen pulsadas al cruzar no siguen moviendo al personaje en la nueva zona: hay que volver a pulsarlas. Así no se vuelve a cruzar la puerta sin querer.
- **El paso de tiempo de Phaser no se suaviza** (`fps.smoothStep: false` en main.ts). Con suavizado, si el equipo va lento, el reloj de Phaser va más despacio que el real y las duraciones de las historias (fundidos y, en HU-22, el reloj del juego) se alargan.
- Los tests que miden tiempos (el mensaje de 2 s y el fundido de 0,5 s) miden dentro del navegador (`measureTextVisible` y `measureZoneChange` en tests/e2e/helpers.ts), para no depender de la latencia entre Playwright y el navegador.

### NPC y diálogos (HU-10)

- Los 4 NPC: alcalde en la plaza (24, 13), vendedora en la tienda (9, 4, junto al mostrador), relojera en la torre (5, 5) y granjero en la granja (16, 9) y, por la tarde, en el lago (17, 7). Cuándo está cada uno lo marca su horario (HU-40). En Tiled son puntos llamados `npc` con la propiedad `personaje`.
- Los NPC están quietos y miran hacia abajo. Tienen un cuerpo de 14×14, como el personaje, y son obstáculos.
- "A menos de una casilla": el hueco entre el cuerpo del personaje y el del NPC es menor de 16 px (`TALK_DISTANCE`). Si hay varios NPC a tiro, se elige el más cercano. El indicador "E" se dibuja encima de ese NPC.
- Retratos: los `Faceset.png` de Ninja Adventure (38×38) en public/assets/sprites/retratos/, ampliados ×3.
- El texto se escribe a 30 ms por letra (`DIALOG_MS_PER_LETTER`).
- El diálogo es una escena aparte (DialogScene) encima de la partida. Mientras está abierto, el personaje no se mueve, el indicador se oculta y no se puede cruzar puertas. Escape abre la pausa también con un diálogo abierto: el diálogo queda detenido y continúa al reanudar.
- Las líneas de cada NPC están en src/data/dialogues.json: su saludo (`greeting`) y, para cada encargo suyo, `offer`, `active`, `complete` y `thanks`.

### Encargos: decisiones del autor (para HU-11, HU-19 y HU-20)

- **Encargo 1:** lo ofrece el alcalde ("la vendedora tiene una carta para mí, ¿me la traes?"). Mientras el encargo 1 está activo, la vendedora entrega la Carta del alcalde. Eso forma parte del encargo 1, no es ofrecer el suyo, así que en ese caso no dice "Termina tu encargo actual primero".
- **Orden:** cada NPC ofrece su encargo solo cuando están completados todos los anteriores de la lista de la historia del juego y ha llegado su día (`day` en quests.json, HU-38). El encargo 6 ya no está disponible nada más completar el 5: se ofrece a partir del día 7. Si su encargo aún no toca, el NPC dice su diálogo normal, sin ofrecer nada.

### Inventario y dinero (HU-13 a HU-16)

- Objetos en src/data/items.json (nombre, si es consumible y la energía que da). Iconos de Ninja Adventure en public/assets/sprites/objetos/<id>.png: Manzana (SeedBig3, una fruta roja), Semilla, Pala, Carta del alcalde y tres piezas del reloj (barras de cobre, plata y oro). Ver CREDITOS.md.
- Piezas del reloj (decisión del autor: nombres de piezas reales): "Engranaje de cobre" (cofre 1), "Muelle de plata" (cofre 2) y "Péndulo de oro" (cofre 3). Sus identificadores son pieza-del-reloj-1, -2 y -3.
- El inventario de `GameState` es la lista de casillas ocupadas, en orden. Al vaciarse una casilla, las siguientes se desplazan.
- Recoger objetos (src/systems/inventory.ts): primero se completan las casillas del mismo objeto (hasta 99) y después se usan casillas libres. Si no caben todas las unidades, no se recoge ninguna y aparece "Inventario lleno".
- El inventario (InventoryScene) **no detiene el tiempo** (decisión del autor): solo impide moverse, interactuar y abrir la pausa mientras está abierto. Cuadrícula de 5×4; al abrirlo está seleccionada la primera casilla; las flechas mueven la selección (sin dar la vuelta) y Enter usa el objeto. I o Escape lo cierran (Escape no abre la pausa).
- Usar un objeto no consumible muestra "No se puede usar". La Manzana con la energía al máximo no se consume y no muestra mensaje (la historia no indica ninguno).
- Los mensajes breves sin duración indicada ("Inventario lleno", "No se puede usar") duran 2 segundos (`MESSAGE_MS`).
- HudScene: interfaz fija durante la partida, por encima de la partida, el inventario y la pausa, y por debajo de las opciones. Muestra el dinero arriba a la derecha ("[cantidad] monedas") y, debajo, la energía ("Energía: [actual]/100"). Se actualiza en cada fotograma.
- **Energía en pantalla:** criterio y escenario 5 añadidos a HU-14 (decisión del autor), porque ninguna historia la mostraba. "Inventario lleno" se muestra en esta capa.
- En desarrollo, main.ts expone `window.pickUp(objeto, cantidad)`, la misma función que usarán cofres y tienda, para probar HU-15 sin depender de esas historias.
- Retratos y objetos se copiaron de ~/Downloads/Ninja Adventure - Asset Pack (la carpeta descomprimida se borró; el zip se conserva).

### Cofres, carteles y la Pala (HU-12)

- Contenido en src/data/: chests.json (objeto de cada cofre), signs.json (texto de cada cartel) y worldItems.json (objetos sueltos). En los mapas son puntos llamados `cofre`, `cartel` y `objeto` con la propiedad `id`.
- Cofres, algo escondidos (decisión del autor) y numerados como en el catálogo de bugs (docs/bugs.md):
  - cofre-1: detrás del granero (granja, casilla 7, 2), con el Engranaje de cobre.
  - cofre-2: en un almacén tabicado de la torre (1, 10), con el Péndulo de oro.
  - cofre-3: al final de un sendero entre los árboles, al suroeste del lago (2, 18), con el Muelle de plata.
  Cada pieza sigue en el sitio que dice la historia del juego (Engranaje en el granero, Muelle en el lago, Péndulo en la torre). El claro del este del lago se dejó vacío como pista falsa; desde HU-55 tiene la página 3 del diario. Son obstáculos y se ven abiertos cuando su `id` está en `openedChests`.
- Los pasillos de los escondites están pensados para que el personaje quede alineado al llegar (al subir hasta los árboles del borde en la granja, al bajar hasta los árboles de la fila 18 en el lago) y la entrada del almacén de la torre mide dos casillas.
- **La Pala** (decisión del autor: se encuentra en la granja) está en el suelo junto al granero. Se recoge con E y desaparece del mapa. Queda anotada en `pickedUpItems`, un campo nuevo de `GameState`; las partidas guardadas que no lo tengan se cargan con la lista vacía. Criterio y escenario 5 añadidos a HU-12.
- Carteles con pistas (decisión del autor): dos en la plaza (centro y camino del lago), uno a la entrada de la granja y otro a la entrada del lago. Dan pistas de los escondites de los cofres. Son casillas sólidas. Su texto aparece completo, sin escribirse letra a letra, porque HU-12 dice que la segunda E lo cierra.
- Todo lo que se activa con E (NPC, cofres cerrados, carteles y objetos) usa el mismo alcance (menos de una casilla) y el mismo indicador "E". Un cofre ya abierto no muestra el indicador.
- El cuadro de diálogo (DialogScene) sirve para NPC y carteles: título, retrato opcional y texto letra a letra o completo.

### Encargos (HU-11, HU-19, HU-20 y HU-21)

- Los 6 encargos están en src/data/quests.json, en el orden de la historia del juego, con nombre, descripción, NPC, condición y recompensa. Tipos de condición: `deliver` (entregar objetos al NPC), `sell` (vender en la tienda; se cuenta desde que se acepta el encargo, en `questProgress`) y `talk` (hablar con el NPC con el encargo activo).
- Todos se completan al hablar con el NPC que los encargó cuando se cumplen sus condiciones, salvo el encargo 4, que desde HU-56 se completa en el mecanismo del reloj (tipo `mechanism`). El encargo 6 ("hablar con el alcalde durante la feria") se completa la siguiente vez que se habla con él después de aceptarlo.
- `GameState` tiene dos campos nuevos: `completedQuests` y `questProgress`. Las partidas guardadas sin ellos se cargan con valores vacíos.
- La lógica de lo que dice cada NPC está en `conversationWith()` (src/systems/quests.ts), en este orden:
  1. Si el encargo activo es suyo: agradece y completa (si se cumple la condición) o da el seguimiento (`active`).
  2. Si hay otro encargo activo: la vendedora entrega la carta (encargo 1, si no se tiene); un NPC con encargos pendientes dice "Termina tu encargo actual primero".
  3. Si no hay encargo activo y el siguiente de la lista es suyo, lo ofrece con "Aceptar" y "Rechazar".
  4. Si ya completó algún encargo suyo, da las gracias (`thanks` del último).
  5. Si no, su saludo.
- Al aceptar, el NPC sigue con su diálogo `active` (HU-19). Al rechazar, se cierra el diálogo y la próxima vez lo vuelve a ofrecer.
- Al completar: primero se comprueba que la recompensa cabe en el inventario **tal y como está** (antes de entregar los objetos pedidos). Si no cabe, aparece "Inventario lleno" y el encargo sigue activo (HU-20, escenario 3). Si cabe, se entregan los objetos, se cobra la recompensa, aparece "Encargo completado" y el NPC dice su diálogo `complete`.
- Las opciones del diálogo se eligen con ← → (con los efectos de navegación y confirmación) y se confirman con E, Enter o un clic.
- Los mensajes durante la partida ("Encargo completado", "Inventario lleno") salen arriba en el centro, para que no los tape el cuadro de diálogo.
- Lista de objetivos (ObjectivesScene, tecla O): igual que el inventario, el tiempo sigue y el personaje no se mueve. Se cierra con O o Escape. Muestra el nombre, la descripción y "Encargado por: [NPC]", o "No tienes encargos activos".
- Los tests usan un `test` propio (tests/e2e/fixtures.ts) que hace fallar cualquier test en el que la página lance un error de JavaScript.

### Tienda (HU-17 y HU-18)

- Decisiones del autor: la tienda vende Semilla (10 monedas) y Pala (30). Al vender se recibe el 50 % del precio de compra (`price` en src/data/items.json); la Manzana no se compra; su precio de venta está en HU-45. Los objetos de encargo (`questItem`: Carta del alcalde y piezas del reloj) no se pueden vender.
- Catálogo y horario en src/data/shop.json. Abierta desde las 07:00 hasta antes de las 19:00: a las 19:00 ya está cerrada. La lógica está en src/systems/economy.ts.
- **Hablar con la vendedora** (decisión del autor): con la tienda cerrada solo aparece "La tienda está cerrada" (no hay diálogo ni carta). Con la tienda abierta, si tiene algo del encargo que decir (dar la carta, ofrecer o completar el encargo 3), lo dice y al cerrar el diálogo se abre la tienda; si no, la tienda se abre directamente.
- ShopScene: como el inventario, no detiene el tiempo y el personaje no se mueve. ← → cambian entre "Comprar" y "Vender", ↑ ↓ eligen un objeto, Enter compra o vende **una unidad** (decisión del autor) y Escape cierra. "Vender" lista el inventario con lo que se recibe por unidad.
- Al comprar se comprueba primero el dinero ("Dinero insuficiente") y después el espacio ("Inventario lleno"). Cada compra o venta vuelve a comprobar el horario: si la tienda ha cerrado mientras estaba abierta la pantalla, aparece "La tienda está cerrada" y no se hace nada.
- Vender Semillas con el encargo 3 activo suma a su progreso (`recordSale`).

### Reloj (HU-22) y medianoche

- El reloj (src/systems/time.ts) avanza 1 minuto de juego por segundo real (`GAME_MINUTES_PER_SECOND`), contado con el tiempo real entre fotogramas. Avanza mientras GameScene se actualiza: se detiene con la pausa y sigue con diálogos, inventario, objetivos y tienda (decisión del autor sobre el inventario, aplicada igual al resto). Phaser también detiene el juego cuando la pestaña del navegador está oculta.
- Durante un cambio de zona el reloj sigue avanzando.
- La interfaz muestra "Día N" y la hora (HH:MM) arriba a la izquierda.
- **Medianoche** (decisiones del autor, para HU-22 escenario 4 y HU-24 escenario 3): al llegar a las 24:00 se cierra lo que esté abierto, la pantalla se funde a negro (0,5 s) y empieza el día siguiente a las 06:00. El personaje despierta en su casa, junto a la cama (punto `despertar`), con la energía a 100. El progreso no guardado se pierde: el resto del estado vuelve a la última partida guardada (o al de una partida nueva si no hay ninguna). No se guarda (HU-25). Lógica en src/systems/sleep.ts.
- La cama (public/assets/sprites/cama.png, 16×32) está en la casa, en las casillas (1, 3) y (1, 4), y es un obstáculo. En Tiled es el punto `cama`; el punto `despertar` está en (2, 4).
- Tests y reloj: como la hora avanza sola, los tests que comparan estados o leen la hora admiten 1 minuto de diferencia (`expectSameGame` y `expectClockAt` en tests/e2e/helpers.ts). Los escenarios 2 y 3 de HU-22 esperan 60 y 30 segundos reales.

### Día y noche (HU-23)

- NightScene: capa de color azul noche (`NIGHT_COLOR`) sobre la partida, por debajo de diálogos, menús e interfaz. Su opacidad sale de `darkness()` (src/systems/time.ts): sube de 0 a 1 entre las 20:00 y las 21:00, vale 1 hasta las 06:00 y baja de 1 a 0 entre las 06:00 y las 07:00.
- **"Completamente oscura" es una opacidad del 65 %** (`NIGHT_MAX_ALPHA`), no negro total, para que de noche se pueda seguir jugando (confirmado por el autor).
- Afecta a todas las zonas, también a los interiores. Cada día empieza a las 06:00, a oscuras, y se va aclarando durante la primera hora. La partida nueva empieza a las 08:00 (HU-62), ya de día.

### Dormir y guardado automático (HU-24 y HU-25)

- E junto a la cama abre "¿Dormir?" con "Sí" y "No" (el mismo cuadro de confirmación que el menú, dibujado en la capa de interfaz). Mientras está abierto el personaje no se mueve y Escape equivale a "No".
- **Qué se guarda al dormir** (decisión del autor, lectura literal de HU-25 escenario 3): la partida tal como está al acostarse (si se duerme el día 4 a las 21:00, se guarda el día 4 a las 21:00, junto a la cama). Después aparece "Partida guardada" (2 s, arriba), la pantalla se funde a negro (0,5 s), aparece el resumen del día (HU-39) y, al cerrarlo con E, empieza el día siguiente a las 06:00 con la energía a 100, junto a la cama. Ese estado de la mañana no se guarda hasta el próximo guardado.
- Dormir en la cama y dormirse a medianoche comparten el fundido y el despertar (`sleepUntilMorning` en GameScene, src/systems/sleep.ts). A medianoche no se guarda y se pierde lo no guardado.

### Opciones de sonido y controles (HU-28 a HU-30, HU-33 y HU-34)

- Ajustes en src/systems/settings.ts: música y efectos de 0 a 10 barras y silencio. Primera vez: música 6 y efectos 5 (decisión del autor). Se guardan en localStorage con la clave `valtrigo.opciones` y se cargan en BootScene. Si el navegador no permite guardar, se aplican igual pero no se conservan.
- Volumen: música = barras / 10 en el nodo de ganancia de la música; efectos = barras / 10 en cada `playEffect()`. "Silenciar" usa el silencio general de Phaser (`game.sound.mute`), por el que pasan música y efectos, así que las barras conservan sus valores.
- Pantalla de opciones: filas "Música", "Efectos", "Silenciar" y "Volver". ↑ ↓ eligen la fila (efecto de navegación), ← → cambian el volumen al instante, Enter o un clic activan "Silenciar" o "Volver", y Escape vuelve. Las barras también se ajustan con un clic.
- Efecto de prueba (HU-29): al soltar ← o → (o el clic) en "Efectos", si el valor ha cambiado, suena el efecto de confirmación con el nuevo volumen.
- Tabla de controles (HU-33) a la derecha, de solo lectura: pulsar sobre una tecla no hace nada.
- Las opciones se abren desde el menú principal y desde la pausa, y se aplican igual en los dos casos.
- **Tecla Tab (HU-30, criterio y escenario 4 añadidos):** bug encontrado al jugar. Tab movía el foco a la barra del navegador; la página perdía el foco, Phaser suspendía el AudioContext (`pauseOnBlur`) y el teclado dejaba de llegar al juego hasta hacer clic. main.ts anula la acción por defecto de Tab. `window.audioState()` incluye `running` (si el AudioContext está en marcha). Por decisión del autor, este fallo es también el B-16 del catálogo de bugs (docs/bugs.md): para sembrarlo basta con quitar esa línea.

### Música por zona (HU-31)

- Cada zona tiene su pista en src/data/zones.json (`music`), con la clave `music-<zona>`. GameScene la pone al crear la zona (`playZoneMusic`). Si es la que ya suena, no se reinicia; si es otra, entra con crossfade.
- La primera vez que se entra en una zona su pista se descarga; mientras tanto sigue sonando la anterior.
- Al volver al menú principal suena la música del menú. En desarrollo, `window.audioState()` dice qué pista suena y cuántas veces ha empezado una (`musicStarts`), para comprobar que no se reinicia.

### Créditos y legibilidad (HU-35 y HU-36)

- Créditos en src/data/credits.json: autor (Juanpe Gómez), motor (Phaser 3, licencia MIT) y recursos con su autor y licencia: Kenney (CC0), Ninja Adventure (CC0), la música (propia, generada con IA con Flow, de Google) y lo generado por código (propio). Si se añade un recurso, hay que añadirlo aquí y en public/assets/CREDITOS.md.
- Contraste (HU-36): todos los textos usan `COLORS` sobre fondos opacos o sobre capas oscuras semitransparentes. El test mide el contraste real en pantalla: captura la zona de cada texto, toma el color de fondo más frecuente y aplica la fórmula de WCAG. Valores medidos: unos 13:1 el texto blanco y unos 10:1 el amarillo.
- El tamaño del texto es fijo: las opciones no tienen ningún ajuste de tamaño.
- El test de idioma revisa los textos de las pantallas y de src/data/ en busca de palabras en inglés habituales en interfaces.

### Reloj reparado y final (HU-11 escenario 5 y HU-37)

- Detectado al jugar: tras reparar el reloj, el alcalde seguía diciendo "si alguien arreglara ese reloj". Decisión del autor: nuevo criterio y escenario 5 en HU-11. Con el encargo 4 completado, un NPC que no tiene nada de encargos que decir (ni ofrecer, ni seguimiento, ni completar, ni la carta, ni "Termina tu encargo actual primero") dice sus líneas `clockRepaired`. Tienen prioridad sobre el agradecimiento y el saludo.
- **HU-37 (historia nueva, decisión del autor):** al completar el último encargo ("La feria de Valtrigo"), cuando se cierra el diálogo del alcalde aparece el mensaje de final (`ending` en dialogues.json, título "Fin", texto completo sin escritura letra a letra). Se cierra con E y se sigue jugando. Solo aparece una vez, porque el encargo solo se completa una vez.

### Fase 1 de la ampliación: ritmo (HU-38, HU-57, HU-40, HU-46, HU-47 y HU-39)

- **Encargos por día (HU-38):** cada encargo tiene su día en quests.json (`day`). `conversationWith()` solo lo ofrece si ha llegado ese día; si no, el NPC sigue con su diálogo normal (agradecimiento, reloj reparado o saludo).
- **Puertas cerradas (HU-57 y HU-17):** en zones.json, `opensOnDay` (la torre abre el día 5) y `closedMessage`. La tienda está cerrada fuera de su horario (shop.json). La lógica está en src/systems/doors.ts. Al caminar hacia una puerta cerrada se abre el cuadro de diálogo, con el nombre de la zona como título y el texto completo. Se cierra con E y no se cambia de zona. El aviso no se repite hasta que el personaje deja de caminar hacia esa puerta, para que mantener la flecha pulsada no lo reabra sin parar. Salir de un edificio siempre está permitido. Decisión del autor: el aviso de la tienda es "La tienda está cerrada, vuelve a las 7". La hora sale de `opensAt` (shop.json) a través del marcador `{apertura}` de zones.json, así que si cambia el horario, el aviso cambia con él. Dentro de la tienda, a partir de las 19:00, hablar con la vendedora sigue mostrando el mensaje "La tienda está cerrada".
- **Horarios de los NPC (HU-40):** están en src/data/schedules.json y la lógica en src/systems/schedules.ts. Cada tramo va desde `from` hasta antes de `to`, así que a las 20:00 el alcalde ya no está. **La vendedora no tiene horario** (confirmado por el autor): está siempre en la tienda, porque la tienda ya solo se visita en su horario y HU-17 (escenario 5) necesita que esté dentro a las 19:00. Un NPC fuera de su horario no se ve, no es un obstáculo y no se puede hablar con él. GameScene revisa los horarios en cada fotograma. El NPC con el que se está hablando no cambia hasta que se cierra el diálogo.
- **Energía (HU-46 y HU-47):** los costes están en src/data/energy.json (cavar, sembrar, regar, cosechar, lanzar la caña, talar y recoger setas o moras) y la lógica en src/systems/energy.ts. Cada acción de trabajo debe pasar por `GameScene.work(acción)`. Si la energía no alcanza, aparece "Estás demasiado cansado" (2 s, arriba), no se gasta nada y la acción no se hace, así que la energía nunca baja de 0. El concurso de pesca (HU-60) tendrá que saltarse el gasto de la caña.
- **Tests pendientes:** ninguno. HU-46 y HU-47 se activaron con HU-41 y el escenario 1 de HU-39, con HU-48.
- **Resumen del día (HU-39):** `GameState.dayStats` guarda las monedas ganadas (ventas en sellOne y recompensas en completeQuest), las cosechas y los peces. Las compras no restan. Se pone a cero al despertar y se guarda con la partida (las partidas antiguas lo cargan a cero). DaySummaryScene aparece sobre la pantalla en negro con "Día N terminado", las tres cifras y "Pulsa E para continuar". Con E empieza el día siguiente. A medianoche no aparece.
- **Catálogo nuevo de la tienda (HU-17):** se ha hecho en la fase 2 (ver más abajo).
- En los tests, `moveTo()` (helpers.ts) lleva al personaje a otra zona sin recorrer el camino, para preparar un escenario (por ejemplo, comprar en la tienda y dormir en casa).
- **Bug encontrado al jugar (HU-40, escenarios 6 y 7 añadidos por decisión del autor):** el alcalde ausente bloqueaba al personaje en su sitio. Phaser deja los cuerpos estáticos desactivados en su árbol de búsqueda y `overlapRect` los seguía devolviendo, así que la comprobación de bloqueo de Player los contaba aunque la física los ignorara. El personaje entraba en la casilla del NPC y ya no podía salir. Ahora `canMove` ignora los cuerpos desactivados. Además, si al llegar su hora el jugador ocupa el sitio del NPC, este no aparece hasta que el jugador se aparta.

### Introducción y comienzo del día 1 (HU-62)

- Decisión del autor para evitar las horas muertas del día 1 (de 06:00 a 08:00 no había nada que hacer): una historia nueva, HU-62, con una introducción, y la partida nueva empieza el día 1 a las **08:00**, con el alcalde ya en la plaza. Se han cambiado HU-02 y HU-22 (escenario 1). Los demás días siguen empezando a las 06:00. Se usa el número HU-62, que había quedado libre al descartar "amistad".
- IntroScene muestra los textos de src/data/intro.json, una pantalla cada vez, con el contador "N / total". E pasa a la siguiente pantalla y Escape la salta. La partida ya está creada (y guardada, si se ha confirmado sobrescribir), pero el reloj no avanza hasta que se abre GameScene. Mientras tanto sigue sonando la música del menú. "Continuar" no muestra la introducción.
- En los tests, `startNewGame()` y `passIntro()` (helpers.ts) pasan la introducción con E. El escenario 2 de HU-22 empieza ahora en una partida cargada a las 06:00, porque la partida nueva empieza a las 08:00.
- docs/jira/historias.csv se ha actualizado con HU-02, HU-22, HU-40 y la nueva HU-62.

### Tareas del día (HU-63)

- Decisión del autor para guiar al jugador y que no se atasque: una historia nueva, HU-63, que añade "Tareas de hoy (día N)" a la lista de objetivos (O), debajo del encargo, con ☑ para las hechas y ☐ para las pendientes. Se ha añadido un criterio a HU-21 que la menciona.
- Las tareas están en src/data/tasks.json (día, texto y condición) y la lógica en src/systems/tasks.ts. Hay dos tipos de condición:
  - `event`: algo hecho ese día ("talk:<npc>", "visit:<zona>", "buy:<objeto>", "read:<cartel>"). Estas tareas solo aparecen en su día.
  - De estado: `questAccepted`, `questCompleted`, `questProgress`, `hasItem`, `pickedUp` y `chestOpened`. Si quedan pendientes, siguen apareciendo los días siguientes, delante de las de hoy.
  - `anyOf` combina varias condiciones.
- Lo hecho en el día se guarda en `GameState.dayEvents`, que se pone a cero al despertar y se guarda con la partida. Se anota al hablar con un NPC, al comprar, al leer un cartel y al entrar en una zona **por una puerta**. Cargar una partida no cuenta como visita, para no crear "cambios sin guardar" (HU-26).
- Caben 6 tareas en pantalla. Si hay más, se quitan primero las hechas.
- Las tareas hechas usan el mismo color que las pendientes. Se probó el gris de `COLORS.disabled`, pero se midieron 4,51:1 sobre el camino de tierra, justo en el límite de HU-36.
- **Cada fase de la ampliación debe añadir sus tareas a tasks.json** (por ejemplo, cavar y sembrar el día 2 en la fase de cultivo).

### Horario de la relojera y aviso al recibir objetos (HU-64 y HU-65)

- **HU-64 (decisión del autor):** la primera vez que se entra en la torre por su puerta aparece un cuadro de diálogo: "La relojera viene a la torre de 9:00 a 22:00". Se define en zones.json (`firstVisit`, con el NPC y el texto). `{desde}` y `{hasta}` salen de schedules.json, así que si cambia el horario, cambia el aviso. Las zonas visitadas se guardan en `GameState.visitedZones` (las partidas antiguas lo cargan vacío). Solo cuenta entrar por la puerta, igual que en las tareas del día. El escenario 3 de HU-57 ahora solo comprueba que no sale "La torre está cerrada", porque al entrar aparece este aviso.
- **HU-65 (decisión del autor):** cuando un NPC da un objeto (la Carta del alcalde o la recompensa de un encargo), aparece arriba durante 2 s "Recibiste [objeto] de parte [del alcalde / de la vendedora…]". La plantilla es `received` en dialogues.json. Cada NPC tiene su `from` ("del alcalde", "de la vendedora"…) y cada objeto su `plural` en items.json, para el caso de varias unidades ("Recibiste 2 Manzanas de parte de la relojera"). Se escribe "Recibiste", que era la palabra pedida. Los cofres, los objetos del suelo y las compras no muestran este mensaje. El dinero de la recompensa tampoco, porque la historia habla de objetos.
- Mensajes temporales (src/ui/message.ts): si coinciden varios en la misma posición, se apilan (arriba, el nuevo debajo del anterior). El texto tiene un ancho máximo de 500 px y pasa a dos líneas antes de tapar los recuadros de la interfaz (día, hora, dinero y energía).
- **Cada objeto nuevo debe llevar `plural` en items.json** (fase 2 en adelante).

### Fase 2 de la ampliación: cultivo (HU-41 a HU-45)

- **Objetos nuevos** (items.json): Semilla de zanahoria (20), Semilla de calabaza (40), Hacha (40), Regadera (40), Caña de pescar (50), Nabo, Zanahoria y Calabaza. Los objetos que se compran tienen `price` y al venderlos se recibe el 50 %. Los que no se compran tienen `sellPrice` (HU-18): Nabo 15, Zanahoria 35, Calabaza 80 y Manzana 10. Las cosechas son consumibles: Nabo 10 de energía, Zanahoria 15 y Calabaza 30. La tienda vende los 7 objetos de HU-17, en ese orden (shop.json). El Hacha y la Caña ya se pueden comprar, aunque no se usan hasta la fase 3.
- **Huerto (HU-41):** es el punto `huerto` del mapa de la granja, en su casilla de arriba a la izquierda (17, 4), con las propiedades `columnas` 6 y `filas` 4. Ocupa los "campos" de tierra que ya había. Se puede andar por él. E actúa sobre la parcela que el personaje tiene **justo delante** (en la dirección en la que mira), siempre que no haya un NPC, cofre, cartel u objeto a tiro, que tienen prioridad. El indicador "E" aparece sobre esa parcela, salvo si no hay nada que hacer en ella (sembrada, regada hoy y aún sin terminar de crecer).
- **E sobre una parcela** (GameScene.workPlot): sin cavar, cava (necesita Pala; si no, "Necesitas una Pala"). Cavada y vacía, abre la lista de semillas (si no hay ninguna, "No tienes semillas"). Sembrada y lista, cosecha (primero comprueba que cabe: "Inventario lleno"). Sembrada y sin regar, riega (necesita Regadera; si no, "Necesitas una Regadera"). Cada acción gasta su energía a través de `work()` (HU-46 y HU-47). Al cosechar se suma 1 a `dayStats.harvests` (HU-39).
- **Lista de semillas (SeedScene):** pantalla encima de la partida, como el inventario. Muestra las semillas que se tienen, en el orden de crops.json, con su cantidad. ↑ ↓ eligen, Enter o E siembran y Escape cancela. La lista vertical se usa porque los nombres largos no caben en las opciones del cuadro de diálogo.
- **Estado:** `GameState.plots` guarda solo las parcelas que no están sin cavar, por su casilla ("x,y"), con `dug`, `seed`, `grown` y `watered`. La lógica está en src/systems/farm.ts y los cultivos en src/data/crops.json (semilla, cultivo, días y fotograma). Al despertar (en la cama o a medianoche), `growOvernight` hace crecer un día los cultivos regados y deja todas las parcelas sin regar. A medianoche se parte de la partida guardada, como siempre, y se aplica un solo día de crecimiento.
- **Aspecto:** public/assets/sprites/cultivos.png sale de `node tools/generar-sprites.mjs` (dibujos en texto con la paleta de Kenney), porque ninguno de los dos paquetes tiene cultivos. Contiene la tierra cavada, lo recién sembrado, el brote, la planta creciendo y los tres cultivos listos, cada uno distinto. El mismo script genera los iconos del Nabo, la Zanahoria y la Calabaza. Una parcela regada se oscurece con `WATERED_TINT`. Las parcelas se dibujan por debajo del personaje.
- **Manzano (HU-45):** es el punto `manzano` de la granja, en la casilla del tronco (12, 5), que es un obstáculo. El dibujo es un recorte de 32×32 del árbol redondo de TilesetNature (Ninja Adventure) y, cuando tiene fruta, lleva encima el icono de la Manzana. `GameState.applePickedDay` guarda el día en que se recogió: tiene fruta si nunca se ha recogido o si han pasado 2 días. No gasta energía. Sin fruta no hay indicador.
- **Tareas del día (HU-63):** se han añadido "Compra una Regadera" (día 1), "Cava, siembra y riega una parcela del huerto" (día 2), "Riega tus cultivos" (día 3) y "Recoge tu primera cosecha" (día 4), con los eventos "water" y "harvest".
- **Créditos:** credits.json y CREDITOS.md incluyen el manzano, los iconos nuevos y los gráficos generados. En CREDITOS.md, la primera tabla tenía filas de la segunda mezcladas y se ha corregido.
- En los tests, `moveTo()` espera ahora al evento `create` de la escena: antes terminaba antes de que la escena se reiniciara y el siguiente E llegaba a la escena antigua.

### Fase 3 de la ampliación: pesca y bosque (HU-48 a HU-51)

- **Bosque (HU-51):** es la séptima zona (zones.json, música bosque.mp3), generada por `bosque()` en tools/generar-mapas.mjs. Desde el lago se llega por un camino en el borde oeste: la puerta está en (0, 11–12) y se llega al lago en (1, 11). En el bosque, la salida está en el borde este (29, 10–11) y se llega en (28, 10). Hay un camino principal de este a oeste, tres ramales que llevan a claros (norte, sur y noreste) y bosque espeso alrededor. Abrir el camino del lago no ha movido ningún otro árbol, porque cada árbol depende solo de su casilla.
- **Recursos del bosque (HU-50):** puntos `recurso` del mapa con `id` (setas-1 a 4, moras-1 a 3, tronco-1 a 5) y `tipo`. En src/data/forage.json están el objeto que da cada tipo, su gráfico, la acción de energía y, para el tronco, la herramienta y el mensaje ("Necesitas un Hacha"). Son obstáculos. El orden de comprobación es: herramienta, después que quepa en el inventario ("Inventario lleno"; el punto sigue ahí y no se gasta energía) y después la energía. Lo recogido hoy se guarda en `GameState.foraged`, que se vacía al despertar.
- Objetos nuevos: Seta (comestible, 10 de energía, se vende por 8), Mora (comestible, 5, se vende por 5), Leña (3), Trucha (20), Carpa (15) y Siluro (50). Los peces no se pueden comer.
- **Pesca (HU-48):** E con el agua justo delante (una casilla de la hoja "agua", en el lago) lanza la caña (3 de energía) y aparece un corcho en el agua. Entre 2 y 5 s después sale "¡Pica!" (HUD, 1 s) y hay 1 s para pulsar E. E antes de tiempo da "Has tirado demasiado pronto". Si no se pulsa, "Se ha escapado". Una flecha o WASD recoge la caña sin pescar y la energía no se devuelve. Mientras se pesca, el personaje no se mueve. Los tiempos usan el reloj de la escena, así que con la pausa abierta se detienen y la pesca sigue al reanudar. Las constantes están en config.ts (`FISH_BITE_MIN_MS`, `FISH_BITE_MAX_MS` y `FISH_REACTION_MS`).
- **Peces (HU-49):** src/data/fish.json indica qué pez sale en cada franja horaria, con su rango de tamaño y su artículo ("una Trucha", "un Siluro"). El pez depende de la hora a la que pica, no de la hora a la que se lanzó la caña. El tamaño no se guarda en el inventario. `GameScene.getLastCatch()` devuelve el último pez con su tamaño, para el concurso de pesca (HU-60). Pescar suma 1 a `dayStats.fish` (HU-39).
- **Azar:** src/systems/random.ts. Todo valor al azar pasa por `random()` y `randomInt()`. En desarrollo, `window.setRandom([valores])` fija los siguientes valores, en orden y en bucle; con una lista vacía vuelve al azar normal. En la pesca, el primer valor es la espera hasta "¡Pica!" (0 son 2 s) y el segundo, el tamaño del pez.
- **Gráficos:**
  - Tocón y arbusto con bayas: recortes de 16×16 de TilesetNature (Ninja Adventure).
  - Setas: la casilla de las setas de Tiny Town.
  - Leña: Branch.
  - Peces: Trucha (pez blanco), Carpa (pez amarillo) y Siluro (Fish).
  - Icono de las Moras: generado en tools/generar-sprites.mjs.
  - Créditos: actualizados en credits.json y en CREDITOS.md.
- **Tareas del día 3 (HU-63):** "Pesca un pez en el lago", "Ve al bosque, al oeste del lago" y "Recoge setas o moras en el bosque". Para no pasar de 6, se ha quitado "Lee el cartel del lago"; la tarea del cofre del lago sigue.

### Fase 4 de la ampliación: pedidos del tablón (HU-52 a HU-54)

- **Tablón:** casilla 57 de Tiny Town (un tablón con un papel), sólida, en la plaza (17, 11), con el punto `tablon` (`addNoticeBoard` en el generador de mapas). No mueve ningún árbol: solo cambia esa casilla.
- **Pedidos:** src/data/orders.json tiene uno por día, del 1 al 6, que se repiten desde el día 7. Los títulos son decisión del autor, salvo "Leña para el horno", que da la historia: Moras para la mermelada, Trucha para la cena, Nabos para el puchero, Setas para la sopa y Carpa para el mercado. Cada pedido se identifica por el **día en que se ofreció**. `GameState.activeOrders` guarda los aceptados sin entregar y `acceptedOrderDays`, los días cuyo pedido se aceptó. Así el pedido del día 7 (que es el del día 1) es otro pedido distinto. La lógica está en src/systems/orders.ts.
- **E junto al tablón:** primero entrega todos los pedidos activos que tengan sus objetos ("Pedido completado" y el efecto de encargo completado). Si la recompensa de alguno no cabe en el inventario tal y como está, ese pedido sigue activo y aparece "Inventario lleno". Si no hay nada que entregar, abre el cuadro "Tablón de anuncios" (texto completo) con el pedido del día ("[título]. [descripción] Recompensa: …") y las opciones "Aceptar" y "Rechazar". Si ya se aceptó el de hoy, muestra "Ya has aceptado el pedido de hoy"; con 3 pedidos activos, "Ya tienes 3 pedidos activos". Rechazar solo cierra el cuadro y se puede volver a leer.
- Las recompensas de los pedidos suman a las monedas ganadas del día (HU-39). No muestran "Recibiste…" (HU-65), porque el tablón no es un NPC.
- Los pedidos no tocan `activeQuests`, así que no impiden aceptar ni completar un encargo principal (HU-53).
- **Lista de objetivos en dos columnas:** a la izquierda, "Encargos", con el encargo principal y después los pedidos ("Encargado por: Tablón de anuncios"); a la derecha, "Tareas de hoy (día N)". Con el encargo principal y 3 pedidos, la columna izquierda llega justo al borde inferior de la pantalla.

### Fase 5 de la ampliación: misterio (HU-55 y HU-56)

- **Páginas del diario (HU-55):** son puntos `pagina` con `id` (de pagina-1 a pagina-5). Los textos están en src/data/diary.json y cuentan que la relojera paró el reloj a propósito para que el pueblo descansara. Escondites (decisión del autor):
  - Página 1: plaza (2, 3), en la esquina del noroeste.
  - Página 2: granja (26, 18), en la esquina del sureste.
  - Página 3: lago (27, 11), en el claro del este.
  - Página 4: bosque (13, 2), al fondo del claro del norte.
  - Página 5: torre (8, 9).

  Se recogen con E, como la Pala (no son obstáculos), y aparece "Has encontrado una página del diario". Se guardan en `GameState.diaryPages` y no ocupan inventario. El gráfico es el pergamino Scroll de Ninja Adventure.
- **Lista de objetivos con dos apartados:** "Encargos" (la columna de encargos y pedidos, ahora con el título "Encargos activos", y la de tareas de hoy) y "Notas" (las 5 páginas en orden: "Página N" y su texto, o "Página sin encontrar"). Se cambian con ← → y al abrir la lista se ve "Encargos". El contenido de cada apartado se vuelve a crear al cambiar, para que sus textos no se queden ocultos en la escena. Para que quepan el encargo principal y 3 pedidos, los textos de la columna de encargos son más pequeños (18 y 16 px) y la columna es más ancha.
- **Puzle del reloj (HU-56):** el encargo 4 es ahora de tipo `mechanism`. Hablar con la relojera con el encargo activo solo da su diálogo `active`, con la pista "primero lo que gira, luego lo que empuja y arriba lo que marca el compás". El mecanismo es el punto `mecanismo` de la torre (5, 2), un obstáculo, y su dibujo se genera en tools/generar-sprites.mjs (antes generar-cultivos.mjs). Sin el encargo activo sale "Habla primero con la relojera", aunque se tengan las piezas. Lo decidió el autor tras encontrarse "Faltan piezas" el día 5 con las tres piezas en el inventario, porque el encargo no se ofrece hasta el día 6; se añadieron un criterio y el escenario 4 a HU-56. Con el encargo activo pero sin las tres piezas, sale "Faltan piezas". Con todo, se abre MechanismScene: tres huecos de abajo arriba; ↑ ↓ eligen la pieza, Enter o E la colocan en el siguiente hueco y Escape sale sin colocar nada.
- **Cuándo se comprueba el orden** (decisión tomada al implementar): al llenar el tercer hueco, no pieza a pieza, para que el jugador no pueda adivinarlo probando hueco por hueco. El orden correcto es el de los objetos del encargo en quests.json (Engranaje, Muelle y Péndulo).
  - Si el orden es correcto, se completa el encargo como siempre: "Encargo completado", la recompensa y "Recibiste 2 Manzanas de parte de la relojera" (HU-65), porque el encargo es suyo.
  - Si es incorrecto, sale "El reloj no arranca" y las piezas siguen en el inventario.
  - Las líneas `complete` de la relojera para el encargo 4 ya no se usan.
- **Tareas (HU-63):** "Encuentra una página del diario de la relojera" (día 5, evento "page") y "Coloca las tres piezas en el mecanismo del reloj" (día 6), que sustituye a "Repara el reloj con las tres piezas".

### Fase 6 de la ampliación: la feria (HU-58 a HU-60 y HU-66)

Rehecha después de jugarla, con las decisiones del autor: horario, visitantes, rivales, podio y ceremonia. Se reescribieron HU-58, HU-59 y HU-60, se añadió HU-66 y se ajustaron HU-24, HU-37 y HU-39.

- **Horario** (src/data/fair.json): el día 7 es festivo y el jugador se despierta a las **12:00** (`wakeUp` en sleep.ts, en la cama o a medianoche). Los concursos están abiertos de **12:00 a 17:00**. A las 17:00 aparece "Los concursos han terminado. Ceremonia a las 18:00 en la plaza". La **ceremonia** es a las **18:00**.
- **Plaza el día 7** (solo si `isFairDay()`):
  - Guirnalda (fila 12), los dos puestos (15, 14) y (19, 14), el **escenario** (casillas 21 a 23, filas 8 y 9) y el **podio** (casillas 26 a 28, filas 8 y 9). El escenario y el podio miden 48×32, son obstáculos y se dibujan en tools/generar-sprites.mjs, que ahora acepta dibujos de varias casillas de ancho.
  - **Visitantes:** Rosa (Villager4), Lucía (Villager3), Tomás (OldMan2) y Pablo (Child) de Ninja Adventure, más Fran y Elena (decisión del autor, con sus frases). Fran es Villager2 con la piel aclarada y Elena es Cavegirl con el pelo teñido de rubio. Son recolores hechos una vez (PIL), con los cambios de color anotados en CREDITOS.md; Fran y Elena no participan en los concursos. Son puntos `visitante` y su horario es "plaza, 12:00–24:00, solo el día 7"; los horarios admiten ahora `day`. Están en dialogues.json como NPC sin encargos, con un saludo de dos líneas. Los puntos `publico` marcan dónde se colocan en la ceremonia (y el jugador, `jugador`).
- **Concurso de la cosecha (HU-59):** se presenta una cosecha (ItemChoiceScene). Su peso sale al azar dentro del rango de su tipo (Nabo de 1 a 3 kg, Zanahoria de 2 a 5 y Calabaza de 6 a 15) y aparece "Has presentado una Calabaza de 9 kg. Resultados en la ceremonia de las 18:00". Se guarda en `GameState.harvestEntry`. Rivales fijos: Lucía (Calabaza de 11 kg), Tomás (Zanahoria de 4 kg) y Pablo (Nabo de 2 kg). Después de las 17:00, el puesto dice "El concurso ya ha terminado".
- **Concurso de pesca (HU-60):** inscribirse ("Sí") muestra "Ve al lago y lanza la caña para empezar" y deja `fishingContest.endsAt` en null. El concurso empieza al lanzar la caña por primera vez (`startFishingContestIfSignedUp`). Dura 90 minutos de juego, con cuenta atrás en la interfaz, y termina a las 17:00 como muy tarde. Una inscripción que no llega a empezar se cierra a las 17:00. Durante el concurso pican todas las especies y no se gasta energía. Al terminar se guarda el mayor pez en `fishingResult`. Rivales fijos: Rosa 62 cm, Tomás 48 cm y Pablo 35 cm.
- **Clasificación:** gana el mayor resultado. En caso de empate queda por delante el vecino: los vecinos van primero en la lista y la ordenación conserva el orden de los empatados. Premios para el jugador: 1.º 100, 2.º 50 y 3.º 20 monedas.
- **Ceremonia (HU-66):** empieza a las 18:00 si el jugador está en la plaza, o en cuanto entra en ella ese día, cuando no hay nada abierto.
  - El alcalde sube al escenario y los visitantes y el jugador se colocan delante. Durante la ceremonia no se aplican los horarios, así que también funciona si se llega después de las 20:00.
  - El alcalde anuncia los tres primeros de cada concurso (dialogues.json `ceremony`) mientras aparecen en el podio (1.º en medio, 2.º a la izquierda y 3.º a la derecha).
  - Al terminar cada anuncio, si el jugador está en el podio, cobra su premio y aparece "Premio: N monedas".
  - Después, si "La feria de Valtrigo" está activo o es el siguiente que toca (`ceremonyQuest`), el alcalde da su discurso desde el escenario: se completa el encargo, aparecen "Encargo completado" y "Recibiste Copa de Valtrigo…" y sale el mensaje de final.
  - `GameState.ceremonyDone` evita que se repita. Después de la ceremonia, el alcalde sigue en el escenario y los visitantes delante.
- **El encargo 6** (requirement `ceremony: true`): el día de la feria, hasta la ceremonia, el alcalde solo da su diálogo `active` ("Te espero a las seis en el escenario…"). Después de la feria se completa hablando con él (HU-58, escenario 4).
- **Tareas del día 7 (HU-63):** presentar una cosecha, inscribirse en el concurso de pesca, ir a la ceremonia (evento "ceremony") y escuchar el discurso del alcalde.

### Retoques de la feria y de los encargos (tras jugar la fase 6)

- **Cuenta atrás del concurso de pesca:** HudScene muestra "Concurso de pesca: m:ss" debajo del día y la hora mientras dura el concurso, en tiempo real (`contestCountdown()` en fair.ts).
- **Todas las especies en el concurso** (nota en HU-49): `catchAt(minutos, concurso)` usa un valor al azar más (la especie) entre la espera y el tamaño.
- **Regalo del alcalde:** al terminar "La feria de Valtrigo" el alcalde dice "Esto es para ti", pero solo daba monedas. Decisión del autor: la recompensa incluye ahora la **Copa de Valtrigo** (objeto de encargo, que no se vende ni se come; icono GoldCup de Ninja Adventure). Se ha actualizado historia-valtrigo.md.
- **Momento de los avisos** (decisión del autor; criterios de HU-20 y HU-65 actualizados): "Encargo completado" y "Recibiste…" ya no salen al empezar a hablar (desaparecían antes de que el NPC dijera "Esto es para ti"), sino cuando el NPC termina de hablar y entrega la recompensa. Lo mismo con la Carta de la vendedora. La recompensa se cobra al empezar el diálogo, como antes. `announceQuestCompleted()` en GameScene. En el mecanismo del reloj no hay diálogo, así que los avisos salen al colocar la última pieza. Los tests de HU-20, HU-32, HU-37, HU-58 y HU-65 recorren ahora el diálogo antes de comprobar los avisos.
- El indicador "E" mirando al agua se dibuja dentro de la casilla de agua, porque encima tapaba la cara del personaje.

### Nombre del jugador (HU-67)

- Decisión del autor: en el podio debía salir el nombre del jugador en vez de "tú", y el jugador no tenía nombre. Con HU-67, después de la introducción (o al saltarla con Escape) aparece NameScene, "¿Cómo te llamas?": letras (con tilde, ñ y ü) y espacios, hasta 12 caracteres. Retroceso borra y Enter confirma; con el nombre vacío no hace nada. Se ajustaron HU-02, HU-62 y HU-66.
- NameScene escucha el `keydown` del navegador (window) y no el de Phaser. Con el evento genérico de Phaser, varias teclas pulsadas en el mismo fotograma llegaban repetidas ("Juan" se convertía en "JJuJuJua…"). El listener se quita al cerrar la escena.
- `GameState.playerName`. Las partidas guardadas sin nombre se cargan como "Forastero".
- GameScene.openDialog sustituye `{nombre}` en las líneas de diálogo por el nombre del jugador. Lo usa el discurso del alcalde (encargo 6, `complete`).
- En los tests, `passIntro()` y `startNewGame()` escriben "Juan" en la pantalla del nombre (`enterName`), y la partida guardada de ejemplo se llama "Juan".
- El escenario 1 de HU-06 (velocidad constante) fallaba a veces en la batería completa: tomaba muestras desde Playwright cada 250 ms y, con el equipo cargado, las esperas se alargaban. Ahora toma las muestras dentro del navegador, con la hora real de cada fotograma, y compara lo que se avanza por segundo, con el mismo margen del ±40 %.
- HU-60 (escenarios 2, 5 y 6) y HU-49 (escenario 4) tenían carreras con el reloj: leían la hora justo después de lanzar la caña y podía haber avanzado un minuto. Ahora el inicio del concurso se calcula como la hora de fin menos 90. En el escenario 6, la hora y la cuenta atrás se leen en el mismo fotograma. El escenario 4 de HU-49 empieza a las 09:58, con unos 3 s hasta "¡Pica!", para lanzar antes de las 10:00 aunque el equipo vaya cargado.

### Fase 7 de la ampliación: partidas de práctica (HU-61 y HU-01)

- El menú principal tiene la opción "Partidas de práctica", entre "Continuar" y "Guardar partida" (HU-01). Las opciones están ahora a 46 px de distancia para que quepan las 7. Los tests que llegan a una opción contando flechas se han ajustado.
- **Aclaraciones del autor en HU-61:** la zona de cada partida y la hora de inicio, que es la de su día en el juego: 06:00, salvo el día 1 (08:00) y el día 7 (12:00). Todas empiezan con 150 monedas y el jugador se llama "Forastero". "Día 7: la feria" trae una Calabaza y una Caña de pescar para los concursos.
- Las partidas están en src/data/practice.json: día, zona, punto del mapa donde empiezan (llegada o inicio, con su `mirando`), encargos completados y activos, inventario, cofres abiertos, objetos recogidos, zonas visitadas y huerto. src/systems/practice.ts parte de una partida nueva y aplica esos cambios. "Inventario lleno" ocupa las 20 casillas con 99 unidades cada una, para que no quepa nada.
- PracticeScene usa MenuList, como el menú principal. Al elegir una partida empieza directamente en GameScene, sin introducción ni pantalla del nombre, y no toca la partida guardada (se guarda al dormir o desde la pausa, como cualquier partida). "Volver" o Escape regresan al menú con "Partidas de práctica" seleccionada.

### Mejoras visuales, ayuda en las esquinas y aspecto del personaje (HU-68)

- **Árboles (HU-69, historia nueva, decisión del autor):** Tiny Town tiene árboles altos de dos casillas (copa arriba y tronco abajo: verde 4/16, otoñal 3/15) y pequeños de una (verde 28, otoñal 27). Antes se usaban sueltas la mitad de abajo del verde (16) y la de arriba del otoñal (3), y salían árboles cortados o mitad amarillos y mitad verdes. Ahora `addTrees` solo marca las casillas con árbol y `shapeTrees` (tools/generar-mapas.mjs) las dibuja al final: dos casillas de árbol una encima de otra forman un árbol alto y una suelta, uno pequeño. **Las casillas sólidas son exactamente las mismas que antes** (comprobado en los cuatro mapas exteriores), así que no cambia ninguna colisión ni ningún camino.
- **Postes de la guirnalda (HU-58, criterio y escenario 8 añadidos):** la guirnalda de la feria tiene un poste de madera en cada extremo (poste-guirnalda.png, 16×32, generado en tools/generar-sprites.mjs). Los postes son obstáculos el día 7, como los puestos. La guirnalda va de la casilla 8 a la 29 de la fila 12 (antes llegaba a la 31): con el poste en la 31 se habría tapado la entrada de la tienda.
- **Ayuda en las esquinas (HU-07, criterio y escenario 5 añadidos):** el cuerpo del personaje mide 14 px y un hueco de una casilla, 16, así que solo se entraba llegando casi perfectamente alineado (el jugador se atascaba, por ejemplo, en la entrada del cercado del granero). Ahora, si la dirección que manda está bloqueada pero quedaría libre desplazándose de lado 6 px o menos (`CORNER_ASSIST` en Player.ts), el personaje se desliza de lado, mirando hacia donde camina, hasta alinearse con el hueco. Se comprueba antes que las demás direcciones pulsadas. Se desliza solo lo necesario para caber, no hasta el centro de la casilla.
- Todo cambio del juego tiene que estar en una historia: si una mejora no encaja en ninguna, se crea una nueva (HU-68, HU-69...) y se actualiza docs/jira/historias.csv.
- En desarrollo, GameScene tiene `getGarland()` y `getObstacleGrid()` para los tests de HU-58 y HU-69.
- **HU-68 (historia nueva, decisión del autor):** después del nombre, la pantalla "¿Cómo eres?" (AppearanceScene) permite elegir Género (Hombre o Mujer), Piel (Clara, Media u Oscura) y Pelo (Castaño, Negro, Pelirrojo o Rubio). Se han ajustado HU-02, HU-47, HU-61, HU-62 y HU-67, y docs/jira/historias.csv.
  - Hojas base: el jugador es Boy (jugador.png, como antes) y la jugadora, Princess (jugadora.png) de Ninja Adventure. Se eligió Princess y no Cavegirl2 porque es la única con aspecto de aldeana.
  - La piel y el pelo se recolorean en el juego (src/systems/appearance.ts, `playerTexture`): cada hoja base indica en src/data/appearance.json sus colores de piel y de pelo (el claro y el de sombra) y se sustituyen por los del valor elegido. Cada combinación se crea una vez como hoja `jugador-<género>-<piel>-<pelo>`, con sus propias animaciones.
  - El aspecto inicial (Hombre, piel Media, pelo Pelirrojo) es la hoja de Boy sin cambios. Lo tienen las partidas guardadas sin aspecto y las partidas de práctica.
  - ↑ ↓ eligen la opción y ← → el valor, sin dar la vuelta (como los menús), con los efectos de navegación y confirmación. Las flechas `<` y `>` solo se ven si hay más valores hacia ese lado. La vista previa (×10) gira un segundo hacia cada lado.
  - AppearanceScene se abre con el mismo Enter que confirma el nombre: no cuenta las teclas pulsadas antes de abrirse.
  - **Textos según el género:** en dialogues.json, `{masculino|femenino}` se sustituye al abrir un diálogo (por ejemplo, "¡Bienvenid{o|a} a la tienda!"). En el código, `byGender()`, como en "Estás demasiado cansado/cansada" (HU-47). Son los dos únicos textos que se dirigen al jugador con género. Si se añade otro, hay que marcarlo así.
  - En los tests, `enterName()` confirma además el aspecto inicial; `typeName()` se queda en la pantalla del aspecto.

### Pase de contenido antes de la siembra (HU-70 a HU-80)

- Decisiones del autor: el barrio es una zona nueva al oeste de la plaza (HU-70); los vecinos nuevos y unas 12 misiones secundarias, tal como se propusieron (HU-71 a HU-74); los costes de energía se doblan (HU-76). Orden: HU-80, HU-70 y HU-71, HU-72 a HU-74, HU-75 y HU-76, y HU-77 a HU-79.
- **Interfaz con iconos (HU-80, historia nueva):** decisión del autor: icono y número. Se han cambiado HU-14 (la energía es "[actual]/100") y HU-16 (el dinero es solo la cantidad) y sus tests.
  - HudScene dibuja dos paneles (fondo `COLORS.background` y borde `HUD_BORDER`): a la izquierda, sol o luna, día y hora; a la derecha, moneda y dinero, rayo y energía y, debajo, la barra. La cuenta atrás del concurso de pesca tiene su propio panel debajo del de la hora. El panel derecho tiene ancho fijo, para que no se mueva al cambiar las cifras, y no llega a la zona de los mensajes de arriba.
  - Sol de 06:00 a 19:59 y luna de 20:00 a 05:59 (`isDaytime()` en time.ts, con la misma hora de anochecer que HU-23).
  - Barra de energía (`ENERGY_COLORS` en config.ts): verde por encima de 50, amarilla de 26 a 50 y roja de 25 o menos.
  - Los iconos (sol.png, luna.png, moneda.png y energia.png, en public/assets/sprites/iconos/) se dibujan en tools/generar-sprites.mjs, porque la moneda de Ninja Adventure mide 7×7 y no hay sol, luna ni rayo. Se cargan en BootScene como `icono-<nombre>`.
  - En los tests, `hudIcons()` (helpers.ts) devuelve el icono de la hora, si la moneda va delante del dinero y el relleno y el color de la barra.
- **El barrio (HU-70):** zona `barrio` (30×22, `barrio()` en tools/generar-mapas.mjs), con la música barrio.mp3 (del autor, generada con Flow). Se llega por el camino del oeste de la plaza: la puerta está en (0, 13–15) y se llega a la plaza en (1, 14); en el barrio, la salida está en (29, 10–12) y se llega en (28, 11). Abrir ese camino solo ha cambiado las seis casillas de árbol del borde.
  - Cinco casas: arriba, la de Tomás y Pablo (puerta en 6, 7) y la de Lucía (16, 7), que son las zonas `casa-tomas` (12×9) y `casa-lucia` (10×8); abajo, la de Rosa (6, 16), la de Fran (16, 16) y la de Elena (23, 16), cerradas. Fran y Elena no son pareja (decisión del autor): cada uno vive en su casa. Cada casa tiene un cartel a su izquierda con el nombre (signs.json).
  - Las puertas cerradas son puntos `puerta` con la propiedad `cerrada` (su id en src/data/houses.json) en lugar de `zona`. Al caminar hacia ellas aparece "La puerta está cerrada", con el nombre de la casa como título, igual que las puertas cerradas de HU-57.
  - `interior()` acepta la zona a la que sale la puerta (por defecto, la plaza).
  - **Clave de la música:** sale del nombre del archivo (`musicKey()` en zones.ts), no de la zona, para que las casas de los vecinos compartan `music-casa` con la casa del jugador sin reiniciarla. Las demás zonas no cambian, porque su archivo se llama como ellas.
  - El cartel de la plaza dice ahora "Al oeste, tu casa y el barrio".
  - Tarea del día 4 (HU-63): "Visita el barrio, al oeste de la plaza".
- **Los vecinos (HU-71):** Bruno (Hunter), Marta (Villager5) y Bigotes (Cat, el gato naranja con bigotes del retrato) de Ninja Adventure.
  - Horarios en schedules.json. Los tramos admiten `notOnDay` (todos los días menos ese): los seis vecinos de la feria y Marta lo usan con el día 7, en el que solo valen sus tramos de la feria. Bruno y Bigotes no tienen excepción.
  - En la plaza, los vecinos de la feria usan los puntos `visitante` también entre semana. En las demás zonas son puntos `npc`, y un mismo vecino puede tener un punto en varias zonas.
  - HU-58 decía que fuera del día 7 no había visitantes en la plaza. Se ha cambiado: fuera del día 7 no hay decoración de feria y los vecinos están donde marque su horario.
  - Diálogos: `greeting` es el saludo de entre semana y `fairGreeting`, el de la feria (lo que decían antes). `conversationWith()` usa `fairGreeting` el día 7, por delante de `clockRepaired`.
- **Correr (HU-81, historia nueva, petición del autor):** Mayús activa y desactiva correr (decisión del autor: interruptor, no mantener pulsada). Corriendo, el personaje va al doble de velocidad (`RUN_SPEED_FACTOR` en config.ts), con la animación (`anims.timeScale`) y los pasos al doble de rápido. No gasta energía. El estado está en gameState.ts (`isRunning()` y `toggleRunning()`), fuera de `GameState`: no se guarda, se pone a andar al empezar o cargar una partida y se mantiene al cambiar de zona. Se eligió Mayús y no Alt porque en el navegador Alt+← vuelve a la página anterior (se saldría del juego) y en Windows Alt abre el menú. La tabla de controles (HU-33) tiene ahora siete filas.
- **Confirmar con E (HU-82, historia nueva, decisión del autor):** dentro de la partida, todo lo que se confirma con Enter se confirma también con E (tienda, inventario, "¿Dormir?", inscripción al concurso, menú de pausa y su confirmación; el diálogo, el mecanismo y las listas de semillas y cosechas ya lo hacían). El menú principal, las opciones, el nombre y el aspecto siguen solo con Enter.
  - `onConfirmKeys()` (src/ui/confirmKeys.ts) registra Enter y, si se pide, E. Ignora las pulsaciones anteriores a abrir la pantalla: la E que abre "¿Dormir?" llega también a HudScene en el mismo fotograma y, sin esto, contestaba "No" nada más abrirse.
  - `showConfirmDialog(..., withE)` y `MenuList` (`confirmWithE`) lo usan; la pausa y los cuadros de la partida lo activan.
  - Las ayudas de abajo dicen "E: colocar", "E: sembrar"... y la tabla de controles, "Usar objeto: E o Enter".

