import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { rolesInDomain } from '@/domain/roles'
import { SchedulerRegistryScreen } from '@/surfaces/sa/scheduler/SchedulerRegistryScreen'
import { OccurrenceDetailScreen } from '@/surfaces/sa/scheduler/OccurrenceDetailScreen'
import {
  ANSWERED_COLUMNS,
  BLOCK_REASON_CLASSES,
  OCCURRENCE_DETAIL_FIELDS,
  REGISTRY_COLUMNS,
  REGISTRY_ROWS,
  UNANSWERED_COLUMNS,
} from '@/surfaces/sa/scheduler/registry'

/**
 * All rendered copy with a separator at every element edge.
 *
 * `textContent` concatenates adjacent text nodes with nothing between them,
 * which blinds a word-boundary gate exactly at element edges — a phrase split
 * across a `<span>` boundary is invisible to it, and a phrase welded across
 * one is invented by it. This build's catalogue of gates that could not fail
 * opens with that defect, so every scan below runs on tag-replaced markup.
 */
function copyOf(): string {
  return document.body.innerHTML.replace(/<[^>]*>/g, ' ')
}

/** D10 / spec §10 gate 4: these four words appear nowhere in SURF-SA copy. */
const FORBIDDEN_WORDS = /\b(tamper-evident|chained|signed|verified)\b/i

/**
 * THE PHRASE NEITHER SCREEN MAY EVER SHOW A READER. A scheduling daemon is
 * not what this product has, and naming one claims a runtime that does not
 * exist. The word "cron" alone is permitted in exactly one place — the fifth
 * column of the registry, transcribed from the source's own column heading —
 * so the ban is on the phrase, not on the token.
 */
const IMPLIES_A_DAEMON = /\bcron\s+(job|jobs|daemon|service|worker|entry|entries|table|tab)\b/i

/**
 * REMOVES THE CHROME'S REVIEWER CONTROL FROM THE RENDERED DOCUMENT, SO THAT
 * EVERY "NO OPERABLE CONTROL" ASSERTION BELOW GOES ON MEASURING THE SCREEN
 * BODY AND NOT THE SHELL.
 *
 * The viewer control the accessibility gate requires is a `combobox`, and it
 * is the SHELL's: `SchedulerScaffold` renders it above the screen body so a
 * reviewer can look at an unowned screen as each of the four platform roles.
 * A whole-render `queryAllByRole('combobox')` would from now on be answered by
 * that one control, which is the defect shape this build lists twice over — an
 * assertion that stops measuring its subject while still passing.
 *
 * THE EXCISION IS ITSELF ASSERTED, in both directions, which is what stops
 * this from being a helper scoped to exclude the defect it names (shape 10).
 * The removed node must exist and must hold EXACTLY ONE select: if the control
 * were ever moved down into the screen body, or a second one grown anywhere,
 * this goes red here rather than quietly widening what the body may contain.
 */
function exciseReviewerChrome(): void {
  const chrome = document.querySelector('[aria-label="Storyboard view switcher"]')
  expect(chrome, 'the shell rendered no view switcher to excise').not.toBeNull()
  expect(
    chrome?.querySelectorAll('select').length,
    'the excised chrome held no select, so removing it would measure nothing',
  ).toBe(1)
  expect(
    document.querySelectorAll('select').length,
    'a select renders outside the chrome — the body assertions below are about to pass on the wrong subject',
  ).toBe(1)
  chrome?.remove()
}

describe('SCR-SA-SCHED-01 — the Scheduler Registry', () => {
  it('renders, names its own identifier, and mints no catalogue number', () => {
    render(<SchedulerRegistryScreen />)
    expect(screen.getByRole('heading', { level: 1, name: 'Scheduler Registry' })).toBeTruthy()
    const copy = copyOf()
    expect(copy).toContain('SCR-SA-SCHED-01')
    expect(copy).not.toMatch(/SCR-SA-\d\d(?![\w-])/)
  })

  it('shows the asymmetry as a comparison, not as its own count alone', () => {
    render(<SchedulerRegistryScreen />)
    const copy = copyOf()
    // Both counts on both screens: the finding IS the comparison, and a screen
    // printing only its own number states a figure and hides the finding.
    expect(copy).toContain('SCR-SA-SCHED-01 occurs 4 occurrences')
    expect(copy).toContain('SCR-SA-SCHED-02 occurs 1 occurrence')
  })

  it('draws all ten transcribed columns and marks the five with no data', () => {
    render(<SchedulerRegistryScreen />)
    const copy = copyOf()
    for (const column of REGISTRY_COLUMNS) {
      expect(copy, column.label).toContain(column.label)
    }
    // Each unanswered column carries its own reason, in full.
    for (const column of UNANSWERED_COLUMNS) {
      expect(copy, column.label).toContain(column.whyNot ?? '__missing__')
    }
    // "no data" appears once per unanswered column in the numbered list.
    expect(copy.match(/— no data/g) ?? []).toHaveLength(UNANSWERED_COLUMNS.length)
    // THE LOOP ABOVE CANNOT CATCH A WRONG LABEL — measured by planting one.
    // It draws from `REGISTRY_COLUMNS` and asserts against `REGISTRY_COLUMNS`,
    // so a renamed column renders under its new name and the loop agrees;
    // what it does catch is a column the screen stops drawing at all.
    //
    // Nor does a `toContain` on one label catch it. Planting a rename of
    // "health chip" left `copy.toContain('health chip')` green, because the
    // paragraph under the chip says "The health chip is derived from…" — the
    // label was gone and another sentence answered for it. So the list's own
    // items are read and compared as an exact ordered array of literals,
    // which is the only form here that a rename cannot survive.
    const listed = [...(document.querySelectorAll('ol') as NodeListOf<HTMLElement>)]
      .map((ol) => [...ol.querySelectorAll('li')].map((li) => li.textContent?.trim() ?? ''))
      .find((items) => items[0]?.startsWith('1.'))
    expect(listed).toEqual([
      '1.name',
      '2.owning surface',
      '3.authority class',
      '4.mechanism class',
      '5.cron expression or trigger description',
      '6.scope (platform-wide or per tenant)— no data',
      '7.last successful occurrence— no data',
      '8.next expected occurrence— no data',
      '9.backlog depth— no data',
      '10.health chip— no data',
    ])
  })

  it('draws one row per registered scheduled work item, with every cell filled', () => {
    render(<SchedulerRegistryScreen />)
    const copy = copyOf()
    expect(REGISTRY_ROWS.length).toBeGreaterThan(0)
    for (const row of REGISTRY_ROWS) {
      expect(copy, row.id).toContain(row.id)
      for (const cell of row.cells) expect(copy, `${row.id}: ${cell}`).toContain(cell)
    }
    expect(ANSWERED_COLUMNS).toHaveLength(5)
  })

  it('renders no telemetry figure as a zero and no health chip as healthy', () => {
    render(<SchedulerRegistryScreen />)
    const copy = copyOf()
    expect(copy).toContain('Nothing recorded yet')
    // THE CHIP'S OWN LABEL, not the page. Scoping matters here: the page says
    // "never healthy" twice, in prose that DENIES the claim, and a page-wide
    // ban on the word would forbid the sentence that keeps the promise. What
    // must never read healthy is the chip, and the unit gate holds that over
    // the whole freshness vocabulary rather than over one rendering.
    const chip = screen.getByText(/^Scheduler health/)
    expect(chip.textContent).toBe('Scheduler health unknown — nothing recorded yet')
    expect(chip.textContent).not.toMatch(/\bhealthy\b/i)
    // The four telemetry columns must not be sitting next to a bare 0.
    for (const column of UNANSWERED_COLUMNS.filter((c) => c.answerability === 'telemetry')) {
      const at = copy.indexOf(column.label)
      expect(at, column.label).toBeGreaterThan(-1)
      expect(copy.slice(at, at + 200), column.label).not.toMatch(/\s0\s/)
    }
  })

  it('offers no operable control at all in the screen body', () => {
    render(<SchedulerRegistryScreen />)
    exciseReviewerChrome()
    // Not "no enabled control" — NO control. With no scheduler behind the
    // screen there is nothing for one to act on, and a disabled control would
    // still assert that the act exists here.
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
    expect(document.querySelectorAll('[aria-disabled]')).toHaveLength(0)
  })

  it('states each governed control as a permission answer per platform role', () => {
    render(<SchedulerRegistryScreen />)
    const copy = copyOf()
    for (const role of ['Root Super Admin', 'Admin', 'Platform Engineer', 'Support']) {
      expect(copy, role).toContain(role)
    }
    // The Platform Engineer's own condition on a manual tick, in the source's
    // words rather than as a bare "Allowed".
    expect(copy).toContain('requires Admin approval and reason')
    // Support is read-only on viewing the definition and is not granted a tick.
    expect(copy).toContain('PER-SCHED-13')
  })

  it('names an audit actor and an authority in two separate fields', () => {
    render(<SchedulerRegistryScreen />)
    const copy = copyOf()
    expect(copy).toContain('console-operator-storyboard')
    expect(copy).toContain('is the authority field, never the actor field')
  })
})

describe('SCR-SA-SCHED-02 — Occurrence detail', () => {
  it('renders, and its near-total absence of corroboration is on the screen', () => {
    render(<OccurrenceDetailScreen />)
    expect(screen.getByRole('heading', { level: 1, name: 'Occurrence detail' })).toBeTruthy()
    const copy = copyOf()
    expect(copy).toContain('SCR-SA-SCHED-02')
    expect(copy).toContain('specified exactly once')
    expect(copy).toContain('no acceptance criterion')
  })

  it('draws the eight fields with no value invented for any of them', () => {
    render(<OccurrenceDetailScreen />)
    const copy = copyOf()
    expect(OCCURRENCE_DETAIL_FIELDS).toHaveLength(8)
    for (const field of OCCURRENCE_DETAIL_FIELDS) {
      expect(copy, field.label).toContain(field.label)
    }
    // One "Nothing recorded yet" per field, and not a date, a duration or a
    // zero anywhere among them.
    expect(copy.match(/Nothing recorded yet/g)?.length ?? 0).toBeGreaterThanOrEqual(
      OCCURRENCE_DETAIL_FIELDS.length,
    )
    expect(copy).not.toMatch(/\bSCHEDRUN-[A-Z0-9-]+\b/)
    expect(copy).not.toMatch(/\b\d{4}-\d{2}-\d{2}\b/)
  })

  it('carries the exclusion, which is the half of the line easiest to lose', () => {
    render(<OccurrenceDetailScreen />)
    const copy = copyOf()
    for (const excluded of ['no measurement', 'no worker name', 'no evidence']) {
      expect(copy, excluded).toContain(excluded)
    }
  })

  // WHAT THIS CHECKS AND WHAT IT DOES NOT. It draws from the same constant it
  // asserts against, so a REWORDED reason class renders under its new wording
  // and this stays green — measured by planting one. Its job is that the screen
  // draws all eight at all; the wording is compared against the source's own
  // rows in the unit gate, which is where the plant went red.
  it('draws the eight block reason classes verbatim', () => {
    render(<OccurrenceDetailScreen />)
    const copy = copyOf()
    for (const reason of BLOCK_REASON_CLASSES) {
      expect(copy, reason.reasonClass).toContain(reason.reasonClass)
      expect(copy, reason.name).toContain(reason.name)
    }
  })

  it('names both outcome vocabularies and prefers neither', () => {
    render(<OccurrenceDetailScreen />)
    const copy = copyOf()
    expect(copy).toContain('15 states as diagram nodes')
    expect(copy).toContain('12 inline')
    expect(copy).toContain('settles neither')
    expect(copy).toContain('mints no decision identifier')
    // The register's own twelve are printed, so a reader can see the set the
    // acceptance criterion favours rather than only being told it exists.
    for (const state of ['succeeded_late', 'duplicate_suppressed', 'manual_completion']) {
      expect(copy, state).toContain(state)
    }
  })

  it('offers no operable control in its screen body either', () => {
    render(<OccurrenceDetailScreen />)
    exciseReviewerChrome()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
    expect(document.querySelectorAll('[aria-disabled]')).toHaveLength(0)
  })
})

describe('the honesty constraints, on both screens', () => {
  const screens = [
    ['SCR-SA-SCHED-01', <SchedulerRegistryScreen key="a" />],
    ['SCR-SA-SCHED-02', <OccurrenceDetailScreen key="b" />],
  ] as const

  it('says "scheduled work item" and never names a scheduling daemon', () => {
    for (const [name, element] of screens) {
      document.body.innerHTML = ''
      render(element)
      const copy = copyOf()
      expect(copy, name).toContain('scheduled work item')
      expect(copy, name).not.toMatch(IMPLIES_A_DAEMON)
    }
  })

  it('uses the word cron only in the two phrases the source itself writes', () => {
    document.body.innerHTML = ''
    render(<SchedulerRegistryScreen />)
    const copy = copyOf()
    const hits = copy.match(/cron[a-z]*/gi) ?? []
    expect(hits.length).toBeGreaterThan(0)
    // Never "crontab", never "crond" — the bare word only.
    for (const hit of hits) expect(hit.toLowerCase()).toBe('cron')
    // And every one of them is followed by `expression` (L99687's own column
    // name) or `change` (L100761's own control name). Both are the source's
    // words; neither names a running process.
    for (const hit of copy.match(/cron\s+[a-z]+/gi) ?? []) {
      expect(['cron expression', 'cron change']).toContain(hit.toLowerCase().replace(/\s+/g, ' '))
    }
    // The daemon-naming phrase, checked as its own predicate so the allowance
    // above cannot be widened into permitting one.
    expect(copy).not.toMatch(IMPLIES_A_DAEMON)
    expect(IMPLIES_A_DAEMON.test('a cron job runs nightly')).toBe(true)
  })

  it('states the at-least-once / at-most-once model on both screens', () => {
    for (const [name, element] of screens) {
      document.body.innerHTML = ''
      render(element)
      const copy = copyOf()
      expect(copy, name).toContain('at-least-once delivery of the trigger')
      expect(copy, name).toContain('at-most-once effect per idempotency key')
      expect(copy, name).toContain('does not claim end-to-end exactly-once execution')
    }
  })

  it('never treats an offline device as unhealthy, on either screen', () => {
    for (const [name, element] of screens) {
      document.body.innerHTML = ''
      render(element)
      const copy = copyOf()
      expect(copy, name).toContain('A device being offline is not a health signal')
      expect(copy, name).toContain('never as reached')
    }
  })

  it('carries the three unestablished items and DEC-FINISH-002 with no readings', () => {
    for (const [name, element] of screens) {
      document.body.innerHTML = ''
      render(element)
      const copy = copyOf()
      expect(copy, name).toContain('Which surface renders the tenant-scope scheduled-run ledger?')
      expect(copy, name).toContain('Which module owns either screen?')
      expect(copy, name).toContain('DEC-FINISH-002')
      // The canon's zero-reading record renders as a disclosure of absence,
      // and this screen adds none of its own.
      expect(copy, name).not.toMatch(/Reading \(a\)/)
      // And it does not re-render the decision whose second home is the trap.
      expect(copy, name).not.toContain('DEC-SCHED-011')
    }
  })

  /** The chrome's own copy, so a word that also occurs in the screen body
   *  cannot answer for the reviewer control's readout. */
  function chromeCopy(): string {
    const chrome = document.querySelector('[aria-label="Storyboard view switcher"]')
    expect(chrome, 'the shell rendered no view switcher').not.toBeNull()
    return (chrome?.innerHTML ?? '').replace(/<[^>]*>/g, ' ')
  }

  it('offers the surface’s viewer control on both screens, over the role registry’s own four', () => {
    // FROM THE REGISTRY, NEVER A HAND LIST — the same set
    // `tests/accessibility/axe-states.spec.ts` compares the built export
    // against. A route that filtered it, dropping Support because its column
    // reads differently, would match no declared vocabulary there and land
    // straight back in the missing list.
    const PLATFORM_ROLE_IDS = rolesInDomain('PLATFORM').map((r) => r.id)
    expect(PLATFORM_ROLE_IDS, 'the platform role vocabulary is empty or gutted').toHaveLength(4)

    for (const [name, element] of screens) {
      document.body.innerHTML = ''
      render(element)

      // ONE select on the whole screen, which is what keeps the harness's
      // `ambiguous` arm empty: a second role-vocabulary select on either route
      // would be absorbed silently there, because option-set equality cannot
      // tell two of them apart and only document order would decide.
      const selects = [...document.querySelectorAll('select')]
      expect(selects, `${name}: this screen carries more than one select`).toHaveLength(1)
      const select = screen.getByRole('combobox', { name: 'View as platform role' })
      expect(select, name).toBe(selects[0])
      expect(
        [...select.querySelectorAll('option')].map((o) => o.getAttribute('value')),
        name,
      ).toEqual(PLATFORM_ROLE_IDS)

      // ANTI-VACUITY, here as well as in the browser: a viewer control whose
      // positions render identical markup is a control writing state nothing
      // reads, which is the first defect shape in this build's own list.
      const renderings = new Map<string, string>()
      const quotedCell: string[] = []
      for (const roleId of PLATFORM_ROLE_IDS) {
        fireEvent.change(select, { target: { value: roleId } })
        expect((select as HTMLSelectElement).value, `${name}: ${roleId} did not take`).toBe(roleId)
        renderings.set(roleId, document.body.innerHTML)
        // THE REPORTED CELL, NOT THE WHOLE CHROME. The paragraph beneath the
        // readout explains that Allowed and Read-only make no difference to
        // what is drawn, so a scan of the chrome's whole copy matched every
        // role and answered for the readout — measured, and this is the
        // narrowing.
        //
        // NOT A QUOTATION ANY MORE, and that is R4-05: `ColumnCell.detail`
        // for a BARE cell is a sentence the parser supplies to satisfy
        // L10238's no-blank-cells rule, and printing it inside quotation
        // marks after the verb "reads" put "Allowed, stated bare in the
        // source" into the source's mouth. All four platform cells of both
        // read rows are bare. The readout introduces the cell with a colon
        // now, so this reads up to the locator instead of between quotes.
        const reported = /Matrix A’s cell for [^:<]+: ([^(<]+)\(/.exec(chromeCopy())?.[1]
        quotedCell.push(`${roleId}=${((reported ?? 'NOTHING QUOTED').split(',')[0] ?? '').trim()}`)
      }
      expect(
        new Set(renderings.values()).size,
        `${name}: positions of the viewer control render byte-identical markup`,
      ).toBe(PLATFORM_ROLE_IDS.length)

      // AND THE DIFFERENCE IS THE MATRIX'S, not just a changed name. Both read
      // rows of Matrix A give the three other platform columns `Allowed` and
      // the Support column `Read-only`, so one position reports a different
      // answer and the ordered list says which.
      expect(quotedCell, `${name}: the Matrix A cell quoted for each role`).toEqual([
        'ROOT_SUPER_ADMIN=Allowed',
        'ADMIN=Allowed',
        'PLATFORM_ENGINEER=Allowed',
        'SUPPORT=Read-only',
      ])

      // The control says on screen that it gates nothing below it, because on
      // these two screens it does not: there is no control for it to gate.
      expect(chromeCopy(), name).toContain('Reviewer control — not part of the product')
      expect(chromeCopy(), name).toContain('This screen offers no operable control to any')
    }
  })

  it('shows no band-and-module annotation, because no module claims either screen', () => {
    for (const [name, element] of screens) {
      document.body.innerHTML = ''
      render(element)
      const copy = copyOf()
      // THE ANNOTATION, not the token. Every other route on this surface
      // prints its owning module's id beside the screen name; these two print
      // "No owning module" instead. The token itself appears further down, in
      // the measured account of why no module claims either screen, and
      // banning it page-wide would forbid the explanation.
      const heading = screen.getByRole('heading', { level: 1 })
      const header = heading.parentElement?.innerHTML.replace(/<[^>]*>/g, ' ') ?? ''
      expect(header.slice(0, header.indexOf('Where this screen comes from')), name).not.toMatch(
        /MOD-SA-\d\d/,
      )
      expect(copy, name).toContain('No owning module')
      expect(copy, name).not.toMatch(/Band [AB]/)
    }
  })

  it('uses none of the four forbidden words, and carries the prototype disclosure', () => {
    for (const [name, element] of screens) {
      document.body.innerHTML = ''
      render(element)
      const copy = copyOf()
      expect(copy.match(FORBIDDEN_WORDS)?.[0], name).toBeUndefined()
      expect(copy, name).toContain('Simulated behaviour only.')
    }
  })

  it('links each screen to the other, so neither is reachable only by URL', () => {
    document.body.innerHTML = ''
    render(<SchedulerRegistryScreen />)
    expect(
      screen.getByRole('link', { name: 'Occurrence detail' }).getAttribute('href'),
    ).toBe('/super-admin/occurrence-detail')

    document.body.innerHTML = ''
    render(<OccurrenceDetailScreen />)
    expect(
      screen.getByRole('link', { name: 'Scheduler Registry' }).getAttribute('href'),
    ).toBe('/super-admin/scheduler-registry')
  })
})
