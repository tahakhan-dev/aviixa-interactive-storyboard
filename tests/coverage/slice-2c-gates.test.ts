import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './strip-comments'
import { loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema } from '@/coverage/registry-loader'
import { REGISTRY_DESCRIPTORS, countByClass } from '@/coverage/descriptors'

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

const REGISTRY_DIR = 'registries/generated'

/**
 * Walked fresh on every call (not cached at module load), same discipline
 * as `slice-2b-gates.test.ts`'s `gatewayOnlyOffenders` -- so a test that
 * plants a scratch file mid-run and cleans it up in `finally` actually
 * proves the live scan sees it, not a snapshot taken before the plant.
 */
function generatedRegistryFiles(): string[] {
  return readdirSync(REGISTRY_DIR).filter((f) => f.endsWith('.json'))
}

function countScopeOffenders(): string[] {
  return generatedRegistryFiles()
    .filter((f) => f !== 'source-reconciliation.json')
    .filter((f) => {
      const r = JSON.parse(readFileSync(join(REGISTRY_DIR, f), 'utf8')) as {
        sourceFixesNoTotal?: boolean
        reconciledCount?: number | null
      }
      return r.sourceFixesNoTotal === true && r.reconciledCount != null
    })
}

// ===========================================================================
// Gate 1: no registry or index presents an extracted identifier count as a
// canonical inventory total. workflows.expectedCount stays null; a registry
// claiming both reconciledCount and sourceFixesNoTotal is unrepresentable.
// ===========================================================================
describe('gate 1: count-scope honesty', () => {
  it('no generated registry declares a total the source does not fix', () => {
    expect(countScopeOffenders()).toEqual([])
  })

  it('workflows.expectedCount stays null', () => {
    const workflows = REGISTRY_DESCRIPTORS.find((d) => d.slug === 'workflows')
    expect(workflows?.expectedCount).toBeNull()
  })

  // The schema (Task 8) makes the dishonest combination UNREPRESENTABLE, not
  // just discouraged by a lint-style scan -- proven directly against the
  // loader, no file needed.
  it('the schema refuses a registry claiming both sourceFixesNoTotal and a reconciledCount', () => {
    expect(() =>
      loadRegistry(
        GeneratedRegistrySchema,
        {
          slug: 'workflows',
          countedThing: 'extracted workflow records',
          reconciledCount: 432,
          rawCount: 725,
          dedupRule: 'x',
          sourceFixesNoTotal: true,
          rows: [],
        },
        'probe',
      ),
    ).toThrow(/reconciledCount|no total/i)
  })

  it('PLANTED VIOLATION: a scratch registry claiming both fields trips the gate', () => {
    const probe = join(REGISTRY_DIR, 'zz-probe.json')
    writeFileSync(
      probe,
      JSON.stringify({ sourceFixesNoTotal: true, reconciledCount: 1, rows: [] }),
    )
    try {
      expect(countScopeOffenders()).toContain('zz-probe.json')
    } finally {
      rmSync(probe)
    }
    expect(countScopeOffenders()).toEqual([])
  })

  // Final review round 1, MAJOR 3: this used to scan ONE named file for a
  // hand-written list of numbers. Round 2, MAJOR: that list itself was an
  // enumeration -- the workflow-collapse lesson repeating inside a gate.
  // Nine of the fourteen live registry row counts were absent from it
  // (17/28/67/70/205/330/526/534/630), so a hardcoded "The same 630 rows
  // also render below." kept the gate green. Computed FRESH from the
  // registries' own data on every call instead: every registry's
  // `rows.length`, `rawCount` and `reconciledCount`, PLUS the modules
  // source-class breakdown (63 source-defined, 18 derived, ...) --
  // `countByClass` is the exact function app/coverage/page.tsx calls to
  // render that breakdown, so a hardcoded restatement of one of ITS
  // figures is caught too, not just the top-level registry counts. Self-
  // maintaining: a registry added in slices 3-13, or any count that
  // changes, is covered with no list to remember to update. 0 is excluded
  // -- not a meaningful "count" to forbid (it appears constantly in
  // unrelated contexts: array indices, margin classes, key={0}), and every
  // currently-unpopulated build class is honestly 0.
  function liveRegistryCounts(): Set<number> {
    const counts = new Set<number>()
    for (const f of generatedRegistryFiles().filter((f) => f !== 'source-reconciliation.json')) {
      const r = JSON.parse(readFileSync(join(REGISTRY_DIR, f), 'utf8')) as {
        rows: unknown[]
        rawCount?: number
        reconciledCount?: number | null
      }
      counts.add(r.rows.length)
      if (typeof r.rawCount === 'number') counts.add(r.rawCount)
      if (typeof r.reconciledCount === 'number') counts.add(r.reconciledCount)
    }
    const modules = JSON.parse(readFileSync(join(REGISTRY_DIR, 'modules.json'), 'utf8')) as {
      rows: Array<{ sourceClass?: string; buildClass?: string }>
    }
    const moduleClasses = countByClass(
      modules.rows as Array<{
        sourceClass?: 'source-defined' | 'derived' | 'recommended' | 'illustrative' | 'unresolved'
        buildClass?: 'implemented' | 'not-applicable' | 'decision-blocked'
      }>,
    )
    for (const n of [...Object.values(moduleClasses.source), ...Object.values(moduleClasses.build)]) {
      counts.add(n)
    }
    counts.delete(0)
    return counts
  }

  // Final review round 2, MAJOR: `app/workflows/WorkflowIndex.tsx`
  // hardcoded 81 and sat outside the old `app/coverage/**` walk entirely.
  // Rather than name every directory that happens to render a count today,
  // this walks the whole `app/` tree -- deriving the scope instead of
  // enumerating it, so a page added in slices 3-13 is covered too.
  function hardcodedCountOffenders(): string[] {
    const forbidden = liveRegistryCounts()
    if (forbidden.size === 0) return []
    const pattern = new RegExp(`\\b(${[...forbidden].join('|')})\\b`)
    return walk('app')
      .filter((f) => /\.tsx$/.test(f))
      .filter((f) => pattern.test(stripComments(readFileSync(f, 'utf8'))))
  }

  it('no page anywhere under app/ hardcodes a live registry count', () => {
    expect(hardcodedCountOffenders()).toEqual([])
  })

  it('the forbidden-count set is computed from live data, not a hand-written list', () => {
    const forbidden = liveRegistryCounts()
    // The nine counts a prior hand-written list omitted -- restoring a
    // hardcoded "630" (or any of these) used to keep the gate green.
    for (const n of [17, 28, 67, 70, 205, 330, 526, 534, 630]) {
      expect(forbidden.has(n), String(n)).toBe(true)
    }
    // The modules source-class breakdown, computed the same way
    // app/coverage/page.tsx computes it -- not stored anywhere in the JSON.
    expect(forbidden.has(63)).toBe(true)
    expect(forbidden.has(18)).toBe(true)
    // 0 is deliberately never forbidden.
    expect(forbidden.has(0)).toBe(false)
  })

  it('PLANTED VIOLATION: a hardcoded count in ANY app/ file trips the gate, including outside app/coverage/', () => {
    const probe = join('app', 'workflows', 'zz-probe.tsx')
    writeFileSync(probe, 'export const total = 630\n')
    try {
      expect(hardcodedCountOffenders()).toContain(probe)
    } finally {
      rmSync(probe)
    }
    expect(hardcodedCountOffenders()).toEqual([])
  })

  // MOD-SA-20 is an alias-by-denial (controller addendum §2): the string
  // exists in the frozen source only inside prose that refuses it. It must
  // never appear in a generated registry as though it were a real module.
  // BLOCKING TRAP, hit live while writing this gate: the brief's own literal
  // check -- `expect(readFileSync(f, 'utf8')).not.toContain('MOD-SA-20')`,
  // a raw whole-file string scan -- fails against registries/generated/
  // modules.json TODAY, on CORRECT code: modules.json's own `dedupRule`
  // field honestly explains "...81 canonical modules, excluding MOD-SA-20 --
  // an alias-by-denial...". That is the exact "prose naming a forbidden
  // identifier in order to deny it" trap the frozen source documents for
  // this identifier at L4736 (see tests/coverage/strip-comments.ts's own
  // doc comment) -- reproduced here one level up, in generated JSON prose
  // rather than TypeScript comments. Fixed to check the STRUCTURED `rows[].id`
  // field only, not the raw file text.
  it('MOD-SA-20 appears as no row id in any generated inventory registry', () => {
    for (const f of generatedRegistryFiles().filter((f) => f !== 'source-reconciliation.json')) {
      const parsed = JSON.parse(readFileSync(join(REGISTRY_DIR, f), 'utf8')) as {
        rows: Array<{ id: string }>
      }
      const rowIds = parsed.rows.map((r) => r.id)
      expect(rowIds, f).not.toContain('MOD-SA-20')
    }
  })

  it('the naive whole-file-string form the brief specified is ITSELF a false-positive trap, reproduced', () => {
    const raw = readFileSync(join(REGISTRY_DIR, 'modules.json'), 'utf8')
    // This is TRUE today, on correct, honest output -- proof the naive check
    // would fail the release for the right reason existing: an honest
    // dedupRule that names the excluded id in order to explain the exclusion.
    expect(raw).toContain('MOD-SA-20')
    const parsed = JSON.parse(raw) as { rows: Array<{ id: string }> }
    expect(parsed.rows.map((r) => r.id)).not.toContain('MOD-SA-20')
  })

  it('PLANTED VIOLATION: MOD-SA-20 as an actual row id trips the structured gate', () => {
    const probe = join(REGISTRY_DIR, 'zz-probe.json')
    writeFileSync(probe, JSON.stringify({ rows: [{ id: 'MOD-SA-20' }] }))
    try {
      const parsed = JSON.parse(readFileSync(probe, 'utf8')) as { rows: Array<{ id: string }> }
      expect(parsed.rows.map((r) => r.id)).toContain('MOD-SA-20')
    } finally {
      rmSync(probe)
    }
  })
})

// ===========================================================================
// Gate 2: no closed vocabulary uses the inert annotation form.
// `export const X: readonly T[] = [...] as const` WIDENS the const, making
// any exhaustiveness check below it vacuous. The safe form is
// `as const satisfies readonly T[]`. Exempt the three deliberate subsets and
// ROUTES (derived via .map()).
// ===========================================================================
const EXEMPT_CLOSED_VOCAB_NAMES = new Set([
  'SUPERVISOR_AND_ABOVE',
  'QUALITY_MANAGER_AND_ABOVE',
  'FRONTLINE_ONLY_STATES',
  'ROUTES',
])

/**
 * Finds an EXPORTED `const NAME: readonly T[] = [...]` or
 * `const NAME: ReadonlyArray<T> = [...]` declaration in a comment-stripped
 * source string -- the inert, const-widening form. Final review round 2,
 * LATENT GAP: a prior version of this scanner required a trailing
 * `as const\b` to fire at all, which missed two forms of the identical
 * defect -- `export const X: readonly T[] = ['a','b']` (no assertion at
 * all) and the `ReadonlyArray<T>` spelling -- because an explicit LEADING
 * array-type annotation widens the const regardless of what follows it: a
 * declared type always wins over inference from the initializer, `as
 * const` or not. The safe form (`as const satisfies readonly T[]`) never
 * carries this leading annotation at all -- the type constraint comes from
 * `satisfies` AFTER the array -- so simply detecting the leading
 * annotation is sufficient; nothing on the right-hand side needs
 * inspecting. `export` is REQUIRED (not optional): this gate's own test
 * below is named "no EXPORTED closed vocabulary", and `COMMENT_REQUIRED_
 * STATUSES` in src/review/records.ts is a real, non-exported, module-
 * private array with exactly this annotation shape that must stay out of
 * scope (out-of-scope by construction, not by a name added to the
 * exemption list).
 *
 * ponytail: does not follow a type annotation split across multiple lines
 * (`const X:\n  readonly T[] = [...]`) -- a real gap, but verified zero
 * live instances of that formatting exist in this codebase today. Upgrade
 * to a small multi-line-aware scan if that style is ever introduced.
 */
function inertAnnotationOffenders(strippedSrc: string): string[] {
  const lines = strippedSrc.split('\n')
  const DECL_RE =
    /^\s*export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:readonly\s+[\w.]+\[\]|ReadonlyArray<[^=]+>)\s*=\s*\[/
  const offenders: string[] = []
  for (const line of lines) {
    const m = DECL_RE.exec(line)
    if (!m) continue
    const name = m[1]!
    if (!EXEMPT_CLOSED_VOCAB_NAMES.has(name)) offenders.push(name)
  }
  return offenders
}

describe('gate 2: no closed vocabulary uses the inert annotation form', () => {
  it('no exported closed vocabulary in src/ or app/ uses the widening annotation', () => {
    const files = [...walk('src'), ...walk('app')].filter((f) => /\.tsx?$/.test(f))
    const offenders = files.flatMap((f) => {
      const names = inertAnnotationOffenders(stripComments(readFileSync(f, 'utf8')))
      return names.map((n) => `${f}: ${n}`)
    })
    expect(offenders).toEqual([])
  })

  it('PROVEN: fires on the exact defect pattern', () => {
    const planted = `export const X: readonly T[] = [\n  'a',\n  'b',\n] as const\n`
    expect(inertAnnotationOffenders(planted)).toEqual(['X'])
  })

  it('does not fire on the safe `as const satisfies` form', () => {
    const safe = `export const X = [\n  'a',\n  'b',\n] as const satisfies readonly T[]\n`
    expect(inertAnnotationOffenders(safe)).toEqual([])
  })

  // Final review round 2, LATENT GAP: the annotation widens the const
  // whether or not `as const` follows it -- an explicit `: readonly T[]`
  // (or `ReadonlyArray<T>`) declared type always wins over inference from
  // the initializer, `as const` or not. Both regexes required `as const\b`,
  // so these two forms shipped undetected. Checked against the real
  // codebase: zero live violations of either form exist today outside the
  // three already-exempted deliberate subsets (verified below).
  it('PROVEN: fires on the annotated form with no `as const` at all', () => {
    const planted = `export const X: readonly T[] = ['a', 'b']\n`
    expect(inertAnnotationOffenders(planted)).toEqual(['X'])
  })

  it('PROVEN: fires on the ReadonlyArray<T> spelling, with or without as const', () => {
    expect(inertAnnotationOffenders(`export const X: ReadonlyArray<T> = ['a', 'b']\n`)).toEqual(['X'])
    expect(inertAnnotationOffenders(`export const X: ReadonlyArray<T> = ['a', 'b'] as const\n`)).toEqual(['X'])
  })

  it('does not fire on an unannotated array (no widening is possible without an annotation)', () => {
    const safe = `export const X = [\n  'a',\n  'b',\n] as const\n`
    expect(inertAnnotationOffenders(safe)).toEqual([])
  })

  // Final review, MAJOR 4: the one-line form is the SAME defect as the
  // multi-line one and must be caught too.
  it('PROVEN: fires on the one-line inert form, not just the multi-line one', () => {
    const planted = `export const X: readonly T[] = ['a', 'b'] as const\n`
    expect(inertAnnotationOffenders(planted)).toEqual(['X'])
  })

  it('does not fire on a one-line unannotated array or the safe one-line satisfies form', () => {
    expect(inertAnnotationOffenders(`export const X = ['a', 'b'] as const\n`)).toEqual([])
    expect(
      inertAnnotationOffenders(`export const X = ['a', 'b'] as const satisfies readonly T[]\n`),
    ).toEqual([])
  })

  it('exempts the three deliberate subsets and ROUTES by name', () => {
    for (const name of ['SUPERVISOR_AND_ABOVE', 'QUALITY_MANAGER_AND_ABOVE', 'FRONTLINE_ONLY_STATES', 'ROUTES']) {
      const planted = `export const ${name}: readonly T[] = [\n  'a',\n] as const\n`
      expect(inertAnnotationOffenders(planted), name).toEqual([])
    }
  })
})

// ===========================================================================
// Gate 3: a client-review action creates a ReviewEvent and nothing else --
// never a product DomainEvent, AuditEvent, notification, command, schedule,
// or state transition.
// ===========================================================================
const PRODUCT_STORE_NAMES = [
  'snapshots', 'audit', 'events', 'commands', 'notifications', 'schedules', 'idempotency', 'meta',
]

function reviewLedgerOffenders(): string[] {
  return walk('src/review')
    .filter((f) => /\.tsx?$/.test(f))
    .filter((f) => {
      const s = stripComments(readFileSync(f, 'utf8'))
      if (/\b(DomainEvent|AuditEvent|LedgerRecord)\b/.test(s)) return true
      if (/commitTransition|from\s+['"]@\/kernel\//.test(s)) return true
      return PRODUCT_STORE_NAMES.some((name) => new RegExp(`['"]${name}['"]`).test(s))
    })
}

describe('gate 3: a client-review action creates a ReviewEvent and nothing else', () => {
  // Major (final review): this gate's name asserted a positive
  // ("creates a ReviewEvent") that nothing in the app ever exercised --
  // createReviewEvent had no caller outside a unit test, so only the
  // "nothing else" half was ever checked. Now wired
  // (app/review/page.tsx's submit() calls putReviewEvent, proven end to
  // end against a real database in tests/component/review-shell.test.tsx);
  // this is the static half of that proof.
  // Final review round 2, MINOR: `toMatch(/\bputReviewEvent\b/)` is
  // presence-only -- it would pass just as happily on a bare unused
  // import, a reference assigned to a variable and never invoked, or a
  // call inside dead code. Tightened to require the CALL shape, awaited
  // (proving it is not a floating, unobserved promise either).
  it('the review action actually creates a ReviewEvent -- the writer is called and awaited, not just referenced', () => {
    const s = stripComments(readFileSync('app/review/page.tsx', 'utf8'))
    expect(s).toMatch(/\bawait\s+putReviewEvent\s*\(/)
    expect(s).toMatch(/\bcreateReviewEvent\s*\(/)
  })

  it('PLANTED VIOLATION: an unused import or unreachable reference does not satisfy the call-shape check', () => {
    const notCalled = "import { putReviewEvent } from '@/review/store'\nconst ref = putReviewEvent\n"
    expect(stripComments(notCalled)).not.toMatch(/\bawait\s+putReviewEvent\s*\(/)
  })

  it('no file under src/review/ names a product ledger type, a product store, or the transition path', () => {
    expect(reviewLedgerOffenders()).toEqual([])
  })

  // Structural backstop, not just textual: `reviewObjectStore`'s `name`
  // parameter is typed against `ReviewStoreName` (the literal union of
  // `REVIEW_STORES`), so passing a product store name there is a TypeScript
  // compile error; `runReviewTransaction` additionally opens its IndexedDB
  // transaction scoped to ONLY `[...REVIEW_STORES]`, so even a same-named
  // product store literal used elsewhere could never be reached from inside
  // that transaction at runtime -- IndexedDB itself throws
  // `NotFoundError` for a store outside the transaction's declared scope.
  it('src/review/store.ts opens its transactions scoped to REVIEW_STORES only', () => {
    const s = stripComments(readFileSync('src/review/store.ts', 'utf8'))
    expect(s).toMatch(/db\.transaction\(\[\.\.\.REVIEW_STORES\]/)
  })

  it('PLANTED VIOLATION: a product-ledger reference under src/review/ trips the gate', () => {
    const probeDir = join('src', 'review')
    const probe = join(probeDir, 'zz-probe.ts')
    writeFileSync(probe, "import type { LedgerRecord } from '@/domain/transition'\nexport const x: LedgerRecord | null = null\n")
    try {
      expect(reviewLedgerOffenders()).toContain(probe)
    } finally {
      rmSync(probe)
    }
    expect(reviewLedgerOffenders()).toEqual([])
  })

  it('does not fire on a comment naming the forbidden types in order to forbid them', () => {
    const probeDir = join('src', 'review')
    const probe = join(probeDir, 'zz-probe.ts')
    writeFileSync(
      probe,
      '// This module must never reference LedgerRecord, DomainEvent or AuditEvent.\nexport const ok = 1\n',
    )
    try {
      expect(reviewLedgerOffenders()).not.toContain(probe)
    } finally {
      rmSync(probe)
    }
  })
})

// ===========================================================================
// Gate 4: nothing reads as an approval. Already exists
// (tests/coverage/slice-2b-gates.test.ts's APPROVAL_WORD_PATTERN gate, now
// proven immune to casing, quoting, position, the union-type-vs-array
// evasion, AND word form -- `/approved/i` missed "Approve"/"Approval"
// entirely until the CRITICAL final-review fix widened it to `/\bapprov/i`).
// Confirmed here rather than reimplemented, plus a guard against the guard
// being silently weakened or deleted.
// ===========================================================================
describe('gate 4: nothing reads as an approval (confirming the existing gate)', () => {
  it('the approval-word gate in slice-2b-gates.test.ts is not silently deleted or narrowed', () => {
    const content = readFileSync('tests/coverage/slice-2b-gates.test.ts', 'utf8')
    expect(content).toContain('APPROVAL_WORD_PATTERN')
    expect(content).toContain('/\\bapprov/i')
  })

  // Final review, CRITICAL: `/approved/i` (the exact literal word) missed
  // "Approve"/"Approval"/"Approving" -- the realistic wording. Fixed here
  // too, to the same morphological root `/\bapprov/i` as
  // slice-2b-gates.test.ts's `APPROVAL_WORD_PATTERN`. Comment-stripped, not
  // raw: both `app/review/page.tsx` and `src/review/records.ts` carry
  // comments that explain the vocabulary avoids the word ("Deliberately
  // never 'Approve'...") -- exactly the "prose naming a forbidden term in
  // order to forbid it" trap (MOD-SA-20, ROLES.some(...)); the word-root
  // pattern would match its own denial if scanned raw.
  it('directly re-confirms: no approval word anywhere in review records or the review UI', () => {
    const files = [...walk('src/review'), ...walk('app/review')].filter((f) => /\.tsx?$/.test(f))
    const offenders = files.filter((f) => /\bapprov/i.test(stripComments(readFileSync(f, 'utf8'))))
    expect(offenders).toEqual([])
  })

  it('PROVEN: the underlying pattern catches every word form and cannot be defeated by casing, quoting, or matching its own denial', () => {
    const APPROVAL_WORD_PATTERN = /\bapprov/i
    for (const wordForm of ['Approve', 'Approve for release', 'Approval', 'Approving', 'approved', '"approved"']) {
      expect(wordForm, wordForm).toMatch(APPROVAL_WORD_PATTERN)
    }
    // A comment that NAMES the word in order to FORBID it must NOT trip a
    // gate that scans comment-stripped source -- unlike the raw scan above,
    // which would (correctly) treat the same text as a violation if it
    // appeared in actual code rather than a comment.
    expect(stripComments('// never say approved or Approve here\nconst ok = 1')).not.toMatch(
      APPROVAL_WORD_PATTERN,
    )
  })
})

// ===========================================================================
// Gate 5: one registry per inventory -- no second generated file for an
// inventory that already has one. This is what let Task 7's composite-key
// fix land in registries/generated/workflows.json while both app pages kept
// reading the legacy workflow-registry.json, reaching no screen.
// ===========================================================================
describe('gate 5: one registry per inventory', () => {
  it('exactly the fourteen inventory registries plus the reconciliation report -- no legacy duplicate', () => {
    const files = generatedRegistryFiles()
    expect(files).toHaveLength(15)
    expect(files).not.toContain('workflow-registry.json')
    const slugs = files.filter((f) => f !== 'source-reconciliation.json').map((f) => f.replace(/\.json$/, ''))
    expect([...slugs].sort()).toEqual([...REGISTRY_DESCRIPTORS.map((d) => d.slug)].sort())
  })

  it('PLANTED VIOLATION: a second file for an already-covered inventory trips the gate', () => {
    const probe = join(REGISTRY_DIR, 'workflow-registry.json')
    writeFileSync(probe, '[]')
    try {
      const files = generatedRegistryFiles()
      expect(files).toContain('workflow-registry.json')
      expect(files.length).not.toBe(15)
    } finally {
      rmSync(probe)
    }
    expect(generatedRegistryFiles()).toHaveLength(15)
  })
})

// ===========================================================================
// Gate 6: the frozen blueprint's prose never reaches out/. Identifiers and
// line numbers may ship; source text may not. Extends the existing
// blueprint-filename/author-path checks (prohibited-patterns.test.ts) with a
// direct check on free-text extraction fields this build deliberately never
// renders anywhere (controls[].effect, business_rules[].statement) -- if
// ANY of these ever showed up in the shipped static export, that would mean
// raw extraction prose leaked somewhere it was never meant to.
// ===========================================================================
const CONFIDENTIAL_UNUSED_MARKERS = [
  "Ends an in-progress platform support session into the tenant's own workspace",
  'Bulk conflict resolution; skew-flagged writes are excluded from it',
  'The platform presents exactly five surfaces and no sixth.',
  'No operational data originates anywhere other than the Frontline Worker Application.',
]

describe('gate 6: frozen blueprint prose never reaches out/', () => {
  it('the existing blueprint-filename/author-path checks are not silently deleted or narrowed', () => {
    const content = readFileSync('tests/coverage/prohibited-patterns.test.ts', 'utf8')
    expect(content).toContain('AVIIXA_Production_Product_Blueprint')
    expect(content).toContain('Users')
  })

  it('none of the frozen source free-text fields this build never renders appear in the shipped export', () => {
    const shipped = walk('out')
    expect(shipped.length, 'a missing or empty out/ must fail loudly, never pass vacuously').toBeGreaterThan(0)
    const offenders = CONFIDENTIAL_UNUSED_MARKERS.flatMap((marker) =>
      shipped.filter((f) => readFileSync(f, 'utf8').includes(marker)).map((f) => `"${marker}" in ${f}`),
    )
    expect(offenders).toEqual([])
  })

  it('PLANTED VIOLATION: a confidential marker copied into a shipped file trips the gate', () => {
    const probe = join('out', 'zz-probe.html')
    writeFileSync(probe, `<html><body>${CONFIDENTIAL_UNUSED_MARKERS[0]}</body></html>`)
    try {
      const offenders = CONFIDENTIAL_UNUSED_MARKERS.flatMap((marker) =>
        walk('out').filter((f) => readFileSync(f, 'utf8').includes(marker)),
      )
      expect(offenders).toContain(probe)
    } finally {
      rmSync(probe)
    }
  })
})

// ===========================================================================
// Guard the guard: the WCAG contrast check that verifies every status token
// passes AA on its composited pill background must not be silently removed.
// ===========================================================================
describe('gate 7: token contrast guard is not silently removed', () => {
  // Minor (final review): this was named "every status token passes AA on
  // its composited background" -- that is what tests/unit/token-contrast.
  // test.ts itself proves (six tones composited at 10%, >= 4.75 floor,
  // plus an onTint < onSurface assertion); THIS check only confirms that
  // file still exists and still contains its own real contrast function,
  // so a later slice cannot delete it silently. Renamed to say what it
  // actually checks.
  it('the real per-token AA contrast test file is not silently deleted or gutted', () => {
    expect(readFileSync('tests/unit/token-contrast.test.ts', 'utf8')).toContain('compositeOver')
  })
})
