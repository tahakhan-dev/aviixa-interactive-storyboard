// Task 14 follow-up (coordinator-approved, see task-14-report.md
// "Concerns" #1 and eslint.config.mjs's app/layout.tsx block).
//
// Task 8's fix round 2 broadened the demo-import ban from
// `src/ui/product/**` to "every file outside src/ui/demo/**" specifically
// to close a one-hop re-export-barrel evasion: a file outside both trees
// re-exporting `src/ui/demo/...` let a `src/ui/product/**` file reach demo
// code indirectly, through the barrel, without ever naming
// `src/ui/demo` itself.
//
// Task 14 then had to carve `app/layout.tsx` back out of that ban (a
// separate eslint.config.mjs block) because the brief requires it to mount
// `<DemoChrome />` — the one legitimate composition root outside the demo
// tree. That carve-out is exactly the shape of hole fix round 2 closed:
// nothing stops `app/layout.tsx` itself from becoming the barrel next,
// with `export { X } from '@/ui/demo/...'` or a re-exported import.
//
// This rule is the fix scoped to that one hole rather than a re-widening
// of the ban: it allows a plain `import ... from '@/ui/demo/...'` (needed
// to render `<DemoChrome />`) but flags every shape that would make this
// file re-export demo code to anyone importing IT instead — `export ...
// from`, `export * from`, and a demo-imported local name re-exported
// without its own `from` clause (`import { X } from '@/ui/demo/...'` then
// later `export { X }`). Reuses `no-cross-tree-import.mjs`'s own resolved-
// path logic (`resolveSpecifier`/`isUnder`, its case-insensitive-
// filesystem probe included) rather than re-deriving it.
//
// The local-name tracking below is source-order, single-file only — the
// same "one AST walk, no cross-module graph" scope
// `no-cross-tree-import.mjs`'s own header documents as its limit for a
// two-hop barrel. That is enough for this rule's one job: catching
// `app/layout.tsx` itself turning into hop one.
import path from 'node:path'
import { ROOT, resolveSpecifier, isUnder } from './no-cross-tree-import.mjs'

const rule = {
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: { forbidden: { type: 'string' } },
        required: ['forbidden'],
        additionalProperties: false,
      },
    ],
    messages: {
      reexport:
        'This file may import demo chrome to mount it, but may never re-export it -- that would reopen the one-hop barrel evasion the demo boundary closes for every other file (see eslint.config.mjs, the app/layout.tsx block).',
    },
  },
  create(context) {
    const dirAbs = path.resolve(ROOT, context.options[0].forbidden)
    const filename = context.filename ?? context.getFilename()
    // Populated by ImportDeclaration as the file is walked top to bottom;
    // read back by a later ExportNamedDeclaration with no `source` of its
    // own. Source-order dependent by design -- see header.
    const demoLocalNames = new Set()

    function specifierIsDemo(specifier) {
      if (typeof specifier !== 'string') return false
      const resolved = resolveSpecifier(specifier, filename)
      return resolved !== null && isUnder(resolved, dirAbs)
    }

    return {
      ImportDeclaration(node) {
        if (!specifierIsDemo(node.source.value)) return
        for (const spec of node.specifiers) {
          // ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier -- all carry `.local`.
          demoLocalNames.add(spec.local.name)
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          if (specifierIsDemo(node.source.value)) context.report({ node, messageId: 'reexport' })
          return
        }
        for (const spec of node.specifiers ?? []) {
          if (demoLocalNames.has(spec.local.name)) {
            context.report({ node: spec, messageId: 'reexport' })
          }
        }
      },
      ExportAllDeclaration(node) {
        if (specifierIsDemo(node.source.value)) context.report({ node, messageId: 'reexport' })
      },
    }
  },
}

export default { rules: { 'no-demo-reexport': rule } }
