import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { OPEN_DECISION_IDS, decisionRecord } from '@/disclosure/decisions'
import { QUARANTINE_REGISTER } from '@/offline/quarantine'
import {
  PACKAGE_MANIFEST_DISCLOSURES,
  PACKAGE_SIGNING_CLASSIFICATIONS,
  SIGNING_IS_NOT_A_BASELINE,
} from '@/offline/package/manifest'
import {
  FAILURE_TABLE,
  FAILURE_TABLE_COLUMNS,
  FAILURE_TABLE_SHAPE,
  PACKAGE_INTEGRITY_CANON_DECISIONS,
  PACKAGE_INTEGRITY_LOCAL_DECISION_IDS,
  PACKAGE_INTEGRITY_LOCAL_DISCLOSURES,
  REJECTION_MESSAGES,
  REJECTION_MESSAGE_COLUMNS,
  REVOCATION_QUARANTINE_GAP,
  REVOCATION_ROW_ORDER,
  REVOCATION_TIMINGS,
  TAMPERING_DETECTION_DEPENDENCY,
  VERIFICATION_CHECKS,
  VERIFICATION_GAUNTLET,
  distinctCells,
  failureClass,
  rejectionMessage,
  revocationResponse,
  terminalStateIsNotEnterable,
  terminalStaging,
  verifyPackage,
  type CheckResult,
  type FailureClassId,
  type VerificationCheck,
} from '@/offline/package/integrity'

/**
 * THE FROZEN SOURCE IS THE GROUND TRUTH, NOT THE CONSTANT UNDER TEST.
 *
 * Every table check below re-reads and re-splits the source at test time and
 * compares the shipped rows against what it found. Editing a cell in
 * `@/offline/package/integrity` turns this red because the source still says
 * the old thing — which a `toEqual([...FAILURE_TABLE])` could never do, and
 * which is the tautology the slice-7 gate list records as its fifth failure.
 *
 * EVERY LINE NUMBER THE MODULE CLAIMS IS OPENED HERE, and it is opened from
 * the module's own field rather than from a number retyped in this file, so a
 * wrong locator in the module is a red test rather than a matching pair of
 * mistakes.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** `SOURCE_LINES` is 0-based; every citation in this build is 1-based `L<n>`. */
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

/** A markdown table row split header-keyed by position, never guessed. */
const cellsOf = (n: number): readonly string[] =>
  sourceLine(n)
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

const cell = (n: number, column: number): string => cellsOf(n)[column] ?? ''

const ALL_FAILURE_IDS: readonly FailureClassId[] = FAILURE_TABLE.map((r) => r.id)

describe('the failure table, counted from the frozen source', () => {
  it('the header carries the six columns of L79579, in the source’s order', () => {
    expect(cellsOf(FAILURE_TABLE_SHAPE.headerLine)).toEqual([...FAILURE_TABLE_COLUMNS])
    expect(cellsOf(FAILURE_TABLE_SHAPE.headerLine)).toEqual([
      'Failure class',
      'Detection',
      'Device response',
      'Oversight display',
      'Terminal safe state',
      'Source status',
    ])
  })

  it('the separator sits between the header and the first data row and is not a data row', () => {
    // `|---|---|` splits into non-empty cells, so a naive body scan counts it.
    // Slice 7 shipped a table-shape check satisfied by exactly this row.
    expect(FAILURE_TABLE_SHAPE.separatorLine).toBe(FAILURE_TABLE_SHAPE.headerLine + 1)
    expect(FAILURE_TABLE_SHAPE.firstDataLine).toBe(FAILURE_TABLE_SHAPE.separatorLine + 1)
    expect(sourceLine(FAILURE_TABLE_SHAPE.separatorLine)).toMatch(/^\|(\s*-{3,}\s*\|)+$/)
    expect(sourceLine(FAILURE_TABLE_SHAPE.firstDataLine)).not.toMatch(/^\|(\s*-{3,}\s*\|)+$/)
  })

  it('THE TABLE IS ELEVEN DATA ROWS, NOT FIFTEEN — counted off the source', () => {
    // The dispatch asserted fifteen data rows from L79581. The body runs until
    // the first line that is not a table row, and that is the count.
    let n = FAILURE_TABLE_SHAPE.firstDataLine
    while (sourceLine(n).startsWith('|')) n += 1
    const counted = n - FAILURE_TABLE_SHAPE.firstDataLine

    expect(counted).toBe(11)
    expect(counted).toBe(FAILURE_TABLE_SHAPE.dataRows)
    expect(FAILURE_TABLE).toHaveLength(counted)
    expect(n - 1).toBe(FAILURE_TABLE_SHAPE.lastDataLine)
    // And the line after the body is not a table row, so the walk really stopped.
    expect(sourceLine(FAILURE_TABLE_SHAPE.lastDataLine + 1).startsWith('|')).toBe(false)
  })

  it('the source makes no count claim of its own for this table', () => {
    // So the fifteen was the controller's, not a source contradiction to keep.
    const section = SOURCE_LINES.slice(79512 - 1, 79615).join('\n')
    expect(section).toMatch(/Supporting matrix — failure classes and their handling/)
    expect(section).not.toMatch(/\bfifteen\b/i)
    expect(section).not.toMatch(/\beleven\b/i)
  })

  it('every row is six cells at its own line, and no line is claimed twice', () => {
    const lines = FAILURE_TABLE.map((r) => r.line)
    expect(new Set(lines).size).toBe(lines.length)
    for (const row of FAILURE_TABLE) {
      expect(cellsOf(row.line)).toHaveLength(FAILURE_TABLE_SHAPE.columns)
    }
  })

  it('the rows are in the source’s order, contiguous from the first data line', () => {
    // A positional transcription that reordered rows would still be six-celled.
    expect(FAILURE_TABLE.map((r) => r.line)).toEqual(
      Array.from({ length: FAILURE_TABLE_SHAPE.dataRows }, (_, i) => FAILURE_TABLE_SHAPE.firstDataLine + i),
    )
  })

  it.each(FAILURE_TABLE.map((r) => [r.id, r.line] as const))(
    'every cell of %s at L%d matches the source, header-keyed',
    (id, line) => {
      const row = failureClass(id)
      FAILURE_TABLE_COLUMNS.forEach((column, index) => {
        expect(row.cells[column]).toBe(cell(line, index))
        // A blank cell is untypeable, and a blank source cell would be a finding.
        expect(row.cells[column].length).toBeGreaterThan(0)
      })
    },
  )
})

describe('the Terminal safe state column — every row has one', () => {
  it('no row of the eleven leaves it blank in the source', () => {
    const index = FAILURE_TABLE_COLUMNS.indexOf('Terminal safe state')
    for (const row of FAILURE_TABLE) {
      expect(cell(row.line, index)).not.toBe('')
    }
  })

  it('the eleven rows carry seven distinct terminal safe states', () => {
    const fromSource = new Set(
      FAILURE_TABLE.map((r) => cell(r.line, FAILURE_TABLE_COLUMNS.indexOf('Terminal safe state'))),
    )
    expect(fromSource.size).toBe(7)
    expect(distinctCells(ALL_FAILURE_IDS, 'Terminal safe state')).toHaveLength(7)
  })

  it('seven rows are not enterable, one stops the run, three are Not applicable', () => {
    const states = FAILURE_TABLE.map((r) =>
      cell(r.line, FAILURE_TABLE_COLUMNS.indexOf('Terminal safe state')),
    )
    expect(states.filter((s) => s.startsWith('Run not enterable'))).toHaveLength(7)
    expect(states.filter((s) => s === 'Run stopped, work preserved')).toHaveLength(1)
    expect(states.filter((s) => s.startsWith('`Not applicable'))).toHaveLength(3)
  })

  it('the seven not-enterable rows are not enterable through the readiness machine', () => {
    // Forwarded to `@/offline/package/delivery`, so "not enterable" is a fact
    // rather than a string that happens to say so.
    const closed = ALL_FAILURE_IDS.filter((id) => terminalStateIsNotEnterable(id))
    expect(closed).toHaveLength(7)
    for (const id of ALL_FAILURE_IDS) {
      const staging = terminalStaging(id)
      expect(staging === null).toBe(!closed.includes(id))
    }
  })

  it('every row carries a Source status and the four classifications are counted', () => {
    const index = FAILURE_TABLE_COLUMNS.indexOf('Source status')
    const statuses = FAILURE_TABLE.map((r) => cell(r.line, index))
    expect(statuses.filter((s) => s !== '')).toHaveLength(11)
    // `Allowed` was a prefix of `Allowed with conditions` in slice 7 and inverted
    // a gate. Here `Recommendation — R&D` is a prefix of three longer cells, so
    // the exact matches are counted separately from the prefix matches.
    expect(statuses.filter((s) => s.startsWith('`Recommendation — R&D`'))).toHaveLength(7)
    expect(statuses.filter((s) => s === '`Recommendation — R&D`')).toHaveLength(2)
    expect(statuses.filter((s) => s.startsWith('`Recommendation — R&D`;'))).toHaveLength(2)
    expect(statuses.filter((s) => s.startsWith('`Recommendation — R&D` grounded in'))).toHaveLength(3)
    expect(statuses.filter((s) => s.startsWith('`Client Decision Required'))).toHaveLength(1)
    expect(statuses.filter((s) => s.startsWith('`SoW Fact'))).toHaveLength(2)
    expect(statuses.filter((s) => s.startsWith('`Derived Clarification`'))).toHaveLength(1)
    // The four buckets must exhaust the column, or a row went uncounted.
    const bucketed = statuses.filter(
      (s) =>
        s.startsWith('`Recommendation — R&D`') ||
        s.startsWith('`Client Decision Required') ||
        s.startsWith('`SoW Fact') ||
        s.startsWith('`Derived Clarification`'),
    )
    expect(bucketed).toEqual(statuses)
  })
})

describe('revocation is three rows and does not collapse into one', () => {
  it('the three timings resolve to the three consecutive source rows', () => {
    expect(REVOCATION_TIMINGS).toHaveLength(3)
    const rows = REVOCATION_TIMINGS.map((t) => revocationResponse(t))
    expect(rows.map((r) => r.line)).toEqual([79586, 79587, 79588])
    expect(rows.map((r) => r.id)).toEqual([...REVOCATION_ROW_ORDER])
    for (const row of rows) {
      expect(cell(row.line, 0)).toBe(row.cells['Failure class'])
      expect(cell(row.line, 0).startsWith('Revocation')).toBe(true)
    }
  })

  it('three detections and three device responses, all distinct, read off the source', () => {
    const at = (column: (typeof FAILURE_TABLE_COLUMNS)[number]) =>
      new Set(
        REVOCATION_ROW_ORDER.map((id) =>
          cell(failureClass(id).line, FAILURE_TABLE_COLUMNS.indexOf(column)),
        ),
      )
    expect(at('Detection').size).toBe(3)
    expect(at('Device response').size).toBe(3)
  })

  it('BUT TWO terminal safe states and TWO oversight displays, not three of each', () => {
    // The dispatch said three terminal safe states. L79586 and L79587 both read
    // `Run not enterable`; only L79588 differs. Counted, not asserted.
    const terminal = new Set(
      REVOCATION_ROW_ORDER.map((id) =>
        cell(failureClass(id).line, FAILURE_TABLE_COLUMNS.indexOf('Terminal safe state')),
      ),
    )
    expect(terminal.size).toBe(2)
    expect(distinctCells(REVOCATION_ROW_ORDER, 'Terminal safe state')).toHaveLength(2)
    expect(distinctCells(REVOCATION_ROW_ORDER, 'Oversight display')).toHaveLength(2)
    expect(distinctCells(REVOCATION_ROW_ORDER, 'Detection')).toHaveLength(3)
    expect(distinctCells(REVOCATION_ROW_ORDER, 'Device response')).toHaveLength(3)
  })

  it('the mid-run row is the only one that preserves work rather than refusing entry', () => {
    const inFlight = revocationResponse('after-staging-run-in-flight')
    expect(inFlight.cells['Terminal safe state']).toBe('Run stopped, work preserved')
    expect(terminalStaging(inFlight.id)).toBeNull()
    expect(terminalStaging('revocation-before-staging')).not.toBeNull()
    expect(terminalStaging('revocation-after-staging-run-not-started')).not.toBeNull()
  })

  it('§36.5’s quarantine register holds no reason for a revoked package', () => {
    // L79588 disposes of the work by quarantining it and the register that
    // defines quarantine reasons cannot express the case.
    expect(QUARANTINE_REGISTER).toHaveLength(10)
    const reasons = QUARANTINE_REGISTER.map((r) => r.cells.Reason)
    expect(reasons.filter((r) => /revok|withdraw/i.test(r))).toHaveLength(0)
    // Read from the source too, so a shrunken constant cannot pass vacuously.
    const fromSource = QUARANTINE_REGISTER.map((r) => cell(r.line, 0))
    expect(fromSource).toEqual(reasons)
    expect(fromSource.filter((r) => /revok|withdraw/i.test(r))).toHaveLength(0)
    expect(REVOCATION_QUARANTINE_GAP.claimedAt).toBe(79588)
    expect(sourceLine(REVOCATION_QUARANTINE_GAP.nearestReasonLine)).toContain(
      'Record referencing a workflow version that does not exist',
    )
  })
})

describe('the verification gauntlet, ordered and fail-closed', () => {
  const ALL_PASS: Readonly<Record<VerificationCheck, CheckResult>> = {
    checksum: 'passed',
    signature: 'passed',
    scope: 'passed',
    compatibility: 'passed',
    validity: 'passed',
  }

  it('the five checks are in the diagram’s own order, each label opened', () => {
    expect(VERIFICATION_GAUNTLET.map((s) => s.id)).toEqual([...VERIFICATION_CHECKS])
    for (const step of VERIFICATION_GAUNTLET) {
      expect(sourceLine(step.diagramLine)).toContain(step.label)
    }
    // And the order is the order of the diagram's own edges, read from source.
    const edges = SOURCE_LINES.slice(79529 - 1, 79561)
      .map((l) => l.trim())
      .filter((l) => /^\w+ --> \w+$/.test(l))
    const chain = ['Received --> ChecksumCheck', 'ChecksumCheck --> SignatureCheck', 'SignatureCheck --> ScopeCheck', 'ScopeCheck --> CompatibilityCheck', 'CompatibilityCheck --> ValidityCheck', 'ValidityCheck --> Trusted']
    for (const edge of chain) expect(edges).toContain(edge)
  })

  it('every manifest field a check reads exists in §35.3’s twenty-two-field table', () => {
    for (const step of VERIFICATION_GAUNTLET) {
      expect(step.manifestFields).toHaveLength(step.manifestFieldLines.length)
      step.manifestFields.forEach((field, i) => {
        const line = step.manifestFieldLines[i] ?? 0
        expect(cell(line, 0)).toBe(field)
      })
    }
  })

  it('only accidental corruption returns to the start — L79555, L79563', () => {
    const returning = VERIFICATION_GAUNTLET.filter((s) => s.returnsToReceived)
    expect(returning.map((s) => s.id)).toEqual(['checksum'])
    // Proved off the diagram: exactly one edge from a Reject state to Received.
    const back = SOURCE_LINES.slice(79529 - 1, 79561)
      .map((l) => l.trim())
      .filter((l) => /^Reject\w+ --> Received$/.test(l))
    expect(back).toEqual(['RejectCorrupt --> Received'])
    expect(sourceLine(79563)).toContain('Only one rejection returns to the start')
  })

  it('all five passed is the only way to be trusted', () => {
    expect(verifyPackage(ALL_PASS)).toEqual({ trusted: true })
  })

  it.each(VERIFICATION_CHECKS.map((c) => [c]))(
    'a failed %s blocks at that check with its own failure class',
    (check) => {
      const outcome = verifyPackage({ ...ALL_PASS, [check]: 'failed' })
      expect(outcome.trusted).toBe(false)
      if (outcome.trusted) throw new Error('unreachable')
      expect(outcome.blockedAt).toBe(check)
      expect(outcome.result).toBe('failed')
      const step = VERIFICATION_GAUNTLET.find((s) => s.id === check)
      expect(outcome.failureClass).toBe(step?.failureClass)
      expect(outcome.rePullPermitted).toBe(check === 'checksum')
    },
  )

  it.each(VERIFICATION_CHECKS.map((c) => [c]))(
    'an UNAVAILABLE %s blocks too — TEST-PKG-601, the disabled verifier',
    (check) => {
      const outcome = verifyPackage({ ...ALL_PASS, [check]: 'unavailable' })
      expect(outcome.trusted).toBe(false)
      if (outcome.trusted) throw new Error('unreachable')
      expect(outcome.blockedAt).toBe(check)
      expect(outcome.result).toBe('unavailable')
    },
  )

  it('an object missing a key entirely still blocks, at the earliest missing check', () => {
    // `noUncheckedIndexedAccess` makes this reachable from a JavaScript caller,
    // and the absence of a negative answer is not a positive one — L79593.
    const partial = { checksum: 'passed', scope: 'passed', compatibility: 'passed', validity: 'passed' } as unknown as Readonly<Record<VerificationCheck, CheckResult>>
    const outcome = verifyPackage(partial)
    expect(outcome.trusted).toBe(false)
    if (outcome.trusted) throw new Error('unreachable')
    expect(outcome.blockedAt).toBe('signature')
    expect(outcome.result).toBe('unavailable')
  })

  it('an earlier check wins: verification is complete before use, never partial', () => {
    const outcome = verifyPackage({ ...ALL_PASS, checksum: 'failed', validity: 'failed' })
    expect(outcome.trusted).toBe(false)
    if (outcome.trusted) throw new Error('unreachable')
    expect(outcome.blockedAt).toBe('checksum')
    expect(sourceLine(79599)).toContain(
      'Verification is complete before activation and never partial during execution.',
    )
    expect(sourceLine(79600)).toContain(
      'The activation path fails closed when verification cannot produce a positive result.',
    )
  })

  it('every gauntlet failure class is one of the first five rows of the table', () => {
    expect(VERIFICATION_GAUNTLET.map((s) => s.failureClass)).toEqual(
      FAILURE_TABLE.slice(0, 5).map((r) => r.id),
    )
  })
})

describe('the five worker-facing rejection messages, and the eleven that fan into them', () => {
  it('the message table is three columns and five rows at L79567', () => {
    expect(cellsOf(79567)).toEqual([...REJECTION_MESSAGE_COLUMNS])
    expect(REJECTION_MESSAGES).toHaveLength(5)
    let n = 79569
    while (sourceLine(n).startsWith('|')) n += 1
    expect(n - 79569).toBe(5)
  })

  it.each(REJECTION_MESSAGES.map((m) => [m.id, m.line] as const))(
    'every cell of the %s message at L%d matches the source',
    (id, line) => {
      const row = REJECTION_MESSAGES.find((m) => m.id === id)
      expect(row).toBeDefined()
      REJECTION_MESSAGE_COLUMNS.forEach((column, index) => {
        expect(row?.cells[column]).toBe(cell(line, index))
      })
    },
  )

  it('eleven rows fan in to five messages: four share Expired or revoked, three have none', () => {
    const mapped = FAILURE_TABLE.map((r) => r.rejectionMessage)
    expect(mapped.filter((m) => m === null)).toHaveLength(3)
    expect(mapped.filter((m) => m === 'expired-or-revoked')).toHaveLength(4)
    expect(new Set(mapped.filter((m) => m !== null)).size).toBe(5)
    // The three with none are exactly the three whose terminal safe state opens
    // `Not applicable`, because nothing is refused.
    for (const row of FAILURE_TABLE) {
      const notApplicable = row.cells['Terminal safe state'].startsWith('`Not applicable')
      expect(row.rejectionMessage === null).toBe(notApplicable)
      expect(rejectionMessage(row.id) === null).toBe(notApplicable)
    }
  })

  it('the shared message is the one whose Rejection cell names both cases', () => {
    expect(cell(79573, 0)).toBe('Expired or revoked')
    for (const id of ['expiry', ...REVOCATION_ROW_ORDER] as const) {
      expect(rejectionMessage(id)?.line).toBe(79573)
    }
  })
})

describe('signing is not a V1 fact, and this module does not respell the reading', () => {
  it('the Tampering row still reads exactly as the source writes it', () => {
    // Carried as written; not deleted, not softened, not made conditional.
    const tampering = failureClass('tampering')
    expect(tampering.cells.Detection).toBe('Signature verification failure')
    expect(tampering.cells.Detection).toBe(cell(79582, 1))
    expect(TAMPERING_DETECTION_DEPENDENCY.rowLine).toBe(tampering.line)
  })

  it('THERE IS ONE COPY OF THE CLASSIFICATION LIST AND IT IS NOT THIS FILE’S', () => {
    // Referential identity, so a local copy — however faithful — turns this red.
    expect(TAMPERING_DETECTION_DEPENDENCY.classifications).toBe(PACKAGE_SIGNING_CLASSIFICATIONS)
    expect(TAMPERING_DETECTION_DEPENDENCY.notABaseline).toBe(SIGNING_IS_NOT_A_BASELINE)
    expect(SIGNING_IS_NOT_A_BASELINE).toContain('not a baseline')
  })

  it('BOTH readings still stand in the tree — collapsing either turns this red', () => {
    const texts = PACKAGE_SIGNING_CLASSIFICATIONS.map((r) => r.text).join('\n')
    expect(texts).toContain('Derived Clarification')
    expect(texts).toContain('Recommendation — R&D')
    expect(texts).toContain('Not specified in the Statement of Work')
    // The two lines that contradict outright must both be among the locators.
    const locators = PACKAGE_SIGNING_CLASSIFICATIONS.map((r) => r.locator).join(' ')
    expect(locators).toContain('L89249')
    expect(locators).toContain('L104000')
    expect(sourceLine(89249)).toContain('package signing is `Derived Clarification`')
    expect(sourceLine(77447)).toContain(
      'Signing and integrity validation are not specified in the Statement of Work.',
    )
    // Every line any of them names is real and non-blank.
    for (const reading of PACKAGE_SIGNING_CLASSIFICATIONS) {
      const lines = [...reading.locator.matchAll(/L(\d{3,6})/g)].map((m) => Number(m[1]))
      expect(lines.length).toBeGreaterThan(0)
      for (const n of lines) expect(sourceLine(n).trim()).not.toBe('')
    }
  })

  it('the detection waits on three decisions, each carded once and elsewhere', () => {
    expect(TAMPERING_DETECTION_DEPENDENCY.conditionalOn).toEqual([
      'DEC-PKGSIGN-001',
      'DEC-PKGMAN-001',
      'DEC-SEC-015',
    ])
    // Each is disclosed by the manifest module, and by exactly one record there.
    for (const ref of TAMPERING_DETECTION_DEPENDENCY.conditionalOn) {
      const held = PACKAGE_MANIFEST_DISCLOSURES.filter((d) => d.decisionRef === ref)
      expect(held).toHaveLength(1)
    }
    // And none of the three is respelled here.
    for (const ref of TAMPERING_DETECTION_DEPENDENCY.conditionalOn) {
      expect(PACKAGE_INTEGRITY_LOCAL_DECISION_IDS).not.toContain(ref)
    }
    expect(sourceLine(61208)).toContain('DEC-PKGSIGN-001')
    expect(sourceLine(79652)).toContain('DEC-PKGMAN-001')
    expect(sourceLine(105458)).toContain('DEC-SEC-015')
    expect(sourceLine(79652)).toContain(
      'The source defines no manifest, no signature, no revocation mechanism and no retry bound.',
    )
  })

  it('nothing in the module treats an unsigned package as verified', () => {
    // The signature result has no default, so it cannot be skipped: an object
    // without the key blocks, and a `failed` signature is never `trusted`.
    const outcome = verifyPackage({
      checksum: 'passed',
      signature: 'failed',
      scope: 'passed',
      compatibility: 'passed',
      validity: 'passed',
    })
    expect(outcome.trusted).toBe(false)
    if (outcome.trusted) throw new Error('unreachable')
    expect(outcome.failureClass).toBe('tampering')
    expect(outcome.rePullPermitted).toBe(false)
  })
})

describe('AC-PKG-606 and TEST-PKG-702 — no undecided value is implemented', () => {
  const MODULE_PATH = join(process.cwd(), 'src', 'offline', 'package', 'integrity.ts')
  const MODULE_SRC = readFileSync(MODULE_PATH, 'utf8')

  /**
   * Every numeric literal in the module, with the property key it is assigned
   * to. Asked of the TypeScript parser rather than a regex, so a number in a
   * comment or a string is not counted and a number in code cannot hide in one.
   */
  const numericLiterals = (): readonly { readonly text: string; readonly key: string | null }[] => {
    const file = ts.createSourceFile(MODULE_PATH, MODULE_SRC, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
    const found: { text: string; key: string | null }[] = []
    const keyOf = (node: ts.Node): string | null => {
      let cursor: ts.Node | undefined = node.parent
      while (cursor !== undefined) {
        if (ts.isPropertyAssignment(cursor)) return cursor.name.getText(file)
        if (!ts.isArrayLiteralExpression(cursor) && !ts.isPrefixUnaryExpression(cursor)) return null
        cursor = cursor.parent
      }
      return null
    }
    const walk = (node: ts.Node): void => {
      if (ts.isNumericLiteral(node)) found.push({ text: node.text, key: keyOf(node) })
      ts.forEachChild(node, walk)
    }
    walk(file)
    return found
  }

  /** Locator and count fields. Anything else is a value the source has not fixed. */
  const ALLOWED_KEYS = new Set([
    'line',
    'diagramLine',
    'manifestFieldLines',
    'claimedAt',
    'nearestReasonLine',
    'rowLine',
    'headerLine',
    'separatorLine',
    'firstDataLine',
    'lastDataLine',
    'columns',
    'dataRows',
  ])

  it('the gate can see the numbers it is policing', () => {
    // A scan that found nothing would pass forever. Slice 7 shipped a helper
    // whose only firing branch could not fire.
    const literals = numericLiterals()
    expect(literals.length).toBeGreaterThan(20)
    expect(literals.some((l) => l.key === 'line')).toBe(true)
  })

  it('no numeric literal exists that is not a frozen-source locator or a counted shape', () => {
    const strays = numericLiterals().filter((l) => l.key === null || !ALLOWED_KEYS.has(l.key))
    expect(strays).toEqual([])
  })

  it('every locator-shaped literal names a real line of the frozen source', () => {
    for (const literal of numericLiterals()) {
      if (literal.key === 'columns' || literal.key === 'dataRows') continue
      const n = Number(literal.text)
      expect(n).toBeGreaterThan(0)
      expect(n).toBeLessThanOrEqual(SOURCE_LINES.length)
      expect(sourceLine(n).trim()).not.toBe('')
    }
  })

  it('AC-PKG-606 says so on its own line, and the retry bound is under DEC-PKGMAN-001', () => {
    expect(sourceLine(79604)).toContain(
      'No retry bound, expiry value or validity horizon is implemented before its decision is taken.',
    )
    expect(sourceLine(79523)).toContain('`TBD — Client Decision Required` under `DEC-PKGMAN-001`')
    expect(failureClass('expiry').cells['Source status']).toBe(
      '`Client Decision Required — DEC-PKGEXP-001`',
    )
  })
})

describe('the open decisions of §35.7', () => {
  it('the two canon decisions resolve through the canon, with their own readings', () => {
    for (const id of PACKAGE_INTEGRITY_CANON_DECISIONS) {
      expect(OPEN_DECISION_IDS).toContain(id)
      const record = decisionRecord(id)
      expect(record.decisionRef).toBe(id)
      expect(record.readings.length).toBeGreaterThan(0)
      expect(record.adopted.length).toBeGreaterThan(0)
    }
    // And §35.7 is where this section meets them.
    expect(sourceLine(79626)).toContain('`DEC-LIB-001` — library pointer propagation against package pinning')
    expect(sourceLine(79624)).toContain('`DEC-WIDIFF-001` — offline packaging of work-instruction difficulty levels')
  })

  it('THE STAND-INS ARE BUILT TO EXPIRE: every local identifier is ABSENT from the canon', () => {
    expect(PACKAGE_INTEGRITY_LOCAL_DECISION_IDS.length).toBe(3)
    for (const id of PACKAGE_INTEGRITY_LOCAL_DECISION_IDS) {
      expect(OPEN_DECISION_IDS).not.toContain(id)
    }
    // The canon is non-empty and holds the two above, so "not contained" is a
    // real answer rather than an empty list agreeing with everything.
    expect(OPEN_DECISION_IDS.length).toBeGreaterThan(20)
    expect(OPEN_DECISION_IDS).toContain('DEC-LIB-001')
  })

  it('every local disclosure carries every obligation the shared renderer discharges', () => {
    for (const record of PACKAGE_INTEGRITY_LOCAL_DISCLOSURES) {
      expect(record.decisionRef).toMatch(/^DEC-[A-Z]+-\d{3}$/)
      expect(record.readings.length).toBeGreaterThan(0)
      expect(record.question.length).toBeGreaterThan(0)
      expect(record.adopted).toContain('client-delegated choice under APP-012')
      expect(record.whyHere.length).toBeGreaterThan(0)
      expect(record.canonNote).toContain('asserts the absence')
    }
  })

  it('every reading locator names a line, and every identifier-anchored one is on it', () => {
    const anchored = /^(DEC-[A-Z]+-\d{3}|AC-[A-Z]+-\d{3}|OFF-EVT-\d{2}) · L(\d{3,6})/
    let anchoredCount = 0
    for (const record of PACKAGE_INTEGRITY_LOCAL_DISCLOSURES) {
      for (const reading of record.readings) {
        const lines = [...reading.locator.matchAll(/L(\d{3,6})/g)].map((m) => Number(m[1]))
        expect(lines.length).toBeGreaterThan(0)
        for (const n of lines) expect(sourceLine(n).trim()).not.toBe('')
        const match = anchored.exec(reading.locator)
        if (match !== null) {
          anchoredCount += 1
          expect(sourceLine(Number(match[2]))).toContain(match[1])
        }
      }
    }
    // The anchored branch must actually fire, or this test proves nothing.
    expect(anchoredCount).toBeGreaterThanOrEqual(3)
  })

  it('the three §35.7 cards this file owns are the ones no sibling carded, on their own lines', () => {
    const cards: readonly (readonly [string, number])[] = [
      ['DEC-PKGEXP-001', 79650],
      ['DEC-BUNDLE-001', 79648],
      ['DEC-OFFASSIGN-001', 79654],
    ]
    expect(cards.map(([id]) => id)).toEqual([...PACKAGE_INTEGRITY_LOCAL_DECISION_IDS])
    for (const [id, line] of cards) expect(sourceLine(line)).toContain(id)
  })

  it('§35.7 opens at L79616 and its Client Decision Required table is where the brief said', () => {
    expect(sourceLine(79616)).toContain('35.7 The open decisions this architecture cannot resolve')
    expect(sourceLine(79512)).toContain(
      '35.6 Integrity, revocation, replacement, rollback and incompatible versions',
    )
    for (const [line, value] of [
      [79639, 'Qualification enforcement posture'],
      [79640, 'Clearance duration'],
      [79641, 'Offline trust window'],
      [79642, 'Clock-skew threshold'],
    ] as const) {
      expect(cell(line, 0)).toBe(value)
      expect(cell(line, 2)).toBe('`Client Decision Required — DEC-PKGFIELD-001`')
    }
  })
})
