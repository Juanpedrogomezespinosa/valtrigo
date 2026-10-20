# HU-21. Ver la lista de objetivos

# HU-21. Ver la lista de objetivos

Como jugador, quiero consultar mis objetivos activos para saber qué hacer después.

Criterios de aceptación:

- Al pulsar O se muestra la lista de encargos activos. Al pulsar O o Escape se cierra.
- Cada encargo muestra su nombre, su descripción y el NPC que lo encargó.
- Si no hay encargos activos, aparece el mensaje “No tienes encargos activos”.
Escenario 1: Ver un encargo activo

- Dado que el jugador tiene activo el encargo “Entregar la Carta del alcalde”
- Cuando pulsa O
- Entonces aparece el encargo con su nombre, su descripción y el alcalde como NPC que lo encargó
Escenario 2: Sin encargos activos

- Dado que el jugador no tiene encargos activos
- Cuando pulsa O
- Entonces aparece el mensaje “No tienes encargos activos”
Escenario 3: Encargo completado

- Dado que el encargo “Entregar la Carta del alcalde” se ha completado
- Cuando el jugador pulsa O
- Entonces el encargo no aparece en la lista

