import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { FL_COMMAND_CLASSES } from '@/frontline/commands'
import { OFFLINE_BLOCKERS } from '@/offline/blockers'
import {
  CATALOGUE_GAPS,
  CATALOGUE_LOCATORS,
  CATALOGUE_SHARED_SCREENS,
  DECISIONS_NAMED_ELSEWHERE,
  DEFERRALS,
  DIAGRAM_CARRIERS,
  FOREIGN_IDENTIFIERS_IN_SPAN,
  GROUP_COUNTS,
  OFFLINE_USE_CASES_E_G,
  OFFLINE_USE_CASE_GROUPS,
  SCREENS_OUTSIDE_SHARED_SET,
  STATUS_TOKEN_OUTCOME,
  UNDISCLOSED_DECISION,
  diagramSourceFor,
  groupOfOrdinal,
  useCaseById,
  useCasesInGroup,
} from '@/offline/use-cases/group-e-g/catalogue'

/**
 * THE FROZEN SOURCE IS THE GROUND TRUTH. Every count below is re-measured
 * from L81202 onwards on each run, and every verbatim field is looked for on
 * the line the module cites, so a rewording or a moved locator in the module
 * goes red against a source that still says the old thing.
 *
 * The module was assembled by a field splitter. This suite deliberately does
 * NOT reuse it: it asks whether `**<Field>:** <value>` appears on the cited
 * line, which pins the field name, the value and the locator together in one
 * question a different algorithm answers.
 */
const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** `SOURCE_LINES` is 0-based; every citation in this build is 1-based `L<n>`. */
const sourceLine = (n: number): string => SOURCE_LINES[n - 1] ?? ''

/** The section this catalogue lives in, measured rather than assumed. */
const SECTION_START = CATALOGUE_LOCATORS.sectionHeading
const SECTION_END =
  SOURCE_LINES.findIndex((l) => l.startsWith('## 37B. New Decisions and Open Items')) + 1

/** `**\`UC-OFF-0NN\` — Title.**` — the only shape that DEFINES an entry. */
const ENTRY_HEADING = /^\*\*`(UC-OFF-\d{3})` — /

/** Every group heading in 37A, whoever owns it, so the arithmetic is whole. */
const ALL_GROUP_HEADINGS: readonly { readonly group: string; readonly line: number }[] =
  SOURCE_LINES.flatMap((l, i) => {
    const m = /^### 37A\.\d Group ([A-G]) — /.exec(l)
    return m ? [{ group: m[1] as string, line: i + 1 }] : []
  })

/** Heading through the line before the next heading; the last runs to §37B. */
function spanOf(group: string): { start: number; end: number } {
  const at = ALL_GROUP_HEADINGS.findIndex((g) => g.group === group)
  const start = ALL_GROUP_HEADINGS[at]?.line ?? 0
  const next = ALL_GROUP_HEADINGS[at + 1]?.line
  return { start, end: (next ?? SECTION_END) - 1 }
}

function entriesIn(group: string): readonly string[] {
  const { start, end } = spanOf(group)
  return SOURCE_LINES.slice(start - 1, end).flatMap((l) => {
    const m = ENTRY_HEADING.exec(l)
    return m ? [m[1] as string] : []
  })
}

function identifiersIn(group: string): readonly string[] {
  const { start, end } = spanOf(group)
  return [
    ...new Set(SOURCE_LINES.slice(start - 1, end).flatMap((l) => l.match(/UC-OFF-\d{3}/g) ?? [])),
  ].sort()
}

/* ── the section, and the three group headings ─────────────────────────── */

describe('the catalogue and its three groups, against the frozen source', () => {
  it('§37A opens where the module says, and §37B closes it', () => {
    expect(sourceLine(SECTION_START)).toBe('## 37A. Mandatory Offline Use-Case Catalog')
    expect(sourceLine(SECTION_END)).toMatch(/^## 37B\. New Decisions and Open Items/)
    expect(SECTION_END).toBeGreaterThan(SECTION_START)
  })

  it('all seven group headings exist, in order, and E F G are ours', () => {
    expect(ALL_GROUP_HEADINGS.map((g) => g.group)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    expect(OFFLINE_USE_CASE_GROUPS.map((g) => g.id)).toEqual(['E', 'F', 'G'])
  })

  it.each(OFFLINE_USE_CASE_GROUPS)(
    'group $id: the heading line carries its section number and its theme verbatim',
    (group) => {
      expect(sourceLine(group.headingLine)).toBe(
        `### ${group.section} Group ${group.id} — ${group.theme}`,
      )
    },
  )

  it.each(OFFLINE_USE_CASE_GROUPS)(
    'group $id: the transcribed span matches the span the headings actually delimit',
    (group) => {
      const measured = spanOf(group.id)
      expect(group.spanStart).toBe(measured.start)
      // G's transcribed end is its last CONTENT line; the source's span runs
      // one further, over a blank line that carries nothing to cite.
      expect(group.spanEnd).toBeLessThanOrEqual(measured.end)
      for (let n = group.spanEnd + 1; n <= measured.end; n += 1) {
        expect(sourceLine(n).trim()).toBe('')
      }
    },
  )

  it.each(OFFLINE_USE_CASE_GROUPS)(
    'group $id: the seven-group table row names the group and its representatives',
    (group) => {
      const row = sourceLine(group.groupTableRow)
      expect(row.startsWith(`| ${group.id} | `)).toBe(true)
      for (const rep of group.representatives) expect(row).toContain(`\`${rep}\``)
      // The row's LAST column is the representative list; a row naming one
      // more or one fewer than the module carries is a divergence, so the
      // count is read off the row rather than trusted.
      const cells = row.split('|').map((c) => c.trim())
      expect((cells[cells.length - 2] ?? '').match(/UC-OFF-\d{3}/g) ?? []).toHaveLength(
        group.representatives.length,
      )
    },
  )
})

/* ── the count the dispatch warned about ───────────────────────────────── */

describe('ownership is derived from the entry, never from the span', () => {
  it('the seven group ranges sum to seventy-one while the catalogue holds seventy', () => {
    const perGroup = ALL_GROUP_HEADINGS.map((g) => identifiersIn(g.group).length)
    expect(perGroup).toEqual([10, 10, 10, 10, 11, 10, 10])
    expect(perGroup.reduce((a, b) => a + b, 0)).toBe(71)

    const owned = ALL_GROUP_HEADINGS.flatMap((g) => entriesIn(g.group))
    expect(owned).toHaveLength(70)
    expect(new Set(owned).size).toBe(70)
  })

  it.each(GROUP_COUNTS)(
    'group $group: $entries entries and $identifiersInSpan identifiers in span, both measured',
    (count) => {
      expect(entriesIn(count.group)).toHaveLength(count.entries)
      expect(identifiersIn(count.group)).toHaveLength(count.identifiersInSpan)
      expect(useCasesInGroup(count.group)).toHaveLength(count.entries)
    },
  )

  it('the eleventh identifier in E is UC-OFF-036 and it is named, not defined, there', () => {
    const owned = new Set(entriesIn('E'))
    const foreign = identifiersIn('E').filter((id) => !owned.has(id))
    // Read the identifier, not the difference of two numbers: a group holding
    // ten entries and eleven identifiers is consistent with any foreign id.
    expect(foreign).toEqual(['UC-OFF-036'])
    expect(FOREIGN_IDENTIFIERS_IN_SPAN).toEqual(['UC-OFF-036'])
    expect(entriesIn('D')).toContain('UC-OFF-036')

    // And the line it is named on says WHY it is there.
    const named = DEFERRALS.find((d) => d.to === 'UC-OFF-036')
    expect(named).toBeDefined()
    const uc = useCaseById(named?.from ?? '')
    expect(uc).not.toBeNull()
    expect(sourceLine(uc?.bodyLine ?? 0)).toContain(
      '**Numbered steps:** as `UC-OFF-036` steps 7 through 9.',
    )
  })

  it('F and G hold no foreign identifier at all', () => {
    for (const g of ['F', 'G'] as const) {
      const owned = new Set(entriesIn(g))
      expect(identifiersIn(g).filter((id) => !owned.has(id))).toEqual([])
    }
  })

  it('the deferral idiom occurs five times and crosses a group exactly once', () => {
    expect(DEFERRALS).toHaveLength(5)
    expect(DEFERRALS.filter((d) => d.crossesGroup)).toHaveLength(1)
    // Named, so a sixth deferral appearing under a different name cannot pass
    // by keeping the total at five.
    expect(DEFERRALS.map((d) => `${d.from}:${d.field}->${d.to}`)).toEqual([
      'UC-OFF-042:Numbered steps->UC-OFF-036',
      'UC-OFF-047:Roles->UC-OFF-046',
      'UC-OFF-053:Permissions->UC-OFF-051',
      'UC-OFF-053:Artificial-intelligence behaviour->UC-OFF-051',
      'UC-OFF-058:Fallback-of-fallback->UC-OFF-059',
    ])
    for (const d of DEFERRALS) {
      expect(sourceLine(useCaseById(d.from)?.bodyLine ?? 0)).toContain(`\`${d.to}\``)
    }
  })

  it('groupOfOrdinal covers 1..70 and refuses anything else', () => {
    expect(groupOfOrdinal(1)).toBe('A')
    expect(groupOfOrdinal(36)).toBe('D')
    expect(groupOfOrdinal(41)).toBe('E')
    expect(groupOfOrdinal(60)).toBe('F')
    expect(groupOfOrdinal(70)).toBe('G')
    expect(groupOfOrdinal(0)).toBeNull()
    expect(groupOfOrdinal(71)).toBeNull()
    expect(groupOfOrdinal(1.5)).toBeNull()
  })
})

/* ── every entry, on its own line ──────────────────────────────────────── */

describe('every entry is pinned to the line that defines it', () => {
  it('thirty entries, ordinals 41 through 70, in source order', () => {
    expect(OFFLINE_USE_CASES_E_G).toHaveLength(30)
    expect(OFFLINE_USE_CASES_E_G.map((u) => u.ordinal)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 41),
    )
    expect(OFFLINE_USE_CASES_E_G.map((u) => u.headingLine)).toEqual(
      [...OFFLINE_USE_CASES_E_G.map((u) => u.headingLine)].sort((a, b) => a - b),
    )
  })

  it.each(OFFLINE_USE_CASES_E_G)('$id: title and identifier metadata on its heading line', (uc) => {
    expect(sourceLine(uc.headingLine)).toContain(
      `**\`${uc.id}\` — ${uc.title}.** **Identifier metadata:** \`${uc.id}\`;`,
    )
    expect(groupOfOrdinal(uc.ordinal)).toBe(uc.group)
  })

  it.each(OFFLINE_USE_CASES_E_G)('$id: every verbatim field sits on its cited body line', (uc) => {
    const line = sourceLine(uc.bodyLine)
    const pairs: readonly [string, string][] = [
      ['Permissions', uc.permissions],
      ['Artificial-intelligence behaviour', uc.aiBehaviour],
      ['First fallback', uc.firstFallback],
      ['Fallback-of-fallback', uc.fallbackOfFallback],
      ['Terminal safe state', uc.terminalSafeState],
      ['Recovery', uc.recovery],
      ['Reconciliation', uc.reconciliation],
    ]
    for (const [field, value] of pairs) {
      expect(value.length).toBeGreaterThan(0)
      expect(line).toContain(`**${field}:** ${value}`)
    }
    expect(line).toContain(`**Workflow:** \`${uc.workflow}\`.`)
  })

  it('four entries split across two lines, and they are the four that draw below', () => {
    const split = OFFLINE_USE_CASES_E_G.filter((u) => u.bodyLine !== u.headingLine)
    expect(split.map((u) => u.id)).toEqual([
      'UC-OFF-048',
      'UC-OFF-049',
      'UC-OFF-055',
      'UC-OFF-070',
    ])
    for (const uc of split) {
      expect(uc.diagram.carries).toBe(true)
      if (uc.diagram.carries) expect(uc.diagram.placement).toBe('below')
      // The heading line ends at the metadata; the body line opens a field.
      expect(sourceLine(uc.headingLine)).not.toContain('**Five surfaces:**')
      expect(sourceLine(uc.bodyLine).startsWith('**Five surfaces:**')).toBe(true)
    }
    expect(OFFLINE_USE_CASES_E_G.filter((u) => u.bodyLine === u.headingLine)).toHaveLength(26)
  })

  it('exactly two entries carry an eighteenth field, and the two are different fields', () => {
    const extra = OFFLINE_USE_CASES_E_G.filter((u) => u.extraField !== null)
    expect(extra.map((u) => u.id)).toEqual(['UC-OFF-046', 'UC-OFF-050'])
    const names = extra.map((u) => u.extraField?.name)
    expect(names).toEqual(['Preserved contradiction', 'Note on an unspecified value'])
    expect(new Set(names).size).toBe(2)
    for (const uc of extra) {
      expect(sourceLine(uc.bodyLine)).toContain(
        `**${uc.extraField?.name}:** ${uc.extraField?.value}`,
      )
    }
  })

  it('every workflow identifier is unique and appears on its own entry line', () => {
    const wfs = OFFLINE_USE_CASES_E_G.map((u) => u.workflow)
    expect(new Set(wfs).size).toBe(30)
    for (const uc of OFFLINE_USE_CASES_E_G) {
      expect(uc.workflow).toMatch(/^WF-[A-Z-]+$/)
    }
  })
})

/* ── twelve diagrams, and the pointer that stands in for fifty-eight ───── */

describe('the diagram-reuse rule', () => {
  it('thirteen mermaid fences in 37A, one of them the catalogue map', () => {
    const fences: number[] = []
    for (let n = SECTION_START; n < SECTION_END; n += 1) {
      if (sourceLine(n) === '```mermaid') fences.push(n)
    }
    expect(fences).toHaveLength(13)
    expect(fences[0]).toBe(CATALOGUE_LOCATORS.catalogueMapFence)
    // The map is the fence that follows the group table, not a use case's.
    expect(sourceLine(CATALOGUE_LOCATORS.catalogueMapFence + 1)).toBe('flowchart LR')
    expect(fences.length - 1).toBe(12)
  })

  it('L81212 names twelve representatives and our seven are among them', () => {
    const rule = sourceLine(CATALOGUE_LOCATORS.diagramReuseRule)
    expect(rule).toContain('Twelve representative use cases carry their own Mermaid diagram.')
    expect(rule).toContain('The remaining fifty-eight do not')
    const named = rule.slice(rule.indexOf('**The twelve representatives**')).match(/UC-OFF-\d{3}/g)
    expect(named).toHaveLength(12)
    // Read the identifiers, never the count: seven and seven is not a match.
    expect(DIAGRAM_CARRIERS).toEqual([
      'UC-OFF-041',
      'UC-OFF-048',
      'UC-OFF-049',
      'UC-OFF-051',
      'UC-OFF-055',
      'UC-OFF-062',
      'UC-OFF-070',
    ])
    for (const id of DIAGRAM_CARRIERS) expect(named).toContain(id)
  })

  it('AC-37A-004 states the complement, and twenty-three of our thirty are reusers', () => {
    expect(sourceLine(CATALOGUE_LOCATORS.reuseCriterion)).toContain(
      'Every non-diagrammed entry names the representative diagram it reuses.',
    )
    expect(OFFLINE_USE_CASES_E_G.filter((u) => !u.diagram.carries)).toHaveLength(23)
  })

  it.each(OFFLINE_USE_CASES_E_G.filter((u) => u.diagram.carries))(
    '$id: its fence opens and closes where the module says',
    (uc) => {
      if (!uc.diagram.carries) throw new Error('filtered')
      expect(sourceLine(uc.diagram.fenceOpen)).toBe('```mermaid')
      expect(sourceLine(uc.diagram.fenceClose)).toBe('```')
      expect(uc.diagram.fenceClose).toBeGreaterThan(uc.diagram.fenceOpen)
      if (uc.diagram.placement === 'above') {
        expect(uc.diagram.fenceClose).toBeLessThan(uc.headingLine)
      } else {
        expect(uc.diagram.fenceOpen).toBeGreaterThan(uc.headingLine)
        expect(uc.diagram.fenceClose).toBeLessThan(uc.bodyLine)
      }
      expect(sourceLine(uc.headingLine)).toContain('**representative diagram**')
    },
  )

  it.each(OFFLINE_USE_CASES_E_G.filter((u) => !u.diagram.carries))(
    '$id: names the diagram it reuses, and the pointer resolves to that fence',
    (uc) => {
      if (uc.diagram.carries) throw new Error('filtered')
      expect(sourceLine(uc.headingLine)).toContain(`reuses the \`${uc.diagram.reuses}\` diagram.`)
      const rep = useCaseById(uc.diagram.reuses)
      expect(rep?.group).toBe(uc.group)
      const src = diagramSourceFor(uc.id)
      expect(src?.own).toBe(false)
      expect(src?.owner).toBe(uc.diagram.reuses)
      if (rep?.diagram.carries) {
        expect(src?.fenceOpen).toBe(rep.diagram.fenceOpen)
        expect(src?.fenceClose).toBe(rep.diagram.fenceClose)
      }
    },
  )

  it('a carrier points at its own fence, and an unknown identifier points nowhere', () => {
    const src = diagramSourceFor('UC-OFF-041')
    expect(src?.own).toBe(true)
    expect(src?.owner).toBe('UC-OFF-041')
    expect(diagramSourceFor('UC-OFF-001')).toBeNull()
    expect(diagramSourceFor('nonsense')).toBeNull()
  })

  it.each(OFFLINE_USE_CASE_GROUPS)(
    "group $id: the group's own reuse sentence agrees with its entries",
    (group) => {
      const sentence = sourceLine(group.reuseStatementLine)
      expect(sentence).toContain('**What the diagram shows, and its reuse.**')
      for (const rep of group.representatives) expect(sentence).toContain(`\`${rep}\``)
      expect(useCasesInGroup(group.id).filter((u) => u.diagram.carries).map((u) => u.id)).toEqual(
        group.representatives,
      )
    },
  )
})

/* ── the permission status vocabulary ──────────────────────────────────── */

describe('AC-37A-005, measured across all thirty entries', () => {
  const HEADS = Object.keys(STATUS_TOKEN_OUTCOME)

  it('the criterion says what the module says it says', () => {
    expect(sourceLine(CATALOGUE_LOCATORS.statusVocabularyCriterion)).toContain(
      "Every entry's permission line uses only the closed status set, with no blank cell and no unexplained \"not applicable\".",
    )
  })

  it.each(OFFLINE_USE_CASES_E_G)('$id: its permission line uses only the closed set', (uc) => {
    const ticks = [...uc.permissions.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string)
    const statuses = ticks.filter((t) => HEADS.includes(t.split(' —')[0] as string))
    expect(uc.permissions.trim()).not.toBe('')
    expect(statuses).toHaveLength(uc.statusTokenCount)
    expect([...new Set(statuses.map((s) => s.split(' —')[0]))].sort()).toEqual(
      [...uc.statusTokens].sort(),
    )
    // No blank, and no bare "Not applicable": every one carries its reason.
    for (const s of statuses) {
      if (s.startsWith('Not applicable')) expect(s).toMatch(/^Not applicable — \S/)
    }
  })

  it('eighty status tokens, six of the nine outcomes, three reasoned "not applicable"s', () => {
    const all = OFFLINE_USE_CASES_E_G.flatMap((u) =>
      [...u.permissions.matchAll(/`([^`]+)`/g)]
        .map((m) => (m[1] as string).split(' —')[0] as string)
        .filter((t) => HEADS.includes(t)),
    )
    expect(all).toHaveLength(80)
    expect(OFFLINE_USE_CASES_E_G.reduce((n, u) => n + u.statusTokenCount, 0)).toBe(80)
    expect([...new Set(all)].sort()).toEqual([...HEADS].sort())
    expect(all.filter((t) => t === 'Not applicable')).toHaveLength(3)
    // Three of the nine are used by no permission line in E, F or G.
    expect(new Set(Object.values(STATUS_TOKEN_OUTCOME)).size).toBe(6)
  })

  it('one entry states no status of its own, and it is the one that defers', () => {
    const silent = OFFLINE_USE_CASES_E_G.filter((u) => u.statusTokenCount === 0)
    // Named, not counted: "exactly one entry carries none" is true of any one.
    expect(silent.map((u) => u.id)).toEqual(['UC-OFF-053'])
    expect(silent[0]?.permissions).toBe('as `UC-OFF-051`.')
    expect(OFFLINE_USE_CASES_E_G.filter((u) => u.statusTokenCount > 0)).toHaveLength(29)
    // So AC-37A-005 holds for that entry only by pointing somewhere else, and
    // the entry it points at does carry a full status line.
    expect(useCaseById('UC-OFF-051')?.statusTokenCount).toBeGreaterThan(0)
    expect(
      DEFERRALS.some((d) => d.from === 'UC-OFF-053' && d.field === 'Permissions'),
    ).toBe(true)
  })

  it('nineteen `Allowed` tokens sit inside a prohibition, and the module counts them', () => {
    /** Recomputed from the permission line, which is itself pinned to source. */
    const negatedIn = (permissions: string): number =>
      permissions
        .split(';')
        .reduce(
          (n, seg) =>
            /\b(nobody|no one|neither|every role|every tenant role)\b/i.test(seg)
              ? n + (seg.match(/`Allowed`/g) ?? []).length
              : n,
          0,
        )

    const allowed = OFFLINE_USE_CASES_E_G.reduce(
      (n, u) => n + (u.permissions.match(/`Allowed`/g) ?? []).length,
      0,
    )
    expect(allowed).toBe(53)
    expect(OFFLINE_USE_CASES_E_G.reduce((n, u) => n + negatedIn(u.permissions), 0)).toBe(19)
    expect(OFFLINE_USE_CASES_E_G.reduce((n, u) => n + u.negatedAllowedClauses, 0)).toBe(19)
    // Per entry, so moving the count between entries cannot keep the total.
    for (const uc of OFFLINE_USE_CASES_E_G) {
      expect(uc.negatedAllowedClauses).toBe(negatedIn(uc.permissions))
    }
    // And one named instance, verbatim, so the rule is not just arithmetic.
    expect(useCaseById('UC-OFF-061')?.permissions).toContain(
      'nobody `Allowed` to evict unsynced evidence to make room',
    )
    expect(useCaseById('UC-OFF-061')?.negatedAllowedClauses).toBe(1)
  })
})

/* ── acceptance criteria and tests ─────────────────────────────────────── */

describe('acceptance criteria and tests pair exactly in all three groups', () => {
  it.each(GROUP_COUNTS)('group $group: $acceptanceCriteria criteria, $tests tests', (count) => {
    const group = useCasesInGroup(count.group)
    expect(group.flatMap((u) => u.acceptanceCriteria)).toHaveLength(count.acceptanceCriteria)
    expect(group.flatMap((u) => u.tests)).toHaveLength(count.tests)
  })

  it('G reaches twelve through one entry with three, not through an eleventh entry', () => {
    const g = useCasesInGroup('G')
    expect(g).toHaveLength(10)
    expect(g.map((u) => u.acceptanceCriteria.length)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 3])
    expect(useCaseById('UC-OFF-070')?.acceptanceCriteria).toEqual([
      'AC-37A-710',
      'AC-37A-711',
      'AC-37A-712',
    ])
  })

  it.each(OFFLINE_USE_CASES_E_G)('$id: each criterion has the test with its own number', (uc) => {
    expect(uc.tests).toHaveLength(uc.acceptanceCriteria.length)
    expect(uc.tests.map((t) => t.replace('TEST-', 'AC-'))).toEqual([...uc.acceptanceCriteria])
    const line = sourceLine(uc.bodyLine)
    for (const id of [...uc.acceptanceCriteria, ...uc.tests]) expect(line).toContain(`\`${id}\``)
  })

  it('thirty-two criteria and thirty-two tests, all distinct', () => {
    const acs = OFFLINE_USE_CASES_E_G.flatMap((u) => u.acceptanceCriteria)
    const tests = OFFLINE_USE_CASES_E_G.flatMap((u) => u.tests)
    expect(acs).toHaveLength(32)
    expect(new Set(acs).size).toBe(32)
    expect(new Set(tests).size).toBe(32)
  })
})

/* ── joins onto what already exists ────────────────────────────────────── */

describe('what these entries name joins what this build already holds', () => {
  it('every declared blocker is one of the thirty-seven', () => {
    const known = new Set(OFFLINE_BLOCKERS.map((b) => b.identifier as string))
    const declared = OFFLINE_USE_CASES_E_G.flatMap((u) => u.declaredBlockers)
    expect(declared.length).toBeGreaterThan(0)
    for (const id of declared) expect(known.has(id)).toBe(true)
  })

  it('six command-class declarations land on five settled classes', () => {
    const declared = OFFLINE_USE_CASES_E_G.filter((u) => u.declaredCommandClassText !== null)
    expect(declared.map((u) => u.id)).toEqual([
      'UC-OFF-041',
      'UC-OFF-042',
      'UC-OFF-043',
      'UC-OFF-044',
      'UC-OFF-045',
      'UC-OFF-046',
    ])
    const known = new Set(FL_COMMAND_CLASSES.map((c) => c.id as string))
    for (const uc of declared) {
      expect(known.has(uc.commandClass ?? '')).toBe(true)
      expect(sourceLine(uc.headingLine)).toContain(
        `command class ${uc.declaredCommandClassText};`,
      )
    }
    // Reassignment and substitution are one class; the collapse is the point.
    expect(new Set(declared.map((u) => u.commandClass)).size).toBe(5)
    expect(useCaseById('UC-OFF-043')?.commandClass).toBe('CMD-FL-REASSIGN')
    expect(useCaseById('UC-OFF-044')?.commandClass).toBe('CMD-FL-REASSIGN')
    // The remote wipe declares none, and no sixth class was minted for it.
    expect(useCaseById('UC-OFF-049')?.commandClass).toBeNull()
    expect(known.size).toBe(5)
  })

  it('the eleven shared screens are the eleven the catalogue names', () => {
    const stated = sourceLine(CATALOGUE_LOCATORS.sharedStoryboardScreens)
    // The source uses a straight apostrophe here; quoting a curly one would
    // pass a weaker check by accident, so it is spelled out.
    expect(stated).toContain("**Storyboard — the catalogue's shared screens.**")
    expect(stated).toContain('Every entry draws on the same small set:')
    const named = [...new Set(stated.match(/SCR-[A-Z]+-[A-Z]+-\d{2}/g) ?? [])]
    expect(named).toHaveLength(11)
    expect([...CATALOGUE_SHARED_SCREENS].sort()).toEqual([...named].sort())
  })

  it('three screens these entries use are outside that set, and one is a hapax', () => {
    expect([...SCREENS_OUTSIDE_SHARED_SET].sort()).toEqual([
      'SCR-CC-CLEAR-01',
      'SCR-DOH-BANNER-01',
      'SCR-SA-LIFECYCLE-01',
    ])
    const occurrences = (id: string): number =>
      SOURCE_LINES.reduce((n, l) => n + (l.match(new RegExp(id, 'g')) ?? []).length, 0)
    // All three are real identifiers; the gap is in the catalogue's claim.
    for (const id of SCREENS_OUTSIDE_SHARED_SET) expect(occurrences(id)).toBeGreaterThan(0)
    expect(occurrences('SCR-SA-LIFECYCLE-01')).toBe(1)
    expect(useCaseById('UC-OFF-070')?.storyboards).toContain('SCR-SA-LIFECYCLE-01')
  })
})

/* ── decisions, named and not resolved ─────────────────────────────────── */

describe('the decisions these entries leave open', () => {
  it('every named decision sits on the line the module cites', () => {
    for (const d of DECISIONS_NAMED_ELSEWHERE) {
      expect(sourceLine(d.line)).toContain(`\`${d.id}\``)
      expect(useCaseById(d.namedBy)?.declaredDecisions).toContain(d.id)
    }
    expect(DECISIONS_NAMED_ELSEWHERE.map((d) => d.id)).toEqual([
      'DEC-SUSP-001',
      'DEC-SYNC-001',
      'DEC-WIPE-001',
      'DEC-STORE-001',
      'DEC-RETRIEVE-001',
    ])
  })

  it('DEC-SYNC-002 is raised and tabled where the module says, and settled nowhere', () => {
    expect(sourceLine(UNDISCLOSED_DECISION.raisedAt)).toContain(
      '**Note on an unspecified value:** command expiry horizons per class are `TBD — Client Decision Required` under `DEC-SYNC-002`.',
    )
    expect(sourceLine(UNDISCLOSED_DECISION.tabledAt)).toContain(
      '| `DEC-SYNC-002` | Command expiry horizons per command class |',
    )
    expect(UNDISCLOSED_DECISION.heldBy).toBeNull()
  })

  it('DEC-SYNC-002 is ABSENT from the shared canon, so lifting it turns this red', () => {
    const canon = readFileSync(join(process.cwd(), 'src', 'disclosure', 'decisions.ts'), 'utf8')
    // Read from the constant, not from a literal, so pointing this record at
    // an identifier the canon already holds turns the gate red rather than
    // leaving a stale literal guarding nothing.
    expect(canon).not.toContain(UNDISCLOSED_DECISION.id)
    expect(UNDISCLOSED_DECISION.id).toBe('DEC-SYNC-002')
    // The canon is real and readable, so the assertion above is not vacuous
    // against a missing file or an empty read.
    expect(canon).toContain('DEC-')
    expect(canon.length).toBeGreaterThan(1000)
  })

  it('the recorded gaps each cite a line that carries them', () => {
    expect(CATALOGUE_GAPS).toHaveLength(5)
    for (const gap of CATALOGUE_GAPS) {
      expect(sourceLine(gap.line).trim()).not.toBe('')
      expect(gap.why.length).toBeGreaterThan(20)
    }
    expect(sourceLine(CATALOGUE_GAPS[0]?.line ?? 0)).toContain('`UC-OFF-036`')
    expect(sourceLine(CATALOGUE_GAPS[2]?.line ?? 0)).toContain('A remote wipe issued to a device')
    expect(sourceLine(CATALOGUE_GAPS[4]?.line ?? 0)).toContain('**Permissions:** as `UC-OFF-051`.')
  })
})
