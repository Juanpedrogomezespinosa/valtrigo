# HU-56. Puzle del reloj

# HU-56. Puzle del reloj

Como jugador, quiero colocar yo mismo las piezas en el reloj para repararlo.

Criterios de aceptación:

- El encargo “Las piezas del reloj” ya no se completa entregando las piezas a la relojera, sino colocándolas en el mecanismo del reloj, en la torre.
- Al pulsar E junto al mecanismo, con el encargo activo y las tres piezas en el inventario, se elige qué pieza va en cada uno de sus tres huecos, de abajo arriba.
- El orden correcto es Engranaje de cobre, Muelle de plata y Péndulo de oro. La relojera da la pista en su diálogo de encargo en curso: “primero lo que gira, luego lo que empuja y arriba lo que marca el compás”.
- Con el orden correcto, las piezas salen del inventario, aparece el mensaje “Encargo completado” y se cobra la recompensa.
- Con un orden incorrecto, aparece “El reloj no arranca” y las piezas siguen en el inventario. Se puede volver a intentar.
- Sin el encargo activo o sin las tres piezas, el mecanismo muestra “Faltan piezas”.
Escenario 1: Orden correcto

- Dado que el encargo “Las piezas del reloj” está activo y el jugador tiene las tres piezas
- Cuando coloca el Engranaje de cobre, el Muelle de plata y el Péndulo de oro, en ese orden
- Entonces aparece el mensaje “Encargo completado”
- Y el jugador recibe 100 monedas y 2 Manzanas
- Y las tres piezas desaparecen del inventario
Escenario 2: Orden incorrecto

- Dado que el encargo “Las piezas del reloj” está activo y el jugador tiene las tres piezas
- Cuando coloca el Péndulo de oro en el primer hueco
- Entonces aparece el mensaje “El reloj no arranca”
- Y las tres piezas siguen en el inventario
Escenario 3: Faltan piezas

- Dado que el jugador solo tiene dos piezas
- Cuando pulsa E junto al mecanismo
- Entonces aparece el mensaje “Faltan piezas”
