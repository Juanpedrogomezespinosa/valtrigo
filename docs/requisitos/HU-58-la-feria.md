# HU-58. La feria

# HU-58. La feria

Como jugador, quiero que el pueblo celebre la feria para sentir que mi trabajo ha servido.

Criterios de aceptación:

- La feria se celebra en la plaza el día 7. Es festivo: ese día el jugador se despierta a las 12:00 y la feria ya está montada.
- Durante la feria, la plaza tiene guirnaldas, dos puestos (el de la cosecha, HU-59, y el de pesca, HU-60), un escenario y un podio para la ceremonia (HU-66).
- El día 7, a partir de las 12:00, hay seis visitantes en la plaza: Rosa, Lucía, Tomás, Pablo, Fran y Elena. Cada uno tiene un diálogo sencillo al pulsar E junto a él. Fran dice “He venido por el networking, pero bueno... el futuro es ansiedad.” y Elena “He venido porque me han prometido que después pondrán margarita frozen.”.
- Los concursos admiten participantes de 12:00 a 17:00. A las 17:00 aparece el mensaje “Los concursos han terminado. Ceremonia a las 18:00 en la plaza”.
- Antes y después del día 7, la plaza tiene su aspecto normal: no hay guirnaldas, puestos, escenario, podio ni visitantes.
- Pasado el día 7, el encargo “La feria de Valtrigo” se puede seguir completando al hablar con el alcalde, aunque ya no haya feria.
Escenario 1: Día de feria

- Dado que es el día 7
- Cuando el jugador entra en la plaza
- Entonces la plaza tiene guirnaldas, los puestos de la cosecha y de pesca, el escenario y el podio
- Y están los seis visitantes
Escenario 2: Antes de la feria

- Dado que es el día 6
- Cuando el jugador entra en la plaza
- Entonces no hay guirnaldas, puestos, escenario, podio ni visitantes
Escenario 3: Después de la feria

- Dado que es el día 8
- Cuando el jugador entra en la plaza
- Entonces no hay guirnaldas, puestos, escenario, podio ni visitantes
Escenario 4: Encargo final después de la feria

- Dado que es el día 8 y el encargo “La feria de Valtrigo” está activo
- Cuando el jugador habla con el alcalde
- Entonces aparece el mensaje “Encargo completado”
Escenario 5: Despertar el día de la feria

- Dado que es el día 6 y el jugador está junto a la cama
- Cuando duerme y cierra el resumen del día
- Entonces el reloj marca el día 7 a las 12:00
Escenario 6: Hablar con un visitante

- Dado que es el día 7 y el jugador está junto a Rosa
- Cuando pulsa E
- Entonces Rosa dice su diálogo
Escenario 7: Fin de los concursos

- Dado que es el día 7 a las 16:59
- Cuando el reloj llega a las 17:00
- Entonces aparece el mensaje “Los concursos han terminado. Ceremonia a las 18:00 en la plaza”
