# HU-42. Sembrar semillas

# HU-42. Sembrar semillas

Como jugador, quiero sembrar semillas en las parcelas cavadas para obtener cosechas.

Criterios de aceptación:

- Hay tres semillas: “Semilla” (da Nabo, tarda 2 días), “Semilla de zanahoria” (Zanahoria, 3 días) y “Semilla de calabaza” (Calabaza, 4 días).
- Al pulsar E junto a una parcela cavada y vacía aparece la lista de semillas del inventario. Al elegir una, se siembra, se gasta 1 unidad y 2 de energía (HU-76).
- Sin semillas aparece el mensaje “No tienes semillas” y la parcela no cambia.
- En una parcela sembrada no se puede sembrar otra vez.
Escenario 1: Sembrar

- Dado que el jugador tiene 3 Semillas y está junto a una parcela cavada y vacía
- Cuando pulsa E y elige “Semilla”
- Entonces la parcela queda sembrada de Nabo
- Y le quedan 2 Semillas
- Y gasta 2 de energía
Escenario 2: Elegir entre varias semillas

- Dado que el jugador tiene Semillas y Semillas de calabaza
- Cuando pulsa E junto a una parcela cavada y vacía
- Entonces aparece la lista con “Semilla” y “Semilla de calabaza”
Escenario 3: Sin semillas

- Dado que el jugador no tiene semillas
- Cuando pulsa E junto a una parcela cavada y vacía
- Entonces aparece el mensaje “No tienes semillas”
- Y la parcela no cambia
Escenario 4: Parcela sin cavar

- Dado que el jugador tiene Semillas y no tiene Pala
- Cuando pulsa E junto a una parcela sin cavar
- Entonces aparece el mensaje “Necesitas una Pala”
- Y no se siembra nada
