---
name: siembra-bugs
description: Úsala solo cuando se pida introducir un fallo del catálogo docs/bugs.md en el juego.
---

El catálogo de fallos está en docs/bugs.md. Cada bug tiene un ID (B-01, B-02...), el día y lugar donde aparece, la historia que incumple y la condición para reproducirlo.

Para introducir un bug:

1. Lee la entrada del bug en docs/bugs.md y localiza la historia afectada en docs/requisitos/.
2. Haz el cambio mínimo que produzca el fallo descrito. No toques el resto del código.
3. No modifiques ni relajes el test de la historia afectada. Si el test sigue pasando, el bug no está bien sembrado: revisa el cambio.
4. Confirma que el test del escenario afectado falla y que los demás siguen pasando.
5. Haz un commit solo con ese bug, con este formato de mensaje: `B-XX: descripción breve del fallo (HU-YY)`
6. No mezcles varios bugs en un mismo commit.

Si una entrada del catálogo no está clara, pregunta antes de implementarla.
