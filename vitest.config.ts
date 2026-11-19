import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Vitest reads tsconfig for types but not for `paths`, so the `@/` alias the app
 * imports through has to be repeated here. Without it any module that uses the
 * alias is untestable, which quietly pushes tests towards the modules that
 * happen not to.
 */
export default defineConfig({
  // tsconfig says `jsx: "preserve"` because Next compiles the app; vitest
  // compiles the file itself, so it needs to be told which JSX runtime to use
  // or a .tsx test fails with "React is not defined".
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
