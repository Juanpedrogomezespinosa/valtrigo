# HU-88. Créditos finales

# HU-88. Créditos finales

Como jugador, quiero ver unos créditos con música al terminar el juego, para saber quién lo ha desarrollado y quién lo ha probado.

Criterios de aceptación:

- Los créditos finales aparecen al cerrar el mensaje de final (HU-37) y al elegir “Créditos” en el menú principal (HU-35).
- Al empezar, suena desde el principio la canción de los créditos.
- Durante los primeros 34 segundos, mientras arranca la canción, hay una cinemática sin interfaz: la pantalla sale de negro, la cámara recorre la plaza del pueblo mientras la noche se aclara hasta hacerse de día, se detiene en la torre del reloj y aparece el título “Valtrigo”. Durante la cinemática no aparece ningún nombre.
- Después, sobre el pueblo oscurecido, van apareciendo los nombres uno a uno, cada uno con su papel encima, en este orden:
  - QA: José Antonio Amaya Postigo, Antonio Consuegra Rosa, María Femenía Solero, Francisco Javier García José, Aurora García López, Nicolás García López, Tania Leticia López Vega, Juan Ignacio Lozupone Moratinos, Daniel Montañez Núñez, Mateo José Moya Jiménez, Moisés Muley Álvarez, Jessica Pérez Fernández, Matthew Aaron Powell Delgado, José Rodríguez Ripoll, Sergio Rodríguez Vázquez, Sebastian Alessandro Rojas Francia y Juan Moisés Sánchez Cordero.
  - Desarrollo: Juanpe Gómez, el último.
- El último nombre se queda en pantalla hasta que termina la canción. Entonces la pantalla se funde a negro y los créditos terminan.
- Escape salta los créditos en cualquier momento. En una esquina se indica “Escape: saltar”.
- Al terminar o al saltarlos:
  - si se abrieron desde el menú principal, aparece la pantalla de créditos con el autor y las licencias (HU-35) y vuelve a sonar la música del menú;
  - si se abrieron al final de la partida, se vuelve a la partida, suena otra vez la música de la zona y se sigue jugando.
- Mientras se ven los créditos, la partida está detenida: el reloj no avanza.
Escenario 1: Créditos desde el menú

- Dado que el jugador está en el menú principal
- Cuando pulsa “Créditos”
- Entonces empiezan los créditos finales
- Y suena la canción de los créditos
Escenario 2: Cinemática al principio

- Dado que acaban de empezar los créditos finales
- Cuando pasan los primeros 34 segundos
- Entonces se ve el pueblo y el título “Valtrigo”
- Y no aparece ningún nombre
Escenario 3: Los nombres

- Dado que han pasado los primeros 34 segundos de los créditos finales
- Cuando siguen los créditos
- Entonces aparecen uno a uno los nombres del equipo de QA, con “QA” encima
- Y el último es Juanpe Gómez, con “Desarrollo” encima
Escenario 4: Saltar los créditos desde el menú

- Dado que el jugador ha abierto los créditos finales desde el menú principal
- Cuando pulsa Escape
- Entonces aparece la pantalla de créditos con el autor y las licencias
- Y suena la música del menú
Escenario 5: Créditos al terminar el juego

- Dado que el mensaje de final está visible
- Cuando el jugador lo cierra con E
- Entonces empiezan los créditos finales
Escenario 6: Volver a la partida

- Dado que el jugador está viendo los créditos finales al terminar el juego
- Cuando pulsa Escape
- Entonces vuelve a la partida
- Y suena la música de la zona
- Y puede moverse con normalidad
Escenario 7: La partida se detiene

- Dado que el jugador está viendo los créditos finales al terminar el juego
- Cuando pasan unos segundos
- Entonces la hora de la partida no cambia
