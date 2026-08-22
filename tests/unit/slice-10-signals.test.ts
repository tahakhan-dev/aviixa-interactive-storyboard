import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CH_27_7_CATALOG,
  CH_30C_2_CATEGORIES,
  COMMAND_CATALOGUE,
  COMMAND_REGISTRY_EXTRAS,
  EVENT_CATALOGUE,
  EVENT_REGISTRY_EXTRAS,
  NOTIFICATION_CLASS_DISTRIBUTION,
  NOTIFICATION_COLLISIONS,
  NOTIFICATION_COUNT_LABEL,
  NOTIFICATION_FAMILIES,
  NOTIFICATION_REGISTERS,
  SIGNAL_COUNTS,
  lookupNotification,
  notificationKey,
  notificationsIn,
  resolveNotification,
} from '@/registry/signals'
import commandsRegistry from '../../registries/generated/commands.json'
import eventsRegistry from '../../registries/generated/events.json'
import notificationsRegistry from '../../registries/generated/notifications.json'

/**
 * THE SIGNAL REGISTRIES, CHECKED AGAINST THE FROZEN SOURCE RATHER THAN AGAINST
 * THIS TASK'S OWN TRANSCRIPTION.
 *
 * Every count here is RE-DERIVED from the frozen source inside the test and
 * then compared to `src/registry/signals.ts`. A test that only asserted
 * `.length` would be satisfied by a defect that RENAMED a row instead of
 * deleting one — that exact gate shape is in this build's catalogue of gates
 * that could not fail. So the comparisons are whole-row: identifier, name and
 * line together, in source order.
 *
 * The class-distribution check is the other catalogued trap, and it is live
 * here rather than hypothetical: the counted tally holds EIGHT escalations and
 * EIGHT alerts. A count check would pass on a defect that swapped those two
 * class labels, because both categories have the same number of rows. So the
 * tally is derived from the rows and compared KEY BY KEY, and individual rows
 * are pinned by identifier as well.
 *
 * PLANTS WATCHED RED, each into `src/registry/signals.ts` and each restored
 * against a sha256 taken before the first plant:
 *   1. `NOTIF-010`'s Chapter 30C.2 name changed to a plausible neighbour —
 *      caught by the whole-row comparison, not by any count.
 *   2. one Chapter 30C.2 row deleted — caught by the row comparison and by the
 *      contiguity check.
 *   3. the `Escalation` and `Alert` class labels swapped between two rows —
 *      both categories hold eight, so the tally, the eleven-label count and the
 *      total of eighty-seven are ALL unchanged by the defect. That is the
 *      catalogued trap "a count check true of both the defect and the fix
 *      because two categories had the same number of rows", and it is caught
 *      here by the key-by-key comparison and the pinned rows, not by a count.
 *   4. the brand removed from `NotificationKey` — caught by typecheck, because
 *      the `@ts-expect-error` proofs below stop erroring. The runtime suite
 *      stayed GREEN on that plant, which is the honest limit of this file:
 *      `pnpm typecheck` is what enforces the type-level requirement, not
 *      `pnpm test:unit`.
 *   5. `NotificationIdOf` widened so the register no longer narrows the
 *      identifier — caught by the second `@ts-expect-error`, which proves the
 *      three proofs are independent rather than one guard counted three times.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const LINES = readFileSync(SOURCE_PATH, 'utf8').split('\n')

/** Frozen-source line `n`, one-based, as the document numbers them. */
const at = (n: number): string => LINES[n - 1] ?? ''
const cells = (n: number): string[] =>
  at(n)
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim())
const bare = (cell: string): string => cell.replace(/`/g, '')

describe('the frozen source is the one this task measured', () => {
  it('has the expected line count', () => {
    // 122,241 lines and a trailing newline, so the split yields one more.
    expect(LINES.length).toBe(122_242)
  })
})

describe('Chapter 27.7 notification catalog — twenty-five rows, counted', () => {
  const header = 51_686
  const separator = 51_687
  const firstRow = 51_688

  it('opens with a header and a separator and stops where the module says', () => {
    expect(at(header).startsWith('| Identifier | Name | Family |')).toBe(true)
    expect(at(separator)).toBe('|---|---|---|---|---|---|---|---|')
    // Counted by reading to where the body stops, never inferred from a span:
    // the row after the last one is blank and the next content is a new table.
    expect(at(51_713).trim()).toBe('')
    expect(at(51_714)).toContain('The two-level configuration model')
  })

  it('matches the module row for row, in source order', () => {
    const derived: { id: string; name: string; sourceLine: number }[] = []
    for (let n = firstRow; at(n).startsWith('| `NOTIF-'); n += 1) {
      const columns = cells(n)
      expect(columns).toHaveLength(8)
      derived.push({ id: bare(columns[0] ?? ''), name: columns[1] ?? '', sourceLine: n })
    }
    expect(derived).toHaveLength(25)
    expect(derived[derived.length - 1]?.sourceLine).toBe(51_712)
    expect(CH_27_7_CATALOG.map((row) => ({ id: row.id, name: row.name, sourceLine: row.sourceLine }))).toEqual(
      derived,
    )
  })

  it('carries nine mandatory-baseline rows, the number TEST-27.7-03 states', () => {
    const baseline = CH_27_7_CATALOG.filter((row) => row.family === 'Mandatory baseline')
    expect(baseline).toHaveLength(9)
    // The count is stated beside the enumeration and the two agree here.
    expect(at(51_734)).toContain('TEST-27.7-03')
    expect(at(51_734)).toContain('the nine mandatory-baseline notifications still fire')
    // And the nine are the first nine identifiers, not nine scattered rows.
    expect(baseline.map((row) => row.id)).toEqual(
      CH_27_7_CATALOG.slice(0, 9).map((row) => row.id),
    )
  })
})

describe('Chapter 30C.2 category catalog — eighty-seven rows in thirteen families', () => {
  const derived: { id: string; name: string; className: string; family: number; sourceLine: number }[] =
    []
  const familyLabels = new Map<number, string>()
  let family = 0
  for (let n = 72_946; n <= 73_096; n += 1) {
    const heading = /^\*\*Family (\d+),\s*([^.]*)\./.exec(at(n))
    if (heading !== null) {
      family = Number(heading[1])
      familyLabels.set(family, (heading[2] ?? '').trim())
      continue
    }
    if (!at(n).startsWith('| `NOTIF-')) continue
    const columns = cells(n)
    derived.push({
      id: bare(columns[0] ?? ''),
      name: columns[1] ?? '',
      className: bare(columns[2] ?? ''),
      family,
      sourceLine: n,
    })
  }

  it('has eighty-seven rows and thirteen families that reconcile', () => {
    expect(derived).toHaveLength(87)
    expect(familyLabels.size).toBe(13)
    const perFamily = [...familyLabels.keys()].map(
      (id) => derived.filter((row) => row.family === id).length,
    )
    expect(perFamily).toEqual([12, 5, 2, 12, 5, 9, 8, 9, 4, 6, 7, 7, 1])
    expect(perFamily.reduce((sum, n) => sum + n, 0)).toBe(87)
  })

  it('runs NOTIF-001 to NOTIF-087 contiguously, with no gap and no duplicate', () => {
    const numbers = derived.map((row) => Number(row.id.slice('NOTIF-'.length)))
    expect(numbers).toEqual(Array.from({ length: 87 }, (_, index) => index + 1))
  })

  it('matches the module row for row, including every class label', () => {
    expect(
      CH_30C_2_CATEGORIES.map((row) => ({
        id: row.id,
        name: row.name,
        className: row.className,
        family: row.family,
        sourceLine: row.sourceLine,
      })),
    ).toEqual(derived)
  })

  it('carries the thirteen family labels the headings give', () => {
    expect(Object.keys(NOTIFICATION_FAMILIES)).toHaveLength(13)
    for (const [id, label] of familyLabels) {
      expect(NOTIFICATION_FAMILIES[id]).toBe(label)
    }
  })

  it('has twenty-three affirmative-mandatory cells, a different sense from the nine', () => {
    const affirmative = CH_30C_2_CATEGORIES.filter((row) => row.mandatory.startsWith('Yes'))
    expect(affirmative).toHaveLength(23)
    // Three distinct affirmative wordings, so a bare-equality filter under-counts.
    expect(new Set(affirmative.map((row) => row.mandatory)).size).toBe(3)
    // The two senses are never summed. Nine plus twenty-three appears nowhere.
    // `as const` on SIGNAL_COUNTS narrows `measured` to the literals it holds,
    // so this is widened deliberately -- a strict comparison would be a type
    // error rather than a check, and a type error is not a passing test.
    const measured: number[] = SIGNAL_COUNTS.map((count) => count.measured)
    expect(measured).not.toContain(9 + 23)
  })

  it('never presents a severity as source-backed', () => {
    // L72944: severity is `Recommendation — R&D` in every row, under DEC-NOTIFSEV-001.
    expect(at(72_944)).toContain('are `Recommendation — R&D` in every row')
    expect(at(73_147)).toContain('DEC-NOTIFSEV-001')
    for (const row of CH_30C_2_CATEGORIES) {
      expect(row.recommendedSeverity.length).toBeGreaterThan(0)
    }
    // The field is named for what it is; nothing in this module calls it `severity`.
    const module = readFileSync(join(process.cwd(), 'src', 'registry', 'signals.ts'), 'utf8')
    expect(/\bseverity\s*:/.test(module)).toBe(false)
  })
})

describe('the collision — one key space, two different assignments', () => {
  it('is a complete overlap with zero name agreement', () => {
    const byId = new Map(CH_30C_2_CATEGORIES.map((row) => [row.id as string, row]))
    const shared = CH_27_7_CATALOG.filter((row) => byId.has(row.id))
    expect(shared).toHaveLength(25)
    // Not a subset. Not one of the twenty-five carries the same name in both.
    const agreeing = shared.filter((row) => byId.get(row.id)?.name === row.name)
    expect(agreeing).toEqual([])
  })

  it('discloses both readings of every colliding identifier', () => {
    expect(NOTIFICATION_COLLISIONS).toHaveLength(25)
    const byId = new Map(CH_30C_2_CATEGORIES.map((row) => [row.id as string, row]))
    for (const collision of NOTIFICATION_COLLISIONS) {
      const ch277 = CH_27_7_CATALOG.find((row) => row.id === collision.id)
      const ch30c2 = byId.get(collision.id)
      expect(ch277?.name).toBe(collision.ch277Name)
      expect(ch277?.sourceLine).toBe(collision.ch277Line)
      expect(ch30c2?.name).toBe(collision.ch30c2Name)
      expect(ch30c2?.sourceLine).toBe(collision.ch30c2Line)
      // A disclosure that showed the same name twice would disclose nothing.
      expect(collision.ch277Name).not.toBe(collision.ch30c2Name)
    }
  })

  it('pins the two identifiers the brief names, at their own lines', () => {
    expect(at(51_688)).toContain('Subscription or tier lifecycle change')
    expect(at(72_950)).toContain('Tenant workspace activated')
    expect(at(51_697)).toContain('Severity 1 escalation')
    expect(at(72_959)).toContain('Hard suspension entered')
    expect(lookupNotification('ch-27.7-catalog', 'NOTIF-001').name).toBe(
      'Subscription or tier lifecycle change',
    )
    expect(lookupNotification('ch-30c.2-categories', 'NOTIF-001').name).toBe(
      'Tenant workspace activated',
    )
    expect(lookupNotification('ch-27.7-catalog', 'NOTIF-010').name).toBe('Severity 1 escalation')
    expect(lookupNotification('ch-30c.2-categories', 'NOTIF-010').name).toBe(
      'Hard suspension entered',
    )
  })

  it('keeps the two registers addressable side by side — 112 distinct keys', () => {
    const keys = [
      ...CH_27_7_CATALOG.map((row) => notificationKey('ch-27.7-catalog', row.id)),
      ...CH_30C_2_CATEGORIES.map((row) => notificationKey('ch-30c.2-categories', row.id)),
    ]
    expect(keys).toHaveLength(112)
    expect(new Set(keys).size).toBe(112)
    for (const key of keys) expect(resolveNotification(key)).toBeDefined()
    expect(notificationsIn('ch-27.7-catalog')).toHaveLength(25)
    expect(notificationsIn('ch-30c.2-categories')).toHaveLength(87)
    expect(NOTIFICATION_REGISTERS).toHaveLength(2)
  })
})

describe('a bare NOTIF-* literal cannot reach a lookup', () => {
  it('fails at the type level, three ways', () => {
    // @ts-expect-error a bare identifier is not a branded NotificationKey
    expect(() => resolveNotification('NOTIF-001')).toThrow()

    // @ts-expect-error NOTIF-042 is not in Chapter 27.7's twenty-five
    expect(() => notificationKey('ch-27.7-catalog', 'NOTIF-042')).not.toThrow()

    // @ts-expect-error there is no register-less lookup to fall back on
    expect(() => lookupNotification('NOTIF-001')).toThrow()
  })

  it('and the register is what disambiguates, at runtime too', () => {
    const a = notificationKey('ch-27.7-catalog', 'NOTIF-010')
    const b = notificationKey('ch-30c.2-categories', 'NOTIF-010')
    expect(a).not.toBe(b)
    expect(resolveNotification(a).register).toBe('ch-27.7-catalog')
    expect(resolveNotification(b).register).toBe('ch-30c.2-categories')
  })
})

describe('the class distribution the prose contradicts', () => {
  const counted = new Map<string, number>()
  for (let n = 72_950; n <= 73_096; n += 1) {
    if (!at(n).startsWith('| `NOTIF-')) continue
    const className = bare(cells(n)[2] ?? '')
    counted.set(className, (counted.get(className) ?? 0) + 1)
  }

  it('derives eleven distinct class labels from the rows', () => {
    expect(counted.size).toBe(11)
    expect([...counted.values()].reduce((sum, n) => sum + n, 0)).toBe(87)
  })

  it('matches the module key by key, which a swap of two equal counts would not', () => {
    // Escalation and Alert are both eight. A total or a count-of-counts check
    // passes on a defect that swaps their labels; this one does not.
    expect(counted.get('Escalation')).toBe(8)
    expect(counted.get('Alert')).toBe(8)
    for (const [className, total] of counted) {
      expect(
        (NOTIFICATION_CLASS_DISTRIBUTION.counted as Record<string, number>)[className],
      ).toBe(total)
    }
    expect(Object.keys(NOTIFICATION_CLASS_DISTRIBUTION.counted)).toHaveLength(counted.size)
    // Pinned rows, so a relabelling that preserves both totals still fails.
    expect(CH_30C_2_CATEGORIES.find((row) => row.id === 'NOTIF-006')?.className).toBe('Escalation')
    expect(CH_30C_2_CATEGORIES.find((row) => row.id === 'NOTIF-011')?.className).toBe(
      'Command-linked notification',
    )
  })

  it('reads the prose figures off L72929 and finds six of eight wrong', () => {
    const prose = at(72_929)
    expect(prose).toContain('The distribution is: 34 notifications, 9 alerts')
    const stated = NOTIFICATION_CLASS_DISTRIBUTION.stated
    expect(NOTIFICATION_CLASS_DISTRIBUTION.statedAt).toBe(72_929)
    // Each prose figure is really in that line, as a number beside its term.
    expect(prose).toContain('34 notifications')
    expect(prose).toContain('9 alerts')
    expect(prose).toContain('12 action-required notifications')
    expect(prose).toContain('8 approval requests')
    expect(prose).toContain('0 general tasks')
    expect(prose).toContain('6 reminders')
    expect(prose).toContain('15 escalations')
    expect(prose).toContain('3 command-linked notifications')
    // The prose total is right; six of its eight terms are not.
    expect((Object.values(stated) as number[]).reduce((sum, n) => sum + n, 0)).toBe(87)
    const disagreeing = (
      [
        ['Notification', stated.Notification],
        ['Alert', stated.Alert],
        ['Action-required notification', stated['Action-required notification']],
        ['Approval request', stated['Approval request']],
        ['Reminder', stated.Reminder],
        ['Escalation', stated.Escalation],
        ['Command-linked notification', stated['Command-linked notification']],
      ] as const
    ).filter(([className, figure]) => counted.get(className) !== figure)
    expect(disagreeing.map(([className]) => className)).toEqual([
      'Notification',
      'Alert',
      'Action-required notification',
      'Approval request',
      'Reminder',
      'Escalation',
      'Command-linked notification',
    ])
    // Seven terms disagree; the eighth, general tasks, is zero on both sides
    // because no general task object exists, and the total also agrees.
    expect(stated['General task']).toBe(0)
    expect(counted.get('General task')).toBeUndefined()
  })

  it('shows that no folding of the compound tokens reconciles it', () => {
    // Folding a compound into a simple class only ever RAISES the simple count.
    // Command-linked is already five against a claimed three, so no folding
    // reaches the prose in that column.
    expect(counted.get('Command-linked notification')).toBe(5)
    expect(NOTIFICATION_CLASS_DISTRIBUTION.stated['Command-linked notification']).toBe(3)
    // Escalation fails in the other direction: every compound naming escalation,
    // folded in, still reaches nine against a claimed fifteen.
    const escalationish = [...counted.entries()]
      .filter(([className]) => className.toLowerCase().includes('escalation'))
      .reduce((sum, [, total]) => sum + total, 0)
    expect(escalationish).toBe(9)
    expect(NOTIFICATION_CLASS_DISTRIBUTION.stated.Escalation).toBe(15)
    // Even folding EVERY compound token into notifications overshoots.
    const notificationish = [...counted.entries()]
      .filter(([className]) => className.toLowerCase().includes('notification'))
      .reduce((sum, [, total]) => sum + total, 0)
    expect(notificationish).toBeGreaterThan(NOTIFICATION_CLASS_DISTRIBUTION.stated.Notification)
  })

  it('labels the eighty-seven a Derived Clarification wherever it renders', () => {
    expect(NOTIFICATION_COUNT_LABEL.decision).toBe('DEC-NOTIFCOUNT-001')
    expect(NOTIFICATION_COUNT_LABEL.classification).toBe('Derived Clarification')
    expect(at(NOTIFICATION_COUNT_LABEL.statedAt)).toContain('DEC-NOTIFCOUNT-001')
    expect(at(NOTIFICATION_COUNT_LABEL.statedAt)).toContain(
      'The number eighty-seven is `Derived Clarification`, not a source fact.',
    )
    // L73133 extends the same label to the families and the distribution.
    expect(at(73_133)).toContain(
      'The count of eighty-seven, the thirteen-family organisation, and the class distribution are `Derived Clarification`',
    )
    // Anything rendering the 87 renders the label with it, so both counts that
    // reconcile carry it and no per-class figure is offered as safe.
    expect(NOTIFICATION_CLASS_DISTRIBUTION.safeToRender).toContain('no per-class figure')
  })
})

describe('the event catalogue — twenty-five counted, twenty-eight in the registry', () => {
  const derived: { id: string; name: string; sourceLine: number }[] = []
  for (const [lo, hi] of [
    [51_051, 51_059],
    [51_177, 51_192],
  ] as const) {
    for (let n = lo; n <= hi; n += 1) {
      const columns = cells(n)
      derived.push({ id: bare(columns[0] ?? ''), name: columns[1] ?? '', sourceLine: n })
    }
  }

  it('is nine capture events plus sixteen operational and server events', () => {
    expect(derived).toHaveLength(25)
    expect(derived.filter((row) => row.id.startsWith('EVT-CAP-'))).toHaveLength(9)
    expect(derived.filter((row) => row.id.startsWith('EVT-OPS-'))).toHaveLength(4)
    expect(derived.filter((row) => row.id.startsWith('EVT-SRV-'))).toHaveLength(12)
    // Both tables stop where the module says: the row after each is not one.
    expect(at(51_060).trim()).toBe('')
    expect(at(51_193).trim()).toBe('')
    expect(
      EVENT_CATALOGUE.map((row) => ({ id: row.id, name: row.name, sourceLine: row.sourceLine })),
    ).toEqual(derived)
  })

  it('reports the source count beside the enumeration for the capture family', () => {
    // L51045 states nine for the capture family alone, not for the catalogue.
    expect(at(51_045)).toContain('Nine capture-family events')
    const stated = SIGNAL_COUNTS.find((count) => count.of === 'catalogued events')
    expect(stated?.measured).toBe(25)
    expect(stated?.statedInSource).toBe(9)
    expect(stated?.statedAt).toBe(51_045)
  })

  it('accounts for the registry difference row by row, not by subtraction', () => {
    const registryIds = new Set(eventsRegistry.rows.map((row) => row.id))
    expect(registryIds.size).toBe(28)
    const catalogued = new Set<string>(EVENT_CATALOGUE.map((row) => row.id))
    const surplus = [...registryIds].filter((id) => !catalogued.has(id)).sort()
    expect(surplus).toEqual(EVENT_REGISTRY_EXTRAS.map((extra) => extra.id).sort())
    // Nothing in the catalogue is missing from the registry either.
    expect([...catalogued].filter((id) => !registryIds.has(id))).toEqual([])
    for (const extra of EVENT_REGISTRY_EXTRAS) {
      expect(at(extra.sourceLine)).toContain(extra.id)
      expect(extra.provenance.length).toBeGreaterThan(20)
    }
  })

  it('records that the EVT-DOH-* family is in the registry only twice of ten', () => {
    let rows = 0
    for (let n = 26_171; n <= 26_180; n += 1) if (at(n).startsWith('| `EVT-DOH-')) rows += 1
    expect(rows).toBe(10)
    expect(at(26_170).startsWith('| `EVT-DOH-')).toBe(false)
    expect(at(26_181).startsWith('| `EVT-DOH-')).toBe(false)
    const inRegistry = eventsRegistry.rows.filter((row) => row.id.startsWith('EVT-DOH-'))
    expect(inRegistry).toHaveLength(2)
  })
})

describe('the command catalogue — sixteen counted, and the source agrees', () => {
  const derived: { id: string; name: string; sourceLine: number }[] = []
  for (const [lo, hi] of [
    [51_387, 51_394],
    [51_490, 51_497],
  ] as const) {
    for (let n = lo; n <= hi; n += 1) {
      const columns = cells(n)
      derived.push({ id: bare(columns[0] ?? ''), name: columns[1] ?? '', sourceLine: n })
    }
  }

  it('is eight rows per Panel A table, and the stated count matches', () => {
    expect(derived).toHaveLength(16)
    expect(at(51_395).trim()).toBe('')
    expect(at(51_498).trim()).toBe('')
    expect(at(51_334)).toContain(
      'Sixteen command instances are catalogued across those five classes.',
    )
    expect(
      COMMAND_CATALOGUE.map((row) => ({ id: row.id, name: row.name, sourceLine: row.sourceLine })),
    ).toEqual(derived)
  })

  it('keeps the five classes closed and names the one instance that is not in them', () => {
    // L51330 says why the closure matters, in one sentence.
    expect(at(51_330)).toContain(
      'A command channel with an open class list is a remote-execution surface',
    )
    const named = COMMAND_CATALOGUE.filter(
      (row) => !row.className.startsWith('Client Decision Required'),
    )
    expect(new Set(named.map((row) => row.className))).toEqual(
      new Set([
        'Lot release',
        'Reassignment or substitution',
        'Qualification clearance',
        'Suspension',
        'Version change',
      ]),
    )
    const unclassed = COMMAND_CATALOGUE.filter((row) => !named.includes(row))
    expect(unclassed.map((row) => row.id)).toEqual(['CMD-SUSP-005'])
    expect(at(51_551)).toContain('DEC-CMDCLASS-001')
  })

  it('accounts for the seventeenth registry row', () => {
    const registryIds = new Set(commandsRegistry.rows.map((row) => row.id))
    expect(registryIds.size).toBe(17)
    const catalogued = new Set<string>(COMMAND_CATALOGUE.map((row) => row.id))
    expect([...registryIds].filter((id) => !catalogued.has(id))).toEqual(['CMD-BB-000097'])
    expect([...catalogued].filter((id) => !registryIds.has(id))).toEqual([])
    expect(COMMAND_REGISTRY_EXTRAS.map((extra) => extra.id)).toEqual(['CMD-BB-000097'])
    expect(at(74_155)).toContain('CMD-BB-000097')
    expect(at(74_155)).toContain('Illustrative Example')
  })
})

describe('the generated notification registry loses twenty-five rows', () => {
  /**
   * REPORTED FOR TASK 13, and asserted here so the repair is measurable rather
   * than remembered. `registries/generated/notifications.json` deduplicates on
   * the identifier alone, so the twenty-five identifiers both registers claim
   * appear ONCE. The surviving row takes the LOWEST locator, which is Chapter
   * 27.7's — so the file's 87 plain `NOTIF-*` rows are 25 rows of one register
   * blended with 62 of the other, and it reads as complete.
   *
   * When task 13 keys the registry on the register as well as the identifier,
   * this block should be updated to 112 and the blend assertions dropped.
   */
  const plain = notificationsRegistry.rows.filter((row) => /^NOTIF-\d+$/.test(row.id))

  it('holds 87 plain rows where the two registers hold 112 between them', () => {
    expect(plain).toHaveLength(87)
    expect(new Set(plain.map((row) => row.id)).size).toBe(87)
    expect(CH_27_7_CATALOG.length + CH_30C_2_CATEGORIES.length).toBe(112)
  })

  it('is a blend: the first twenty-five locators are Chapter 27.7s', () => {
    const from277 = plain.filter((row) => row.sourceLine >= 51_688 && row.sourceLine <= 51_712)
    const from30c2 = plain.filter((row) => row.sourceLine >= 72_950 && row.sourceLine <= 73_096)
    expect(from277).toHaveLength(25)
    expect(from30c2).toHaveLength(62)
    expect(from277.length + from30c2.length).toBe(plain.length)
    // Every Chapter 30C.2 row for NOTIF-001..025 is absent from the file.
    const lost = CH_30C_2_CATEGORIES.filter((row) =>
      from277.some((present) => present.id === row.id),
    )
    expect(lost).toHaveLength(25)
  })

  it('carries a second register field that does not describe this split', () => {
    // The `register` field exists, which is what made this task's shape cheap,
    // but it separates the identifier index from the derived Studio triggers —
    // not Chapter 27.7 from Chapter 30C.2.
    const registers = new Set(notificationsRegistry.rows.map((row) => row.register))
    expect(registers.size).toBe(2)
    expect([...registers].some((label) => label.includes('27.7'))).toBe(false)
    expect([...registers].some((label) => label.includes('30C'))).toBe(false)
  })
})

describe('every count this task measured is reported against its hypothesis', () => {
  it('states a measured number, a provenance and a classification for each', () => {
    expect(SIGNAL_COUNTS.length).toBeGreaterThanOrEqual(9)
    for (const count of SIGNAL_COUNTS) {
      expect(count.measured).toBeGreaterThan(0)
      expect(count.of.length).toBeGreaterThan(3)
      expect(count.classification.length).toBeGreaterThan(3)
      expect(count.note.length).toBeGreaterThan(20)
      // A stated count and its locator travel together or not at all.
      expect(count.statedInSource === null).toBe(count.statedAt === null)
      if (count.statedAt !== null) expect(at(count.statedAt).trim().length).toBeGreaterThan(0)
    }
  })

  it('agrees with the rows it counts', () => {
    const byOf = new Map(SIGNAL_COUNTS.map((count) => [count.of, count]))
    expect(byOf.get('Chapter 27.7 notification catalog rows')?.measured).toBe(
      CH_27_7_CATALOG.length,
    )
    expect(byOf.get('Chapter 30C.2 notification categories')?.measured).toBe(
      CH_30C_2_CATEGORIES.length,
    )
    expect(byOf.get('Chapter 30C.2 family tables')?.measured).toBe(
      Object.keys(NOTIFICATION_FAMILIES).length,
    )
    expect(byOf.get('identifiers claimed by both registers')?.measured).toBe(
      NOTIFICATION_COLLISIONS.length,
    )
    expect(byOf.get('union of both registers, keyed by register and identifier')?.measured).toBe(
      CH_27_7_CATALOG.length + CH_30C_2_CATEGORIES.length,
    )
    expect(byOf.get('catalogued events')?.measured).toBe(EVENT_CATALOGUE.length)
    expect(byOf.get('catalogued command instances')?.measured).toBe(COMMAND_CATALOGUE.length)
  })
})
