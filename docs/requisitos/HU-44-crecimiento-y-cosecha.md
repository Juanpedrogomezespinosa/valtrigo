# HU-44. Crecimiento y cosecha

# HU-44. Crecimiento y cosecha

Como jugador, quiero ver crecer mis cultivos y cosecharlos para venderlos o comerlos.

Criterios de aceptación:

- Al empezar cada día, un cultivo que se regó el día anterior crece un día. Si no se regó, no crece, pero tampoco se pierde.
- Un cultivo está listo cuando ha crecido todos los días que necesita (Nabo 2, Zanahoria 3, Calabaza 4). Cada cultivo se ve distinto cuando está listo.
- Al pulsar E junto a un cultivo listo, se recoge 1 unidad, se gasta 1 de energía y la parcela queda cavada y vacía.
- Si la cosecha no cabe en el inventario, aparece “Inventario lleno” y el cultivo sigue en la parcela.
- Las cosechas se pueden comer: Nabo da 10 de energía, Zanahoria 15 y Calabaza 30.
- Precios de venta: Nabo 15 monedas, Zanahoria 35 y Calabaza 80.
Escenario 1: Crece con riego

- Dado que el día 2 el jugador siembra un Nabo y lo riega
- Y el día 3 lo vuelve a regar
- Cuando empieza el día 4
- Entonces el Nabo está listo
Escenario 2: No crece sin riego

- Dado que el día 2 el jugador siembra un Nabo y no lo riega
- Cuando empieza el día 3
- Entonces el Nabo no ha crecido
Escenario 3: Cosechar

- Dado que hay un Nabo listo
- Cuando el jugador pulsa E junto a él
- Entonces aparece 1 Nabo en el inventario
- Y la parcela queda cavada y vacía
Escenario 4: Inventario lleno

- Dado que hay un Nabo listo y el inventario está completo
- Cuando el jugador pulsa E junto a él
- Entonces aparece el mensaje “Inventario lleno”
- Y el Nabo sigue en la parcela
