# HU-74. Misiones con hora límite

# HU-74. Misiones con hora límite

Como jugador, quiero que algunas misiones tengan prisa para tener que organizar el día.

Criterios de aceptación:

- Algunas misiones (HU-72) tienen una hora límite: hay que completarlas antes de esa hora del mismo día en que se aceptan.
- Después de su hora límite, el vecino ya no ofrece esa misión ese día. La vuelve a ofrecer al día siguiente.
- En la lista de objetivos, la misión muestra “Antes de las [hora]”.
- Al llegar la hora límite sin completarla, aparece “Misión fallida: [nombre]” y la misión deja de estar activa. Si se recibió un objeto de misión, desaparece del inventario.
- Una misión fallida se vuelve a ofrecer al día siguiente.
- Si el día termina (al dormir o a medianoche) con una misión con hora límite activa, la misión falla.
Escenario 1: Hora límite en la lista

- Dado que el jugador acepta “Una trucha para Rosa” el día 3
- Cuando abre la lista de objetivos
- Entonces la misión muestra “Antes de las 12:00”
Escenario 2: Completar a tiempo

- Dado que “Una trucha para Rosa” está activa, son las 11:30 y el jugador tiene una Trucha
- Cuando habla con Rosa
- Entonces aparece “Misión completada”
Escenario 3: Misión fallida

- Dado que “Una trucha para Rosa” está activa y son las 11:59
- Cuando el reloj llega a las 12:00
- Entonces aparece “Misión fallida: Una trucha para Rosa”
- Y la misión ya no está en la lista de objetivos
Escenario 4: Objeto de misión al fallar

- Dado que “Paquete urgente” está activa y el jugador tiene el Paquete
- Cuando el reloj llega a las 15:00
- Entonces el Paquete desaparece del inventario
Escenario 5: Fuera de hora

- Dado que es el día 3 a las 13:00 y el jugador no ha aceptado “Una trucha para Rosa”
- Cuando habla con Rosa
- Entonces Rosa no ofrece la misión
Escenario 6: Otra oportunidad

- Dado que “Una trucha para Rosa” falló el día 3
- Cuando el jugador habla con Rosa el día 4 antes de las 12:00
- Entonces Rosa vuelve a ofrecer la misión
