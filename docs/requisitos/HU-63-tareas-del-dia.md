# HU-63. Tareas del día

# HU-63. Tareas del día

Como jugador, quiero una lista de tareas para cada día para saber qué hacer a continuación y no quedarme atascado.

Criterios de aceptación:

- La lista de objetivos (O) tiene el apartado “Tareas de hoy (día N)” con las tareas del día. Cada tarea aparece marcada (☑) cuando está hecha y sin marcar (☐) cuando no.
- Las tareas de cada día siguen la historia del juego. Día 1: hablar con el alcalde, aceptar su encargo, recoger la carta en la tienda, entregársela y comprar Semillas y una Regadera. Día 2: ir a la granja, hablar con el granjero, llevarle las Semillas, recoger la Pala, buscar el cofre del granero y cavar, sembrar y regar una parcela del huerto. Día 3: ir al lago, encontrar el cofre del lago, regar los cultivos, pescar un pez, ir al bosque y recoger setas o moras. Día 4: aceptar y completar “Día de mercado” y recoger la primera cosecha. Día 5: entrar en la torre, hablar con la relojera, encontrar el cofre de la torre y una página del diario. Día 6: colocar las piezas en el mecanismo del reloj y llevar las Manzanas al granjero. Día 7: participar en los concursos de la cosecha y de pesca antes de las 17:00, ir a la ceremonia de las 18:00 y escuchar el discurso del alcalde.
- Las tareas que consisten en hacer algo ese día (hablar con alguien, ir a una zona, comprar o leer un cartel) solo aparecen en su día y se marcan al hacerlas ese día.
- Las tareas de encargos, objetos y cofres que siguen pendientes de días anteriores también aparecen, hasta que se hacen.
- Si no hay ninguna tarea para hoy, aparece “No hay tareas para hoy”.
Escenario 1: Ver las tareas del día

- Dado que es el día 1 y el jugador acaba de empezar
- Cuando pulsa O
- Entonces aparece “Tareas de hoy (día 1)”
- Y aparece “☐ Habla con el alcalde en la plaza”
Escenario 2: Tarea hecha

- Dado que es el día 1
- Cuando el jugador habla con el alcalde y pulsa O
- Entonces aparece “☑ Habla con el alcalde en la plaza”
Escenario 3: Tarea pendiente de un día anterior

- Dado que es el día 3 y el encargo “Semillas para la cosecha” no está completado
- Cuando el jugador pulsa O
- Entonces aparece “☐ Lleva 3 Semillas al granjero”
Escenario 4: Tareas que solo son de su día

- Dado que es el día 2 y el día 1 el jugador no compró Semillas
- Cuando pulsa O
- Entonces no aparece la tarea “Compra Semillas en la tienda”
Escenario 5: Sin tareas

- Dado que es el día 8 y todas las tareas de días anteriores están hechas
- Cuando el jugador pulsa O
- Entonces aparece “No hay tareas para hoy”
