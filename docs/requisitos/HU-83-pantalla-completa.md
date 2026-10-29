# HU-83. Pantalla completa

# HU-83. Pantalla completa

Como jugador, quiero jugar en pantalla completa para que no se vea nada del navegador.

Criterios de aceptación:

- La tecla F activa la pantalla completa y, al volver a pulsarla, la desactiva. Funciona en los menús y durante la partida, salvo en la pantalla del nombre (HU-67), donde la F es una letra.
- En la pantalla de opciones hay una fila “Pantalla completa” con el valor “Sí” o “No”. Enter o un clic la activan o la desactivan.
- En pantalla completa el juego ocupa toda la pantalla, sin ninguna parte del navegador, y se ve sin deformarse.
- Escape también sale de la pantalla completa (lo hace el navegador). La fila de las opciones muestra siempre el estado real.
- Al recargar la página, el juego empieza en la ventana del navegador: los navegadores solo permiten entrar en pantalla completa después de que el jugador pulse una tecla o haga clic.
- La tabla de controles (HU-33) incluye “Pantalla completa: F”.
Escenario 1: Activar con F

- Dado que el juego está en la ventana del navegador
- Cuando el jugador pulsa F
- Entonces el juego pasa a pantalla completa
Escenario 2: Desactivar con F

- Dado que el juego está en pantalla completa
- Cuando el jugador pulsa F
- Entonces el juego vuelve a la ventana del navegador
Escenario 3: Desde las opciones

- Dado que el jugador está en la pantalla de opciones con “Pantalla completa: No”
- Cuando selecciona “Pantalla completa” y pulsa Enter
- Entonces el juego pasa a pantalla completa
- Y la fila muestra “Sí”
Escenario 4: La F en el nombre

- Dado que el jugador está escribiendo su nombre
- Cuando pulsa F
- Entonces se escribe la letra “F”
- Y el juego no pasa a pantalla completa
Escenario 5: Controles

- Dado que el jugador abre el menú de opciones
- Cuando consulta la tabla de controles
- Entonces aparece “Pantalla completa” con la tecla “F”
