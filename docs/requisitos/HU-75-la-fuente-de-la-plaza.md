# HU-75. La fuente de la plaza

# HU-75. La fuente de la plaza

Como jugador, quiero usar la fuente de la plaza para recuperar algo de energía y recibir pistas cuando me atasco.

Criterios de aceptación:

- Al pulsar E junto a la fuente de la plaza aparece el cuadro “Fuente” con las opciones “Beber”, “Echar una moneda” y “Nada”.
- “Beber” recupera 15 puntos de energía, sin pasar de 100, y aparece “Te sientes con más energía”. Solo se puede beber una vez al día: la segunda vez aparece “Ya has bebido hoy” y la energía no cambia.
- “Echar una moneda” cuesta 5 monedas y da una pista. Sin 5 monedas aparece “No tienes monedas suficientes” y no se da la pista.
- La pista es la primera de la lista que todavía sirve (lo que indica aún no se ha hecho):
  1. El cofre del granero está sin abrir: “Detrás del granero hay algo que brilla.”
  2. La Pala sigue en la granja: “El granjero siempre pierde la pala cerca del granero.”
  3. El cofre del lago está sin abrir: “Al suroeste del lago, entre los árboles, se abre un sendero.”
  4. El cofre de la torre está sin abrir (a partir del día 5): “En la torre hay un almacén que nadie usa.”
  5. Falta alguna página del diario: “La relojera escribía mucho. Busca en las esquinas del pueblo.”
  6. Si no queda ninguna: “La fuente no tiene nada más que contarte.”
- Echar una moneda se puede repetir las veces que se quiera; cada vez cuesta 5 monedas.
- “Nada” cierra el cuadro sin hacer nada.
- Las tres opciones se ven completas y separadas, sin montarse unas sobre otras.
- La fuente es un obstáculo (HU-07).
Escenario 1: Beber

- Dado que el jugador tiene 60 puntos de energía y hoy no ha bebido
- Cuando elige “Beber”
- Entonces la energía sube a 75
- Y aparece “Te sientes con más energía”
Escenario 2: Beber dos veces el mismo día

- Dado que el jugador ya ha bebido hoy y tiene 75 puntos de energía
- Cuando vuelve a elegir “Beber”
- Entonces aparece “Ya has bebido hoy”
- Y la energía sigue en 75
Escenario 3: Al día siguiente

- Dado que el jugador bebió ayer
- Cuando elige “Beber”
- Entonces recupera 15 puntos de energía
Escenario 4: Echar una moneda

- Dado que el jugador tiene 20 monedas y no ha abierto el cofre del granero
- Cuando elige “Echar una moneda”
- Entonces tiene 15 monedas
- Y aparece la pista “Detrás del granero hay algo que brilla.”
Escenario 5: Sin monedas

- Dado que el jugador tiene 3 monedas
- Cuando elige “Echar una moneda”
- Entonces aparece “No tienes monedas suficientes”
- Y sigue teniendo 3 monedas
Escenario 6: Pista siguiente

- Dado que el cofre del granero ya está abierto y la Pala recogida
- Cuando el jugador echa una moneda
- Entonces aparece la pista “Al suroeste del lago, entre los árboles, se abre un sendero.”
Escenario 7: Opciones legibles

- Dado que el jugador está junto a la fuente
- Cuando pulsa E
- Entonces “Beber”, “Echar una moneda” y “Nada” se ven separadas, sin solaparse, también al cambiar la opción seleccionada
