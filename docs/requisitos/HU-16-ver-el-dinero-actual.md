# HU-16. Ver el dinero actual

# HU-16. Ver el dinero actual

Como jugador, quiero ver mi dinero en pantalla para saber si puedo comprar algo.

Criterios de aceptación:

- El dinero aparece en la esquina superior derecha de la pantalla durante la partida, con el icono de una moneda seguido de la cantidad (HU-80).
- El dinero se actualiza al instante al comprar, vender, completar encargos o recibir recompensas.
- El dinero sigue visible con el menú de pausa abierto.
Escenario 1: Dinero inicial

- Dado que el jugador empieza una partida nueva
- Cuando mira la interfaz
- Entonces aparece “100” junto al icono de la moneda
Escenario 2: Actualización al comprar

- Dado que el jugador tiene 100 monedas
- Cuando compra un objeto que cuesta 30 monedas
- Entonces aparece “70” en la interfaz
Escenario 3: Actualización al completar un encargo

- Dado que el jugador tiene 70 monedas
- Cuando completa un encargo que paga 50 monedas
- Entonces aparece “120” en la interfaz
Escenario 4: Dinero visible en pausa

- Dado que el jugador abre el menú de pausa
- Cuando el menú se muestra
- Entonces el dinero sigue visible en la esquina superior derecha

