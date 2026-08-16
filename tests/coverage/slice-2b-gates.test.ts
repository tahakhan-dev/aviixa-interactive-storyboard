import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments'

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
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
    const probeDir = join('src', 'zz-probe')
    const probeFile = join(probeDir, 'probe.ts')
    mkdirSync(probeDir, { recursive: true })
    writeFileSync(probeFile, "import { reduce } from '@/kernel/reduce'\nexport const x = reduce\n")
    try {
      expect(gatewayOnlyOffenders()).toContain(probeFile)
    } finally {
      rmSync(probeDir, { recursive: true, force: true })
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
    const probeDir = join('src', 'zz-probe')
    const probeFile = join(probeDir, 'probe.ts')
    mkdirSync(probeDir, { recursive: true })
    writeFileSync(
      probeFile,
      "// This file must never import reduce from '@/kernel/reduce' or commitTransition from '@/persistence/coordinator'.\nexport const x = 1\n",
    )
    try {
      expect(gatewayOnlyOffenders()).not.toContain(probeFile)
    } finally {
      rmSync(probeDir, { recursive: true, force: true })
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
  const APPROVAL_WORD_PATTERN = /approved/i

  it('review status vocabulary contains no approval word, anywhere in the file, case- and quote-insensitively', () => {
    const s = readFileSync('src/review/records.ts', 'utf8')
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
})
