import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  target: 'node20',
  external: ['better-sqlite3', 'pdf-parse'],
  dts: true,
})
