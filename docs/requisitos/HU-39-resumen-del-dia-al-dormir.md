# HU-39. Resumen del día al dormir

# HU-39. Resumen del día al dormir

Como jugador, quiero ver un resumen al terminar el día para saber qué he conseguido.

Criterios de aceptación:

- Al dormir en la cama, después del fundido a negro, aparece la pantalla “Día N terminado”, con N el día que termina.
- El resumen muestra las monedas ganadas ese día (ventas y recompensas), las cosechas recogidas y los peces pescados.
- El resumen se cierra con E y entonces empieza el día siguiente a las 06:00.
- Al dormirse a medianoche no aparece el resumen, porque el progreso del día se pierde.
Escenario 1: Ver el resumen

- Dado que es el día 2 y el jugador ha vendido 2 Nabos por 30 monedas y ha pescado 1 Trucha
- Cuando duerme en la cama
- Entonces aparece “Día 2 terminado”
- Y el resumen muestra 30 monedas ganadas, 0 cosechas y 1 pez
Escenario 2: Cerrar el resumen

- Dado que el resumen del día está visible
- Cuando el jugador pulsa E
- Entonces el reloj marca el día siguiente a las 06:00
Escenario 3: Las compras no restan

- Dado que es el día 1 y el jugador solo ha comprado una Pala
- Cuando duerme en la cama
- Entonces el resumen muestra 0 monedas ganadas
Escenario 4: Dormirse a medianoche

- Dado que son las 23:59 y el jugador no ha dormido
- Cuando el reloj llega a las 00:00
- Entonces no aparece el resumen del día
