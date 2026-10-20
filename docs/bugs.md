# Bugs - solucionario (TestRail)

# Bugs - solucionario

Catálogo de fallos sembrados en el juego. Documento solo para el profesor: no compartir con el alumnado. Los IDs se usan como referencia en TestRail.

Fáciles: visibles en los primeros minutos

B-01 · Día 1, casa del jugador · HU-07

- Fallo: el personaje atraviesa la mesa del salón.
- Cómo reproducirlo: caminar hacia la mesa desde cualquier lado.
- Severidad: baja.
B-02 · Día 1, puerta de la tienda · HU-08

- Fallo: al entrar en la tienda, el personaje aparece dentro de la pared, no junto a la puerta de salida.
- Cómo reproducirlo: cruzar la puerta de la tienda.
- Severidad: media.
B-03 · Día 4, tienda · HU-17

- Fallo: al comprar una Pala se descuentan 30 monedas, pero la Pala no aparece en el inventario.
- Cómo reproducirlo: comprar una Pala con dinero suficiente y abrir el inventario con I.
- Severidad: alta.
B-04 · Menú principal · HU-05

- Fallo: al pulsar “Salir” y después “No”, el juego se cierra en lugar de volver al menú.
- Cómo reproducirlo: en el menú principal, pulsar “Salir” y elegir “No”.
- Severidad: alta.
Medios: requieren comprobar un valor o un momento

B-05 · Día 4, tienda · HU-18

- Fallo: al vender 3 Semillas (5 monedas cada una) se reciben 10 monedas, no 15.
- Cómo reproducirlo: vender 3 Semillas y revisar el dinero.
- Severidad: media.


B-06 · Día 1 o 2, con el alcalde · HU-20

- Fallo: al entregar la Carta del alcalde se reciben las 50 monedas, pero no la Manzana.
- Cómo reproducirlo: completar el encargo y revisar el inventario.
- Severidad: media.
B-07 · Día 2, granja · HU-23

- Fallo: la pantalla empieza a oscurecerse a las 19:30, no a las 20:00.
- Cómo reproducirlo: esperar en la granja hasta las 19:30 y mirar la pantalla.
- Severidad: baja.
B-08 · Día 7, menú principal · HU-35

- Fallo: falta la licencia de uno de los recursos externos en los créditos.
- Cómo reproducirlo: abrir “Créditos” y revisar la lista de recursos.
- Severidad: baja.
B-09 · Día 5, torre de la relojera · HU-36

- Fallo: el texto de los diálogos de la relojera tiene un contraste de 3:1, por debajo del mínimo de 4,5:1.
- Cómo reproducirlo: hablar con la relojera y medir el contraste con una herramienta.
- Severidad: baja.
Difíciles: solo aparecen con una condición concreta

B-10 · Día 3, orilla del lago · HU-03

- Fallo: al continuar la partida, el personaje aparece dentro del agua.
- Condición: la partida se guardó con el personaje a menos de una casilla de la orilla.
- Severidad: media.
B-11 · Día 3, bosque del lago · HU-06

- Fallo: el personaje se queda atascado en la esquina de un árbol al pulsar dos direcciones a la vez.
- Condición: aparece una de cada tres veces, al rodear la esquina con dos teclas pulsadas.
- Severidad: media.


B-12 · Día 3 o 4, cualquier zona · HU-14

- Fallo: al usar una Manzana con energía entre 90 y 99, se consume pero la energía no sube.
- Condición: energía entre 90 y 99.
- Severidad: media.
B-13 · Día 5, torre de la relojera · HU-12

- Fallo: el cofre 2 se puede volver a abrir si se sale de la torre menos de 1 segundo después de abrirlo.
- Condición: cambiar de zona en menos de 1 segundo tras abrir el cofre.
- Severidad: baja.
B-14 · Día 6, casa del jugador · HU-30

- Fallo: al silenciar, guardar y reanudar desde la pausa, la música vuelve a sonar.
- Condición: guardar desde la pausa con el sonido silenciado.
- Severidad: media.
B-15 · Día 6, casa del jugador · HU-24

- Fallo: al dormir con la energía a 20, la energía sube a 50, no a 100.
- Condición: dormir en la cama con la energía a 20.
- Severidad: media.
Trampas: no son bugs

- La cámara no se mueve dentro de la casa del jugador, porque la zona es más pequeña que la pantalla (HU-09).
- Fuera del horario de la tienda (de 07:00 a 19:00), al caminar hacia la puerta aparece el cuadro “La tienda está cerrada” y no se entra. Si el jugador está dentro cuando cierra, el vendedor dice “La tienda está cerrada” (HU-17).
- Al dormirse a medianoche, el progreso no guardado del día se pierde (HU-24, HU-25).
Caso de prueba de ejemplo: B-03

- Precondición: tienda abierta, 100 monedas, inventario vacío.
- Pasos: comprar una Pala y abrir el inventario con I.
- Resultado esperado: la Pala aparece en el inventario con cantidad 1 y el dinero queda en 70 monedas.
- Resultado real: el dinero queda en 70 monedas, pero la Pala no aparece en el inventario.

