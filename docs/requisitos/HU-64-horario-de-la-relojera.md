# HU-64. Horario de la relojera

# HU-64. Horario de la relojera

Como jugador, quiero saber cuándo está la relojera en la torre para no ir a buscarla a una hora en la que no está.

Criterios de aceptación:

- La primera vez que el jugador entra en la torre del reloj, aparece un cuadro de diálogo con el texto “La relojera viene a la torre de 9:00 a 22:00”, con las horas de su horario (HU-40).
- El cuadro se cierra con E y entonces el jugador puede moverse.
- Las siguientes veces que entra en la torre no aparece, tampoco después de guardar y continuar la partida.
Escenario 1: Primera visita

- Dado que es el día 5 y el jugador no ha entrado nunca en la torre
- Cuando entra en la torre
- Entonces aparece el cuadro de diálogo “La relojera viene a la torre de 9:00 a 22:00”
Escenario 2: Cerrar el aviso

- Dado que el aviso del horario de la relojera está visible
- Cuando el jugador pulsa E
- Entonces el cuadro se cierra y el jugador puede moverse
Escenario 3: Visitas siguientes

- Dado que el jugador ya ha entrado antes en la torre
- Cuando vuelve a entrar
- Entonces no aparece el aviso
