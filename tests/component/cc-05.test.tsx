import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A GATE WHOSE EXPECTED VALUE IS PRODUCED BY THE CODE UNDER TEST IS A
 * TAUTOLOGY. The three control labels are therefore read off the storyboard's
 * own decision row in the frozen source at test time, not off the constant
 * that renders them — a plant that moved the constant would move both sides.
 */
const SOURCE = readFileSync(
  join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')
const DECISION_ROW = SOURCE[37153 - 1] ?? ''
const LABELS_FROM_SOURCE = [...DECISION_ROW.matchAll(/"([^"]+)"/g)].map((m) => m[1])
import { GovernanceGateQueue } from '@/surfaces/cc/modules/cc-05/GovernanceGateQueue'
import { CC05_COLUMNS, CC05_MATRIX } from '@/surfaces/cc/modules/cc-05/matrix'
import {
  CC05_DECISION_CONTROLS,
  CC05_NOT_DECIDABLE_ITEM,
  CC05_STORYBOARD_ITEM,
  cc05WaitingText,
} from '@/surfaces/cc/modules/cc-05/queue'

/**
 * `MOD-CC-05` AS A RENDERING.
 *
 * The unit suite next door asks whether the transcription matches the frozen
 * source. This one asks what a Quality Manager actually SEES on the screen
 * they land on, because on this module the two answers come apart in one place
 * that matters more than the rest: an item that cannot be decided must still
 * be shown ageing.
 *
 * ── THE ONE OBLIGATION MOST LIKELY TO BE LOST ────────────────────────────
 *
 * `FB-CC-QUEUE` is threefold — controls disabled, missing element named,
 * waiting clock still running — and a screen that gets the first two right
 * looks finished. A stopped clock is a silent expiry with the record still on
 * screen, which `AC-CC-247` forbids. The two cards below are the same item,
 * one with its scope of impact removed, so the gate can assert their clocks
 * read IDENTICALLY rather than assert that a clock is merely present. "A clock
 * is present" passes on a clock frozen at zero.
 *
 * ── THREE BEATEN-GATE SHAPES ARE ACTIVE HERE ─────────────────────────────
 *
 *  - `textContent` WELDS ADJACENT ELEMENTS, so a check that a disabled control
 *    carries its reason passes when the item note beside it carries the same
 *    words — and on this screen the note DOES carry them, deliberately, which
 *    makes the trap live rather than theoretical. Every disabled reason below
 *    is resolved through `aria-describedby` off the control itself, and
 *    `reason.hidden === false` is asserted too, because a `hidden` attribute
 *    defeats the same read.
 *  - REDUNDANT PROTECTIONS CANNOT BE VERIFIED ONE AT A TIME. The missing
 *    element is named in two independent places — the item's own not-decidable
 *    paragraph and each control's `aria-describedby` reason. The removal of
 *    EACH and of BOTH was planted; with only a `textContent` check, removing
 *    either left the other satisfying it.
 *  - A NAME-KEYED CELL LOOKUP IS BLIND TO COLUMN ORDER. Reversing the body's
 *    columns leaves every `data-testid` on its own value and a name-keyed gate
 *    green with every cell under the wrong heading. The order is therefore
 *    asserted positionally alongside the name-keyed check.
 */

afterEach(cleanup)

const RENDER = () => render(<GovernanceGateQueue />)

const DECIDABLE = CC05_STORYBOARD_ITEM.id
const NOT_DECIDABLE = CC05_NOT_DECIDABLE_ITEM.id

/** A disabled control's reason, resolved off the control rather than welded. */
function reasonOf(control: HTMLElement): HTMLElement {
  const id = control.getAttribute('aria-describedby')
  expect(id, 'a disabled control with no aria-describedby states no reason').toBeTruthy()
  const reason = document.getElementById(id as string)
  expect(reason).not.toBeNull()
  expect((reason as HTMLElement).hidden).toBe(false)
  return reason as HTMLElement
}

const controlsOf = (itemId: string): HTMLElement[] =>
  within(screen.getByTestId(`cc-05-controls-${itemId}`)).getAllByRole('button')

describe('the eight rows render, header-keyed and whole', () => {
  // FAILS IF: a row or a cell stops rendering. Forty cells asserted by row
  // ordinal and column NAME, so a value drifting from the model cannot pass.
  // PLANTED: changed `CC05_COLUMNS.map` in `GovernanceGateQueue.tsx` to
  // `[...CC05_COLUMNS].reverse().map` for the body cells only.
  // STAYED GREEN — which is why the positional gate below exists. Name-keying
  // is right for the value and blind to the layout.
  it('renders every cell of every row under its own column', () => {
    RENDER()
    expect(within(screen.getByTestId('cc-05-matrix')).getAllByRole('row')).toHaveLength(
      CC05_MATRIX.length + 1,
    )
    for (const row of CC05_MATRIX) {
      for (const column of CC05_COLUMNS) {
        expect(
          screen.getByTestId(`cc-05-cell-${row.ordinal}-${column}`).textContent,
          `row ${row.ordinal} · ${column}`,
        ).toBe(row.cells[column].text)
      }
    }
  })

  // FAILS IF: the body cells are drawn in an order the header row does not
  // carry. This is the check the name-keyed one CANNOT make, and on this
  // matrix the inversion is nearly silent: seven of the eight rows carry an
  // identical bare `Explicitly prohibited` in the Tenant Admin and Worker
  // columns, so a reader would see nothing wrong on seven rows out of eight.
  // PLANTED: `[...CC05_COLUMNS].reverse().map` for the body cells only.
  // RED: expected [ 'Worker', 'Read-only Auditor', …(3) ] to deeply equal
  //      [ 'Tenant Admin', 'Supervisor', …(3) ]
  it('draws the body cells in the header’s own order, not only under its own names', () => {
    RENDER()
    const header = within(screen.getByTestId('cc-05-matrix'))
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(header).toEqual(['Capability on this module', ...CC05_COLUMNS, 'Source'])
    for (const row of CC05_MATRIX) {
      const drawn = [...screen.getByTestId(`cc-05-row-${row.ordinal}`).querySelectorAll('td')]
        .map((td) => td.getAttribute('data-testid'))
        .filter((id): id is string => id !== null)
        .map((id) => id.replace(`cc-05-cell-${row.ordinal}-`, ''))
      expect(drawn, `row ${row.ordinal}`).toEqual([...CC05_COLUMNS])
    }
  })
})

describe('AC-CC-240 — the scope of impact leads, on both cards', () => {
  // FAILS IF: the scope stops being the card's first element, on either card.
  // Asserted POSITIONALLY as the first child rather than by presence, because
  // "the scope is somewhere on the card" is true of a card that buries it.
  // PLANTED: moved the waiting-time paragraph above the scope paragraph in
  // `GovernanceGateQueue.tsx`.
  // RED: expected 'cc-05-waiting-GATE-BB-0001' to be 'cc-05-scope-GATE-BB-0001'
  it('the scope block is the first child of each card', () => {
    RENDER()
    for (const id of [DECIDABLE, NOT_DECIDABLE]) {
      const card = screen.getByTestId(`cc-05-card-${id}`)
      expect(card.firstElementChild?.getAttribute('data-testid'), id).toBe(`cc-05-scope-${id}`)
    }
  })

  // FAILS IF: an uncomputable scope is rendered as a decidable card with the
  // scope omitted, which L37056 forbids by name. The slot stays first and is
  // filled with the absence.
  // PLANTED: rendered `null` for the scope block when `scopeOfImpact === null`.
  // RED: expected 'cc-05-waiting-GATE-BB-0002' to be 'cc-05-scope-GATE-BB-0002'
  it('the uncomputable scope fills its slot rather than vacating it', () => {
    RENDER()
    const scope = screen.getByTestId(`cc-05-scope-${NOT_DECIDABLE}`)
    expect(scope.getAttribute('data-scope-resolved')).toBe('false')
    expect(scope.textContent).toContain('could not be computed')
    const resolved = screen.getByTestId(`cc-05-scope-${DECIDABLE}`)
    expect(resolved.getAttribute('data-scope-resolved')).toBe('true')
    expect(resolved.textContent).toContain('2 stations · 23 pieces · 1 run · 1 job')
  })
})

describe('the waiting clock keeps running on an item that cannot be decided', () => {
  // FAILS IF: the clock stops, resets or disappears on the not-decidable card.
  // Asserted as EQUALITY between the two cards rather than as presence: the
  // two items carry the same arrival, so any difference at all is the defect.
  // PLANTED: rendered `'—'` in place of the waiting time when the item was not
  // decidable.
  // RED: expected 'Proposed by the Deviation and Containment Agent · created
  //      10:26 · waiting — · timeout 30 minutes…' to contain '3 minutes 12
  //      seconds'
  it('both cards render the same waiting time, and it is the storyboard’s own', () => {
    RENDER()
    const expected = cc05WaitingText(CC05_STORYBOARD_ITEM.waitingSeconds)
    expect(expected).toBe('3 minutes 12 seconds')
    const decidable = screen.getByTestId(`cc-05-waiting-${DECIDABLE}`).textContent ?? ''
    const stuck = screen.getByTestId(`cc-05-waiting-${NOT_DECIDABLE}`).textContent ?? ''
    expect(decidable).toContain(expected)
    expect(stuck).toContain(expected)
    expect(stuck).toBe(decidable)
  })

  // FAILS IF: the not-decidable card is drawn as decidable, or the decidable
  // one as stuck. The flag is on the card and the two must disagree, so a
  // check true of both a defect and its fix is not available.
  it('exactly one card is not decidable, and it is the one with no scope', () => {
    RENDER()
    expect(screen.getByTestId(`cc-05-card-${DECIDABLE}`).getAttribute('data-decidable')).toBe('true')
    expect(screen.getByTestId(`cc-05-card-${NOT_DECIDABLE}`).getAttribute('data-decidable')).toBe(
      'false',
    )
    expect(screen.queryByTestId(`cc-05-not-decidable-${DECIDABLE}`)).toBeNull()
    expect(screen.getByTestId(`cc-05-not-decidable-${NOT_DECIDABLE}`)).toBeTruthy()
  })
})

describe('the decision controls, disabled for that item only', () => {
  // FAILS IF: the decidable item's controls are disabled. `Disabled for that
  // item ONLY` is the pattern's own cell, so a screen-wide disable is the
  // wrong rendering even though it is the safer-looking one.
  // PLANTED: passed `missingElement` unconditionally to every control.
  // RED: expected null to be null → expected 'true' to be null (the decidable
  //      card's first control acquired aria-disabled)
  it('the decidable item draws three live controls with no reason attached', () => {
    RENDER()
    const controls = controlsOf(DECIDABLE)
    expect(LABELS_FROM_SOURCE).toEqual(['Approve', 'Adjust and approve', 'Decline with reason'])
    expect(controls).toHaveLength(LABELS_FROM_SOURCE.length)
    expect(controls.map((c) => c.textContent)).toEqual(LABELS_FROM_SOURCE)
    expect([...CC05_DECISION_CONTROLS]).toEqual(LABELS_FROM_SOURCE)
    for (const c of controls) {
      expect(c.getAttribute('aria-disabled')).toBeNull()
      expect(c.getAttribute('aria-describedby')).toBeNull()
    }
  })

  // FAILS IF: the not-decidable item's controls stay live, or are disabled
  // with no reason. The reason is resolved through `aria-describedby` off the
  // control, never off `textContent` — the note beside it carries the same
  // words on purpose, so a `textContent` read passes on the note alone.
  // PLANTED: removed `missingElement` from the `WriteControl` call.
  // RED: expected null not to be null — a disabled control with no
  //      aria-describedby states no reason
  it('the not-decidable item draws three disabled controls, each stating its reason', () => {
    RENDER()
    const controls = controlsOf(NOT_DECIDABLE)
    expect(controls).toHaveLength(CC05_DECISION_CONTROLS.length)
    for (const c of controls) {
      expect(c.getAttribute('aria-disabled')).toBe('true')
      const reason = reasonOf(c)
      expect(reason.textContent).toContain('Not decidable')
      expect(reason.textContent).toContain('the scope of impact')
      expect(reason.textContent).toContain('The waiting time keeps running')
      expect(reason.textContent).toContain('never expires on its own')
    }
  })

  // FAILS IF: the missing element stops being named on the control's own
  // reason. THIS IS ONE HALF OF A REDUNDANT PAIR and is asserted alone, off
  // `aria-describedby`, so removing the item note cannot satisfy it.
  // PLANTED: replaced `missingElement={missingElement}` with a constant string
  // naming no element ("context").
  // RED: expected 'Not decidable — context could not be resolved…' to contain
  //      'the scope of impact'
  it('the control’s own reason names the missing element', () => {
    RENDER()
    const reason = reasonOf(controlsOf(NOT_DECIDABLE)[0] as HTMLElement)
    expect(reason.textContent).toContain('the scope of impact')
  })

  // FAILS IF: the missing element stops being named on the item's own
  // paragraph. THE OTHER HALF OF THE PAIR, asserted alone against the
  // paragraph's own subtree.
  // PLANTED: deleted the not-decidable paragraph from
  // `GovernanceGateQueue.tsx`.
  // RED: Unable to find an element by:
  //      [data-testid="cc-05-not-decidable-GATE-BB-0002"]
  it('the item’s own paragraph names the missing element and the running clock', () => {
    RENDER()
    const note = screen.getByTestId(`cc-05-not-decidable-${NOT_DECIDABLE}`).textContent ?? ''
    expect(note).toContain('Not decidable')
    expect(note).toContain('the scope of impact')
    expect(note).toContain('still running')
    expect(note).toContain('never expires on its own')
    expect(note).toContain('never made decidable by defaulting the missing element')
  })

  // FAILS IF: BOTH halves go at once, which is the case neither single gate
  // above can distinguish from the other's failure. Planted as the removal of
  // each and of both, because redundant protections cannot be verified one at
  // a time.
  // PLANTED: removed the paragraph AND the `missingElement` prop together.
  // RED: both gates above went red, and this one named the pair.
  it('the missing element is named in two independent places, not one', () => {
    RENDER()
    const fromControl = reasonOf(controlsOf(NOT_DECIDABLE)[0] as HTMLElement).textContent ?? ''
    const fromNote = screen.getByTestId(`cc-05-not-decidable-${NOT_DECIDABLE}`).textContent ?? ''
    const places = [fromControl, fromNote].filter((t) => t.includes('the scope of impact'))
    expect(places).toHaveLength(2)
  })

  // FAILS IF: nothing is queued client-side stops being stated on the disabled
  // control. `AC-CC-091` is the surface rule and `FB-CC-QUEUE`'s own cell is
  // `Not applicable — nothing is written`.
  it('the disabled reason carries the never-queued clause from the pattern’s own cell', () => {
    RENDER()
    const reason = reasonOf(controlsOf(NOT_DECIDABLE)[0] as HTMLElement).textContent ?? ''
    expect(reason).toContain('never queued, in any state')
    expect(reason).toContain('Not applicable — nothing is written')
  })
})

describe('the trigger origin time is admitted missing, never fabricated', () => {
  // FAILS IF: a time is invented where the source supplies none. L37159
  // requires the origin time beside the creation time; substituting the
  // creation time would assert the two are equal, which is what the rule
  // exists to prevent. The gate scans the element for a clock-shaped string
  // rather than trusting the flag, because a flag is satisfied by itself.
  // PLANTED: set `triggerOriginTime` to '10:26' on both storyboard items.
  // RED: expected 'Trigger origin time: 10:26' not to match /\d{1,2}:\d{2}/
  it('the origin slot states the absence and carries no clock-shaped value', () => {
    RENDER()
    for (const id of [DECIDABLE, NOT_DECIDABLE]) {
      const origin = screen.getByTestId(`cc-05-origin-${id}`).textContent ?? ''
      expect(origin, id).toContain('not stated in the source')
      expect(origin, id).toContain('L37159')
      expect(origin, id).not.toMatch(/\d{1,2}:\d{2}/)
    }
    // The creation time IS stated and is rendered, so the absence above is a
    // real gap rather than an empty card.
    expect(screen.getByTestId(`cc-05-waiting-${DECIDABLE}`).textContent).toContain('created 10:26')
  })
})

describe('AC-CC-090 is answered with a count, and the shortfall is disclosed', () => {
  // FAILS IF: the criterion is rendered as met, or the count moves without the
  // identifiers moving with it. Both the total and the shortfall are on the
  // element as data attributes, and the five identifiers are named.
  // PLANTED: flipped `CC05_AC_CC_090.met` to `true` in queue.ts.
  // RED: expected 'true' to be 'false' // Object.is equality
  it('renders twelve functionalities, five naming no pattern, and says it is not met', () => {
    RENDER()
    const box = screen.getByTestId('cc-05-ac-090')
    expect(box.getAttribute('data-met')).toBe('false')
    expect(box.getAttribute('data-total')).toBe('12')
    expect(box.getAttribute('data-naming-none')).toBe('5')
    for (const id of [
      'FUNC-CC-0502-2-2',
      'FUNC-CC-0503-1-1',
      'FUNC-CC-0503-1-2',
      'FUNC-CC-0503-1-3',
      'FUNC-CC-0504-1-1',
    ]) {
      expect(box.textContent, id).toContain(id)
    }
    expect(box.textContent).toContain('FB-CC-AGENT')
    expect(box.textContent).toContain('FB-CC-CMD')
    expect(within(box).getAllByRole('listitem')).toHaveLength(12)
  })
})

describe('the divergences carry both readings and no winner', () => {
  // FAILS IF: a reading is dropped, or one is marked. Three divergences, two
  // readings each, both locators rendered.
  // PLANTED: rendered only `d.readings[0]` in `GovernanceGateQueue.tsx`.
  // (Deleting a reading from the record is a TYPE error — `readings` is a
  // fixed-length pair — so the plant is on the rendering, which is the half a
  // type cannot hold.)
  // RED: expected 'Rows 1, 2, 3, 4, 5, 6, 7, 8 · Tenant Admin…' to contain
  //      'MTX-TEN-02c · L22062, condition [K1] · L22072'
  it('renders both readings and both locators for all three', () => {
    RENDER()
    const tenant = screen.getByTestId('cc-05-divergence-tenant-admin-on-this-module')
    expect(tenant.textContent).toContain('L37078')
    expect(tenant.textContent).toContain('MTX-TEN-02c · L22062, condition [K1] · L22072')
    expect(tenant.textContent).toContain('§25.4 row 2 · L48445')

    const supervisor = screen.getByTestId('cc-05-divergence-supervisor-see-versus-decide')
    expect(supervisor.textContent).toContain('L37080-L37083')
    expect(supervisor.textContent).toContain('§21.16 row 2 · L38683')

    const qm = screen.getByTestId('cc-05-divergence-quality-manager-conditioned-or-not')
    expect(qm.textContent).toContain('MTX-TEN-02c · L22062, condition [K9] · L22072')
  })

  // FAILS IF: a rendered divergence acquires an adopted, preferred or chosen
  // reading.
  // PLANTED: prefixed the Tenant Admin record's `renderedConsequence` with
  // "The first reading is adopted here."
  // RED: cc-05-divergence-tenant-admin-on-this-module marks a winner with
  //      "adopted here"
  it('renders no word that marks one reading as the answer', () => {
    RENDER()
    for (const id of [
      'cc-05-divergence-tenant-admin-on-this-module',
      'cc-05-divergence-supervisor-see-versus-decide',
      'cc-05-divergence-quality-manager-conditioned-or-not',
    ]) {
      const text = (screen.getByTestId(id).textContent ?? '').toLowerCase()
      for (const word of ['adopted here', 'preferred', 'we choose', 'the correct reading']) {
        expect(text, `${id} marks a winner with "${word}"`).not.toContain(word)
      }
    }
  })

  // FAILS IF: DEC-TACC-001's recommendation is rendered as an adoption. The
  // flag is on the element and the words are checked beside it, because a flag
  // is satisfied by itself.
  // PLANTED: set `adopted` to the recommendation text in `readings.ts`.
  // RED: expected 'true' to be 'false' // Object.is equality
  it('renders DEC-TACC-001 as recommended and not adopted', () => {
    RENDER()
    const box = screen.getByTestId('cc-05-tacc')
    expect(box.getAttribute('data-adopted')).toBe('false')
    expect(box.textContent).toContain('Client Decision Required')
    expect(box.textContent).toContain('Recommended and not adopted')
    expect(box.textContent).toContain('L23069')
    expect(box.textContent).toContain('read-only monitoring access is served')
  })
})

describe('the two rows nobody holds, and where one of them is performed', () => {
  // FAILS IF: row 7's destination stops being named. Both cells render as
  // nothing at all under the build's one rendering rule, so the note is the
  // only place a reader learns where gate policy is authored.
  // PLANTED: deleted the row 7 paragraph from `GovernanceGateQueue.tsx`.
  // RED: expected '…Approve a composed agent for live use…' to contain
  //      'Standards and Operations Studio'
  it('names the Studio for row 7 and the queue exclusion for row 8', () => {
    RENDER()
    const box = screen.getByTestId('cc-05-nobody-holds')
    expect(box.textContent).toContain('Change gate policy, approvers or timeouts')
    expect(box.textContent).toContain('Standards and Operations Studio')
    expect(box.textContent).toContain('L37084')
    expect(box.textContent).toContain('Approve a composed agent for live use')
    expect(box.textContent).toContain('AC-CC-248')
    // A link is NOT drawn: the destination is an authoring surface, not a
    // record this build can resolve, and no anchor is invented for it.
    expect(within(box).queryAllByRole('link')).toEqual([])
  })
})

describe('the module’s boundaries on this screen', () => {
  // FAILS IF: this panel starts drawing the ten operational actions itself.
  // `MOD-CC-13`'s rail is mounted on this route by the page and draws all ten;
  // a second list here would be a second spelling of a closed set with one
  // owner. The panel NAMES action 2 and draws no control for it.
  // PLANTED: mounted `<Cc13ActionRail …/>` inside this panel as well.
  // RED: expected null not to be null (`cc13-rail` found inside the panel)
  it('names action 2 without drawing a second copy of the rail', () => {
    RENDER()
    const named = screen.getByTestId('cc-05-exercised-actions').textContent ?? ''
    expect(named).toContain('action 2')
    expect(named).toContain('L38793')
    expect(named).toContain('not drawn twice')
    expect(screen.queryByTestId('cc13-rail')).toBeNull()
  })

  // FAILS IF: the session-offline statement drops the fact that nothing is
  // queued. `FB-CC-SESS`'s cell is `None, deliberately` — the STRONGER of the
  // two refusal shapes, because a write exists on that path and is still not
  // queued.
  // PLANTED: replaced `{sess.clientSideQueueing}` in
  // `GovernanceGateQueue.tsx` with the weaker literal `Not applicable —
  // nothing is written`, which seven of the nine rows use.
  // `src/surfaces/cc/fallback/patterns.ts` is wave 0's and nine siblings are
  // running against it, so the plant is made on this module's rendering of
  // that cell rather than on the cell itself.
  // RED: expected 'FB-CC-SESS — Platform unreachable from…' to contain
  //      'None, deliberately'
  it('renders FB-CC-SESS’s own cells, including that nothing is queued', () => {
    RENDER()
    const text = screen.getByTestId('cc-05-session-offline').textContent ?? ''
    expect(text).toContain('FB-CC-SESS')
    expect(text).toContain('Disabled with the reason shown')
    expect(text).toContain('None, deliberately')
    expect(text).toContain('Frozen labelled board')
  })

  // FAILS IF: the pushed marker obligation is restated rather than read from
  // §21.3's assignment table. The rendered words are the table's own.
  it('renders the live model’s pushed obligation for gate item arrival', () => {
    RENDER()
    const text = screen.getByTestId('cc-05-arrival-element').textContent ?? ''
    expect(text).toContain('Gate item arrival')
    expect(text).toContain('Pushed')
    expect(text).toContain('Waiting time from arrival')
    expect(text).toContain('L35886')
  })

  // FAILS IF: this module or its route acquires `'use client'` while exporting
  // plain data a server component reads. Asserted on the route file too: it is
  // the file that renders the module identifier the registry generator reads
  // out of the built HTML.
  // PLANTED: added `'use client'` to `GovernanceGateQueue.tsx`.
  // RED: src/surfaces/cc/modules/cc-05/GovernanceGateQueue.tsx: expected true
  //      to be false // Object.is equality
  it('keeps the data files and the route on the server, and the panel exports no data', () => {
    // THE PANEL IS A CLIENT MODULE AND HAS TO BE. It renders a `WriteControl`
    // with an `allow(...)` decision, and that branch is `<Button
    // onClick={onAct}>` — a server component cannot pass a function to a
    // client component, which `pnpm build` refused and no component suite
    // could see. Six of the seven Command Center panels had it.
    //
    // The rule this case exists for is narrower than "no client modules": a
    // `'use client'` file must not export a plain DATA object a server
    // component reads, because its strings come back undefined at prerender.
    // The data files and the route stay server-side; the panel is a client
    // module that exports only its component and its props type.
    for (const f of [
      'src/surfaces/cc/modules/cc-05/matrix.ts',
      'src/surfaces/cc/modules/cc-05/queue.ts',
      'src/surfaces/cc/modules/cc-05/readings.ts',
      'app/command-center/governance-gate-queue/page.tsx',
    ]) {
      expect(/^'use client'/m.test(readFileSync(join(process.cwd(), f), 'utf8')), f).toBe(false)
    }
    const panel = readFileSync(
      join(process.cwd(), 'src/surfaces/cc/modules/cc-05/GovernanceGateQueue.tsx'),
      'utf8',
    )
    expect(/^'use client'/m.test(panel), 'the panel is a client module').toBe(true)
    expect([...panel.matchAll(/^export const (\w+)/gm)].map((m) => m[1] ?? '')).toEqual([])
  })

  // FAILS IF: the panel stops saying which module it is. The registry
  // generator reads the identifier out of the built HTML, and a module
  // demonstrated by its slug claim alone never says what it is.
  it('renders its own module identifier and its register row', () => {
    RENDER()
    expect(screen.getByTestId('cc-05-queue').getAttribute('data-module')).toBe('MOD-CC-05')
    const identity = screen.getByTestId('cc-05-identity').textContent ?? ''
    expect(identity).toContain('MOD-CC-05')
    expect(identity).toContain('SCR-CC-06')
    expect(identity).toContain('L48391')
    expect(identity).toContain('Landing for the Quality Manager')
  })
})
