import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  ABSENT_BY_RULE,
  ACTING_STATUSES,
  DECISIONS_ON_SCREEN,
  APPLICABLE_SCREEN_STATES,
  CONFIGURATION_EDIT,
  CONNECTION_LOSS_STATES,
  CONNECTION_STATE_LABEL,
  CONNECTION_STATE_MEANING,
  CONTROL_MATRIX,
  INAPPLICABLE_SCREEN_STATES,
  MODULE_STATE_NOTE,
  OUT_OF_SLICE_INTEGRATIONS,
  PROTOCOL_LABEL,
  READING_STATUSES,
  UNRESOLVED_IN_SOURCE,
  UNSPECIFIED_IN_SOURCE,
  matrixRow,
  rolesReachingByMatrix,
  rolesWithStatus,
  type MatrixStatus,
} from '../../app/hub/integration-surface/fixtures'
import { dohModuleById } from '@/surfaces/doh/modules'
import { dohScreenById } from '@/surfaces/doh/screens'
import { DOH_SEAMS, dohSeamById } from '@/surfaces/doh/seams'
import { TENANT_STATES, writeAllowed } from '@/surfaces/doh/tenant-state'
import {
  SEEDED_SSO_CONNECTION,
  SSO_CONNECTION_STATES,
  SSO_PROTOCOLS,
} from '@/surfaces/doh/sso-connection'
import { SCREEN_STATES } from '@/ui/screen-state'
import { rolesInDomain } from '@/domain/roles'
import { namesPersonBehaviouralMeasure } from '../coverage/person-measure-keys'
import { stripComments } from '../coverage/strip-comments'
import type { TenantRoleId } from '../../app/hub/HubShell'

const TENANT_ROLES = rolesInDomain('TENANT').map((r) => r.id) as readonly TenantRoleId[]

/**
 * The nine rows of MOD-DOH-12's own permission matrix (L29041-L29050). This
 * screen builds two of them; the other seven are in the table because a
 * matrix with its inconvenient rows removed is a matrix a reader cannot
 * check — and because one of the seven is the only row that decides who the
 * module rail offers this route to at all.
 */
describe('the nine-row control matrix', () => {
  it('carries nine rows with a distinct id and control name each', () => {
    expect(CONTROL_MATRIX).toHaveLength(9)
    expect(new Set(CONTROL_MATRIX.map((r) => r.id)).size).toBe(9)
    expect(new Set(CONTROL_MATRIX.map((r) => r.control)).size).toBe(9)
  })

  it('declares an explicit status and a non-empty detail in all forty-five cells', () => {
    for (const row of CONTROL_MATRIX) {
      const cells = Object.values(row.byRole)
      expect(cells).toHaveLength(5)
      for (const cell of cells) {
        expect(cell.status.length).toBeGreaterThan(0)
        expect(cell.detail.length).toBeGreaterThan(0)
      }
    }
  })

  it('keys every row on all five tenant roles, in the registry’s own set', () => {
    for (const row of CONTROL_MATRIX) {
      expect(Object.keys(row.byRole).sort()).toEqual([...TENANT_ROLES].sort())
    }
  })

  it('gives both of this screen’s writes to the Tenant Admin and to nobody else', () => {
    for (const id of ['configure-single-sign-on-metadata', 'provide-tenant-contact-email'] as const) {
      expect(rolesWithStatus(id, ACTING_STATUSES)).toEqual(['TENANT_ADMIN'])
    }
  })

  it('gives the tier and usage read to the Tenant Admin and the Auditor, and to nobody else', () => {
    expect(rolesWithStatus('view-tier-and-usage-read-view', READING_STATUSES)).toEqual([
      'TENANT_ADMIN',
      'READONLY_AUDITOR',
    ])
  })

  it('leaves the six rows nobody holds with no acting or reading role at all', () => {
    for (const id of [
      'manage-email-vendor-credentials',
      'supply-ai-api-key',
      'configure-outbound-webhook',
      'configure-directory-provisioning',
      'call-inbound-business-system-endpoint',
      'change-tier-cap-or-threshold',
    ] as const) {
      expect(rolesWithStatus(id, READING_STATUSES)).toEqual([])
    }
  })

  it('marks the Tenant Admin explicitly prohibited on the three all-role prohibitions', () => {
    // The most privileged tenant role sits outside these three deliberately.
    // A row that quietly gave the Tenant Admin an exception would still pass
    // the "nobody holds it" case above only if it used a prohibition token,
    // so this pins the token itself.
    for (const id of [
      'configure-outbound-webhook',
      'configure-directory-provisioning',
      'change-tier-cap-or-threshold',
    ] as const) {
      expect(matrixRow(id).byRole.TENANT_ADMIN.status).toBe('Explicitly prohibited')
    }
  })
})

/**
 * The prohibition-rendering mapping applied by rule, not by taste. A row
 * whose five cells are all one prohibition token renders ABSENT, and the
 * panel that draws those absences is derived from the matrix here rather
 * than compared against a hand-written list that could quietly fall behind.
 */
describe('every row absent for all five roles is named in the absent-by-rule panel', () => {
  it('covers each one by its own control name', () => {
    const absentForEveryone = CONTROL_MATRIX.filter((row) => {
      const statuses = new Set(Object.values(row.byRole).map((c) => c.status))
      return (
        statuses.size === 1 &&
        (statuses.has('Not applicable') || statuses.has('Explicitly prohibited'))
      )
    })
    // Six of the nine. Not vacuous: a matrix that lost one of them, or a
    // panel that dropped an entry, fails here.
    expect(absentForEveryone).toHaveLength(6)
    const labels = ABSENT_BY_RULE.map((a) => a.label)
    for (const row of absentForEveryone) {
      expect(labels, row.id).toContain(row.control)
    }
  })

  it('accounts for all nine rows: two draw a control, six are held by nobody, one is another screen’s', () => {
    // The screen says exactly this in prose above the table. A row that
    // silently changed category would leave the sentence standing and false.
    const drawsAControl = ['configure-single-sign-on-metadata', 'provide-tenant-contact-email']
    const heldByNobody = CONTROL_MATRIX.filter((row) => {
      const statuses = new Set(Object.values(row.byRole).map((c) => c.status))
      return (
        statuses.size === 1 &&
        (statuses.has('Not applicable') || statuses.has('Explicitly prohibited'))
      )
    }).map((row) => row.id)
    const elsewhere = CONTROL_MATRIX.filter(
      (row) => !drawsAControl.includes(row.id) && !heldByNobody.includes(row.id),
    ).map((row) => row.id)

    expect(drawsAControl).toHaveLength(2)
    expect(heldByNobody).toHaveLength(6)
    expect(elsewhere).toEqual(['view-tier-and-usage-read-view'])
    expect(drawsAControl.length + heldByNobody.length + elsewhere.length).toBe(CONTROL_MATRIX.length)
  })

  it('names a source token on every absent-by-rule entry, and never leaves one blank', () => {
    for (const item of ABSENT_BY_RULE) {
      expect(item.token.length).toBeGreaterThan(0)
      expect(item.note.length).toBeGreaterThan(0)
    }
  })
})

describe('acting and reading carry the contents the matrix uses (tsc guards the type)', () => {
  it('never carries a prohibition token', () => {
    const prohibitionTokens: readonly MatrixStatus[] = [
      'Unavailable',
      'Explicitly prohibited',
      'Not applicable',
    ]
    for (const status of [...ACTING_STATUSES, ...READING_STATUSES]) {
      expect(prohibitionTokens).not.toContain(status)
    }
  })

  it('is exactly the acting pair and the reading triple the matrix actually uses', () => {
    expect([...ACTING_STATUSES].sort()).toEqual(['Allowed', 'Allowed with conditions'].sort())
    expect([...READING_STATUSES].sort()).toEqual(
      ['Allowed', 'Allowed with conditions', 'Read-only'].sort(),
    )
  })
})

/**
 * THE CROSS-CHECK. The module rail reads ONE field — `rolesReaching` on this
 * module's spine definition — while this screen renders its own permission
 * matrix. Two copies of one rule is the drift this build keeps paying for,
 * so this case asserts the two agree.
 *
 * The rule, one sentence: the roles the spine withholds the route from are
 * exactly the roles this matrix marks `Unavailable`. That token's own
 * meaning is "cannot hold this in any scope", so by the prohibition-rendering
 * rule it renders ABSENT and the rail does not offer the route. `Explicitly
 * prohibited` is deliberately NOT that token — the control exists on this
 * screen for another role, so the refused role opens the screen and reads
 * why — and the two are never merged (L10238).
 */
describe('MOD-DOH-12 — the rail and this matrix agree about who reaches the module', () => {
  it('withholds the route from exactly the roles the matrix marks Unavailable', () => {
    expect(Object.keys(CONTROL_MATRIX[0].byRole).sort()).toEqual([...TENANT_ROLES].sort())

    const withheldByTheMatrix = TENANT_ROLES.filter((role) =>
      CONTROL_MATRIX.some((row) => row.byRole[role].status === 'Unavailable'),
    )
    const withheldByTheSpine = TENANT_ROLES.filter(
      (role) => !dohModuleById('MOD-DOH-12').rolesReaching.includes(role),
    )

    expect([...withheldByTheSpine].sort()).toEqual([...withheldByTheMatrix].sort())
    // Not vacuous: this module is withheld from three of the five.
    expect(withheldByTheMatrix).toHaveLength(3)
    expect([...withheldByTheMatrix].sort()).toEqual(
      ['QUALITY_MANAGER', 'SUPERVISOR', 'WORKER'].sort(),
    )
  })

  it('opens the screen for exactly the complement of that set', () => {
    expect([...rolesReachingByMatrix()].sort()).toEqual(
      ['TENANT_ADMIN', 'READONLY_AUDITOR'].sort(),
    )
    expect([...dohModuleById('MOD-DOH-12').rolesReaching].sort()).toEqual(
      [...rolesReachingByMatrix()].sort(),
    )
  })

  it('rests the whole rail answer on one row, and names which', () => {
    // The tier and usage read view is the only row carrying `Unavailable`.
    // If a later edit moves that token to another row, the rail rule keeps
    // working but the screen's own copy stops being true — so the copy is
    // pinned to the fact rather than left as prose.
    const rowsWithUnavailable = CONTROL_MATRIX.filter((row) =>
      Object.values(row.byRole).some((c) => c.status === 'Unavailable'),
    ).map((row) => row.id)
    expect(rowsWithUnavailable).toEqual(['view-tier-and-usage-read-view'])
  })
})

describe('the screen states this module reaches', () => {
  it('names the nine that apply and the four that never do, with no overlap and no gap', () => {
    const applicable = new Set<string>(APPLICABLE_SCREEN_STATES)
    const inapplicable = new Set<string>(INAPPLICABLE_SCREEN_STATES.map((s) => s.id))
    expect(applicable.size).toBe(9)
    expect(inapplicable.size).toBe(4)
    for (const id of inapplicable) expect(applicable.has(id)).toBe(false)
    expect(applicable.size + inapplicable.size).toBe(SCREEN_STATES.length)
    for (const state of SCREEN_STATES) {
      expect(applicable.has(state.id) || inapplicable.has(state.id), state.id).toBe(true)
    }
  })

  it('excludes the four the whole surface excludes, with a reason on each', () => {
    expect(INAPPLICABLE_SCREEN_STATES.map((s) => s.id).sort()).toEqual(
      ['STATE-07', 'STATE-09', 'STATE-10', 'STATE-11'].sort(),
    )
    for (const s of INAPPLICABLE_SCREEN_STATES) expect(s.why.length).toBeGreaterThan(0)
  })

  it('carries a module-specific note for every applicable state, none of them blank', () => {
    for (const id of APPLICABLE_SCREEN_STATES) {
      expect(MODULE_STATE_NOTE[id].length, id).toBeGreaterThan(0)
    }
  })

  it('holds the connection-loss trio inside the applicable set (D7)', () => {
    expect([...CONNECTION_LOSS_STATES].sort()).toEqual(
      ['STATE-08', 'STATE-12', 'STATE-13'].sort(),
    )
    for (const id of CONNECTION_LOSS_STATES) {
      expect(APPLICABLE_SCREEN_STATES as readonly string[]).toContain(id)
    }
  })
})

describe('the write class both of this screen’s writes are gated on', () => {
  it('is the configuration-edit class the source names, and closes under every suspension', () => {
    expect(CONFIGURATION_EDIT).toBe('edit-configuration')
    // Not a restatement of the table: it pins WHICH states leave this
    // screen's two writes open. A configuration edit is open in `active`
    // alone, so a screen that offered one under soft suspension would be
    // contradicting the one gate the whole surface shares.
    const open = TENANT_STATES.filter((s) => writeAllowed(s, CONFIGURATION_EDIT))
    expect(open).toEqual(['active'])
  })
})

describe('the labels for the record’s two closed vocabularies', () => {
  it('covers every connection state exactly once, with a meaning on each', () => {
    expect(Object.keys(CONNECTION_STATE_LABEL).sort()).toEqual([...SSO_CONNECTION_STATES].sort())
    expect(Object.keys(CONNECTION_STATE_MEANING).sort()).toEqual([...SSO_CONNECTION_STATES].sort())
    for (const state of SSO_CONNECTION_STATES) {
      expect(CONNECTION_STATE_LABEL[state].length, state).toBeGreaterThan(0)
      expect(CONNECTION_STATE_MEANING[state].length, state).toBeGreaterThan(0)
    }
  })

  it('covers both protocols and names neither by its bare token', () => {
    expect(Object.keys(PROTOCOL_LABEL).sort()).toEqual([...SSO_PROTOCOLS].sort())
    for (const protocol of SSO_PROTOCOLS) {
      expect(PROTOCOL_LABEL[protocol]).not.toBe(protocol)
    }
  })
})

describe('the panels that say what the source does not', () => {
  it('names four features on the module card, one of which this slice builds', () => {
    expect(OUT_OF_SLICE_INTEGRATIONS).toHaveLength(4)
    for (const item of OUT_OF_SLICE_INTEGRATIONS) {
      expect(item.whatTheSourceSays.length).toBeGreaterThan(0)
      expect(item.whereItStands.length).toBeGreaterThan(0)
    }
  })

  it('carries an unspecified and an unresolved panel, neither of them empty', () => {
    expect(UNSPECIFIED_IN_SOURCE.length).toBeGreaterThan(0)
    expect(UNRESOLVED_IN_SOURCE.length).toBeGreaterThan(0)
    expect(new Set(UNSPECIFIED_IN_SOURCE).size).toBe(UNSPECIFIED_IN_SOURCE.length)
    expect(new Set(UNRESOLVED_IN_SOURCE).size).toBe(UNRESOLVED_IN_SOURCE.length)
  })
})

/**
 * THE POINTERS THIS SCREEN MAKES AT ITS OWN PANELS, AND AT ANOTHER MODULE'S.
 *
 * The metadata-field note says "see the unspecified panel below" — a claim
 * about the build the case above cannot notice going false, because it only
 * checks the panel is non-empty and never ties a specific sentence to a
 * specific entry: delete the entry and the panel still renders, one item
 * shorter, still non-empty, still green.
 *
 * The matrix subtitle makes a second, cross-module pointer: "the tier and
 * usage read view" is this module's only `Unavailable` row, and the screen
 * says that view "renders on another module's screen" rather than here. The
 * shared spine is the one place that can settle WHICH module — this checks
 * the claim against it rather than against this file's own say-so.
 */
describe('the pointers this screen makes at Unspecified in source and at another module', () => {
  it('resolves the metadata-field note onto a real Unspecified-in-source entry', () => {
    expect(UNSPECIFIED_IN_SOURCE.some((i) => /No metadata FIELD is enumerated/i.test(i))).toBe(
      true,
    )
  })

  it('resolves "the tier and usage read view" onto MOD-DOH-01, never onto this module', () => {
    expect(
      UNRESOLVED_IN_SOURCE.some(
        (i) => /tier and usage read view/i.test(i) && /another module.s screen/i.test(i),
      ),
    ).toBe(true)
    expect(matrixRow('view-tier-and-usage-read-view').control).toMatch(
      /tier and usage read view/i,
    )
    // The spine, not this file, decides which module SCR-DOH-03 belongs to.
    const screen = dohScreenById('SCR-DOH-03')
    expect(screen.name).toMatch(/tier and usage read view/i)
    expect(screen.moduleId).toBe('MOD-DOH-01')
    // Not vacuous: the module the claim points AWAY from is this one.
    expect(screen.moduleId).not.toBe('MOD-DOH-12')
  })
})

/**
 * The screen used to say, in its cross-slice panel, that this module's one
 * cross-slice dependency had no row in the shared seam registry — a claim
 * about the build, checked against the build rather than left as prose. The
 * registry now carries that row (`tenant-contact-email-delivery`, consumed by
 * MOD-DOH-12, owned by MOD-DOH-10), so the disclosure the earlier case pinned
 * has rotted on purpose, and the load-bearing claim flips to this: the seam
 * resolves, names its real owner, and the screen renders it through the
 * shared `SeamNotice` component rather than a hand-rolled copy of one.
 */
describe('the cross-slice dependency this screen names', () => {
  it('resolves in the shared seam registry, owned by Notifications (MOD-DOH-10) in slice 10', () => {
    const seam = dohSeamById('tenant-contact-email-delivery')
    expect(seam.consumingModule).toBe('MOD-DOH-12')
    expect(seam.ownerModule).toBe('MOD-DOH-10')
    expect(seam.ownerSlice).toBe(10)
    // Not vacuous: the registry carries more than this one row, and this
    // module's row sits alongside the others rather than replacing them.
    const consumers: readonly string[] = DOH_SEAMS.map((s) => s.consumingModule)
    expect(consumers).toContain('MOD-DOH-12')
    expect(consumers).toContain('MOD-DOH-01')
  })

  it('renders the seam through the shared SeamNotice component, not a local copy', () => {
    const src = stripComments(
      readFileSync('app/hub/integration-surface/IntegrationSurfaceScreen.tsx', 'utf8'),
    )
    expect(src).toMatch(/<SeamNotice\s+seamId="tenant-contact-email-delivery"\s*\/>/)
    // A hand-rolled copy would hardcode the notice's own heading text; the
    // shared component owns that text now, so the screen names only an id.
    expect(src).not.toMatch(/Cross-slice seam — not built here/)
  })
})

describe('the screen identity, read out of the spine rather than typed here', () => {
  it('annotates this module with the catalogue-B integration settings screen', () => {
    const screen = dohScreenById('SCR-DOH-21')
    expect(screen.moduleId).toBe('MOD-DOH-12')
    expect(screen.name).toBe('Integration settings')
  })

  it('keys the route on the module slug, never on a screen number', () => {
    expect(dohModuleById('MOD-DOH-12').slug).toBe('integration-surface')
    expect(dohModuleById('MOD-DOH-12').slug).not.toMatch(/SCR-DOH/i)
  })
})

/**
 * Support-not-surveillance, held in the fixture shape itself. This module
 * owns no operational object at all — the card says so — so the honest
 * assertion is that nothing here counts, times, ranks or compares anybody.
 * Uses the shared matcher rather than a fourth regular expression.
 */
describe('support-not-surveillance', () => {
  it('keys no fixture row on a person behavioural measure', () => {
    const keys = [
      ...CONTROL_MATRIX.flatMap((row) => [...Object.keys(row), ...Object.keys(row.byRole)]),
      ...ABSENT_BY_RULE.flatMap((a) => Object.keys(a)),
      ...OUT_OF_SLICE_INTEGRATIONS.flatMap((o) => Object.keys(o)),
      ...Object.keys(SEEDED_SSO_CONNECTION),
    ]
    expect(keys.filter((k) => namesPersonBehaviouralMeasure(k))).toEqual([])
  })

  it('names no person anywhere in the connection record it renders', () => {
    const keys = Object.keys(SEEDED_SSO_CONNECTION)
    expect(keys.filter((k) => /worker|operator|employee|person/i.test(k))).toEqual([])
  })
})

/* ------------------------------------------------------------------ *
 * The three gates that are cheapest to break and cheapest to check,
 * read off this module's own source files.
 * ------------------------------------------------------------------ */

const MY_FILES = [
  'app/hub/integration-surface/page.tsx',
  'app/hub/integration-surface/IntegrationSurfaceScreen.tsx',
  'app/hub/integration-surface/fixtures.ts',
] as const

describe('MOD-DOH-12 source files — determinism, D1 and route ownership', () => {
  // Comment-stripped, with the house tool rather than a fourth copy of it:
  // this file's own header names all three in order to forbid them, and a
  // gate that a denial trips is a gate people learn to reword around.
  it('reads no clock and no randomness anywhere in this module', () => {
    for (const file of MY_FILES) {
      const code = stripComments(readFileSync(file, 'utf8'))
      expect(code, file).not.toMatch(/Date\.now|new Date\(|Math\.random/)
    }
  })

  it('PROVEN: the determinism gate still fires on real code, not only on prose', () => {
    // Otherwise the case above would pass on a stripper that returned ''.
    expect(stripComments('const t = Date.now()')).toMatch(/Date\.now/)
    expect(stripComments('// no Date.now() is read here\nconst t = 1')).not.toMatch(/Date\.now/)
  })

  it('D1: writes no three-digit SCR-DOH literal here, and annotates the two-digit one', () => {
    for (const file of MY_FILES) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/SCR-DOH-\d{3}/)
    }
    expect(
      readFileSync('app/hub/integration-surface/IntegrationSurfaceScreen.tsx', 'utf8'),
    ).toMatch(/SCR-DOH-21/)
  })

  it('names its own module id more often than any module it cross-references, so the route walk is unambiguous', () => {
    // `scripts/build-registries.mjs` attributes a route directory to the
    // module id it mentions most often inside it, and THROWS on a tie —
    // failing the build for every module, not only this one.
    const text = MY_FILES.map((f) => readFileSync(f, 'utf8')).join('\n')
    const own = (text.match(/MOD-DOH-12/g) ?? []).length
    expect(own).toBeGreaterThan(0)
    for (const other of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '13', '14']) {
      const count = (text.match(new RegExp(`MOD-DOH-${other}`, 'g')) ?? []).length
      expect(own, `MOD-DOH-${other}`).toBeGreaterThan(count)
    }
  })

  it('names every decision this screen renders with a D-reference and a real statement', () => {
    for (const decision of DECISIONS_ON_SCREEN) {
      expect(decision.ref, decision.ref).toMatch(/^D\d+$/)
      expect(decision.statement.length, decision.ref).toBeGreaterThan(60)
    }
    const refs = DECISIONS_ON_SCREEN.map((d) => d.ref)
    // D7 (connection loss) and D11 (the Worker holds no Hub screen) bind
    // every screen on this surface; D20 is what narrows this one to a single
    // feature of a four-feature module card.
    for (const ref of ['D1', 'D7', 'D8', 'D11', 'D20']) expect(refs).toContain(ref)
  })
})
