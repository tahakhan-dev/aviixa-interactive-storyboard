import ts from 'typescript'

/**
 * Strips `//` line comments and `/* *\/` block comments (JSDoc and
 * `{/* ... *\/}` JSX comment containers included) before a gate
 * pattern-matches source text.
 *
 * Without this, prose that NAMES a forbidden identifier IN ORDER TO DENY IT
 * matches itself. That is not hypothetical: `src/ui/ScreenStateBoundary.tsx`
 * carries a doc comment stating that no `evaluateAccess`, `ROLES` or
 * `allowedRoles` reference exists in the file -- and that sentence contains
 * every word the raw brief regex forbids, so a gate written against raw
 * source would fail on correct code today.
 *
 * Round 3 (CRITICAL): a hand-rolled tokenizer built for this (two rounds of
 * it -- a regex literal ending `\/\/` once blinded four gates, then `//`
 * inside a plain string/template) was defeated a third time by an ordinary
 * URL in JSX prose: `<p>See https://x for details. Approve.</p>` has a bare
 * `//` that is neither a comment nor inside a string/template/regex -- it's
 * JSX text, a context a linear character-by-character tokenizer has no way
 * to know about without reimplementing JSX grammar too. Rather than add a
 * fourth special case, this now asks the actual TypeScript compiler API
 * (`typescript`, already a project dependency) what is and is not a
 * comment: it parses the source as TSX and asks the AST for every comment
 * range. Everything the parser did NOT classify as a comment -- string and
 * template contents, regex literals, JSX text and attribute values -- is
 * copied through byte-for-byte, because it is never visited as a comment
 * range in the first place. This closes the JSX-text hole structurally
 * (the parser distinguishes JSX text from code by construction) rather than
 * by enumerating the contexts someone happened to think of.
 *
 * Comments can be leading trivia of the next token OR trailing trivia of
 * the previous one (e.g. `const x = 1 // note\nconst y = 2`: TypeScript
 * attaches `// note` to `x`'s statement as trailing, not to `y`'s as
 * leading) -- so both `getLeadingCommentRanges` and `getTrailingCommentRanges`
 * are checked at every token boundary. Walking `getChildren()` (every
 * token, including bare punctuation like the `{`/`}` of a JSX expression
 * container) rather than `forEachChild()` (structural children only)
 * matters for exactly one shape: `{/* comment *\/}` with no expression
 * inside has no child node for `forEachChild` to descend into, so the
 * comment's position is only reachable via the container's own token
 * children.
 */
export function stripComments(src: string): string {
  const sourceFile = ts.createSourceFile('gate-scan.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const ranges: ts.CommentRange[] = []
  const collectAt = (pos: number): void => {
    for (const r of ts.getLeadingCommentRanges(src, pos) ?? []) ranges.push(r)
    for (const r of ts.getTrailingCommentRanges(src, pos) ?? []) ranges.push(r)
  }
  const visit = (node: ts.Node): void => {
    collectAt(node.getFullStart())
    collectAt(node.end)
    for (const child of node.getChildren(sourceFile)) visit(child)
  }
  for (const child of sourceFile.getChildren(sourceFile)) visit(child)
  collectAt(sourceFile.endOfFileToken.getFullStart())

  const seen = new Set<number>()
  const uniqueRanges = ranges
    .filter((r) => (seen.has(r.pos) ? false : (seen.add(r.pos), true)))
    .sort((a, b) => a.pos - b.pos)

  let out = ''
  let cursor = 0
  for (const r of uniqueRanges) {
    if (r.pos < cursor) continue // already covered by an overlapping range
    out += src.slice(cursor, r.pos)
    // Keep newlines inside a stripped comment so nothing downstream of it
    // shifts lines; drop everything else, including any forbidden word
    // the comment names in order to deny it.
    out += src.slice(r.pos, r.end).replace(/[^\n]/g, '')
    cursor = r.end
  }
  out += src.slice(cursor)
  return out
}
