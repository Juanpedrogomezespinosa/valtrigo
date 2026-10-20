# HU-31. Música de fondo según la zona

# HU-31. Música de fondo según la zona

Como jugador, quiero que cada zona tenga su música para distinguir los lugares.

Criterios de aceptación:

- El juego tiene 8 pistas de música: 1 para el menú principal y 1 para cada una de las 7 zonas.
- Al cambiar de zona, la música cambia a la de la nueva zona.
- Si el jugador se mueve dentro de la misma zona, la música no se reinicia.
Escenario 1: Cambio de zona

- Dado que el jugador está en la zona exterior del pueblo
- Cuando entra en la tienda
- Entonces la música cambia a la pista de la tienda
Escenario 2: Misma zona

- Dado que el jugador está dentro de la tienda y la música de la tienda suena
- Cuando se mueve por el interior de la tienda
- Entonces la música no se reinicia
Escenario 3: Música del menú

- Dado que el jugador abre el menú principal
- Cuando se carga el menú
- Entonces suena la pista del menú principal
