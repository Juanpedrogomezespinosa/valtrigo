# HU-57. Torre cerrada hasta el día 5

# HU-57. Torre cerrada hasta el día 5

Como jugador, quiero que la torre se abra a mitad de semana para que la historia se descubra poco a poco.

Criterios de aceptación:

- Antes del día 5, al caminar hacia la puerta de la torre aparece un cuadro de diálogo con el texto “La torre está cerrada” y no se cambia de zona. El cuadro se cierra con E.
- Desde el día 5, la puerta funciona como las demás (HU-08), a cualquier hora.
Escenario 1: Antes del día 5

- Dado que es el día 4
- Cuando el jugador camina hacia la puerta de la torre
- Entonces aparece el cuadro de diálogo “La torre está cerrada”
- Y el jugador sigue en la plaza
Escenario 2: Cerrar el aviso

- Dado que el cuadro de diálogo “La torre está cerrada” está visible
- Cuando el jugador pulsa E
- Entonces el cuadro se cierra y el jugador puede moverse
Escenario 3: Desde el día 5

- Dado que es el día 5
- Cuando el jugador camina hacia la puerta de la torre
- Entonces entra en la torre
