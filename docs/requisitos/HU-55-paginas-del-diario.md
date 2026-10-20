# HU-55. Páginas del diario

# HU-55. Páginas del diario

Como jugador, quiero encontrar páginas del diario de la relojera para descubrir por qué se paró el reloj.

Criterios de aceptación:

- Hay 5 páginas del diario escondidas: en la torre, en el bosque, en el lago, en la granja y en la plaza.
- Al pulsar E junto a una página, se recoge, desaparece del mapa y aparece el mensaje “Has encontrado una página del diario”. Las páginas no ocupan sitio en el inventario.
- La lista de objetivos (O) tiene dos apartados, “Encargos” y “Notas”, que se cambian con ← →. “Notas” muestra las páginas en orden, con su texto. Las que faltan aparecen como “Página sin encontrar”.
Escenario 1: Encontrar una página

- Dado que el jugador está junto a la página del lago
- Cuando pulsa E
- Entonces aparece el mensaje “Has encontrado una página del diario”
- Y la página desaparece del mapa
Escenario 2: Leer las notas

- Dado que el jugador ha encontrado la página 3
- Cuando abre la lista de objetivos y pasa a “Notas”
- Entonces aparece el texto de la página 3
- Y las páginas 1, 2, 4 y 5 aparecen como “Página sin encontrar”
