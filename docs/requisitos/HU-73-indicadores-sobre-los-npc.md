# HU-73. Indicadores sobre los NPC

# HU-73. Indicadores sobre los NPC

Como jugador, quiero ver sobre los personajes si tienen algo para mí para saber con quién hablar.

Criterios de aceptación:

- Sobre un NPC aparece “!” si al hablar con él ofrecería un encargo principal o una misión.
- Sobre un NPC aparece “?” si tiene un encargo o una misión activa que se puede completar al hablar con él (por ejemplo, el jugador ya tiene los objetos pedidos, o es el destinatario de un recado). También aparece “?” sobre Bigotes mientras hay que encontrarlo.
- Si se dan las dos cosas, aparece “?”.
- Sin nada de eso, no aparece ningún indicador.
- El indicador cambia en cuanto cambia la situación (al aceptar, al recoger los objetos, al completar...).
- El indicador no tapa el “E” de HU-10: cuando el jugador está a tiro, se ve el “E” en su lugar.
Escenario 1: Encargo para ofrecer

- Dado que es el día 1 y el encargo “Entregar la Carta del alcalde” no se ha aceptado
- Cuando el jugador mira al alcalde
- Entonces aparece “!” sobre el alcalde
Escenario 2: Misión lista para entregar

- Dado que “Leña para el invierno” está activa y el jugador tiene 3 Leñas
- Cuando mira a Bruno
- Entonces aparece “?” sobre Bruno
Escenario 3: Misión sin terminar

- Dado que “Leña para el invierno” está activa y el jugador tiene 1 Leña
- Cuando mira a Bruno
- Entonces no aparece ningún indicador sobre Bruno
Escenario 4: Destinatario de un recado

- Dado que “Un recado para el alcalde” está activa
- Cuando el jugador mira al alcalde
- Entonces aparece “?” sobre el alcalde
Escenario 5: Sin nada que ofrecer

- Dado que el jugador ya ha completado “Leña para el invierno”
- Cuando mira a Bruno
- Entonces no aparece ningún indicador sobre Bruno
