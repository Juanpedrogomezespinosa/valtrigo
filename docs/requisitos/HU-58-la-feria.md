# HU-58. La feria

# HU-58. La feria

Como jugador, quiero que el pueblo celebre la feria para sentir que mi trabajo ha servido.

Criterios de aceptación:

- La feria se celebra en la plaza durante todo el día 7.
- Durante la feria, la plaza tiene guirnaldas y dos puestos: el de la cosecha (HU-59) y el de pesca (HU-60).
- Antes y después del día 7, la plaza tiene su aspecto normal y no hay puestos.
- Pasado el día 7, el encargo “La feria de Valtrigo” se puede seguir completando al hablar con el alcalde, aunque ya no haya feria.
Escenario 1: Día de feria

- Dado que es el día 7
- Cuando el jugador entra en la plaza
- Entonces la plaza tiene guirnaldas
- Y están los puestos de la cosecha y de pesca
Escenario 2: Antes de la feria

- Dado que es el día 6
- Cuando el jugador entra en la plaza
- Entonces no hay guirnaldas ni puestos
Escenario 3: Después de la feria

- Dado que es el día 8
- Cuando el jugador entra en la plaza
- Entonces no hay guirnaldas ni puestos
Escenario 4: Encargo final después de la feria

- Dado que es el día 8 y el encargo “La feria de Valtrigo” está activo
- Cuando el jugador habla con el alcalde
- Entonces aparece el mensaje “Encargo completado”
