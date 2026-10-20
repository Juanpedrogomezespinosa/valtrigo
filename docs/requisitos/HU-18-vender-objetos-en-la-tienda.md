# HU-18. Vender objetos en la tienda

# HU-18. Vender objetos en la tienda

Como jugador, quiero vender objetos para conseguir dinero.

Criterios de aceptación:

- Al vender, el jugador recibe el 50 % del precio de compra del objeto. Los objetos que no se compran en la tienda (cosechas, peces, lo recogido en el bosque y la Manzana) se venden a su precio de venta.
- Al vender, la cantidad del objeto en el inventario se reduce en las unidades vendidas.
- Los objetos de encargo no se pueden vender.
Escenario 1: Venta de un objeto

- Dado que el jugador tiene 100 monedas, una Pala en el inventario y la tienda está abierta
- Cuando vende una Pala, cuyo precio de compra es 30 monedas
- Entonces el jugador tiene 115 monedas
- Y la Pala desaparece del inventario
Escenario 2: Venta de varias unidades

- Dado que el jugador tiene 5 Semillas y la tienda está abierta
- Cuando vende 3 Semillas, cuyo precio de venta es 5 monedas cada una
- Entonces el jugador recibe 15 monedas
- Y le quedan 2 Semillas en el inventario
Escenario 3: Objeto de encargo

- Dado que el jugador tiene una Carta del alcalde, que es un objeto de encargo
- Cuando intenta venderla
- Entonces aparece el mensaje “Este objeto no se puede vender”
- Y la Carta del alcalde sigue en el inventario
Escenario 4: Tienda cerrada

- Dado que son las 19:30 y la tienda ya está cerrada
- Cuando el jugador intenta vender un objeto
- Entonces aparece el mensaje “La tienda está cerrada”
- Y no se realiza ninguna venta

