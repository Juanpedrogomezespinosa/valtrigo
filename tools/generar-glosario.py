# Genera el glosario visual del juego: docs/glosario/README.md y una imagen por gráfico en docs/glosario/img/.
# Muestra cada gráfico tal y como es en el juego sin fallos, ampliado y con su nombre debajo, para que el
# alumnado pueda compararlo con lo que ve al jugar y reportar los fallos visuales.
#
# Uso: python3 tools/generar-glosario.py (necesita Pillow: pip install Pillow)
#
# Lee los gráficos de public/assets/ y los datos de src/data/, así que hay que volver a ejecutarlo si cambia
# algún gráfico del juego limpio. Las casillas de los mapas salen de las mismas hojas y posiciones que usa
# tools/generar-mapas.mjs.

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'public' / 'assets'
SPRITES = ASSETS / 'sprites'
DATA = ROOT / 'src' / 'data'
OUT = ROOT / 'docs' / 'glosario'
IMG = OUT / 'img'

TILE = 16
SCALE = 4
SHEET_COLUMNS = 12


def load(path):
    return Image.open(path).convert('RGBA')


TOWN = load(ASSETS / 'tilesets' / 'kenney-tiny-town.png')
DUNGEON = load(SPRITES / 'kenney-tiny-dungeon.png')
WATER = load(ASSETS / 'tilesets' / 'agua.png')


def tile(sheet, index):
    x, y = (index % SHEET_COLUMNS) * TILE, (index // SHEET_COLUMNS) * TILE
    return sheet.crop((x, y, x + TILE, y + TILE))


def frame(image, column, row=0, width=TILE, height=TILE):
    return image.crop((column * width, row * height, (column + 1) * width, (row + 1) * height))


def grid(sheet, rows):
    """Une casillas de una hoja en una imagen: una lista de filas de índices (None deja la casilla vacía)."""
    image = Image.new('RGBA', (len(rows[0]) * TILE, len(rows) * TILE))
    for y, row in enumerate(rows):
        for x, index in enumerate(row):
            if index is not None:
                image.alpha_composite(tile(sheet, index), (x * TILE, y * TILE))
    return image


def side_by_side(images, gap=2):
    width = sum(image.width for image in images) + gap * (len(images) - 1)
    height = max(image.height for image in images)
    out = Image.new('RGBA', (width, height))
    x = 0
    for image in images:
        out.alpha_composite(image, (x, height - image.height))
        x += image.width + gap
    return out


def scaled(image, scale=SCALE):
    return image.resize((image.width * scale, image.height * scale), Image.NEAREST)


# Cada sección: título, explicación y lista de (archivo, nombre, imagen).
sections = []


def section(title, note, entries):
    sections.append((title, note, entries))


dialogues = json.loads((DATA / 'dialogues.json').read_text(encoding='utf-8'))
items = json.loads((DATA / 'items.json').read_text(encoding='utf-8'))
recipes = json.loads((DATA / 'recipes.json').read_text(encoding='utf-8'))
upgrades = json.loads((DATA / 'upgrades.json').read_text(encoding='utf-8'))
npcs = dialogues['npcs']

# --- Personajes: las cuatro direcciones (abajo, arriba, izquierda y derecha) de la primera fila de su hoja ---

characters = [
    ('jugador', 'Jugador (aspecto inicial)'),
    ('jugadora', 'Jugadora (hoja base)'),
] + [(npc, data['name']) for npc, data in npcs.items()]

character_entries = []
for sheet_name, name in characters:
    sheet = load(SPRITES / 'personajes' / f'{sheet_name}.png')
    columns = sheet.width // TILE
    character_entries.append((f'personaje-{sheet_name}', name, scaled(side_by_side([frame(sheet, c) for c in range(columns)]))))
section(
    'Personajes',
    'Cada personaje mirando hacia abajo, arriba, izquierda y derecha (Bigotes solo tiene dos dibujos). El jugador y la '
    'jugadora cambian de piel y de pelo según el aspecto elegido al empezar (HU-68); aquí aparecen con el aspecto '
    'inicial y la hoja base.',
    character_entries,
)

section(
    'Retratos',
    'El retrato que aparece en el cuadro de diálogo de cada NPC.',
    [(f'retrato-{npc}', data['name'], scaled(load(SPRITES / 'retratos' / f'{npc}.png'), 3)) for npc, data in npcs.items()],
)

# --- Objetos: el icono del inventario y de la tienda ---

dishes = {recipe['dish'] for recipe in recipes['recipes']}
section(
    'Objetos',
    'El icono de cada objeto en el inventario y en la tienda.',
    [(f'objeto-{item}', data['name'], scaled(load(SPRITES / 'objetos' / f'{item}.png'))) for item, data in items.items() if item not in dishes],
)
section(
    'Platos',
    'Los platos que se cocinan en el fogón (HU-84).',
    [(f'objeto-{item}', items[item]['name'], scaled(load(SPRITES / 'objetos' / f'{item}.png'))) for item in items if item in dishes],
)
section(
    'Mejoras',
    'El icono de cada mejora en la pestaña "Mejoras" de la tienda (HU-85). Reutilizan iconos de objetos.',
    [
        (f'mejora-{upgrade["id"]}', upgrade['name'], scaled(load(SPRITES / 'objetos' / f'{upgrade["icon"].removeprefix("objeto-")}.png')))
        for upgrade in upgrades['upgrades']
    ],
)

# --- Naturaleza ---

section(
    'Naturaleza',
    'Árboles, plantas y agua de las zonas exteriores. Los árboles altos ocupan dos casillas.',
    [
        ('arbol-alto-verde', 'Árbol alto verde', scaled(grid(TOWN, [[4], [16]]))),
        ('arbol-alto-otonal', 'Árbol alto otoñal', scaled(grid(TOWN, [[3], [15]]))),
        ('arbol-pequeno-verde', 'Árbol pequeño verde', scaled(tile(TOWN, 28))),
        ('arbol-pequeno-otonal', 'Árbol pequeño otoñal', scaled(tile(TOWN, 27))),
        ('arbusto', 'Arbusto', scaled(tile(TOWN, 5))),
        ('manzano', 'Manzano (granja)', scaled(load(SPRITES / 'manzano.png'))),
        ('setas', 'Setas (bosque)', scaled(load(SPRITES / 'setas.png'))),
        ('arbusto-moras', 'Arbusto de moras (bosque)', scaled(load(SPRITES / 'arbusto-moras.png'))),
        ('tocon', 'Tronco para talar (bosque)', scaled(load(SPRITES / 'tocon.png'))),
        ('cesped', 'Césped', scaled(side_by_side([tile(TOWN, 0), tile(TOWN, 1), tile(TOWN, 2)]))),
        ('camino', 'Camino de tierra', scaled(grid(TOWN, [[12, 13, 14], [24, 25, 26], [36, 37, 38]]))),
        ('agua', 'Agua del lago (centro, brillo y orilla)', scaled(side_by_side([frame(WATER, 0), frame(WATER, 1), frame(WATER, 2)]))),
    ],
)

# --- Pueblo: edificios y objetos de las zonas exteriores ---

section(
    'Edificios y pueblo',
    'Edificios de la plaza, la granja y el barrio, y lo que hay por las calles.',
    [
        ('casa', 'Casa (del jugador y del barrio)', scaled(grid(TOWN, [[52, 53, 53, 54], [64, 65, 65, 66], [84, 85, 73, 84]]))),
        ('tienda', 'Tienda', scaled(grid(TOWN, [[48, 49, 49, 49, 50], [60, 61, 61, 61, 62], [84, 73, 85, 73, 84]]))),
        ('torre', 'Torre del reloj', scaled(grid(TOWN, [[48, 49, 50], [60, 61, 62], [76, 88, 79], [76, 77, 79], [76, 89, 79]]))),
        ('granero', 'Granero', scaled(grid(TOWN, [[52, 53, 53, 53, 54], [64, 65, 65, 65, 66], [72, 73, 84, 73, 75]]))),
        ('cercado', 'Cercado del granero', scaled(grid(TOWN, [[96, 97, 98], [108, 109, 110], [120, 121, 122]]))),
        ('fuente', 'Fuente de la plaza', scaled(tile(TOWN, 104))),
        ('cartel', 'Cartel', scaled(tile(TOWN, 83))),
        ('tablon', 'Tablón de anuncios', scaled(tile(TOWN, 57))),
    ],
)

# --- Interiores ---

chest = load(SPRITES / 'cofre.png')
bells = load(SPRITES / 'campanas.png')
section(
    'Interiores',
    'Suelos, paredes y muebles de la casa del jugador, la tienda, la torre y las casas del barrio.',
    [
        ('suelo-casa', 'Suelo de casa', scaled(side_by_side([tile(DUNGEON, 48), tile(DUNGEON, 49)]))),
        ('suelo-tienda', 'Suelo de la tienda', scaled(tile(DUNGEON, 0))),
        ('suelo-torre', 'Suelo de la torre', scaled(tile(DUNGEON, 42))),
        ('pared', 'Pared', scaled(grid(DUNGEON, [[37], [40]]))),
        ('puerta', 'Puerta', scaled(tile(DUNGEON, 45))),
        ('estanteria', 'Estantería', scaled(tile(DUNGEON, 63))),
        ('estanteria-ancha', 'Estantería ancha', scaled(tile(DUNGEON, 75))),
        ('mesa', 'Mesa', scaled(tile(DUNGEON, 72))),
        ('silla', 'Silla', scaled(tile(DUNGEON, 73))),
        ('barril', 'Barril', scaled(tile(DUNGEON, 82))),
        ('banco-de-trabajo', 'Banco de trabajo (torre)', scaled(tile(DUNGEON, 74))),
        ('cama', 'Cama', scaled(load(SPRITES / 'cama.png'))),
        ('fogon', 'Fogón', scaled(load(SPRITES / 'fogon.png'))),
        ('cofre', 'Cofre (cerrado y abierto)', scaled(side_by_side([frame(chest, 0), frame(chest, 1)]))),
        ('mecanismo', 'Mecanismo del reloj (torre)', scaled(load(SPRITES / 'mecanismo.png'))),
        ('campanas', 'Campanas (grande, mediana y pequeña)', scaled(side_by_side([frame(bells, c) for c in range(3)]))),
    ],
)

# --- Huerto ---

crops = load(SPRITES / 'cultivos.png')
crop_names = ['Tierra cavada', 'Recién sembrado', 'Brote', 'Creciendo', 'Nabo listo', 'Zanahoria lista', 'Calabaza lista']
section(
    'Huerto',
    'Las fases de una parcela del huerto. Una parcela regada se ve más oscura.',
    [(f'huerto-{index}', name, scaled(frame(crops, index))) for index, name in enumerate(crop_names)],
)

# --- Feria, puzles y misterio ---

slabs = load(SPRITES / 'losas.png')
section(
    'Feria (día 7)',
    'La decoración de la plaza el día de la feria.',
    [
        ('guirnalda', 'Guirnalda', scaled(load(SPRITES / 'guirnalda.png'))),
        ('poste-guirnalda', 'Poste de la guirnalda', scaled(load(SPRITES / 'poste-guirnalda.png'))),
        ('puesto-cosecha', 'Puesto de la cosecha', scaled(load(SPRITES / 'puesto-cosecha.png'))),
        ('puesto-pesca', 'Puesto de pesca', scaled(load(SPRITES / 'puesto-pesca.png'))),
        ('escenario', 'Escenario', scaled(load(SPRITES / 'escenario.png'))),
        ('podio', 'Podio', scaled(load(SPRITES / 'podio.png'))),
    ],
)
section(
    'Puzles y misterio',
    'Los puzles del bosque y de la granja y las páginas del diario.',
    [
        ('losas', 'Losa (apagada y encendida)', scaled(side_by_side([frame(slabs, 0), frame(slabs, 1)]))),
        ('caja', 'Caja', scaled(load(SPRITES / 'caja.png'))),
        ('marca', 'Marca del suelo', scaled(load(SPRITES / 'marca.png'))),
        ('pagina', 'Página del diario', scaled(load(SPRITES / 'pagina.png'))),
    ],
)

# --- Interfaz ---

section(
    'Interfaz',
    'Los iconos de los recuadros de arriba durante la partida.',
    [
        ('icono-sol', 'Sol (de día)', scaled(load(SPRITES / 'iconos' / 'sol.png'))),
        ('icono-luna', 'Luna (de noche)', scaled(load(SPRITES / 'iconos' / 'luna.png'))),
        ('icono-moneda', 'Moneda (dinero)', scaled(load(SPRITES / 'iconos' / 'moneda.png'))),
        ('icono-energia', 'Rayo (energía)', scaled(load(SPRITES / 'iconos' / 'energia.png'))),
    ],
)

# --- Escritura ---

COLUMNS = 4

if IMG.exists():
    shutil.rmtree(IMG)
IMG.mkdir(parents=True)

lines = [
    '# Glosario visual de Valtrigo',
    '',
    'Cada gráfico del juego, tal y como debe verse, con su nombre debajo. Sirve de referencia para detectar fallos '
    'visuales: si algo se ve distinto en el juego (otro color, otro personaje, otra forma), es un fallo que hay que '
    'reportar.',
    '',
    'Las imágenes están ampliadas para que se vean bien; en el juego miden 16×16 píxeles por casilla.',
    '',
    'Archivo generado con `python3 tools/generar-glosario.py`. No lo edites a mano.',
    '',
]
lines += ['## Índice', ''] + [f'- [{title}](#{title.lower().replace(" ", "-").replace("(", "").replace(")", "")})' for title, _, _ in sections] + ['']

for title, note, entries in sections:
    lines += [f'## {title}', '', note, '', '<table>']
    for start in range(0, len(entries), COLUMNS):
        lines.append('<tr>')
        for file, name, image in entries[start : start + COLUMNS]:
            image.save(IMG / f'{file}.png')
            lines.append(f'<td align="center"><img src="img/{file}.png" alt="{name}"><br>{name}</td>')
        lines.append('</tr>')
    lines += ['</table>', '']

(OUT / 'README.md').write_text('\n'.join(lines), encoding='utf-8')
print(f'{OUT / "README.md"}: {sum(len(entries) for _, _, entries in sections)} gráficos')
