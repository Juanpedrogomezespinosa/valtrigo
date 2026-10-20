# HU-29. Ajustar el volumen de los efectos

# HU-29. Ajustar el volumen de los efectos

Como jugador, quiero ajustar los efectos de sonido por separado para ajustar el volumen de los efectos sin cambiar el de la música.

Criterios de aceptación:

- El volumen de efectos tiene 10 barras y es independiente del volumen de música.
- Al soltar el control de efectos, suena un efecto de prueba con el nuevo volumen.
Escenario 1: Efectos independientes de la música

- Dado que el volumen de música está en 5 barras y el de efectos en 5 barras
- Cuando el jugador baja los efectos a 0 barras
- Entonces la música sigue sonando a 5 barras
- Y los efectos no se escuchan
Escenario 2: Efecto de prueba

- Dado que el jugador está en el menú de opciones
- Cuando suelta el control de efectos en 7 barras
- Entonces suena el efecto de prueba a 7 barras

