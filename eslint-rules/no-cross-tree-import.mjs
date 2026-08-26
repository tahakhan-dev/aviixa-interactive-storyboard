// Local ESLint rule (no new dependency). See task-8-report.md, "Fix round 1"
// and "Fix round 2" for why this exists instead of a longer
// `no-restricted-imports` pattern list or eslint-plugin-import's
// `no-restricted-paths`.
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
// It also inspects every way a module can reach another one: static
// `import`/`export ... from` (including `export * from` and type-only
// `import type`/`export type` forms -- TS strips these at compile time, but
// a type-only import still leaks the demo tree's *types* into product
// signatures, which is the coupling §8.6.2 exists to prevent, so they are
// deliberately not exempted), dynamic `import()`, and CommonJS `require()`
// -- one AST walk covers all of these, which a string-pattern rule cannot
// do in one place.
//
// Case sensitivity (fix round 2): `path.relative`/`path.resolve` are pure
// string operations and do not know whether the underlying filesystem
// treats `Demo/` and `demo/` as the same directory. macOS (this team's
// platform) and Windows default to case-INsensitive filesystems, where
// `@/ui/Demo/DemoChrome` resolves to the exact same file as
// `@/ui/demo/DemoChrome` and must be caught; Linux is case-sensitive by
// default, where they are genuinely different directories and conflating
// them could wrongly block a legitimate import. Rather than assume from
// `process.platform` (a mounted case-sensitive APFS volume on macOS, or a
// case-sensitive bind mount on Windows, would make that assumption wrong),
// this probes the ACTUAL filesystem once at module load: does this very
// file resolve under an upper-cased and a lower-cased version of its own
// path? Only if both do is the comparison lower-cased; otherwise it stays
// exact, so Linux keeps `Demo/` and `demo/` distinct.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const THIS_FILE = fileURLToPath(import.meta.url)
const CASE_INSENSITIVE_FS = (() => {
  try {
    return fs.existsSync(THIS_FILE.toUpperCase()) && fs.existsSync(THIS_FILE.toLowerCase())
  } catch {
    return false
  }
})()

function resolveSpecifier(specifier, fromFile) {
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(fromFile), specifier)
  }
  if (specifier.startsWith('@/')) {
    return path.resolve(ROOT, 'src', specifier.slice(2))
  }
  return null // bare package specifier, node: builtin, URL-shaped specifier -- not this boundary's concern
}

function normalize(p) {
  return CASE_INSENSITIVE_FS ? p.toLowerCase() : p
}

function isUnder(resolved, dirAbs) {
  const rel = path.relative(normalize(dirAbs), normalize(resolved))
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
