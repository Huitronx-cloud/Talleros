#!/usr/bin/env node
/**
 * Falla si TypeScript tiene MÁS errores que la línea base.
 *
 * Por qué no simplemente `tsc --noEmit`: el repo arrastra errores de tipos
 * previos, y `next.config.mjs` tiene `ignoreBuildErrors: true`, así que el
 * despliegue nunca los ha mirado. Exigir cero de golpe significaría o parar
 * todo para arreglarlos, o desactivar la comprobación — y desactivarla es como
 * llegamos aquí.
 *
 * Este script pone un tope: los que hay pueden quedarse, pero no pueden crecer.
 * Cuando se arregle alguno, baja el número de abajo y ya no se puede volver
 * atrás. Es un trinquete, no una amnistía.
 */
import { execSync } from 'node:child_process'

const BASE = 19

let salida = ''
try {
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
} catch (e) {
  salida = `${e.stdout ?? ''}${e.stderr ?? ''}`
}

const errores = salida.split('\n').filter(l => / error TS\d+:/.test(l))
const total = errores.length

if (total > BASE) {
  console.error(`\n✗ TypeScript: ${total} errores, la línea base son ${BASE}.`)
  console.error(`  Este cambio añade ${total - BASE}. Los nuevos deberían estar entre estos:\n`)
  for (const l of errores) console.error(`    ${l}`)
  console.error(`\n  Si de verdad hace falta subir el tope, cámbialo en scripts/tsc-baseline.mjs`)
  console.error(`  y explica en el commit por qué.\n`)
  process.exit(1)
}

if (total < BASE) {
  console.log(`\n✓ TypeScript: ${total} errores, menos que la línea base de ${BASE}.`)
  console.log(`  Baja BASE a ${total} en scripts/tsc-baseline.mjs para que no se pueda volver atrás.\n`)
  process.exit(0)
}

console.log(`✓ TypeScript: ${total} errores, igual que la línea base. Sin regresiones.`)
