# HU-11. Diálogos distintos según el progreso

# HU-11. Diálogos distintos según el progreso

Como jugador, quiero que los NPC cambien lo que dicen según mi progreso para sentir que el mundo reacciona.

Criterios de aceptación:

- Cada NPC con encargos muestra un diálogo distinto según el estado de su encargo activo: antes de aceptarlo, en curso o completado.
- Si un NPC tiene varios encargos, ofrece el siguiente solo cuando el anterior está completado, respetando el orden de los encargos.
- El diálogo cambia según el estado del encargo, no según el día del reloj.
- Con el reloj de la torre reparado (encargo “Las piezas del reloj” completado), un NPC que no tiene nada que decir sobre sus encargos comenta que el reloj vuelve a funcionar.
Escenario 1: Antes de aceptar el encargo

- Dado que el jugador no ha aceptado el encargo del NPC
- Cuando el jugador habla con el NPC
- Entonces el NPC ofrece el encargo y el jugador puede aceptarlo o rechazarlo
Escenario 2: Encargo activo

- Dado que el jugador ha aceptado el encargo y aún no lo ha completado
- Cuando habla con el NPC
- Entonces el NPC recuerda el encargo y muestra un diálogo de seguimiento
Escenario 3: Encargo completado

- Dado que el jugador ha completado el encargo
- Cuando habla con el NPC
- Entonces el NPC muestra un diálogo de agradecimiento distinto a los anteriores
Escenario 4: Siguiente encargo del mismo NPC

- Dado que el NPC tiene un segundo encargo y el primero ya está completado
- Cuando el jugador habla con el NPC
- Entonces el NPC ofrece el segundo encargo
Escenario 5: Reloj reparado

- Dado que el encargo “Las piezas del reloj” está completado
- Y el alcalde no tiene ningún encargo que ofrecer
- Cuando el jugador habla con el alcalde
- Entonces el alcalde comenta que el reloj vuelve a funcionar

