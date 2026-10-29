# HU-72. Misiones secundarias

# HU-72. Misiones secundarias

Como jugador, quiero ayudar a los vecinos con pequeñas misiones para ganar dinero y conocer mejor el pueblo.

Criterios de aceptación:

- Los vecinos ofrecen misiones secundarias al hablar con ellos, con las opciones “Aceptar” y “Rechazar”, como los encargos (HU-19). Al rechazar, la volverán a ofrecer la próxima vez.
- Cada misión se ofrece a partir de su día y solo se puede completar una vez.
- Se pueden tener hasta 3 misiones activas a la vez. Son independientes del encargo principal y de los pedidos del tablón (HU-53): ni los bloquean ni se bloquean por ellos.
- Con 3 misiones activas, un vecino que tenga una misión que ofrecer dice “Ya tienes 3 misiones activas” y no la ofrece.
- Si el vecino tiene algo que decir del encargo principal (ofrecerlo, su seguimiento o completarlo), eso va primero: la misión se ofrece la siguiente vez que se hable con él.
- Tipos de misión:
  - Entregar objetos al vecino que la encargó.
  - Llevar un objeto de misión a otro vecino: el objeto se recibe al aceptar (con el aviso de HU-65) y no se puede vender. Si no cabe en el inventario, aparece “Inventario lleno” y la misión no se acepta. La misión se completa al hablar con el destinatario.
  - Dar un recado: se completa al hablar con el vecino indicado.
  - Encontrar a Bigotes: mientras la misión está activa, Bigotes está en la granja, junto al manzano. Al hablar con él vuelve al barrio y la misión se completa al hablar con Pablo.
- Al completar una misión aparece “Misión completada”, se entregan los objetos pedidos y se cobra la recompensa. Si la recompensa no cabe en el inventario, aparece “Inventario lleno” y la misión sigue activa (como HU-20).
- Las recompensas suman a las monedas ganadas del día (HU-39).
- La lista de objetivos (HU-21) tiene un apartado nuevo, “Misiones”, entre “Encargos” y “Notas”: el nombre de cada misión activa, su descripción y “Encargada por: [vecino]”, o “No tienes misiones activas”.
- Las misiones (día, vecino, tipo y recompensa):
  1. Día 1, Marta, “Una carta para Tomás”: llevar la Carta para Tomás a Tomás. 20 monedas.
  2. Día 1, Pablo, “¿Dónde está Bigotes?”: encontrar a Bigotes. 2 Manzanas.
  3. Día 2, Lucía, “Semillas para Lucía”: entregarle 2 Semillas. 1 Semilla de calabaza.
  4. Día 2, Elena, “Manzanas para la tarta”: entregarle 2 Manzanas antes de las 18:00 (HU-74). 30 monedas.
  5. Día 3, Rosa, “Una trucha para Rosa”: entregarle 1 Trucha antes de las 12:00 (HU-74). 40 monedas.
  6. Día 3, Bruno, “Leña para el invierno”: entregarle 3 Leñas. 45 monedas.
  7. Día 3, Fran, “Setas para la cena”: entregarle 3 Setas. 25 monedas.
  8. Día 4, Tomás, “Un recado para el alcalde”: hablar con el alcalde. 20 monedas.
  9. Día 4, Marta, “Paquete urgente”: llevar el Paquete a Bruno antes de las 15:00 (HU-74). 35 monedas.
  10. Día 5, Pablo, “El siluro gigante”: entregarle 1 Siluro. 60 monedas.
  11. Día 5, Lucía, “Zanahorias para Lucía”: entregarle 2 Zanahorias. 50 monedas.
  12. Día 6, Elena, “Mermelada de moras”: entregarle 4 Moras antes de las 13:00 (HU-74). 30 monedas.
Escenario 1: Aceptar una misión

- Dado que es el día 3 y el jugador habla con Bruno
- Cuando elige “Aceptar”
- Entonces “Leña para el invierno” aparece en el apartado “Misiones” de la lista de objetivos
Escenario 2: Completar una misión

- Dado que “Leña para el invierno” está activa y el jugador tiene 3 Leñas y 100 monedas
- Cuando habla con Bruno
- Entonces aparece “Misión completada”
- Y el jugador tiene 145 monedas y ninguna Leña
Escenario 3: Límite de misiones

- Dado que el jugador tiene 3 misiones activas
- Cuando habla con un vecino que tiene una misión que ofrecer
- Entonces el vecino dice “Ya tienes 3 misiones activas”
Escenario 4: Misión y encargo a la vez

- Dado que el encargo principal “Semillas para la cosecha” está activo
- Cuando el jugador acepta “Semillas para Lucía”
- Entonces las dos aparecen en la lista de objetivos
Escenario 5: Llevar un objeto a otro vecino

- Dado que el jugador acepta “Una carta para Tomás”
- Cuando habla con Tomás
- Entonces aparece “Misión completada”
- Y la Carta para Tomás ya no está en el inventario
Escenario 6: Encontrar a Bigotes

- Dado que “¿Dónde está Bigotes?” está activa
- Cuando el jugador habla con Bigotes junto al manzano y después con Pablo
- Entonces aparece “Misión completada”
Escenario 7: Recompensa que no cabe

- Dado que el inventario está lleno y “¿Dónde está Bigotes?” está activa
- Cuando el jugador habla con Bigotes y después con Pablo
- Entonces aparece “Inventario lleno”
- Y la misión sigue activa
