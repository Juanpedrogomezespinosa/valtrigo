# HU-28. Ajustar el volumen de la música

# HU-28. Ajustar el volumen de la música

Como jugador, quiero ajustar el volumen de la música para que no moleste.

Criterios de aceptación:

- El control de volumen musical tiene 10 barras, de 0 a 10.
- El cambio de volumen se aplica al instante.
- Con 0 barras no se escucha música.
Escenario 1: Subir el volumen

- Dado que el volumen de música está en 5 barras
- Cuando el jugador sube una barra
- Entonces el volumen de música pasa a 6 barras
- Y el cambio se escucha al instante
Escenario 2: Volumen en cero

- Dado que el volumen de música está en 1 barra
- Cuando el jugador baja a 0 barras
- Entonces no se escucha música
Escenario 3: Límite máximo

- Dado que el volumen de música está en 10 barras
- Cuando el jugador intenta subir más
- Entonces el volumen se mantiene en 10 barras

