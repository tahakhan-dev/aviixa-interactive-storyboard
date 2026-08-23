import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  RUN_2026_08_14_A_PACKAGE,
  packageManifestLines,
  type ManifestLine,
} from '@/studio/modules/stu-14/package'
import {
  AC_PKG_104,
  DIAGRAM_TERMINUS,
  LIFECYCLE_COUNTS,
  LIFECYCLE_STAGES,
  LIFECYCLE_STATES,
  LIFECYCLE_TRANSITIONS,
  STAGE_AUTHORITY_COLUMNS,
  STAGE_AUTHORITY_MATRIX,
  STAGE_TO_STATE,
  isLifecycleStageId,
  isRecoverableFailure,
  outwardTransitions,
  reachesTerminusOnly,
  stage,
  type LifecycleStageId,
  type LifecycleStateId,
} from '@/offline/package/lifecycle'
import {
  FIELDS_ONLY_IN_CHAPTER_33,
  MANIFEST_COLUMNS,
  MANIFEST_FIELD_COUNTS,
  MANIFEST_SCHEMA_ABSENCE,
  PACKAGE_MANIFEST_DISCLOSURES,
  PACKAGE_SIGNING_CLASSIFICATIONS,
  PROPOSED_MANIFEST_CLASSIFICATION,
  PROPOSED_MANIFEST_FIELDS,
  SIGNING_IS_NOT_A_BASELINE,
  decisionRefsOf,
  isProposedManifestFieldId,
  manifestField,
  requiresClientDecision,
  type ProposedManifestField,
} from '@/offline/package/manifest'

/**
 * THE FROZEN SOURCE IS THE ORACLE, NOT THE MODULE.
 *
 * Every count, every cell and every id below is DERIVED by parsing the
 * blueprint and then compared to what the module ships. Nothing here compares
 * a constant to itself — `toEqual([...MY_CONSTANT])` is a tautology and slice
 * 7 shipped one.
 *
 * Two traps this file was written against specifically, both from slice 7's
 * list of gates that could not fail:
 *
 *   - A TABLE-SHAPE CHECK SATISFIED BY THE SEPARATOR ROW. `|---|---|` splits
 *     into non-empty cells and passes a "four columns, none blank" assertion.
 *     `rowsOf` refuses any row whose cells are all hyphens, and the separator
 *     line is asserted to be rejected.
 *   - AN OUTCOME CHECK WHERE ONE VERDICT IS A PREFIX OF ANOTHER. The client
 *     decision column opens `No` or `Yes`, and a `.includes('Yes')` test would
 *     be green on every row because the `No` rows cite `[SoW Fact — ...]`.
 *     The split is counted from the source with an anchored pattern and the
 *     module's own predicate is run against every row and compared.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const source = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** 1-indexed, as citations are. */
const line = (n: number): string => source[n - 1] ?? ''

/** Quote marks and dashes folded, markdown emphasis stripped, space collapsed. */
const norm = (s: string): string =>
  s
    .replace(/['‘’“”]/g, '"')
    .replace(/[`*_]/g, '')
    .replace(/[–—‒]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * The cells of a markdown table row, or `null` where the line is a separator
 * or not a table row at all. The separator rejection is the point: `|---|---|`
 * yields three-character cells that are neither empty nor blank.
 */
const cellsOf = (n: number): readonly string[] | null => {
  const raw = line(n).trim()
  if (!raw.startsWith('|') || !raw.endsWith('|')) return null
  const cells = raw.slice(1, -1).split('|').map((c) => c.trim())
  if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return null
  return cells
}

const rowsOf = (from: number, to: number): readonly (readonly string[])[] => {
  const out: (readonly string[])[] = []
  for (let n = from; n <= to; n++) {
    const cells = cellsOf(n)
    if (cells !== null) out.push(cells)
  }
  return out
}

const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* ══════════════════════════════════════════════════════════════════════ *
 * §35.1 — THE LIFECYCLE
 * ══════════════════════════════════════════════════════════════════════ */

describe('§35.1 the work-package lifecycle, against the frozen source', () => {
  it('the section opens where it is cited, and its own claim is twenty-one stages', () => {
    expect(norm(line(79041))).toBe('## 35.1 The work-package lifecycle end to end')
    expect(norm(line(79047))).toContain(
      'Naming twenty-one lifecycle stages is not bureaucracy',
    )
  })

  /** The twenty-one italicised names and their predicates, all in one sentence. */
  const sourceStages = ((): readonly { name: string; clause: string }[] => {
    const body = line(79049).replace(/^\s*\*\*[^*]*\*\*\s*/, '')
    const parts = body.split(/(?<!\*)\*([^*]+)\*(?!\*)/)
    const names = parts.filter((_, i) => i % 2 === 1)
    const clauses = parts.filter((_, i) => i % 2 === 0).slice(1)
    return names.map((name, i) => ({ name, clause: (clauses[i] ?? '').trim() }))
  })()

  it('carries twenty-one stages, in the source’s own names and order', () => {
    expect(sourceStages).toHaveLength(21)
    expect(LIFECYCLE_STAGES.map((s) => s.name)).toEqual(sourceStages.map((s) => s.name))
    expect(LIFECYCLE_STAGES.map((s) => s.id)).toEqual(sourceStages.map((s) => slug(s.name)))
  })

  it('every stage’s clause is the source’s own predicate, verbatim', () => {
    for (const [i, shipped] of LIFECYCLE_STAGES.entries()) {
      const expected = sourceStages[i]
      expect(expected, `no source stage at index ${i}`).toBeDefined()
      // Corruption handling and incompatible-version handling share ONE
      // predicate in the source, so the first of the pair carries the second's
      // clause. Every other stage matches its own.
      if (shipped.id === 'corruption-handling') {
        expect(norm(shipped.clause)).toBe(norm(sourceStages[i + 1]?.clause ?? ''))
        expect(norm(expected?.clause ?? '')).toBe('and')
      } else {
        expect(norm(shipped.clause), `${shipped.name}`).toBe(norm(expected?.clause ?? ''))
      }
    }
  })

  it('every stage’s status is READ OFF its clause, not asserted beside it', () => {
    const derive = (clause: string): string => {
      if (clause.includes('Not specified in the Statement of Work')) {
        return 'Not specified in the Statement of Work'
      }
      if (clause.includes('SoW Fact')) return 'SoW Fact'
      if (clause.includes('proposed')) return 'proposed'
      return 'partially addressed'
    }
    for (const s of LIFECYCLE_STAGES) {
      expect(derive(s.clause), `${s.name}`).toBe(s.status)
    }
    // And the split is the one L79159 states for the section.
    const counts = LIFECYCLE_STAGES.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({
      'SoW Fact': 13,
      proposed: 3,
      'Not specified in the Statement of Work': 4,
      'partially addressed': 1,
    })
    expect(norm(line(79159))).toContain(
      'Manifest creation, signing, explicit integrity validation, revocation, expiry, corruption handling, incompatible-version handling and rollback are Not specified in the Statement of Work',
    )
  })

  it('the predicate beside the constant narrows, and refuses a stage the source has not', () => {
    expect(isLifecycleStageId('signing')).toBe(true)
    expect(isLifecycleStageId('Signing')).toBe(false)
    expect(isLifecycleStageId('quarantine')).toBe(false)
    expect(stage('rollback').status).toBe('partially addressed')
    expect(() => stage('not-a-stage' as LifecycleStageId)).toThrow(/no lifecycle stage/)
  })
})

describe('§35.1 the state diagram, and the 21-to-18 gap', () => {
  const MERMAID_FROM = 79071
  const MERMAID_TO = 79114

  const sourceStates = ((): readonly { id: string; label: string; line: number }[] => {
    const out: { id: string; label: string; line: number }[] = []
    for (let n = MERMAID_FROM; n <= MERMAID_TO; n++) {
      const raw = line(n)
      if (raw.includes('-->')) continue
      const m = /^\s*([A-Za-z]+)\s*:\s*(.*)$/.exec(raw)
      if (m?.[1] !== undefined && m[2] !== undefined) out.push({ id: m[1], label: m[2], line: n })
    }
    return out
  })()

  const sourceArrows = ((): readonly { from: string; to: string; line: number }[] => {
    const out: { from: string; to: string; line: number }[] = []
    for (let n = MERMAID_FROM; n <= MERMAID_TO; n++) {
      const raw = line(n)
      if (!raw.includes('-->')) continue
      const [from, to] = raw.split('-->').map((s) => s.trim())
      if (from !== undefined && to !== undefined) out.push({ from, to, line: n })
    }
    return out
  })()

  it('the diagram draws eighteen states and twenty-four arrows', () => {
    expect(sourceStates).toHaveLength(18)
    expect(sourceArrows).toHaveLength(24)
    expect(LIFECYCLE_STATES.map((s) => [s.id, s.line, s.label])).toEqual(
      sourceStates.map((s) => [s.id, s.line, s.label]),
    )
    expect(LIFECYCLE_TRANSITIONS.map((t) => [t.from, t.to, t.line])).toEqual(
      sourceArrows.map((a) => [a.from, a.to, a.line]),
    )
  })

  it('twenty-one stages minus one fold minus two unstated is exactly eighteen', () => {
    const mapped = Object.values(STAGE_TO_STATE)
    expect(mapped).toHaveLength(21)
    const unstated = mapped.filter((v) => v === null)
    expect(unstated).toHaveLength(2)
    expect(STAGE_TO_STATE.rollback).toBeNull()
    expect(STAGE_TO_STATE.reconciliation).toBeNull()
    // The fold is the source's own, said in the state's own label.
    expect(STAGE_TO_STATE.signing).toBe('Manifested')
    expect(STAGE_TO_STATE['manifest-creation']).toBe('Manifested')
    expect(norm(line(79078))).toContain('Manifested - manifest created and signed')
    // Every state the diagram draws is reached by at least one stage, and no
    // stage maps to a state the diagram does not draw.
    const drawn = new Set(sourceStates.map((s) => s.id))
    const reached = new Set<string>(mapped.filter((v): v is LifecycleStateId => v !== null))
    expect([...reached].filter((s) => !drawn.has(s))).toEqual([])
    expect([...drawn].filter((s) => !reached.has(s))).toEqual([])
    expect(reached.size).toBe(18)
  })

  it('AC-PKG-104 holds as a property of the transcription, at the line it is stated', () => {
    expect(norm(line(79149))).toContain(`AC-PKG-104 | ${AC_PKG_104}`)
    const out = outwardTransitions('Pinned')
    expect(out).toHaveLength(1)
    expect(out[0]?.to).toBe('Released')
    // Not a claim about Pinned alone: no OTHER state in the diagram has exactly
    // one outward arrow to Released, so the assertion above is not accidentally
    // true of several states at once.
    const alsoOnlyToReleased = LIFECYCLE_STATES.filter(
      (s) =>
        s.id !== 'Pinned' &&
        outwardTransitions(s.id).length === 1 &&
        outwardTransitions(s.id)[0]?.to === 'Released',
    )
    expect(alsoOnlyToReleased).toEqual([])
  })

  it('three exits are terminal and Corrupt is the one recoverable failure', () => {
    const terminal = LIFECYCLE_STATES.filter((s) => reachesTerminusOnly(s.id)).map((s) => s.id)
    // Released reaches the terminus too, and is the normal end rather than an
    // exit — which is why the three the source names are asserted BESIDE it
    // rather than as the whole set.
    expect(terminal).toEqual(['Revoked', 'Incompatible', 'Expired', 'Released'])
    expect(terminal).not.toContain('Corrupt')
    // Superseded draws no outward arrow at all and is not terminal either.
    expect(outwardTransitions('Superseded')).toEqual([])
    expect(reachesTerminusOnly('Superseded')).toBe(false)
    expect(isRecoverableFailure('Corrupt')).toBe(true)
    expect(outwardTransitions('Corrupt').map((t) => t.to)).toEqual(['Downloading'])
    expect(norm(line(79116))).toContain(
      'Three exits - Revoked, Expired and Incompatible - are terminal for that package',
    )
    expect(norm(line(79116))).toContain('Corrupt is the one recoverable failure')
    expect(DIAGRAM_TERMINUS).toBe('[*]')
  })
})

describe('§35.1 the stage-authority matrix, header-keyed', () => {
  it('is thirteen rows of five columns, in the source’s own column order', () => {
    const header = cellsOf(79124)
    expect(header).toEqual([...STAGE_AUTHORITY_COLUMNS])
    // The separator is refused rather than counted as a row.
    expect(cellsOf(79125)).toBeNull()
    const rows = rowsOf(79126, 79138)
    expect(rows).toHaveLength(13)
    expect(STAGE_AUTHORITY_MATRIX).toHaveLength(13)
    for (const r of rows) expect(r).toHaveLength(5)
  })

  it('every cell is the source’s own, keyed on its header and not on its position', () => {
    for (const row of STAGE_AUTHORITY_MATRIX) {
      const cells = cellsOf(row.line)
      expect(cells, `L${row.line} is not a table row`).not.toBeNull()
      expect(cells?.[0]).toBe(row.stage)
      expect(cells?.[1]).toBe(row.cells['Who acts'])
      expect(cells?.[2]).toBe(row.cells.Surface)
      expect(cells?.[3]).toBe(row.cells.Audited)
      expect(cells?.[4]).toBe(row.cells['Source status'])
    }
  })

  it('the matrix keeps its own stage names and does not pretend to be the twenty-one', () => {
    const matrixStages = STAGE_AUTHORITY_MATRIX.map((r) => r.stage)
    const proseStages = LIFECYCLE_STAGES.map((s) => s.name)
    expect(matrixStages).not.toEqual(proseStages)
    // The three joins the source makes and this build refuses to invent.
    expect(matrixStages).toContain('Manifest creation and signing')
    expect(matrixStages).toContain('Activation and pinning')
    expect(matrixStages).toContain('Deletion of local footprint')
    expect(proseStages).not.toContain('Manifest creation and signing')
  })
})

describe('§35.1 four counts, all measured, none of them the count', () => {
  const workflowSteps = ((): number => {
    let n = 0
    for (let l = 79053; l <= 79068; l++) if (/^\s*\d+\.\s+\S/.test(line(l))) n++
    return n
  })()

  it('twenty-one stages, eighteen states, sixteen steps and thirteen rows', () => {
    expect(workflowSteps).toBe(16)
    expect(rowsOf(79126, 79138)).toHaveLength(13)
    const shipped = Object.fromEntries(LIFECYCLE_COUNTS.map((c) => [c.what, c.counted]))
    expect(Object.values(shipped)).toEqual([21, 18, 16, 13])
    // Four DIFFERENT numbers: the record exists because they disagree.
    expect(new Set(Object.values(shipped)).size).toBe(4)
  })

  it('every locator in the count record names a line that carries what it says', () => {
    for (const c of LIFECYCLE_COUNTS) {
      for (const m of c.locator.matchAll(/L(\d+)/g)) {
        const n = Number(m[1])
        expect(n, `L${n} out of range`).toBeGreaterThan(79040)
        expect(n).toBeLessThan(79160)
        expect(line(n).trim(), `L${n} is blank`).not.toBe('')
      }
    }
  })
})

/* ══════════════════════════════════════════════════════════════════════ *
 * §35.3 — THE PROPOSED MANIFEST
 * ══════════════════════════════════════════════════════════════════════ */

describe('§35.3 the manifest is a proposal, and the source says so first', () => {
  it('the section opens where it is cited and states the absence in its first sentence', () => {
    expect(norm(line(79247))).toBe('## 35.3 The package manifest')
    expect(norm(line(79253))).toContain(norm(MANIFEST_SCHEMA_ABSENCE))
    // The classification, at both lines that state it.
    expect(norm(line(79253))).toContain(
      `Everything in this section is therefore ${norm(PROPOSED_MANIFEST_CLASSIFICATION)}`,
    )
    expect(norm(line(79334))).toContain(
      `the verification behaviour and the rendering proposal are ${norm(PROPOSED_MANIFEST_CLASSIFICATION)}`,
    )
    // And the sentence is not merely present somewhere in 122,241 lines: it is
    // the honest statement of THIS section and occurs exactly once.
    const occurrences = source.filter((l) => norm(l).includes(norm(MANIFEST_SCHEMA_ABSENCE)))
    expect(occurrences).toHaveLength(1)
  })

  it('the decision card that would ratify it is where it is cited', () => {
    expect(norm(line(79652))).toContain(
      'DEC-PKGMAN-001 - manifest schema, signing, key custody, retry bound and mid-run revocation',
    )
    expect(norm(line(79652))).toContain('Section 35.3 proposes a twenty-two-field manifest')
  })
})

describe('§35.3 the twenty-two fields, transcribed header-keyed', () => {
  const header = cellsOf(79259)
  const rows = rowsOf(79261, 79282)

  it('is a four-column header and twenty-two rows, with the separator refused', () => {
    expect(header).toEqual([...MANIFEST_COLUMNS])
    expect(cellsOf(79260)).toBeNull()
    expect(rows).toHaveLength(22)
    expect(PROPOSED_MANIFEST_FIELDS).toHaveLength(22)
    for (const r of rows) expect(r).toHaveLength(4)
  })

  it('every cell is the source’s own, at the line the row names', () => {
    for (const [i, f] of PROPOSED_MANIFEST_FIELDS.entries()) {
      expect(f.line).toBe(79261 + i)
      const cells = cellsOf(f.line)
      expect(cells, `L${f.line} is not a table row`).not.toBeNull()
      expect(cells?.[0]).toBe(f.cells.Field)
      expect(cells?.[1]).toBe(f.cells.Purpose)
      expect(cells?.[2]).toBe(f.cells.Justification)
      expect(cells?.[3]).toBe(f.cells['Client decision required'])
    }
  })

  it('every id is the slug of the source’s own Field cell', () => {
    expect(PROPOSED_MANIFEST_FIELDS.map((f) => f.id)).toEqual(rows.map((r) => slug(r[0] ?? '')))
    expect(isProposedManifestFieldId('signature')).toBe(true)
    expect(isProposedManifestFieldId('Signature')).toBe(false)
    expect(isProposedManifestFieldId('location-identifier')).toBe(false)
    expect(manifestField('checksum').cells.Purpose).toBe(
      'Detects accidental corruption of content independently of the signature',
    )
  })

  it('the first four fields bind the package to a scope, each saying so itself', () => {
    const first4 = PROPOSED_MANIFEST_FIELDS.slice(0, 4)
    expect(first4.map((f) => f.cells.Field)).toEqual([
      'Tenant identifier',
      'Site identifier',
      'Area identifier',
      'Job identifier',
    ])
    for (const f of first4) expect(f.cells.Purpose).toMatch(/^Binds\b/)
  })

  it('sixteen fields need no client decision and six do, counted from the source', () => {
    // Anchored at the start of the cell. A substring test for "Yes" is green on
    // every row, because sixteen of them cite `[SoW Fact — ...]` in the same cell.
    const stripped = rows.map((r) => (r[3] ?? '').replace(/[*`]/g, '').trimStart())
    const sourceYes = stripped.filter((c) => /^Yes\b/.test(c))
    const sourceNo = stripped.filter((c) => /^No\b/.test(c))
    expect(sourceYes).toHaveLength(6)
    expect(sourceNo).toHaveLength(16)
    expect(sourceYes.length + sourceNo.length).toBe(22)
    // THE TRAP, STATED AS A NUMBER. All six Yes cells are bolded in the source,
    // so an anchored test on the RAW cell finds none of them and reports a
    // twenty-two-nil split that is internally coherent and wrong.
    expect(rows.filter((r) => /^Yes\b/.test(r[3] ?? ''))).toHaveLength(0)

    const shippedYes = PROPOSED_MANIFEST_FIELDS.filter(requiresClientDecision)
    expect(shippedYes).toHaveLength(6)
    expect(shippedYes.map((f) => f.cells.Field)).toEqual([
      'Content and library versions',
      'Effective time',
      'Expiry',
      'Signature',
      'Artificial-intelligence and model compatibility where relevant',
      'Revocation identifier',
    ])
  })

  it('six fields carry four distinct decisions between them', () => {
    const refs = PROPOSED_MANIFEST_FIELDS.flatMap(decisionRefsOf)
    expect(refs).toEqual([
      'DEC-LIB-001',
      'DEC-PKGEXP-001',
      'DEC-PKGEXP-001',
      'DEC-PKGMAN-001',
      'DEC-AGENTLC-001',
      'DEC-PKGMAN-001',
    ])
    expect(new Set(refs).size).toBe(4)
    // Every field naming a decision is a field requiring one, and the reverse.
    for (const f of PROPOSED_MANIFEST_FIELDS) {
      expect(decisionRefsOf(f).length > 0, f.id).toBe(requiresClientDecision(f))
    }
  })

  it('no field carries a value, because the schema is unratified', () => {
    const shape = new Set(PROPOSED_MANIFEST_FIELDS.flatMap((f) => Object.keys(f)))
    expect([...shape].sort()).toEqual(['cells', 'id', 'line'])
    for (const f of PROPOSED_MANIFEST_FIELDS) {
      expect(Object.keys(f.cells).sort()).toEqual([...MANIFEST_COLUMNS].sort())
    }
    // AC-PKG-305, the source's own prohibition on inventing one.
    expect(norm(line(79322))).toContain(
      'No expiry, effective-time or signature-algorithm value is hard-coded before DEC-PKGMAN-001 and DEC-PKGEXP-001 are decided',
    )
    const module = readFileSync(
      join(process.cwd(), 'src', 'offline', 'package', 'manifest.ts'),
      'utf8',
    )
    // No algorithm name, no horizon, no default.
    expect(module).not.toMatch(/SHA-?\d|RSA|ECDSA|Ed25519|HMAC/i)
    expect(module).not.toMatch(/expiresIn|defaultExpiry|EXPIRY_HOURS/)
  })
})

describe('§35.3 against §33.4 — three field counts for one manifest', () => {
  const chapter33Fields = ((): readonly { heading: string; line: number }[] => {
    const out: { heading: string; line: number }[] = []
    for (let n = 77524; n <= 77583; n++) {
      const m = /^\*\*([^*]+)\.\*\* Justification/.exec(line(n))
      if (m?.[1] !== undefined) out.push({ heading: m[1], line: n })
    }
    return out
  })()

  it('§33.4 proposes twenty-four, §35.3 twenty-two, and §33.4’s own summary twenty-one', () => {
    expect(norm(line(77510))).toBe('## 33.4 The Complete Package Manifest')
    expect(chapter33Fields).toHaveLength(24)
    expect(rowsOf(79261, 79282)).toHaveLength(22)
    expect(rowsOf(77611, 77631)).toHaveLength(21)
    expect(MANIFEST_FIELD_COUNTS.map((c) => c.counted)).toEqual([24, 22, 21])
    expect(new Set(MANIFEST_FIELD_COUNTS.map((c) => c.counted)).size).toBe(3)
  })

  it('the two fields §35.3 drops are named, at the lines §33.4 states them', () => {
    const shipped35 = new Set(PROPOSED_MANIFEST_FIELDS.map((f) => slug(f.cells.Field)))
    const dropped = chapter33Fields.filter((f) => !shipped35.has(slug(f.heading)))
    expect(dropped.map((d) => [d.heading, d.line])).toEqual(
      FIELDS_ONLY_IN_CHAPTER_33.map((d) => [d.heading, d.line]),
    )
    expect(FIELDS_ONLY_IN_CHAPTER_33).toHaveLength(2)
    for (const d of FIELDS_ONLY_IN_CHAPTER_33) {
      expect(line(d.line)).toContain(d.heading)
    }
  })

  it('§33.4 reaches twenty-one by folding scope rows, which is why 24 minus 22 is not 21', () => {
    const summary = rowsOf(77611, 77631).map((r) => r[0] ?? '')
    expect(summary).toContain('Site, Area, Location')
    expect(summary).toContain('Job, Run')
    // Two folds of three and two: 24 - 2 - 1 = 21.
    expect(24 - 2 - 1).toBe(21)
  })
})

/* ══════════════════════════════════════════════════════════════════════ *
 * THE COLLISION WITH THE SHIPPED STUDIO MANIFEST
 * ══════════════════════════════════════════════════════════════════════ */

describe('the two manifests are different objects and cannot be confused', () => {
  it('neither type assigns to the other, in either direction', () => {
    // @ts-expect-error a rendered Studio manifest line is not a proposed field
    const notAField: ProposedManifestField = {} as ManifestLine
    // @ts-expect-error a proposed manifest field is not a rendered Studio line
    const notALine: ManifestLine = {} as ProposedManifestField
    void notAField
    void notALine
    expect(true).toBe(true)
  })

  it('they share no property name at all, which is what makes that structural', () => {
    // The Studio side is read off a REAL rendered line rather than off a list
    // of key names typed here, so this compares two shipped objects instead of
    // comparing one of them to my description of the other.
    const rendered = packageManifestLines(RUN_2026_08_14_A_PACKAGE)
    expect(rendered.length).toBeGreaterThan(0)
    const lineKeys = new Set(rendered.flatMap((l) => Object.keys(l)))
    expect([...lineKeys].sort()).toEqual(['label', 'value'])
    const fieldKeys = new Set(PROPOSED_MANIFEST_FIELDS.flatMap((f) => Object.keys(f)))
    expect([...fieldKeys].filter((k) => lineKeys.has(k))).toEqual([])
    // Nine rendered lines against twenty-two proposed fields: different objects,
    // different sizes, and the Studio view is the one a client is looking at.
    expect(rendered).toHaveLength(9)
    expect(PROPOSED_MANIFEST_FIELDS).toHaveLength(22)
  })

  it('this module neither imports nor edits the Studio package module', () => {
    for (const file of ['lifecycle.ts', 'manifest.ts']) {
      const text = readFileSync(join(process.cwd(), 'src', 'offline', 'package', file), 'utf8')
      expect(text, file).not.toMatch(/from '@\/studio/)
      // Named in prose, imported nowhere — which is the separation.
      expect(text, file).not.toMatch(/import[^\n]*ManifestLine/)
    }
  })

  it('the Studio view is untouched and still built from SB-STU-17’s own list', () => {
    const studio = readFileSync(
      join(process.cwd(), 'src', 'studio', 'modules', 'stu-14', 'package.ts'),
      'utf8',
    )
    expect(studio).toContain('export interface ManifestLine')
    expect(studio).toContain('export function packageManifestLines')
    // None of §35.3's proposal has leaked into it.
    for (const absent of [
      'Revocation identifier',
      'Minimum application version',
      'Effective time',
      'DEC-PKGMAN-001',
    ]) {
      expect(studio, `${absent} has leaked into the Studio view`).not.toContain(absent)
    }
    expect(norm(line(33905))).toContain('SB-STU-17')
  })
})

/* ══════════════════════════════════════════════════════════════════════ *
 * PACKAGE SIGNING — THREE CLASSIFICATIONS, NONE CHOSEN
 * ══════════════════════════════════════════════════════════════════════ */

describe('package signing is classified three ways and this build chooses none', () => {
  it('carries three readings in the canon’s own two-field shape', () => {
    expect(PACKAGE_SIGNING_CLASSIFICATIONS).toHaveLength(3)
    for (const r of PACKAGE_SIGNING_CLASSIFICATIONS) {
      expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
    }
    // No field in which a reading could be marked the answer.
    const keys = new Set(PACKAGE_SIGNING_CLASSIFICATIONS.flatMap((r) => Object.keys(r)))
    for (const forbidden of ['adopted', 'preferred', 'answer', 'settled', 'isCanonical']) {
      expect(keys.has(forbidden)).toBe(false)
    }
  })

  it('each reading’s locator lands on a line that carries the classification it claims', () => {
    // Reading one — Recommendation — R&D, not specified in the Statement of Work.
    expect(norm(line(62220))).toContain('Package signing and device-side verification')
    expect(norm(line(62220))).toContain('Recommendation - R&D; not specified in the Statement of Work')
    expect(norm(line(77518))).toContain('is therefore Recommendation - R&D')
    // Reading two — Derived Clarification.
    expect(norm(line(89249))).toContain('package signing is Derived Clarification')
    expect(norm(line(89180))).toContain('The package is signed and integrity-checked before use')
    expect(norm(line(91126))).toContain('verification is Derived Clarification')
    // Reading three — a timing question under DEC-SEC-015.
    expect(norm(line(104000))).toContain(
      'Work-package signing | Not specified in the Statement of Work',
    )
    expect(norm(line(105458))).toContain('DEC-SEC-015 | Work-package signing at V1 or later')
    // The three are DIFFERENT classifications, which is the whole point.
    expect(norm(line(89249))).not.toContain('Recommendation - R&D')
  })

  it('nothing in either module treats a signature as a reason to trust a package', () => {
    for (const file of ['lifecycle.ts', 'manifest.ts']) {
      const text = readFileSync(join(process.cwd(), 'src', 'offline', 'package', file), 'utf8')
      expect(text, file).not.toMatch(/function\s+\w*(verifySignature|isSigned|isTrusted)\w*/)
      expect(text, file).not.toMatch(/signatureValid|trusted\s*[:=]\s*true/)
    }
    expect(SIGNING_IS_NOT_A_BASELINE).toContain('never a reason to trust a package')
    // Signature survives as one of the twenty-two proposed fields and nothing more.
    expect(manifestField('signature').cells['Client decision required']).toContain(
      'DEC-PKGMAN-001',
    )
  })
})

/* ══════════════════════════════════════════════════════════════════════ *
 * THREE DECISIONS, DISCLOSED LOCALLY, BUILT TO EXPIRE
 * ══════════════════════════════════════════════════════════════════════ */

describe('DEC-PKGMAN-001, DEC-PKGSIGN-001 and DEC-SEC-015, disclosed locally', () => {
  const canon = readFileSync(join(process.cwd(), 'src', 'disclosure', 'decisions.ts'), 'utf8')
  const canonIds = ((): string[] => {
    const block = /export type DecisionId =([\s\S]*?)\n\n/.exec(canon)?.[1]
    if (block === undefined) throw new Error('DecisionId union not found in the canon')
    return [...block.matchAll(/'([^']+)'/g)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]))
  })()

  it('none of these three is one of the canon’s records', () => {
    // `toHaveLength(29)` stood here and is gone: a stored copy of a derived
    // answer, stale the moment slice 10 registered fourteen more records, in a
    // suite whose only stake in the canon is three absences. The positive
    // control below is what the count was really buying, and it was already
    // here — a failed parse cannot satisfy both it and the absences.
    // The expiry gate: the moment any is lifted, this goes red and forces the switch.
    for (const d of PACKAGE_MANIFEST_DISCLOSURES) {
      expect(canonIds, `${d.decisionRef} has been lifted into the canon`).not.toContain(
        d.decisionRef,
      )
    }
    // And the gate can tell a lift from a typo: an identifier that IS in the canon
    // is found by the same lookup.
    expect(canonIds).toContain('DEC-LIB-001')
  })

  it('all three are in the canon’s own shape, with the imported reading type', () => {
    expect(PACKAGE_MANIFEST_DISCLOSURES).toHaveLength(3)
    expect(PACKAGE_MANIFEST_DISCLOSURES.map((d) => d.decisionRef)).toEqual([
      'DEC-PKGMAN-001',
      'DEC-PKGSIGN-001',
      'DEC-SEC-015',
    ])
    for (const d of PACKAGE_MANIFEST_DISCLOSURES) {
      for (const r of d.readings) expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
      // The note's ABSENCE claim, not its count — see the comment on the
      // absence test above. `'twenty-nine'` here required the note to keep
      // spelling a canon size that is now forty-three; the string lives in
      // `src/offline/package/manifest.ts`, which this task does not own.
      expect(d.canonNote, d.decisionRef).toContain('this is not one of them')
      expect(d.adopted, d.decisionRef).toContain('APP-012')
      expect(d.readings.length, d.decisionRef).toBeGreaterThanOrEqual(3)
    }
    // The module imports the canon's reading type rather than redeclaring it.
    const module = readFileSync(
      join(process.cwd(), 'src', 'offline', 'package', 'manifest.ts'),
      'utf8',
    )
    expect(module).toContain("import type { DecisionReading } from '@/disclosure/decisions'")
    expect(module).not.toMatch(/interface\s+DecisionReading\b/)
  })

  it('every locator any reading cites lands on a non-blank line that carries it', () => {
    const cited = PACKAGE_MANIFEST_DISCLOSURES.flatMap((d) =>
      d.readings.flatMap((r) => [...r.locator.matchAll(/L(\d+)/g)].map((m) => Number(m[1]))),
    )
    expect(cited.length).toBeGreaterThanOrEqual(12)
    for (const n of cited) {
      expect(n, `L${n} out of range`).toBeGreaterThan(0)
      expect(n).toBeLessThanOrEqual(source.length)
      expect(line(n).trim(), `L${n} is blank`).not.toBe('')
    }
    // And each identifier-anchored locator names a line that identifier occurs at.
    for (const d of PACKAGE_MANIFEST_DISCLOSURES) {
      for (const r of d.readings) {
        for (const m of r.locator.matchAll(/(DEC-[A-Z]+-\d+|AC-PKG-\d+|TEST-SEC-\d+|RISK-SEC-\d+)\s+L(\d+)/g)) {
          expect(line(Number(m[2])), `${m[1]} is not at L${m[2]}`).toContain(m[1] ?? '')
        }
      }
    }
  })

  it('DEC-PKGSIGN-001 and DEC-SEC-015 are kept apart because they ask different questions', () => {
    const sign = PACKAGE_MANIFEST_DISCLOSURES.find((d) => d.decisionRef === 'DEC-PKGSIGN-001')
    const sec = PACKAGE_MANIFEST_DISCLOSURES.find((d) => d.decisionRef === 'DEC-SEC-015')
    expect(sign?.question).not.toBe(sec?.question)
    // Both questions are the source's own, at the lines that raise them.
    expect(norm(line(61208))).toContain(norm(sign?.question ?? ''))
    expect(norm(line(105458))).toContain('Work-package signing at V1 or later')
    // The signing classifications are carried into the signing record rather
    // than respelt there.
    for (const r of PACKAGE_SIGNING_CLASSIFICATIONS) {
      expect(sign?.readings, r.locator).toContainEqual(r)
    }
  })

  it('no adopted position claims the source settled anything', () => {
    for (const d of PACKAGE_MANIFEST_DISCLOSURES) {
      expect(d.adopted, d.decisionRef).toMatch(/client-delegated choice under APP-012/)
      expect(d.adopted, d.decisionRef).not.toMatch(/the source (?:settles|requires|ratifies)/i)
    }
    const pkgman = PACKAGE_MANIFEST_DISCLOSURES[0]
    expect(pkgman?.adopted).toContain('none is populated')
    expect(pkgman?.adopted).toContain('exactly as slice 5 built it')
  })
})
