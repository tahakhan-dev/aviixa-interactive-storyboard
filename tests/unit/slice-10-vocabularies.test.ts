import { describe, expect, it } from 'vitest'

import {
  COMMAND_STATE_COUNT_READINGS,
  NOTIFICATION_LEVEL_ROWS,
  NOTIFICATION_STATES,
  NOTIFICATION_STATE_DISTINCTIONS,
  SCHEDULE_DEFINITION_STATES,
  SCHEDULE_DEFINITION_TRANSITIONS,
  SCHEDULE_OCCURRENCE_STATES,
  SCHEDULE_OCCURRENCE_TRANSITIONS,
  TIMING_CLASSIFICATIONS,
  notificationLevel,
  type NotificationPriority,
  type NotificationSeverity,
} from '@/domain/vocabularies'
import { CAPTURE_STATES } from '@/frontline/capture'
import { B10_NOTIFICATION_STATES } from '@/frontline/modules/fl-b10/charter'
import { approvalNotificationRows } from '@/studio/modules/stu-11/chain'
import { COMMAND_STATES } from '@/surfaces/sa/command-state'

/**
 * SLICE 10, TASK 3 — THE SIX CLOSED VOCABULARIES, CHECKED AGAINST THE FROZEN
 * SOURCE RATHER THAN AGAINST THEMSELVES.
 *
 * EVERY EXPECTATION IN THIS FILE IS TRANSCRIBED HERE, INDEPENDENTLY. Two
 * catalogued gates-that-could-not-fail are directly in this file's way:
 * `toEqual([...MY_CONSTANT])`, and a `for...of` over the constant it was meant
 * to verify, which shrank along with its subject. So no assertion below reads
 * its expected value from the module under test: each list is typed out again
 * from the blueprint line named beside it, and every membership loop is paired
 * with an exact length so a list that lost a member cannot pass vacuously.
 *
 * The compile-time half of the contract is not here at all — it is the
 * `Exclude<...>` pairs in `@/domain/vocabularies`, which `pnpm typecheck`
 * enforces. This file is the runtime half: that the members are the SOURCE's
 * members, in the source's order, and that the copies elsewhere in the tree
 * still agree with them.
 */

/** L51605, transcribed. The heading on that line calls them nineteen. */
const NINETEEN_FROM_L51605 = [
  'created',
  'eligible',
  'suppressed',
  'queued',
  'sent',
  'provider-accepted',
  'delivered',
  'opened',
  'read',
  'acknowledged',
  'claimed',
  'acted',
  'escalated',
  'resolved',
  'expired',
  'superseded',
  'cancelled',
  'failed',
  'reconciled',
]

/**
 * L50690, transcribed in the source's spaced form — "The thirteen states
 * are:". `CAPTURE_STATES` was transcribed off §22.6.1 by slice 7 and spells
 * the same states with hyphens, so the comparison normalises the separator
 * and nothing else.
 */
const THIRTEEN_FROM_L50690 = [
  'committed locally',
  'queued',
  'uploading',
  'upload interrupted',
  'uploaded',
  'server received',
  'validated',
  'accepted',
  'quarantined',
  'rejected',
  'officially recorded',
  'reflected in summaries',
  'reconciled',
]

describe('the nineteen notification states (L51605)', () => {
  it('is nineteen members, in the order the source names them', () => {
    expect(NOTIFICATION_STATES.length).toBe(19)
    expect(NINETEEN_FROM_L51605.length).toBe(19)
    expect([...NOTIFICATION_STATES]).toEqual(NINETEEN_FROM_L51605)
  })

  it('collapses nothing: nineteen distinct members, and the four distinctions hold', () => {
    expect(new Set(NOTIFICATION_STATES).size).toBe(19)

    // L51605 — "Sending is not delivery; delivery is not opening; opening is
    // not acknowledgement; acknowledgement is not the business action."
    // Transcribed as ordered pairs, and checked as ORDER rather than mere
    // inequality: two distinct members in the wrong order would satisfy an
    // inequality check and still misrepresent the lifecycle.
    const pairs: readonly (readonly [string, string])[] = [
      ['sent', 'delivered'],
      ['delivered', 'opened'],
      ['opened', 'acknowledged'],
      ['acknowledged', 'acted'],
    ]
    expect(NOTIFICATION_STATE_DISTINCTIONS.length).toBe(pairs.length)
    expect(NOTIFICATION_STATE_DISTINCTIONS.map((r) => [r.earlier, r.later])).toEqual(
      pairs.map(([earlier, later]) => [earlier, later]),
    )
    const at = (s: string) => NINETEEN_FROM_L51605.indexOf(s)
    for (const [earlier, later] of pairs) {
      expect(at(earlier)).toBeGreaterThanOrEqual(0)
      expect(at(earlier)).toBeLessThan(at(later))
    }
  })

  it("holds MOD-FL-B10's module-scoped copy of the same nineteen equal to it", () => {
    // `B10NotificationState` (§22.19 L41808) is the same vocabulary read from
    // a different line. Neither file imports the other, so this is the only
    // thing standing between them and a silent divergence.
    expect(B10_NOTIFICATION_STATES.map((r) => r.id as string)).toEqual(NINETEEN_FROM_L51605)
  })

  it("keeps MOD-STU-11's untyped progression arrays inside the vocabulary", () => {
    // `approvalNotificationRows()` builds its progressions from bare string
    // literals with no union behind them, so a typo there is invisible to
    // `tsc`. Every element must be one of the nineteen.
    const rows = approvalNotificationRows()
    expect(rows.length).toBe(5)
    const seen = new Set<string>()
    for (const row of rows) {
      expect(row.progression.length).toBeGreaterThan(0)
      for (const state of row.progression) {
        expect(NINETEEN_FROM_L51605).toContain(state)
        seen.add(state)
      }
    }
    // Named so the check cannot pass on a single lucky element: the twelve
    // states those five rows actually walk -- the nine-state shared base plus
    // `claimed`, `acted` and `escalated`.
    expect(seen.size).toBe(12)
  })
})

describe('the thirteen capture states, stated twice and agreeing', () => {
  it('chapter 27 (L50690) names the same thirteen as the shipped ladder', () => {
    expect(THIRTEEN_FROM_L50690.length).toBe(13)
    expect(CAPTURE_STATES.length).toBe(13)
    expect([...CAPTURE_STATES]).toEqual(THIRTEEN_FROM_L50690.map((s) => s.replace(/ /g, '-')))
  })

  it('has no collapsed success member, in either statement', () => {
    // L50547 — "never use \"synced\" as the only state". AC-CH27-03 (L50597)
    // makes it testable. Checked on the transcription too, so a transcription
    // error that introduced one would also fail.
    for (const collapsed of ['synced', 'sync', 'done', 'complete', 'success', 'ok']) {
      expect(THIRTEEN_FROM_L50690).not.toContain(collapsed)
      expect(CAPTURE_STATES as readonly string[]).not.toContain(collapsed)
    }
  })
})

describe('the command lifecycle count, which the source states three ways', () => {
  it('is fifteen in the shipped vocabulary, with the two folded states held distinct', () => {
    // AC-27.3-02 (L50882) requires all fifteen to be individually
    // representable "with `available for delivery` and `delivered` held
    // distinct". Those two are exactly what the fourteen-item statements fold.
    expect(COMMAND_STATES.length).toBe(15)
    expect(COMMAND_STATES).toContain('available for delivery')
    expect(COMMAND_STATES).toContain('delivered')
    expect(COMMAND_STATES.indexOf('available for delivery')).not.toBe(
      COMMAND_STATES.indexOf('delivered'),
    )
  })

  it('records all three counts the source states, and which is the vocabulary', () => {
    expect(COMMAND_STATE_COUNT_READINGS.map((r) => r.count)).toEqual([15, 15, 14, 14, 14, 8])

    const vocabulary = COMMAND_STATE_COUNT_READINGS.filter((r) => r.kind === 'vocabulary')
    expect(vocabulary.length).toBe(2)
    for (const r of vocabulary) expect(r.count).toBe(15)
    expect(vocabulary.every((r) => r.count === COMMAND_STATES.length)).toBe(true)

    // The eight-item reading is a walk of the happy path, never a vocabulary.
    expect(
      COMMAND_STATE_COUNT_READINGS.filter((r) => r.count === 8).map((r) => r.kind),
    ).toEqual(['walk'])
  })
})

describe('notification severity and priority — seven rows in one table (L73149)', () => {
  it('is four severity levels and three priority levels, named as the source names them', () => {
    expect(NOTIFICATION_LEVEL_ROWS.length).toBe(7)
    expect(NOTIFICATION_LEVEL_ROWS.filter((r) => r.axis === 'severity').map((r) => r.name)).toEqual([
      'Critical',
      'High',
      'Medium',
      'Informational',
    ])
    expect(NOTIFICATION_LEVEL_ROWS.filter((r) => r.axis === 'priority').map((r) => r.name)).toEqual([
      'Immediate',
      'Standard',
      'Deferred',
    ])
    expect(NOTIFICATION_LEVEL_ROWS.map((r) => r.level)).toEqual([
      'Severity 1 of 4',
      'Severity 2 of 4',
      'Severity 3 of 4',
      'Severity 4 of 4',
      'Priority 1 of 3',
      'Priority 2 of 3',
      'Priority 3 of 3',
    ])
  })

  it('carries the R&D classification on every row, so no screen can present one as a fact', () => {
    // L73186 — "The four severity levels, the three priority levels, the
    // assignment table, and the unclassified fallback are" a recommendation.
    for (const row of NOTIFICATION_LEVEL_ROWS) {
      expect(row.sourceClass).toBe('Recommendation — R&D')
    }
    expect(NOTIFICATION_LEVEL_ROWS.filter((r) => r.sourceClass !== 'Recommendation — R&D').length)
      .toBe(0)
    expect(new Set(NOTIFICATION_LEVEL_ROWS.map((r) => r.decision))).toEqual(
      new Set(['DEC-NOTIFSEV-001', 'DEC-NOTIFPRI-001']),
    )
  })

  it('reaches a level only through its row, and is total over both unions', () => {
    const severities: NotificationSeverity[] = ['Critical', 'High', 'Medium', 'Informational']
    const priorities: NotificationPriority[] = ['Immediate', 'Standard', 'Deferred']
    for (const name of [...severities, ...priorities]) {
      const row = notificationLevel(name)
      expect(row.name).toBe(name)
      expect(row.sourceClass).toBe('Recommendation — R&D')
    }
    expect(severities.length + priorities.length).toBe(NOTIFICATION_LEVEL_ROWS.length)
    expect(new Set(NOTIFICATION_LEVEL_ROWS.map((r) => r.name)).size).toBe(7)
  })
})

describe('the thirteen timing classifications, TC-01 to TC-13 (L98082)', () => {
  it('is thirteen rows, coded in order with no gap', () => {
    const codes = Array.from({ length: 13 }, (_, i) => `TC-${String(i + 1).padStart(2, '0')}`)
    expect(codes[0]).toBe('TC-01')
    expect(codes[12]).toBe('TC-13')
    expect(TIMING_CLASSIFICATIONS.length).toBe(13)
    expect(TIMING_CLASSIFICATIONS.map((r) => r.code)).toEqual(codes)
  })

  it('names each classification as the source titles it', () => {
    // Transcribed from the table body, L98084-L98096.
    expect(TIMING_CLASSIFICATIONS.map((r) => r.classification)).toEqual([
      'No time-based behaviour',
      'Event-driven',
      'Action-time deterministic validation',
      'Frontline local signed timer or offline-expiry check',
      'Durable one-time business deadline',
      'Recurring business schedule',
      'Delayed queue item, retry or escalation',
      'Data-pipeline or analytical schedule',
      'Artificial-intelligence evaluation or maintenance schedule',
      'Platform or infrastructure maintenance schedule',
      'Storage or retention lifecycle policy',
      'Manual governed operation',
      'Client Decision Required',
    ])
  })

  it('never lets the code stand in for the reader-facing title', () => {
    // L98080 — the codes "are never reader-facing titles".
    for (const row of TIMING_CLASSIFICATIONS) {
      expect(row.classification).not.toContain('TC-')
      expect(row.classification.length).toBeGreaterThan(row.code.length)
      expect(row.owner.length).toBeGreaterThan(0)
      expect(row.calendarRuleAppropriate.length).toBeGreaterThan(0)
    }
  })
})

describe('the schedule DEFINITION lifecycle — ten states, fourteen transitions', () => {
  it('is ten states, in diagram order (L99022-L99031)', () => {
    expect(SCHEDULE_DEFINITION_STATES.length).toBe(10)
    expect([...SCHEDULE_DEFINITION_STATES]).toEqual([
      'draft',
      'pending-approval',
      'approved',
      'active',
      'paused',
      'suspended-by-tenant-state',
      'held-by-maintenance-window',
      'superseded',
      'retired',
      'archived',
    ])
  })

  it('is fourteen transitions, each naming its causer class (L99056-L99069)', () => {
    // Transcribed from the "Who may cause each definition transition" table,
    // as label and causer class together, so a row that kept its label and
    // lost its causer cannot pass.
    expect([
      ...SCHEDULE_DEFINITION_TRANSITIONS.map((t) => `${t.label} | ${t.causerClass}`),
    ]).toEqual([
      'Draft to Pending approval | human',
      'Pending approval to Draft | human',
      'Pending approval to Approved | human',
      'Approved to Active | human',
      'Active to Paused | human',
      'Paused to Active | human',
      'Active to Suspended by tenant state | noHumanOnThisConsole',
      'Suspended by tenant state to Active | noHumanOnThisConsole',
      'Active to Held by a maintenance window | nonHumanIdentity',
      'Held by a maintenance window to Active | nonHumanIdentity',
      'Active to Superseded | human',
      'Superseded to Active | human',
      'Active or Paused to Retired | human',
      'Retired to Archived | nonHumanIdentity',
    ])
    expect(SCHEDULE_DEFINITION_TRANSITIONS.length).toBe(14)
  })

  it('is nine human, three a named non-human identity, two no human at all', () => {
    const tally = (c: string) =>
      SCHEDULE_DEFINITION_TRANSITIONS.filter((t) => t.causerClass === c).length
    expect(tally('human')).toBe(9)
    expect(tally('nonHumanIdentity')).toBe(3)
    expect(tally('noHumanOnThisConsole')).toBe(2)
    expect(tally('human') + tally('nonHumanIdentity') + tally('noHumanOnThisConsole')).toBe(14)

    // L99062 — "No human on this console; the tenant lifecycle causes it".
    // The two are the tenant-suspension pair and nothing else, because the
    // scheduling console must offer no control for either.
    expect(
      SCHEDULE_DEFINITION_TRANSITIONS.filter(
        (t) => t.causerClass === 'noHumanOnThisConsole',
      ).map((t) => t.to),
    ).toEqual(['suspended-by-tenant-state', 'active'])
  })

  it('names only declared states on both ends of every transition', () => {
    const declared = new Set<string>(SCHEDULE_DEFINITION_STATES)
    let ends = 0
    for (const t of SCHEDULE_DEFINITION_TRANSITIONS) {
      expect(t.from.length).toBeGreaterThan(0)
      for (const from of t.from) {
        expect(declared.has(from)).toBe(true)
        ends += 1
      }
      expect(declared.has(t.to)).toBe(true)
      ends += 1
    }
    // Fifteen `from` ends across fourteen rows -- "Active or Paused to
    // Retired" carries two -- plus fourteen `to` ends. Pinned so the loop
    // above cannot pass by iterating a list that lost rows.
    expect(ends).toBe(29)
  })
})

describe('the schedule OCCURRENCE lifecycle — fifteen states, nineteen transitions', () => {
  it('is fifteen states, in diagram order (L99091-L99105)', () => {
    expect(SCHEDULE_OCCURRENCE_STATES.length).toBe(15)
    expect([...SCHEDULE_OCCURRENCE_STATES]).toEqual([
      'planned',
      'due',
      'suppressed',
      'misfired',
      'claimed',
      'executing',
      'partially-executed',
      'skipped',
      'succeeded',
      'failed-retryable',
      'dead-lettered',
      'quarantined',
      'cancelled',
      'expired',
      'reconciled',
    ])
  })

  it('is nineteen transitions, each naming its causer class (L99139-L99157)', () => {
    expect([
      ...SCHEDULE_OCCURRENCE_TRANSITIONS.map((t) => `${t.label} | ${t.causerClass}`),
    ]).toEqual([
      'Planned to Due | nonHumanIdentity',
      'Planned to Suppressed | nonHumanIdentity',
      'Planned to Cancelled | human',
      'Due to Misfired | nonHumanIdentity',
      'Due to Claimed | nonHumanIdentity',
      'Claimed to Executing | nonHumanIdentity',
      'Claimed to Skipped | nonHumanIdentity',
      'Executing to Succeeded | nonHumanIdentity',
      'Executing to Partially executed | nonHumanIdentity',
      'Executing to Failed retryable | nonHumanIdentity',
      'Failed retryable to Due | nonHumanIdentity',
      'Failed retryable to Dead lettered | nonHumanIdentity',
      'Executing to Quarantined | nonHumanIdentity',
      'Misfired to Due | nonHumanIdentity',
      'Misfired to Expired | nonHumanIdentity',
      'Quarantined to Due | human',
      'Quarantined or Dead lettered to Cancelled | human',
      'Partially executed to Succeeded | nonHumanIdentity',
      'Any terminal state to Reconciled | nonHumanIdentity',
    ])
    expect(SCHEDULE_OCCURRENCE_TRANSITIONS.length).toBe(19)
  })

  it('leaves a person exactly three of the nineteen', () => {
    const human = SCHEDULE_OCCURRENCE_TRANSITIONS.filter((t) => t.causerClass === 'human')
    expect(human.map((t) => t.label)).toEqual([
      'Planned to Cancelled',
      'Quarantined to Due',
      'Quarantined or Dead lettered to Cancelled',
    ])
    expect(
      SCHEDULE_OCCURRENCE_TRANSITIONS.filter((t) => t.causerClass === 'nonHumanIdentity').length,
    ).toBe(16)
    // `noHumanOnThisConsole` belongs to the DEFINITION machine only -- the
    // tenant-lifecycle pair. Compared through a widened view because the
    // literal types of the array above no longer admit it, which is itself the
    // stronger statement.
    const classes: readonly string[] = SCHEDULE_OCCURRENCE_TRANSITIONS.map((t) => t.causerClass)
    expect(classes.filter((c) => c === 'noHumanOnThisConsole').length).toBe(0)
  })

  it('reads the terminal-to-reconciled row off the diagram edges, four of them', () => {
    // The table's own label names no states -- "Any terminal state to
    // Reconciled" -- so its `from` list is read off the diagram's edges into
    // Reconciled at L99126-L99129, which are four and not the whole
    // vocabulary. Claiming all fifteen would assert transitions the source
    // does not draw.
    const row = SCHEDULE_OCCURRENCE_TRANSITIONS.find((t) => t.to === 'reconciled')
    expect(row).toBeDefined()
    expect([...(row?.from ?? [])]).toEqual(['succeeded', 'skipped', 'expired', 'cancelled'])
  })

  it('names only declared states on both ends of every transition', () => {
    const declared = new Set<string>(SCHEDULE_OCCURRENCE_STATES)
    let ends = 0
    for (const t of SCHEDULE_OCCURRENCE_TRANSITIONS) {
      expect(t.from.length).toBeGreaterThan(0)
      for (const from of t.from) {
        expect(declared.has(from)).toBe(true)
        ends += 1
      }
      expect(declared.has(t.to)).toBe(true)
      ends += 1
    }
    // Twenty-three `from` ends across nineteen rows -- the
    // quarantined-or-dead-lettered row carries two and the terminal row
    // carries four -- plus nineteen `to` ends.
    expect(ends).toBe(42)
  })

  it('keeps the two lifecycles as two vocabularies, not one', () => {
    // MEASURED: the two vocabularies share not one member. `suppressed` is an
    // occurrence state and `paused` a definition state, and they are the pair
    // most easily confused -- L99050 names "resuming" a schedule nobody paused
    // as the most common operational error. They are separate types so a
    // reducer cannot move a definition to `dead-lettered` or an occurrence to
    // `archived`.
    const shared = SCHEDULE_DEFINITION_STATES.filter((s) =>
      (SCHEDULE_OCCURRENCE_STATES as readonly string[]).includes(s),
    )
    expect(shared).toEqual([])
    expect(SCHEDULE_DEFINITION_STATES).toContain('paused')
    expect(SCHEDULE_OCCURRENCE_STATES).toContain('suppressed')
  })
})
