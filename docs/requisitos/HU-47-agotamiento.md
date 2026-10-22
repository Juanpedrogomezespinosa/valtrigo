# HU-47. Agotamiento

# HU-47. Agotamiento

Como jugador, quiero que la energía tenga un límite para que comer y dormir tengan sentido.

Criterios de aceptación:

- La energía no baja de 0.
- Si la energía no alcanza para una acción, aparece el mensaje “Estás demasiado cansado” (o “Estás demasiado cansada”, si el personaje es una mujer, HU-68) y la acción no se hace.
- Sin energía se puede seguir andando, hablando, comprando, vendiendo, comiendo y durmiendo.
Escenario 1: Energía insuficiente

- Dado que la energía es 3
- Cuando el jugador intenta cavar una parcela
- Entonces aparece el mensaje “Estás demasiado cansado”
- Y la parcela no cambia
- Y la energía sigue siendo 3
Escenario 2: Energía justa

- Dado que la energía es 4
- Cuando el jugador cava una parcela
- Entonces la parcela queda cavada
- Y la energía es 0
Escenario 3: Recuperarse comiendo

- Dado que la energía es 0 y el jugador tiene una Manzana
- Cuando usa la Manzana desde el inventario
- Entonces la energía sube
- Y puede volver a trabajar
