---
target: landing TallerOS (home-client.tsx)
total_score: 26
p0_count: 2
p1_count: 1
timestamp: 2026-08-02T18-39-05Z
slug: app-public-home-client-tsx
---
## Design Health Score: 26/40

| # | Heurística | Score | Problema clave |
|---|-----------|-------|----------------|
| 1 | Visibilidad del estado | 2 | El toast de actividad nunca aparece (API 401). Precio parpadea USD→local |
| 2 | Lenguaje del usuario | 4 | Excelente. "¿Cómo va mi carro?", "ya ahorita te confirmo" |
| 3 | Control y libertad | 3 | Navegación por anclas correcta, sin trampas |
| 4 | Consistencia | 2 | La web vende recordatorios/reseñas como Pro; el código los da en Esencial |
| 5 | Prevención de errores | 2 | Registro de 6 campos sin validación inline visible |
| 6 | Reconocer vs recordar | 3 | "Todo lo del plan Esencial" obliga a subir a comparar |
| 7 | Flexibilidad | 3 | Toggle mensual/anual correcto; sin tabla comparativa |
| 8 | Diseño minimalista | 2 | 11 secciones, 14 cards icono+título+texto, 9 kickers repetidos |
| 9 | Recuperación de errores | 2 | Cuando la API falla muestra "+50 talleres" inventado |
| 10 | Ayuda y documentación | 3 | /guia, /demo y WhatsApp de soporte disponibles |

## P0 · La prueba social es falsa y además está rota

- `/api/stats` exige `Bearer CRON_SECRET`; el navegador lo llama sin header → 401.
- Consecuencia: "+N talleres activos" del hero nunca se pinta, el toast nunca sale, y el bloque de prueba social cae al fallback hardcodeado **"+50 talleres ya digitalizaron su operación"**. Realidad: 73 registros, 44 vacíos, ~15 con un cliente, 1 pagando.
- 3 testimonios con nombre, taller, ciudad y métricas concretas ("8 clientes en el primer mes"), imposibles con 1 cliente de pago.
- 4 avatares de "talleres reales" que son imágenes generadas por IA (CDN de Higgsfield).

## P0 · La web y el producto no venden lo mismo

Web: Pro = recordatorios + reseñas + reportes + promociones + usuarios ilimitados.
Código: Esencial ya incluye recordatorios, reseñas e inventario.
Pro real: reportes, promociones, usuarios ilimitados. Dos de los cinco argumentos de Pro ya vienen en el plan de la mitad de precio. Además Inventario (que hoy es de Esencial) no aparece en ningún plan de la web.

## P1 · El cuello de botella no está en la landing

73 registros, ~15 crearon un cliente, 1 paga. La landing convierte a registro; el embudo se rompe después. Optimizar el hero no mueve la aguja: el trabajo está entre el registro y la primera orden.

## P2 · Sobrecarga: 11 secciones antes del precio

Hero, marquee, stats, versus, features (6 cards), módulos (8 cards), galería, testimonios, precios, "5 errores", CTA. Público objetivo: mecánico, en el taller, en móvil. El precio queda a ~8 pantallas de scroll.

## P2 · Doble mensaje: trial de 14 días vs plan gratis

El hero dice "Probar gratis 14 días" y la tabla de precios ofrece un plan "Gratuito" permanente. Son dos promesas distintas en la misma página.

## Anti-patrones

- Hero-metric template: 4 stats grandes con número + label + icono.
- Identical card grids: 6 diferenciadores + 8 módulos, mismo molde.
- Kickers repetidos: 9 etiquetas mayúsculas encima de cada sección.
- Limpio de: gradient text, side-stripes, glassmorphism decorativo.

## Personas

- Jordan (primerizo): no sabe qué pasa después de registrarse; el trial no explica qué se acaba a los 14 días.
- Casey (móvil): 792 líneas con CSS inline, hero con imagen de 895×1200, 11 secciones. Precio a 8 scrolls.
- Riley (stress tester): comprueba que "+50 talleres" no cuadra con nada verificable; busca los testimonios en Google y no existen.
