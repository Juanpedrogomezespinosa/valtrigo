# HU-76. Energía más exigente

# HU-76. Energía más exigente

Como jugador, quiero que la energía se gaste más deprisa para tener que elegir qué hago cada día, comer o descansar.

Criterios de aceptación:

- Los costes de energía de HU-46 se doblan: cavar 8, sembrar 2, regar 4, cosechar 2, pescar 6 cada vez que se lanza la caña (salvo durante el concurso de pesca, HU-60), talar 10 y recoger setas o moras 2.
- Correr (HU-81) gasta 1 punto de energía por cada 3 segundos que el personaje se desplaza corriendo. Corriendo contra un obstáculo o quieto no gasta.
- Con 10 puntos de energía o menos no se puede correr. Si el jugador estaba corriendo, el personaje pasa a andar y aparece “Estás demasiado cansado para correr” (o “cansada”, HU-68). Al pulsar Mayús con 10 o menos, aparece el mismo mensaje y sigue andando.
- Andar, hablar, abrir cofres, comprar y vender siguen sin gastar energía.
Escenario 1: Cavar cuesta el doble

- Dado que la energía es 50
- Cuando el jugador cava una parcela
- Entonces la energía es 42
Escenario 2: Correr gasta energía

- Dado que la energía es 50 y correr está activado
- Cuando el personaje corre durante 6 segundos sin chocar
- Entonces la energía es 48
Escenario 3: Correr sin moverse no gasta

- Dado que la energía es 50 y correr está activado
- Cuando el personaje está quieto durante 6 segundos
- Entonces la energía sigue en 50
Escenario 4: Demasiado cansado para correr

- Dado que la energía es 11 y el personaje está corriendo
- Cuando la energía baja a 10
- Entonces el personaje pasa a andar
- Y aparece “Estás demasiado cansado para correr”
Escenario 5: Mayús sin energía

- Dado que la energía es 8
- Cuando el jugador pulsa Mayús
- Entonces aparece “Estás demasiado cansado para correr”
- Y el personaje sigue andando
