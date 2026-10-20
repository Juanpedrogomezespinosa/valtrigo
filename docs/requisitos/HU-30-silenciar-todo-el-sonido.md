# HU-30. Silenciar todo el sonido

# HU-30. Silenciar todo el sonido

Como jugador, quiero silenciar todo el audio con un botón para jugar sin sonido.

Criterios de aceptación:

- El botón “Silenciar” está separado de los controles de volumen.
- Con “Silenciar” activo no se escucha ni música ni efectos.
- Los controles de volumen conservan sus valores mientras el sonido está silenciado.
Escenario 1: Silenciar

- Dado que el volumen de música está en 7 barras y el de efectos en 6 barras
- Cuando el jugador activa “Silenciar”
- Entonces no se escucha música ni efectos
- Y los controles siguen marcando 7 y 6 barras
Escenario 2: Silencio al reanudar

- Dado que el sonido está silenciado
- Cuando el jugador reanuda la partida desde la pausa
- Entonces el juego sigue sin sonido
Escenario 3: Recuperar el sonido

- Dado que el sonido está silenciado con 7 y 6 barras
- Cuando el jugador desactiva “Silenciar”
- Entonces la música vuelve a sonar a 7 barras y los efectos a 6 barras

