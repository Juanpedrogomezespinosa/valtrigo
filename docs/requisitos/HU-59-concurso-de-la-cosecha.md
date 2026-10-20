# HU-59. Concurso de la cosecha

# HU-59. Concurso de la cosecha

Como jugador, quiero presentar mi mejor cosecha en la feria para ganar un premio.

Criterios de aceptación:

- Al pulsar E junto al puesto de la cosecha aparece la lista de cosechas del inventario. Al elegir una, se entrega y se cobra el premio: Nabo 20 monedas, Zanahoria 50 y Calabaza 100.
- Solo se puede participar una vez por partida. Después, el puesto muestra “Ya has participado”.
- Sin cosechas aparece el mensaje “Necesitas una cosecha para participar”.
Escenario 1: Participar

- Dado que el jugador tiene una Calabaza
- Cuando la presenta en el puesto de la cosecha
- Entonces recibe 100 monedas
- Y la Calabaza desaparece del inventario
Escenario 2: Solo una vez

- Dado que el jugador ya ha participado en el concurso de la cosecha
- Cuando pulsa E junto al puesto
- Entonces aparece el mensaje “Ya has participado”
Escenario 3: Sin cosechas

- Dado que el jugador no tiene cosechas
- Cuando pulsa E junto al puesto de la cosecha
- Entonces aparece el mensaje “Necesitas una cosecha para participar”
