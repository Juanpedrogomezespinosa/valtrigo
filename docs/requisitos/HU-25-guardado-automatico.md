# HU-25. Guardado automático

# HU-25. Guardado automático

Como jugador, quiero que el juego guarde solo al dormir para tener un punto de control claro.

Criterios de aceptación:

- Al dormir voluntariamente en la cama, la partida se guarda automáticamente, sin preguntar.
- Al guardar automáticamente aparece brevemente el mensaje “Partida guardada”.
- Si el personaje se duerme automáticamente a medianoche, la partida no se guarda.
Escenario 1: Guardado al dormir

- Dado que hay una partida en curso
- Cuando el jugador duerme en la cama de su casa
- Entonces la partida se guarda automáticamente
- Y aparece el mensaje “Partida guardada”
Escenario 2: Sin guardado a medianoche

- Dado que son las 00:00 y el jugador no ha dormido desde la última partida guardada
- Cuando el personaje se duerme automáticamente
- Entonces la partida no se guarda
Escenario 3: Sobrescritura

- Dado que existe una partida guardada del día 2
- Cuando el jugador duerme en la cama en el día 4
- Entonces la partida guardada pasa a ser la del día 4

