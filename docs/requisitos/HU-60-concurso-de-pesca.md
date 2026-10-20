# HU-60. Concurso de pesca

# HU-60. Concurso de pesca

Como jugador, quiero participar en el concurso de pesca de la feria para ganar un premio.

Criterios de aceptación:

- Al pulsar E junto al puesto de pesca aparece “¿Inscribirte en el concurso de pesca?” con “Sí” y “No”.
- Al inscribirse empieza el concurso, que dura 1 minuto y 30 segundos de tiempo real (90 minutos de juego). Cuenta el pez más grande pescado en el lago durante ese tiempo (HU-49).
- Al terminar el concurso aparece “Concurso terminado: tu mejor pez mide N cm” y se cobra el premio: menos de 40 cm, 20 monedas; de 40 a 79 cm, 50; 80 cm o más, 100. Si no ha pescado nada, aparece “Concurso terminado: no has pescado nada” y no hay premio.
- Durante el concurso, pescar no gasta energía.
- Los peces pescados durante el concurso se quedan en el inventario.
- Solo se puede participar una vez por partida. Después, el puesto muestra “Ya has participado”.
Escenario 1: Inscribirse

- Dado que es el día 7
- Cuando el jugador pulsa E junto al puesto de pesca y elige “Sí”
- Entonces empieza el concurso de pesca
Escenario 2: Ganar un premio

- Dado que el concurso de pesca está en marcha
- Y el jugador pesca una Carpa de 30 cm y una Trucha de 45 cm
- Cuando termina el concurso
- Entonces aparece “Concurso terminado: tu mejor pez mide 45 cm”
- Y el jugador recibe 50 monedas
Escenario 3: Sin peces

- Dado que el concurso de pesca está en marcha y el jugador no pesca nada
- Cuando termina el concurso
- Entonces aparece “Concurso terminado: no has pescado nada”
- Y el dinero no cambia
Escenario 4: Duración

- Dado que el jugador se inscribe en el concurso a las 10:00
- Cuando pasan 1 minuto y 30 segundos de tiempo real
- Entonces el concurso termina a las 11:30
Escenario 5: Solo una vez

- Dado que el jugador ya ha participado en el concurso de pesca
- Cuando pulsa E junto al puesto
- Entonces aparece el mensaje “Ya has participado”
