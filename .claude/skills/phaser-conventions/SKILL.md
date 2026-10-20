---
name: phaser-conventions
description: Convenciones de Phaser 3 para escenas, tilemaps, audio y guardado en este proyecto.
---

- Una escena por pantalla. Las escenas se registran en src/main.ts.
- El reloj del juego vive en systems/time.ts; ninguna escena calcula la hora por su cuenta.
- El audio pasa siempre por systems/audio.ts, que aplica los volúmenes guardados.
- El guardado pasa siempre por systems/save.ts, con try/catch por si localStorage no está disponible.
- Los datos (objetos, encargos, diálogos) se leen de src/data/. No se escriben a mano en las escenas.
