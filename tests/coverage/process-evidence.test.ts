/**
 * THE PROCESS-EVIDENCE GATE — the first thing in this repository that reads the
 * evidence layer.
 *
 * Round 6, stream B, in one command:
 *
 *   grep -rn "process/ledgers\|process/audits" tests/ scripts/ src/ app/ package.json
 *     -> 0
 *
 * Thirty-one release gates, every one pointed at the product, and none at the
 * evidence that the product was reviewed. Both candidate manifests named a
 * candidate seven slices back — 185 of 365 product entries drifted, the envelope
 * naming slice 2b with one payload file a schema change had retired — and
 * `RESUME` §8 read "all dispositioned and fixed" for two rounds while the only
 * disposition table on disk recorded 7 OPEN and 6 PARTIAL. Master prompt §29.5
 * requires the final response to state exact Candidate IDs and hashes and §29.4
 * conditions 5 and 6 turn on the disposition record, so both artefacts were load
 * bearing for the closing obligation and neither could be evaluated.
 *
 * ── WHAT THIS GATE PROVES, AND WHAT IT DOES NOT ────────────────────────────
 *
 * IT PROVES the manifests describe the tree they sit in: every byte they
 * certify hashes to what they say, and the two file sets TOGETHER equal every
 * path git accounts for, so a file quietly dropped from a manifest reds instead
 * of shrinking a population. It proves each register's findings all have a
 * verdict, that the verdicts and bases come from closed vocabularies, that no
 * `OPEN` or `PARTIAL` row is recorded without a reason and an owner, and that
 * each register's declared severity split matches the enumeration beside it.
 *
 * IT DOES NOT PROVE A REVIEW HAPPENED. It cannot. A manifest is a fingerprint,
 * and a fingerprint of an unreviewed tree is a perfectly valid fingerprint. Nor
 * does it prove any verdict is CORRECT: 82 of the 141 rows carry basis
 * `REGISTER`, meaning "closed because a later register said so", and this gate
 * checks that the basis is DECLARED, never that the closure is real.
 *
 * ── IT IS NOT SATISFIABLE BY RESEALING, AND THAT IS DELIBERATE ─────────────
 *
 * `node scripts/seal-manifests.mjs` makes cases 1 to 5 green by construction —
 * that is what a seal is for. It cannot touch cases 6 to 12: those compare the
 * disposition record against the REGISTERS, which the seal script never reads
 * and never writes. So the half of this gate that is about honesty rather than
 * about bytes survives any reseal, and a reseal run to silence a drift failure
 * leaves a `worktree_clean` field and a new Candidate ID behind saying it
 * happened.
 *
 * ── PLANTS. Every one real, every one restored byte-exact against a sha256 ──
 *
 *  P1  One hash in the product manifest altered by a single hex digit.
 *      RED  case 2, naming `app/page.tsx` and nothing else.
 *  P2  One entry deleted from the product manifest's `files` array.
 *      RED  case 1, `- "app/page.tsx"` — the partition equality, in the
 *           direction a count or a floor cannot see.
 *  P3  One row deleted from the round-1 disposition table.
 *      RED  case 7, naming `C-19` as enumerated by the register and
 *           dispositioned nowhere.
 *  P4  One `OPEN` row's owner column emptied.
 *      RED  case 10, naming the id.
 *
 * The restorations are asserted, not assumed: each plant re-reads the file after
 * its `finally` and compares the sha256 to the one taken before.
 */
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'

const ROOT = process.cwd()
const LEDGERS = 'docs/process/ledgers'
const AUDITS = 'docs/process/audits'
const PRODUCT_MANIFEST = `${LEDGERS}/product-candidate-manifest.json`
const ENVELOPE_MANIFEST = `${LEDGERS}/evidence-envelope-manifest.json`
const DISPOSITIONS = `${AUDITS}/2026-08-25-slice-11-audit-dispositions-rounds-1-6.md`

const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8')
const sha256 = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex')

interface Entry {
  readonly path: string
  readonly bytes: number
  readonly sha256: string
}
interface Product {
  readonly candidate_id: string
  readonly candidate_manifest_sha256: string
  readonly scope: { readonly evidence_roots: readonly string[]; readonly hashes_itself: boolean }
  readonly file_count: number
  readonly files: readonly Entry[]
}
interface Envelope {
  readonly envelope_id: string
  readonly candidate_id: string
  readonly payload_sha256: string
  readonly scope: { readonly excludes: readonly string[] }
  readonly payload_count: number
  readonly payload: readonly Entry[]
}

const product = JSON.parse(read(PRODUCT_MANIFEST)) as Product
const envelope = JSON.parse(read(ENVELOPE_MANIFEST)) as Envelope

/**
 * Every path git accounts for: tracked, PLUS untracked-and-not-ignored so a new
 * file nobody has committed is still inside a scope. Probe entries removed by
 * the one shared predicate — nine release gates plant `.zz-probe-<pid>` files on
 * the real filesystem and a concurrent run's probe must not red this equality.
 */
const repoFiles = (): readonly string[] =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
    .split('\n')
    .filter((p) => p !== '' && !p.split('/').some((seg) => isForeignProbe(seg)))
    .sort()

const isEvidence = (path: string): boolean =>
  product.scope.evidence_roots.some((root) => path.startsWith(root))

/**
 * Plant `text` at `path`, run `check`, restore. The restoration is COMPARED,
 * not trusted: this build has twice discarded an uncommitted fix by restoring
 * a file it had not hashed first.
 */
function planted(path: string, mutate: (text: string) => string, check: () => void): void {
  const before = read(path)
  const digest = sha256(before)
  const after = mutate(before)
  expect(after, `the plant on ${path} changed nothing, so a green run proves nothing`).not.toBe(
    before,
  )
  try {
    writeFileSync(join(ROOT, path), after)
    check()
  } finally {
    writeFileSync(join(ROOT, path), before)
  }
  expect(sha256(read(path)), `${path} was not restored byte-exact`).toBe(digest)
}

/* ==================================================================== *
 * PART ONE — THE TWO HASH SCOPES (master prompt §23.2, finding R6-B04)
 * ==================================================================== */

describe('the candidate manifests describe the tree they sit in', () => {
  const files = repoFiles()

  // Case 1. THE PARTITION, BY EQUALITY IN BOTH DIRECTIONS. Not a count and not
  // a floor: the claim is that these two manifests between them name EVERY file,
  // so a path dropped from one and absent from the other has to red. A count
  // would pass on a swap; a floor would pass on a deletion.
  it('the two scopes are a total partition of the repository, by equality', () => {
    expect(files.length, 'git listed nothing; the derivation is broken, not the manifest')
      .toBeGreaterThan(1000)
    const expectedProduct = files.filter((f) => !isEvidence(f))
    const expectedEnvelope = files.filter((f) => isEvidence(f) && f !== ENVELOPE_MANIFEST)

    expect(product.files.map((e) => e.path)).toEqual(expectedProduct)
    expect(envelope.payload.map((e) => e.path)).toEqual(expectedEnvelope)
    // And the partition is total: nothing is in both, nothing in neither.
    expect(
      [...expectedProduct, ...expectedEnvelope, ENVELOPE_MANIFEST].sort(),
    ).toEqual(files)
  })

  // Case 2. THE HASHES. Named offenders, never a count — "expected 365 to be
  // 180" told a reader nothing about which bytes had moved, which is how this
  // manifest stayed seven slices stale behind an exit 0.
  it('every byte both manifests certify hashes to what they say', () => {
    const drifted: string[] = []
    for (const entry of [...product.files, ...envelope.payload]) {
      let actual: string
      try {
        actual = sha256(readFileSync(join(ROOT, entry.path)))
      } catch {
        drifted.push(`${entry.path} (missing)`)
        continue
      }
      if (actual !== entry.sha256) drifted.push(entry.path)
    }
    expect(drifted, 'the candidate changed after it was sealed; reseal and re-verify').toEqual([])
  })

  // Case 3. NON-SELF-REFERENCE, both directions of §23.2's rule.
  it('neither manifest hashes itself', () => {
    expect(product.scope.hashes_itself).toBe(false)
    expect(product.files.map((e) => e.path)).not.toContain(PRODUCT_MANIFEST)
    expect(envelope.payload.map((e) => e.path)).not.toContain(ENVELOPE_MANIFEST)
    expect(envelope.scope.excludes).toEqual([ENVELOPE_MANIFEST])
    // The product manifest IS evidence payload, and the envelope must carry it:
    // that binding is the only thing tying the seal of one to the seal of the
    // other, and dropping it would let the candidate move under a valid envelope.
    expect(envelope.payload.map((e) => e.path)).toContain(PRODUCT_MANIFEST)
  })

  // Case 4. THE ENVELOPE IS BOUND TO ONE CANDIDATE ID. §23.2: an evidence-only
  // correction reseals the envelope and PRESERVES the Candidate ID; a
  // candidate-byte change creates a new one. Either way these must agree.
  it('the envelope names the candidate the product manifest declares', () => {
    expect(envelope.candidate_id).toBe(product.candidate_id)
    expect(product.candidate_id).toMatch(/^SLICE\d\d-[0-9a-f]{16}$/)
    expect(envelope.envelope_id).toMatch(/^ENV\d\d-[0-9a-f]{16}$/)
  })

  // Case 5. THE DIGESTS ARE DERIVED FROM THE ENTRIES, so a hand-edited digest
  // reds and the Candidate ID cannot be typed. Recomputed here by the same rule
  // the seal script states, rather than read back from the field it is checking.
  it('each scope digest is the digest of its own entry list, and the Candidate ID is its prefix', () => {
    const digestOf = (entries: readonly Entry[]): string =>
      sha256(entries.map((e) => `${e.path}\0${e.sha256}\n`).join(''))
    expect(digestOf(product.files)).toBe(product.candidate_manifest_sha256)
    expect(digestOf(envelope.payload)).toBe(envelope.payload_sha256)
    expect(product.candidate_id.endsWith(product.candidate_manifest_sha256.slice(0, 16))).toBe(true)
    expect(envelope.envelope_id.endsWith(envelope.payload_sha256.slice(0, 16))).toBe(true)
    expect(product.file_count).toBe(product.files.length)
    expect(envelope.payload_count).toBe(envelope.payload.length)
  })

  it('P1/P2 — a drifted hash and a dropped entry both red, naming the offender', () => {
    const victim = 'app/page.tsx'
    expect(product.files.some((e) => e.path === victim), 'the plant target left the manifest')
      .toBe(true)

    // THE DELTA, NOT THE SET. Asserting `drifted === [victim]` would make this
    // plant fail whenever anything else in the candidate is legitimately dirty,
    // and a plant that reds for the wrong reason is no evidence at all. The
    // baseline is taken first and the plant must add EXACTLY the victim to it.
    const driftedNow = (m: Product): string[] =>
      m.files.filter((e) => sha256(readFileSync(join(ROOT, e.path))) !== e.sha256).map((e) => e.path)
    const baseline = driftedNow(product)
    expect(baseline, 'the plant target is already drifting').not.toContain(victim)

    planted(PRODUCT_MANIFEST, (text) => {
      const m = JSON.parse(text) as { files: Entry[] }
      m.files = m.files.map((e) =>
        e.path === victim ? { ...e, sha256: `${e.sha256.slice(0, -1)}${e.sha256.endsWith('0') ? '1' : '0'}` } : e,
      )
      return `${JSON.stringify(m, null, 2)}\n`
    }, () => {
      const replanted = JSON.parse(read(PRODUCT_MANIFEST)) as Product
      expect(driftedNow(replanted).filter((p) => !baseline.includes(p))).toEqual([victim])
    })

    planted(PRODUCT_MANIFEST, (text) => {
      const m = JSON.parse(text) as { files: Entry[] }
      m.files = m.files.filter((e) => e.path !== victim)
      return `${JSON.stringify(m, null, 2)}\n`
    }, () => {
      const replanted = JSON.parse(read(PRODUCT_MANIFEST)) as Product
      const expected = files.filter((f) => !isEvidence(f))
      expect(replanted.files.map((e) => e.path)).not.toEqual(expected)
      expect(expected.filter((f) => !replanted.files.some((e) => e.path === f))).toEqual([victim])
    })
  })
})

/* ==================================================================== *
 * PART TWO — THE DISPOSITION RECORD (master prompt §29.4 conditions 5
 * and 6, finding R6-B06)
 * ==================================================================== */

/** The six registers, by round. An equality, so a seventh round reds until it is filed. */
const REGISTERS: Readonly<Record<string, string>> = {
  '1': `${AUDITS}/2026-08-24-slice-11-audit-findings.md`,
  '2': `${AUDITS}/2026-08-24-slice-11-audit-round-2-findings.md`,
  '3': `${AUDITS}/2026-08-25-slice-11-audit-round-3-findings.md`,
  '4': `${AUDITS}/2026-08-25-slice-11-audit-round-4-findings.md`,
  '5': `${AUDITS}/2026-08-25-slice-11-audit-round-5-findings.md`,
  '6': `${AUDITS}/2026-08-25-slice-11-audit-round-6-findings.md`,
}

/**
 * Rounds 2 and 3 record their findings in PROSE and carry no per-finding
 * heading. Named here rather than inferred from an empty result, because "this
 * register enumerates nothing" and "this register's headings stopped matching"
 * are indistinguishable to a parser and only one of them is acceptable.
 */
const PROSE_ROUNDS = ['2', '3'] as const

const SEVERITIES = ['Critical', 'Important', 'Moderate', 'Minor'] as const
const VERDICTS = ['CLOSED', 'OPEN', 'PARTIAL'] as const
const BASES = ['MEASURED', 'REGISTER'] as const

const SEV = SEVERITIES.join('|')
/** `### C-00 · Critical · …` — how rounds 1 and 4-6 enumerate a finding. */
const HEADING = new RegExp(String.raw`^### ([A-Za-z0-9-]+) · (${SEV}) ·`, 'gm')
/** `| R4-01 | Critical | …` — round 4's stream-A summary table uses this form. */
const SEV_ROW = new RegExp(String.raw`^\| *([A-Za-z0-9-]+) *\| *(${SEV}) *\|`, 'gm')

/** Every finding id a register enumerates, with its severity. */
function enumerated(round: string): ReadonlyMap<string, string> {
  const text = read(REGISTERS[round]!)
  const found = new Map<string, string>()
  for (const pattern of [HEADING, SEV_ROW]) {
    for (const m of text.matchAll(pattern)) if (!found.has(m[1]!)) found.set(m[1]!, m[2]!)
  }
  return found
}

interface Row {
  readonly round: string
  readonly id: string
  readonly severity: string
  readonly verdict: string
  readonly basis: string
  readonly heldBy: string
  readonly evidence: string
  readonly owner: string
}

/** The disposition tables, parsed under their own `## Round N` headings. */
function dispositionRows(text: string): readonly Row[] {
  const rows: Row[] = []
  let round = ''
  for (const line of text.split('\n')) {
    const heading = /^## Round (\d) /.exec(line)
    if (heading !== null) round = heading[1]!
    const cells = line.split('|').map((c) => c.trim())
    // 9 = leading empty, seven columns, trailing empty.
    if (cells.length !== 9 || cells[0] !== '' || round === '') continue
    if (!(VERDICTS as readonly string[]).includes(cells[3]!)) continue
    rows.push({
      round,
      id: cells[1]!,
      severity: cells[2]!,
      verdict: cells[3]!,
      basis: cells[4]!,
      heldBy: cells[5]!,
      evidence: cells[6]!,
      owner: cells[7]!,
    })
  }
  return rows
}

describe('every audit round has a disposition record that reconciles with its register', () => {
  const rows = dispositionRows(read(DISPOSITIONS))

  // Case 6. THE POSITIVE CONTROL, and it is not decoration: every case below
  // iterates `rows`, so a parser that silently matched nothing would make each
  // one pass over an empty set — the shape round 3 caught in a live gate.
  it('the disposition file parses, and covers exactly the six rounds with registers', () => {
    expect(rows.length).toBe(141)
    expect([...new Set(rows.map((r) => r.round))].sort()).toEqual(Object.keys(REGISTERS))
    expect(rows.map((r) => `${r.round}/${r.id}`)).toHaveLength(
      new Set(rows.map((r) => `${r.round}/${r.id}`)).size,
    )
  })

  // Case 7. REFERENTIAL INTEGRITY, by equality in both directions. A finding
  // enumerated by a register and dispositioned nowhere is R6-B06 exactly; a row
  // here for an id no register carries is the inverse and is just as wrong.
  it('every finding a register enumerates has exactly one row, and no row invents one', () => {
    for (const round of Object.keys(REGISTERS)) {
      const fromRegister = [...enumerated(round).keys()].sort()
      const fromTable = rows.filter((r) => r.round === round).map((r) => r.id).sort()
      if ((PROSE_ROUNDS as readonly string[]).includes(round)) {
        // These two enumerate nothing parseable; the recovery is the table's own
        // work and cannot be checked against the register. What IS checked is
        // that the register still enumerates nothing — a heading appearing in
        // one of them would silently escape every other case in this file.
        expect(fromRegister, `round ${round} now enumerates findings; fold them in`).toEqual([])
        expect(fromTable.length, `round ${round} lost its recovered rows`).toBeGreaterThan(0)
        continue
      }
      expect(fromTable, `round ${round}: register ids and disposition ids disagree`)
        .toEqual(fromRegister)
    }
  })

  // Case 8. THE SEVERITY THE REGISTER GAVE IT, not the one the table remembers.
  it('every row carries its register severity', () => {
    let checked = 0
    for (const round of Object.keys(REGISTERS)) {
      const severities = enumerated(round)
      for (const row of rows.filter((r) => r.round === round)) {
        const declared = severities.get(row.id)
        if (declared === undefined) continue
        expect(row.severity, `${row.id}`).toBe(declared)
        checked += 1
      }
    }
    expect(checked, 'no row was compared against a register severity').toBe(108)
  })

  // Case 9. THE COUNT DISCIPLINE ROUND 6 EXPOSED: a stated split that does not
  // match the enumeration beside it — stream A's "Six findings" over seven,
  // round 5's "Three Critical" over four, round 6's "Three Critical" over two,
  // and the round-1 disposition table's "26 CLOSED" over 29. The split is
  // RE-DERIVED from the register's own headings and compared to the sentence
  // that states it, so the next copied header reds.
  const DECLARED_CRITICAL: Readonly<Record<string, string | null>> = {
    // Rounds 1, 3 and 4 declare no register-wide Critical total. Recorded as
    // null rather than omitted: a round that starts declaring one must be
    // folded in here, and an entry that quietly disappears reds on the keys.
    '1': null,
    '2': null,
    '3': null,
    '4': null,
    '5': 'Four Critical.',
    '6': 'Two Critical.',
  }
  const WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']

  it('a register that declares a Critical total declares the one it enumerates', () => {
    expect(Object.keys(DECLARED_CRITICAL)).toEqual(Object.keys(REGISTERS))
    const declaring = Object.keys(DECLARED_CRITICAL).filter((r) => DECLARED_CRITICAL[r] !== null)
    expect(declaring, 'the set of registers declaring a Critical total changed').toEqual(['5', '6'])
    for (const round of declaring) {
      const count = [...enumerated(round).values()].filter((s) => s === 'Critical').length
      expect(DECLARED_CRITICAL[round], `round ${round}`).toBe(`${WORD[count]} Critical.`)
      expect(read(REGISTERS[round]!), `round ${round} no longer states its split`)
        .toContain(DECLARED_CRITICAL[round]!)
    }
  })

  // Case 10. §29.4 conditions 5 and 6, made evaluable. An OPEN or PARTIAL row
  // without an owner is a finding nobody is carrying, which is how ten of round
  // 1's thirteen ended up named in no later register.
  it('no finding is left open without a reason and an owner', () => {
    // THE GUARD IS ON THE PARSE, NOT ON THE OUTCOME. This read
    // `open.length > 0` and went red the first time the record reached a state
    // where nothing was open -- a gate that fails on the result it exists to
    // encourage. What must never silently become zero is the ROW COUNT: a
    // parse that matches nothing would satisfy every per-row loop below.
    expect(rows.length, 'the disposition parse matched nothing').toBeGreaterThan(100)
    const open = rows.filter((r) => r.verdict !== 'CLOSED')
    for (const row of open) {
      expect(row.evidence.length, `${row.id} is ${row.verdict} with no reason`).toBeGreaterThan(20)
      expect(row.owner, `${row.id} is ${row.verdict} and nobody owns it`).not.toBe('-')
      expect(row.owner.length, `${row.id}`).toBeGreaterThan(3)
    }
  })

  // Case 11. Closed vocabularies, so a typo cannot enter the record.
  //
  // VERDICT IS A SUBSET, THE OTHER TWO ARE EQUALITIES, and the difference is
  // not laziness. `OPEN` legitimately falls out of use the moment a round's
  // findings are all closed -- which is the state this loop exists to reach --
  // so requiring it to be exercised makes the gate red on success. A subset
  // still convicts a typo, which is the failure this case is for. `basis` and
  // `severity` have no such terminal state: a record with no `REGISTER` row or
  // no `Minor` finding would mean the enumeration changed under the gate.
  it('verdict and basis come from the two closed vocabularies', () => {
    const used = [...new Set(rows.map((r) => r.verdict))].sort()
    expect(used.filter((v) => !(VERDICTS as readonly string[]).includes(v))).toEqual([])
    expect(used, 'no row is closed at all').toContain('CLOSED')
    expect([...new Set(rows.map((r) => r.basis))].sort()).toEqual([...BASES].sort())
    expect([...new Set(rows.map((r) => r.severity))].sort()).toEqual([...SEVERITIES].sort())
  })

  // Case 12. THE BASIS SPLIT IS PUBLISHED, so the file cannot quietly upgrade
  // itself. 82 of 141 rows are closed on a register's word rather than on a
  // measurement, and the header says so in those words.
  it('the published MEASURED/REGISTER split is the measured one', () => {
    const measured = rows.filter((r) => r.basis === 'MEASURED').length
    const register = rows.filter((r) => r.basis === 'REGISTER').length
    expect(measured).toBe(59)
    expect(register).toBe(82)
    expect(read(DISPOSITIONS)).toContain(
      `**${measured} of the ${rows.length} enumerated rows are \`MEASURED\`; ${register} are \`REGISTER\`.**`,
    )
  })

  it('P3/P4 — a removed disposition row and an ownerless open finding both red', () => {
    const victim = rows.find((r) => r.round === '1' && r.id === 'C-19')
    expect(victim, 'the plant target left the round-1 table').toBeDefined()

    planted(DISPOSITIONS, (text) =>
      text.split('\n').filter((l) => !l.startsWith('| C-19 |')).join('\n'), () => {
      const replanted = dispositionRows(read(DISPOSITIONS))
      const ids = replanted.filter((r) => r.round === '1').map((r) => r.id).sort()
      expect(ids).not.toEqual([...enumerated('1').keys()].sort())
      expect([...enumerated('1').keys()].filter((i) => !ids.includes(i))).toEqual(['C-19'])
    })

    // P4 REOPENS A CLOSED ROW AND EMPTIES ITS OWNER, rather than emptying the
    // owner of a row that is already open. The original took the first `OPEN`
    // row it found and threw `undefined.id` the first time every finding was
    // closed -- the plant depended on the defect class still being present in
    // the record. This one manufactures the defect on a NAMED row, so it holds
    // whether or not anything is open, and the conviction is asserted against
    // that id alone.
    const reopened = rows.find((r) => r.round === '6' && r.verdict === 'CLOSED')!
    expect(reopened, 'the round-6 table lost every closed row').toBeDefined()
    const baselineOwnerless = rows
      .filter((r) => r.verdict !== 'CLOSED' && r.owner === '-')
      .map((r) => r.id)
    planted(DISPOSITIONS, (text) =>
      text.split('\n')
        .map((l) =>
          l.startsWith(`| ${reopened.id} |`)
            ? l.replace(' | CLOSED | ', ' | OPEN | ').replace(/\| [^|]+ \|$/, '| - |')
            : l,
        )
        .join('\n'), () => {
      const replanted = dispositionRows(read(DISPOSITIONS))
      const ownerless = replanted
        .filter((r) => r.verdict !== 'CLOSED' && r.owner === '-')
        .map((r) => r.id)
      expect(ownerless.filter((id) => !baselineOwnerless.includes(id))).toEqual([reopened.id])
    })
  })
})
