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
  Cada pieza sigue en el sitio que dice la historia del juego (Engranaje en el granero, Muelle en el lago, Péndulo en la torre). El claro del este del lago queda vacío, como pista falsa. Son obstáculos y se ven abiertos cuando su `id` está en `openedChests`.
- Los pasillos de los escondites están pensados para que el personaje quede alineado al llegar (al subir hasta los árboles del borde en la granja, al bajar hasta los árboles de la fila 18 en el lago) y la entrada del almacén de la torre mide dos casillas.
- **La Pala** (decisión del autor: se encuentra en la granja) está en el suelo junto al granero. Se recoge con E y desaparece del mapa. Queda anotada en `pickedUpItems`, un campo nuevo de `GameState`; las partidas guardadas que no lo tengan se cargan con la lista vacía. Criterio y escenario 5 añadidos a HU-12.
- Carteles con pistas (decisión del autor): dos en la plaza (centro y camino del lago), uno a la entrada de la granja y otro a la entrada del lago. Dan pistas de los escondites de los cofres. Son casillas sólidas. Su texto aparece completo, sin escribirse letra a letra, porque HU-12 dice que la segunda E lo cierra.
- Todo lo que se activa con E (NPC, cofres cerrados, carteles y objetos) usa el mismo alcance (menos de una casilla) y el mismo indicador "E". Un cofre ya abierto no muestra el indicador.
- El cuadro de diálogo (DialogScene) sirve para NPC y carteles: título, retrato opcional y texto letra a letra o completo.

### Encargos (HU-11, HU-19, HU-20 y HU-21)

- Los 6 encargos están en src/data/quests.json, en el orden de la historia del juego, con nombre, descripción, NPC, condición y recompensa. Tipos de condición: `deliver` (entregar objetos al NPC), `sell` (vender en la tienda; se cuenta desde que se acepta el encargo, en `questProgress`) y `talk` (hablar con el NPC con el encargo activo).
- Todos se completan al hablar con el NPC que los encargó cuando se cumplen sus condiciones. El encargo 6 ("hablar con el alcalde durante la feria") se completa la siguiente vez que se habla con él después de aceptarlo.
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
- **Puertas cerradas (HU-57 y HU-17):** en zones.json, `opensOnDay` (la torre abre el día 5) y `closedMessage`. La tienda está cerrada fuera de su horario (shop.json). La lógica está en src/systems/doors.ts. Al caminar hacia una puerta cerrada se abre el cuadro de diálogo, con el nombre de la zona como título y el texto completo. Se cierra con E y no se cambia de zona. El aviso no se repite hasta que el personaje deja de caminar hacia esa puerta, para que mantener la flecha pulsada no lo reabra sin parar. Salir de un edificio siempre está permitido. Dentro de la tienda, a partir de las 19:00, hablar con la vendedora sigue mostrando el mensaje "La tienda está cerrada".
- **Horarios de los NPC (HU-40):** están en src/data/schedules.json y la lógica en src/systems/schedules.ts. Cada tramo va desde `from` hasta antes de `to`, así que a las 20:00 el alcalde ya no está. **La vendedora no tiene horario** (decisión tomada al implementar, pendiente de confirmar): está siempre en la tienda, porque la tienda ya solo se visita en su horario y HU-17 (escenario 5) necesita que esté dentro a las 19:00. Un NPC fuera de su horario no se ve, no es un obstáculo y no se puede hablar con él. GameScene revisa los horarios en cada fotograma. El NPC con el que se está hablando no cambia hasta que se cierra el diálogo.
- **Energía (HU-46 y HU-47):** los costes están en src/data/energy.json (cavar, sembrar, regar, cosechar, lanzar la caña, talar y recoger setas o moras) y la lógica en src/systems/energy.ts. Cada acción de trabajo debe pasar por `GameScene.work(acción)`. Si la energía no alcanza, aparece "Estás demasiado cansado" (2 s, arriba), no se gasta nada y la acción no se hace, así que la energía nunca baja de 0. El concurso de pesca (HU-60) tendrá que saltarse el gasto de la caña.
- **Tests pendientes:** HU-46 (escenario 1) y HU-47 (escenarios 1 a 3) están como `test.fixme` hasta HU-41, porque necesitan cavar. HU-39 (escenario 1) está como `test.fixme` hasta HU-44 y HU-48 (Nabos y Trucha).
- **Resumen del día (HU-39):** `GameState.dayStats` guarda las monedas ganadas (ventas en sellOne y recompensas en completeQuest), las cosechas y los peces. Las compras no restan. Se pone a cero al despertar y se guarda con la partida (las partidas antiguas lo cargan a cero). DaySummaryScene aparece sobre la pantalla en negro con "Día N terminado", las tres cifras y "Pulsa E para continuar". Con E empieza el día siguiente. A medianoche no aparece.
- **Catálogo nuevo de la tienda (HU-17):** se deja para la fase 2 (cultivo), junto con los objetos que vende.
- En los tests, `moveTo()` (helpers.ts) lleva al personaje a otra zona sin recorrer el camino, para preparar un escenario (por ejemplo, comprar en la tienda y dormir en casa).
- **Bug encontrado al jugar (HU-40, escenarios 6 y 7 añadidos por decisión del autor):** el alcalde ausente bloqueaba al personaje en su sitio. Phaser deja los cuerpos estáticos desactivados en su árbol de búsqueda y `overlapRect` los seguía devolviendo, así que la comprobación de bloqueo de Player los contaba aunque la física los ignorara. El personaje entraba en la casilla del NPC y ya no podía salir. Ahora `canMove` ignora los cuerpos desactivados. Además, si al llegar su hora el jugador ocupa el sitio del NPC, este no aparece hasta que el jugador se aparta.

### Introducción y comienzo del día 1 (HU-62)

- Decisión del autor para evitar las horas muertas del día 1 (de 06:00 a 08:00 no había nada que hacer): una historia nueva, HU-62, con una introducción, y la partida nueva empieza el día 1 a las **08:00**, con el alcalde ya en la plaza. Se han cambiado HU-02 y HU-22 (escenario 1). Los demás días siguen empezando a las 06:00. Se usa el número HU-62, que había quedado libre al descartar "amistad".
- IntroScene muestra los textos de src/data/intro.json, una pantalla cada vez, con el contador "N / total". E pasa a la siguiente pantalla y Escape la salta. La partida ya está creada (y guardada, si se ha confirmado sobrescribir), pero el reloj no avanza hasta que se abre GameScene. Mientras tanto sigue sonando la música del menú. "Continuar" no muestra la introducción.
- En los tests, `startNewGame()` y `passIntro()` (helpers.ts) pasan la introducción con E. El escenario 2 de HU-22 empieza ahora en una partida cargada a las 06:00, porque la partida nueva empieza a las 08:00.
- docs/jira/historias.csv se ha actualizado con HU-02, HU-22, HU-40 y la nueva HU-62.
