# HU-05. Salir del juego

# HU-05. Salir del juego

Como jugador, quiero salir del juego desde el menú principal para cerrar la partida cuando termine.

Criterios de aceptación:

- Al pulsar “Salir” aparece el mensaje “¿Salir del juego?” con los botones “Sí” y “No”.
- “Sí” cierra el juego y “No” vuelve al menú principal con “Salir” seleccionada.
- Salir no borra la partida guardada.
Escenario 1: Confirmar la salida

- Dado que el jugador está en el menú principal
- Cuando pulsa “Salir” y después “Sí”
- Entonces el juego se cierra
Escenario 2: Cancelar la salida

- Dado que el jugador está en el menú principal
- Cuando pulsa “Salir” y después “No”
- Entonces vuelve al menú principal
- Y “Salir” queda seleccionada
Escenario 3: La partida guardada se mantiene

- Dado que existe una partida guardada
- Cuando el jugador sale del juego desde el menú principal
- Entonces al volver a abrir el juego “Continuar” sigue activa

