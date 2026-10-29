# HU-81. Correr

# HU-81. Correr

Como jugador, quiero correr para recorrer el pueblo más deprisa.

Criterios de aceptación:

- Al pulsar la tecla Mayús se activa correr y al volver a pulsarla se desactiva. No hace falta mantenerla pulsada.
- Con correr activado, el personaje se mueve a 1,5 veces la velocidad normal (6 casillas por segundo). Con correr desactivado, anda a la velocidad normal (HU-06).
- Pulsar Mayús no mueve al personaje.
- Correr sigue activado al cambiar de zona. Al empezar o cargar una partida, el personaje anda.
- Al correr, la animación y los pasos (HU-32) van 1,5 veces más rápido.
- Correr gasta energía y no se puede correr con 10 puntos o menos (HU-76). Andar no gasta energía.
- Al correr, las colisiones (HU-07), la ayuda en las esquinas y las puertas (HU-08) funcionan igual que al andar.
- La tabla de controles (HU-33) incluye “Correr: Mayús”.
Escenario 1: Activar correr

- Dado que el personaje está quieto en la plaza
- Cuando el jugador pulsa Mayús una vez y después mantiene la flecha derecha
- Entonces el personaje se mueve hacia la derecha a 1,5 veces la velocidad normal
Escenario 2: Desactivar correr

- Dado que el personaje está corriendo hacia la derecha
- Cuando el jugador vuelve a pulsar Mayús sin soltar la flecha
- Entonces el personaje sigue moviéndose hacia la derecha a la velocidad normal
Escenario 3: Mayús no mueve

- Dado que el personaje está quieto
- Cuando el jugador pulsa Mayús
- Entonces el personaje no se mueve
Escenario 4: Andar no gasta energía

- Dado que el jugador tiene 50 puntos de energía y correr está desactivado
- Cuando anda durante 2 segundos
- Entonces sigue teniendo 50 puntos de energía
Escenario 5: Al cambiar de zona

- Dado que correr está activado
- Cuando el jugador cruza una puerta
- Entonces en la nueva zona el personaje sigue corriendo
Escenario 6: Controles

- Dado que el jugador abre el menú de opciones
- Cuando consulta la tabla de controles
- Entonces aparece “Correr” con la tecla “Mayús”
