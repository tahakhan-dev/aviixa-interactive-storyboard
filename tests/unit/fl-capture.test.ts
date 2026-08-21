import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  CAPTURE_LADDER,
  CAPTURE_STATES,
  CAPTURE_STATE_LABEL,
  CAPTURE_TRANSITIONS,
  ENVELOPE_FIELDS,
  HELD_ON_DEVICE_STATES,
  captureStateLine,
  captureTransition,
  platformHoldsTheRecord,
  unresolvedProvenanceLine,
  type CaptureState,
  type NamedLocationProvenance,
} from '@/frontline/capture'

/* ==================================================================== *
 * THE LADDER, READ TWICE.
 * ==================================================================== */

describe('the capture state ladder', () => {
  // FAILS IF: a state is dropped from either transcription. The state
  // diagram (L39598-L39619) and the numbered workflow (L39584-L39592) are
  // two independent statements of the same thirteen; each is transcribed
  // separately and this is where they have to agree. A state dropped from
  // one and not the other fails here, which a count of either alone cannot.
  it('reads the same thirteen states from the diagram and from the prose', () => {
    expect(CAPTURE_STATES).toHaveLength(13)
    expect([...CAPTURE_LADDER].map((s) => s.state)).toEqual([...CAPTURE_STATES])
  })

  // FAILS IF: the prose transcription's step numbers stop matching the
  // source's numbered workflow, which is what makes the citation checkable.
  // Steps 4 to 12, with step 8 carrying two states and step 9 carrying four.
  it('maps every state onto the workflow step that states it', () => {
    const steps = CAPTURE_LADDER.map((s) => s.step)
    expect(Math.min(...steps)).toBe(4)
    expect(Math.max(...steps)).toBe(12)
    expect(steps.filter((s) => s === 8)).toHaveLength(2)
    expect(steps.filter((s) => s === 9)).toHaveLength(4)
    for (const row of CAPTURE_LADDER) {
      expect(row.sourceRef, row.state).toMatch(/^L395(8[4-9]|9[0-2])$/)
    }
  })

  // FAILS IF: any state loses its label, or a label is invented for a state
  // the union does not carry. The record is total, so this is the runtime
  // half of a compile-time guarantee — it catches a label emptied rather
  // than removed.
  it('labels every state and only the states', () => {
    expect(Object.keys(CAPTURE_STATE_LABEL).sort()).toEqual([...CAPTURE_STATES].sort())
    for (const s of CAPTURE_STATES) expect(CAPTURE_STATE_LABEL[s].length, s).toBeGreaterThan(6)
  })

  // FAILS IF: an edge the diagram does not draw becomes reachable. Fifteen
  // edges are drawn; 13 × 13 = 169 ordered pairs exist. The other 154,
  // including every self-transition, are refused.
  it('refuses every transition the diagram does not draw', () => {
    expect(CAPTURE_TRANSITIONS).toHaveLength(15)
    let allowed = 0
    for (const from of CAPTURE_STATES) {
      for (const to of CAPTURE_STATES) {
        if (captureTransition(from, to).allowed) allowed += 1
      }
    }
    expect(allowed).toBe(15)
    for (const s of CAPTURE_STATES) {
      expect(captureTransition(s, s).allowed, `self-transition on ${s}`).toBe(false)
    }
  })

  // FAILS IF: the resumable edge is lost. L39622 says what it is for — it
  // "is what makes a mid-sync connection drop a delay rather than a loss" —
  // and without it an interrupted upload is a dead end.
  it('keeps the resumable edge back from an interrupted upload', () => {
    expect(captureTransition('uploading', 'upload-interrupted').allowed).toBe(true)
    expect(captureTransition('upload-interrupted', 'uploading').allowed).toBe(true)
    const ruling = captureTransition('upload-interrupted', 'accepted')
    expect(ruling.allowed).toBe(false)
    if (!ruling.allowed) expect(ruling.reason).toContain('L39598-L39619')
  })

  // FAILS IF: the ladder is collapsed. Uploaded is not accepted; accepted is
  // not reflected in summaries. These are the source's own two examples of
  // what "synced" would hide.
  it('keeps uploaded, accepted and reflected apart', () => {
    expect(captureTransition('uploaded', 'accepted').allowed).toBe(false)
    expect(captureTransition('accepted', 'reflected-in-summaries').allowed).toBe(false)
    expect(captureTransition('accepted', 'officially-recorded').allowed).toBe(true)
  })
})

/* ==================================================================== *
 * NO "SYNCED", AND NO BARE SUCCESS.
 * ==================================================================== */

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (isForeignProbe(e)) continue
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.tsx?$/.test(full)) acc.push(full)
  }
  return acc
}

describe('AC-FL-006-3 and TEST-SCR-FL-003 — the state is always named', () => {
  // FAILS IF: a state named synced, sent, done or complete is added to the
  // vocabulary. The union has no such member, so this catches one added as a
  // label rather than as a state.
  it('carries no synced, sent, done or complete state anywhere in the vocabulary', () => {
    const forbidden = /\b(synced|sent|done|complete)\b/i
    for (const s of CAPTURE_STATES) expect(s, s).not.toMatch(forbidden)
    for (const s of CAPTURE_STATES) {
      expect(CAPTURE_STATE_LABEL[s], s).not.toMatch(/\bsynced\b/i)
    }
  })

  // FAILS IF: a Frontline screen prints a bare success for a queued capture.
  // TEST-SCR-FL-003 (L48700): "assert the label is one of committed locally,
  // queued, uploading, uploaded, or server received, and never a bare
  // success."
  it('never renders a capture held on the device as recorded by the platform', () => {
    for (const s of HELD_ON_DEVICE_STATES) {
      expect(platformHoldsTheRecord(s), s).toBe(false)
      expect(captureStateLine(s), s).toContain('The platform does not hold this record yet')
    }
    expect(platformHoldsTheRecord('officially-recorded')).toBe(true)
    expect(captureStateLine('officially-recorded')).not.toContain('does not hold')
  })

  // FAILS IF: `frontline` source starts spelling a success word as a state
  // name. `tests/coverage/contract-gates.test.ts` runs the same shape over
  // the whole of `src/`; this is the surface-local half, run in the unit
  // project where the state vocabulary lives.
  it('declares no forbidden state name in any Frontline source file', () => {
    const files = [...walk(join('src', 'frontline')), ...walk(join('app', 'frontline'))]
    expect(files.length).toBeGreaterThan(8)
    const offenders = files.filter((f) =>
      /(state|status)\s*[:=]\s*['"](synced|sent|done)['"]/i.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})

/* ==================================================================== *
 * THE NINE-FIELD ENVELOPE AND THE UNRESOLVED MARKER.
 * ==================================================================== */

describe('the complete runtime envelope', () => {
  // FAILS IF: a field is dropped. AC-FL-006-1 (L39634) requires "all nine
  // envelope elements"; the table at L39565-L39573 is nine data lines.
  it('carries all nine fields, each with its own line', () => {
    expect(ENVELOPE_FIELDS).toHaveLength(9)
    const lines = ENVELOPE_FIELDS.map((f) => Number(f.sourceRef.slice(1)))
    expect(lines).toEqual([39565, 39566, 39567, 39568, 39569, 39570, 39571, 39572, 39573])
  })

  // FAILS IF: a field's unresolvable behaviour is emptied or paraphrased
  // away, or the split between the fields that CAN be absent and the fields
  // that cannot moves. Five of the nine read "Cannot occur" and the other
  // four are the four the source says can be absent — the unit or lot
  // binding, provenance, the server-receipt time, and evidence. A field
  // moving across that line would either invite a nullable type for a case
  // that does not exist, or lose the marker for one that does.
  it('keeps every field’s unresolvable behaviour, and the five that cannot occur', () => {
    for (const f of ENVELOPE_FIELDS) {
      expect(f.whenUnresolved.length, f.field).toBeGreaterThan(30)
      expect(f.whyPresent.length, f.field).toBeGreaterThan(20)
    }
    const cannotOccur = ENVELOPE_FIELDS.filter((f) => f.whenUnresolved.startsWith('Cannot occur'))
    expect(cannotOccur).toHaveLength(5)
    expect(cannotOccur.map((f) => f.sourceRef)).toEqual([
      'L39565',
      'L39566',
      'L39568',
      'L39569',
      'L39572',
    ])
    // The other four are the four the type gives a marker to.
    expect(ENVELOPE_FIELDS.length - cannotOccur.length).toBe(4)
  })

  // FAILS IF: unresolved provenance renders as an empty value. AC-FL-006-1
  // requires "an explicit unresolved marker rather than an empty value", and
  // L39570 requires the note and requires the capture to proceed.
  it('renders unresolved provenance as a marker with a note, never as a blank', () => {
    const unresolved: NamedLocationProvenance = {
      resolved: false,
      note: 'The station could not be matched to a cell in the assignment context.',
    }
    const line = unresolvedProvenanceLine(unresolved)
    expect(line).not.toBeNull()
    expect(line).toContain(unresolved.resolved ? '' : 'could not be matched')
    expect(line).toContain('provenance never blocks a capture')

    const resolved: NamedLocationProvenance = {
      resolved: true,
      site: 'SITE-RIVERSIDE',
      area: 'AREA-ASSY-A',
      cell: 'CELL-WHEEL-2',
    }
    expect(unresolvedProvenanceLine(resolved)).toBeNull()
  })

  // FAILS IF: an unknown state reaches the line builder and gets a plausible
  // default. There is no default; the record is total. Cast through
  // `unknown` because the type system already refuses this — the point is
  // that a value arriving through an untyped boundary produces `undefined`
  // rather than a comforting sentence.
  it('produces no sentence at all for a state the vocabulary does not carry', () => {
    const rogue = 'synced' as unknown as CaptureState
    expect(CAPTURE_STATE_LABEL[rogue]).toBeUndefined()
  })
})
