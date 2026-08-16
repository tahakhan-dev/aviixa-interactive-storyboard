import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}
const SRC = [...walk('src')].filter((f) => /\.tsx?$/.test(f))

/**
 * Strips `//` line comments and `/* *\/` block comments (JSDoc included)
 * before a gate pattern-matches source text.
 *
 * Without this, prose that NAMES a forbidden identifier IN ORDER TO DENY IT
 * matches itself. That is not hypothetical: `src/ui/ScreenStateBoundary.tsx`
 * carries a doc comment stating that no `evaluateAccess`, `ROLES` or
 * `allowedRoles` reference exists in the file -- and that sentence contains
 * every word the raw brief regex forbids, so the gate as originally drafted
 * would fail on correct code today. The frozen source hits the identical
 * trap and solves it the same way: `TEST-COV-111` is deliberately scoped
 * away from prose that names an identifier in order to deny it (source line
 * 4736), "because prose that names the identifier in order to deny it would
 * otherwise match itself."
 *
 * String and template-literal contents are left untouched -- a `//` or
 * `/*` inside a string is not a comment -- so this is a small hand-rolled
 * tokenizer rather than a strip-anything-after-slash regex.
 */
function stripComments(src: string): string {
  let out = ''
  let i = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  let inLineComment = false
  let inBlockComment = false
  while (i < src.length) {
    const c = src[i]
    const c2 = src[i + 1]
    if (inLineComment) {
      if (c === '\n') {
        inLineComment = false
        out += c
      }
      i++
      continue
    }
    if (inBlockComment) {
      if (c === '*' && c2 === '/') {
        inBlockComment = false
        i += 2
        continue
      }
      if (c === '\n') out += c
      i++
      continue
    }
    if (inSingle || inDouble || inTemplate) {
      out += c
      if (c === '\\') {
        out += src[i + 1] ?? ''
        i += 2
        continue
      }
      if ((inSingle && c === "'") || (inDouble && c === '"') || (inTemplate && c === '`')) {
        inSingle = false
        inDouble = false
        inTemplate = false
      }
      i++
      continue
    }
    if (c === '/' && c2 === '/') {
      inLineComment = true
      i += 2
      continue
    }
    if (c === '/' && c2 === '*') {
      inBlockComment = true
      i += 2
      continue
    }
    if (c === "'") {
      inSingle = true
      out += c
      i++
      continue
    }
    if (c === '"') {
      inDouble = true
      out += c
      i++
      continue
    }
    if (c === '`') {
      inTemplate = true
      out += c
      i++
      continue
    }
    out += c
    i++
  }
  return out
}

// Comments stripped once per file, up front, and reused by every gate below
// that pattern-matches source text -- so a comment naming a forbidden term
// in order to forbid it can never trip any of these gates.
const STRIPPED = new Map(SRC.map((f) => [f, stripComments(readFileSync(f, 'utf8'))]))

describe('contract gates', () => {
  // Frozen source, L10238: a blank permission-matrix cell is prohibited,
  // "because a blank cell is an unanswered question that an implementer
  // will answer privately and inconsistently."
  it('declares no permission matrix cell as empty, null or undefined', () => {
    const offenders = SRC.filter((f) => /outcome:\s*(null|undefined|''|"")/.test(STRIPPED.get(f)!))
    expect(offenders).toEqual([])
  })

  // "taking a button off the screen does not stop anyone" -- components hold
  // no policy. Matched against comment-stripped source (see stripComments):
  // raw source would false-fail on ScreenStateBoundary.tsx's own doc comment,
  // which names these identifiers in order to deny them.
  it('keeps permission logic out of components', () => {
    const ui = SRC.filter((f) => f.includes('src/ui/'))
    const offenders = ui.filter((f) =>
      /\ballowedRoles\b|\bevaluateAccess\b|\bROLES\.(some|find|filter)\b/.test(STRIPPED.get(f)!),
    )
    expect(offenders).toEqual([])
  })

  // AC-4830: 'synced' is never a state name anywhere in the product.
  // Comment-stripped for the same reason as above: a comment explaining
  // that 'synced' is forbidden as a state name must not trip this gate.
  it('uses none of the forbidden words as a state name', () => {
    const offenders = SRC.filter((f) =>
      /(state|status)\s*[:=]\s*['"](synced|sent|done)['"]/i.test(STRIPPED.get(f)!),
    )
    expect(offenders).toEqual([])
  })

  // RULING 2: PermissionOutcome is closed at nine, in source order. This is
  // a textual backstop; `src/policy/decision.ts` also carries a compile-time
  // exhaustiveness check that fails to build if the union and
  // PERMISSION_OUTCOMES ever disagree.
  it('exports exactly nine permission outcomes', () => {
    const s = readFileSync('src/policy/decision.ts', 'utf8')
    const block = s.slice(s.indexOf('export type PermissionOutcome'))
    const members = block.slice(0, block.indexOf('\n\n')).match(/\|\s*'[a-zA-Z]+'/g) ?? []
    expect(members).toHaveLength(9)
  })
})
