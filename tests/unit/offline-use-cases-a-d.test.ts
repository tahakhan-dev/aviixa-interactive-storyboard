import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { OPEN_DECISIONS } from '@/disclosure/decisions'
import {
  AC_37A_005_CRITERION,
  BARE_NOT_APPLICABLE_OUTSIDE_AC_37A_005,
  CATALOGUE_TOTAL,
  DIAGRAM_BLOCK_CENSUS,
  GROUP_D_REUSE_UNDERCOUNT,
  GROUP_HEADING_COUNTS,
  OFFLINE_USE_CASES_A_D,
  PERMISSION_LINES_BY_CROSS_REFERENCE,
  PERMISSION_STATUSES,
  PERMISSION_STATUS_CELLS,
  PERMISSION_STATUS_CENSUS,
  REGISTRY_DEMONSTRATION_NOTE,
  STORYBOARD_SCREENS_OUTSIDE_THE_SHARED_SET,
  USE_CASE_GROUPS,
  USE_CASE_LOCAL_DISCLOSURES,
  diagramFor,
  isPermissionStatus,
  permissionStatusesIn,
  useCase,
  useCasesInGroup,
  type PermissionStatus,
} from '@/offline/use-cases/group-a-d/catalogue'
import { isForeignProbe } from '../probe-paths'

/**
 * §37A groups A-D, checked against the frozen source rather than against the
 * task brief — whose arithmetic was wrong about which group is not ten, and
 * which asserted this module could move a registry it cannot reach.
 *
 * WHAT IS COUNTED HERE IS COUNTED, NEVER INFERRED FROM A SPAN. Every count
 * below re-derives from the document at test time: entry headings are matched,
 * mermaid fences are matched, table rows are matched. A span like L81282-L81495
 * says where the group is, not how many entries it holds, and six of this
 * slice's controller errors came from reading one as the other.
 *
 * The plant campaign that proved these can fail is recorded at the foot of the
 * file.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

/** §37A opens here and the next chapter heading closes it. */
const CATALOGUE_OPENS = 81202
const CATALOGUE_ENDS = 81721

/** `### 37A.n Group X — …`, in document order. */
const GROUP_HEADINGS = /^### 37A\.(\d) Group ([A-G]) — (.+)$/

/**
 * An entry heading. The catalogue writes every one of the seventy the same
 * way: the identifier in backticks, an em dash, the title, all bolded, at the
 * start of the line. `UC-OFF-036` (L81466) is the one entry whose fields do not
 * all sit on its heading line — its own diagram interrupts it and the rest
 * resumes at L81486 — so `bodyOf` joins the two.
 */
const ENTRY_HEADING = /^\*\*`(UC-OFF-\d{3})` — (.*?)\.?\*\* /
const SPILLOVER = { 'UC-OFF-036': 81486 } as const

const bodyOf = (entry: { readonly id: string; readonly sourceLine: number }): string => {
  const spill = SPILLOVER[entry.id as keyof typeof SPILLOVER]
  return spill === undefined
    ? sourceLine(entry.sourceLine)
    : `${sourceLine(entry.sourceLine)} ${sourceLine(spill)}`
}

/** Every entry heading in the whole catalogue, bucketed by its own group. */
function headingsByGroup(): ReadonlyMap<string, readonly string[]> {
  const byGroup = new Map<string, string[]>()
  let current: string | null = null
  for (let n = CATALOGUE_OPENS; n <= CATALOGUE_ENDS; n += 1) {
    const heading = GROUP_HEADINGS.exec(sourceLine(n))
    if (heading !== null) {
      current = heading[2] ?? null
      if (current !== null && !byGroup.has(current)) byGroup.set(current, [])
      continue
    }
    const entry = ENTRY_HEADING.exec(sourceLine(n))
    if (entry === null || current === null) continue
    byGroup.get(current)?.push(entry[1] ?? '')
  }
  return byGroup
}

describe('the catalogue counts, re-derived from the frozen source', () => {
  it('every one of the seven groups holds exactly ten entry headings, and there are seventy', () => {
    const byGroup = headingsByGroup()
    expect([...byGroup.keys()]).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])

    // The row-by-row assertion, not a total. A total is satisfied by moving an
    // entry from one group to another; this is not.
    for (const row of GROUP_HEADING_COUNTS) {
      expect(byGroup.get(row.group), `group ${row.group}`).toHaveLength(row.headings)
    }
    expect([...byGroup.values()].flat()).toHaveLength(CATALOGUE_TOTAL)

    // And the identifiers themselves, in order, with no gap and no repeat --
    // the check a length cannot make. `UC-OFF-036` is named inside group E's
    // span at L81532, which is why a span scan reports eleven for E and this
    // reports ten.
    const all = [...byGroup.values()].flat()
    expect(new Set(all).size).toBe(CATALOGUE_TOTAL)
    expect(all).toEqual(
      Array.from({ length: CATALOGUE_TOTAL }, (_, i) => `UC-OFF-${String(i + 1).padStart(3, '0')}`),
    )
    expect(sourceLine(81532)).toContain('UC-OFF-036')
  })

  it('the four owned groups are transcribed whole, ten each, forty in all', () => {
    expect(OFFLINE_USE_CASES_A_D).toHaveLength(40)
    for (const group of USE_CASE_GROUPS) {
      expect(useCasesInGroup(group.key), `group ${group.key}`).toHaveLength(10)
    }
    expect(OFFLINE_USE_CASES_A_D.map((e) => e.id)).toEqual(
      Array.from({ length: 40 }, (_, i) => `UC-OFF-${String(i + 1).padStart(3, '0')}`),
    )
  })

  it('each group heading and stated range is the source line it claims', () => {
    for (const group of USE_CASE_GROUPS) {
      const heading = GROUP_HEADINGS.exec(sourceLine(group.opensAt))
      expect(heading, `L${group.opensAt}`).not.toBeNull()
      expect(heading?.[2]).toBe(group.key)
      expect(`Group ${heading?.[2]} — ${heading?.[3]}`).toBe(group.title)
      expect(`37A.${heading?.[1]}`).toBe(group.section)
    }
    // The catalogue's own group table, rows A-D at L81218-L81221.
    for (const [offset, group] of USE_CASE_GROUPS.entries()) {
      const cells = sourceLine(81218 + offset)
        .split('|')
        .map((c) => c.trim())
      expect(cells[1], `group table row ${group.key}`).toBe(group.key)
      expect(cells[2]).toBe(group.statedRange)
      expect(cells[4]).toBe(group.representatives.map((r) => `\`${r}\``).join(', '))
    }
  })
})

describe('every entry is where it says it is, and says what it says', () => {
  it('each entry heading carries its own identifier and its own title', () => {
    for (const entry of OFFLINE_USE_CASES_A_D) {
      const heading = ENTRY_HEADING.exec(sourceLine(entry.sourceLine))
      expect(heading, `L${entry.sourceLine}`).not.toBeNull()
      expect(heading?.[1], `L${entry.sourceLine} identifier`).toBe(entry.id)
      expect(heading?.[2], `L${entry.sourceLine} title`).toBe(entry.title)
    }
  })

  it('every verbatim clause appears verbatim on that entry’s own line', () => {
    for (const entry of OFFLINE_USE_CASES_A_D) {
      const body = bodyOf(entry)
      for (const [field, value] of [
        ['storyboard', entry.storyboard],
        ['permissions', entry.permissions],
        ['aiBehaviour', entry.aiBehaviour],
        ['preservedContradiction', entry.preservedContradiction],
        ['unspecifiedValueNote', entry.unspecifiedValueNote],
      ] as const) {
        if (value === null) continue
        expect(value.length, `${entry.id} ${field} is empty`).toBeGreaterThan(0)
        expect(body, `${entry.id} ${field} not verbatim at L${entry.sourceLine}`).toContain(value)
      }
    }
  })

  it('every named identifier is named on that entry’s own line', () => {
    for (const entry of OFFLINE_USE_CASES_A_D) {
      const body = bodyOf(entry)
      const named = [
        entry.workflow,
        ...entry.blockers,
        ...entry.acceptanceCriteria,
        ...entry.tests,
        ...(entry.module === null ? [] : [entry.module]),
        ...(entry.fallback === null ? [] : [entry.fallback]),
      ]
      for (const id of named) {
        expect(body, `${entry.id} does not name ${id} at L${entry.sourceLine}`).toContain(
          `\`${id}\``,
        )
      }
    }
  })

  it('exactly one entry names a fallback contract, and eight name a module', () => {
    // Read off the lines rather than trusted: `MOD-FL-A6` and `FB-SYNC-01` are
    // both on L81308, so a count alone would not tell the two columns apart.
    expect(OFFLINE_USE_CASES_A_D.filter((e) => e.fallback !== null).map((e) => e.id)).toEqual([
      'UC-OFF-001',
    ])
    expect(useCase('UC-OFF-001').fallback).toBe('FB-SYNC-01')
    expect(
      OFFLINE_USE_CASES_A_D.filter((e) => e.module !== null).map((e) => [e.id, e.module]),
    ).toEqual([
      ['UC-OFF-001', 'MOD-FL-A6'],
      ['UC-OFF-002', 'MOD-FL-A2'],
      ['UC-OFF-006', 'MOD-FL-A3'],
      ['UC-OFF-011', 'MOD-FL-A4'],
      ['UC-OFF-013', 'MOD-FL-A5'],
      ['UC-OFF-021', 'MOD-FL-A5'],
      ['UC-OFF-031', 'MOD-FL-A1'],
      ['UC-OFF-036', 'MOD-FL-B9'],
    ])
  })
})

describe('the diagram-reuse rule, AC-37A-004', () => {
  const fencesIn = (from: number, to: number): readonly number[] => {
    const found: number[] = []
    for (let n = from; n <= to; n += 1) if (sourceLine(n) === '```mermaid') found.push(n)
    return found
  }

  it('thirteen mermaid blocks sit in §37A, of which twelve are use-case diagrams', () => {
    const census = DIAGRAM_BLOCK_CENSUS
    const fences = fencesIn(CATALOGUE_OPENS, CATALOGUE_ENDS)
    expect(fences).toHaveLength(census.mermaidBlocksIn37A)
    // The first is the catalogue map, which is why twelve and not thirteen.
    expect(fences[0]).toBe(81226)
    expect(sourceLine(81251)).toContain("It is the catalogue's map")
    expect(sourceLine(81212)).toContain('Twelve representative use cases carry their own')
    expect(census.mermaidBlocksIn37A - census.catalogueMaps).toBe(census.useCaseDiagrams)
    // Five of the twelve fall inside groups A-D, and the reusers are the rest.
    expect(fencesIn(81282, 81495)).toHaveLength(census.useCaseDiagramsInGroupsAD)
    expect(census.useCaseDiagramsInGroupsAD + census.reusersInGroupsAD).toBe(40)
  })

  it('five entries carry their own diagram and thirty-five point at one', () => {
    const own = OFFLINE_USE_CASES_A_D.filter((e) => e.diagram.kind === 'own')
    expect(own.map((e) => e.id)).toEqual([
      'UC-OFF-001',
      'UC-OFF-013',
      'UC-OFF-021',
      'UC-OFF-032',
      'UC-OFF-036',
    ])
    expect(own.map((e) => e.id)).toEqual(USE_CASE_GROUPS.flatMap((g) => g.representatives).sort())
    expect(OFFLINE_USE_CASES_A_D.filter((e) => e.diagram.kind === 'reuses')).toHaveLength(
      DIAGRAM_BLOCK_CENSUS.reusersInGroupsAD,
    )
  })

  it('every reuse pointer resolves to a representative, and matches the entry’s own words', () => {
    for (const entry of OFFLINE_USE_CASES_A_D) {
      const target = diagramFor(entry)
      expect(useCase(target as never).diagram.kind, `${entry.id} points at a non-representative`)
        .toBe('own')
      if (entry.diagram.kind === 'own') continue
      // Pinned to the entry's own sentence, not to the presence of the token:
      // a reuse target's identifier can appear in an entry for other reasons.
      expect(bodyOf(entry), `${entry.id} reuse clause`).toContain(
        `reuses the \`${entry.diagram.representative}\` diagram`,
      )
    }
  })

  it('four of the five representatives declare it in their own metadata; the first does not', () => {
    const declared = OFFLINE_USE_CASES_A_D.filter(
      (e) => e.diagram.kind === 'own' && e.diagram.declaredInOwnMetadata,
    )
    expect(declared.map((e) => e.id)).toEqual([
      'UC-OFF-013',
      'UC-OFF-021',
      'UC-OFF-032',
      'UC-OFF-036',
    ])
    for (const entry of declared) {
      expect(bodyOf(entry), `${entry.id}`).toContain('**representative diagram**')
    }
    // And the one that does not, read off the lines that do say it instead.
    expect(sourceLine(81308)).not.toContain('representative diagram')
    expect(sourceLine(81306)).toContain('This is the representative diagram for `UC-OFF-001`')
    expect(sourceLine(81218)).toContain('| `UC-OFF-001` |')
  })

  it('group D’s reuse paragraph names five of the six that declare that reuse', () => {
    const paragraph = sourceLine(81454)
    const declared = OFFLINE_USE_CASES_A_D.filter(
      (e) => e.diagram.kind === 'reuses' && e.diagram.representative === 'UC-OFF-032',
    ).map((e) => e.id)
    expect(declared).toHaveLength(6)

    const named = declared.filter((id) => paragraph.includes(`\`${id}\``))
    // `UC-OFF-033` through `UC-OFF-035` is written as a range, so the literal
    // names in the sentence are three, and the sentence covers five.
    expect(paragraph).toContain('`UC-OFF-031`, `UC-OFF-033` through `UC-OFF-035` and `UC-OFF-037`')
    expect(named).toEqual(['UC-OFF-031', 'UC-OFF-033', 'UC-OFF-035', 'UC-OFF-037'])
    // The sixth, absent from the paragraph and declared at its own line.
    expect(paragraph).not.toContain('`UC-OFF-040`')
    expect(sourceLine(81494)).toContain('reuses the `UC-OFF-032` diagram')
    // And the two the paragraph does not account for at all.
    expect(paragraph).not.toContain('`UC-OFF-038`')
    expect(paragraph).not.toContain('`UC-OFF-039`')
    expect(GROUP_D_REUSE_UNDERCOUNT.locators.join(' ')).toContain('L81494')

    // Groups A, B and C's paragraphs are each exact, which is what makes D's
    // shortfall a finding rather than a house style.
    expect(sourceLine(81306)).toContain('Entries `UC-OFF-002` through `UC-OFF-010`')
    expect(sourceLine(81354)).toContain(
      'Entries `UC-OFF-011`, `UC-OFF-012` and `UC-OFF-014` through `UC-OFF-020`',
    )
    expect(sourceLine(81404)).toContain('Entries `UC-OFF-022` through `UC-OFF-030` reuse it')
  })
})

describe('the closed permission-status vocabulary, AC-37A-005', () => {
  it('the criterion is at L81278 and says what this file says it says', () => {
    expect(sourceLine(81278)).toContain(AC_37A_005_CRITERION)
    expect(AC_37A_005_CRITERION).toContain('no blank cell')
    expect(sourceLine(81277)).toContain('names the representative diagram it reuses')
  })

  it('every status token in every permission line is one of the six', () => {
    const silent = new Set<string>(
      PERMISSION_LINES_BY_CROSS_REFERENCE.filter((r) => r.addsNothing).map((r) => r.id),
    )
    for (const entry of OFFLINE_USE_CASES_A_D) {
      const found = permissionStatusesIn(entry.permissions)
      if (!silent.has(entry.id)) {
        expect(found.length, `${entry.id} permission line has no status`).toBeGreaterThan(0)
      }
      for (const status of found) {
        expect(isPermissionStatus(status), `${entry.id}: ${status}`).toBe(true)
      }
    }
    expect(PERMISSION_STATUSES).toHaveLength(6)
  })

  it('three permission lines are a bare cross-reference and two more add to one', () => {
    // The finding, read off the lines rather than counted: the three that add
    // nothing and the two that do are the same length apart as a miscount
    // would be, so the exact clauses are pinned.
    const bare = OFFLINE_USE_CASES_A_D.filter(
      (e) => permissionStatusesIn(e.permissions).length === 0,
    )
    expect(bare.map((e) => e.id)).toEqual(['UC-OFF-022', 'UC-OFF-023', 'UC-OFF-029'])
    expect(useCase('UC-OFF-022').permissions).toBe('as `UC-OFF-021`.')
    expect(useCase('UC-OFF-023').permissions).toBe('as `UC-OFF-021`.')
    expect(useCase('UC-OFF-029').permissions).toBe('as `UC-OFF-028`.')
    // And the two that defer AND add, which is what makes the reading arguable.
    expect(useCase('UC-OFF-025').permissions).toBe(
      'as `UC-OFF-024`; Quality Manager `Allowed` to stop the cycle by disposition.',
    )
    expect(useCase('UC-OFF-037').permissions).toContain(
      'as `UC-OFF-036`; a second override in the same area in the same shift `Allowed with ' +
        'conditions`',
    )
    for (const row of PERMISSION_LINES_BY_CROSS_REFERENCE) {
      const entry = useCase(row.id as never)
      expect(entry.sourceLine, row.id).toBe(row.sourceLine)
      expect(entry.permissions.startsWith(`as \`${row.inheritsFrom}\``), row.id).toBe(true)
      expect(permissionStatusesIn(entry.permissions).length === 0, row.id).toBe(row.addsNothing)
    }
  })

  it('the census is exact, per token, and adds to ninety-five', () => {
    const counts = new Map<PermissionStatus, number>()
    for (const entry of OFFLINE_USE_CASES_A_D) {
      for (const status of permissionStatusesIn(entry.permissions)) {
        counts.set(status, (counts.get(status) ?? 0) + 1)
      }
    }
    for (const row of PERMISSION_STATUS_CENSUS) {
      expect(counts.get(row.status), `${row.status}`).toBe(row.cells)
    }
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(PERMISSION_STATUS_CELLS)
    expect(PERMISSION_STATUS_CELLS).toBe(95)
    expect(counts.size).toBe(6)
    // `UC-OFF-036` is the entry whose fields spill onto L81486, and leaving it
    // out is exactly how the first count of this census came out at ninety.
    expect(permissionStatusesIn(useCase('UC-OFF-036').permissions)).toHaveLength(5)
  })

  it('`Allowed with conditions` is never read as `Allowed`', () => {
    // The prefix trap, from slice 7's catalogue. `UC-OFF-013` grants the
    // Supervisor the conditional form and the Quality Manager the plain one on
    // the same line, so a prefix-first scanner returns the wrong pair here.
    //
    // THIS IS THE ONLY ASSERTION IN THE FILE THAT CATCHES IT, and it took three
    // plants to establish that. `permissionStatusesIn` has two redundant
    // guards — a longest-first vocabulary and an exact comparison — and
    // removing either one alone leaves the whole suite green. Removing both
    // turns this sequence into ['Allowed', ..., 'Allowed', 'Allowed'] and this
    // is what goes red. A count would not: four tokens either way.
    expect(permissionStatusesIn(useCase('UC-OFF-013').permissions)).toEqual([
      'Allowed',
      'Explicitly prohibited',
      'Allowed with conditions',
      'Allowed',
    ])
    expect(sourceLine(81360)).toContain('Supervisor `Allowed with conditions` — request release')
  })

  it('both “not applicable” permission cells carry a reason, which is the criterion', () => {
    const bare: string[] = []
    for (const entry of OFFLINE_USE_CASES_A_D) {
      for (const cell of entry.permissions.matchAll(/`([^`]+)`/g)) {
        if (cell[1]?.trim() === 'Not applicable') bare.push(entry.id)
      }
    }
    expect(bare).toEqual([])
    expect(useCase('UC-OFF-008').permissions).toContain(
      '`Not applicable — no unit identification exists to permit or prohibit`',
    )
    expect(useCase('UC-OFF-010').permissions).toContain(
      'Worker `Not applicable — the worker makes no date decision`',
    )
  })

  it('six artificial-intelligence lines carry a bare one, outside the criterion’s reach', () => {
    const bare = OFFLINE_USE_CASES_A_D.filter((e) =>
      [...e.aiBehaviour.matchAll(/`([^`]+)`/g)].some((m) => m[1]?.trim() === 'Not applicable'),
    )
    expect(bare.map((e) => e.sourceLine)).toEqual([81366, 81368, 81418, 81458, 81460, 81494])
    // Read the lines, not the count: six others on the same field carry a
    // reason, so six-and-six would pass a count check that means nothing.
    const explained = OFFLINE_USE_CASES_A_D.filter((e) =>
      /`Not applicable —[^`]+`/.test(e.aiBehaviour),
    )
    expect(explained).toHaveLength(6)
    expect(useCase('UC-OFF-015').aiBehaviour).toContain(
      '`Not applicable — scan validation is deterministic`',
    )
    expect(BARE_NOT_APPLICABLE_OUTSIDE_AC_37A_005.locators.join(' ')).toContain('L81418')
  })
})

describe('acceptance criteria and tests pair one to one', () => {
  it('forty-three of each, unique, matched by suffix, all named on their own entry lines', () => {
    const criteria = OFFLINE_USE_CASES_A_D.flatMap((e) => e.acceptanceCriteria)
    const tests = OFFLINE_USE_CASES_A_D.flatMap((e) => e.tests)
    expect(criteria).toHaveLength(43)
    expect(new Set(criteria).size).toBe(43)
    expect(tests).toHaveLength(43)
    expect(new Set(tests).size).toBe(43)
    // §35.4 pairs five criteria with four tests and §21.5 nine with ten. This
    // section pairs symmetrically, entry by entry rather than in total.
    for (const entry of OFFLINE_USE_CASES_A_D) {
      expect(entry.tests.map((t) => t.replace('TEST-', 'AC-')), `${entry.id}`).toEqual(
        entry.acceptanceCriteria,
      )
    }
  })

  it('the four groups take four disjoint hundred blocks', () => {
    const blockOf = (id: string): string => id.slice(7, 8)
    for (const [group, block] of [
      ['A', '1'],
      ['B', '2'],
      ['C', '3'],
      ['D', '4'],
    ] as const) {
      const blocks = new Set(useCasesInGroup(group).flatMap((e) => e.acceptanceCriteria).map(blockOf))
      expect([...blocks], `group ${group}`).toEqual([block])
    }
  })
})

describe('the storyboard set, and the three screens outside it', () => {
  const SCREEN = /`(SCR-[A-Z-]+-\d+)`/g

  it('L81266 names eleven screens; these forty entries name twelve', () => {
    const shared = new Set([...sourceLine(81266).matchAll(SCREEN)].map((m) => m[1]))
    expect(shared.size).toBe(11)
    const used = new Set(
      OFFLINE_USE_CASES_A_D.flatMap((e) => [...e.storyboard.matchAll(SCREEN)].map((m) => m[1])),
    )
    expect(used.size).toBe(12)
    const outside = [...used].filter((s) => s !== undefined && !shared.has(s)).sort()
    expect(outside).toEqual(['SCR-CC-ALERT-01', 'SCR-CC-CLEAR-01', 'SCR-FL-LOGIN-01'])
    const unused = [...shared].filter((s) => s !== undefined && !used.has(s)).sort()
    expect(unused).toEqual(['SCR-CC-CONF-01', 'SCR-DOH-AUD-01'])
    expect(STORYBOARD_SCREENS_OUTSIDE_THE_SHARED_SET.locators.join(' ')).toContain('L81266')
    // The claim that makes the three a finding rather than a list.
    expect(sourceLine(81266)).toContain('Every entry draws on the same small set')
  })
})

describe('DEC-OFF-001 and DEC-OFF-002 are disclosed here because nothing else holds them', () => {
  const SRC_ROOT = join(process.cwd(), 'src')
  const OWNED = join('offline', 'use-cases', 'group-a-d')

  const walk = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (isForeignProbe(entry.name)) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full, out)
      else if (/\.tsx?$/.test(entry.name)) out.push(full)
    }
    return out
  }

  it('both identifiers are raised inside group D and by nothing else in this file’s span', () => {
    expect(USE_CASE_LOCAL_DISCLOSURES.map((d) => d.decisionRef)).toEqual([
      'DEC-OFF-001',
      'DEC-OFF-002',
    ])
    for (const disclosure of USE_CASE_LOCAL_DISCLOSURES) {
      const raiser = useCase(disclosure.raisedBy as never)
      expect(raiser.group).toBe('D')
      expect(raiser.unspecifiedValueNote, `${disclosure.decisionRef}`).toContain(
        disclosure.decisionRef,
      )
      expect(bodyOf(raiser)).toContain(disclosure.decisionRef)
      // Two readings, and neither adopted. `adopted` may not name a number.
      expect(disclosure.readings).toHaveLength(2)
      expect(disclosure.adopted).toMatch(/No value is adopted|Neither value is adopted/)
      for (const reading of disclosure.readings) {
        const at = Number(/·\s*L(\d+)$/.exec(reading.locator)?.[1])
        expect(at, `${disclosure.decisionRef} locator ${reading.locator}`).toBeGreaterThan(0)
        expect(sourceLine(at), `${reading.locator}`).toContain(disclosure.decisionRef)
      }
    }
  })

  it('the entry names one value where the closing register names two', () => {
    expect(sourceLine(81460)).toContain('the number of failures before lockout is')
    expect(sourceLine(81739)).toContain(
      'Number of failed personal-identification-number attempts before lockout, and the lockout ' +
        'duration',
    )
    expect(sourceLine(81738)).toContain(
      'Platform default, floor and ceiling for the qualification clearance duration',
    )
    expect(sourceLine(81488)).toContain(
      'the platform default, floor and ceiling for the clearance duration are',
    )
  })

  it('NEITHER is in the shared canon, and this gate is what forces the switch when one is', () => {
    const canon = new Set<string | null>(OPEN_DECISIONS.map((d) => d.decisionRef))
    for (const disclosure of USE_CASE_LOCAL_DISCLOSURES) {
      expect(
        canon.has(disclosure.decisionRef),
        `${disclosure.decisionRef} is in the canon now — lift the local disclosure and delete it`,
      ).toBe(false)
    }
  })

  it('the §37B side exists, sits outside this directory, and cites lines this side does not', () => {
    // A POINTER THAT CAN POINT AT ITSELF IS NOT A POINTER. The holder must be
    // a real file outside this module, and it must carry the decision's own
    // locators — not merely mention the identifier, which this file does too.
    const holders = walk(SRC_ROOT).filter(
      (file) => !file.includes(OWNED) && /DEC_37B_ALSO_DISCLOSED_IN/.test(readFileSync(file, 'utf8')),
    )
    expect(holders, 'no §37B record names this module').toHaveLength(1)
    const held = readFileSync(holders[0] ?? '', 'utf8')

    const mineByLine = new Set(
      USE_CASE_LOCAL_DISCLOSURES.flatMap((d) =>
        d.readings.map((r) => /·\s*L(\d+)$/.exec(r.locator)?.[1] ?? ''),
      ),
    )
    for (const disclosure of USE_CASE_LOCAL_DISCLOSURES) {
      expect(held, `${disclosure.decisionRef} is not held there`).toContain(disclosure.decisionRef)
      // It names THIS path as the paired record, so the pairing is declared on
      // both sides rather than asserted from one.
      expect(held).toContain('src/offline/use-cases/group-a-d/catalogue.ts')
    }
    // And it cites at least one line this record does not, which is the whole
    // claim that the two are different records rather than two spellings.
    const theirs = [...held.matchAll(/L(\d{5})/g)].map((m) => m[1] ?? '')
    expect(theirs.filter((line) => !mineByLine.has(line)).length).toBeGreaterThan(0)
    expect(held).toContain('L80844')
    expect(mineByLine.has('80844')).toBe(false)
  })

  it('DEC-STORE-001 gets a pointer here and not a fifth spelling', () => {
    // Not a text sweep: this file's own prose names the identifier it refuses
    // to hold, and a sweep would be red for that. The shape is what is checked
    // — the disclosure union admits exactly two refs, so a fifth spelling of
    // `DEC-STORE-001` here is a compile error rather than a runtime one.
    expect(USE_CASE_LOCAL_DISCLOSURES.map((d) => d.decisionRef)).not.toContain('DEC-STORE-001')
    expect(USE_CASE_LOCAL_DISCLOSURES).toHaveLength(2)
    // The source does name it inside `UC-OFF-014`, in the fallback-of-fallback
    // clause this record does not carry, so the pointer is the entry's line.
    expect(sourceLine(81362)).toContain('`DEC-STORE-001`')
    expect(useCase('UC-OFF-014').permissions).not.toContain('DEC-STORE-001')
    expect(useCase('UC-OFF-014').aiBehaviour).not.toContain('DEC-STORE-001')
    // Four holders already, none of them here.
    const held = walk(SRC_ROOT).filter((f) => /DEC-STORE-001/.test(readFileSync(f, 'utf8')))
    expect(held.filter((f) => f.includes(OWNED)).length).toBeLessThanOrEqual(1)
    expect(held.filter((f) => !f.includes(OWNED)).length).toBeGreaterThanOrEqual(4)
  })
})

describe('the registry join this module can and cannot make', () => {
  const REGISTRY = join(process.cwd(), 'registries', 'generated', 'offline-scenarios.json')

  it('all forty identifiers are rows the generated registry already carries', () => {
    const rows = (
      JSON.parse(readFileSync(REGISTRY, 'utf8')) as { rows: readonly { id: string }[] }
    ).rows
    expect(rows).toHaveLength(70)
    const ids = new Set(rows.map((r) => r.id))
    for (const entry of OFFLINE_USE_CASES_A_D) {
      expect(ids.has(entry.id), `${entry.id} would not join the registry`).toBe(true)
    }
  })

  it('nothing under src/ can reach citedTokens, which is why this cannot demonstrate them', () => {
    // The claim in `REGISTRY_DEMONSTRATION_NOTE`, checked against the generator
    // rather than believed — and its first draft was WRONG in exactly the way
    // this build keeps recording: it said the generator reads no file under
    // `src/`, and the generator does. It reads `modules.ts` files for their
    // slug claims. So the check is narrowed to the claim that survives.
    const generator = readFileSync(join(process.cwd(), 'scripts', 'build-registries.mjs'), 'utf8')
    expect(generator).toContain(
      "return ROUTE_EVIDENCE.citedTokens.has(id) ? 'demonstrated-in-storyboard' : 'not-represented'",
    )
    // One writer, and it is inside the walk rooted at `app/`.
    expect(generator.match(/citedTokens\.add\(/g)).toHaveLength(1)
    expect(generator).toContain("walkDirs(join(ROOT, 'app'))")
    // The only `src/` read collects a filename this module does not ship.
    const srcReads = [...generator.matchAll(/(\w+)\(join\(ROOT, 'src'\)\)/g)].map((m) => m[1])
    expect(srcReads).toEqual(['spineFiles'])
    expect(generator).toContain("e.name === 'modules.ts'")
    expect(readdirSync(join(process.cwd(), 'src', 'offline', 'use-cases', 'group-a-d'))).not.toContain(
      'modules.ts',
    )
    expect(REGISTRY_DEMONSTRATION_NOTE).toContain('cannot move')
  })
})

/*
 * ── THE PLANT CAMPAIGN ─────────────────────────────────────────────────────
 * Every defect below was written into `src/offline/use-cases/group-a-d/
 * catalogue.ts` on the real filesystem, run, and restored byte-identically with
 * the file's sha256 compared before and after. Thirty plants, twenty-eight red,
 * and the two that stayed green are the ones worth recording.
 *
 * RED, and the test each one named:
 *   group E's heading count set to eleven — the seven-group count
 *   an entry record deleted (deleted, not renamed) — the forty-entry count,
 *     the heading check, and the registry join
 *   one word changed inside a verbatim permission clause — the verbatim check
 *   a reuse pointer retargeted to the other representative — the pointer check
 *     and group D's undercount
 *   a representative demoted to a reuser — three diagram tests
 *   the first representative marked as declaring itself — the asymmetry check
 *   the mermaid census set to twelve blocks, to four diagrams, to 34 reusers
 *   `AC-37A-005` re-quoted with the no-blank-cell clause dropped
 *   `Allowed` census dropped by one — the census
 *   a cross-reference line claimed to add a status — two status tests
 *   a finding's locator moved one line, and another's dropped
 *   the reason stripped from an explained not-applicable cell — two tests
 *   a group A criterion renumbered into group B's block — three tests
 *   a module id changed to a neighbouring band — two tests
 *   an AC/TEST pair broken by one digit — two tests
 *   a disclosure reading relocated to a line not carrying its identifier
 *   a disclosure duplicated so the module held three
 *   this side's locator replaced by the §37B side's own — the pairing check
 *   a storyboard clause given a screen it does not name — two tests
 *   a group's stated range copied from its neighbour
 *   the registry note's conclusion softened from "cannot" to "may not yet"
 *
 * STAYED GREEN, both on `permissionStatusesIn`, and both recorded rather than
 * papered over:
 *   reordering `PERMISSION_STATUSES` so `Allowed` comes first — green, because
 *     the comparison is exact;
 *   relaxing that comparison from `===` to `startsWith` — green, because the
 *     vocabulary is longest-first.
 * The two guards are redundant with each other. Removing BOTH is red, on the
 * pinned status sequence of `UC-OFF-013`. The module's comment said first that
 * ordering was the guard and then that exactness was; both were half right, and
 * only the third plant told them apart.
 */
