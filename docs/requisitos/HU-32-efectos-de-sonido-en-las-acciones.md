# HU-32. Efectos de sonido en las acciones

# HU-32. Efectos de sonido en las acciones

Como jugador, quiero escuchar efectos al andar, recoger objetos y completar encargos para recibir feedback.

Criterios de aceptación:

- Las acciones principales reproducen su efecto de sonido: andar, abrir menús, comprar, vender, abrir cofres y completar encargos.
- Los efectos de sonido se escuchan con el volumen de efectos configurado.
Escenario 1: Andar

- Dado que el personaje está en una zona sin obstáculos
- Cuando el jugador se mueve
- Entonces se reproduce el efecto de pasos
Escenario 2: Comprar

- Dado que el jugador tiene dinero suficiente en la tienda
- Cuando compra un objeto
- Entonces se reproduce el efecto de compra
Escenario 3: Abrir un cofre

- Dado que el jugador está junto a un cofre cerrado
- Cuando lo abre
- Entonces se reproduce el efecto de cofre
Escenario 4: Completar un encargo

- Dado que el jugador completa un encargo
- Cuando aparece el mensaje “Encargo completado”
- Entonces se reproduce el efecto de encargo completado

