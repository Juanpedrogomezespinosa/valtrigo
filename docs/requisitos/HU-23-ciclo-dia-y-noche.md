# HU-23. Ciclo día y noche

# HU-23. Ciclo día y noche

Como jugador, quiero que el juego tenga día y noche para sentir el paso del tiempo.

Criterios de aceptación:

- Entre las 20:00 y las 21:00 la pantalla se oscurece de forma gradual.
- A partir de las 06:00 la luz vuelve a la normalidad de forma gradual durante una hora.
- La oscuridad no impide leer la interfaz: día, hora, dinero y energía siguen visibles.
Escenario 1: Atardecer

- Dado que son las 20:00
- Cuando pasan 30 minutos de juego
- Entonces la pantalla está a mitad del oscurecimiento
Escenario 2: Antes del atardecer

- Dado que son las 19:59
- Cuando el jugador mira la pantalla
- Entonces la luz es normal
Escenario 3: Interfaz en la oscuridad

- Dado que la pantalla está completamente oscura
- Cuando el jugador mira la interfaz
- Entonces el día, la hora, el dinero y la energía siguen legibles
Escenario 4: Amanecer

- Dado que son las 06:00 y la pantalla está oscura
- Cuando pasa 1 hora de juego
- Entonces la luz es normal

