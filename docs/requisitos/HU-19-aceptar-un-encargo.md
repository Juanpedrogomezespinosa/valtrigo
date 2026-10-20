# HU-19. Aceptar un encargo

# HU-19. Aceptar un encargo

Como jugador, quiero aceptar encargos de los NPC para tener objetivos claros.

Criterios de aceptación:

- Los NPC con encargo ofrecen el encargo en su diálogo con las opciones “Aceptar” y “Rechazar”.
- Al aceptar, el encargo aparece en la lista de objetivos.
- El jugador solo puede tener un encargo activo a la vez.
Escenario 1: Aceptar un encargo

- Dado que el jugador no tiene ningún encargo activo
- Y el NPC ofrece el encargo “Entregar la Carta del alcalde”
- Cuando el jugador pulsa “Aceptar”
- Entonces el encargo aparece en la lista de objetivos
- Y el NPC muestra su diálogo de encargo en curso
Escenario 2: Rechazar un encargo

- Dado que el NPC ofrece el encargo “Entregar la Carta del alcalde”
- Cuando el jugador pulsa “Rechazar”
- Entonces el encargo no aparece en la lista de objetivos
- Y al volver a hablar con el NPC, vuelve a ofrecer el encargo
Escenario 3: Encargo activo en curso

- Dado que el jugador tiene activo el encargo “Entregar la Carta del alcalde”
- Cuando habla con otro NPC que tiene un encargo
- Entonces el NPC muestra el mensaje “Termina tu encargo actual primero”
- Y no ofrece su encargo

