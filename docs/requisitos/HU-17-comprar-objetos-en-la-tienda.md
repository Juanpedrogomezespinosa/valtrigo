# HU-17. Comprar objetos en la tienda

# HU-17. Comprar objetos en la tienda

Como jugador, quiero comprar objetos en la tienda del pueblo para mejorar mi equipo o mis suministros.

Criterios de aceptación:

- La tienda del pueblo abre de 07:00 a 19:00 y la atiende un único vendedor.
- Fuera de ese horario, al caminar hacia la puerta de la tienda aparece un cuadro de diálogo con el texto “La tienda está cerrada” y no se entra. El cuadro se cierra con E.
- Si el jugador sigue dentro cuando la tienda cierra, al hablar con el vendedor aparece “La tienda está cerrada” y no se abre el menú de compra.
- La tienda vende Semilla (10 monedas), Semilla de zanahoria (20), Semilla de calabaza (40), Pala (30), Hacha (40), Regadera (40) y Caña de pescar (50).
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
- Cuando el jugador camina hacia la puerta de la tienda
- Entonces aparece el cuadro de diálogo “La tienda está cerrada”
- Y el jugador sigue en la plaza
Escenario 5: La tienda cierra con el jugador dentro

- Dado que el jugador está dentro de la tienda y son las 19:00
- Cuando habla con el vendedor
- Entonces aparece el mensaje “La tienda está cerrada”
- Y no se abre el menú de compra

