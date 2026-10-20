# HU-01. Ver el menú principal al abrir el juego

# HU-01. Ver el menú principal al abrir el juego

Como jugador, quiero ver un menú principal al abrir el juego para elegir qué hacer.

Criterios de aceptación:

- Al abrir el juego suena la música propia del menú principal.
- El menú muestra las opciones “Nueva partida”, “Continuar”, “Guardar partida”, “Opciones”, “Créditos” y “Salir”, en ese orden.
- “Continuar” solo está activa si existe una partida guardada.
- “Guardar partida” está desactivada si no hay partida en curso.
Escenario 1: Primera apertura del juego

- Dado que el jugador abre el juego por primera vez
- Cuando se carga el menú principal
- Entonces suena la música del menú
- Y aparecen las opciones “Nueva partida”, “Continuar”, “Guardar partida”, “Opciones”, “Créditos” y “Salir”
- Y “Continuar” y “Guardar partida” aparecen desactivadas
Escenario 2: Con partida guardada

- Dado que existe una partida guardada
- Cuando el jugador abre el juego
- Entonces “Continuar” aparece activa
Escenario 3: Navegación con teclado

- Dado que el menú principal está abierto
- Cuando el jugador pulsa la flecha arriba o abajo
- Entonces la selección pasa a la opción anterior o siguiente, sin saltar ninguna
- Y al pulsar Enter se activa la opción seleccionada
Escenario 4: Opción desactivada

- Dado que no existe ninguna partida guardada
- Cuando el jugador selecciona “Continuar” y pulsa Enter
- Entonces no ocurre nada y la selección se mantiene en “Continuar”
Escenario 5: Volver desde Opciones

- Dado que el jugador ha abierto “Opciones” desde el menú principal
- Cuando pulsa “Volver” o Escape
- Entonces regresa al menú principal con “Opciones” seleccionada

