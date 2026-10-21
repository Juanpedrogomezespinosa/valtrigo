# HU-66. Ceremonia de la feria

# HU-66. Ceremonia de la feria

Como jugador, quiero una ceremonia al final de la feria para ver quién gana los concursos y escuchar al alcalde.

Criterios de aceptación:

- La ceremonia empieza a las 18:00 del día 7 si el jugador está en la plaza o, si no, en cuanto entra en la plaza ese día. Si el jugador no va antes de que acabe el día, se la pierde.
- Al empezar, el alcalde sube al escenario y los visitantes se colocan delante, como público. El jugador no se puede mover hasta que termina.
- El alcalde anuncia en un cuadro de diálogo los tres primeros del concurso de la cosecha (HU-59) y después los del concurso de pesca (HU-60), llamando al jugador por su nombre (HU-67). Mientras anuncia cada concurso, los tres primeros aparecen en el podio.
- Si el jugador queda entre los tres primeros de un concurso, cobra su premio y aparece el mensaje “Premio: [cantidad] monedas”.
- Después, si el encargo “La feria de Valtrigo” está activo o es el siguiente que toca, el alcalde da su discurso desde el escenario y el encargo se completa (HU-20). Al terminar, aparece el mensaje de final (HU-37).
- La ceremonia solo se celebra una vez.
Escenario 1: Empieza la ceremonia

- Dado que es el día 7 a las 17:59 y el jugador está en la plaza
- Cuando el reloj llega a las 18:00
- Entonces el alcalde está en el escenario
- Y aparece el diálogo de la ceremonia
Escenario 2: Llegar tarde

- Dado que son las 19:00 del día 7 y la ceremonia no se ha celebrado
- Cuando el jugador entra en la plaza
- Entonces empieza la ceremonia
Escenario 3: Podio y premio

- Dado que el jugador presentó una Calabaza de 12 kg al concurso de la cosecha
- Cuando el alcalde anuncia el concurso de la cosecha
- Entonces el jugador aparece en el primer puesto del podio, Lucía en el segundo y Tomás en el tercero
- Y el jugador recibe 100 monedas
Escenario 4: Fuera del podio

- Dado que el mejor pez del jugador en el concurso de pesca mide 30 cm
- Cuando el alcalde anuncia el concurso de pesca
- Entonces el podio es Rosa, Tomás y Pablo
- Y el jugador no recibe premio
Escenario 5: Discurso final

- Dado que el encargo “La feria de Valtrigo” está activo
- Cuando termina el anuncio de los concursos
- Entonces el alcalde da su discurso, aparece el mensaje “Encargo completado”
- Y después aparece el mensaje de final
