// Minimal flat ESLint config for the foundation slice. Covers .ts/.tsx with
// typescript-eslint's recommended rule set (parser + rules in one package,
// so `pnpm lint` is a real check rather than a config-not-found failure).
// Later slices may tighten this (type-aware rules, React-specific plugins).
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['out/**', '.next/**', 'node_modules/**'],
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
