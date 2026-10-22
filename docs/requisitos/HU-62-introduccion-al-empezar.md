# HU-62. Introducción al empezar

# HU-62. Introducción al empezar

Como jugador, quiero una pequeña introducción al empezar una partida nueva para saber quién soy y qué hago en Valtrigo.

Criterios de aceptación:

- Al empezar una partida nueva, antes de cargar la zona inicial, aparece la introducción: varias pantallas de texto que cuentan quién es el jugador, por qué llega a Valtrigo y que la torre del reloj se ha parado.
- Cada pantalla se pasa con E. Al pasar la última, se eligen el nombre del jugador (HU-67) y su aspecto (HU-68) y empieza la partida.
- Escape salta la introducción y pasa directamente a elegir el nombre (HU-67).
- Mientras se muestra la introducción, el reloj del juego no avanza.
- “Continuar” carga la partida guardada sin mostrar la introducción.
Escenario 1: Ver la introducción

- Dado que el jugador está en el menú principal
- Cuando pulsa “Nueva partida”
- Entonces aparece la primera pantalla de la introducción
Escenario 2: Pasar las pantallas

- Dado que la introducción está visible
- Cuando el jugador pulsa E en cada pantalla y, después, escribe su nombre y confirma su aspecto
- Entonces se carga la zona inicial
- Y el reloj marca día 1 a las 08:00
Escenario 3: Saltar la introducción

- Dado que la introducción está visible
- Cuando el jugador pulsa Escape
- Entonces aparece la pantalla del nombre (HU-67)
- Y, al escribir su nombre y confirmar su aspecto, se carga la zona inicial en el día 1 a las 08:00
Escenario 4: Continuar sin introducción

- Dado que existe una partida guardada
- Cuando el jugador pulsa “Continuar”
- Entonces se carga la partida guardada sin mostrar la introducción
