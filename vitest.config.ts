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
          // Slice 3. Vitest's 5000ms default is sized for small unit tests.
          // This project now runs ~1200 cases, and its heaviest legitimately
          // render large real tables -- the 990-row functions index, the
          // 724-row workflow index, and nineteen module screens walked across
          // four roles and twelve screen states. Under parallel load those
          // crossed 5000ms and went red on timing alone (observed 5.2s-12.3s),
          // which is how a suite teaches people to re-run it instead of
          // reading it.
          //
          // This is a budget, not a blanket: a test slow because it renders
          // 990 real rows is doing the work; a test slow because it
          // re-renders one tree 144 times is badly written, and that one was
          // made fast rather than given more time. If a case ever needs more
          // than this, the case is the problem.
          testTimeout: 30_000,
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
