import { describe, it, expect } from 'vitest'
import { isForeignProbe as isForeign, ownProbeDir } from '../probe-paths'
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
const OWN_PROBE_DIR = ownProbeDir()
const isForeignProbe = (entry: string): boolean => isForeign(entry, OWN_PROBE_DIR)

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
// R2-03 removed the one reader of a module-load `SRC` snapshot. Every walk in
// this file is now fresh per call, so a file planted mid-run is seen by the
// gate that plants it — the property the review gate did not have.

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

const MUTATING_IMPORT =
  /from\s+['"]@\/kernel\/reduce['"]|from\s+['"]@\/persistence\/coordinator['"]/

/**
 * THE PREFILTER IS A SPEED FIX AND IT CHANGES NO VERDICT, which is the only
 * kind of speed fix worth making to a gate.
 *
 * MEASURED, AND THE MEASUREMENT IS WHY IT IS HERE. Under CPU oversubscription
 * this file's four cases each ran 4.2s-5.2s against the release project's
 * 5,000 ms default, and `no component imports reduce or commitTransition`
 * TIMED OUT at 5,213 ms — real time far above user time, work unchanged, the
 * scheduler-contention signature. This build's rule for that shape is stated
 * in `vitest.config.ts`: a test slow because it is doing the work gets the
 * headroom; a test slow because it REPEATS itself is made faster. This one
 * repeats itself — four cases, four whole-tree walks, and every `.ts`/`.tsx`
 * file under `src/` and `app/` handed to `stripComments`, which parses with
 * the TypeScript compiler. So it is made faster rather than given time.
 *
 * SOUND, NOT MERELY QUICK. The raw text of a file is a SUPERSET of its
 * comment-stripped text, so a file whose raw text cannot match the pattern
 * cannot match it after stripping either: skipping it cannot hide an
 * offender. Only a file that COULD offend is parsed, and the parse is still
 * what decides — which is what keeps a mention inside a comment from
 * counting, the whole reason `stripComments` is here. The same two-stage
 * shape `slice-04-gates.test.ts`'s `quotedJobOwnerTokens` already ships.
 *
 * The walk itself stays fresh on every call (never cached at module load), so
 * a case that plants a file mid-run still sees it.
 */
function gatewayOnlyOffenders(): string[] {
  const src = walk('src').filter((f) => /\.tsx?$/.test(f))
  const appFiles = walk('app').filter((f) => /\.tsx?$/.test(f))
  return [...src, ...appFiles]
    .filter((f) => f !== GATEWAY_FILE)
    .filter((f) => {
      const raw = readFileSync(f, 'utf8')
      if (!MUTATING_IMPORT.test(raw)) return false
      return MUTATING_IMPORT.test(stripComments(raw))
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

  /**
   * A review action creates a ReviewEvent and nothing else.
   *
   * R2-03. This was `SRC.filter(f => f.includes('src/review/'))` — a population
   * of three files, no floor, and alone among the six gates in this file with no
   * planted-violation companion. It was proved permeable in the round-2 audit:
   * the same violation written under `src/reviews/` gives a population of ZERO
   * and a green pass, and `SRC` is captured at module load so a file planted
   * mid-run was invisible to it anyway.
   *
   * The rule this file already states in BLOCKING 3 above is the fix: walk ALL
   * of `src/` and `app/` and exempt BY NAME, never narrow the walk to a subset
   * of directories. So the population is every authored `.ts`/`.tsx` under both
   * trees whose PATH carries `review` in any segment, case-insensitively —
   * `src/reviews/`, `app/review/`, `src/ui/ReviewCard.tsx` and
   * `SyncConflictReviewPanel.tsx` are all in it, where the old filter saw none
   * of them.
   *
   * THE DECISION, STATED: this population is deliberately wider than the review
   * metadata module. It includes product screens that merely have `review` in
   * their name (`app/hub/execution-summary-review/`), none of which imports the
   * kernel today — measured, 12 files, 0 offenders. If one legitimately needs to,
   * the fix is a name in `EXEMPT` below and a line saying why; a red there is the
   * decision being forced, which is the whole point of a walk-everything gate.
   * Narrowing the walk back to a directory prefix is what this finding was.
   */
  const REVIEW_PATH = /(^|\/)[^/]*review[^/]*(\/|\.tsx?$)/i
  const LEDGER_WRITER = /commitTransition|from\s+['"]@\/kernel\//

  /**
   * By NAME, and asserted to still exist in the population below, so an
   * exemption for a file that has been renamed or deleted turns red instead of
   * standing for ever. Empty today: nothing in the review population needs it.
   */
  const EXEMPT: readonly string[] = []

  /** Walked fresh on every call, so a file planted mid-run is seen. */
  function reviewPopulation(): string[] {
    return [...walk('src'), ...walk('app')].filter(
      (f) => /\.tsx?$/.test(f) && REVIEW_PATH.test(f),
    )
  }

  function ledgerWritingReviewFiles(): string[] {
    return reviewPopulation()
      .filter((f) => !EXEMPT.includes(f))
      .filter((f) => {
        const raw = readFileSync(f, 'utf8')
        // Same two-stage shape as `gatewayOnlyOffenders`: the raw text is a
        // superset of the stripped text, so a file that cannot match raw cannot
        // match stripped, and the parse is still what decides.
        if (!LEDGER_WRITER.test(raw)) return false
        return LEDGER_WRITER.test(stripComments(raw))
      })
  }

  // The floor the finding named. Zero files pass `toEqual([])` for ever, and a
  // rename is all it took. MEASURED on this tree: 12 files across src/review/,
  // app/review/, three hub and super-admin screens and one CC module panel.
  it('reads a review population to police', () => {
    const population = reviewPopulation()
    expect(
      population.length,
      'the review population collapsed. A directory rename is enough to do this, and an empty ' +
        'population reports no ledger writer over no files',
    ).toBeGreaterThanOrEqual(10)
    expect(
      EXEMPT.filter((f) => !population.includes(f)),
      'an exemption naming a file that is no longer in the population. Delete it',
    ).toEqual([])
  })

  it('review modules import no product ledger writer', () => {
    expect(ledgerWritingReviewFiles()).toEqual([])
  })

  // The planted-violation companion the other five gates in this file have and
  // this one did not. Planted under a directory the OLD filter could not see —
  // `src/<probe>/reviews/` — which is the exact permeability the finding
  // demonstrated: this is red now and was green before.
  it('fires on a ledger writer in a review directory this gate does not special-case today', () => {
    const dir = join(PROBE_DIR, 'reviews')
    const probeFile = join(dir, 'store.ts')
    mkdirSync(dir, { recursive: true })
    writeFileSync(probeFile, "import { reduce } from '@/kernel/reduce'\nexport const x = reduce\n")
    try {
      expect(reviewPopulation()).toContain(probeFile)
      expect(ledgerWritingReviewFiles()).toContain(probeFile)
    } finally {
      rmSync(PROBE_DIR, { recursive: true, force: true })
    }
  })

  // And the other half, so the gate is known to read code rather than prose:
  // a comment naming the forbidden import does not convict.
  it('does not fire on a review file whose comment names the forbidden import', () => {
    const dir = join(PROBE_DIR, 'review')
    const probeFile = join(dir, 'records.ts')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      probeFile,
      "// A review action must never import commitTransition from '@/kernel/reduce'.\nexport const x = 1\n",
    )
    try {
      expect(reviewPopulation()).toContain(probeFile)
      expect(ledgerWritingReviewFiles()).not.toContain(probeFile)
    } finally {
      rmSync(PROBE_DIR, { recursive: true, force: true })
    }
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
