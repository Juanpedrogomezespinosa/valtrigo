# HU-12. Interactuar con objetos del mundo

# HU-12. Interactuar con objetos del mundo

Como jugador, quiero examinar carteles y cofres para descubrir pistas o recoger recursos.

Criterios de aceptación:

- Hay 3 cofres en el pueblo. Al abrir un cofre, su objeto se añade al inventario y el cofre no puede volver a abrirse.
- Si el inventario está lleno, el cofre no se abre.
- Los carteles muestran su texto al interactuar con ellos con la tecla E.
Escenario 1: Abrir un cofre

- Dado que el jugador está junto al cofre 1 y tiene espacio en el inventario
- Cuando pulsa E
- Entonces el objeto del cofre se añade al inventario
- Y el cofre se muestra como abierto
Escenario 2: Cofre ya abierto

- Dado que el cofre 1 ya está abierto
- Cuando el jugador pulsa E junto al cofre 1
- Entonces no ocurre nada
Escenario 3: Inventario lleno

- Dado que el inventario está completo
- Cuando el jugador pulsa E junto al cofre 2
- Entonces aparece el mensaje “Inventario lleno”
- Y el cofre 2 sigue cerrado
Escenario 4: Leer un cartel

- Dado que el jugador está junto a un cartel
- Cuando pulsa E
- Entonces aparece el texto del cartel
- Y se cierra al pulsar E de nuevo

