import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.tsx'],
          setupFiles: ['./tests/setup.ts'],
        },
      },
      {
        // IMPORTANT 2: tests/coverage/**/*.test.ts read out/, which only
        // exists after `pnpm build`. They used to run inside the 'unit'
        // project, which package.json's `verify` ran BEFORE `build` -- so
        // they either hard-failed on a clean clone (no out/ yet) or
        // validated the PREVIOUS build's out/, not the one this run just
        // produced. This project is deliberately excluded from `test:unit`
        // and instead run by `test:release`, which `verify` runs AFTER
        // `build` (see package.json).
        extends: true,
        test: {
          name: 'release',
          environment: 'node',
          include: ['tests/coverage/**/*.test.ts'],
          // Task 13: multiple files in this project plant scratch files
          // (`src/zz-probe/`, `registries/generated/zz-probe.json`,
          // `out/zz-probe.html`, ...) on the REAL shared filesystem to
          // prove a gate can fail, then delete them. With files running in
          // parallel (Vitest's default), a `walk('src')`-style scan in one
          // file can catch another file's probe mid-existence and then
          // ENOENT on a since-deleted path -- reproduced directly:
          // slice-2b-gates.test.ts's src/zz-probe/probe.ts, mid-lifetime,
          // crashed contract-gates.test.ts's readFileSync in a concurrent
          // run. Root-caused, not retried around: these tests are not safe
          // to parallelise against each other at all, so this project runs
          // its files sequentially.
          fileParallelism: false,
        },
      },
    ],
  },
})
