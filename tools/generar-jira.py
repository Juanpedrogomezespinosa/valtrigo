"""Genera los CSV para importar las historias en Jira, uno por sprint.

Uso: python3 tools/generar-jira.py

Lee docs/requisitos/HU-*.md y escribe docs/jira/historias-sprint-N.csv:
- El Markdown pasa a wiki markup de Jira (h2., h3., listas con * y **, palabras clave en *negrita*).
- La descripción no repite el título (ya está en "Resumen").
- La columna "Tipo de actividad" es siempre Historia, para que no se importen como Tarea.
- La columna "Etiquetas" lleva sprint-1, sprint-2 o sprint-3 (se asigna a Labels al importar).
- Las filas van en orden inverso (la última historia primero), porque Jira las muestra
  al revés del orden del archivo en la columna To Do.
"""

import csv
import glob
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SPRINTS = {
    1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19, 20, 21, 22, 23, 26, 27, 37, 38, 40, 51, 57, 61, 62, 63, 65, 67, 68],
    2: [12, 13, 14, 15, 16, 17, 18, 24, 25, 39, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 54, 76, 80, 81, 82, 84, 87],
    3: [28, 29, 30, 31, 32, 33, 34, 35, 36, 55, 56, 58, 59, 60, 64, 66, 69, 70, 71, 72, 73, 74, 75, 77, 78, 79, 83, 85, 86],
}

PALABRAS_CLAVE = re.compile(r'^(Dado|Cuando|Entonces|Y)\b')


def escapar(texto: str) -> str:
    # [ ] son enlaces y ! imágenes en el wiki markup de Jira.
    return re.sub(r'([\[\]!{}])', r'\\\1', texto)


def a_wiki(lineas: list[str]) -> tuple[str, str]:
    """Devuelve (descripción, criterios) en wiki markup."""
    descripcion: list[str] = []
    criterios: list[str] = []
    seccion = 'intro'
    for linea in lineas:
        if not linea.strip() or linea.startswith('# '):
            continue
        if linea.strip() == 'Criterios de aceptación:':
            seccion = 'criterios'
            descripcion += ['', 'h2. Criterios de aceptación']
            continue
        m = re.match(r'^Escenario \d+: .*', linea)
        if m:
            if seccion != 'escenarios':
                descripcion += ['', 'h2. Escenarios']
            seccion = 'escenarios'
            descripcion += ['', 'h3. ' + escapar(linea.strip())]
            continue
        m = re.match(r'^(\s*)(-|\d+\.) (.*)$', linea)
        if m:
            sangria, marca, texto = m.groups()
            texto = escapar(texto)
            if seccion == 'escenarios':
                texto = PALABRAS_CLAVE.sub(r'*\1*', texto)
            if sangria:
                prefijo = '*#' if marca[0].isdigit() else '**'
            else:
                prefijo = '#' if marca[0].isdigit() else '*'
            item = f'{prefijo} {texto}'
            descripcion.append(item)
            if seccion == 'criterios':
                criterios.append(item)
            continue
        descripcion.append(escapar(linea.strip()))
    return '\n'.join(descripcion).strip(), '\n'.join(criterios)


def main() -> None:
    historias = {}
    for ruta in glob.glob(os.path.join(RAIZ, 'docs/requisitos/HU-*.md')):
        numero = int(re.search(r'HU-(\d+)', os.path.basename(ruta)).group(1))
        with open(ruta, encoding='utf-8') as f:
            lineas = f.read().splitlines()
        titulo = lineas[0].lstrip('# ').strip()
        historias[numero] = (titulo, *a_wiki(lineas))

    repartidas = sorted(sum(SPRINTS.values(), []))
    assert repartidas == sorted(historias), 'Cada historia tiene que estar en un solo sprint'

    for sprint, numeros in SPRINTS.items():
        ruta = os.path.join(RAIZ, f'docs/jira/historias-sprint-{sprint}.csv')
        with open(ruta, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f, quoting=csv.QUOTE_ALL)
            w.writerow(['ID', 'Tipo de actividad', 'Resumen', 'Descripción', 'Criterios de aceptación', 'Etiquetas'])
            for numero in sorted(numeros, reverse=True):
                titulo, descripcion, criterios = historias[numero]
                w.writerow([f'HU-{numero:02d}', 'Historia', titulo, descripcion, criterios, f'sprint-{sprint}'])
        print(f'{os.path.relpath(ruta, RAIZ)}: {len(numeros)} historias')


if __name__ == '__main__':
    main()
