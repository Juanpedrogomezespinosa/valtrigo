# Valtrigo

Valtrigo es un juego de navegador en 2D, de unas dos horas, inspirado en Stardew Valley y Pokémon. Su objetivo principal no es el juego en sí, sino servir de **banco de pruebas para practicar testing manual de videojuegos**.

El juego se ha desarrollado a partir de historias de usuario y criterios de aceptación, igual que un producto real. Algunos de esos criterios **no se cumplen a propósito**: el juego contiene fallos sembrados y documentados, para que quien lo pruebe pueda diseñar casos de prueba, ejecutarlos y reportar los defectos encontrados.

## Enlaces

- **Juego desplegado:** [enlace al juego]
- **Historias de usuario y criterios de aceptación:** [docs/requisitos/](docs/requisitos/)
- **Casos de prueba:** [docs/casos-de-prueba/](docs/casos-de-prueba/)
- **Catálogo de bugs sembrados:** [docs/bugs.md](docs/bugs.md)

## Qué se puede practicar

- Diseño de casos de prueba a partir de historias de usuario.
- Ejecución de pruebas manuales en un entorno real.
- Reporte de defectos con pasos de reproducción, resultado esperado y resultado real.
- Detección de falsos positivos: el juego incluye comportamientos que parecen errores y que sí cumplen los requisitos.

El catálogo tiene 15 fallos, clasificados en tres niveles de dificultad: fáciles, medios y difíciles. Cada fallo se introdujo en un commit independiente, con su ID en el mensaje, para que el historial sea fácil de seguir.

## Stack

- Phaser 3 con TypeScript y Vite
- Tests end-to-end con Playwright
- Sin backend: el progreso se guarda en el navegador con localStorage

## Cómo ejecutarlo en local

```bash
npm install
npm run dev     # servidor de desarrollo
npm run build   # compilación para publicar en dist/
npm test        # tests end-to-end
```

Los tests de `npm test` describen el comportamiento que indican las historias de usuario. Por eso, mientras existan fallos sembrados, algunos tests fallarán a propósito.

## Estructura del repositorio

- `docs/requisitos/`: historias de usuario y la historia del juego.
- `docs/casos-de-prueba/`: casos de prueba y su ejecución.
- `docs/bugs.md`: catálogo de fallos sembrados, con su ID, historia afectada y condición de reproducción.
- `src/`: código del juego.
- `tests/e2e/`: tests Playwright, uno por historia.

## Autor

Juanpe Gómez · (https://www.linkedin.com/in/juanpedroge/)
