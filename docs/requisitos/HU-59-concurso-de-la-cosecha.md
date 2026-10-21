# HU-59. Concurso de la cosecha

# HU-59. Concurso de la cosecha

Como jugador, quiero presentar mi mejor cosecha en la feria para ganar un premio.

Criterios de aceptación:

- De 12:00 a 17:00 del día 7, al pulsar E junto al puesto de la cosecha aparece la lista de cosechas del inventario. Al elegir una, se entrega y aparece el mensaje “Has presentado [cosecha] de [peso] kg. Resultados en la ceremonia de las 18:00”.
- Cada cosecha presentada pesa un número de kilos al azar dentro de su rango: Nabo de 1 a 3, Zanahoria de 2 a 5 y Calabaza de 6 a 15.
- Compiten también tres vecinos con resultados fijos: Lucía (Calabaza de 11 kg), Tomás (Zanahoria de 4 kg) y Pablo (Nabo de 2 kg). Gana la cosecha más pesada. En caso de empate, queda por delante el vecino.
- Los tres primeros se anuncian en la ceremonia (HU-66). Premios para el jugador: 1.º 100 monedas, 2.º 50 y 3.º 20.
- Solo se puede participar una vez por partida. Después, el puesto muestra “Ya has participado”.
- Sin cosechas aparece el mensaje “Necesitas una cosecha para participar”.
- Después de las 17:00, el puesto muestra “El concurso ya ha terminado”.
Escenario 1: Participar

- Dado que es el día 7 a las 13:00 y el jugador tiene una Calabaza
- Cuando la presenta en el puesto de la cosecha
- Entonces la Calabaza desaparece del inventario
- Y aparece el mensaje “Has presentado una Calabaza de [peso] kg. Resultados en la ceremonia de las 18:00”, con un peso entre 6 y 15
Escenario 2: Solo una vez

- Dado que el jugador ya ha participado en el concurso de la cosecha
- Cuando pulsa E junto al puesto
- Entonces aparece el mensaje “Ya has participado”
Escenario 3: Sin cosechas

- Dado que el jugador no tiene cosechas
- Cuando pulsa E junto al puesto de la cosecha
- Entonces aparece el mensaje “Necesitas una cosecha para participar”
Escenario 4: Concurso terminado

- Dado que es el día 7 a las 17:30 y el jugador tiene una Calabaza
- Cuando pulsa E junto al puesto de la cosecha
- Entonces aparece el mensaje “El concurso ya ha terminado”
- Y la Calabaza sigue en el inventario
