import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CC_DECISION_REGISTER,
  UNIVERSAL_CLAUSE_ROWS,
} from '@/surfaces/cc/decisions/register'
import { CC_LOCAL_DISCLOSURES } from '@/surfaces/cc/decisions/disclosure'
import {
  CC_LINK_OUT_CELLS,
  CC_MATRIX_COLUMNS,
  RESOLVED_BY_ROW_NOT_CELL,
  cellTextOf,
  linkOutsMisclassified,
} from '@/surfaces/cc/decisions/link-outs'

/**
 * THE DECISION CANON FOR `SURF-CC`, HELD AGAINST THE FROZEN SOURCE.
 *
 * Every count here is COUNTED. None is read off a span: the register's span
 * is eighteen lines and the register is sixteen rows, and six of this build's
 * brief errors were exactly that subtraction not being done.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE = readFileSync(SOURCE_PATH, 'utf8')
/**
 * 1-indexed: `LINES[n]` is line n. The trailing element a final newline
 * leaves behind is dropped, so `LINES.length - 1` is the line count `wc -l`
 * reports and not one more than it.
 */
const LINES = ((): readonly string[] => {
  const raw = SOURCE.split('\n')
  if (raw[raw.length - 1] === '') raw.pop()
  return ['', ...raw]
})()

/** `LINES[n]`, but a missing line is an error rather than `undefined`. */
const srcLine = (n: number): string => {
  const l = LINES[n]
  if (l === undefined) throw new Error(`no line ${n} in the frozen source`)
  return l
}

const CHAPTER_21_START = 34799
const CHAPTER_21_END = 39017
const REGISTER_FIRST = 38940
const REGISTER_LAST = 38957

const DEC_TOKEN = /DEC-[A-Z0-9]+-\d+/g

const idsIn = (from: number, to: number): ReadonlySet<string> =>
  new Set(LINES.slice(from, to + 1).join('\n').match(DEC_TOKEN) ?? [])

/**
 * Section ranges DERIVED from the source's own headings, never hardcoded: a
 * section runs from its heading to the line before the next heading of any
 * level. A hardcoded table would drift silently against a file that cannot
 * change, which is the wrong kind of safe.
 */
const SECTION_RANGES = ((): ReadonlyMap<string, readonly [number, number]> => {
  const heads: { readonly n: number; readonly key: string }[] = []
  for (let i = 1; i < LINES.length; i += 1) {
    const m = /^#{1,4} (\d+(?:\.\d+)*)[. ]/.exec(srcLine(i))
    if (m?.[1] !== undefined) heads.push({ n: i, key: m[1] })
  }
  const out = new Map<string, readonly [number, number]>()
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1]!.n - 1 : LINES.length - 1
    if (!out.has(h.key)) out.set(h.key, [h.n, end])
  })
  return out
})()

describe('the frozen source is the one this build was written against', () => {
  it('is 122,241 lines', () => {
    expect(LINES.length - 1).toBe(122241)
  })
})

describe("chapter 21's decision register, counted rather than inferred", () => {
  it('has a header row and a separator row before any data', () => {
    expect(srcLine(REGISTER_FIRST)).toContain('| Identifier | Status | Where it appears |')
    expect(srcLine(REGISTER_FIRST + 1)).toBe('|---|---|---|---|')
  })

  it('has SIXTEEN data rows, and the span is eighteen lines', () => {
    const body = LINES.slice(REGISTER_FIRST + 2, REGISTER_LAST + 1)
    expect(body.every((l) => l.startsWith('| `DEC-'))).toBe(true)
    expect(body).toHaveLength(16)
    expect(REGISTER_LAST - REGISTER_FIRST + 1).toBe(18)
  })

  it('stops where it stops — the line after the last row is not a row', () => {
    expect(srcLine(REGISTER_LAST + 1).startsWith('| `DEC-')).toBe(false)
  })

  it("agrees with the chapter's own coverage statement, five of them raised here", () => {
    expect(srcLine(38992)).toContain('sixteen decisions remain open, five of them raised here')
    const raisedHere = CC_DECISION_REGISTER.filter(
      (r) => r.standing === 'registered' && r.status === '**New, raised here**',
    )
    expect(raisedHere).toHaveLength(5)
  })

  it('is transcribed row for row, each at the line it claims', () => {
    const registered = CC_DECISION_REGISTER.filter((r) => r.standing === 'registered')
    expect(registered).toHaveLength(16)
    for (const row of registered) {
      const line = srcLine(row.line)
      expect(line, `${row.id} at L${row.line}`).toContain(`\`${row.id}\``)
      expect(line, `${row.id} status`).toContain(row.status)
      expect(line, `${row.id} where`).toContain(row.whereItAppears)
      expect(line, `${row.id} owner`).toContain(row.owner)
    }
  })
})

describe('seventeen identifiers in the chapter, and only ONE of them unregistered', () => {
  const chapterIds = idsIn(CHAPTER_21_START, CHAPTER_21_END)
  const registeredIds: ReadonlySet<string> = new Set(
    CC_DECISION_REGISTER.filter((r) => r.standing === 'registered').map<string>((r) => r.id),
  )

  it('references seventeen distinct DEC identifiers', () => {
    expect(chapterIds.size).toBe(17)
  })

  it('leaves exactly one of the seventeen out of the register, and it is DEC-CONTLAUNCH-001', () => {
    const unregistered = [...chapterIds].filter((id) => !registeredIds.has(id))
    expect(unregistered).toEqual(['DEC-CONTLAUNCH-001'])
  })

  it('names DEC-CONTLAUNCH-001 exactly once, in 21.7', () => {
    const hits = [...LINES.slice(CHAPTER_21_START, CHAPTER_21_END + 1).entries()].filter(([, l]) =>
      l.includes('DEC-CONTLAUNCH-001'),
    )
    expect(hits).toHaveLength(1)
    const range = SECTION_RANGES.get('21.7')
    if (range === undefined) throw new Error('no heading for 21.7')
    const at = (hits[0]?.[0] ?? -1) + CHAPTER_21_START
    expect(at).toBeGreaterThanOrEqual(range[0])
    expect(at).toBeLessThanOrEqual(range[1])
  })

  it('never names DEC-CLEAR-001 at all — a different kind of absence', () => {
    expect(chapterIds.has('DEC-CLEAR-001')).toBe(false)
    expect(srcLine(49887)).toContain('`DEC-CLEAR-001`')
  })

  it('leaves eighteen for this slice to disclose: sixteen, plus one, plus one', () => {
    expect(CC_DECISION_REGISTER).toHaveLength(18)
    expect(CC_DECISION_REGISTER.filter((r) => r.standing === 'named-unregistered')).toHaveLength(1)
    expect(CC_DECISION_REGISTER.filter((r) => r.standing === 'foreign')).toHaveLength(1)
    expect(new Set(CC_DECISION_REGISTER.map((r) => r.id)).size).toBe(18)
  })
})

describe('a decision reached through a coverage claim is not one its section states', () => {
  it('every numbered section a row claims really does name that identifier', () => {
    const misses: string[] = []
    for (const row of CC_DECISION_REGISTER) {
      for (const sec of row.whereItAppears.match(/\d+(?:\.\d+)+/g) ?? []) {
        const range = SECTION_RANGES.get(sec)
        if (range === undefined) {
          misses.push(`${row.id}: claims section ${sec}, which has no heading`)
          continue
        }
        if (!idsIn(range[0], range[1]).has(row.id)) {
          misses.push(`${row.id}: claims ${sec} (L${range[0]}-L${range[1]}), which never names it`)
        }
      }
    }
    expect(misses).toEqual([])
  })

  it('exactly two rows claim a universal the chapter text does not carry', () => {
    const universal = CC_DECISION_REGISTER.filter((r) => /\bevery\b/.test(r.whereItAppears)).map(
      (r) => r.id,
    )
    expect(universal).toEqual([...UNIVERSAL_CLAUSE_ROWS])
  })

  it('DEC-PLUS-001 is absent from at least one module section carrying a permission matrix', () => {
    const modules = ['21.5', '21.10', '21.11', '21.14']
    const withMatrix = modules.filter((s) => {
      const [a, b] = SECTION_RANGES.get(s)!
      return LINES.slice(a, b + 1).some((l) => l.startsWith('| Capability on this module |'))
    })
    expect(withMatrix.length).toBeGreaterThan(0)
    for (const s of withMatrix) {
      const [a, b] = SECTION_RANGES.get(s)!
      expect(idsIn(a, b).has('DEC-PLUS-001'), `${s} names DEC-PLUS-001`).toBe(false)
    }
  })
})

describe('the local disclosures, and the canon they must stay out of', () => {
  const CANON = readFileSync(join(process.cwd(), 'src/disclosure/decisions.ts'), 'utf8')

  it('discloses four decisions, each named by the register', () => {
    expect(CC_LOCAL_DISCLOSURES).toHaveLength(4)
    const known = new Set(CC_DECISION_REGISTER.map((r) => r.id))
    for (const d of CC_LOCAL_DISCLOSURES) expect(known.has(d.decisionRef)).toBe(true)
  })

  it('is ABSENT from the canon, every identifier of it', () => {
    const present = CC_LOCAL_DISCLOSURES.filter((d) => CANON.includes(d.decisionRef)).map(
      (d) => d.decisionRef,
    )
    expect(present).toEqual([])
  })

  it('carries exactly two readings on every disclosure, and no third can be added', () => {
    for (const d of CC_LOCAL_DISCLOSURES) {
      expect(d.position.readings, d.decisionRef).toHaveLength(2)
    }
  })

  it('never marks a winner: no reading carries a field beyond text and locator', () => {
    for (const d of CC_LOCAL_DISCLOSURES) {
      for (const r of d.position.readings) {
        expect(Object.keys(r).sort()).toEqual(['locator', 'text'])
      }
    }
  })

  it('every reading names a line, and that line carries its identifier', () => {
    for (const d of CC_LOCAL_DISCLOSURES) {
      for (const r of d.position.readings) {
        const ns = [...r.locator.matchAll(/L(\d+)/g)].map((m) => Number(m[1]))
        expect(ns.length, `${d.decisionRef} locator "${r.locator}"`).toBeGreaterThan(0)
        const named = [...r.locator.matchAll(DEC_TOKEN)].map((m) => m[0])
        expect(ns.some((n) => named.some((id) => srcLine(n).includes(id)))).toBe(true)
      }
    }
  })

  it('records an adopted position only where a named line adopts it', () => {
    const adopted = CC_LOCAL_DISCLOSURES.filter((d) => d.position.kind === 'adopted-in-source')
    expect(adopted).toHaveLength(1)
    for (const d of adopted) {
      if (d.position.kind !== 'adopted-in-source') throw new Error('unreachable')
      const line = srcLine(d.position.adoptedLine)
      expect(line).toContain('Option A, adopted on 2026-08-14')
      expect(line).toContain('because it is the safer reading')
      expect(line).toContain(
        'it is the only reading under which an offline worker receives containment guidance at the moment of a Severity 1 breach',
      )
    }
  })

  it('leaves no way to mark a winner on an open position', () => {
    for (const d of CC_LOCAL_DISCLOSURES) {
      if (d.position.kind !== 'open') continue
      expect(Object.keys(d.position).sort()).toEqual(['kind', 'readings'])
    }
  })
})

describe('a pointer that can point at itself is not a pointer', () => {
  it('every holder lives outside this directory and carries the decision’s own line', () => {
    const held = CC_LOCAL_DISCLOSURES.filter((d) => d.heldBy !== null)
    expect(held.length).toBeGreaterThan(0)
    for (const d of held) {
      const h = d.heldBy!
      expect(h.path.startsWith('src/surfaces/cc/decisions/'), `${d.decisionRef} holder`).toBe(false)
      const holder = readFileSync(join(process.cwd(), h.path), 'utf8')
      expect(holder, `${h.path} carries L${h.locatorLine}`).toContain(String(h.locatorLine))
      expect(srcLine(h.locatorLine)).toContain('DEC-SYNC-006')
    }
  })
})

describe('the conflict-list cap is raised twice, by two chapters, and settled by neither', () => {
  it('DEC-CONFLICTCAP-001 is raised by chapter 21 and registered by it', () => {
    expect(srcLine(38076)).toContain('Proposed identifier **`DEC-CONFLICTCAP-001`**')
    expect(srcLine(38955)).toContain('`DEC-CONFLICTCAP-001`')
  })

  it('DEC-SYNC-006 is raised by the source too, and is not this build’s coinage', () => {
    expect(srcLine(81737)).toContain('`DEC-SYNC-006`')
    expect(srcLine(81737)).toContain("The numeric cap on the sync-conflict review panel's visible list")
  })

  it('both sections carry the same six-word heading', () => {
    expect(srcLine(38048)).toContain('The Sync-Conflict Review Panel')
    expect(srcLine(80485)).toContain('The Sync-Conflict Review Panel')
  })

  it('their recommendations do not agree, which is why neither is chosen', () => {
    expect(srcLine(38076)).toContain(
      "Recommendation: option (a), because it keeps the action's effect identical to what the reviewer can see",
    )
    expect(srcLine(81737)).toContain(
      'A single platform value at V1, converting to tenant-set if feedback demands',
    )
    expect(srcLine(38076)).toContain('(c) make the cap a tenant setting above a platform floor')
  })
})

describe('the link-out cells, transcribed header-keyed', () => {
  it('every matrix these rows come from carries the same header, checked per matrix', () => {
    for (const cell of CC_LINK_OUT_CELLS) {
      let head = -1
      for (let i = cell.line; i > CHAPTER_21_START; i -= 1) {
        if (srcLine(i).startsWith('| Capability on this module |')) {
          head = i
          break
        }
        if (srcLine(i).startsWith('## ')) break
      }
      expect(head, `${cell.id} has a header above it`).toBeGreaterThan(0)
      const cols = srcLine(head)
        .split('|')
        .slice(2, -1)
        .map((c) => c.trim())
      expect(cols, `${cell.id} column order`).toEqual([...CC_MATRIX_COLUMNS])
    }
  })

  it('every row is the frozen line, byte for byte, and names its capability', () => {
    for (const cell of CC_LINK_OUT_CELLS) {
      expect(cell.rowText, `${cell.id} at L${cell.line}`).toBe(srcLine(cell.line))
      expect((cell.rowText.split('|')[1] ?? '').trim(), `${cell.id} capability`).toBe(cell.capability)
      expect(cellTextOf(cell), `${cell.id} column ${cell.column}`).not.toBe('')
    }
  })

  it('every cell begins with the token it declares', () => {
    for (const cell of CC_LINK_OUT_CELLS) {
      expect(cellTextOf(cell).startsWith(cell.token), `${cell.id}`).toBe(true)
    }
  })

  it('nothing is misclassified — the guard reads the cell’s own words, not the row’s claim', () => {
    expect(linkOutsMisclassified(CC_LINK_OUT_CELLS)).toEqual([])
  })

  it('the guard is reachable: a misclassified row is constructible and is caught', () => {
    const planted = CC_LINK_OUT_CELLS.map((c, i) =>
      i === 0 ? { ...c, sourceRequires: 'control' as const } : c,
    )
    expect(linkOutsMisclassified(planted)).toHaveLength(1)
  })

  it('twelve rows, and every one of them renders wrong under the one rendering rule', () => {
    expect(CC_LINK_OUT_CELLS).toHaveLength(13)
    expect(new Set(CC_LINK_OUT_CELLS.map((c) => c.line)).size).toBe(12)
    for (const cell of CC_LINK_OUT_CELLS) {
      expect(cell.sourceRequires).toBe('link')
      expect(cell.writeControlWouldDraw).not.toBe('link')
      expect(cell.writeControlWouldDraw).toBe(
        cell.token === 'Explicitly prohibited' ? 'absent' : 'control',
      )
    }
  })

  it('one row is both shapes at once — the same line, two columns, two wrong renderings', () => {
    const both = CC_LINK_OUT_CELLS.filter((c) => c.line === 36845)
    expect(both.map((c) => c.column).sort()).toEqual(['Quality Manager', 'Tenant Admin'])
    expect(new Set(both.map((c) => c.writeControlWouldDraw)).size).toBe(2)
  })

  it('AC-CC-221 forbids the DISPLAY being overridden, not reclassification itself', () => {
    expect(srcLine(37000)).toContain(
      'Severity displayed always equals the on-device classification; no server-side or agent value overrides it',
    )
    expect(srcLine(36845)).toContain('Allowed with conditions — at review time on the anomaly record')
  })

  it('the source states the required affordance in the positive, twice', () => {
    expect(srcLine(37781)).toContain(
      'Link to the Standards and Operations Studio for switching, never switch here',
    )
    expect(srcLine(37781)).toContain('Online: link rendered')
    expect(srcLine(37802)).toContain('each such control is a link to the Standards and Operations Studio')
  })

  it('exactly one cell is silent about its owner and is resolved by its row', () => {
    const OWNER_WORDS = [
      'Delivery Operations Hub',
      'Standards and Operations Studio',
      'Studio',
      'platform-side',
      'platform action',
      'tenant settings',
      'tenant configuration',
    ]
    const silent = CC_LINK_OUT_CELLS.filter(
      (c) => !OWNER_WORDS.some((w) => cellTextOf(c).includes(w)),
    ).map((c) => c.id)
    expect(silent).toEqual([...RESOLVED_BY_ROW_NOT_CELL])
    for (const c of CC_LINK_OUT_CELLS.filter((x) => silent.includes(x.id))) {
      expect(OWNER_WORDS.some((w) => c.rowText.includes(w))).toBe(true)
    }
  })

  it('three cells name two owners and choose neither', () => {
    const undecided = CC_LINK_OUT_CELLS.filter((c) => c.owner.kind === 'ambiguous')
    expect(undecided).toHaveLength(3)
    for (const c of undecided) {
      if (c.owner.kind !== 'ambiguous') throw new Error('unreachable')
      for (const cand of c.owner.candidates) expect(cellTextOf(c)).toContain(cand)
    }
  })
})
