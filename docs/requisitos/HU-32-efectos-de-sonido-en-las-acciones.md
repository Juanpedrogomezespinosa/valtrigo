# HU-32. Efectos de sonido en las acciones

# HU-32. Efectos de sonido en las acciones

Como jugador, quiero escuchar efectos al andar, recoger objetos y completar encargos para recibir feedback.

Criterios de aceptación:

- Las acciones principales reproducen su efecto de sonido: andar, abrir menús, comprar, vender, abrir cofres y completar encargos.
- Los efectos de sonido se escuchan con el volumen de efectos configurado.
- Al moverse entre las opciones de un menú suena un efecto de navegación.
- Al activar una opción de un menú suena un efecto de confirmación. Las opciones desactivadas no reproducen ningún efecto.
- En los cuadros de diálogo, mientras se escriben las letras suena un efecto breve y, al pulsar E para pasar al siguiente cuadro, suena otro efecto distinto.
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
Escenario 5: Navegar por un menú

- Dado que el menú principal está abierto
- Cuando el jugador pulsa la flecha abajo y la selección cambia de opción
- Entonces se reproduce el efecto de navegación
Escenario 6: Activar una opción

- Dado que el menú principal está abierto con "Opciones" seleccionada
- Cuando el jugador pulsa Enter
- Entonces se reproduce el efecto de confirmación
- Y si la opción seleccionada está desactivada, no se reproduce ningún efecto
Escenario 7: Letras de un diálogo

- Dado que el jugador está junto a un NPC
- Cuando pulsa E y el NPC empieza a hablar
- Entonces, mientras se escriben las letras, suena el efecto de las letras
Escenario 8: Siguiente cuadro de diálogo

- Dado que un NPC está hablando y la línea ya se ha escrito entera
- Cuando el jugador pulsa E para pasar al siguiente cuadro
- Entonces suena el efecto del siguiente cuadro
