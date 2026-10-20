# HU-38. Encargos principales por día

# HU-38. Encargos principales por día

Como jugador, quiero que los encargos principales lleguen a lo largo de la semana para que la historia avance día a día.

Criterios de aceptación:

- Cada encargo principal se ofrece a partir de su día: “Entregar la Carta del alcalde” el día 1, “Semillas para la cosecha” el día 2, “Día de mercado” el día 4, “Las piezas del reloj” y “Manzanas para la feria” el día 6 y “La feria de Valtrigo” el día 7.
- Un encargo se ofrece si ha llegado su día y están completados todos los anteriores. Si su día ya ha pasado, se sigue ofreciendo.
- Si su día aún no ha llegado, el NPC dice su diálogo normal, sin ofrecer el encargo.
Escenario 1: Antes de su día

- Dado que es el día 1 y el encargo “Entregar la Carta del alcalde” está completado
- Cuando el jugador habla con el granjero
- Entonces el granjero no ofrece el encargo “Semillas para la cosecha”
Escenario 2: El día del encargo

- Dado que es el día 2 y el encargo “Entregar la Carta del alcalde” está completado
- Cuando el jugador habla con el granjero
- Entonces el granjero ofrece el encargo “Semillas para la cosecha”
Escenario 3: Después de su día

- Dado que es el día 3, el encargo “Entregar la Carta del alcalde” está completado y el jugador no ha aceptado el encargo “Semillas para la cosecha”
- Cuando el jugador habla con el granjero
- Entonces el granjero ofrece el encargo “Semillas para la cosecha”
Escenario 4: Encargo anterior sin completar

- Dado que es el día 4 y el encargo “Semillas para la cosecha” no está completado
- Cuando el jugador habla con la vendedora
- Entonces la vendedora no ofrece el encargo “Día de mercado”
