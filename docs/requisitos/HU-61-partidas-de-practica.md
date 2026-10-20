# HU-61. Partidas de práctica

# HU-61. Partidas de práctica

Como jugador, quiero empezar partidas preparadas en momentos concretos de la historia para probar el juego sin tener que jugar desde el principio.

Criterios de aceptación:

- La opción “Partidas de práctica” del menú principal abre la lista de partidas preparadas. Escape o “Volver” regresan al menú con “Partidas de práctica” seleccionada.
- Partidas: “Día 2: la granja” (con Pala, Regadera y 5 Semillas), “Día 3: el lago” (con Caña de pescar), “Día 4: día de mercado” (con 4 Nabos listos en el huerto), “Día 5: la torre” (con las piezas de la granja y del lago), “Día 6: la reparación” (con las tres piezas y el encargo 4 activo), “Día 7: la feria” e “Inventario lleno” (día 1 con las 20 casillas ocupadas).
- Cada partida empieza a las 06:00 en la zona indicada, con los encargos anteriores completados.
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
