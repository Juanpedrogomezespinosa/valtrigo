# HU-71. Los vecinos

# HU-71. Los vecinos

Como jugador, quiero encontrarme a los vecinos por el pueblo durante toda la semana para que Valtrigo parezca un pueblo de verdad.

Criterios de aceptación:

- Los seis vecinos de la feria (Rosa, Lucía, Tomás, Pablo, Fran y Elena) viven en el pueblo y siguen un horario por zonas del día 1 al día 6, como los NPC de HU-40.
- Hay tres vecinos nuevos: Bruno, el leñador, que está en el bosque; Marta, la cartera, que recorre el pueblo; y Bigotes, el gato de Pablo.
- Horarios del día 1 al día 6 (cada tramo va desde la primera hora hasta antes de la segunda; fuera de sus tramos, el vecino no está en ninguna zona):
  - Tomás: casa de Tomás y Pablo de 06:00 a 09:00, plaza de 09:00 a 13:00, barrio de 13:00 a 19:00 y casa de 19:00 a 23:00.
  - Pablo: casa de 07:00 a 09:00, barrio de 09:00 a 12:00, lago de 12:00 a 17:00, barrio de 17:00 a 20:00 y casa de 20:00 a 22:00.
  - Bigotes: barrio de 06:00 a 20:00 y casa de Tomás y Pablo de 20:00 a 24:00.
  - Lucía: barrio de 07:00 a 12:00, granja de 12:00 a 15:00 y casa de Lucía de 15:00 a 22:00.
  - Rosa: lago de 06:00 a 12:00 y plaza de 12:00 a 19:00.
  - Fran: plaza de 10:00 a 14:00 y barrio de 16:00 a 21:00.
  - Elena: barrio de 10:00 a 14:00 y plaza de 16:00 a 21:00.
  - Bruno: bosque de 07:00 a 19:00.
  - Marta: plaza de 08:00 a 10:00, barrio de 10:00 a 12:00, granja de 12:00 a 14:00, lago de 14:00 a 16:00 y plaza de 16:00 a 18:00.
- El día 7 los seis vecinos de la feria siguen el horario de la feria (HU-58). Bruno sigue en el bosque, Bigotes en el barrio y Marta no reparte.
- Cada vecino tiene su propio saludo al hablar con él (HU-10). Bigotes solo dice “¡Miau!”.
- El día de la feria, los seis vecinos de la feria dicen lo mismo que en la feria (HU-58), aunque tengan misiones secundarias sin hacer o activas (HU-72): ese día no las ofrecen ni hablan de ellas, y no tienen indicador encima (HU-73).
Escenario 1: Vecino en su sitio

- Dado que es el día 2 a las 10:00
- Cuando el jugador entra en la plaza
- Entonces Tomás está en la plaza
Escenario 2: Vecino que cambia de zona

- Dado que es el día 2 a las 14:00
- Cuando el jugador entra en el barrio
- Entonces Tomás está en el barrio
- Y no está en la plaza
Escenario 3: Bruno en el bosque

- Dado que es el día 3 a las 10:00
- Cuando el jugador entra en el bosque
- Entonces Bruno está en el bosque
Escenario 4: La ronda de Marta

- Dado que es el día 2 a las 13:00
- Cuando el jugador entra en la granja
- Entonces Marta está en la granja
Escenario 5: Hablar con Bigotes

- Dado que el jugador está junto a Bigotes
- Cuando pulsa E
- Entonces aparece el diálogo “¡Miau!”
Escenario 6: Día de la feria

- Dado que es el día 7 a las 13:00
- Cuando el jugador entra en la plaza
- Entonces los seis vecinos de la feria están en la plaza
- Y Marta no está en ninguna zona
Escenario 7: Frase de la feria con misiones pendientes

- Dado que es el día 7 y el jugador no ha hecho la misión de Fran ni las de Elena
- Cuando habla con Fran
- Entonces Fran dice “He venido por el networking, pero bueno... el futuro es ansiedad.”
- Y no ofrece ninguna misión
