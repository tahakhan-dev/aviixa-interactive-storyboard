import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { WorkerLifecycleScreen } from '../../app/hub/worker-lifecycle-and-qualifications/WorkerLifecycleScreen'
import {
  ABSENT_BY_RULE,
  CONTROL_MATRIX,
  DOH_CLEARANCES,
  DOH_WORKERS,
  EXPIRED_BANNER_COPY,
  MEASURE_RULES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
} from '../../app/hub/worker-lifecycle-and-qualifications/fixtures'

/**
 * Every write control this module draws, by its exact accessible name. The
 * three handoffs are here too: they are not grant controls — D23 keeps the Hub
 * free of one — but they ARE writes, and they meet the tenant gate, the
 * connection rule and the audit path exactly as the record writes do.
 */
const WRITE_CONTROLS = [
  /^create a worker record$/i,
  /^set the instruction-difficulty profile$/i,
  /^enter a qualification$/i,
  /^record a recertification$/i,
  /^reassign this worker.s runs$/i,
  /^archive this worker$/i,
  /^reactivate this worker$/i,
  /^import workers from the canonical template$/i,
  /^hand off: clear an expired certification$/i,
  /^hand off: clear a never-held qualification$/i,
  /^hand off: clear a second time in this area on this shift$/i,
  /^save the qualification gate settings$/i,
] as const

const MAYA = 'Maya Okonjo'
const TOMAS = 'Tomas Brandt'
const IDRIS = 'Idris Vance'
const KAI = 'Kai Lindqvist'

function region(name: string): HTMLElement {
  return screen.getByRole('region', { name })
}

function text(name: string): string {
  return region(name).textContent ?? ''
}

function selectRole(roleId: string): void {
  fireEvent.change(screen.getByLabelText(/view as tenant role/i), { target: { value: roleId } })
}

function setSelect(label: RegExp | string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function setInput(label: RegExp | string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function button(name: RegExp): HTMLElement {
  return screen.getByRole('button', { name })
}

function click(name: RegExp): void {
  fireEvent.click(button(name))
}

/** Select a person in the register by name. */
function pickWorker(name: string): void {
  fireEvent.click(within(region('Worker register')).getByRole('button', { name: new RegExp(name) }))
}

function registerRow(name: string): HTMLElement {
  return within(region('Worker register')).getByRole('row', { name: new RegExp(name) })
}

/* ------------------------------------------------------------------ *
 * The shell contract and the screen identity.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the shell contract and the screen identity', () => {
  it('renders under the Hub shell with exactly one h1 and the module and both screens as annotations', () => {
    render(<WorkerLifecycleScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Worker Lifecycle and Qualifications',
    )
    expect(screen.getByText(/MOD-DOH-04 · SCR-DOH-07 · SCR-DOH-08/)).toBeDefined()
  })

  it('carries the prototype disclosure and keeps every screen number out of every href', () => {
    const { container } = render(<WorkerLifecycleScreen />)
    expect(screen.getByText(/simulated behaviour only/i)).toBeDefined()
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/SCR-DOH/i)
    }
    expect(container.textContent ?? '').not.toMatch(/SCR-DOH-\d{3}/)
  })

  it('names the qualification gate as a cross-slice seam owned by a later slice, not an inline stub', () => {
    render(<WorkerLifecycleScreen />)
    const handoff = text('Clearance handoff')
    expect(handoff).toMatch(/Cross-slice seam — not built here/i)
    expect(handoff).toMatch(/slice 6/i)
    expect(handoff).toMatch(/two of the three\s+enforcement points|two of the three enforcement points/i)
  })

  it('states that audit is in the same transaction as the action', () => {
    render(<WorkerLifecycleScreen />)
    expect(document.body.textContent ?? '').toMatch(/same transaction/i)
  })
})

/* ------------------------------------------------------------------ *
 * The register, its scope filter and its Area filter.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the worker register', () => {
  it('lists everybody the Tenant Admin can see, with the account link and the difficulty profile', () => {
    render(<WorkerLifecycleScreen />)
    const register = text('Worker register')
    for (const worker of DOH_WORKERS) expect(register, worker.id).toContain(worker.name)
    // Worker is not User: a record with no account says so rather than
    // inventing one or hiding the field.
    expect(register).toMatch(/No platform account — a Worker is not a User/i)
    expect(register).toMatch(/record incomplete, cannot receive assignments/i)
    expect(register).toMatch(/as of/i)
  })

  it('scope-filters an Area-scoped Supervisor out of the people they do not hold', () => {
    render(<WorkerLifecycleScreen />)
    expect(text('Worker register')).toContain(KAI)
    selectRole('SUPERVISOR')
    const register = text('Worker register')
    expect(register).not.toContain(KAI)
    expect(register).toContain(MAYA)
    // And reached through a QUALIFICATION Area rather than only a home Area.
    expect(register).toContain(TOMAS)
  })

  it('reaches STATE-01 through the Area filter, on the Area that holds nobody', () => {
    render(<WorkerLifecycleScreen />)
    expect(text('Worker register')).toContain(MAYA)
    setSelect(/filter the register by area/i, 'AREA-ARD-PACK')
    const register = text('Worker register')
    expect(register).not.toContain(MAYA)
    expect(register).toMatch(/holds nobody/i)
  })

  it('shows a worker created in this session, so the register reads live state and not the seed', () => {
    render(<WorkerLifecycleScreen />)
    expect(text('Worker register')).not.toContain('Ines Duarte')
    setInput(/^name$/i, 'Ines Duarte')
    click(/^create a worker record$/i)
    expect(text('Worker register')).toContain('Ines Duarte')
  })

  it('refuses a blank name, stating the rule and what would be accepted', () => {
    render(<WorkerLifecycleScreen />)
    setInput(/^name$/i, '   ')
    expect(button(/^create a worker record$/i).getAttribute('aria-disabled')).toBe('true')
    expect(text('Worker register')).toMatch(/blank one is the only value refused/i)
  })
})

/* ------------------------------------------------------------------ *
 * SB-DOH-016 and AC-STU-118 — the banner, the chip, and the rule that
 * a clearance is never effective before its command is applied.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the record banner and the clearance that has not landed', () => {
  it('renders the fixed banner copy verbatim over a record with an expired certification', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    expect(text('Worker record')).toContain(EXPIRED_BANNER_COPY)
  })

  it('AC-STU-118: a queued clearance does not silence the banner, and an applied one does', () => {
    render(<WorkerLifecycleScreen />)
    // Maya's expired certificate HAS a clearance — granted, and still queued on
    // the device. The banner must stand.
    const queued = DOH_CLEARANCES.find((c) => c.workerId === 'WKR-ARD-0114')
    expect(queued?.commandState).toBe('queued')
    pickWorker(MAYA)
    expect(text('Worker record')).toContain(EXPIRED_BANNER_COPY)
    expect(text('Worker record')).toMatch(/Expired/)

    // Kai's expired certificate has a clearance that reached applied. Same
    // expiry, different command state, different rendering — which is the only
    // difference between the two records.
    pickWorker(KAI)
    const record = text('Worker record')
    expect(record).not.toContain(EXPIRED_BANNER_COPY)
    expect(record).toMatch(/Cleared/)
  })

  it('shows the command state of every clearance and never renders a queued one as effective', () => {
    render(<WorkerLifecycleScreen />)
    const clearances = text('Clearance register')
    for (const clearance of DOH_CLEARANCES) expect(clearances, clearance.id).toContain(clearance.id)
    expect(clearances).toMatch(/queued/)
    expect(clearances).toMatch(/not applied, so nothing here renders as effective/i)
    expect(clearances).toMatch(/applied on the device, so the qualification may read Cleared/i)
  })

  it('marks the register row of somebody carrying an expired certificate, and not the others', () => {
    render(<WorkerLifecycleScreen />)
    expect(registerRow(MAYA).textContent ?? '').toMatch(/one expired/i)
    // Kai is expired too, and cleared on the device, so the register agrees
    // with the record rather than contradicting it.
    expect(registerRow(KAI).textContent ?? '').toMatch(/none expired/i)
    expect(registerRow(TOMAS).textContent ?? '').toMatch(/none expired/i)
  })
})

/* ------------------------------------------------------------------ *
 * Every write changes something visible.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the writes, and what each one changes on screen', () => {
  it('refuses a recertification that does not postdate the old expiry, then accepts one that does', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    setInput(/^new expiry$/i, '2025-01-01')
    expect(button(/^record a recertification$/i).getAttribute('aria-disabled')).toBe('true')
    const record = text('Worker record')
    expect(record).toMatch(/postdate/i)
    expect(record).toMatch(/no partial record/i)

    setInput(/^new expiry$/i, '2027-08-14')
    expect(button(/^record a recertification$/i).getAttribute('aria-disabled')).toBeNull()
    click(/^record a recertification$/i)
    const after = text('Worker record')
    expect(after).toContain('2027-08-14')
    expect(after).toMatch(/postdates 2026-08-14/i)
    // The banner goes, because the certificate is no longer expired. This is
    // the whole chain: a control that wrote state nothing read would leave it.
    expect(after).not.toContain(EXPIRED_BANNER_COPY)
    expect(registerRow(MAYA).textContent ?? '').toMatch(/none expired/i)
  })

  it('records both dates on a back-dated entry, so a late entry is not a compliance gap', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    fireEvent.click(screen.getByLabelText(/scope to Assembly Hall/i))
    setInput(/^certification date$/i, '2026-08-10')
    setInput(/^entry date$/i, '2026-08-19')
    click(/^enter a qualification$/i)
    const record = text('Worker record')
    expect(record).toContain('2026-08-10')
    expect(record).toMatch(/a late entry, recorded as one rather than as a gap/i)
  })

  it('refuses a forward-dated certification date and a qualification scoped to no Area', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    // No Area chosen yet: per-Area scope is mandatory.
    expect(button(/^enter a qualification$/i).getAttribute('aria-disabled')).toBe('true')
    expect(text('Worker record')).toMatch(/per-Area scope, so at least one Area is required/i)
    fireEvent.click(screen.getByLabelText(/scope to Assembly Hall/i))
    expect(button(/^enter a qualification$/i).getAttribute('aria-disabled')).toBeNull()
    setInput(/^certification date$/i, '2026-12-01')
    expect(button(/^enter a qualification$/i).getAttribute('aria-disabled')).toBe('true')
    expect(text('Worker record')).toMatch(/back-dated and never forward-dated/i)
  })

  it('holds a record incomplete until a difficulty level is accepted, then changes the register', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(TOMAS)
    expect(registerRow(TOMAS).textContent ?? '').toMatch(/record incomplete/i)
    expect(button(/^set the instruction-difficulty profile$/i).getAttribute('aria-disabled')).toBe(
      'true',
    )
    expect(text('Worker record')).toMatch(/can receive no assignment/i)
    setSelect(/^instruction-difficulty profile$/i, 'expanded')
    expect(
      button(/^set the instruction-difficulty profile$/i).getAttribute('aria-disabled'),
    ).toBeNull()
    click(/^set the instruction-difficulty profile$/i)
    expect(registerRow(TOMAS).textContent ?? '').toContain('expanded')
    expect(registerRow(TOMAS).textContent ?? '').not.toMatch(/record incomplete/i)
  })

  it('enforces the two-step departure by what is offered rather than by a warning', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(KAI)
    // Step two is refused while runs remain, and the refusal NAMES them.
    expect(button(/^archive this worker$/i).getAttribute('aria-disabled')).toBe('true')
    const before = text('Worker record')
    expect(before).toContain('RUN-2026-08-19-C')
    expect(before).toMatch(/two-step flow and step one has not run/i)

    click(/^reassign this worker.s runs$/i)
    expect(text('Worker record')).not.toContain('RUN-2026-08-19-C')
    expect(text('Last recorded action')).toMatch(
      /closed as abandoned with the recorded reason "Worker departed."/i,
    )
    expect(button(/^archive this worker$/i).getAttribute('aria-disabled')).toBeNull()

    click(/^archive this worker$/i)
    expect(registerRow(KAI).textContent ?? '').toMatch(/archived/i)
  })

  it('reactivates a departed record with the mandatory re-validation prompt standing', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(IDRIS)
    expect(text('Worker record')).not.toMatch(/Re-validation prompt standing/i)
    expect(button(/^reactivate this worker$/i).getAttribute('aria-disabled')).toBeNull()
    click(/^reactivate this worker$/i)
    expect(registerRow(IDRIS).textContent ?? '').toMatch(/reactivated/i)
    const record = text('Worker record')
    expect(record).toMatch(/Re-validation prompt standing/i)
    expect(record).toMatch(/Nothing is silently re-trusted/i)
  })

  it('imports every row of a clean file together, and writes nothing at all from a bad one', () => {
    render(<WorkerLifecycleScreen />)
    click(/^import workers from the canonical template$/i)
    const register = text('Worker register')
    expect(register).toContain('Rosa Delgado')
    expect(register).toContain('Wen Li')

    setSelect(/^file to import$/i, 'IMP-BAD-ROW')
    click(/^import workers from the canonical template$/i)
    expect(text('Last recorded action')).toMatch(/refused and nothing was written/i)
    const after = text('Worker register')
    // Row 1 of the bad file is not created either. That is the whole rule.
    expect(after).not.toContain('Ana Kovac')
    expect(after).not.toContain('Sem Vos')
  })

  it('adds an earlier warning stage and refuses one that is not earlier', () => {
    render(<WorkerLifecycleScreen />)
    expect(text('The expiry ladder')).toMatch(/14, 7, 1, 0 days/)
    setInput(/add an earlier warning stage/i, '3')
    expect(button(/^save the qualification gate settings$/i).getAttribute('aria-disabled')).toBe(
      'true',
    )
    expect(text('Qualification gate settings')).toMatch(/never remove or delay/i)

    setInput(/add an earlier warning stage/i, '30')
    expect(
      button(/^save the qualification gate settings$/i).getAttribute('aria-disabled'),
    ).toBeNull()
    click(/^save the qualification gate settings$/i)
    expect(text('The expiry ladder')).toMatch(/30, 14, 7, 1, 0 days/)
  })

  it('changes the clearance duration, and the handoff panel says what a new grant would run for', () => {
    render(<WorkerLifecycleScreen />)
    expect(text('Clearance handoff')).toMatch(/run for\s*7 days/i)
    setInput(/clearance duration in days/i, '14')
    click(/^save the qualification gate settings$/i)
    expect(text('Clearance handoff')).toMatch(/run for\s*14 days/i)
  })

  it('switches the gate posture, which changes the banner and closes the handoffs', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    expect(text('Worker record')).toContain(EXPIRED_BANNER_COPY)
    setSelect(/^gate posture$/i, 'notify-only')
    click(/^save the qualification gate settings$/i)
    pickWorker(MAYA)
    const record = text('Worker record')
    expect(record).not.toContain(EXPIRED_BANNER_COPY)
    expect(record).toMatch(/no block to clear/i)
    // Under notify-only there is nothing to clear, so the handoffs close with
    // that as their stated reason rather than staying live and doing nothing.
    for (const control of [
      /^hand off: clear an expired certification$/i,
      /^hand off: clear a never-held qualification$/i,
      /^hand off: clear a second time in this area on this shift$/i,
    ]) {
      expect(button(control).getAttribute('aria-disabled'), String(control)).toBe('true')
    }
  })

  /**
   * IMPORTANT 2. `entryAreaIds` was bounded only by which checkboxes rendered,
   * and a persona switch does not clear it — so an Area ticked as Tenant Admin
   * stayed in state after the switch, its checkbox gone, and the write went
   * through. The fix is the intersection the register's Area filter already
   * used one screen up, applied to a write. Drop the `.filter` and this reds.
   */
  it('never writes a qualification scoped to an Area the acting persona does not hold', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    // Quality Laboratory is in the Tenant Admin's scope and in no Supervisor's.
    fireEvent.click(screen.getByLabelText(/scope to Quality Laboratory/i))
    fireEvent.click(screen.getByLabelText(/scope to Assembly Hall/i))
    expect(button(/^enter a qualification$/i).getAttribute('aria-disabled')).toBeNull()

    selectRole('SUPERVISOR')
    expect(screen.queryByLabelText(/scope to Quality Laboratory/i)).toBeNull()
    // Assembly Hall survives the switch; Quality Laboratory does not, and the
    // write records only what survived.
    click(/^enter a qualification$/i)
    const recorded = text('Last recorded action')
    expect(recorded).toContain('Assembly Hall')
    expect(recorded).not.toContain('Quality Laboratory')
  })

  it('refuses the write outright when the persona switch leaves no Area in scope', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    fireEvent.click(screen.getByLabelText(/scope to Quality Laboratory/i))
    expect(button(/^enter a qualification$/i).getAttribute('aria-disabled')).toBeNull()
    selectRole('SUPERVISOR')
    expect(button(/^enter a qualification$/i).getAttribute('aria-disabled')).toBe('true')
    expect(text('Worker record')).toMatch(/it may not name one out of scope/i)
  })

  it('falls the handoff Area back after a persona switch rather than answering about a stale one', () => {
    render(<WorkerLifecycleScreen />)
    setSelect(/area for this handoff/i, 'AREA-ARD-QC')
    expect(text('Clearance handoff')).toMatch(/Quality Laboratory/)
    selectRole('SUPERVISOR')
    const areaSelect = screen.getByLabelText(/area for this handoff/i) as HTMLSelectElement
    // Not blank, and not still answering about the Area that left this persona's
    // scope — the routing and the escalation below both read this value.
    expect(areaSelect.value).toBe('AREA-ARD-PAINT')
    const handoff = text('Clearance handoff')
    expect(handoff).not.toMatch(/Quality Laboratory/)
    expect(handoff).toMatch(/Paint Line/)
    expect(text('Escalation resolution')).toMatch(/Paint Line/)
  })

  it('refuses a blank days-to-expiry rather than recording the certificate as expired', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    fireEvent.click(screen.getByLabelText(/scope to Assembly Hall/i))
    expect(button(/^enter a qualification$/i).getAttribute('aria-disabled')).toBeNull()
    setInput(/days from the register stamp to that expiry/i, '')
    expect(button(/^enter a qualification$/i).getAttribute('aria-disabled')).toBe('true')
    expect(text('Worker record')).toMatch(/Blank is not zero/i)
  })

  it('offers no posture weaker than the floor, and no disabled third option either', () => {
    render(<WorkerLifecycleScreen />)
    const posture = screen.getByLabelText(/^gate posture$/i)
    const values = [...posture.querySelectorAll('option')].map((o) => o.getAttribute('value'))
    expect(values).toEqual(['strict', 'notify-only'])
    expect(text('Qualification gate settings')).toMatch(/no silent posture exists/i)
  })
})

/* ------------------------------------------------------------------ *
 * D23 and D10 — different controls, both held.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the clearance register grants nothing, and the handoff routes', () => {
  it('D23: the register is read-only for every role and carries no control of any kind', () => {
    render(<WorkerLifecycleScreen />)
    for (const roleId of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      selectRole(roleId)
      const register = region('Clearance register')
      expect(within(register).queryAllByRole('button'), roleId).toEqual([])
      expect(register.textContent ?? '', roleId).toMatch(/read-only in the Hub for every role/i)
      expect(register.textContent ?? '', roleId).toMatch(/no grant control is drawn here/i)
    }
  })

  /**
   * IMPORTANT 1. The corpus cell is `Read-only — own scope`, and this module's
   * own matrix row — printed on this same screen — promises it is scope-filtered
   * for the Supervisor. It was not: the table was built from the whole register.
   * The sweep above loops four personas but only ever asserted "no buttons" and
   * two copy strings, so it could never have noticed.
   *
   * Remove `clearancesVisibleTo` from `clearanceRows` and THIS case reds — and
   * it reds on the strictness, not on the containment: a filter returning
   * everything fails the `toBeLessThan`, and a filter returning nothing fails
   * the `toBeGreaterThan`. Equality is not a pass.
   */
  it('D23: scope-filters the corpus, and a Supervisor reads a STRICT subset of the Tenant Admin’s', () => {
    const idsInCorpus = (): string[] =>
      DOH_CLEARANCES.map((c) => c.id).filter((id) => text('Clearance register').includes(id))

    const admin = render(<WorkerLifecycleScreen />)
    const adminIds = idsInCorpus()
    expect(adminIds).toHaveLength(DOH_CLEARANCES.length)
    admin.unmount()

    render(<WorkerLifecycleScreen />)
    selectRole('SUPERVISOR')
    const supervisorIds = idsInCorpus()
    for (const id of supervisorIds) expect(adminIds, id).toContain(id)
    expect(supervisorIds.length).toBeGreaterThan(0)
    expect(supervisorIds.length).toBeLessThan(adminIds.length)
    // The withheld row named, so a filter keyed on the wrong field cannot pass
    // by happening to drop a different one. Kai's clearance sits on Polishing
    // Bay; this Supervisor holds Paint and Assembly.
    expect(supervisorIds).not.toContain('CLR-2026-0033')
    // And the free text that rides with it is gone too — the reason an
    // out-of-scope corpus row leaks more than an out-of-scope register row.
    expect(text('Clearance register')).not.toMatch(/Paired with a certified operator/i)
  })

  it('D10: the Tenant Admin meets all three handoffs DISABLED with the reason, never absent', () => {
    render(<WorkerLifecycleScreen />)
    for (const control of [
      /^hand off: clear an expired certification$/i,
      /^hand off: clear a never-held qualification$/i,
      /^hand off: clear a second time in this area on this shift$/i,
    ]) {
      const el = button(control)
      expect(el.getAttribute('aria-disabled'), String(control)).toBe('true')
    }
    const handoff = text('Clearance handoff')
    expect(handoff).toMatch(/may not grant a clearance of any kind/i)
    expect(handoff).toMatch(/disabled rather than absent/i)
    expect(handoff).toMatch(/outside the safety-exception path/i)
    expect(handoff).toMatch(/D10/)
  })

  it('FB-QUAL-005: the Supervisor meets the never-held handoff greyed with its named reason', () => {
    render(<WorkerLifecycleScreen />)
    selectRole('SUPERVISOR')
    expect(
      button(/^hand off: clear a never-held qualification$/i).getAttribute('aria-disabled'),
    ).toBe('true')
    expect(
      button(/^hand off: clear a second time in this area on this shift$/i).getAttribute(
        'aria-disabled',
      ),
    ).toBe('true')
    const handoff = text('Clearance handoff')
    expect(handoff).toMatch(/requires Quality Manager authorisation/i)
    expect(handoff).toMatch(/Routes to the Quality Manager/i)
    expect(handoff).toMatch(/FB-QUAL-005/)
  })

  it('routes a Supervisor’s clearance to the Quality Manager where the pair already holds one', () => {
    render(<WorkerLifecycleScreen />)
    selectRole('SUPERVISOR')
    // Assembly Hall on the early Shift already holds two clearances, granted
    // for two different people — so a further one there is a SECOND.
    expect(
      button(/^hand off: clear an expired certification$/i).getAttribute('aria-disabled'),
    ).toBe('true')
    expect(text('Clearance handoff')).toMatch(/regardless of which worker/i)

    // A pair holding none: the same control, the same role, now live. The only
    // thing that changed is the (Area, Shift) key.
    setSelect(/area for this handoff/i, 'AREA-ARD-PAINT')
    expect(
      button(/^hand off: clear an expired certification$/i).getAttribute('aria-disabled'),
    ).toBeNull()
    expect(text('Clearance handoff')).toMatch(/holds no clearance yet/i)
  })

  it('records that a handoff was taken and states plainly that nothing was granted', () => {
    render(<WorkerLifecycleScreen />)
    selectRole('QUALITY_MANAGER')
    expect(text('Clearance handoff')).not.toMatch(/Handoffs taken in this storyboard run/i)
    click(/^hand off: clear an expired certification$/i)
    const handoff = text('Clearance handoff')
    expect(handoff).toMatch(/Handoffs taken in this storyboard run/i)
    expect(handoff).toMatch(/routed and recorded, granting nothing/i)
    expect(text('Last recorded action')).toMatch(/NOTHING WAS GRANTED/i)
    // And no clearance appeared in the register: the Hub grants nothing.
    const register = text('Clearance register')
    for (const clearance of DOH_CLEARANCES) expect(register).toContain(clearance.id)
    expect((register.match(/CLR-/g) ?? []).length).toBe(DOH_CLEARANCES.length)
  })

  it('draws the three handoffs for nobody who is not on the safety-exception path', () => {
    render(<WorkerLifecycleScreen />)
    selectRole('READONLY_AUDITOR')
    for (const control of [
      /^hand off: clear an expired certification$/i,
      /^hand off: clear a never-held qualification$/i,
      /^hand off: clear a second time in this area on this shift$/i,
    ]) {
      expect(screen.queryByRole('button', { name: control }), String(control)).toBeNull()
    }
  })
})

/* ------------------------------------------------------------------ *
 * The escalation key.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the escalation keys on (Area, Shift)', () => {
  it('renders the key as a pair of configuration objects and never as a person', () => {
    render(<WorkerLifecycleScreen />)
    const escalation = text('Escalation resolution')
    expect(escalation).toMatch(/Escalation key: \(Area, Shift\)/)
    expect(escalation).toMatch(/2 minutes/)
    expect(escalation).toMatch(/holds no roster of named individuals/i)
  })

  it('resolves on shift where the target role is present and marks a fallback where it is not', () => {
    render(<WorkerLifecycleScreen />)
    expect(text('Escalation resolution')).toMatch(/resolved on shift/i)
    setSelect(/area for this handoff/i, 'AREA-ARD-PAINT')
    const escalation = text('Escalation resolution')
    expect(escalation).toMatch(/fallback, and marked as one/i)
    expect(escalation).toMatch(/may have no holder/i)
  })
})

/* ------------------------------------------------------------------ *
 * The tenant state gate, applied BEFORE any write control renders —
 * and D16, which is the one refusal the client has to read.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the tenant state gate and D16', () => {
  it('closes record writes in every suspension state and opens them in active', () => {
    const RECORD_WRITES = [
      /^create a worker record$/i,
      /^enter a qualification$/i,
      /^import workers from the canonical template$/i,
      /^save the qualification gate settings$/i,
    ] as const
    render(<WorkerLifecycleScreen />)
    setInput(/^name$/i, 'Gate probe')
    fireEvent.click(screen.getByLabelText(/scope to Assembly Hall/i))
    for (const control of RECORD_WRITES) {
      expect(button(control).getAttribute('aria-disabled'), String(control)).toBeNull()
    }
    for (const state of ['soft-suspended', 'hard-suspended', 'compliance-suspended', 'archived']) {
      setSelect(/^tenant state$/i, state)
      for (const control of RECORD_WRITES) {
        expect(button(control).getAttribute('aria-disabled'), `${state} ${String(control)}`).toBe(
          'true',
        )
      }
      expect(document.body.textContent ?? '', state).toContain(state)
    }
  })

  it('D16: recertification stays OPEN in soft suspension and closes in hard, with the consequence', () => {
    render(<WorkerLifecycleScreen />)
    pickWorker(MAYA)
    setInput(/^new expiry$/i, '2027-08-14')
    expect(button(/^record a recertification$/i).getAttribute('aria-disabled')).toBeNull()

    // Soft suspension deliberately keeps it open — the half a stricter reading
    // would silently break.
    setSelect(/^tenant state$/i, 'soft-suspended')
    pickWorker(MAYA)
    setInput(/^new expiry$/i, '2027-08-14')
    expect(button(/^record a recertification$/i).getAttribute('aria-disabled')).toBeNull()

    // Hard suspension closes it, and the reason carries the consequence.
    setSelect(/^tenant state$/i, 'hard-suspended')
    pickWorker(MAYA)
    setInput(/^new expiry$/i, '2027-08-14')
    expect(button(/^record a recertification$/i).getAttribute('aria-disabled')).toBe('true')
    const record = text('Worker record')
    expect(record).toMatch(/D16/)
    expect(record).toMatch(/no renewal path at all/i)
    expect(record).toMatch(/strand a line/i)
  })
})

/* ------------------------------------------------------------------ *
 * D7 — a lost connection, three ways, and never a queue.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — a lost connection (D7)', () => {
  it.each(['STATE-08', 'STATE-12', 'STATE-13'])(
    '%s disables every write control with a named reason and queues nothing',
    (stateId) => {
      render(<WorkerLifecycleScreen />)
      pickWorker(MAYA)
      setSelect(/^screen state$/i, stateId)
      for (const control of WRITE_CONTROLS) {
        expect(button(control).getAttribute('aria-disabled'), String(control)).toBe('true')
      }
      expect(document.body.textContent ?? '').toMatch(/never queued|rather than queued/i)
    },
  )

  it('STATE-08 keeps the last loaded register with a freshness marker and an as-of time', () => {
    render(<WorkerLifecycleScreen />)
    setSelect(/^screen state$/i, 'STATE-08')
    expect(text('Worker register')).toContain(MAYA)
    expect(document.body.textContent ?? '').toMatch(/as of/i)
  })

  it('STATE-12 names what failed and whether anything was written', () => {
    render(<WorkerLifecycleScreen />)
    setSelect(/^screen state$/i, 'STATE-12')
    const contract = text('Screen state contract')
    expect(contract).toMatch(/worker register/i)
    expect(contract).toMatch(/Nothing was written/i)
  })

  it('STATE-13 refetches the tenant state before re-enabling a write', () => {
    render(<WorkerLifecycleScreen />)
    setSelect(/^screen state$/i, 'STATE-13')
    expect(text('Screen state contract')).toMatch(/refetch/i)
  })

  it('STATE-09 renders a clearance in its true command state and never as applied', () => {
    render(<WorkerLifecycleScreen />)
    setSelect(/^screen state$/i, 'STATE-09')
    const contract = text('Screen state contract')
    expect(contract).toMatch(/queued/)
    // The boundary renders the TRUE command state, and the module note beside
    // it says outright that nothing here reaches applied until the device
    // acknowledges. Drop that sentence and this reds.
    expect(contract).toMatch(/never as applied/i)
    expect(contract).toMatch(/keeps reading Expired until the device acknowledges/i)
  })
})

/* ------------------------------------------------------------------ *
 * The audit path — EVERY write, each with a setup that genuinely
 * mutates, so a handler that changes nothing cannot pass by refusing
 * quietly.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the audit path', () => {
  /**
   * Each case names the ONE mutation its write makes, in the region that shows
   * it. Nothing here is checked by presence alone: the write runs once with the
   * audit path healthy and the mutation must APPEAR, then again with the audit
   * write failing and the mutation must be ABSENT. A handler that mutated
   * nothing would fail the first half; a write not routed through the audit
   * path would fail the second.
   */
  const AUDIT_CASES = [
    {
      control: /^create a worker record$/i,
      role: 'TENANT_ADMIN',
      setUp: () => setInput(/^name$/i, 'Audit probe'),
      from: 'Worker register',
      row: null,
      mutation: 'Audit probe',
    },
    {
      control: /^enter a qualification$/i,
      role: 'TENANT_ADMIN',
      setUp: () => {
        pickWorker(MAYA)
        fireEvent.click(screen.getByLabelText(/scope to Assembly Hall/i))
      },
      from: 'Worker record',
      row: null,
      mutation: 'QUAL-NEW-',
    },
    {
      control: /^record a recertification$/i,
      role: 'TENANT_ADMIN',
      setUp: () => {
        pickWorker(MAYA)
        setInput(/^new expiry$/i, '2029-01-01')
      },
      from: 'Worker record',
      row: null,
      mutation: '2029-01-01',
    },
    {
      control: /^set the instruction-difficulty profile$/i,
      role: 'TENANT_ADMIN',
      setUp: () => {
        pickWorker(TOMAS)
        setSelect(/^instruction-difficulty profile$/i, 'expanded')
      },
      from: 'Worker register',
      row: TOMAS,
      mutation: 'expanded',
    },
    {
      control: /^reassign this worker.s runs$/i,
      role: 'TENANT_ADMIN',
      setUp: () => pickWorker(KAI),
      from: 'Worker record',
      row: null,
      mutation: 'No run is assigned',
    },
    {
      control: /^archive this worker$/i,
      role: 'TENANT_ADMIN',
      setUp: () => pickWorker(TOMAS),
      from: 'Worker record',
      row: null,
      mutation: 'record state archived',
    },
    {
      control: /^reactivate this worker$/i,
      role: 'TENANT_ADMIN',
      setUp: () => pickWorker(IDRIS),
      from: 'Worker record',
      row: null,
      mutation: 'record state reactivated',
    },
    {
      control: /^import workers from the canonical template$/i,
      role: 'TENANT_ADMIN',
      setUp: () => undefined,
      from: 'Worker register',
      row: null,
      mutation: 'Rosa Delgado',
    },
    {
      control: /^save the qualification gate settings$/i,
      role: 'TENANT_ADMIN',
      setUp: () => setInput(/add an earlier warning stage/i, '45'),
      from: 'The expiry ladder',
      row: null,
      mutation: '45, 14, 7, 1, 0',
    },
    {
      control: /^hand off: clear an expired certification$/i,
      role: 'QUALITY_MANAGER',
      setUp: () => undefined,
      from: 'Clearance handoff',
      row: null,
      mutation: 'Handoffs taken in this storyboard run',
    },
    {
      control: /^hand off: clear a never-held qualification$/i,
      role: 'QUALITY_MANAGER',
      setUp: () => undefined,
      from: 'Clearance handoff',
      row: null,
      mutation: 'Handoffs taken in this storyboard run',
    },
    {
      control: /^hand off: clear a second time in this area on this shift$/i,
      role: 'QUALITY_MANAGER',
      setUp: () => undefined,
      from: 'Clearance handoff',
      row: null,
      mutation: 'Handoffs taken in this storyboard run',
    },
  ] as const

  function whereTheMutationShows(from: string, row: string | null): string {
    if (row === null) return text(from)
    return within(region(from)).getByRole('row', { name: new RegExp(row) }).textContent ?? ''
  }

  it('covers every write control this module draws, so none is exempt from the contract', () => {
    // The list above is the list asserted elsewhere. A control added to the
    // screen and forgotten here would otherwise be silently uncovered.
    expect(AUDIT_CASES.map((c) => String(c.control)).sort()).toEqual(
      WRITE_CONTROLS.map(String).sort(),
    )
  })

  it.each(AUDIT_CASES.map((c) => [String(c.control), c] as const))(
    'routes %s through the audit path, and the action does not happen when audit fails',
    (_name, testCase) => {
      const healthy = render(<WorkerLifecycleScreen />)
      if (testCase.role !== 'TENANT_ADMIN') selectRole(testCase.role)

      // First, the same act with the audit path HEALTHY, so the failure below
      // is not merely a control that was never going to change anything. This
      // is the half that catches an audit contract demonstrated on the one
      // handler that mutated nothing.
      testCase.setUp()
      expect(
        whereTheMutationShows(testCase.from, testCase.row),
        'the mutation was already there before the write',
      ).not.toContain(testCase.mutation)
      expect(button(testCase.control).getAttribute('aria-disabled')).toBeNull()
      click(testCase.control)
      expect(
        whereTheMutationShows(testCase.from, testCase.row),
        'the healthy write changed nothing observable',
      ).toContain(testCase.mutation)
      healthy.unmount()

      // Then the same act with the audit write failing: the action did not
      // happen, and the mutation it would have made is not there.
      render(<WorkerLifecycleScreen />)
      if (testCase.role !== 'TENANT_ADMIN') selectRole(testCase.role)
      fireEvent.click(screen.getByLabelText(/simulate an audit-write failure/i))
      testCase.setUp()
      click(testCase.control)
      expect(text('Last recorded action')).toMatch(/did not happen/i)
      expect(
        whereTheMutationShows(testCase.from, testCase.row),
        'the refused write mutated something anyway',
      ).not.toContain(testCase.mutation)
    },
  )
})

/* ------------------------------------------------------------------ *
 * Prohibition renderings, applied by rule.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — what each of the five tenant roles sees', () => {
  it('draws no record write for the Quality Manager, and still shows them every record', () => {
    render(<WorkerLifecycleScreen />)
    selectRole('QUALITY_MANAGER')
    for (const control of [
      /^create a worker record$/i,
      /^enter a qualification$/i,
      /^record a recertification$/i,
      /^set the instruction-difficulty profile$/i,
      /^archive this worker$/i,
      /^import workers from the canonical template$/i,
      /^save the qualification gate settings$/i,
    ]) {
      expect(screen.queryByRole('button', { name: control }), String(control)).toBeNull()
    }
    expect(text('Worker register')).toContain(MAYA)
    // The authority split, stated where a reviewer meets it.
    expect(text('Control matrix')).toMatch(/entry authority and the exception authority/i)
  })

  it('puts the Read-only Auditor in STATE-06 with the cause named, and draws no write for them', () => {
    render(<WorkerLifecycleScreen />)
    selectRole('READONLY_AUDITOR')
    const body = document.body.textContent ?? ''
    expect(body).toMatch(/STATE-06/)
    expect(body).toMatch(/reads tenant-wide records and takes no action/i)
    for (const control of WRITE_CONTROLS) {
      expect(screen.queryByRole('button', { name: control }), String(control)).toBeNull()
    }
  })

  it('renders the Worker as not a Hub user and shows them nobody at all (D11)', () => {
    render(<WorkerLifecycleScreen />)
    selectRole('WORKER')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Unavailable/i)
    const body = document.body.textContent ?? ''
    for (const worker of DOH_WORKERS) expect(body, worker.id).not.toContain(worker.name)
    expect(body).toMatch(/certification expiry/i)
  })

  it('renders all fifteen matrix rows with an explicit status in every one of the seventy-five cells', () => {
    render(<WorkerLifecycleScreen />)
    const matrix = region('Control matrix')
    for (const row of CONTROL_MATRIX) {
      const rendered = within(matrix).getByRole('row', { name: new RegExp(row.control) })
      const rowText = rendered.textContent ?? ''
      expect(rowText.trim().length, row.id).toBeGreaterThan(0)
      for (const status of Object.values(row.status)) {
        expect(rowText, `${row.id} ${status}`).toContain(status)
      }
    }
    expect(text('Control matrix')).toMatch(/one cell in this whole matrix reads `unavailable`/i)
  })
})

/* ------------------------------------------------------------------ *
 * Support, not surveillance — the prohibition, as rendered.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — support, not surveillance', () => {
  it('carries the measurement register’s own two rows and their prohibited uses', () => {
    render(<WorkerLifecycleScreen />)
    const panel = text('Support not surveillance')
    for (const rule of MEASURE_RULES) {
      expect(panel, rule.id).toContain(rule.what)
      expect(panel, rule.id).toContain(rule.prohibitedUse)
    }
    expect(panel).toMatch(/M-A4/)
    expect(panel).toMatch(/M-A5/)
    expect(panel).toMatch(/\(Area, Shift\)/)
  })

  it('renders no per-worker measure, no rate and no working duration in any persona’s view', () => {
    // The three axes, with the denial exemption the spec's own disclosure
    // requires: a line saying there is NO per-worker cut is the disclosure.
    const PERSON_MEASURE =
      /\b(worker|operator|employee|person)[_-]?\s?(ranking|rank|score|league)\b|\b(productivity|efficiency|performance)\s?(score|rating|index)\b|\b(runs?|steps?)\s*per\s*(hour|shift|day)\b/i
    for (const roleId of ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR']) {
      const { container, unmount } = render(<WorkerLifecycleScreen />)
      selectRole(roleId)
      const offending = (container.textContent ?? '')
        .split(/(?<=[.!?])\s+/)
        .filter(
          (sentence) =>
            PERSON_MEASURE.test(sentence) &&
            !/\b(no|never|not|cannot|neither|nor|absent|prohibited|refuses|without)\b/i.test(
              sentence,
            ),
        )
      expect(offending, roleId).toEqual([])
      unmount()
    }
  })

  it('renders no column header that names a person as a measurement dimension', () => {
    render(<WorkerLifecycleScreen />)
    for (const header of screen.getAllByRole('columnheader')) {
      const label = header.textContent ?? ''
      expect(label).not.toMatch(/\b(count|total|rate|score|ranking|productivity|per hour)\b/i)
    }
  })
})

/* ------------------------------------------------------------------ *
 * The panels the per-module contract requires by name.
 * ------------------------------------------------------------------ */

describe('MOD-DOH-04 — the required panels', () => {
  it('names every absent-by-rule affordance rather than drawing an inert control for it', () => {
    render(<WorkerLifecycleScreen />)
    const absent = region('Absent by rule')
    for (const item of ABSENT_BY_RULE) {
      expect(absent.textContent ?? '', item.label).toContain(item.note)
    }
    expect(within(absent).queryAllByRole('button')).toEqual([])
  })

  it('names the states that never render here, with a reason for each', () => {
    render(<WorkerLifecycleScreen />)
    const states = text('States that never render here')
    for (const id of ['STATE-07', 'STATE-10', 'STATE-11']) expect(states, id).toContain(id)
    expect(states).toMatch(/no agent enters, edits, clears or expires a qualification/i)
  })

  it('lists what the source leaves unspecified and unresolved without inventing a control', () => {
    render(<WorkerLifecycleScreen />)
    const unspecified = text('Unspecified in source')
    for (const item of UNSPECIFIED_IN_SOURCE) expect(unspecified).toContain(item)
    const unresolved = text('Unresolved in source')
    for (const item of UNRESOLVED_IN_SOURCE) expect(unresolved).toContain(item)
  })

  /**
   * A sentence pointing at content elsewhere in the build is a CLAIM, and the
   * iterate-the-array case above cannot fail when the target is deleted. These
   * tie each pointer to the entry it names: remove the entry and this reds.
   */
  it('makes no pointer at its own panels that the panels do not answer', () => {
    render(<WorkerLifecycleScreen />)
    const unresolved = text('Unresolved in source')
    const unspecified = text('Unspecified in source')

    // The matrix panel points at the unsettled absent-versus-disabled question.
    expect(text('Control matrix')).toMatch(/recorded as unresolved below/i)
    expect(unresolved).toMatch(/UNSETTLED/)

    // The qualification-entry note points at the soft-suspension reading.
    expect(text('Worker record')).toMatch(/recorded below rather than adopted silently/i)
    expect(unspecified).toMatch(/soft suspension/i)

    // The re-validation prompt points at the missing answering control.
    pickWorker(IDRIS)
    click(/^reactivate this worker$/i)
    expect(text('Worker record')).toMatch(/recorded below rather than answered by an\s+invented control/i)
    expect(unspecified).toMatch(/re-validation prompt/i)

    // The certification-type note points at D22.
    expect(text('Worker record')).toMatch(/D22/)
    expect(unspecified).toMatch(/certification type/i)
  })

  it('renders every decision reference this screen carries where a reviewer can read it', () => {
    render(<WorkerLifecycleScreen />)
    const decisions = text('Decisions rendered on this screen')
    for (const ref of ['D7', 'D9', 'D10', 'D11', 'D16', 'D21', 'D22', 'D23', 'D26']) {
      expect(decisions, ref).toContain(ref)
    }
  })

  it('states the four record regions the storyboard fixes', () => {
    render(<WorkerLifecycleScreen />)
    const record = text('Worker record')
    for (const name of ['Identity', 'Qualifications', 'Clearances', 'Activity']) {
      expect(record, name).toContain(name)
    }
  })
})
