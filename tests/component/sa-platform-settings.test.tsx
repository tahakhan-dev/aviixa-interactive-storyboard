import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { SA_INVARIANTS } from '@/surfaces/sa/invariants'
import { saModuleById } from '@/surfaces/sa/modules'
import { SA_APPLICABLE_STATES } from '@/surfaces/sa/screen-states'
import { PlatformSettingsScreen } from '../../app/super-admin/platform-settings/PlatformSettingsScreen'
import { SETTINGS_CATEGORIES, CROSS_CUTTING_SECTIONS, FLOOR_REGISTER_ROWS, GOVERNED_SETTINGS_COUNT, SETTING_STATES, PAUSE_STATES, LOCALE_PACK_STATES, SA07_PLATFORM_ROLES, SA07_UNSPECIFIED_IN_SOURCE, EXTENSION_LABEL, type PauseState } from '../../app/super-admin/platform-settings/fixtures'
import { UNSET_GOVERNING_VALUES } from '@/ai/failures/open-values'

const MODULE = saModuleById('MOD-SA-07')

/**
 * A GOVERNING VALUE SPELLED OUT IN WORDS.
 *
 * `AC-43-112` (L90039) forbids a code-level default that would apply silently,
 * and `TEST-43-112` (L90045) is the scan. A digit rule alone misses the word
 * form, and the word list that used to sit inline missed most of the words:
 * `one|two|three|five|ten|fifteen|thirty|sixty|ninety` — no `four` in a list
 * holding `five`, and no `six`, `eight`, `twelve`, `twenty`, `forty`, hyphenated
 * compound, or fraction phrase either. Declared here as one pattern with a probe
 * beside it, rather than a regex nobody re-reads.
 */
const NUMBER_WORD =
  '(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|' +
  'fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|' +
  'ninety|hundred|half|quarter)'
const UNIT_WORD = '(?:second|minute|hour|day|week|attempt|retry|retries|step|token|percent)'
const SPELLED_OUT_VALUE = new RegExp(
  // `forty-five minutes`, `four attempts`, `half an hour`, `a quarter of an hour`.
  `\\b${NUMBER_WORD}(?:-${NUMBER_WORD})?(?:\\s+(?:of|an|a))*\\s+${UNIT_WORD}s?\\b`,
  'i',
)

/** The twelve applicable screen states: all thirteen less frontline-only STATE-07. */

function interactiveElements(container: HTMLElement): Element[] {
  return Array.from(
    container.querySelectorAll(
      'button, a, input, select, textarea, [role=switch], [role=button], [role=tab], [tabindex]',
    ),
  )
}

describe('MOD-SA-07 Platform Settings — the shell contract', () => {
  it('renders under the console shell with band and module id as an annotation, and exactly one h1', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(MODULE.name)
    expect(screen.getByText(/MOD-SA-07 · Definition layer/)).toBeDefined()
  })

  it('carries the prototype disclosure', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/Simulated behaviour only/i)).toBeDefined()
  })

  it('annotates the screen numbers without ever keying a route or a tab on one', () => {
    const { container } = render(<PlatformSettingsScreen />)
    expect(screen.getByText(/SCR-SA-08/)).toBeDefined()
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).not.toMatch(/SCR-SA-\d+/i)
    }
    for (const tab of Array.from(container.querySelectorAll('[role=tab]'))) {
      expect(tab.getAttribute('id') ?? '').not.toMatch(/^SCR-SA-\d+$/i)
    }
  })

  it('names none of the four forbidden words anywhere in its copy, for any role in any state', () => {
    for (const role of SA07_PLATFORM_ROLES) {
      for (const state of SA_APPLICABLE_STATES) {
        const { container, unmount } = render(
          <PlatformSettingsScreen role={role.id} screenState={state.id} />,
        )
        expect(container.textContent ?? '').not.toMatch(/tamper-evident|chained|signed|verified/i)
        unmount()
      }
    }
  })

  it('resolves no link to record-level tenant content, and names the access classes instead', () => {
    const { container } = render(<PlatformSettingsScreen />)
    for (const el of Array.from(container.querySelectorAll('a[href]'))) {
      expect(el.getAttribute('href')).toMatch(/^\/super-admin\//)
    }
    expect(screen.getByText(/named access class/i)).toBeDefined()
    expect(screen.getByText(/session-request form/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — ten navigable categories, D21', () => {
  it('closes the navigable category set at exactly ten', () => {
    expect(SETTINGS_CATEGORIES).toHaveLength(10)
    render(<PlatformSettingsScreen />)
    expect(screen.getAllByRole('tab')).toHaveLength(10)
  })

  it('names each of the ten categories the source lists at L44633', () => {
    render(<PlatformSettingsScreen />)
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent ?? '')
    for (const name of [
      'Model and Inference',
      'Orchestration',
      'Governance and Safety',
      'Memory and Data',
      'Security and Access',
      'Integrations',
      'Tenancy',
      'Observability',
      'Compliance',
      'System',
    ]) {
      expect(tabs.some((t) => t.includes(name))).toBe(true)
    }
  })

  it('renders the severity catalog, locale packs, invariants-and-floor-register and emergency pause as cross-cutting sections, never as an eleventh category', () => {
    render(<PlatformSettingsScreen />)
    const tabText = screen
      .getAllByRole('tab')
      .map((t) => t.textContent ?? '')
      .join(' ')
    for (const s of CROSS_CUTTING_SECTIONS) {
      expect(tabText).not.toContain(s.name)
      expect(screen.getByRole('heading', { name: new RegExp(s.name, 'i') })).toBeDefined()
    }
  })

  it('renders Orchestration as a category the source names and never populates, rather than inventing a setting for it', () => {
    render(<PlatformSettingsScreen screenState="STATE-03" />)
    const orchestration = SETTINGS_CATEGORIES.find((c) => c.name === 'Orchestration')
    expect(orchestration?.settings).toHaveLength(0)
    expect(
      SA07_UNSPECIFIED_IN_SOURCE.some((u) => /Orchestration/i.test(u.affordance)),
    ).toBe(true)
  })
})

describe('MOD-SA-07 — the six ENFORCED invariants render locked, as status chips', () => {
  it('renders all six by name', () => {
    render(<PlatformSettingsScreen />)
    for (const inv of SA_INVARIANTS) {
      expect(screen.getByText(new RegExp(`${inv.name} — ENFORCED`, 'i'))).toBeDefined()
    }
  })

  it('draws NO control inside the invariants panel — no button, input, switch or focusable node', () => {
    render(<PlatformSettingsScreen />)
    const panel = document.getElementById('sa07-invariants-panel')
    expect(panel).not.toBeNull()
    expect(interactiveElements(panel as HTMLElement)).toHaveLength(0)
  })

  it('holds that rendering for the root account too — the root sees no off control either', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const panel = document.getElementById('sa07-invariants-panel')
    expect(interactiveElements(panel as HTMLElement)).toHaveLength(0)
  })

  it('states the invariant failure idiom — the attempt IS recorded — separately from the floor register, which rejects and does not log', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/locked-setting-attempt/i)).toBeDefined()
    expect(screen.getByText(/rejects; it does not log/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — the platform floor register, eight rows', () => {
  it('carries exactly eight rows, and names the ones the source leaves unnamed rather than inventing them', () => {
    expect(FLOOR_REGISTER_ROWS).toHaveLength(8)
    const unnamed = FLOOR_REGISTER_ROWS.filter((r) => !r.namedInSource)
    expect(unnamed.length).toBeGreaterThan(0)
    render(<PlatformSettingsScreen />)
    expect(screen.getAllByText(/Not named in the frozen source/i).length).toBeGreaterThan(0)
  })

  it('states that a looser-than-floor value is rejected at entry with the bound stated and never stored', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/rejected at entry with the bound stated/i)).toBeDefined()
  })

  it('states that tightening a bound surfaces non-conforming values rather than rewriting them', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/conformance report rather than rewriting/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — the seventeen governed settings', () => {
  it('carries the count the source closes, and says plainly the enumeration exists nowhere', () => {
    expect(GOVERNED_SETTINGS_COUNT).toBe(17)
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/seventeen governed settings/i)).toBeDefined()
    expect(screen.getByText(/enumerated nowhere in the frozen source/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — the emergency pause, D8', () => {
  it('lets the Admin propose', () => {
    render(<PlatformSettingsScreen role="ADMIN" />)
    const btn = screen.getByRole('button', { name: /Propose an emergency pause/i })
    expect(btn.getAttribute('aria-disabled')).toBeNull()
  })

  /**
   * The class badge is a rule, not a taste, so it has to hold for BOTH
   * root-held critical-class controls on the pause bar and for EVERY
   * non-root role — not just for the approval seen by the default role.
   * A sibling left as a drawn disabled button is what made the notice
   * beside it untrue.
   */
  it('renders both root-only critical-class pause controls as the class badge for every non-root role', () => {
    for (const r of SA07_PLATFORM_ROLES.filter((x) => x.id !== 'ROOT_SUPER_ADMIN')) {
      const { unmount } = render(<PlatformSettingsScreen role={r.id} />)
      for (const name of [/^Approve the pause proposal$/, /^Propose a resume$/]) {
        expect(screen.queryByRole('button', { name })).toBeNull()
      }
      expect(
        screen.getAllByText(/Critical class — root approval required/i).length,
      ).toBeGreaterThanOrEqual(2)
      unmount()
    }
  })

  /**
   * The notice beside the badge may only describe what is on screen. The
   * Admin's pause PROPOSAL is still drawn in this bar, so no copy here may
   * say the bar itself was replaced — only that the critical-class controls
   * in it were.
   */
  it('never claims the pause action bar is replaced while a control in that bar is still drawn', () => {
    render(<PlatformSettingsScreen role="ADMIN" />)
    expect(screen.getByRole('button', { name: /^Propose an emergency pause$/ })).toBeDefined()
    const notice = screen.getByText(/Approving a pause is the root’s act alone/i)
    expect(notice.textContent ?? '').not.toMatch(/action bar above is replaced/i)
    expect(notice.textContent ?? '').toMatch(/resume proposal/i)
  })

  it('lets the root approve', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const btn = screen.getByRole('button', { name: /Approve the pause proposal/i })
    expect(btn.getAttribute('aria-disabled')).toBeNull()
  })

  it("renders the Platform Engineer's control disabled with the named reason from DEC-PAUSE-001", () => {
    render(<PlatformSettingsScreen role="PLATFORM_ENGINEER" />)
    const btn = screen.getByRole('button', { name: /Propose an emergency pause/i })
    expect(btn.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByText(/proposal only — pending DEC-PAUSE-001/i)).toBeDefined()
  })

  /**
   * §3: ABSENT is for an action that exists for NO ONE. The pause proposal
   * exists — the Admin holds it — so Support gets DISABLED WITH A NAMED
   * REASON, and the reason has to actually be on screen. The earlier name
   * of this test claimed the ABSENT rendering while its assertion required
   * a drawn control, so it locked in the opposite of what it said.
   */
  it('draws Support’s pause proposal inert with the reason named, never absent', () => {
    render(<PlatformSettingsScreen role="SUPPORT" />)
    const btn = screen.getByRole('button', { name: /Propose an emergency pause/i })
    expect(btn.getAttribute('aria-disabled')).toBe('true')
    const reasonId = btn.getAttribute('aria-describedby')
    expect(reasonId).not.toBeNull()
    expect(document.getElementById(reasonId as string)?.textContent ?? '').toMatch(
      /Support holds no configuration change on this console and cannot propose a pause \(L42715\)/i,
    )
  })

  it('keeps resume a separate act with its own approval, never a reversal control on the pause', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    expect(screen.getByRole('button', { name: /Propose a resume/i })).toBeDefined()
    expect(screen.getAllByText(/Pause and resume in one action/i).length).toBeGreaterThan(0)
  })

  it('renders "Pause the deterministic layer" as ABSENT — a note, never a drawn control', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    expect(screen.getAllByText(/Pause the deterministic layer/i).length).toBeGreaterThan(0)
    for (const el of interactiveElements(document.body)) {
      expect(el.textContent ?? '').not.toMatch(/Pause the deterministic layer/i)
    }
  })

  it('does not build the runaway-loop kill switch, and says the source warns against conflating it with the pause', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    expect(screen.getByText(/runaway-loop kill switch/i)).toBeDefined()
    for (const el of interactiveElements(document.body)) {
      expect(el.textContent ?? '').not.toMatch(/kill switch/i)
    }
  })

  // THE LENGTH PIN IS GONE, AND IT WAS REMOVED RATHER THAN RENUMBERED.
  // `expect(PAUSE_STATES).toHaveLength(5)` stood here. A length is green over a
  // RENAMED member, green over a member swapped for a duplicate, and it goes
  // stale the moment the vocabulary grows \u2014 at which point the fix looks like
  // changing five to six, which reships the identical defect with a fresh
  // number. The count was never the claim a reader could act on; the
  // MEMBERSHIP is.
  //
  // WHY IT IS DECLARED HERE AND TYPED. The literal list lives outside the
  // module it polices, so it cannot agree with the module by construction, and
  // it is typed to the state union so a DELETION fails twice: red at run time
  // on the comparison below, and a `tsc` error on this very line naming the
  // member that no longer exists. An ADDITION fails once, here, which is the
  // direction a membership gate must be proved in.
  const EXPECTED_PAUSE_STATES: readonly PauseState[] = [
    'AgentsRunning',
    'PauseRequested',
    'Checkpointing',
    'Paused',
    'ResumeRequested',
  ]

  it('carries the pause states as a named vocabulary, by membership and in order', () => {
    expect(PAUSE_STATES).toEqual(EXPECTED_PAUSE_STATES)
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(PAUSE_STATES.join(' \u2192 '), { exact: false })).toBeDefined()
  })

  it('states the pause has no effect on on-device gates, specification checks or the Severity 1 hold', () => {
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/no effect on on-device gates/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — STATE-11, artificial intelligence unavailable (AC-SA-000-09)', () => {
  it('keeps the module operable and the emergency pause exercisable with every model unavailable', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" screenState="STATE-11" />)
    expect(screen.getAllByRole('tab')).toHaveLength(10)
    const approve = screen.getByRole('button', { name: /Approve the pause proposal/i })
    expect(approve.getAttribute('aria-disabled')).toBeNull()
  })

  it('keeps the Admin proposal exercisable too', () => {
    render(<PlatformSettingsScreen role="ADMIN" screenState="STATE-11" />)
    const propose = screen.getByRole('button', { name: /Propose an emergency pause/i })
    expect(propose.getAttribute('aria-disabled')).toBeNull()
  })
})

describe('MOD-SA-07 — the twelve applicable screen states', () => {
  it('renders every applicable state, and never STATE-07', () => {
    expect(SA_APPLICABLE_STATES).toHaveLength(12)
    for (const state of SA_APPLICABLE_STATES) {
      const { container, unmount } = render(<PlatformSettingsScreen screenState={state.id} />)
      expect(
        within(container).getAllByText(new RegExp(`${state.id} — ${state.name}`)).length,
      ).toBeGreaterThan(0)
      unmount()
    }
  })
})

describe('MOD-SA-07 — the states that are not decoration', () => {
  it('STATE-04 states the rule that was broken, the permitted range, and that nothing was stored', () => {
    render(<PlatformSettingsScreen screenState="STATE-04" />)
    const alert = screen.getByRole('alert')
    expect(alert.textContent ?? '').toMatch(/permitted range is up to and including 72 hours/i)
    expect(alert.textContent ?? '').toMatch(/existing value is unchanged/i)
  })

  it('STATE-09 renders an accepted change in its own state, never as applied', () => {
    render(<PlatformSettingsScreen screenState="STATE-09" />)
    expect(screen.getByText(/pending, not applied/i)).toBeDefined()
  })

  it('STATE-10 keeps every deterministic panel working', () => {
    render(<PlatformSettingsScreen screenState="STATE-10" />)
    expect(screen.getByText(/none of them consults a model/i)).toBeDefined()
    expect(screen.getAllByRole('tab')).toHaveLength(10)
  })

  it('STATE-13 never shows a recovering system as recovered', () => {
    render(<PlatformSettingsScreen screenState="STATE-13" />)
    expect(screen.getByText(/nothing on this screen is presented as recovered/i)).toBeDefined()
  })
})

/**
 * Every control on this screen that submits something. STATE-06 (read-only)
 * and STATE-12 (failure) must reach all of them: a control that reads only
 * the role and never the screen state drew a LIVE approval button on a
 * screen whose own copy said nothing may be submitted from it.
 */
const SUBMITTING_CONTROLS = [
  /^Propose an emergency pause$/,
  /^Approve the pause proposal$/,
  /^Propose a resume$/,
  /^Approve the catalog change$/,
  /^Approve the bound change$/,
] as const

describe('MOD-SA-07 — STATE-06 and STATE-12 reach every control, not only the role-gated ones', () => {
  for (const stateId of ['STATE-06', 'STATE-12'] as const) {
    it(`${stateId} draws the root every control it holds inert, naming the STATE as the cause`, () => {
      render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" screenState={stateId} />)
      // The root's own four. The pause PROPOSAL is the Admin's, so it is
      // refused a stage earlier and names the role — the earliest failing
      // stage wins, which is exactly what it should say.
      for (const name of [
        /^Approve the pause proposal$/,
        /^Propose a resume$/,
        /^Approve the catalog change$/,
        /^Approve the bound change$/,
      ]) {
        const btn = screen.getByRole('button', { name })
        expect(btn.getAttribute('aria-disabled')).toBe('true')
        const reasonId = btn.getAttribute('aria-describedby')
        expect(reasonId).not.toBeNull()
        expect(document.getElementById(reasonId as string)?.textContent ?? '').toMatch(
          stateId === 'STATE-06' ? /read-only in this state/i : /cannot be read in this state/i,
        )
      }
    })

    it(`${stateId} refuses the Admin's pause proposal, and clicking it advances nothing`, () => {
      render(<PlatformSettingsScreen role="ADMIN" screenState={stateId} />)
      const btn = screen.getByRole('button', { name: /^Propose an emergency pause$/ })
      expect(btn.getAttribute('aria-disabled')).toBe('true')
      fireEvent.click(btn)
      expect(screen.queryByText(/^PauseRequested$/)).toBeNull()
      expect(screen.queryByText(/A seeded fixture advanced to this state/i)).toBeNull()
    })

    it(`${stateId} leaves no submittable control live for any of the four roles`, () => {
      for (const role of SA07_PLATFORM_ROLES) {
        const { unmount } = render(
          <PlatformSettingsScreen role={role.id} screenState={stateId} />,
        )
        for (const name of SUBMITTING_CONTROLS) {
          const btn = screen.queryByRole('button', { name })
          expect(btn === null || btn.getAttribute('aria-disabled') === 'true').toBe(true)
        }
        unmount()
      }
    })
  }

  it('STATE-06 states the read-only cause without exempting the emergency pause from it', () => {
    render(<PlatformSettingsScreen role="ADMIN" screenState="STATE-06" />)
    const banner = screen.getByText(/puts the settings surface into a read-only state/i)
    expect(banner.textContent ?? '').not.toMatch(/pause below is unaffected/i)
    expect(banner.textContent ?? '').toMatch(/emergency pause/i)
  })

  it('STATE-03 keeps the same controls live, so the two states above are not vacuously disabled', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" screenState="STATE-03" />)
    for (const name of [
      /^Approve the pause proposal$/,
      /^Propose a resume$/,
      /^Approve the catalog change$/,
      /^Approve the bound change$/,
    ]) {
      expect(screen.getByRole('button', { name }).getAttribute('aria-disabled')).toBeNull()
    }
  })
})

describe('MOD-SA-07 — aggregates never render as zero or blank (AC-SA-01-03)', () => {
  it('renders an as-of timestamp in the success state', () => {
    render(<PlatformSettingsScreen screenState="STATE-03" />)
    expect(screen.getByText(/As of /i)).toBeDefined()
  })

  it('degrades to stale-with-age under STATE-08', () => {
    render(<PlatformSettingsScreen screenState="STATE-08" />)
    expect(screen.getByText(/Stale —/i)).toBeDefined()
  })

  it('degrades to unavailable under STATE-12, never to a zero', () => {
    const { container } = render(<PlatformSettingsScreen screenState="STATE-12" />)
    const panel = container.querySelector('#sa07-posture-panel')
    expect(panel).not.toBeNull()
    expect((panel as HTMLElement).textContent ?? '').toMatch(/Unavailable/i)
    expect((panel as HTMLElement).textContent ?? '').not.toMatch(/\b0\b/)
  })
})

describe('MOD-SA-07 — per-control allowed roles through evaluateAccess', () => {
  it('grants all four platform roles read of the categories', () => {
    for (const role of SA07_PLATFORM_ROLES) {
      const { unmount } = render(<PlatformSettingsScreen role={role.id} />)
      expect(screen.getAllByRole('tab')).toHaveLength(10)
      unmount()
    }
  })

  it('renders the Compliance category read-only for the Platform Engineer with the reason named', () => {
    render(<PlatformSettingsScreen role="PLATFORM_ENGINEER" category="compliance" />)
    expect(screen.getAllByText(/commercial rather than engineering/i).length).toBeGreaterThan(0)
  })

  it('offers "Request a new integration" only to the Platform Engineer, and only as a scope decision', () => {
    render(<PlatformSettingsScreen role="PLATFORM_ENGINEER" category="integrations" />)
    const btn = screen.getByRole('button', { name: /Request a new integration/i })
    expect(btn.getAttribute('aria-disabled')).toBeNull()
    expect(screen.getByText(/not a configuration form/i)).toBeDefined()
  })

  it('draws no outbound-destination control and no free-text endpoint field anywhere in Integrations', () => {
    const { container } = render(
      <PlatformSettingsScreen role="ROOT_SUPER_ADMIN" category="integrations" />,
    )
    expect(container.querySelectorAll('input[type=text], textarea')).toHaveLength(0)
    expect(screen.getByText(/no free-text endpoint field/i)).toBeDefined()
  })

  it('offers Deprecate and Restore on the platform-seeded taxonomy to the Admin, and refuses Support', () => {
    const { unmount } = render(<PlatformSettingsScreen role="ADMIN" category="tenancy" />)
    expect(screen.getByRole('button', { name: /^Deprecate$/i }).getAttribute('aria-disabled')).toBeNull()
    expect(screen.getByRole('button', { name: /^Restore$/i }).getAttribute('aria-disabled')).toBeNull()
    unmount()
    render(<PlatformSettingsScreen role="SUPPORT" category="tenancy" />)
    expect(screen.getByRole('button', { name: /^Deprecate$/i }).getAttribute('aria-disabled')).toBe('true')
  })

  it('renders the per-tenant region control as ABSENT in Memory and Data', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" category="memory-and-data" />)
    expect(screen.getByText(/per-tenant region control/i)).toBeDefined()
    for (const el of interactiveElements(document.body)) {
      expect(el.textContent ?? '').not.toMatch(/region/i)
    }
  })
})

describe('MOD-SA-07 — settings changes as approvable objects', () => {
  it('carries the ten OBJ-SA-SETTING states, with refused terminal for an invariant', () => {
    expect(SETTING_STATES).toHaveLength(10)
    expect(SETTING_STATES).toContain('refused')
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/never by the operator’s role|never by the operator's role/i)).toBeDefined()
  })

  it('carries the six locale-pack states and the failed-publication rule', () => {
    expect(LOCALE_PACK_STATES).toHaveLength(6)
    render(<PlatformSettingsScreen />)
    expect(screen.getByText(/fails publication and names the keys/i)).toBeDefined()
  })
})

describe('MOD-SA-07 — D22, contract and extension are distinguishable on screen', () => {
  it('labels the scheduled-work and feature-control material as a User-Mandated Product Extension in its own section', () => {
    expect(EXTENSION_LABEL).toMatch(/User-Mandated Product Extension/)
    render(<PlatformSettingsScreen />)
    const section = document.getElementById('sa07-extension')
    expect(section).not.toBeNull()
    expect((section as HTMLElement).textContent ?? '').toMatch(/User-Mandated Product Extension/)
    expect((section as HTMLElement).textContent ?? '').toMatch(/not SoW Fact/i)
  })

  it('keeps the extension material out of the ten contract categories', () => {
    render(<PlatformSettingsScreen />)
    const tabText = screen
      .getAllByRole('tab')
      .map((t) => t.textContent ?? '')
      .join(' ')
    expect(tabText).not.toMatch(/scheduled work/i)
    expect(tabText).not.toMatch(/feature control/i)
  })
})

describe('MOD-SA-07 — no metric below tenant-month, no rate, no per-worker series', () => {
  it('renders no per-worker or rate wording anywhere', () => {
    const { container } = render(<PlatformSettingsScreen />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/per worker|per-worker|worker ranking|workers? per /i)
  })
})

describe('MOD-SA-07 — unspecified in source', () => {
  it('names each missing affordance rather than inventing one', () => {
    render(<PlatformSettingsScreen />)
    const panel = document.getElementById('sa07-unspecified')
    expect(panel).not.toBeNull()
    for (const u of SA07_UNSPECIFIED_IN_SOURCE) {
      expect((panel as HTMLElement).textContent ?? '').toContain(u.affordance)
    }
  })
})

describe('MOD-SA-07 — SB-43-102, the open-values panel inside platform settings', () => {
  // L90030: "Inside platform settings, the Model and Inference and Orchestration
  // categories render each unset value with an explicit 'Not yet set — client
  // decision `DEC-*`' state rather than a silent default, and the platform
  // refuses to enable a capability whose governing value is unset."
  //
  // WHAT THESE CASES CATCH: a value seeded with a default (AC-43-112, the
  // defect the whole register exists to prevent), a value rendered without its
  // decision identifier (AC-43-113), and an enablement control offered while a
  // governing value is unset (AC-43-111).

  it('renders every value of the open register, in the register\'s own order', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const panel = document.getElementById('sa07-open-values')
    expect(panel).not.toBeNull()
    const text = (panel as HTMLElement).textContent ?? ''
    let cursor = -1
    for (const value of UNSET_GOVERNING_VALUES) {
      const at = text.indexOf(value.valueOwed)
      expect(at, value.id).toBeGreaterThan(-1)
      // Order, not merely presence: the register's own sequence is what
      // AC-43-113 asks a console to render.
      expect(at, `${value.id} out of register order`).toBeGreaterThan(cursor)
      cursor = at
    }
  })

  it('renders each value with its decision identifier and its Not-yet-set state (AC-43-113)', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const text = (document.getElementById('sa07-open-values') as HTMLElement).textContent ?? ''
    for (const value of UNSET_GOVERNING_VALUES) {
      expect(text, value.id).toContain(value.id)
      expect(text, value.id).toContain(value.state)
    }
  })

  it('carries no seeded value in any spelling (AC-43-112, TEST-43-112)', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const text = (document.getElementById('sa07-open-values') as HTMLElement).textContent ?? ''
    // The register's own identifiers and the acceptance-criteria references are
    // the source's numbers; anything else numeric here is a default this build
    // wrote, which is exactly what the register exists to refuse.
    const scrubbed = text
      .replaceAll(/DEC-[A-Z0-9]+-\d+/g, '')
      .replaceAll(/\b(?:AC|TEST|SB)-[\d-]+/g, '')
      .replaceAll(/§[\d.]+/g, '')
      .replaceAll(/\bL\d{4,6}/g, '')
    expect(scrubbed, 'a seeded governing value').not.toMatch(/\d/)
    expect(scrubbed, 'a spelled-out governing value').not.toMatch(SPELLED_OUT_VALUE)
  })

  it('would catch a spelled-out default the old word list let through', () => {
    // THE LIST WAS INCOMPLETE AND ITS GAPS WERE NOT RANDOM. It ran
    // `one|two|three|five|ten|fifteen|thirty|sixty|ninety` — `four` missing
    // from a list that had `five`, and `six`, `eight`, `twelve`, `twenty`,
    // `forty`, `forty-five` and the fraction words missing too. Any of those
    // seeds a governing value in plain English and passed. Proved by probe
    // rather than by reading the regex, and every string below is a value this
    // register exists to refuse.
    for (const seeded of [
      'four attempts',
      'six minutes',
      'eight hours',
      'twelve retries',
      'twenty seconds',
      'forty-five minutes',
      'half an hour',
      'a quarter of an hour',
      'two steps',
      'ninety seconds',
    ]) {
      expect(seeded, `a spelled-out default the scan misses: ${seeded}`).toMatch(SPELLED_OUT_VALUE)
    }
    // And it stays quiet on prose that names no quantity.
    for (const clean of [
      'Not yet set — client decision DEC-AIRETRY-001',
      'The retry ceiling is a client decision.',
      'no minute is written here',
    ]) {
      expect(clean, `a false alarm: ${clean}`).not.toMatch(SPELLED_OUT_VALUE)
    }
  })

  it('offers no enablement control while a governing value is unset (AC-43-111)', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const panel = document.getElementById('sa07-open-values') as HTMLElement
    expect(panel.textContent ?? '').toMatch(/cannot be enabled/i)
    for (const el of Array.from(panel.querySelectorAll('button, a, input, select, [role=switch]'))) {
      const operable = el.getAttribute('aria-disabled') !== 'true' && !el.hasAttribute('disabled')
      if (!operable) continue
      expect(el.textContent ?? '', 'an operable enablement control').not.toMatch(/enable/i)
    }
  })
})

describe('MOD-SA-07 — the kill switch is no longer claimed unbuilt', () => {
  it('points at the console that now names it instead of saying it is absent from this slice', () => {
    render(<PlatformSettingsScreen role="ROOT_SUPER_ADMIN" />)
    const text = document.body.textContent ?? ''
    // The stale claim, removed. It said "Not built in this slice, for any
    // account" and that stopped being true the moment the incident console
    // named the mechanism.
    expect(text).not.toMatch(/Not built in this slice/i)
    expect(text).toContain('DEC-KILL-001')
    // Still not a control here, and still never beside the pause as one.
    for (const el of Array.from(
      document.body.querySelectorAll('button, a, input, select, [role=switch]'),
    )) {
      expect(el.textContent ?? '').not.toMatch(/kill switch/i)
    }
  })
})
