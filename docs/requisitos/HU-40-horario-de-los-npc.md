# HU-40. Horario de los NPC

# HU-40. Horario de los NPC

Como jugador, quiero que los NPC sigan un horario para que el pueblo parezca vivo.

Criterios de aceptación:

- Horarios: el alcalde está en la plaza de 08:00 a 20:00. El granjero está en la granja de 06:00 a 17:00 y en el lago de 17:00 a 21:00. La relojera está en la torre de 09:00 a 22:00. La vendedora está en la tienda, que solo se puede visitar en su horario (HU-17).
- Fuera de su horario, el NPC no está en ninguna zona.
- El NPC aparece o desaparece al llegar la hora, aunque el jugador esté en la zona. Si el jugador está hablando con él, se queda hasta que se cierra el diálogo.
- Un NPC que no está no bloquea el paso. Si al llegar su hora el jugador está en su sitio, el NPC aparece cuando el jugador se aparta, y el jugador puede moverse en todo momento.
Escenario 1: Dentro del horario

- Dado que son las 10:00
- Cuando el jugador entra en la plaza
- Entonces el alcalde está en la plaza
Escenario 2: Fuera del horario

- Dado que son las 21:00
- Cuando el jugador entra en la plaza
- Entonces el alcalde no está en la plaza
Escenario 3: Cambio de zona del granjero

- Dado que son las 17:30
- Cuando el jugador entra en el lago
- Entonces el granjero está en el lago
- Y no está en la granja
Escenario 4: Llega la hora con el jugador en la zona

- Dado que son las 19:59 y el jugador está en la plaza sin hablar con el alcalde
- Cuando el reloj llega a las 20:00
- Entonces el alcalde desaparece de la plaza
Escenario 5: Llega la hora durante un diálogo

- Dado que son las 19:59 y el jugador está hablando con el alcalde
- Cuando el reloj llega a las 20:00
- Entonces el diálogo continúa
- Y el alcalde desaparece al cerrarse el diálogo
Escenario 6: Un NPC ausente no bloquea el paso

- Dado que son las 21:00 y el alcalde no está en la plaza
- Cuando el jugador camina por el sitio del alcalde
- Entonces lo atraviesa sin quedarse bloqueado
Escenario 7: Llega la hora con el jugador en el sitio del NPC

- Dado que son las 07:59 y el jugador está en el sitio del alcalde
- Cuando el reloj llega a las 08:00
- Entonces el alcalde no aparece hasta que el jugador se aparta
- Y el jugador puede moverse y, después de hablar con el alcalde, sigue pudiendo moverse
