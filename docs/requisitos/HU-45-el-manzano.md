# HU-45. El manzano

# HU-45. El manzano

Como jugador, quiero recoger manzanas del manzano de la granja para conseguir comida y cumplir encargos.

Criterios de aceptación:

- En la granja hay un manzano. Tiene 1 Manzana al empezar la partida y, después, una nueva cada 2 días si no se ha recogido la anterior.
- Al pulsar E junto al manzano con una Manzana, se recoge y el manzano se queda sin fruta.
- El manzano no necesita riego ni gasta energía.
- Sin fruta, al pulsar E no ocurre nada y no aparece el indicador “E”.
- La Manzana se obtiene del manzano (y de las recompensas de algunos encargos). No se compra en la tienda, pero se puede vender en ella por 10 monedas.
Escenario 1: Recoger una Manzana

- Dado que el manzano tiene una Manzana
- Cuando el jugador pulsa E junto a él
- Entonces aparece 1 Manzana en el inventario
- Y el manzano se queda sin fruta
Escenario 2: Vuelve a dar fruta

- Dado que el jugador recogió la Manzana el día 2
- Cuando empieza el día 4
- Entonces el manzano tiene una Manzana
Escenario 3: Todavía sin fruta

- Dado que el jugador recogió la Manzana el día 2
- Cuando empieza el día 3
- Entonces el manzano no tiene fruta
