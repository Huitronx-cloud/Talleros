---
name: TallerOS
description: Software de gestión para talleres mecánicos en Latinoamérica.
colors:
  azul-trabajo: "#2563EB"
  azul-trabajo-hondo: "#1D4ED8"
  azul-claro: "#93C5FD"
  verde-listo: "#22C55E"
  verde-hondo: "#15803D"
  ambar-atencion: "#D97706"
  rojo-alerta: "#EF4444"
  tinta: "#0F172A"
  tinta-media: "#334155"
  tinta-suave: "#64748B"
  tinta-tenue: "#94A3B8"
  papel: "#FFFFFF"
  papel-frio: "#F8FAFC"
  papel-hondo: "#F1F5F9"
  borde: "rgba(15,23,42,0.08)"
  borde-marcado: "rgba(15,23,42,0.12)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(36px, 5.5vw, 68px)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-2.5px"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(31px, 4.6vw, 54px)"
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: "-1.8px"
  numero:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(52px, 7vw, 80px)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-4px"
    fontFeature: "tabular-nums"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "29px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.7px"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "2.5px"
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  full: "999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "64px"
  seccion: "96px"
components:
  boton-primario:
    backgroundColor: "{colors.azul-trabajo}"
    textColor: "{colors.papel}"
    rounded: "{rounded.md}"
    padding: "15px 28px"
    typography: "{typography.label}"
  boton-primario-hover:
    backgroundColor: "{colors.azul-trabajo-hondo}"
    textColor: "{colors.papel}"
  boton-contorno:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "15px 28px"
  tarjeta:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.xl}"
    padding: "36px 32px"
  tarjeta-destacada:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.xl}"
    padding: "36px 32px"
  campo-sobre-oscuro:
    backgroundColor: "#1E293B"
    textColor: "{colors.papel}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  etiqueta-plan:
    backgroundColor: "#DCFCE7"
    textColor: "{colors.verde-hondo}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  chip-modulo:
    backgroundColor: "{colors.papel-frio}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.full}"
    padding: "7px 14px"
---

# Sistema de diseño: TallerOS

## Overview

**El taller ordenado.** Un mecánico pasa el día entre piezas sueltas, notas en una libreta y llamadas a media reparación. TallerOS es lo contrario de eso: cada cosa en su lugar y encontrable a la primera. El diseño no busca impresionar, busca que alguien con las manos ocupadas encuentre lo que necesita sin pensarlo.

De ahí salen las tres reglas que gobiernan todo lo demás: **mucho papel en blanco** (el desorden se combate con aire, no con más elementos), **azul solo donde hay que actuar** (si todo destaca, nada destaca) y **números grandes cuando el número es la respuesta**.

Anti-referencia declarada: los paneles de control saturados de widgets, medidores y gráficas que compiten entre sí. Un taller no necesita un tablero de nave espacial, necesita saber qué coche entrega hoy.

## Colors

Estrategia: **acento contenido**. El blanco domina la superficie, el azul aparece en menos del 10% y siempre significa "aquí se actúa".

| Token | Valor | Uso |
|---|---|---|
| `azul-trabajo` | `#2563EB` | Botones primarios, enlaces, dato destacado. Nunca como fondo de sección |
| `azul-trabajo-hondo` | `#1D4ED8` | Solo el estado hover del anterior |
| `azul-claro` | `#93C5FD` | El "OS" del logo sobre fondo oscuro, y kickers sobre secciones oscuras |
| `verde-listo` | `#22C55E` | Confirmaciones, palomitas de funciones incluidas, WhatsApp |
| `ambar-atencion` | `#D97706` | Plan destacado y avisos que no son errores |
| `rojo-alerta` | `#EF4444` | Solo errores reales y estadísticas de problema |
| `tinta` → `tinta-tenue` | `#0F172A` → `#94A3B8` | Escala de texto: título, cuerpo, secundario, apagado |
| `papel` → `papel-hondo` | `#FFFFFF` → `#F1F5F9` | Superficies: base, sección alterna, hundido |

**Regla de contraste que ya nos costó un error:** `globals.css` fuerza `color: #0F172A !important` en todo `input`, `select` y `textarea`. Cualquier campo sobre fondo oscuro necesita la clase `.input-on-dark`, o el texto sale casi negro sobre negro. La clase cubre `input` y `textarea`; **si algún día se usa un `<select>` sobre fondo oscuro, hay que añadirlo a esa regla**.

Los grises nunca son neutros puros: toda la escala está tintada hacia el azul de marca (familia slate), que es lo que hace que el blanco no se sienta clínico.

## Typography

Dos familias con trabajos distintos:

- **Plus Jakarta Sans** para todo lo que grita: títulos, números, nombres de plan, etiquetas. Pesos 800 y 900, tracking negativo agresivo (hasta `-4px` en los números grandes).
- **Inter** para todo lo que se lee con calma: párrafos, listas, descripciones.

La jerarquía se construye con **escala y peso, no con color**. Un título es grande y pesado; un texto secundario es del mismo color pero más pequeño y ligero. Saltos de al menos 1.25× entre niveles.

Los tamaños son fluidos con `clamp()`, nunca fijos. La escala real que usa el proyecto:

```
display   clamp(36px, 5.5vw, 68px)   titular del hero
número    clamp(52px, 7vw, 80px)     estadísticas, con tabular-nums
headline  clamp(31px, 4.6vw, 54px)   títulos de sección
title     29px                       nombre de plan, encabezado de tarjeta
body      17px / 1.7                 párrafos
label     13px / 800 / +2.5px        kickers en mayúsculas
```

El cuerpo de texto se corta a unos 65 caracteres por línea (`max-width` de 560 a 660px según el bloque). Los kickers en mayúsculas son cortos y esporádicos: uno por sección como mucho.

## Layout

Contenedor máximo de 1280px con 28px de margen lateral, que baja a 16px en teléfono. Las secciones respiran 96px arriba y abajo, 64px en móvil.

El ritmo es deliberadamente irregular: bloques generosos entre secciones, agrupaciones apretadas dentro de cada una. Todo con el mismo padding se lee como plantilla.

Puntos de quiebre reales del proyecto: **1024px** (rejillas de 4 pasan a 2), **900px** (el menú se vuelve hamburguesa, desaparece la columna derecha del hero) y **640px** (todo a una columna, botones a ancho completo, aparece la barra fija de registro abajo).

En teléfono el texto va **centrado** (hero, tarjetas, cabeceras de plan) salvo las listas con palomita, que se quedan a la izquierda porque centrar viñetas rompe la lectura.

## Elevation & Depth

Sistema **de tres niveles, usados con cuentagotas**. La profundidad la lleva sobre todo el color de superficie, no la sombra.

```
--sh-sm   0 1px 3px rgba(15,23,42,.08)   tarjetas en reposo
--sh-md   0 4px 16px rgba(15,23,42,.10)  hover, elementos elevados
--sh-lg   0 16px 48px rgba(15,23,42,.14) barra fija, elementos flotantes
--sh-bl   0 8px 32px rgba(37,99,235,.25) solo botones primarios azules
```

Las sombras son **ambientales, no estructurales**: separan planos, no dibujan cajas. Para agrupar se usa antes un cambio de superficie (`papel` sobre `papel-frio`) o un borde de 1px que una sombra.

Nada de glassmorphism decorativo. Solo hay `backdrop-filter` en la barra de navegación al hacer scroll, que es donde tiene una función real: dejar ver que hay contenido debajo.

## Shapes

Radios generosos y consistentes: **14px** para controles (botones, campos), **20px** para bloques, **28px** para tarjetas grandes, **999px** para chips y etiquetas.

Los bordes son de 1px y translúcidos (`rgba(15,23,42,0.08)`), nunca líneas grises opacas: se apoyan en el fondo en vez de dibujarse encima.

**Prohibido:** franjas de color de más de 1px en el borde izquierdo o derecho como acento. Si algo necesita destacar, se usa fondo tintado, borde completo o un icono, nunca una raya lateral.

Los iconos de plan son SVG dibujados a medida (llave, pistón, turbo) con trazo de 1.8 sobre lienzo de 24. Cualquier icono nuevo del sistema mantiene ese trazo para que conviva con los de Lucide.

## Components

**Botón primario.** Azul sólido, texto blanco, radio 14px, sombra azul propia. Al pasar el ratón oscurece y sube 1px. Es el único elemento con sombra de color en toda la interfaz, y por eso se ve como "el botón".

**Botón contorno.** Transparente con borde. Convive con el primario en el hero, siempre en segundo lugar: nunca dos botones sólidos juntos.

**Tarjeta.** Fondo `papel`, borde de 1px, radio 28px, 36px de aire interior. Se disponen en columna flexible para que el botón quede abajo aunque el contenido sea desigual. **Nunca una tarjeta dentro de otra.**

**Tarjeta de plan.** La destacada se marca con borde azul y una insignia arriba, no con tamaño distinto. El precio va centrado: importe grande, código de moneda pequeño al lado (así `$100,800 COP` ocupa lo mismo que `$24 USD`), y `/mes` en gris.

**Campo de formulario.** Radio 14px, borde de 1px, foco cambiando el color del borde sin anillo exterior. Sobre fondo oscuro, `input-on-dark` es obligatorio.

**Acordeón (preguntas).** Sin caja: separadores de 1px y un `+` que gira 45° al abrir. Nada de flechas que rebotan.

**Barra fija móvil.** Aparece bajo 640px con el botón de registro. El botón flotante de WhatsApp se eleva a 96px para no chocar con ella.

## Do's and Don'ts

**Sí**

- Números grandes cuando el número es la respuesta (63%, $24, 10 órdenes). Con `tabular-nums` para que no bailen.
- Espacio en blanco antes que un separador. Si dos bloques se confunden, primero se separan, después se les pone línea.
- Copy en el idioma del taller: *"ya ahorita te confirmo"*, *"¿Cómo va mi carro?"*. La cercanía es parte del sistema visual.
- Estados vacíos que dicen qué hacer, no solo que no hay nada.
- Verificar cualquier cambio a 390px antes de darlo por bueno: la mayoría entra desde el teléfono.

**No**

- Tarjetas con icono, título y texto repetidas en rejilla. Ya pasó dos veces en la landing y hubo que fusionarlas.
- Cifras inventadas como prueba social. Si el dato no sale de la base, no se pone.
- Cuatro estadísticas metidas en cajas: van sueltas, separadas por líneas finas, con el número como protagonista.
- Animaciones con rebote o elásticas. Curvas exponenciales de salida, y nunca animar propiedades de maquetación.
- Texto degradado ni sombras de colores fuera del botón primario.
- Pantallas de carga a pantalla completa en la web pública: tapan la propuesta de valor y disparan el LCP. Solo en la app instalada.
