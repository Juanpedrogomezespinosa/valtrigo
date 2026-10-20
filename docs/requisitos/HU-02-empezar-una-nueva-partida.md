# HU-02. Empezar una nueva partida

# HU-02. Empezar una nueva partida

Como jugador, quiero empezar una partida nueva para jugar desde el principio.

Criterios de aceptación:

- Al pulsar “Nueva partida” se carga la zona inicial (exterior del pueblo) con el personaje en su posición de inicio.
- Si existe una partida guardada, se pide confirmación antes de sobrescribirla.
- La partida nueva empieza con día 1 a las 06:00, 100 monedas, energía al máximo (100) e inventario vacío.
Escenario 1: Nueva partida sin partida guardada

- Dado que no existe ninguna partida guardada
- Cuando el jugador pulsa “Nueva partida”
- Entonces se carga la zona inicial con el personaje en su posición de inicio
- Y el reloj marca día 1 a las 06:00
Escenario 2: Confirmación al sobrescribir

- Dado que existe una partida guardada
- Cuando el jugador pulsa “Nueva partida”
- Entonces aparece el mensaje “¿Sobrescribir la partida guardada?” con los botones “Sí” y “No”
- Y si pulsa “No”, vuelve al menú principal sin cambios
Escenario 3: Confirmar la sobrescritura

- Dado que existe una partida guardada del día 4
- Cuando el jugador pulsa “Nueva partida” y después “Sí”
- Entonces la partida anterior se reemplaza por la nueva
- Y se carga la zona inicial en el día 1 a las 06:00
Escenario 4: Datos iniciales

- Dado que el jugador acaba de iniciar una partida nueva
- Cuando consulta su dinero, su energía y su inventario
- Entonces tiene 100 monedas y 100 puntos de energía
- Y su inventario está vacío

