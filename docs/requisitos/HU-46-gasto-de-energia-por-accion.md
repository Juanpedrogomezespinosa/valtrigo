# HU-46. Gasto de energía por acción

# HU-46. Gasto de energía por acción

Como jugador, quiero que trabajar me canse para tener que organizar mi día.

Criterios de aceptación:

- Cada acción de trabajo gasta energía: cavar 4, sembrar 1, regar 2, cosechar 1, pescar 3 cada vez que se lanza la caña salvo durante el concurso de pesca (HU-60), talar 5 y recoger setas o moras 1.
- Andar, hablar, abrir cofres, comprar y vender no gastan energía.
- La energía en pantalla se actualiza en cuanto se gasta.
Escenario 1: Gastar energía

- Dado que la energía es 50
- Cuando el jugador cava una parcela
- Entonces la energía es 46
Escenario 2: Acciones gratuitas

- Dado que la energía es 50
- Cuando el jugador habla con un NPC y compra una Semilla
- Entonces la energía sigue siendo 50
