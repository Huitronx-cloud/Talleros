# Procedencia

Esta skill **no es nuestra**. Viene de [obra/superpowers](https://github.com/obra/superpowers),
licencia MIT, copyright 2025 Jesse Vincent. El texto de la licencia está en
`LICENSE`, junto a este archivo.

## Qué se copió

Solo los seis archivos que la skill usa de verdad:

- `SKILL.md`
- `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`
- `condition-based-waiting-example.ts`, `find-polluter.sh`

Se dejaron fuera `CREATION-LOG.md`, `test-academic.md` y `test-pressure-1/2/3.md`:
son material de autoría y evaluación de la propia skill, no la skill.

## Qué se modificó

`SKILL.md` referenciaba dos skills de superpowers que aquí no existen, y una
referencia rota es peor que ninguna:

1. `superpowers:test-driven-development` → sustituida por la instrucción que sí
   aplica en este repositorio, que **no tiene framework de tests**: reproducir el
   fallo con un script de un solo uso.
2. `superpowers:verification-before-completion` → apunta ahora a la skill del
   mismo nombre que vive en `.claude/skills/`, sin el prefijo de namespace.

## Cómo actualizarla

No hay nada automático. Si quieres una versión nueva, clona el repositorio de
origen y vuelve a copiar los seis archivos, reaplicando las dos modificaciones
de arriba.
