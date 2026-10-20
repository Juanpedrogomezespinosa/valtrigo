# HU-33. Cambiar los controles

# HU-33. Cambiar los controles

Como jugador, quiero ver la lista de controles en el menú de opciones para saber qué tecla hace cada cosa.

Criterios de aceptación:

- La pantalla de opciones muestra una tabla con cada acción y su tecla asignada: mover (flechas o WASD), interactuar (E), inventario (I), objetivos (O), pausa (Escape), usar objeto (Enter).
- La tabla es de solo lectura: las teclas no se pueden cambiar.
Escenario 1: Consultar los controles

- Dado que el jugador abre el menú de opciones
- Cuando consulta la sección de controles
- Entonces aparece una tabla con cada acción y su tecla
Escenario 2: Intentar cambiar una tecla

- Dado que la tabla de controles está visible
- Cuando el jugador pulsa sobre la tecla de “Interactuar”
- Entonces no se modifica la tecla asignada
Escenario 3: Contenido completo

- Dado que la tabla de controles está visible
- Cuando el jugador la recorre
- Entonces aparecen las seis acciones de la lista

