# HU-60. Concurso de pesca

# HU-60. Concurso de pesca

Como jugador, quiero participar en el concurso de pesca de la feria para ganar un premio.

Criterios de aceptación:

- De 12:00 a 17:00 del día 7, al pulsar E junto al puesto de pesca aparece “¿Inscribirte en el concurso de pesca?” con “Sí” y “No”. Al elegir “Sí” aparece el cuadro de diálogo “Ve al lago y lanza la caña para empezar”.
- El concurso empieza la primera vez que el jugador lanza la caña en el lago después de inscribirse. Dura 1 minuto y 30 segundos de tiempo real (90 minutos de juego), pero termina a las 17:00 como muy tarde. Cuenta el pez más grande pescado durante ese tiempo.
- Durante el concurso, la interfaz muestra la cuenta atrás del tiempo que queda, “Concurso de pesca: 1:30”, que baja segundo a segundo.
- Durante el concurso pican las tres especies (Trucha, Carpa y Siluro) al azar, sea la hora que sea.
- Durante el concurso, pescar no gasta energía. Los peces pescados se quedan en el inventario.
- Al terminar aparece “Concurso terminado: tu mejor pez mide N cm” o, si no ha pescado nada, “Concurso terminado: no has pescado nada”.
- Compiten también tres vecinos con resultados fijos: Rosa (62 cm), Tomás (48 cm) y Pablo (35 cm). Gana el pez más grande. En caso de empate, queda por delante el vecino.
- Los tres primeros se anuncian en la ceremonia (HU-66). Premios para el jugador: 1.º 100 monedas, 2.º 50 y 3.º 20.
- Solo se puede participar una vez por partida. Después, el puesto muestra “Ya has participado”. Después de las 17:00, el puesto muestra “El concurso ya ha terminado”.
Escenario 1: Inscribirse

- Dado que es el día 7 a las 13:00
- Cuando el jugador pulsa E junto al puesto de pesca y elige “Sí”
- Entonces aparece el cuadro de diálogo “Ve al lago y lanza la caña para empezar”
- Y la cuenta atrás aún no ha empezado
Escenario 2: Empezar en el lago

- Dado que el jugador se ha inscrito en el concurso de pesca
- Cuando lanza la caña en el lago
- Entonces empieza el concurso y aparece “Concurso de pesca: 1:30”
Escenario 3: Mejor pez

- Dado que el concurso de pesca está en marcha
- Y el jugador pesca una Carpa de 30 cm y una Trucha de 45 cm
- Cuando termina el concurso
- Entonces aparece “Concurso terminado: tu mejor pez mide 45 cm”
Escenario 4: Sin peces

- Dado que el concurso de pesca está en marcha y el jugador no pesca nada
- Cuando termina el concurso
- Entonces aparece “Concurso terminado: no has pescado nada”
Escenario 5: Duración

- Dado que el jugador empieza el concurso a las 13:00
- Cuando pasan 1 minuto y 30 segundos de tiempo real
- Entonces el concurso termina a las 14:30
Escenario 6: Cuenta atrás

- Dado que el concurso de pesca acaba de empezar
- Cuando pasan 10 segundos
- Entonces aparece “Concurso de pesca: 1:20”
Escenario 7: Todas las especies

- Dado que el concurso de pesca está en marcha a las 15:00
- Cuando el jugador pesca varios peces
- Entonces pueden salir Truchas, Carpas y Siluros
Escenario 8: Fin a las 17:00

- Dado que el concurso de pesca empezó a las 16:30
- Cuando el reloj llega a las 17:00
- Entonces el concurso termina
Escenario 9: Solo una vez

- Dado que el jugador ya ha participado en el concurso de pesca
- Cuando pulsa E junto al puesto
- Entonces aparece el mensaje “Ya has participado”
