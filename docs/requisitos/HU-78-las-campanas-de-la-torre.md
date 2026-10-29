# HU-78. Las campanas de la torre

# HU-78. Las campanas de la torre

Como jugador, quiero tocar las campanas de la torre en el orden correcto para descubrir la melodía de la relojera.

Criterios de aceptación:

- En la torre hay tres campanas de distinto tamaño: grande, mediana y pequeña. Al pulsar E junto a una, suena (cada una con su nota: la grande es la más grave y la pequeña la más aguda).
- En la pared de la torre hay una partitura que se lee con E, como un cartel: “La melodía empieza grave, sube hasta lo más agudo y termina en el medio.” El orden correcto es grande, pequeña y mediana.
- Las campanas recuerdan las tres últimas que se han tocado. Si son grande, pequeña y mediana, en ese orden, aparece “Suena la melodía de la relojera” y el jugador recibe 80 monedas.
- Si se tocan tres campanas en otro orden, aparece “Las campanas desafinan” y se empieza de nuevo.
- La melodía solo da la recompensa una vez. Después, las campanas siguen sonando al tocarlas, pero no pasa nada más.
- Si el jugador sale de la torre a medias, se empieza de nuevo.
Escenario 1: Tocar una campana

- Dado que el jugador está junto a la campana grande
- Cuando pulsa E
- Entonces suena la nota de la campana grande
Escenario 2: Orden correcto

- Dado que el jugador tiene 100 monedas
- Cuando toca la campana grande, la pequeña y la mediana, en ese orden
- Entonces aparece “Suena la melodía de la relojera”
- Y el jugador tiene 180 monedas
Escenario 3: Orden incorrecto

- Dado que el jugador no ha tocado ninguna campana
- Cuando toca la mediana, la grande y la pequeña
- Entonces aparece “Las campanas desafinan”
- Y el dinero no cambia
Escenario 4: Una sola vez

- Dado que el jugador ya ha tocado la melodía
- Cuando la vuelve a tocar
- Entonces no aparece ningún mensaje y el dinero no cambia
