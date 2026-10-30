# HU-87. Minijuego de pesca

# HU-87. Minijuego de pesca

Como jugador, quiero tener que luchar con el pez para sacarlo, para que pescar sea un reto y no solo esperar.

Criterios de aceptación:

- Al pulsar E con “¡Pica!” en pantalla (HU-48) empieza el minijuego: aparece a la derecha del personaje una barra vertical con el pez, una zona verde y, al lado, un medidor de captura. Encima de la barra pone “Mantén E”.
- Al empezar, la zona verde está centrada en el pez y el medidor está a un 30 %.
- Mientras se mantiene pulsada E, la zona verde sube; al soltarla, baja. No sale de la barra.
- Mientras el pez está dentro de la zona verde, el medidor se llena (un 25 % por segundo) y suena el carrete. Mientras está fuera, se vacía (un 15 % por segundo).
- Si el medidor se llena, el pez va al inventario y aparece “Has pescado [pez] de [tamaño] cm” (HU-49). Si se vacía, aparece “Se ha escapado” y no se pesca nada.
- Cada especie se mueve siempre igual:
  - la Carpa sube y baja despacio (la más fácil);
  - la Trucha sube y baja deprisa y con temblores;
  - el Siluro se queda quieto un momento y da tirones bruscos de un extremo a otro (la más difícil).
- Durante el minijuego el personaje no se mueve. Una flecha recoge la caña y el pez se escapa. Escape abre la pausa: el minijuego se detiene y continúa al reanudar.
- Si el pez no cabe en el inventario, aparece “Inventario lleno” y se pierde.
- La pesca tiene sonidos (Ninja Adventure): al lanzar la caña, al picar, el carrete mientras el pez está en la zona, al pescar el pez y cuando se escapa (también si se tira demasiado pronto o no se pulsa E a tiempo).
- En el concurso de pesca (HU-60) se pesca con el mismo minijuego.
Escenario 1: Empieza el minijuego

- Dado que aparece “¡Pica!”
- Cuando el jugador pulsa E
- Entonces aparece la barra del minijuego con el pez, la zona verde y el medidor al 30 %
Escenario 2: Subir y bajar la zona

- Dado que el minijuego está en marcha
- Cuando el jugador mantiene pulsada E
- Entonces la zona verde sube
- Y cuando la suelta, baja
Escenario 3: Pescar el pez

- Dado que el minijuego está en marcha
- Cuando el jugador mantiene el pez dentro de la zona verde hasta llenar el medidor
- Entonces el pez va al inventario
- Y aparece “Has pescado...”
Escenario 4: Se escapa

- Dado que el minijuego está en marcha
- Cuando el jugador no pulsa nada y el pez sale de la zona verde hasta vaciar el medidor
- Entonces aparece “Se ha escapado”
- Y el inventario no cambia
Escenario 5: Pausa

- Dado que el minijuego está en marcha
- Cuando el jugador pulsa Escape y espera
- Entonces el medidor no cambia mientras la pausa está abierta
- Y el minijuego continúa al reanudar
Escenario 6: Sonidos

- Dado que el jugador pesca un pez
- Cuando lanza la caña, pica el pez, lo mantiene en la zona y lo saca
- Entonces suenan los efectos de lanzar, picar, carrete y pez pescado
