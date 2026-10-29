# HU-46. Gasto de energía por acción

# HU-46. Gasto de energía por acción

Como jugador, quiero que trabajar me canse para tener que organizar mi día.

Criterios de aceptación:

- Cada acción de trabajo gasta energía: cavar 8, sembrar 2, regar 4, cosechar 2, pescar 6 cada vez que se lanza la caña salvo durante el concurso de pesca (HU-60), talar 10 y recoger setas o moras 2 (costes doblados en HU-76).
- Andar, hablar, abrir cofres, comprar y vender no gastan energía. Correr sí (HU-76).
- La energía en pantalla se actualiza en cuanto se gasta.
Escenario 1: Gastar energía

- Dado que la energía es 50
- Cuando el jugador cava una parcela
- Entonces la energía es 42
Escenario 2: Acciones gratuitas

- Dado que la energía es 50
- Cuando el jugador habla con un NPC y compra una Semilla
- Entonces la energía sigue siendo 50
