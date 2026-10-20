# HU-22. Ver el día y la hora

# HU-22. Ver el día y la hora

Como jugador, quiero ver el día y la hora actual para planificar mis actividades.

Criterios de aceptación:

- La interfaz muestra “Día N” y la hora en formato HH:MM en la esquina superior izquierda.
- La hora avanza 1 minuto de juego por cada segundo real.
- Con el menú de pausa abierto, la hora no avanza.
Escenario 1: Hora inicial

- Dado que el jugador empieza una partida nueva
- Cuando mira la interfaz
- Entonces aparece “Día 1” y “06:00”
Escenario 2: Avance del tiempo

- Dado que son las 06:00
- Cuando pasan 60 segundos reales
- Entonces la hora es 07:00
Escenario 3: Pausa

- Dado que el menú de pausa está abierto a las 10:00
- Cuando pasan 30 segundos reales
- Entonces la hora sigue siendo 10:00
Escenario 4: Medianoche

- Dado que son las 23:59 y el jugador no ha dormido
- Cuando pasa 1 segundo real
- Entonces el personaje se duerme automáticamente
- Y se inicia el día siguiente a las 06:00

