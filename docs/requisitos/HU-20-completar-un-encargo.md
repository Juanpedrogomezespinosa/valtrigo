# HU-20. Completar un encargo

# HU-20. Completar un encargo

Como jugador, quiero completar encargos y recibir recompensas para avanzar en la historia.

Criterios de aceptación:

- Un encargo se completa cuando se cumplen sus condiciones.
- Al completarlo aparece el mensaje “Encargo completado” y se entregan las recompensas en monedas y en objetos.
- Un encargo completado no se puede reclamar otra vez.
Escenario 1: Completar el encargo

- Dado que el jugador tiene activo el encargo “Entregar la Carta del alcalde” y tiene la Carta del alcalde
- Cuando habla con el alcalde y entrega la carta
- Entonces aparece el mensaje “Encargo completado”
- Y el jugador recibe 50 monedas y 1 Manzana
- Y la Carta del alcalde desaparece del inventario
Escenario 2: Reclamar un encargo ya completado

- Dado que el encargo “Entregar la Carta del alcalde” ya está completado
- Cuando el jugador vuelve a hablar con el alcalde
- Entonces no se entrega ninguna recompensa
Escenario 3: Inventario lleno al completar

- Dado que el inventario está completo
- Cuando el jugador completa el encargo que da una Manzana
- Entonces aparece el mensaje “Inventario lleno”
- Y el encargo no se marca como completado

