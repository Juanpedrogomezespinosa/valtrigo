# HU-04. Guardar partida desde el menú principal

# HU-04. Guardar partida desde el menú principal

Como jugador, quiero guardar mi partida para poder retomarla más tarde.

Criterios de aceptación:

- “Guardar partida” está desactivada en el menú principal si no hay partida en curso.
- Al guardar, se sobrescribe la única partida guardada.
- Al guardar aparece el mensaje “Partida guardada” durante 2 segundos.
Escenario 1: Guardar una partida en curso

- Dado que el jugador tiene una partida en curso
- Cuando pulsa “Guardar partida” desde el menú de pausa
- Entonces aparece el mensaje “Partida guardada” durante 2 segundos
- Y la partida guardada refleja el estado actual del juego
Escenario 2: Guardar desactivado sin partida en curso

- Dado que no hay ninguna partida en curso
- Cuando el jugador abre el menú principal
- Entonces “Guardar partida” aparece desactivada
Escenario 3: Sobrescribir la partida guardada

- Dado que existe una partida guardada del día 2
- Cuando el jugador guarda la partida en el día 4
- Entonces la partida del día 2 se reemplaza por la del día 4

