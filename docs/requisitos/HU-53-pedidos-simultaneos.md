# HU-53. Pedidos simultáneos

# HU-53. Pedidos simultáneos

Como jugador, quiero llevar varios pedidos a la vez sin que bloqueen la historia para avanzar en la historia mientras cumplo otros pedidos.

Criterios de aceptación:

- Se pueden tener hasta 3 pedidos del tablón activos a la vez.
- Con 3 pedidos activos, el tablón muestra “Ya tienes 3 pedidos activos” y no deja aceptar otro.
- Los pedidos no tienen fecha límite.
- Los pedidos del tablón no cuentan como encargo activo para los NPC: no impiden aceptar ni completar un encargo principal.
Escenario 1: Pedido y encargo a la vez

- Dado que el jugador tiene activo un pedido del tablón
- Cuando el alcalde le ofrece “Entregar la Carta del alcalde”
- Entonces puede aceptarlo
Escenario 2: Límite de pedidos

- Dado que el jugador tiene 3 pedidos del tablón activos
- Cuando pulsa E junto al tablón un día con pedido nuevo
- Entonces aparece el mensaje “Ya tienes 3 pedidos activos”
- Y no puede aceptar el pedido
Escenario 3: Sin fecha límite

- Dado que el jugador aceptó el pedido del día 1
- Cuando empieza el día 3
- Entonces el pedido sigue activo
