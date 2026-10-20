# HU-03. Continuar una partida guardada

# HU-03. Continuar una partida guardada

Como jugador, quiero continuar mi última partida para no perder mi progreso.

Criterios de aceptación:

- “Continuar” carga la partida guardada directamente, sin mostrar selector.
- Se restauran zona, posición, día, hora, dinero, energía, inventario, encargos activos y cofres abiertos.
Escenario 1: Continuar una partida guardada

- Dado que existe una partida guardada en la casa del jugador, en el día 3 a las 14:00, con 250 monedas
- Cuando el jugador pulsa “Continuar”
- Entonces se carga la casa del jugador en la posición guardada
- Y el reloj marca día 3 a las 14:00 y el dinero es 250 monedas
Escenario 2: Los cofres abiertos se mantienen

- Dado que el jugador abrió el cofre 1 antes de guardar
- Cuando el jugador pulsa “Continuar”
- Entonces el cofre 1 aparece vacío
- Y no se puede volver a abrir
Escenario 3: Sin partida guardada

- Dado que no existe ninguna partida guardada
- Cuando el jugador abre el menú principal
- Entonces “Continuar” aparece desactivada

