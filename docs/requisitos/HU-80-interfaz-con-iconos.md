# HU-80. Interfaz con iconos

# HU-80. Interfaz con iconos

Como jugador, quiero una interfaz más clara y bonita para ver de un vistazo la hora, el dinero y la energía.

Criterios de aceptación:

- La interfaz de la partida se muestra en dos paneles con fondo oscuro y borde claro: el del día y la hora, arriba a la izquierda, y el del dinero y la energía, arriba a la derecha.
- Delante del día aparece un sol de 06:00 a 19:59 y una luna de 20:00 a 05:59.
- El dinero se muestra con el icono de una moneda seguido de la cantidad, por ejemplo “125” (HU-16).
- La energía se muestra con el icono de un rayo, una barra y el texto “[actual]/100” (HU-14).
- La barra de energía se llena en proporción a la energía actual. Es verde por encima de 50, amarilla de 26 a 50 y roja de 25 o menos.
- La cuenta atrás del concurso de pesca (HU-60) aparece en un panel debajo del día y la hora.
- Los textos de los paneles cumplen el contraste de HU-36.
Escenario 1: Sol de día

- Dado que son las 10:00
- Cuando el jugador mira la interfaz
- Entonces aparece un sol delante del día
Escenario 2: Luna de noche

- Dado que son las 21:00
- Cuando el jugador mira la interfaz
- Entonces aparece una luna delante del día
Escenario 3: Dinero con icono

- Dado que el jugador empieza una partida nueva
- Cuando mira la interfaz
- Entonces aparece el icono de la moneda seguido de “100”
Escenario 4: Barra de energía verde

- Dado que el jugador tiene 80 puntos de energía
- Cuando mira la interfaz
- Entonces la barra de energía está llena en un 80 % y es verde
- Y aparece “80/100”
Escenario 5: Barra de energía amarilla

- Dado que el jugador tiene 40 puntos de energía
- Cuando mira la interfaz
- Entonces la barra de energía está llena en un 40 % y es amarilla
Escenario 6: Barra de energía roja

- Dado que el jugador tiene 20 puntos de energía
- Cuando mira la interfaz
- Entonces la barra de energía está llena en un 20 % y es roja
Escenario 7: Interfaz legible

- Dado que el jugador está en la partida
- Cuando mira la interfaz
- Entonces el contraste entre los textos de los paneles y su fondo es de al menos 4,5:1
