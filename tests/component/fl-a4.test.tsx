import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RunPlayerRoute } from '../../app/frontline/run-player/RunPlayerRoute'
import {
  DataCaptureAndEvidencePanel,
  FLA4_RUN_PLAYER_PANEL,
  fla4RunPlayerPanel,
} from '@/frontline/modules/fl-a4/DataCaptureAndEvidencePanel'
import { FLA4_CHARTER_STATEMENTS } from '@/frontline/modules/fl-a4/charter'
import { FLA4_COLUMNS, FLA4_MATRIX, fla4Affordance } from '@/frontline/modules/fl-a4/matrix'
import {
  FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON,
  FLA4_PATTERNS,
  FLA4_RENDERED_CAPTURE_TYPES,
} from '@/frontline/modules/fl-a4/service'

/**
 * `MOD-FL-A4` drawn.
 *
 * WHAT THIS FILE IS FOR, AND IT IS NOT WHAT THE UNIT SUITE IS FOR. The unit
 * suite proves `fla4Affordance` returns the right member; this one proves the
 * PANEL cannot draw a control the fold did not return. Those are different
 * failures — a correct fold and a view that ignores it is exactly how a
 * permissive token becomes a button — so the assertions below SWEEP the
 * rendered document for controls rather than checking the ones the panel
 * meant to draw.
 *
 * EVERY GATE HERE WAS SEEN RED. Each `it` names the defect planted into the
 * panel and then restored.
 */

/** Everything the panel puts on screen, as one string. */
function renderedText(): string {
  return document.body.textContent ?? ''
}

describe('the panel the controller mounts', () => {
  // PLANTED: `module` changed to 'MOD-FL-A3'. RED. RESTORED.
  //
  // FAILS IF: this module claims another's identity or another's §22.7 rows.
  // The Module column of §22.7 names `MOD-FL-A4` on exactly one row —
  // `SCR-FL-07` at L39869, shared with `MOD-FL-A3` — so this panel claims
  // that row's NAME and no other. `SCR-FL-08` and `SCR-FL-10` are acts of
  // this module and L39870 and L39872 give them to A3, so they are not
  // claimed here.
  it('is a RunPlayerPanel naming this module and the one §22.7 row it is the state of', () => {
    expect(FLA4_RUN_PLAYER_PANEL.module).toBe('MOD-FL-A4')
    expect(FLA4_RUN_PLAYER_PANEL.heading).toBe('Data capture and evidence')
    expect(FLA4_RUN_PLAYER_PANEL.rendersViews).toEqual([
      'Run Player step screen, all authored element types',
    ])
  })

  // PLANTED: the panel's body replaced with `null`. RED — the route rendered
  // the empty-slot notice instead. RESTORED.
  //
  // FAILS IF: the panel stops mounting into the shared route. The route is a
  // spine task's file and this module does not edit it; the only proof that
  // the contract holds is that the route renders this panel when handed it.
  it('mounts into the shared Run Player route without touching it', () => {
    render(<RunPlayerRoute panels={[FLA4_RUN_PLAYER_PANEL]} />)
    expect(screen.queryByTestId('fl-run-player-no-panels')).toBeNull()
    const section = screen.getByTestId('fl-panel-MOD-FL-A4')
    expect(
      screen.getByRole('heading', { name: 'Data capture and evidence', level: 3 }),
    ).toBeTruthy()
    // The BODY has to arrive, not only the shell. The first version of this
    // gate asserted the section and the heading, both of which the route
    // draws from `module` and `heading` alone — so a panel whose body was
    // `null` passed it. It now reads the panel's own content out of the
    // section the route rendered.
    expect(section.querySelectorAll('[data-testid="fla4-charter-statement"]').length).toBe(
      FLA4_CHARTER_STATEMENTS.length,
    )
    expect(section.querySelectorAll('[data-row-id]').length).toBe(FLA4_MATRIX.length)
  })
})

describe('what the panel draws, per persona', () => {
  // PLANTED: the `Affordance` switch's `cross-surface` case changed to fall
  // through to the `control` case. RED on all five personas at once, because
  // the sweep counts buttons rather than checking the three it expects.
  // RESTORED.
  //
  // FAILS IF: the panel draws a control the fold did not return. This is the
  // assertion the whole file exists for: it walks all five personas, sweeps
  // every button in the document, and compares that set to what
  // `fla4Affordance` says is a control. Nothing here lists the three by hand.
  it('draws a control exactly where the fold returns one, for every persona', () => {
    for (const persona of FLA4_COLUMNS) {
      const view = render(<DataCaptureAndEvidencePanel persona={persona} />)
      const expected = FLA4_MATRIX.filter(
        (row) => fla4Affordance(row, persona).kind === 'control',
      ).map((row) => row.control)

      const drawn = screen.queryAllByRole('button').map((b) => b.textContent ?? '')
      expect(drawn.sort(), persona).toEqual([...expected].sort())
      expect(screen.queryAllByTestId('fla4-control'), persona).toHaveLength(expected.length)
      view.unmount()
    }
  })

  // PLANTED: the Worker's three rows given `surface: 'chrome'`. RED — the
  // Worker drew nothing and the count went to zero. RESTORED.
  //
  // FAILS IF: the Worker loses the three on-device acts this module exists
  // for, or gains a fourth. Three of the four permissive cells in this matrix
  // are the Worker's own.
  it('gives the Worker three controls and every other persona none', () => {
    const view = render(<DataCaptureAndEvidencePanel persona="WORKER" />)
    expect(screen.queryAllByRole('button')).toHaveLength(3)
    view.unmount()

    for (const persona of ['SUPERVISOR', 'QUALITY_MANAGER', 'TENANT_ADMIN', 'READONLY_AUDITOR'] as const) {
      const other = render(<DataCaptureAndEvidencePanel persona={persona} />)
      expect(screen.queryAllByRole('button'), persona).toHaveLength(0)
      other.unmount()
    }
  })

  // PLANTED: the `cross-surface` case rewritten to render `NamedPlace`
  // instead. RED — the Client Command Center never appeared and the
  // cross-surface note count went to zero. RESTORED.
  //
  // FAILS IF: a reader is sent to the wrong place. L40727 sends a Supervisor
  // and a Quality Manager to the Client Command Center and a Tenant Admin and
  // a Read-only Auditor to the Delivery Operations Hub, in ONE row. Getting
  // this wrong tells four readers to look somewhere the evidence is not.
  it('sends each persona of row 6 to the surface its own cell names', () => {
    const expected = {
      SUPERVISOR: 'Client Command Center',
      QUALITY_MANAGER: 'Client Command Center',
      TENANT_ADMIN: 'Delivery Operations Hub',
      READONLY_AUDITOR: 'Delivery Operations Hub',
    } as const

    for (const [persona, surfaceName] of Object.entries(expected)) {
      const view = render(
        <DataCaptureAndEvidencePanel persona={persona as keyof typeof expected} />,
      )
      const statements = screen.queryAllByTestId('fl-cross-surface')
      expect(statements.length, persona).toBeGreaterThan(0)
      const text = statements.map((s) => s.textContent ?? '').join(' ')
      expect(text, persona).toContain(surfaceName)
      expect(text, persona).toContain('View evidence on an oversight surface')
      view.unmount()
    }
  })

  // PLANTED: row 7's Quality Manager cell rendered through the `control` arm.
  // RED — a fourth button appeared for that persona. RESTORED.
  //
  // FAILS IF: `Allowed — Client Command Center action 7` becomes a button.
  // The token is permissive and the act belongs to a surface slice 9 builds.
  it('states row 7 for the Quality Manager and never draws it', () => {
    render(<DataCaptureAndEvidencePanel persona="QUALITY_MANAGER" />)
    const row = screen.getByTestId('fla4-matrix-row-mark-evidence-reviewed')
    expect(row.querySelectorAll('button')).toHaveLength(0)
    expect(row.querySelector('[data-testid="fla4-control"]')).toBeNull()
    const statement = row.querySelector('[data-testid="fl-cross-surface"]')
    expect(statement).not.toBeNull()
    const text = statement?.textContent ?? ''
    expect(text).toContain('Client Command Center')
    expect(text).toContain('action 7')
    expect(text).toContain('Mark evidence reviewed')
  })

  // PLANTED: the refusal arm stopped rendering `openDecision`. RED.
  // RESTORED.
  //
  // FAILS IF: the one open cell of this matrix renders as a plain refusal.
  // `AC-FL-009-5` (L39948) forbids resolving the Tenant Admin device-session
  // question in either direction, and a refusal with no marker asserts the
  // "no" the criterion withholds.
  it('marks the Tenant Admin’s open cell as open rather than refused', () => {
    render(<DataCaptureAndEvidencePanel persona="TENANT_ADMIN" />)
    const markers = screen.queryAllByTestId('fla4-open-decision-marker')
    expect(markers.length).toBeGreaterThan(0)
    expect(markers.map((m) => m.textContent ?? '').join(' ')).toContain('AC-FL-009-5')
  })
})

describe('what the panel says, and what it never says', () => {
  // PLANTED: `fla4CaptureLine` replaced in the panel with the bare label.
  // RED — the "does not hold this record yet" sentence disappeared.
  // RESTORED.
  //
  // FAILS IF: the panel shows a capture as recorded while it sits on the
  // device, or invents a state. `AC-FL-006-3` (L39636) and
  // `TEST-SCR-FL-003` (L48700) are what this holds.
  it('names the capture’s real state and never a bare success', () => {
    render(<DataCaptureAndEvidencePanel />)
    const states = screen.queryAllByTestId('fla4-capture-state')
    expect(states.length).toBeGreaterThan(0)
    for (const s of states) {
      expect(s.textContent ?? '').toContain('The platform does not hold this record yet.')
    }
    expect(renderedText().toLowerCase()).not.toContain('synced')
  })

  // PLANTED: 'a countdown against expectation' added to the panel prose. RED.
  // RESTORED.
  //
  // FAILS IF: a pace figure, a countdown, a ranking or a productivity
  // comparison reaches the rendered document in any state. `AC-FL-000-5`
  // (L39100) is categorical, and a wave-3 task sweeps the built tree for
  // exactly these words. This sweeps the RENDERED text, which is a different
  // claim from the unit suite's sweep of the source files.
  it('renders no pace, timer, countdown, ranking or productivity comparison, for any persona', () => {
    for (const persona of FLA4_COLUMNS) {
      for (const online of [true, false]) {
        const view = render(<DataCaptureAndEvidencePanel persona={persona} online={online} />)
        expect(
          /\b(pace|timer|countdown|ranking|rankings|productivity)\b/i.test(renderedText()),
          `${persona} online=${online}`,
        ).toBe(false)
        view.unmount()
      }
    }
  })

  // PLANTED: the offline treatment paragraph removed. RED. RESTORED.
  //
  // FAILS IF: the panel renders only the connected path. L40757: "Nothing
  // about capture depends on connectivity", and L40948 places the safety
  // layer beyond the connection entirely. A screen that states neither
  // implies the capture layer needs a network, which is the one claim
  // chapter 22 exists to deny — so it is stated in the connected render too.
  it('states the offline account even when the device is connected', () => {
    render(<DataCaptureAndEvidencePanel online={true} />)
    const text = renderedText()
    expect(text).toContain('Nothing about capture depends on connectivity.')
    // The queue clause, in words only `FL_CONNECTIVITY_TREATMENTS`' write
    // treatment carries. The first version of this gate looked for "durable
    // upload queue", which is ALSO the ladder's own label for `queued` — so
    // deleting the whole offline paragraph left it green. A gate satisfied by
    // a string something else already renders is testing nothing.
    expect(text).toContain('survive application restart, device restart, and power loss')
    expect(text).toContain(
      'The lot is protected from the moment of the breach, not from the moment of synchronisation',
    )
  })

  // PLANTED: `FLA4_RENDERED_CAPTURE_TYPES` sliced to six in the panel. RED on
  // the count. RESTORED.
  //
  // FAILS IF: the panel renders a type the contract does not name, or drops
  // one it does. `AC-A4-3` (L40867) is the criterion.
  it('renders the adopted contract in full and neither of the two names it replaced', () => {
    render(<DataCaptureAndEvidencePanel />)
    expect(screen.queryAllByTestId('fla4-capture-type')).toHaveLength(
      FLA4_RENDERED_CAPTURE_TYPES.length,
    )
    const types = screen
      .queryAllByTestId('fla4-capture-type')
      .map((li) => li.textContent ?? '')
      .join(' ')
    for (const type of FLA4_RENDERED_CAPTURE_TYPES) expect(types, type).toContain(type)
    // The two §1.7 and §7.8.3 names appear only in the sentence that says
    // what they render AS — never as an entry of the list.
    expect(types.toLowerCase()).not.toContain('checklist')
    expect(types.toLowerCase()).not.toContain('boolean')
    expect(renderedText()).toContain('checklist renders as checkbox confirmation')
  })

  // PLANTED: the `DecisionDisclosure` block removed from the panel. RED.
  // RESTORED.
  //
  // FAILS IF: `DEC-CAP-001` stops rendering through the ONE shared renderer,
  // or one of its two readings goes missing. Both readings must stand; the
  // adopted position is a client-delegated choice, not the source's ruling.
  it('discloses DEC-CAP-001 through the shared renderer, with both readings', () => {
    render(<DataCaptureAndEvidencePanel />)
    const card = screen.getByRole('note', { name: 'Open decision DEC-CAP-001' })
    const text = card.textContent ?? ''
    expect(text).toContain('Sections 1.7 and 7.8.3 list seven')
    expect(text).toContain('Section 5.5.3 lists a different seven')
    expect(text).toContain('A client-delegated choice under APP-012')
  })

  // PLANTED: `DEC-STORE-001` removed from the local list. RED — four cards
  // rendered instead of five and the identifier vanished from the document.
  // RESTORED.
  //
  // FAILS IF: an open decision the shared canon has no record for stops being
  // disclosed. `AC-FL-011-5` (L40155) requires `DEC-STORE-001` to remain
  // visibly open and `TEST-FL-011-5` (L40165) tests for the marker. Every
  // card must show its readings, its locators, and the delegation line.
  it('discloses the five decisions the shared canon does not hold', () => {
    render(<DataCaptureAndEvidencePanel />)
    const cards = screen.queryAllByTestId('fla4-open-decision')
    expect(cards).toHaveLength(FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON.length)
    const text = cards.map((c) => c.textContent ?? '').join(' ')
    for (const d of FLA4_DECISIONS_NOT_IN_THE_SHARED_CANON) {
      expect(text, d.id).toContain(d.id)
      for (const r of d.readings) expect(text, r.locator).toContain(r.locator)
      expect(text, `${d.id} delegation`).toContain(
        'A client-delegated choice under APP-012, not a position the source settled.',
      )
    }
    expect(text).toContain('None.')
  })

  // PLANTED: the unresolved-provenance paragraph removed. RED. RESTORED.
  //
  // FAILS IF: unresolved provenance renders as a blank. `AC-FL-006-1`
  // (L39634) requires an explicit unresolved marker rather than an empty
  // value, and L40825 requires that provenance never gate a capture — the
  // sentence has to say both.
  it('renders unresolved provenance as a stated marker that does not block the capture', () => {
    render(<DataCaptureAndEvidencePanel />)
    const line = screen.getByTestId('fla4-unresolved-provenance').textContent ?? ''
    expect(line).toContain('Where this happened was not resolved')
    expect(line).toContain('provenance never blocks a capture')
  })

  // PLANTED: the fallback section's terminal-safe-state clause dropped. RED.
  // RESTORED.
  //
  // FAILS IF: a pattern renders with no terminal safe state, or the eight
  // functionalities naming no pattern stop being disclosed. Reporting the
  // eight is the honest reading of `AC-FL-011-1` (L40151) for this module;
  // hiding them would be the count coming out clean because nobody looked.
  it('renders five patterns with their terminal safe states, and names the eight gaps', () => {
    render(<DataCaptureAndEvidencePanel />)
    const patterns = screen.queryAllByTestId('fla4-fallback-pattern')
    expect(patterns).toHaveLength(FLA4_PATTERNS.length)
    expect(patterns).toHaveLength(5)
    // The STATE, not the label. The first version of this gate looked for the
    // words "Terminal safe state:", which the panel prints whether or not the
    // state follows them — so deleting the state itself left it green.
    for (const p of FLA4_PATTERNS) {
      const rendered = patterns.find((li) => (li.textContent ?? '').includes(p.id))
      expect(rendered, p.id).toBeDefined()
      expect(rendered?.textContent ?? '', p.id).toContain(p.terminalSafeState)
    }
    const text = renderedText()
    expect(text).toContain('24 functionalities are recorded for this module and 8 of them name no')
    expect(text).toContain('FUNC-A4-05-1-3')
  })

  // FAILS IF: a factory built for another persona renders the Worker's
  // column. The panel value is what the controller wires in, so the persona
  // has to travel with it rather than being a default nobody can change.
  it('carries the persona into the value the controller mounts', () => {
    render(<RunPlayerRoute panels={[fla4RunPlayerPanel('READONLY_AUDITOR')]} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(renderedText()).toContain('What this screen draws for the Read-only Auditor')
  })
})
