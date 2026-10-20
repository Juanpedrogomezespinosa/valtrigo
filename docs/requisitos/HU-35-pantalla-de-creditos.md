# HU-35. Pantalla de créditos

# HU-35. Pantalla de créditos

Como jugador, quiero ver los créditos del juego para conocer a quienes lo hicieron y los recursos usados.

Criterios de aceptación:

- La opción “Créditos” aparece en el menú principal.
- Los créditos muestran el autor, Phaser y los recursos externos con su licencia.
- Desde los créditos se vuelve al menú principal con “Volver” o con Escape.
Escenario 1: Abrir los créditos

- Dado que el jugador está en el menú principal
- Cuando pulsa “Créditos”
- Entonces aparece la pantalla de créditos
Escenario 2: Contenido de los créditos

- Dado que la pantalla de créditos está abierta
- Cuando el jugador la lee
- Entonces aparecen el autor, Phaser y la licencia de cada recurso externo
Escenario 3: Volver al menú

- Dado que la pantalla de créditos está abierta
- Cuando el jugador pulsa Escape
- Entonces vuelve al menú principal con “Créditos” seleccionada

