# HU-34. Guardar las opciones

# HU-34. Guardar las opciones

Como jugador, quiero que mis ajustes de volumen se mantengan al volver a jugar para no tener que volver a ajustarlos cada vez que abro el juego.

Criterios de aceptación:

- Los ajustes de música, efectos y silencio se guardan en el navegador del jugador.
- Al abrir el juego, se cargan los últimos ajustes guardados.
Escenario 1: Ajustes que se mantienen

- Dado que el volumen de música está en 4 barras y el de efectos en 8 barras
- Cuando el jugador cierra el juego y lo vuelve a abrir
- Entonces el volumen de música es 4 barras y el de efectos es 8 barras
Escenario 2: Silencio que se mantiene

- Dado que el sonido está silenciado
- Cuando el jugador vuelve a abrir el juego
- Entonces el sonido sigue silenciado
Escenario 3: Navegador sin almacenamiento

- Dado que el navegador no permite guardar datos
- Cuando el jugador cambia el volumen
- Entonces el juego funciona con normalidad
- Y los ajustes no se conservan al volver a abrir el juego

