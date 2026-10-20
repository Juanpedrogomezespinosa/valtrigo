# HU-49. Peces según la hora

# HU-49. Peces según la hora

Como jugador, quiero que el pez dependa de la hora para que merezca la pena pescar en distintos momentos.

Criterios de aceptación:

- El pez depende de la hora en la que aparece “¡Pica!”: Trucha de 06:00 a 10:00, Carpa de 10:00 a 20:00 y Siluro de 20:00 a 24:00.
- Cada pez sale con un tamaño al azar dentro del rango de su especie: Carpa de 20 a 45 cm, Trucha de 25 a 50 cm y Siluro de 50 a 120 cm.
- Al pescar aparece el mensaje “Has pescado una [especie] de [tamaño] cm” (“un Siluro” para el Siluro). El tamaño no se guarda en el inventario: los peces de la misma especie se apilan.
- Precios de venta: Carpa 15 monedas, Trucha 20 y Siluro 50. Los peces no se pueden comer.
Escenario 1: Por la mañana

- Dado que son las 07:00
- Cuando el jugador pesca un pez
- Entonces es una Trucha
- Y aparece el mensaje “Has pescado una Trucha de [tamaño] cm”, con un tamaño entre 25 y 50
Escenario 2: Por la tarde

- Dado que son las 15:00
- Cuando el jugador pesca un pez
- Entonces es una Carpa
Escenario 3: Por la noche

- Dado que son las 22:00
- Cuando el jugador pesca un pez
- Entonces es un Siluro
Escenario 4: Cambio de franja

- Dado que son las 09:59 y el jugador ha lanzado la caña
- Cuando “¡Pica!” aparece a las 10:00
- Entonces el pez es una Carpa
