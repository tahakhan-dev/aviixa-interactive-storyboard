import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import { describe, it, expect } from 'vitest'
import {
  COMMAND_ALTERNATIVE_STATES,
  COMMAND_APPLIED_LADDER,
  COMMAND_CLASS_PHASE,
  COMMAND_STATE_ACTOR,
  DEC_SYNC_001_ORDER,
  FL_COMMAND_CLASSES,
  SA_SPELLING,
  STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS,
  admitCommandClass,
  commandsForPhase,
  effectiveOnThisDevice,
  type CommandState,
  type FrontlineCommandClass,
} from '@/frontline/commands'
import { HUB_COMMAND_TYPES } from '@/domain/commands'

describe('the five command classes', () => {
  // FAILS IF: a sixth class is minted or one of the five is dropped. L39658
  // states "There are exactly five classes" and AC-FL-007-1 (L39719) has the
  // device accept exactly five.
  it('is closed at five, with each row carrying its origin and authority', () => {
    expect(FL_COMMAND_CLASSES).toHaveLength(5)
    const lines = FL_COMMAND_CLASSES.map((c) => c.sourceRef.slice(1, 6))
    expect(lines).toEqual(['39662', '39663', '39664', '39665', '39666'])
    for (const c of FL_COMMAND_CLASSES) {
      expect(c.origin.length, c.id).toBeGreaterThan(0)
      expect(c.authority.length, c.id).toBeGreaterThan(0)
      expect(c.effectOnDevice.length, c.id).toBeGreaterThan(20)
    }
  })

  // FAILS IF: an unrecognised class is silently ignored rather than refused
  // with a stated reason. AC-FL-007-1: "rejects any other class with a typed
  // reason."
  it('rejects an unrecognised class with a typed reason', () => {
    const ok = admitCommandClass('CMD-FL-SUSPEND')
    expect(ok.accepted).toBe(true)
    const bad = admitCommandClass('CMD-FL-WIPE')
    expect(bad.accepted).toBe(false)
    if (!bad.accepted) {
      expect(bad.reason).toContain('CMD-FL-WIPE')
      expect(bad.reason).toContain('closed at five')
    }
  })

  // FAILS IF: the device end and the origination end drift into one union.
  // `CC_RELEASE_LOT_HOLD` in `@/domain/commands` is what MAKES a lot release;
  // this file is what the device does with one. Neither list may contain the
  // other's members.
  it('is separate from the origination-side command union', () => {
    const deviceIds: readonly string[] = FL_COMMAND_CLASSES.map((c) => c.id)
    for (const t of HUB_COMMAND_TYPES) expect(deviceIds, t).not.toContain(t)
    for (const id of deviceIds) {
      expect([...HUB_COMMAND_TYPES] as string[], id).not.toContain(id)
    }
  })
})

describe('the command state vocabulary', () => {
  // FAILS IF: the ladder is shortened or an alternative is promoted onto it.
  // L39670 states nine on the applied ladder and six alternatives, in one
  // sentence, under the heading "Command states are distinct and must never
  // be collapsed."
  it('carries nine applied states and six alternatives, kept apart', () => {
    expect(COMMAND_APPLIED_LADDER).toHaveLength(9)
    expect(COMMAND_ALTERNATIVE_STATES).toHaveLength(6)
    const overlap = COMMAND_APPLIED_LADDER.filter((s) =>
      (COMMAND_ALTERNATIVE_STATES as readonly string[]).includes(s),
    )
    expect(overlap).toEqual([])
  })

  // FAILS IF: the boundary moves. Five of the nine happen on the server and
  // four on the device; a device that "delivered" its own command would be
  // claiming the server's act.
  it('puts five states on the server and four on the device', () => {
    const actors = COMMAND_APPLIED_LADDER.map((s) => COMMAND_STATE_ACTOR[s])
    expect(actors.filter((a) => a === 'server')).toHaveLength(5)
    expect(actors.filter((a) => a === 'device')).toHaveLength(4)
    expect(COMMAND_STATE_ACTOR.created).toBe('server')
    expect(COMMAND_STATE_ACTOR.downloaded).toBe('device')
  })

  // FAILS IF: a surface may call a command effective before the device
  // applied it. AC-FL-007-3 (L39721) and L39670's own example — a lot is not
  // released because a Quality Manager created the release command.
  it('calls a command effective only once the device has applied it', () => {
    const notYet: readonly CommandState[] = [
      'created',
      'authorized',
      'queued',
      'available-for-delivery',
      'delivered',
      'downloaded',
      'validated',
      'rejected',
      'failed',
      'expired',
      'cancelled',
      'superseded',
    ]
    for (const s of notYet) expect(effectiveOnThisDevice(s), s).toBe(false)
    expect(effectiveOnThisDevice('applied')).toBe(true)
    expect(effectiveOnThisDevice('acknowledged')).toBe(true)
  })
})

describe('DEC-SYNC-001 — the reconnection order', () => {
  // FAILS IF: the adopted order is re-ordered. L39672: stop class, then the
  // full capture upload, then the enabling classes. The array IS the order,
  // so a comparator cannot get it backwards.
  it('drains stop class, then every capture, then the enabling classes', () => {
    expect(DEC_SYNC_001_ORDER.map((p) => p.phase)).toEqual([
      'stop-class',
      'capture-upload',
      'enabling-class',
    ])
    expect(DEC_SYNC_001_ORDER[1]?.what).toMatch(/nothing discarded/i)
    for (const p of DEC_SYNC_001_ORDER) expect(p.why.length, p.phase).toBeGreaterThan(30)
  })

  // FAILS IF: an enabling class is promoted into the stop phase, or the
  // suspension is demoted out of it. Of the five, only the suspension is a
  // stop-class command; the other four enable work.
  it('puts exactly one of the five classes in the stop phase', () => {
    const phases = FL_COMMAND_CLASSES.map((c) => COMMAND_CLASS_PHASE[c.id])
    expect(phases.filter((p) => p === 'stop-class')).toHaveLength(1)
    expect(COMMAND_CLASS_PHASE['CMD-FL-SUSPEND']).toBe('stop-class')
    expect(COMMAND_CLASS_PHASE['CMD-FL-LOTREL']).toBe('enabling-class')
  })

  // FAILS IF: the drain re-orders commands within a phase. AC-FL-007-2
  // (L39720): "Commands are applied in the order the server assigned."
  it('preserves the server’s order inside each phase', () => {
    const queue: readonly { class: FrontlineCommandClass; seq: number }[] = [
      { class: 'CMD-FL-VERSION', seq: 1 },
      { class: 'CMD-FL-SUSPEND', seq: 2 },
      { class: 'CMD-FL-LOTREL', seq: 3 },
      { class: 'CMD-FL-CLEAR', seq: 4 },
    ]
    expect(commandsForPhase(queue, 'stop-class').map((c) => c.seq)).toEqual([2])
    expect(commandsForPhase(queue, 'enabling-class').map((c) => c.seq)).toEqual([1, 3, 4])
  })

  // FAILS IF: the gap is closed by minting a class the source forbids. The
  // stop class names four things and only two of them map onto a command
  // class; device de-authorisation and remote wipe have none, and
  // AC-FL-007-1 closes the device at five, so the mismatch is recorded
  // rather than resolved.
  it('records the two stop-class items that have no command class', () => {
    expect(STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS).toHaveLength(2)
    const ids: readonly string[] = FL_COMMAND_CLASSES.map((c) => c.id)
    expect(ids).not.toContain('CMD-FL-WIPE')
    expect(ids).not.toContain('CMD-FL-DEAUTH')
    for (const g of STOP_CLASS_ITEMS_WITHOUT_A_COMMAND_CLASS) {
      // `DEC-CMDCLASS-001`, not `DEC-WIPE-001`. The source raises this exact
      // gap at L51551 and holds the two apart in the same line: DEC-WIPE-001
      // "remains separate and unresolved: it concerns how long a wipe may
      // remain pending". This assertion read DEC-WIPE-001 until MOD-FL-A7
      // transcribed L41300, went looking for the decision behind it, and
      // found the channel question has its own.
      expect(g.openDecision, g.item).toBe('DEC-CMDCLASS-001')
      expect(g.whereTheActLives, g.item).toContain('L41300')
    }
  })
})

describe('the fifteen command states, bound to the platform console\u2019s spelling', () => {
  // FAILS IF: this file's fifteen states and `@/surfaces/sa/command-state`'s
  // fifteen stop being the same set.
  //
  // They differ in one member's spelling — `available-for-delivery` here,
  // `available for delivery` there — because these are object keys and those
  // are prose labels. Neither is wrong. What was wrong is that NOTHING SAID
  // THEY WERE THE SAME FIFTEEN, so a state added to one would never appear in
  // the other and a closed vocabulary would quietly stop being closed. Slice
  // 8's honesty-kernel task found it while consuming the console's union.
  //
  // Planted: `SA_SPELLING['acknowledged']` changed to `'acknowledged '` with a
  // trailing space. Went red on the set comparison. Restored.
  it('maps onto exactly the console\u2019s fifteen, in both directions', () => {
    const mine = [...COMMAND_APPLIED_LADDER, ...COMMAND_ALTERNATIVE_STATES]
    expect(mine).toHaveLength(15)
    expect(new Set(mine).size).toBe(15)
    expect(new Set(COMMAND_STATES).size).toBe(15)
    expect(new Set(mine.map((s) => SA_SPELLING[s]))).toEqual(new Set(COMMAND_STATES))
    // and the map is total over this file's union, so a member added here
    // without a console spelling does not compile rather than silently missing.
    expect(Object.keys(SA_SPELLING)).toHaveLength(15)
  })
})
