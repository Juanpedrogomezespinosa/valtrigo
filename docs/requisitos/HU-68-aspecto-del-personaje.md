# HU-68. Aspecto del personaje

# HU-68. Aspecto del personaje

Como jugador, quiero elegir el aspecto de mi personaje para sentir que es mío.

Criterios de aceptación:

- Al empezar una partida nueva, después de elegir el nombre (HU-67), aparece la pantalla “¿Cómo eres?” con tres opciones: “Género” (Hombre o Mujer), “Piel” (Clara, Media u Oscura) y “Pelo” (Castaño, Negro, Pelirrojo o Rubio).
- Al abrir la pantalla están elegidos Hombre, piel Media y pelo Pelirrojo.
- Las flechas arriba y abajo eligen la opción, y las flechas izquierda y derecha cambian su valor. Se detienen en el primer valor y en el último.
- Una vista previa grande muestra al personaje con el aspecto elegido. Cambia al momento con cada valor y gira sobre sí mismo (abajo, izquierda, arriba y derecha), mirando un segundo hacia cada lado.
- Enter confirma el aspecto y empieza la partida. El aspecto se guarda con la partida.
- El personaje tiene el aspecto elegido en todas las zonas y en el podio de la ceremonia (HU-66).
- Los textos que se dirigen al jugador concuerdan con su género. Por ejemplo, la vendedora dice “¡Bienvenida a la tienda!” y, sin energía, aparece “Estás demasiado cansada” (HU-47).
- Las partidas guardadas antes de esta historia y las partidas de práctica (HU-61) tienen el aspecto inicial: Hombre, piel Media y pelo Pelirrojo.
Escenario 1: Elegir el aspecto

- Dado que el jugador acaba de elegir su nombre
- Cuando elige Mujer, piel Clara y pelo Rubio y pulsa Enter
- Entonces empieza la partida
- Y el personaje es una mujer de piel clara y pelo rubio
Escenario 2: Aspecto inicial

- Dado que el jugador acaba de elegir su nombre
- Cuando aparece la pantalla “¿Cómo eres?”
- Entonces están elegidos Hombre, piel Media y pelo Pelirrojo
Escenario 3: Vista previa

- Dado que la pantalla “¿Cómo eres?” está abierta
- Cuando el jugador cambia el pelo a Negro
- Entonces la vista previa muestra al personaje con el pelo negro
Escenario 4: Aspecto guardado

- Dado que hay una partida guardada con una mujer de piel Oscura y pelo Castaño
- Cuando el jugador continúa la partida
- Entonces el personaje es una mujer de piel oscura y pelo castaño
Escenario 5: Textos según el género

- Dado que el personaje es una mujer y tiene 2 de energía
- Cuando intenta cavar una parcela
- Entonces aparece “Estás demasiado cansada”
