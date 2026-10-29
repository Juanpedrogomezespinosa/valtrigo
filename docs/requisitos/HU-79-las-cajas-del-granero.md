# HU-79. Las cajas del granero

# HU-79. Las cajas del granero

Como jugador, quiero ordenar las cajas del corral del granero para ayudar al granjero.

Criterios de aceptación:

- En la granja, junto al granero, hay un corral vallado con dos cajas y dos marcas en el suelo.
- Al caminar contra una caja, el personaje la empuja una casilla en esa dirección, si la casilla de detrás está libre (sin obstáculos, sin otra caja y dentro del corral). Si no, la caja no se mueve.
- Las cajas no se pueden arrastrar: solo empujar.
- Cuando las dos cajas están sobre las dos marcas, aparece “Las cajas están en su sitio” y el jugador recibe 50 monedas y 3 Semillas de zanahoria. Si las Semillas no caben en el inventario, aparece “Inventario lleno” y la última caja no se mueve.
- Junto al corral hay un cartel: “Pon cada caja sobre una marca. Si te atascas, sal de la granja y vuelve: las cajas volverán a su sitio.”
- Si el jugador sale de la granja sin resolverlo, las cajas vuelven a su posición inicial.
- Una vez resuelto, las cajas se quedan sobre las marcas y no se pueden mover. Solo se resuelve una vez.
Escenario 1: Empujar una caja

- Dado que el jugador está junto a una caja y la casilla de detrás está libre
- Cuando camina contra la caja
- Entonces la caja avanza una casilla en esa dirección
Escenario 2: Caja bloqueada

- Dado que detrás de la caja hay una valla
- Cuando el jugador camina contra la caja
- Entonces la caja no se mueve
Escenario 3: Resolver el acertijo

- Dado que una caja ya está sobre su marca y el jugador tiene 100 monedas
- Cuando empuja la otra caja sobre la marca libre
- Entonces aparece “Las cajas están en su sitio”
- Y el jugador tiene 150 monedas y 3 Semillas de zanahoria
Escenario 4: Volver a empezar

- Dado que el jugador ha movido una caja sin resolver el acertijo
- Cuando sale de la granja y vuelve
- Entonces las cajas están en su posición inicial
