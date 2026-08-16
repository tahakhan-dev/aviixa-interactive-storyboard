/**
 * Strips `//` line comments and `/* *\/` block comments (JSDoc included)
 * before a gate pattern-matches source text.
 *
 * Without this, prose that NAMES a forbidden identifier IN ORDER TO DENY IT
 * matches itself. That is not hypothetical: `src/ui/ScreenStateBoundary.tsx`
 * carries a doc comment stating that no `evaluateAccess`, `ROLES` or
 * `allowedRoles` reference exists in the file -- and that sentence contains
 * every word the raw brief regex forbids, so a gate written against raw
 * source would fail on correct code today. The frozen source hits the
 * identical trap and solves it the same way: `TEST-COV-111` is deliberately
 * scoped away from prose that names an identifier in order to deny it
 * (source line 4736), "because prose that names the identifier in order to
 * deny it would otherwise match itself." `src/scenario/gateway.ts` hits the
 * same trap for `reduce`/`commitTransition`: its header comment explains why
 * it is the one file allowed to import them, and that explanation names both
 * forbidden identifiers.
 *
 * String and template-literal contents are left untouched -- a `//` or
 * `/*` inside a string is not a comment -- so this is a small hand-rolled
 * tokenizer rather than a strip-anything-after-slash regex.
 *
 * A regex literal is ALSO passed through untouched, and for the same reason
 * strings are -- a `/` inside one is not a comment marker. This matters
 * because a regex literal can contain an escaped slash immediately followed
 * by its own closing slash (e.g. `/https?:\/\//`): read one character at a
 * time with no notion of "inside a regex", the escaped slash's slash plus
 * the closing slash look exactly like an ordinary `//` line-comment start,
 * and the tokenizer would silently discard the rest of the line -- hiding a
 * planted violation or any other code that happened to follow on the same
 * line. Regex-vs-division is genuinely ambiguous in JS without a full
 * parser; this uses the standard lexing heuristic: a bare `/` starts a
 * regex only where an operand -- not an operator's right-hand result -- is
 * expected (after `(`, `,`, `=`, other operators, a value-expecting
 * keyword, or the start of input), never directly after an identifier,
 * number, `)`, `]`, or a just-closed string/template. Good enough for this
 * codebase's own source, which is all this scans.
 *
 * Extracted from `tests/coverage/contract-gates.test.ts` so every gate file
 * imports one implementation rather than duplicating it.
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

export function stripComments(src: string): string {
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
