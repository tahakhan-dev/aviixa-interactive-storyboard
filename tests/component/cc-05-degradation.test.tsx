import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { abilityAttribute } from '@/ai/abilities/register'
import { provenanceViolations } from '@/ai/provenance/contract'
import { GovernanceGateQueue } from '@/surfaces/cc/modules/cc-05/GovernanceGateQueue'
import {
  CC05_AI07,
  CC05_AI07_ATTRIBUTES,
  CC05_GATE_DECISION_ROW,
  cc05EmptyQueueReading,
  cc05NewItemsArise,
} from '@/surfaces/cc/modules/cc-05/degradation'

/**
 * `MOD-CC-05`'S DEGRADATION OVERLAY AS A RENDERING.
 *
 * The unit suite next door asks whether the overlay's answers are the frozen
 * source's. This one asks whether they REACH A QUALITY MANAGER'S SCREEN — the
 * distinction that matters on this module, because a guarantee held in a type
 * and never drawn is a guarantee nobody can act on, and this build has shipped
 * that shape before.
 *
 * THE SIXTEEN MODE IDENTIFIERS ARE READ OFF THE FROZEN MATRIX, not off the
 * vocabulary the screen renders from. A screen that lost a mode and a
 * vocabulary that lost the same mode would agree with each other; neither can
 * agree with the document.
 */

const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

/** Section 42.3's operating-mode contract matrix: header, separator, then rows. */
const MODE_SEPARATOR = 89355

const MODE_IDS_FROM_SOURCE: string[] = (() => {
  const out: string[] = []
  for (let n = MODE_SEPARATOR + 1; (SOURCE[n - 1] ?? '').trimStart().startsWith('|'); n += 1) {
    const first = (SOURCE[n - 1] ?? '').trim().split('|')[1] ?? ''
    out.push(first.replaceAll('`', '').trim().split(' ')[0] ?? '')
  }
  return out
})()

const RENDER = () => render(<GovernanceGateQueue />)

afterEach(cleanup)

describe('the degradation overlay is on the screen at all', () => {
  // FAILS IF: the overlay is built and never mounted. A component reachable
  // from nothing is not shipped, and from outside that is indistinguishable
  // from a deliberate abstention.
  it('renders inside the governance gate queue panel', () => {
    RENDER()
    const queue = screen.getByTestId('cc-05-queue')
    expect(within(queue).getByTestId('cc-05-degradation')).toBeTruthy()
  })
})

describe('AI-07’s own attribute row reaches the screen', () => {
  // FAILS IF: an attribute is summarised, clipped or dropped on the way to the
  // screen. The expected strings are the register's, which the unit suite pins
  // to AI-07's frozen paragraph, so a clipped value cannot satisfy both.
  it('renders every consumed attribute whole, with the register’s own label', () => {
    RENDER()
    const block = screen.getByTestId('cc-05-ai07')
    for (const attribute of CC05_AI07_ATTRIBUTES) {
      const row = within(block).getByTestId(`cc-05-ai07-${attribute.attribute}`)
      expect(row.textContent).toContain(attribute.label)
      expect(row.textContent).toContain(attribute.value)
    }
  })

  // FAILS IF: the never-expires rule is softened on screen while the data
  // still carries it — the exact shape a type-level guarantee cannot catch.
  it('states that the item never expires, in AI-07’s own words', () => {
    RENDER()
    const expiry = abilityAttribute(CC05_AI07, 'expiry').value
    expect(screen.getByTestId('cc-05-ai07-expiry').textContent).toContain(expiry)
  })
})

describe('the pending item is drawn under every one of the sixteen modes', () => {
  // FAILS IF: the table loses a mode the SOURCE carries. Read off the frozen
  // matrix, never off `AI_MODE_IDS`, which the screen renders from.
  it('draws one row per mode of the frozen contract matrix', () => {
    RENDER()
    const table = screen.getByTestId('cc-05-degradation-table')
    for (const id of MODE_IDS_FROM_SOURCE) {
      expect(within(table).getByTestId(`cc-05-persistence-row-${id}`)).toBeTruthy()
    }
    expect(within(table).getAllByTestId(/^cc-05-persistence-row-/)).toHaveLength(
      MODE_IDS_FROM_SOURCE.length,
    )
  })

  // FAILS IF: any mode's row stops saying the item stays and stays human. Read
  // per row and per word, never as a count of rows that behave — three columns
  // of this build's matrices have shipped a count true of the defect too.
  it('every row states the item stays, is not self-decided and does not expire', () => {
    RENDER()
    for (const id of MODE_IDS_FROM_SOURCE) {
      const cell = screen.getByTestId(`cc-05-standing-${id}`).textContent ?? ''
      expect(cell).toContain('Stays in the queue')
      expect(cell).toContain('never self-approved')
      expect(cell).toContain('never self-declined')
      expect(cell).toContain('never expired')
    }
  })

  // FAILS IF: a row's agent-invocation cell drifts from the mode's own. This
  // is the only column that varies, so a screen that drew one value on all
  // sixteen would look finished and be a single claim repeated.
  it('draws the mode’s own agent-invocation cell, and they are not all the same', () => {
    RENDER()
    const drawn = MODE_IDS_FROM_SOURCE.map(
      (id) => screen.getByTestId(`cc-05-invocation-${id}`).textContent ?? '',
    )
    expect(new Set(drawn).size).toBeGreaterThan(1)
    // Each drawn cell is the matrix row's own third column, re-read here.
    for (const [i, id] of MODE_IDS_FROM_SOURCE.entries()) {
      const line = SOURCE[MODE_SEPARATOR + i] ?? ''
      const invocation = (line.trim().split('|')[3] ?? '').replaceAll('`', '').trim()
      expect(screen.getByTestId(`cc-05-invocation-${id}`).textContent).toContain(invocation)
    }
  })
})

describe('an empty queue is explained, and the explanation depends on the mode', () => {
  // FAILS IF: one statement is drawn for all sixteen modes, which would tell a
  // Quality Manager the floor is quiet while the agents are down.
  it('draws both arms across the sixteen, each matching the mode’s own arm', () => {
    RENDER()
    const kinds = new Set<string>()
    for (const id of MODE_IDS_FROM_SOURCE) {
      const reading = cc05EmptyQueueReading(id as never)
      kinds.add(reading.kind)
      expect(screen.getByTestId(`cc-05-empty-${id}`).textContent).toContain(reading.statement)
    }
    expect(kinds).toStrictEqual(new Set(['agents-unavailable', 'agents-active']))
  })

  // FAILS IF: an unavailable-agent mode stops saying so on screen. The phrase
  // the source asks for is the one a reader needs and it is asserted by name.
  it('says a quiet queue is not a quiet floor wherever no new items arise', () => {
    RENDER()
    for (const id of MODE_IDS_FROM_SOURCE) {
      if (cc05NewItemsArise(id as never)) continue
      expect(screen.getByTestId(`cc-05-empty-${id}`).textContent).toContain('not a quiet floor')
    }
  })
})

describe('DEC-GATE-001 is disclosed through the surface register, not re-read', () => {
  // FAILS IF: the module writes its own reading onto the screen. The status
  // drawn must be the register row's own, which is the row the unit suite
  // pins by identity.
  it('draws the register row’s own status and owner', () => {
    RENDER()
    const block = screen.getByTestId('cc-05-gate-decision')
    expect(block.textContent).toContain(CC05_GATE_DECISION_ROW.status)
    expect(block.textContent).toContain(CC05_GATE_DECISION_ROW.owner)
    expect(block.textContent).toContain('DEC-GATE-001')
  })
})

describe('the overlay emits exactly one provenance class', () => {
  // FAILS IF: a rendering path emits two classes, nests one inside another, or
  // declares itself a guidance element and carries none. Checked with the
  // shared lint over the real rendered tree rather than by reading the source.
  it('passes the shared provenance lint over the whole panel', () => {
    const { container } = RENDER()
    expect(provenanceViolations(container)).toStrictEqual([])
  })

  // FAILS IF: the overlay stops declaring itself a guidance element, which
  // would take it out of the lint's population and make the check above
  // vacuous for this module.
  it('declares itself a guidance element carrying exactly one class', () => {
    RENDER()
    const overlay = screen.getByTestId('cc-05-degradation')
    expect(overlay.getAttribute('data-guidance-element')).toBeTruthy()
    expect(overlay.querySelectorAll('[data-provenance-class]')).toHaveLength(1)
  })
})

describe('the live-mode seam is declared with its owner', () => {
  // FAILS IF: the screen renders a degraded state it has no mode to justify,
  // or leaves the absence undeclared. A stated abstention and an oversight are
  // indistinguishable from outside, so the seam names what is missing and who
  // must supply it.
  it('names what a live mode would supply and who must supply it', () => {
    RENDER()
    const seam = screen.getByTestId('cc-05-live-mode-seam').textContent ?? ''
    expect(seam).toContain('PROV-6')
    expect(seam.length).toBeGreaterThan(80)
  })
})
