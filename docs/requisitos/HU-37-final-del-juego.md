# HU-37. Final del juego

# HU-37. Final del juego

Como jugador, quiero ver un final al completar la historia para saber que he terminado el juego.

Criterios de aceptación:

- Al completar el último encargo (“La feria de Valtrigo”), cuando se cierra el diálogo del alcalde (el discurso de la ceremonia, HU-66, o su diálogo si se completa después de la feria) aparece el mensaje de final.
- El mensaje de final se cierra con E y el jugador puede seguir jugando en el pueblo.
- El mensaje de final solo aparece una vez.
Escenario 1: Ver el final

- Dado que el jugador tiene activo el encargo “La feria de Valtrigo”
- Cuando habla con el alcalde y se cierra su diálogo
- Entonces aparece el mensaje de final
Escenario 2: Seguir jugando

- Dado que el mensaje de final está visible
- Cuando el jugador lo cierra con E
- Entonces puede moverse por el pueblo con normalidad
Escenario 3: Solo una vez

- Dado que el jugador ya ha completado el último encargo
- Cuando vuelve a hablar con el alcalde
- Entonces no aparece el mensaje de final

