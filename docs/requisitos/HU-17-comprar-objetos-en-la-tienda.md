# HU-17. Comprar objetos en la tienda

# HU-17. Comprar objetos en la tienda

Como jugador, quiero comprar objetos en la tienda del pueblo para mejorar mi equipo o mis suministros.

Criterios de aceptación:

- La tienda del pueblo abre de 07:00 a 19:00 y la atiende un único vendedor.
- Cada objeto de la tienda muestra su icono, su nombre y su precio en monedas.
- Al comprar, se descuenta el precio del dinero y el objeto se añade al inventario.
- Si el dinero no alcanza, aparece el mensaje “Dinero insuficiente” y no se realiza la compra.
- Si el inventario está lleno, aparece el mensaje “Inventario lleno” y no se realiza la compra.
Escenario 1: Compra correcta

- Dado que el jugador tiene 100 monedas y la tienda está abierta
- Cuando compra una Pala, que cuesta 30 monedas
- Entonces el jugador tiene 70 monedas
- Y la Pala aparece en el inventario con cantidad 1
Escenario 2: Dinero insuficiente

- Dado que el jugador tiene 20 monedas y la tienda está abierta
- Cuando intenta comprar una Pala, que cuesta 30 monedas
- Entonces aparece el mensaje “Dinero insuficiente”
- Y el dinero y el inventario no cambian
Escenario 3: Inventario lleno

- Dado que el jugador tiene 100 monedas y el inventario está completo
- Cuando intenta comprar una Pala
- Entonces aparece el mensaje “Inventario lleno”
- Y el dinero no cambia
Escenario 4: Tienda cerrada

- Dado que son las 20:00
- Cuando el jugador intenta hablar con el vendedor
- Entonces aparece el mensaje “La tienda está cerrada”
- Y no se abre el menú de compra

