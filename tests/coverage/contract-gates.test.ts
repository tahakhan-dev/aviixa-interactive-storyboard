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
 *
 * BLOCKING 6: a regex literal is ALSO passed through untouched, and for the
 * same reason strings are -- a `/` inside one is not a comment marker. This
 * matters because a regex literal can contain an escaped slash immediately
 * followed by its own closing slash (e.g. `/https?:\/\//`): read one
 * character at a time with no notion of "inside a regex", the escaped
 * slash's slash plus the closing slash look exactly like an ordinary `//`
 * line-comment start, and the tokenizer would silently discard the rest of
 * the line -- hiding a planted violation or any other code that happened to
 * follow on the same line. Regex-vs-division is genuinely ambiguous in JS
 * without a full parser; this uses the standard lexing heuristic: a bare
 * `/` starts a regex only where an operand -- not an operator's right-hand
 * result -- is expected (after `(`, `,`, `=`, other operators, a
 * value-expecting keyword, or the start of input), never directly after an
 * identifier, number, `)`, `]`, or a just-closed string/template. Good
 * enough for this codebase's own source, which is all this scans.
 */
const REGEX_CONTEXT_PUNCT = new Set([
  '(', '[', '{', ',', ';', ':', '=', '!', '&', '|', '?', '+', '-', '*', '%', '^', '~', '<', '>',
])
const REGEX_CONTEXT_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'else', 'do', 'yield', 'await', 'default',
])

/** The trailing token in `out` so far: a word (identifier/keyword), a single
 * punctuation character, `'STR'` for a just-closed string/template, or `''`
 * at the start of input. Used only to decide whether a bare `/` opens a
 * regex literal or is a division operator. */
function trailingToken(out: string): string {
  let end = out.length
  while (end > 0 && /\s/.test(out[end - 1]!)) end--
  if (end === 0) return ''
  const last = out[end - 1]!
  if (/[A-Za-z0-9_$]/.test(last)) {
    let start = end
    while (start > 0 && /[A-Za-z0-9_$]/.test(out[start - 1]!)) start--
    return out.slice(start, end)
  }
  if (last === "'" || last === '"' || last === '`') return 'STR'
  return last
}

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
    if (c === '/') {
      const tok = trailingToken(out)
      const regexContext = tok === '' || REGEX_CONTEXT_PUNCT.has(tok) || REGEX_CONTEXT_KEYWORDS.has(tok)
      if (regexContext) {
        let j = i + 1
        let inClass = false
        let closed = false
        while (j < src.length) {
          const cj = src[j]
          if (cj === '\n') break
          if (cj === '\\') {
            j += 2
            continue
          }
          if (cj === '[') {
            inClass = true
            j++
            continue
          }
          if (cj === ']') {
            inClass = false
            j++
            continue
          }
          if (cj === '/' && !inClass) {
            j++
            closed = true
            break
          }
          j++
        }
        if (closed) {
          let k = j
          while (k < src.length && /[a-zA-Z]/.test(src[k]!)) k++
          out += src.slice(i, k)
          i = k
          continue
        }
        // Unterminated on this line (or genuinely not a regex) -- fall
        // through and treat the '/' as an ordinary character below.
      }
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

/**
 * BLOCKING 4(d): a component may hold the TYPE shape of a decision (it
 * renders one it was handed) but must never import a VALUE from the policy
 * module -- `evaluateAccess`, `deny`, `ROLES`, or anything else that could
 * let it compute its own permission instead of receiving one. The narrower
 * check this replaces matched three specific identifier names, which is
 * exactly the shape of gate that a differently-named policy export slips
 * past; this instead forbids importing ANY value from `@/policy` at all
 * under `src/ui/`, so the rule can't be out-grown by a rename. A
 * whole-statement `import type { ... } from '@/policy/...'` is still legal
 * -- it is erased at compile time and carries no runtime value.
 */
function hasPolicyValueImport(strippedSrc: string): boolean {
  // The capture between `import` and `from` must not itself contain another
  // `import` (or `export`) keyword -- this codebase writes imports without
  // semicolons, so a naive `[^;]*?` non-greedy capture starting at the
  // file's FIRST import statement happily stretches across every later
  // import too, hunting for the nearest `from '@/policy...'` anywhere below
  // -- silently misclassifying a real value import as type-only because the
  // captured (multi-statement) text happened to START with "type" from an
  // unrelated, earlier, genuinely type-only import.
  const re = /import\s+((?:(?!\bimport\b|\bexport\b)[^])*?)\s+from\s+['"]@\/policy(?:\/[^'"]*)?['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(strippedSrc))) {
    const specifier = (m[1] ?? '').trim()
    if (!/^type\b/.test(specifier)) return true
  }
  return false
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
    const offenders = ui.filter((f) => {
      const stripped = STRIPPED.get(f)!
      return (
        /\ballowedRoles\b|\bevaluateAccess\b|\bROLES\.(some|find|filter)\b/.test(stripped) ||
        hasPolicyValueImport(stripped)
      )
    })
    expect(offenders).toEqual([])
  })

  // BLOCKING 4(d): the widened check proven directly, independent of
  // whatever src/ui currently contains.
  describe('hasPolicyValueImport', () => {
    it('flags a value import from @/policy, even one mixed with a type specifier', () => {
      expect(
        hasPolicyValueImport(`import { deny, type PermissionDecision } from '@/policy/decision'`),
      ).toBe(true)
    })

    it('does not flag a whole-statement type-only import from @/policy', () => {
      expect(hasPolicyValueImport(`import type { PermissionDecision } from '@/policy/decision'`)).toBe(false)
    })

    it('does not flag an import unrelated to @/policy', () => {
      expect(hasPolicyValueImport(`import { useState } from 'react'`)).toBe(false)
    })
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
  //
  // MINOR fix: reads STRIPPED (comment-free) source, not the raw file, and
  // ends the union at the first line that is neither blank nor a `|` member
  // -- not at "the first blank line". Raw source ended the union at the
  // first blank line, so a comment containing a stray `| 'x'` before that
  // point would have been counted as a member, and a multi-line comment
  // INSIDE the union (which strips to a blank line) would have ended the
  // scan early and undercounted.
  it('exports exactly nine permission outcomes', () => {
    const stripped = STRIPPED.get('src/policy/decision.ts')!
    const block = stripped.slice(stripped.indexOf('export type PermissionOutcome'))
    const lines = block.split('\n').slice(1)
    const memberLines: string[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '') continue
      if (!trimmed.startsWith('|')) break
      memberLines.push(trimmed)
    }
    const members = memberLines.filter((l) => /^\|\s*'[a-zA-Z]+'/.test(l))
    expect(members).toHaveLength(9)
  })
})

describe('stripComments', () => {
  // BLOCKING 6: a regex literal ending in `\/\/` (an escaped slash directly
  // followed by the regex's own closing slash) put the naive tokenizer into
  // line-comment mode -- it had no concept of a regex literal at all, so it
  // read the escaped-slash's slash and the closing slash as an ordinary `//`
  // comment start and discarded the rest of the line. Proven with the exact
  // planted violation: a URL-matching regex on one statement, followed on
  // the SAME line by a planted blank permission-matrix cell that every gate
  // must still be able to see.
  it('does not swallow code after a regex literal ending in an escaped slash', () => {
    const planted = `const _r = /https?:\\/\\//; const _p3 = { outcome: null }`
    const stripped = stripComments(planted)
    expect(stripped).toContain("outcome: null")
  })

  it('leaves the regex literal itself intact in the stripped output', () => {
    const planted = `const _r = /https?:\\/\\//;`
    const stripped = stripComments(planted)
    expect(stripped).toBe(planted)
  })

  it('still recognises a genuine // line comment as a comment', () => {
    const src = `const x = 1 // this is a real comment about ${'evaluateAccess'}\nconst y = 2`
    const stripped = stripComments(src)
    expect(stripped).not.toContain('evaluateAccess')
    expect(stripped).toContain('const y = 2')
  })

  // Re-prove everything the stripper already did correctly, so the regex
  // handling above cannot have broken any of it.
  it('still strips a // comment naming a forbidden identifier in order to deny it', () => {
    const src = `// no evaluateAccess, ROLES or allowedRoles reference exists here\nconst ok = true`
    const stripped = stripComments(src)
    expect(stripped).not.toContain('evaluateAccess')
    expect(stripped).toContain('const ok = true')
  })

  it('still strips a /* */ block comment and a JSDoc comment', () => {
    const src = `/* evaluateAccess appears only in prose here */\n/**\n * ROLES.some appears only in prose here\n */\nconst ok = true`
    const stripped = stripComments(src)
    expect(stripped).not.toContain('evaluateAccess')
    expect(stripped).not.toContain('ROLES.some')
    expect(stripped).toContain('const ok = true')
  })

  it('still leaves a string or template literal containing // (e.g. a URL) untouched', () => {
    const src = `const url = 'https://example.com/x' // real comment\nconst tpl = \`https://example.com/y\``
    const stripped = stripComments(src)
    expect(stripped).toContain("const url = 'https://example.com/x'")
    expect(stripped).toContain('const tpl = `https://example.com/y`')
    expect(stripped).not.toContain('real comment')
  })

  it('still handles an apostrophe inside a // comment without corrupting string-state tracking', () => {
    const src = `// don't treat this apostrophe as opening a string\nconst z = 'still a real string'`
    const stripped = stripComments(src)
    expect(stripped).not.toContain("don't")
    expect(stripped).toContain("const z = 'still a real string'")
  })

  // A violation on the SAME LINE as a regex literal, after the regex, must
  // still be caught -- this is the actual gate-blindness scenario, driven
  // through the real gate 1 regex rather than just the stripper.
  it('gate 1 (blank permission-matrix cell) still catches a violation planted after a same-line regex literal', () => {
    const planted = `const _r = /https?:\\/\\//; const _p3 = { outcome: null }`
    const stripped = stripComments(planted)
    expect(/outcome:\s*(null|undefined|''|"")/.test(stripped)).toBe(true)
  })
})
