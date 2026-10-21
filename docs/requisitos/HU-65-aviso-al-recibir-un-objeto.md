# HU-65. Aviso al recibir un objeto

# HU-65. Aviso al recibir un objeto

Como jugador, quiero un aviso cuando alguien me da un objeto para saber qué he recibido y de quién.

Criterios de aceptación:

- Cuando un NPC da un objeto al jugador (la Carta del alcalde o la recompensa de un encargo), aparece durante 2 segundos el mensaje “Recibiste [objeto] de parte de [NPC]”, por ejemplo “Recibiste Manzana de parte del alcalde”.
- Si son varias unidades, el mensaje dice cuántas: “Recibiste 2 Manzanas de parte de la relojera”.
- Los objetos de cofres, los del suelo y los comprados no muestran este mensaje.
- Si a la vez aparece otro mensaje, como “Encargo completado”, se ven los dos, uno debajo del otro.
Escenario 1: La carta

- Dado que el jugador tiene activo el encargo “Entregar la Carta del alcalde”
- Cuando habla con la vendedora y ella le da la carta
- Entonces aparece el mensaje “Recibiste Carta del alcalde de parte de la vendedora”
Escenario 2: Recompensa de un encargo

- Dado que el jugador tiene la Carta del alcalde y el encargo “Entregar la Carta del alcalde” activo
- Cuando habla con el alcalde y completa el encargo
- Entonces aparecen los mensajes “Encargo completado” y “Recibiste Manzana de parte del alcalde”
Escenario 3: Varias unidades

- Dado que el jugador completa el encargo “Las piezas del reloj”
- Cuando la relojera le da la recompensa
- Entonces aparece el mensaje “Recibiste 2 Manzanas de parte de la relojera”
Escenario 4: Objetos comprados

- Dado que el jugador está en la tienda
- Cuando compra una Pala
- Entonces no aparece ningún mensaje “Recibiste”
