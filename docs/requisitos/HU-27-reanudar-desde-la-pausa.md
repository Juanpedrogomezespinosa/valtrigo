# HU-27. Reanudar desde la pausa

# HU-27. Reanudar desde la pausa

Como jugador, quiero reanudar la partida desde el menú de pausa para seguir donde lo dejé.

Criterios de aceptación:

- Al pulsar “Continuar” o volver a pulsar Escape, el juego se reanuda.
- Al reanudar, el personaje y el reloj siguen en el mismo punto en que se pausó.
Escenario 1: Reanudar con el botón

- Dado que el menú de pausa está abierto
- Cuando el jugador pulsa “Continuar”
- Entonces el menú de pausa se cierra y el juego continúa
Escenario 2: Reanudar con Escape

- Dado que el menú de pausa está abierto
- Cuando el jugador vuelve a pulsar Escape
- Entonces el menú de pausa se cierra y el juego continúa
Escenario 3: Misma posición y hora

- Dado que el personaje está junto a un NPC a las 10:00 y el jugador abre la pausa
- Cuando el jugador reanuda la partida
- Entonces el personaje sigue junto al NPC
- Y el reloj marca las 10:00 y continúa avanzando

