# HU-67. Nombre del jugador

# HU-67. Nombre del jugador

Como jugador, quiero elegir el nombre de mi personaje para que el pueblo me llame por mi nombre.

Criterios de aceptación:

- Al empezar una partida nueva, después de la introducción (HU-62), aparece la pantalla “¿Cómo te llamas?”, con un cuadro en el que se escribe el nombre con el teclado.
- El nombre admite letras (también con tilde, ñ y ü) y espacios, hasta 12 caracteres. Retroceso borra el último carácter y Enter lo confirma.
- Con el nombre vacío, Enter no hace nada.
- Al confirmar el nombre se pasa a elegir el aspecto del personaje (HU-68). El nombre se guarda con la partida.
- El nombre aparece en el podio de la ceremonia (HU-66) y en el discurso del alcalde.
Escenario 1: Elegir el nombre

- Dado que el jugador acaba de pasar la introducción
- Cuando escribe “Juan” y pulsa Enter
- Entonces aparece la pantalla del aspecto (HU-68)
- Y el nombre del jugador es “Juan”
Escenario 2: Nombre demasiado largo

- Dado que la pantalla del nombre está abierta
- Cuando el jugador escribe “Maximilianoooo”
- Entonces el nombre queda en “Maximilianoo”, con 12 caracteres
Escenario 3: Nombre vacío

- Dado que la pantalla del nombre está abierta y el nombre está vacío
- Cuando el jugador pulsa Enter
- Entonces sigue en la pantalla del nombre
Escenario 4: Nombre en el podio

- Dado que el jugador se llama “Juan” y presentó una Calabaza de 12 kg al concurso de la cosecha
- Cuando el alcalde anuncia el concurso de la cosecha
- Entonces dice “Concurso de la cosecha. Primer puesto: Juan, con una Calabaza de 12 kg.”
