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
