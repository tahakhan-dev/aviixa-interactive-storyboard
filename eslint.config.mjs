// Minimal flat ESLint config for the foundation slice. Covers .ts/.tsx with
// typescript-eslint's recommended rule set (parser + rules in one package,
// so `pnpm lint` is a real check rather than a config-not-found failure).
// Later slices may tighten this (type-aware rules, React-specific plugins).
import tseslint from 'typescript-eslint'
import crossTreeImport from './eslint-rules/no-cross-tree-import.mjs'

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
  {
    // Master prompt §12.6: business truth reaches a component only through
    // src/data/repository.ts, so swapping the JSON database for a real API
    // later changes one layer rather than every screen. Files inside
    // src/data/** are exempt so boot.ts can load the seed collections.
    //
    // `local/no-cross-tree-import` (eslint-rules/no-cross-tree-import.mjs)
    // resolves each import specifier to a real filesystem path before
    // checking it against the forbidden directory, rather than matching on
    // the specifier string the way `no-restricted-imports` does. That is
    // fix round 1: a `no-restricted-imports` pattern list is depth- and
    // spelling-dependent (round-1 review found a same-rule nested-path gap
    // and three further string-level evasions); a resolved-path check is
    // not, and it catches static import/export-from, dynamic import(), and
    // require() in one place. See the rule file's header for what it still
    // cannot see (a two-hop re-export barrel) and why.
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/data/**'],
    plugins: { local: crossTreeImport },
    rules: {
      'local/no-cross-tree-import': ['error', {
        zones: [{
          forbidden: 'src/data/collections',
          message: 'Business truth reaches components only through src/data/repository.ts — master prompt §12.6.',
        }],
      }],
    },
  },
  {
    // Master prompt §8.6.2: a screenshot of a product screen with demo
    // chrome hidden must be indistinguishable from the real product. That
    // is only checkable if src/ui/product/** cannot reach src/ui/demo/**
    // at all. The reverse direction (demo importing product) is allowed —
    // chrome legitimately renders product components.
    //
    // This block MUST come after (and repeat) the collections restriction
    // above: flat ESLint config does not merge a rule's options array
    // across matching blocks for the same file — the last matching block
    // replaces the rule's options entirely (this is the merge-ordering bug
    // found in the first review round; it applies to any rule name, not
    // just `no-restricted-imports`). Since the collections block's
    // `files: ['**/*.{ts,tsx}']` also matches src/ui/product/**, a
    // demo-only zone in an earlier/separate block would be silently
    // overwritten. Both zones are combined here so product files carry
    // both restrictions.
    files: ['src/ui/product/**/*.{ts,tsx}'],
    plugins: { local: crossTreeImport },
    rules: {
      'local/no-cross-tree-import': ['error', {
        zones: [
          {
            forbidden: 'src/ui/demo',
            message: 'src/ui/product must never import demo chrome — master prompt §8.6.2 depends on this edge.',
          },
          {
            forbidden: 'src/data/collections',
            message: 'Business truth reaches components only through src/data/repository.ts — master prompt §12.6.',
          },
        ],
      }],
    },
  },
)
