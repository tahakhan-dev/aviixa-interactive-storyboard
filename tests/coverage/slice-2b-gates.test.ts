import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments'

/**
 * This file both PLANTS a probe and WALKS the trees other files plant in, so
 * it needs both halves of the race fix `tests/coverage/slice-2c-gates.test.ts`
 * documents in full. Its probe used to be the fixed path `src/zz-probe/`,
 * shared by every concurrent process; it is now per-process and dot-prefixed,
 * and `walk()` skips every OTHER process's probe rather than listing it and
 * then losing the race to its `finally`.
 *
 * EXACT match, never a prefix: a prefix form also hides a real source file
 * named `zz-probe.tsx` from every gate in this file -- a safety gate walkable
 * past by choosing a filename.
 */
const OWN_PROBE_DIR = `.zz-probe-${process.pid}`
const isForeignProbe = (entry: string): boolean =>
  /^\.zz-probe-(?:[a-z0-9-]+-)?\d+$/.test(entry) && entry !== OWN_PROBE_DIR

const PROBE_DIR = join('src', OWN_PROBE_DIR)

// Defend against pid reuse: a stale probe from a killed run that drew this
// pid would otherwise be read as this run's own, and a gate running before
// the first plant would report its leftover violation as real.
rmSync(PROBE_DIR, { recursive: true, force: true })
process.on('exit', () => {
  try {
    rmSync(PROBE_DIR, { recursive: true, force: true })
  } catch {
    // Best-effort: nothing else can run once the process is exiting.
  }
})

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (isForeignProbe(e)) continue
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}
const SRC = walk('src').filter((f) => /\.tsx?$/.test(f))

// Final review BLOCKING 3: this used to be an ALLOWLIST of three directories
// (`src/ui/`, `src/coverage/`, `app/`) rather than an EXEMPTION of the one
// file that is allowed to break the rule. Eleven slices of module screens
// (`src/screens/...`) will add directories this gate never looked at, and it
// protected the three directories in use today only by coincidence of where
// today's code happens to live. Fixed to walk ALL of `src/` and `app/`, and
// exempt `src/scenario/gateway.ts` BY NAME -- the one file whose own header
// comment says it is deliberately the sole exception, never the first of
// many.
//
// Walked fresh on every call (not cached at module load) so a test that
// plants a file mid-run and then checks for it sees it -- proof this is a
// live, recursive walk of the real tree, not a fixed snapshot.
const GATEWAY_FILE = join('src', 'scenario', 'gateway.ts')

function gatewayOnlyOffenders(): string[] {
  const src = walk('src').filter((f) => /\.tsx?$/.test(f))
  const appFiles = walk('app').filter((f) => /\.tsx?$/.test(f))
  return [...src, ...appFiles]
    .filter((f) => f !== GATEWAY_FILE)
    .filter((f) => {
      const s = stripComments(readFileSync(f, 'utf8'))
      return /from\s+['"]@\/kernel\/reduce['"]|from\s+['"]@\/persistence\/coordinator['"]/.test(s)
    })
}

describe('slice 2b gates', () => {
  // Only the gateway may mutate. Walks ALL of `src/` and `app/`; the only
  // exemption is `src/scenario/gateway.ts` by name (see comment above). If a
  // future change needs to widen this gate, widen the exemption list by
  // name, never narrow the walk back down to a subset of directories.
  it('no component imports reduce or commitTransition', () => {
    expect(gatewayOnlyOffenders()).toEqual([])
  })

  // Proof the gate is a walk-everything exemption, not a coincidental
  // allowlist: fires on a violation in a directory that does not exist
  // today, planted fresh and removed immediately after.
  it('fires on a violation in a directory this gate does not special-case today', () => {
    const probeFile = join(PROBE_DIR, 'probe.ts')
    mkdirSync(PROBE_DIR, { recursive: true })
    writeFileSync(probeFile, "import { reduce } from '@/kernel/reduce'\nexport const x = reduce\n")
    try {
      expect(gatewayOnlyOffenders()).toContain(probeFile)
    } finally {
      rmSync(PROBE_DIR, { recursive: true, force: true })
    }
  })

  // Proof the exemption is real: the gateway's own necessary imports of
  // `reduce` and `commitTransition` never trip the gate.
  it('does not fire on the gateway, the one named exception', () => {
    expect(gatewayOnlyOffenders()).not.toContain(GATEWAY_FILE)
  })

  // Proof comment-stripping still applies once the gate walks all of src/:
  // prose naming the forbidden imports (to explain why they are forbidden)
  // must not trip the gate.
  it('does not fire on a comment naming the forbidden imports', () => {
    const probeFile = join(PROBE_DIR, 'probe.ts')
    mkdirSync(PROBE_DIR, { recursive: true })
    writeFileSync(
      probeFile,
      "// This file must never import reduce from '@/kernel/reduce' or commitTransition from '@/persistence/coordinator'.\nexport const x = 1\n",
    )
    try {
      expect(gatewayOnlyOffenders()).not.toContain(probeFile)
    } finally {
      rmSync(PROBE_DIR, { recursive: true, force: true })
    }
  })

  // A review action creates a ReviewEvent and nothing else.
  it('review modules import no product ledger writer', () => {
    const review = SRC.filter((f) => f.includes(`${'src'}/review/`))
    const offenders = review.filter((f) => {
      const s = stripComments(readFileSync(f, 'utf8'))
      return /commitTransition|from\s+['"]@\/kernel\//.test(s)
    })
    expect(offenders).toEqual([])
  })

  // Memory has no export path at V1. Minor (final review): this used to
  // check for `memoryRecords`/`MemoryRecord`, two identifiers that never
  // existed anywhere in this codebase -- a gate that can never fail proves
  // nothing. Rewritten to catch a realistic violation: a `memoryData` field
  // or an import from a future `@/persistence/memory` module, either of
  // which is what an accidental memory-export regression would actually
  // look like given the frozen source's seven data classes (spec §5).
  const MEMORY_VIOLATION_PATTERN = /\bmemoryData\b|@\/persistence\/memory/

  it('the exporter references no memory data class', () => {
    const s = stripComments(readFileSync('src/review/package.ts', 'utf8'))
    expect(s).not.toMatch(MEMORY_VIOLATION_PATTERN)
  })

  it('the memory gate fires on a realistic planted violation', () => {
    const planted =
      "export interface Leak { readonly memoryData?: unknown }\nimport { x } from '@/persistence/memory'"
    expect(planted).toMatch(MEMORY_VIOLATION_PATTERN)
  })

  // I3 (final review): the old check sliced 300 raw characters starting at
  // `REVIEW_STATUSES` and matched the exact literal `'approved'` -- so it
  // missed a double-quoted `"approved"`, a different-case `'Approved'`, the
  // word pushed past the 300-character window by unrelated code growth, and
  // `| 'approved'` added to the `ReviewStatus` TYPE union (which sits BEFORE
  // `REVIEW_STATUSES` in the file, outside the slice entirely). Fixed to
  // scan the WHOLE file, case-insensitively, with no quote requirement --
  // "approved" has no legitimate use anywhere in this module regardless of
  // casing, quoting, or position.
  //
  // Final review, CRITICAL: `/approved/i` -- the exact literal word -- does
  // not guard the invariant it exists for. A button labelled "Approve" (the
  // most likely real-world wording) ships clean past it:
  //   "Approve" / "Approve for release" / "Approval" -> MISSED, "approved" -> caught.
  // Fixed to the morphological root, `/\bapprov/i`, which catches every
  // conjugation (approve/approved/approval/approving/approver) with one
  // pattern, while still permitting this codebase's real "accept"
  // vocabulary ("Accept for client review", "Accepted",
  // "accepted-for-review") -- see the two tests immediately below.
  const APPROVAL_WORD_PATTERN = /\bapprov/i

  // Comment-stripped, not raw: widening the pattern to `/\bapprov/i` (the
  // morphological root, CRITICAL fix above) means the word now has a
  // legitimate use this file's own comments were already relying on --
  // "Deliberately none of these reads as an approval" -- explaining WHY the
  // vocabulary avoids the word is exactly the "prose naming a forbidden
  // term in order to forbid it" trap this project has hit before (MOD-SA-20,
  // ROLES.some(...)); scanning raw source here would now fail on that
  // correct, explanatory comment. The narrower `/approved/i` this replaces
  // never had this problem (no comment here happened to spell out the exact
  // past-tense form), which is why the raw-scan claim below was true then
  // and is not anymore.
  it('review status vocabulary contains no approval word, anywhere in the code, case- and quote-insensitively', () => {
    const s = stripComments(readFileSync('src/review/records.ts', 'utf8'))
    expect(s).not.toMatch(APPROVAL_WORD_PATTERN)
  })

  it('the approval-word gate fires on all four evasions the old 300-char literal-quote check missed', () => {
    const base = readFileSync('src/review/records.ts', 'utf8')
    const doubleQuoted = base.replace("'comment'", '\'comment\', "approved"')
    const differentCase = base.replace("'comment'", "'comment', 'Approved'")
    const pushedPastWindow = base.replace(
      'export const REVIEW_STATUSES: readonly ReviewStatus[] = [',
      `export const REVIEW_STATUSES: readonly ReviewStatus[] = [\n  // ${'x'.repeat(350)}\n`,
    ).replace("'comment',", "'comment', 'approved',")
    const typeUnion = base.replace("'question' | 'comment'", "'question' | 'comment' | 'approved'")

    for (const [name, evasion] of [
      ['double-quoted', doubleQuoted],
      ['different case', differentCase],
      ['pushed past the old 300-char window', pushedPastWindow],
      ['added to the ReviewStatus type union', typeUnion],
    ] as const) {
      expect(evasion, name).toMatch(APPROVAL_WORD_PATTERN)
    }
  })

  // Final review, CRITICAL: the four evasions above all vary quoting,
  // casing, position and location -- but EVERY ONE OF THEM uses the literal
  // string "approved". Not one varies the WORD FORM, so they prove the gate
  // survives every axis except the one that matters: a button labelled
  // "Approve" (the most likely real-world wording) shipped past
  // `/approved/i` clean, reproduced directly --
  //   "Approve"             -> MISSED
  //   "Approve for release" -> MISSED
  //   "Approval"            -> MISSED
  //   "approved"            -> caught
  // Fixed to the morphological root `/\bapprov/i`, which catches every
  // conjugation (approve/approved/approval/approving/approver) with one
  // pattern. This test adds the missing axis: word form, held constant
  // across the SAME four evasion techniques above (so both defect classes
  // stay covered), and separately proves the fix does not turn into a new
  // false-positive trap against the one word this codebase legitimately
  // uses for the same concept, "accept".
  it('the approval-word gate fires on every word form, not just the literal string "approved"', () => {
    for (const wordForm of ['Approve', 'Approve for release', 'Approval', 'Approving', 'Approver']) {
      expect(wordForm, wordForm).toMatch(APPROVAL_WORD_PATTERN)
    }
  })

  it('the approval-word gate still permits this codebase\'s real "accept" vocabulary', () => {
    for (const permitted of ['Accept for client review', 'Accepted', 'accepted-for-review']) {
      expect(permitted, permitted).not.toMatch(APPROVAL_WORD_PATTERN)
    }
  })

  // Final review round 2, MINOR: `stripComments`' regex-vs-division
  // heuristic is now load-bearing for THIS gate too, not just the generic
  // stripComments tests below -- a regex literal ending in an escaped
  // slash once blinded four gates at once by putting the whole tokenizer
  // into line-comment mode. Verified directly against the approval gate
  // itself: a same-line regex literal, a string containing `//`/`/*`, and
  // a template literal (which stripComments deliberately never strips the
  // CONTENTS of -- only actual comments) must all still let a genuine
  // "Approve" on the same source reach the pattern.
  it('the approval gate survives a same-line regex literal ending in an escaped slash', () => {
    const planted = `const _r = /https?:\\/\\//; const label = 'Approve'`
    expect(stripComments(planted)).toMatch(APPROVAL_WORD_PATTERN)
  })

  it('the approval gate is not blinded by a string containing // or /*', () => {
    const planted =
      `const url = 'https://example.com/x /* not a comment */' // a real comment\nconst label = 'Approve'`
    expect(stripComments(planted)).toMatch(APPROVAL_WORD_PATTERN)
  })

  it('the approval gate scans inside a template literal (contents are never stripped, only comments are)', () => {
    expect(stripComments('const label = `Approve this change`')).toMatch(APPROVAL_WORD_PATTERN)
  })

  // CRITICAL (final review round 3): a plain URL in JSX prose -- an
  // ordinary thing to write -- silently disabled this gate. The
  // hand-rolled tokenizer treated any bare `//` as a line-comment start
  // with no notion of "this text is JSX children, not JS", so
  // `<p>See https://x for details. Approve.</p>` had everything from the
  // `//` in the URL to end-of-line discarded, including "Approve". Proven
  // on the exact repro that defeated the old stripper.
  it('the approval gate is not blinded by a URL in ordinary JSX prose', () => {
    const planted = `function X() { return <p>See https://example.com/docs for details. Approve the change.</p> }`
    expect(stripComments(planted)).toMatch(APPROVAL_WORD_PATTERN)
  })

  it('the approval gate strips a JSX comment container ({/* ... */}) but not sibling JSX text', () => {
    const planted = '<div>{/* say never approve here */}<span>Approve this</span></div>'
    const stripped = stripComments(planted)
    expect(stripped).not.toMatch(/never approve/)
    expect(stripped).toMatch(APPROVAL_WORD_PATTERN)
  })
})
