# HU-61. Partidas de práctica

# HU-61. Partidas de práctica

Como jugador, quiero empezar partidas preparadas en momentos concretos de la historia para probar el juego sin tener que jugar desde el principio.

Criterios de aceptación:

- La opción “Partidas de práctica” del menú principal abre la lista de partidas preparadas. Escape o “Volver” regresan al menú con “Partidas de práctica” seleccionada.
- Partidas: “Día 2: la granja” (en la granja, con Pala, Regadera y 5 Semillas), “Día 3: el lago” (en el lago, con Caña de pescar), “Día 4: día de mercado” (en la granja, con Pala, Regadera y 4 Nabos listos en el huerto), “Día 5: la torre” (en la plaza, con las piezas de la granja y del lago), “Día 6: la reparación” (en la torre, con las tres piezas y el encargo 4 activo), “Día 7: la feria” (en la plaza, con una Calabaza y una Caña de pescar para los concursos) e “Inventario lleno” (día 1 en la plaza, con las 20 casillas ocupadas).
- Cada partida empieza a la hora a la que empieza su día en el juego (06:00; el día 1, a las 08:00, HU-62; el día 7, a las 12:00, HU-58), con los encargos anteriores completados y 150 monedas. El jugador se llama “Forastero”.
- Empezar una partida de práctica no modifica la partida guardada. Se guarda igual que cualquier partida (al dormir o desde la pausa).
Escenario 1: Abrir la lista

- Dado que el menú principal está abierto
- Cuando el jugador activa “Partidas de práctica”
- Entonces aparece la lista de partidas preparadas
Escenario 2: Empezar una partida preparada

- Dado que la lista de partidas de práctica está abierta
- Cuando el jugador elige “Día 5: la torre”
- Entonces la partida empieza el día 5 a las 06:00 en la plaza
- Y el inventario tiene el Engranaje de cobre y el Muelle de plata
Escenario 3: La partida guardada no cambia

- Dado que existe una partida guardada
- Cuando el jugador empieza una partida de práctica
- Entonces la partida guardada no cambia
Escenario 4: Volver

- Dado que la lista de partidas de práctica está abierta
- Cuando el jugador pulsa Escape
- Entonces regresa al menú principal con “Partidas de práctica” seleccionada
