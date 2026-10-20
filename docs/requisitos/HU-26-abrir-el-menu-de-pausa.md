# HU-26. Abrir el menú de pausa

# HU-26. Abrir el menú de pausa

Como jugador, quiero pausar el juego para descansar o cambiar ajustes sin perder el progreso.

Criterios de aceptación:

- Al pulsar Escape durante la partida se abre el menú de pausa y el juego se detiene.
- El menú de pausa muestra las opciones “Continuar”, “Opciones”, “Guardar partida” y “Salir al menú principal”.
- Con el menú de pausa abierto, el personaje no se mueve y no se abren diálogos.
Escenario 1: Abrir la pausa

- Dado que hay una partida en curso
- Cuando el jugador pulsa Escape
- Entonces se abre el menú de pausa con sus cuatro opciones
- Y el juego se detiene
Escenario 2: Guardar desde la pausa

- Dado que el menú de pausa está abierto
- Cuando el jugador pulsa “Guardar partida”
- Entonces aparece el mensaje “Partida guardada” durante 2 segundos
Escenario 3: Salir al menú principal sin guardar

- Dado que el menú de pausa está abierto y la partida tiene cambios sin guardar
- Cuando el jugador pulsa “Salir al menú principal”
- Entonces aparece el mensaje “¿Salir sin guardar? Se perderá el progreso no guardado” con “Sí” y “No”
- Y si pulsa “Sí”, vuelve al menú principal

