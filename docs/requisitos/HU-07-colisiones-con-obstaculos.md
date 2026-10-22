# HU-07. Colisiones con obstáculos

# HU-07. Colisiones con obstáculos

Como jugador, quiero que el personaje no atraviese árboles, casas, agua ni NPC para que el mundo se sienta sólido.

Criterios de aceptación:

- Árboles, casas, muros, mobiliario, agua y NPC son obstáculos.
- El personaje se detiene junto al obstáculo y nunca se superpone con él.
- Si una dirección está bloqueada y otra libre, el personaje se mueve en la libre.
- Si el personaje choca por muy poco (6 píxeles o menos) con la esquina de un hueco, se desliza de lado hasta quedar alineado con él y pasa. Así se entra por huecos de una casilla sin tener que llegar perfectamente alineado.
Escenario 1: Árbol

- Dado que hay un árbol a la derecha del personaje
- Cuando el jugador camina hacia la derecha
- Entonces el personaje se detiene junto al árbol
Escenario 2: Agua

- Dado que hay un lago frente al personaje
- Cuando el jugador camina hacia el agua
- Entonces el personaje se detiene en la orilla
Escenario 3: Dirección libre con otra bloqueada

- Dado que hay un muro encima del personaje y espacio libre a su derecha
- Cuando el jugador pulsa arriba y derecha a la vez
- Entonces el personaje se mueve a la derecha
Escenario 4: NPC en el camino

- Dado que un NPC está en el camino del personaje
- Cuando el jugador camina hacia el NPC
- Entonces el personaje se detiene junto al NPC
Escenario 5: Hueco estrecho

- Dado que el personaje está delante de la entrada del cercado del granero, que mide una casilla, desviado 5 píxeles hacia un lado
- Cuando el jugador camina hacia la entrada
- Entonces el personaje se desliza hasta alinearse con la entrada
- Y entra en el cercado
