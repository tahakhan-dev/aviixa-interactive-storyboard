// Minimal flat ESLint config for the foundation slice. Covers .ts/.tsx with
// typescript-eslint's recommended rule set (parser + rules in one package,
// so `pnpm lint` is a real check rather than a config-not-found failure).
// Later slices may tighten this (type-aware rules, React-specific plugins).
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    // A CONCURRENT process's scratch probe. `eslint .` walks `src/` and `app/`
    // from disk, so it lists a sibling test's probe directory and then ENOENTs
    // on the file inside it the moment that sibling's `finally` removes it --
    // a correct tree failing `pnpm lint` on a race, not on a finding. It is
    // the same class as the test-side walkers, in a tool rather than a test:
    // the category is anything that reads the tree from disk, not anything
    // under `tests/`.
    //
    // The glob keeps the predicate's EXACT-match property, which is
    // load-bearing rather than fussy: a leading dot AND a trailing digit are
    // both required, so a real source file named `zz-probe.tsx` or
    // `.zz-probe.tsx` is still linted. Only a directory this repo's probe
    // convention can actually create is skipped. `tests/probe-paths.ts`
    // carries the full account.
    ignores: [
      'out/**',
      '.next/**',
      'node_modules/**',
      // The knowledge-graph output. It is NOT dot-prefixed, so unlike the probe
      // convention above it does not get `tsc`'s free pass on `.`-segments --
      // `tsconfig.json`'s `include` is an unanchored `**/*.ts`, so the exclude
      // there is what stops a stray `.ts` here entering `pnpm typecheck`. This
      // entry stops `eslint .` walking it at all rather than relying on no
      // config block happening to match `.html`/`.json`/`.md`.
      'graphify-out/**',
      '**/.zz-probe-*[0-9]/**',
      '**/.zz-probe-*[0-9].json',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended],
    rules: {
      // TypeScript's own checker already catches undefined identifiers;
      // no-undef produces false positives against TS-only constructs.
      'no-undef': 'off',
    },
  },
)
