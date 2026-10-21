# HU-24. Dormir para avanzar de día

# HU-24. Dormir para avanzar de día

Como jugador, quiero dormir en mi casa para terminar el día y empezar el siguiente.

Criterios de aceptación:

- Al pulsar E junto a la cama de la casa del jugador aparece el mensaje “¿Dormir?” con las opciones “Sí” y “No”.
- Al dormir, se avanza al día siguiente a las 06:00 (a las 12:00 si es el día de la feria, HU-58) y la energía vuelve a 100.
- Se puede dormir a cualquier hora del día.
Escenario 1: Dormir por la noche

- Dado que son las 21:00 y el jugador está junto a la cama de su casa
- Cuando pulsa E y elige “Sí”
- Entonces la pantalla se funde a negro
- Y aparece el resumen del día (HU-39)
- Y al pulsar E, el reloj marca el día siguiente a las 06:00
- Y la energía es 100
Escenario 2: Cancelar

- Dado que son las 21:00 y el jugador está junto a la cama
- Cuando pulsa E y elige “No”
- Entonces el juego continúa a las 21:00 sin cambios
Escenario 3: Dormirse a medianoche

- Dado que son las 23:59 y el jugador no ha dormido
- Cuando el reloj llega a las 00:00
- Entonces el personaje se duerme automáticamente
- Y el día siguiente empieza a las 06:00
- Y el progreso no guardado del día se pierde
Escenario 4: Energía baja

- Dado que la energía es 20
- Cuando el jugador duerme en su cama
- Entonces la energía es 100

