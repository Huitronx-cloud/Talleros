// ── Premisa central de TallerOS ───────────────────────────────────────────────
// El norte de TODO el contenido que generamos automáticamente: artículos de
// blog, scripts de video (corto y largo) y posts de redes. Cada pieza debe, al
// final, servir a esto: que el dueño del taller gane más dinero administrando
// mejor su negocio. El ángulo siempre es el NEGOCIO (dinero, tiempo, control,
// clientes), no la mecánica técnica del carro.
export const PREMISA_TALLEROS =
  'Ayudamos a que los dueños de talleres ganen más dinero administrando mejor su negocio.'

// Bloque listo para anteponer a los prompts de generación de contenido.
export const PREMISA_PROMPT = `PREMISA CENTRAL DE TALLEROS — el norte de todo lo que escribas:
"${PREMISA_TALLEROS}"

Reglas que se derivan de la premisa:
- El objetivo de cada pieza es que el dueño del taller GANE MÁS DINERO ADMINISTRANDO MEJOR su negocio.
- El ángulo siempre es el negocio: dinero, tiempo, control, rentabilidad, clientes y organización — no la reparación técnica del carro.
- Deja siempre algo accionable que el dueño pueda aplicar para administrar mejor y ganar más.

`
