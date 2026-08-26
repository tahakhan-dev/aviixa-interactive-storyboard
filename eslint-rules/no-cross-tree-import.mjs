// Local ESLint rule (no new dependency). See task-8-report.md, "Fix round 1"
// for why this exists instead of a longer `no-restricted-imports` pattern
// list or eslint-plugin-import's `no-restricted-paths`.
//
// `no-restricted-imports` matches the import SPECIFIER STRING, so every fix
// expressed there is a guess about how someone will spell a path: relative
// depth (`../demo` vs `../../demo`), alias form (`@/ui/demo/...`), and so
// on -- there is always one more spelling. This rule instead RESOLVES each
// specifier to a real filesystem path (relative to the importing file's own
// directory, or via the `@/*` -> `src/*` tsconfig alias) and checks whether
// that resolved path sits inside a forbidden directory. Depth and alias
// spelling stop mattering because the comparison happens after resolution,
// not on the string.
//
// It also inspects the four ways a module can reach another one: static
// `import`/`export ... from`, dynamic `import()`, and CommonJS `require()`
// -- one AST walk covers all four, which a string-pattern rule cannot do in
// one place.
//
// Known limit (stated, not hidden): this only resolves the CURRENT file's
// own specifiers. A two-hop indirection -- some third file outside both
// guarded trees re-exporting the forbidden module, then imported by the
// guarded file -- is invisible here, because the guarded file's own
// specifier resolves to that innocent third file, not to the forbidden
// directory. Catching that would require whole-module-graph reachability
// analysis, which is out of scope for a single-file AST rule.
// eslint-plugin-import's `no-restricted-paths` has this exact same limit,
// for the exact same reason (it also only inspects each file's own resolved
// imports) -- so this is not a gap the alternative dependency would have
// closed either.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function resolveSpecifier(specifier, fromFile) {
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(fromFile), specifier)
  }
  if (specifier.startsWith('@/')) {
    return path.resolve(ROOT, 'src', specifier.slice(2))
  }
  return null // bare package specifier (react, next/*, ...) -- not this boundary's concern
}

function isUnder(resolved, dirAbs) {
  const rel = path.relative(dirAbs, resolved)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

const rule = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: {
          zones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                forbidden: { type: 'string' },
                message: { type: 'string' },
              },
              required: ['forbidden', 'message'],
              additionalProperties: false,
            },
          },
        },
        required: ['zones'],
        additionalProperties: false,
      },
    ],
    messages: { restricted: '{{message}}' },
  },
  create(context) {
    const { zones } = context.options[0]
    const compiled = zones.map((z) => ({
      dir: path.resolve(ROOT, z.forbidden),
      message: z.message,
    }))
    const filename = context.filename ?? context.getFilename()

    function check(node, specifier) {
      if (typeof specifier !== 'string') return
      const resolved = resolveSpecifier(specifier, filename)
      if (!resolved) return
      for (const zone of compiled) {
        if (isUnder(resolved, zone.dir)) {
          context.report({ node, messageId: 'restricted', data: { message: zone.message } })
          return
        }
      }
    }

    return {
      ImportDeclaration(node) {
        check(node.source, node.source.value)
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node.source, node.source.value)
      },
      ExportAllDeclaration(node) {
        check(node.source, node.source.value)
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') check(node.source, node.source.value)
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments[0]?.type === 'Literal'
        ) {
          check(node.arguments[0], node.arguments[0].value)
        }
      },
    }
  },
}

export default { rules: { 'no-cross-tree-import': rule } }
