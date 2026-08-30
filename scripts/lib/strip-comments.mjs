import ts from 'typescript'

/**
 * Strips `//` line comments and `/* *\/` block comments (JSDoc and
 * `{/* ... *\/}` JSX comment containers included) before a prohibited-
 * pattern scan matches source text.
 *
 * Without this, prose that NAMES a forbidden identifier IN ORDER TO DENY IT
 * matches itself. That is not hypothetical in this project:
 * `app/review/page.tsx` carries a doc comment stating the screen touches
 * neither `fetch` nor `XMLHttpRequest` nor any URL -- a scan run against raw
 * source would be one punctuation change away from convicting the sentence
 * that documents the absence.
 *
 * A hand-rolled tokenizer for this is a known trap (three rounds of it in
 * `tests/coverage/strip-comments.ts`, the last defeated by an ordinary URL
 * in JSX prose: `<p>See https://x for details.</p>` has a bare `//` that is
 * neither a comment nor inside a string/template/regex). This asks the
 * actual TypeScript compiler API what is and is not a comment and copies
 * everything else through byte-for-byte, so string/template contents, regex
 * literals, and JSX text are never at risk of being misread as comments in
 * the first place.
 *
 * Ported (not imported) from `tests/coverage/strip-comments.ts`: that file
 * is deleted along with the rest of `tests/` per APP-020, and this project's
 * compile-level scans (`scripts/scan-no-external-network.mjs` and any that
 * follow it) have to keep working after that deletion, so they carry their
 * own copy rather than depending on a suite file that will not be there.
 */
export function stripComments(src) {
  const sourceFile = ts.createSourceFile('gate-scan.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const ranges = []
  const collectAt = (pos) => {
    for (const r of ts.getLeadingCommentRanges(src, pos) ?? []) ranges.push(r)
    for (const r of ts.getTrailingCommentRanges(src, pos) ?? []) ranges.push(r)
  }
  const visit = (node) => {
    collectAt(node.getFullStart())
    collectAt(node.end)
    for (const child of node.getChildren(sourceFile)) visit(child)
  }
  for (const child of sourceFile.getChildren(sourceFile)) visit(child)
  collectAt(sourceFile.endOfFileToken.getFullStart())

  const seen = new Set()
  const uniqueRanges = ranges
    .filter((r) => (seen.has(r.pos) ? false : (seen.add(r.pos), true)))
    .sort((a, b) => a.pos - b.pos)

  let out = ''
  let cursor = 0
  for (const r of uniqueRanges) {
    if (r.pos < cursor) continue // already covered by an overlapping range
    out += src.slice(cursor, r.pos)
    // Keep newlines inside a stripped comment so nothing downstream of it
    // shifts lines; drop everything else, including any forbidden word the
    // comment names in order to deny it.
    out += src.slice(r.pos, r.end).replace(/[^\n]/g, '')
    cursor = r.end
  }
  out += src.slice(cursor)
  return out
}
