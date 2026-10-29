# HU-70. Nueva zona: el Barrio

# HU-70. Nueva zona: el Barrio

Como jugador, quiero visitar el barrio donde viven los vecinos para conocer mejor el pueblo.

Criterios de aceptación:

- El barrio es una zona nueva conectada con la plaza por un camino en el borde oeste de la plaza.
- En el barrio hay cinco casas: la de Tomás y Pablo, la de Lucía, la de Rosa, la de Fran y la de Elena. Cada una tiene un cartel con el nombre de quien vive en ella.
- Se puede entrar en la casa de Tomás y Pablo y en la de Lucía. Cada una es una zona interior, con su puerta, como la casa del jugador.
- Al caminar hacia la puerta de la casa de Rosa, la de Fran o la de Elena aparece el cuadro de diálogo “La puerta está cerrada” y no se cambia de zona (como las puertas cerradas de HU-57).
- El barrio tiene su propia música, que entra al llegar como en las demás zonas (HU-31). Las dos casas usan la música de la casa del jugador.
- El cambio de zona funciona como el resto de puertas (HU-08).
Escenario 1: Entrar al barrio

- Dado que el jugador está en la plaza
- Cuando camina por el camino del oeste
- Entonces aparece en el barrio, junto a la salida hacia la plaza
Escenario 2: Volver a la plaza

- Dado que el jugador está en el barrio
- Cuando camina por el camino del este
- Entonces aparece en la plaza, junto al camino del oeste
Escenario 3: Entrar en una casa

- Dado que el jugador está en el barrio, delante de la casa de Lucía
- Cuando camina hacia la puerta
- Entonces aparece dentro de la casa de Lucía
Escenario 4: Casa cerrada

- Dado que el jugador está en el barrio, delante de la casa de Rosa
- Cuando camina hacia la puerta
- Entonces aparece el cuadro “La puerta está cerrada”
- Y el jugador sigue en el barrio
Escenario 5: Carteles de las casas

- Dado que el jugador está junto al cartel de la casa de Tomás y Pablo
- Cuando pulsa E
- Entonces aparece el texto “Casa de Tomás y Pablo”
