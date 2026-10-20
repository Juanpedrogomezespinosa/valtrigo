# HU-10. Interactuar con personajes (NPC)

# HU-10. Interactuar con personajes (NPC)

Como jugador, quiero hablar con los habitantes del pueblo para conocer la historia y recibir encargos.

Criterios de aceptación:

- Hay 4 NPC en el pueblo. Al estar a menos de una casilla de un NPC aparece el indicador “E”.
- Al pulsar E, el NPC muestra su diálogo con su retrato y el texto aparece letra a letra.
- Pulsar E durante la escritura muestra el texto completo; pulsar E de nuevo avanza a la siguiente línea.
- El diálogo se cierra al terminar la última línea y el jugador puede moverse de nuevo.
Escenario 1: Iniciar un diálogo

- Dado que el jugador está junto a un NPC
- Cuando pulsa E
- Entonces aparece el retrato del NPC y su diálogo
- Y el texto se escribe letra a letra
Escenario 2: Mostrar el texto completo

- Dado que un diálogo se está escribiendo
- Cuando el jugador pulsa E
- Entonces se muestra el texto completo de la línea
- Y al pulsar E de nuevo, aparece la siguiente línea
Escenario 3: Cerrar el diálogo

- Dado que el jugador está en la última línea del diálogo
- Cuando pulsa E
- Entonces el diálogo se cierra
- Y el personaje puede moverse de nuevo
Escenario 4: Fuera de alcance

- Dado que el jugador está a tres casillas de un NPC
- Cuando pulsa E
- Entonces no aparece ningún diálogo

