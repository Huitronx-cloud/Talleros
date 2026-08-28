import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    // Mismo alias que tsconfig, para que las pruebas importen igual que la app.
    alias: { '@': resolve(__dirname, '.') },
  },
})
