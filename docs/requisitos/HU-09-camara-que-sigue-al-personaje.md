# HU-09. Cámara que sigue al personaje

# HU-09. Cámara que sigue al personaje

Como jugador, quiero que la cámara siga al personaje para ver siempre su entorno.

Criterios de aceptación:

- La cámara mantiene al personaje centrado en la pantalla mientras se mueve.
- La cámara no muestra espacios fuera del mapa: se detiene en los bordes.
- Si la zona es más pequeña que la pantalla, la cámara no se mueve y muestra la zona completa, centrada.
Escenario 1: Seguimiento en una zona grande

- Dado que el personaje está en el centro de una zona más grande que la pantalla
- Cuando camina hacia la derecha
- Entonces la cámara se desplaza con el personaje y lo mantiene centrado
Escenario 2: Borde del mapa

- Dado que el personaje está a dos casillas del borde izquierdo de la zona
- Cuando camina hacia el borde
- Entonces la cámara se detiene en el borde
- Y no se muestra ningún espacio vacío fuera del mapa
Escenario 3: Zona más pequeña que la pantalla

- Dado que el jugador está dentro de la casa del jugador
- Cuando el personaje se mueve por la casa
- Entonces la cámara no se mueve
- Y la casa se muestra completa y centrada
Escenario 4: Cambio de zona

- Dado que el personaje cruza una puerta
- Cuando termina el fundido a negro
- Entonces la cámara ya está centrada en la nueva zona

