import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONTROL_MATRIX,
  DOH_10_CATALOGUE_SPLIT,
  DOH_10_FINDINGS,
  DOH_10_READ_ONLY_CELLS,
  DOH_10_SOURCE_ROW_COUNT,
  DOH_10_UNSCREENED_GRANTS,
  L73676_NON_DISABLEABLE_SET,
  MANDATORY_FAMILY_CATEGORIES,
  PREFERENCE_COLUMNS,
  PREFERENCE_MATRIX,
  PREFERENCE_MATRIX_SHAPE,
  PREFERENCE_SEVERITY_LABEL,
  UNSPECIFIED_IN_SOURCE,
  categoriesInGroup,
  doh10AlwaysSentNotMandatory,
  doh10CriticalConfigurableCategories,
  doh10DoubleClaimedCategories,
  doh10GroupPartition,
  doh10Row,
  doh10UnknownEnumeratedIds,
  doh10UnpartitionedRows,
  preferenceLevelFor,
  preferenceProhibitionCounts,
  preferenceRow,
} from '@/surfaces/doh/modules/doh-10/matrix'
import {
  doh10Affordance,
  doh10AffordanceKinds,
  doh10RolesReaching,
  preferenceAffordance,
  preferenceAffordanceKinds,
  togglableKeysFor,
} from '@/surfaces/doh/modules/doh-10/rendering'
import { NOTIFICATION_STATES } from '@/domain/vocabularies'
import { notificationKey, notificationsIn } from '@/registry/signals'
import { routeBySurface, routesForRole } from '@/routes/definitions'
import { TENANT_STATES, type TenantWriteState } from '@/surfaces/doh/tenant-state'
import type { TenantRoleId } from '../../app/hub/HubShell'

/* ==================================================================== *
 * THE FROZEN SOURCE. Every claim below about §19.13 and §30C.10 is
 * checked against the file, never against the brief that sent this task.
 * ==================================================================== */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const SOURCE_LINE_COUNT = 122_241

const sourceBytes = existsSync(SOURCE_PATH) ? readFileSync(SOURCE_PATH) : Buffer.alloc(0)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** 1-based, the way a citation is written. */
const L = (n: number): string => sourceLines[n - 1] ?? ''

const cells = (line: string): readonly string[] =>
  line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())

/**
 * The backticked token a permission cell opens with. Delimited by backticks
 * rather than matched by prefix, because `Allowed` is a prefix of `Allowed
 * with conditions` and a `startsWith` check is one of this build's catalogued
 * gates-that-could-not-fail.
 */
const tokenOf = (cell: string): string => /^`([^`]+)`/.exec(cell)?.[1] ?? ''

const FROM_SOURCE_TOKEN: Readonly<Record<string, string>> = {
  Allowed: 'allowed',
  'Allowed with conditions': 'allowed-with-conditions',
  'Read-only': 'read-only',
  Unavailable: 'unavailable',
  'Explicitly prohibited': 'explicitly-prohibited',
  'Not applicable': 'not-applicable',
}

const ROLES: readonly TenantRoleId[] = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
]

const WRITE_STATES: readonly TenantWriteState[] = [...TENANT_STATES, 'indeterminate']

describe('the frozen source is the source', () => {
  it('is the sha256 and the line count RESUME.md records', () => {
    expect(sourceBytes.byteLength).toBeGreaterThan(0)
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines.length).toBe(SOURCE_LINE_COUNT)
  })
})

/* ==================================================================== *
 * 1. THE TWELVE ROWS, COUNTED TO WHERE THE BODY STOPS.
 * ==================================================================== */

describe('MOD-DOH-10 control matrix — the span, counted rather than quoted', () => {
  it('opens at the header L28687 with the five tenant roles in registry order', () => {
    expect(cells(L(28687))).toEqual([
      'Action',
      'Tenant Admin',
      'Supervisor',
      'Quality Manager',
      'Read-only Auditor',
      'Worker',
    ])
  })

  it('separates at L28688 and its body stops at L28700, so twelve data rows', () => {
    expect(L(28688).replace(/\s/g, '')).toBe('|---|---|---|---|---|---|')
    for (let n = 28689; n <= 28700; n += 1) {
      expect(L(n).startsWith('| '), `L${n} should be a table row`).toBe(true)
      expect(cells(L(n))).toHaveLength(6)
    }
    // Where the body stops. Without this the count is inferred from a span.
    expect(L(28701).trim()).toBe('')
    expect(L(28702)).toContain('Happy path')
    expect(CONTROL_MATRIX).toHaveLength(DOH_10_SOURCE_ROW_COUNT)
    expect(DOH_10_SOURCE_ROW_COUNT).toBe(12)
  })

  it('transcribes every one of the sixty cells to the token the source states', () => {
    CONTROL_MATRIX.forEach((row, i) => {
      const line = L(28689 + i)
      const parsed = cells(line)
      expect(row.sourceRef, `row ${i + 1} names its own line`).toBe(`L${28689 + i}`)
      // The Action column, verbatim. A row shifted by one fails here rather
      // than silently transcribing its neighbour's cells.
      expect(parsed[0]).toBe(row.control)
      ROLES.forEach((role, c) => {
        const token = tokenOf(parsed[c + 1] ?? '')
        expect(token, `${row.id} / ${role}: L${28689 + i} cell ${c + 1}`).not.toBe('')
        expect(FROM_SOURCE_TOKEN[token], `${row.id} / ${role}`).toBe(row.status[role])
      })
    })
  })

  it('is the twelve-row tally the corrected brief states, and not the common brief’s', () => {
    const allFive = (want: string) =>
      CONTROL_MATRIX.filter((r) => ROLES.every((role) => r.status[role] === want)).map(
        (r) => r.sourceRef,
      )
    // Correction 1: TWO rows grant all five roles, not four.
    expect(allFive('allowed')).toEqual(['L28690', 'L28693'])
    // SEVEN rows refuse all five, not six — L28700's Critical re-notify
    // interval is the seventh, and it was missed on the first count here
    // because its Tenant Admin cell carries a long qualifier and reads like
    // the admin-only shape of L28689 and L28695. It is not: the token is
    // `Explicitly prohibited` in all five columns.
    expect(allFive('explicitly-prohibited')).toEqual([
      'L28691',
      'L28692',
      'L28694',
      'L28696',
      'L28697',
      'L28698',
      'L28700',
    ])
    // L28695 is one grant and four refusals, not five grants.
    const r7 = doh10Row('set-per-shift-digest-delivery-times')
    expect(r7.status.TENANT_ADMIN).toBe('allowed')
    expect(ROLES.filter((x) => r7.status[x] === 'explicitly-prohibited')).toHaveLength(4)
    // L28699 is the mixed row.
    const r11 = doh10Row('acknowledge-a-notification')
    expect(ROLES.map((x) => r11.status[x])).toEqual([
      'allowed',
      'allowed',
      'allowed',
      'read-only',
      'allowed-with-conditions',
    ])
    // L28689 is one conditional grant and four refusals.
    const r1 = doh10Row('set-notification-policy')
    expect(r1.status.TENANT_ADMIN).toBe('allowed-with-conditions')
    expect(ROLES.filter((x) => r1.status[x] === 'explicitly-prohibited')).toHaveLength(4)
    // The whole distribution, so a fifth shape cannot arrive unnoticed.
    const tally: Record<string, number> = {}
    for (const row of CONTROL_MATRIX) for (const role of ROLES) {
      tally[row.status[role]] = (tally[row.status[role]] ?? 0) + 1
    }
    // 14 + 2 + 1 + 43 = 60, which is twelve rows of five cells. The sum is
    // asserted too, so a tally that drops a cell cannot pass on four numbers
    // that happen to look plausible.
    expect(tally).toEqual({
      allowed: 14,
      'allowed-with-conditions': 2,
      'read-only': 1,
      'explicitly-prohibited': 43,
    })
    expect(Object.values(tally).reduce((a, b) => a + b, 0)).toBe(60)
  })

  it('carries no cell the source does not spell, and no blank detail', () => {
    for (const row of CONTROL_MATRIX) {
      for (const role of ROLES) {
        expect(row.detail[role].trim(), `${row.id}/${role}`).not.toBe('')
      }
      expect(row.rendering.trim()).not.toBe('')
      expect(row.effect.trim()).not.toBe('')
    }
    // No `Unavailable` anywhere on this card, which is why the reach rule's
    // second clause never fires. Measured, because the reach claim rests on it.
    expect(
      CONTROL_MATRIX.flatMap((r) => ROLES.map((x) => r.status[x])).filter(
        (s) => s === 'unavailable',
      ),
    ).toHaveLength(0)
  })
})

/* ==================================================================== *
 * 2. `Read-only` ON A WRITE — the trap and the arm that is not there.
 * ==================================================================== */

describe('the one `Read-only` cell lands on a write and draws no control', () => {
  it('occurs exactly once, and the source states it at L28699', () => {
    expect(DOH_10_READ_ONLY_CELLS).toEqual(['acknowledge-a-notification:READONLY_AUDITOR'])
    expect(tokenOf(cells(L(28699))[4] ?? '')).toBe('Read-only')
    expect(cells(L(28699))[0]).toBe('Acknowledge a notification')
  })

  it('is a write act, because every act on this card is a write', () => {
    // Read to where the body stops and check the Action column's verb. A read
    // row would open with See, View, Inspect, Search, Export or Read; none does.
    const readVerbs = /^(See|View|Inspect|Search|Export|Read|Open|Browse) /
    for (let n = 28689; n <= 28700; n += 1) {
      expect(readVerbs.test(cells(L(n))[0] ?? ''), `L${n} is a write act`).toBe(false)
    }
  })

  it('renders as absent with the permanent cause, never as read-only or disabled', () => {
    for (const state of WRITE_STATES) {
      const a = doh10Affordance(
        doh10Row('acknowledge-a-notification'),
        'READONLY_AUDITOR',
        state,
      )
      expect(a.kind).toBe('absent')
      if (a.kind !== 'absent') throw new Error('unreachable')
      expect(a.reason).toContain('AC-AUTH-003')
      expect(a.reason).toContain('AC-DOH-011-2')
    }
  })

  it('names the two acceptance criteria at the lines they actually occupy', () => {
    expect(L(10426)).toContain('`AC-AUTH-003`')
    expect(L(10426)).toContain('holds no write capability anywhere')
    expect(L(25695)).toContain('`AC-DOH-011-2`')
    expect(L(25695)).toContain('renders no write control anywhere in the Hub')
  })

  it('produces no `read-only` and no `disabled` kind anywhere over the whole walk', () => {
    const kinds = doh10AffordanceKinds(ROLES, WRITE_STATES)
    expect([...kinds].sort()).toEqual([
      'absent',
      'control',
      'cross-surface',
      'no-screen-named',
    ])
    // The positive control: the walk really did cover the whole card, so an
    // empty or single-kind result cannot pass as an absence.
    expect(kinds.size).toBe(4)
  })
})

/* ==================================================================== *
 * 3. PER-CELL POINTERS, AND THE REACH DISAGREEMENT.
 * ==================================================================== */

describe('where a cell’s act is met is a per-cell question on this card', () => {
  it('sends the Worker’s acknowledgement to the Frontline inbox and nowhere else', () => {
    const a = doh10Affordance(doh10Row('acknowledge-a-notification'), 'WORKER')
    expect(a.kind).toBe('cross-surface')
    if (a.kind !== 'cross-surface') throw new Error('unreachable')
    expect(a.performedOn).toBe(routeBySurface('SURF-FL').title)
    // The Worker DOES open SURF-FL, so a link is drawn rather than withheld.
    expect(a.linkHref).toBe(routeBySurface('SURF-FL').pathname)
    expect(L(28681)).toContain('feeds the Frontline inbox')
    expect(L(28710)).toContain('any channel writes it')
  })

  it('names no screen for the Worker’s two preference grants, and draws no link', () => {
    expect(DOH_10_UNSCREENED_GRANTS).toEqual([
      'set-own-channel-preferences:WORKER',
      'mute-a-digest-section:WORKER',
    ])
    for (const id of ['set-own-channel-preferences', 'mute-a-digest-section'] as const) {
      const a = doh10Affordance(doh10Row(id), 'WORKER')
      expect(a.kind).toBe('no-screen-named')
      if (a.kind !== 'no-screen-named') throw new Error('unreachable')
      expect(a.note).toContain('none is invented')
    }
  })

  it('reaches all five roles by the matrix rule while D11 admits four', () => {
    expect([...doh10RolesReaching()].sort()).toEqual([...ROLES].sort())
    const hub = routeBySurface('SURF-DOH')
    expect(routesForRole('WORKER').some((r) => r.id === hub.id)).toBe(false)
    for (const role of ROLES.filter((r) => r !== 'WORKER')) {
      expect(routesForRole(role).some((r) => r.id === hub.id), role).toBe(true)
    }
  })

  it('withholds every other row from the Worker at D11 rather than at the token', () => {
    const elsewhere = new Set([
      'acknowledge-a-notification',
      'set-own-channel-preferences',
      'mute-a-digest-section',
    ])
    const withheld = CONTROL_MATRIX.filter((r) => !elsewhere.has(r.id))
    expect(withheld).toHaveLength(9)
    for (const row of withheld) {
      const a = doh10Affordance(row, 'WORKER')
      expect(a.kind).toBe('absent')
      if (a.kind !== 'absent') throw new Error('unreachable')
      expect(a.reason).toContain('admits no Worker')
    }
  })
})

describe('the tenant-state gate reaches the one row the source gates', () => {
  it('closes the policy edit in every suspension state and leaves the rest', () => {
    const policy = doh10Row('set-notification-policy')
    expect(policy.writeAction).toBe('edit-configuration')
    expect(doh10Affordance(policy, 'TENANT_ADMIN', 'active').kind).toBe('control')
    for (const state of ['soft-suspended', 'hard-suspended', 'compliance-suspended', 'archived'] as const) {
      const a = doh10Affordance(policy, 'TENANT_ADMIN', state)
      expect(a.kind, state).toBe('absent')
    }
    // L26919 names this act, so the class is read rather than invented.
    expect(L(26919)).toContain('notification policy')
    expect(L(26919)).toContain('configuration edits')
    // Eleven rows carry no gate, which is a silence rather than a permission.
    expect(CONTROL_MATRIX.filter((r) => r.writeAction !== null)).toHaveLength(1)
  })

  it('keeps the two `Allowed` preference rows enabled under every tenant state', () => {
    for (const id of ['set-own-channel-preferences', 'mute-a-digest-section'] as const) {
      for (const state of WRITE_STATES) {
        expect(doh10Affordance(doh10Row(id), 'TENANT_ADMIN', state).kind, `${id}/${state}`).toBe(
          'control',
        )
      }
    }
  })
})

/* ==================================================================== *
 * 4. THE 30C.10 PREFERENCE MATRIX — the corrected span and the count.
 * ==================================================================== */

describe('the 30C.10 preference matrix — four rows, twenty cells', () => {
  it('opens at L73706, separates at L73707 and its body stops at L73711', () => {
    expect(cells(L(73706))).toEqual(['Level', ...PREFERENCE_COLUMNS])
    expect(L(73707).replace(/\s/g, '')).toBe('|---|---|---|---|---|---|')
    for (let n = 73708; n <= 73711; n += 1) expect(cells(L(n))).toHaveLength(6)
    expect(L(73712).trim()).toBe('')
    expect(PREFERENCE_MATRIX).toHaveLength(PREFERENCE_MATRIX_SHAPE.dataRows)
    expect(PREFERENCE_MATRIX_SHAPE).toEqual({ dataRows: 4, columns: 5, cells: 20 })
  })

  it('transcribes all twenty cells verbatim, including the fourth row', () => {
    PREFERENCE_MATRIX.forEach((row, i) => {
      const parsed = cells(L(73708 + i))
      expect(row.sourceRef).toBe(`L${73708 + i}`)
      expect(parsed[0]).toBe(row.level)
      PREFERENCE_COLUMNS.forEach((column, c) => {
        expect(row.cells[column], `${row.level} / ${column}`).toBe(parsed[c + 1])
      })
    })
  })

  it('counts eleven bare prohibitions of twenty, one bare column and two prohibited', () => {
    const counts = preferenceProhibitionCounts()
    expect(counts.bare).toBe(11)
    expect(counts.qualified).toBe(1)
    expect(counts.columnsBareThroughout).toEqual(['May disable a protected category'])
    expect(counts.columnsProhibitedThroughout).toEqual([
      'May disable a mandatory family',
      'May disable a protected category',
    ])
    // The claim the brief corrects: it was never every cell of three columns.
    expect(counts.columnsProhibitedThroughout).not.toHaveLength(3)
  })

  it('maps five roles onto the two rows that are levels a person occupies', () => {
    expect(preferenceLevelFor('TENANT_ADMIN')).toBe('Tenant Admin policy')
    for (const role of ROLES.filter((r) => r !== 'TENANT_ADMIN')) {
      expect(preferenceLevelFor(role), role).toBe('Individual user')
    }
    expect(PREFERENCE_MATRIX.filter((r) => r.isAParty)).toHaveLength(3)
    expect(PREFERENCE_MATRIX.filter((r) => !r.isAParty).map((r) => r.level)).toEqual([
      'Digest sections',
    ])
  })
})

describe('the two corrections the task brief makes to the common brief', () => {
  it('puts SB-PREF-01 at L73702, and L73684 is workflow step 5', () => {
    expect(L(73702)).toContain('`SB-PREF-01`')
    expect(L(73702)).toContain('renders three groups: Always sent, locked')
    expect(L(73702)).toContain(
      'Every locked control states its reason inline rather than showing a disabled control with no explanation.',
    )
    expect(L(73684)).not.toContain('SB-PREF-01')
    expect(L(73684).trim().startsWith('5.')).toBe(true)
    expect(L(73684)).toContain('because the control does not exist')
  })

  it('puts AC-30C-1003 at L73719', () => {
    expect(L(73719)).toContain('`AC-30C-1003`')
    expect(L(73719)).toContain('No path silently disables')
    expect(L(73719)).toContain('`DEC-NOTIFPREF-001`')
    expect(L(73720)).toContain('`AC-30C-1004`')
  })
})

/* ==================================================================== *
 * 5. THE THREE GROUPS, AND THE KEY SPACE THEY ARE ENUMERATED IN.
 * ==================================================================== */

describe('the three groups SB-PREF-01 draws, measured over the register', () => {
  it('reads the section in Chapter 30C.2’s key space, which the section proves itself', () => {
    // The register-collision proof: L73704 names NOTIF-059 by a name only
    // Ch30C.2 carries, and Ch27.7 stops at NOTIF-025 so has no such row.
    expect(L(73704)).toContain('`NOTIF-059`')
    expect(L(73704)).toContain('containment-checklist-incomplete')
    expect(L(73043)).toContain('Containment checklist incomplete at sync')
    expect(notificationsIn('ch-27.7-catalog')).toHaveLength(25)
    expect(notificationsIn('ch-30c.2-categories')).toHaveLength(87)
    expect(
      notificationsIn('ch-27.7-catalog').some((r) => r.id === 'NOTIF-059'),
    ).toBe(false)
    // Every key this module builds is register-qualified and branded.
    for (const category of categoriesInGroup('always-sent')) {
      expect(category.key).toBe(notificationKey('ch-30c.2-categories', category.id))
    }
  })

  it('transcribes L73676’s thirty-eight identifiers and finds every one in the register', () => {
    expect(new Set(L73676_NON_DISABLEABLE_SET).size).toBe(38)
    expect(doh10UnknownEnumeratedIds()).toEqual([])
    const spelled = [...L(73676).matchAll(/`(NOTIF-\d{3})`/g)].map((m) => m[1])
    // The source spells four ranges and seven singletons: seventeen tokens
    // for thirty-eight identifiers. Both numbers, so neither can be inferred.
    expect(spelled).toHaveLength(17)
    for (const token of spelled) expect(L73676_NON_DISABLEABLE_SET).toContain(token)
    expect(L(73676)).toContain('Every other category remains configurable')
  })

  it('names the four identifiers L73676’s own opening clause excludes', () => {
    expect(L(73676)).toContain('Beyond the three mandatory families')
    expect(doh10DoubleClaimedCategories()).toEqual([
      'NOTIF-020',
      'NOTIF-021',
      'NOTIF-022',
      'NOTIF-023',
    ])
    // They are the qualification-expiry schedule, one of L51603's three.
    expect(L(72984)).toContain('Qualification expiry warning at 14 days')
    expect(L(72987)).toContain('Qualification expiry at 0 days')
    expect(L(51603)).toContain('qualification expiry on the 14, 7, 1, 0 day schedule')
    // The flowchart's gate order is what settles which group draws them.
    expect(L(73690)).toContain('Category in the three mandatory families?')
    expect(L(73692)).toContain('Category in the non disableable set?')
    for (const id of doh10DoubleClaimedCategories()) {
      expect(categoriesInGroup('always-sent').map((c) => c.id)).toContain(id)
      expect(categoriesInGroup('protected').map((c) => c.id)).not.toContain(id)
    }
  })

  it('partitions all eighty-seven into twelve, thirty-four and forty-one', () => {
    expect(doh10GroupPartition()).toEqual({
      alwaysSent: 12,
      protectedGroup: 34,
      configurable: 41,
      total: 87,
    })
    expect(12 + 34 + 41).toBe(87)
    // Every category is in exactly one group, over the register itself.
    const seen = new Set<string>()
    for (const group of ['always-sent', 'protected', 'configurable'] as const) {
      for (const c of categoriesInGroup(group)) {
        expect(seen.has(c.id), `${c.id} is in two groups`).toBe(false)
        seen.add(c.id)
      }
    }
    expect(seen.size).toBe(87)
  })

  it('finds every always-sent category mandatory in the register’s own words', () => {
    expect(doh10AlwaysSentNotMandatory()).toEqual([])
    // Non-vacuous: the group is not empty and the check reads a real column.
    expect(categoriesInGroup('always-sent')).toHaveLength(12)
    for (const c of categoriesInGroup('always-sent')) {
      expect(c.mandatory.startsWith('Yes'), `${c.id} [${c.mandatory}]`).toBe(true)
      expect(L(c.sourceLine)).toContain(`\`${c.id}\``)
    }
    // And the three families the twelve come from are the ones L51603 names.
    expect(L(51603)).toContain('subscription and tier lifecycle events')
    expect(L(51603)).toContain('the allocation ladder at 80, 100 and 125 per cent')
    expect(MANDATORY_FAMILY_CATEGORIES).toHaveLength(12)
  })
})

/* ==================================================================== *
 * 6. THE PREFERENCE FOLD — two groups never yield a control.
 * ==================================================================== */

describe('the preference fold', () => {
  it('never yields an operable toggle in the two locked groups, over every role', () => {
    const kinds = preferenceAffordanceKinds(ROLES)
    expect([...(kinds.get('always-sent') ?? [])]).toEqual(['locked'])
    expect([...(kinds.get('protected') ?? [])]).toEqual(['locked'])
    // The positive control: the configurable group DOES yield both, so an
    // empty walk cannot make the two assertions above pass vacuously.
    expect([...(kinds.get('configurable') ?? [])].sort()).toEqual(['email-toggle', 'locked'])
  })

  it('gives every locked control a non-blank label and reason, which it must', () => {
    for (const group of ['always-sent', 'protected'] as const) {
      for (const c of categoriesInGroup(group)) {
        for (const role of ROLES) {
          const a = preferenceAffordance(c, role)
          expect(a.kind).toBe('locked')
          if (a.kind !== 'locked') throw new Error('unreachable')
          expect(a.locked.label.trim()).not.toBe('')
          expect(a.locked.reason.trim()).not.toBe('')
          expect(a.locked.settingValue.trim()).not.toBe('')
          // Register-qualified, so the two registers' NOTIF-001 cannot collide.
          expect(a.locked.controlId).toBe(`ch30c2-${c.id}`)
        }
      }
    }
  })

  it('separates the two locked groups by `remains`, which is what the prop is for', () => {
    const always = preferenceAffordance(categoriesInGroup('always-sent')[0]!, 'TENANT_ADMIN')
    const prot = preferenceAffordance(categoriesInGroup('protected')[0]!, 'TENANT_ADMIN')
    if (always.kind !== 'locked' || prot.kind !== 'locked') throw new Error('unreachable')
    expect(always.locked.remains).toBeNull()
    expect(prot.locked.remains).not.toBeNull()
  })

  it('builds `remains` from the viewer’s own row of the 30C.10 matrix', () => {
    const category = categoriesInGroup('protected')[0]!
    const admin = preferenceAffordance(category, 'TENANT_ADMIN')
    const user = preferenceAffordance(category, 'SUPERVISOR')
    if (admin.kind !== 'locked' || user.kind !== 'locked') throw new Error('unreachable')
    expect(admin.locked.remains).toContain(
      preferenceRow('Tenant Admin policy').cells['May change recipient roles'],
    )
    expect(admin.locked.remains).toContain('L73709')
    expect(user.locked.remains).toContain('L73710')
    // The two differ on the recipient-role half, which is the whole reason
    // SB-PREF-01 calls the group "email frequency options only".
    expect(admin.locked.remains).not.toBe(user.locked.remains)
    expect(user.locked.remains).toContain('Recipient roles: Explicitly prohibited')
  })

  it('locks the Read-only Auditor out of the Configurable group, with both criteria named', () => {
    expect(togglableKeysFor('READONLY_AUDITOR')).toEqual([])
    for (const role of ROLES.filter((r) => r !== 'READONLY_AUDITOR')) {
      expect(togglableKeysFor(role), role).toHaveLength(41)
    }
    const a = preferenceAffordance(categoriesInGroup('configurable')[0]!, 'READONLY_AUDITOR')
    expect(a.kind).toBe('locked')
    if (a.kind !== 'locked') throw new Error('unreachable')
    expect(a.locked.reason).toContain('AC-AUTH-003')
    expect(a.locked.reason).toContain('AC-DOH-011-2')
    expect(a.locked.reason).toContain('L28690')
    expect(a.locked.remains).toBeNull()
  })

  it('renders the email condition and measures that it selects nothing today', () => {
    expect(doh10CriticalConfigurableCategories()).toEqual([])
    // Non-vacuous: Critical categories exist, and all of them are protected.
    const critical = categoriesInGroup('protected').filter(
      (c) => c.recommendedSeverity === 'Critical',
    )
    expect(critical).toHaveLength(8)
    const a = preferenceAffordance(categoriesInGroup('configurable')[0]!, 'TENANT_ADMIN')
    expect(a.kind).toBe('email-toggle')
    if (a.kind !== 'email-toggle') throw new Error('unreachable')
    expect(a.condition).toContain('not for Critical categories')
    expect(a.condition).toContain(PREFERENCE_SEVERITY_LABEL.classification)
    expect(a.condition).toContain(PREFERENCE_SEVERITY_LABEL.decision)
    expect(a.inAppNote).toContain('the control does not exist')
    // And the classification really is where the label says it is.
    expect(L(73186)).toContain('The four severity levels, the three priority levels')
    expect(L(73186)).toContain('`Recommendation — R&D`')
  })
})

/* ==================================================================== *
 * 7. THE CATALOGUE SPLIT — the C2 trap, and the banned literal.
 * ==================================================================== */

describe('the two catalogues disagree about who opens this screen', () => {
  it('reads catalogue B at L48113 as the Tenant Admin alone', () => {
    const row = cells(L(48113))
    expect(row[0]).toBe('SCR-DOH-19')
    expect(row[1]).toBe('Notification policy')
    expect(row[3]).toBe('Tenant Admin')
    expect(row[4]).toContain('MOD-DOH-10')
    expect(DOH_10_CATALOGUE_SPLIT.catalogueB.roles).toBe(row[3])
    expect(DOH_10_CATALOGUE_SPLIT.catalogueB.name).toBe(row[1])
  })

  it('reads catalogue A at L26070 as naming the preferences half and every user', () => {
    const row = cells(L(26070))
    expect(row[1]).toBe('Notification policy and preferences')
    expect(row[2]).toBe('`MOD-DOH-10`')
    expect(row[3]).toBe('Tenant Admin sets policy; each user sets preferences')
    expect(DOH_10_CATALOGUE_SPLIT.catalogueA.name).toBe(row[1])
    expect(DOH_10_CATALOGUE_SPLIT.catalogueA.roles).toBe(row[3])
    // The two catalogues run one slot apart on this module, which is why the
    // three-digit literal is banned: catalogue A's `019` is MOD-DOH-09's.
    expect(cells(L(26069))[2]).toBe('`MOD-DOH-09`')
  })

  /**
   * ENUMERATED FROM THE DIRECTORIES, not from a hand list, and the first
   * draft was a hand list of five paths — which
   * `tests/coverage/slice-04-gates.test.ts` gate 3 caught: a suite naming
   * three or more files of one module directory is enumerating the module,
   * and a hand list cannot notice a sixth file. This walk covers whatever
   * the two directories hold.
   */
  it('mints no three-digit screen literal in any file this module owns', () => {
    const walk = (dir: string): readonly string[] =>
      readdirSync(join(process.cwd(), dir))
        .filter((e) => /\.tsx?$/.test(e))
        .map((e) => `${dir}/${e}`)
    const owned = [...walk('src/surfaces/doh/modules/doh-10'), ...walk('app/hub/notifications')]
    // The walk found something to sweep. Without this the loop below passes
    // over an empty list and reads as evidence.
    expect(owned.length).toBeGreaterThanOrEqual(5)
    let namingTheScreen = 0
    for (const rel of owned) {
      const text = readFileSync(join(process.cwd(), rel), 'utf8')
      expect(/SCR-DOH-\d{3}/.test(text), `${rel} carries a banned three-digit literal`).toBe(false)
      if (/SCR-DOH-19/.test(text)) namingTheScreen += 1
    }
    // The positive control the absence sweep needs: files in this walk DO
    // name a screen id, in the two-digit form, so the sweep is not passing
    // over files that mention no screen at all.
    expect(namingTheScreen).toBeGreaterThanOrEqual(3)
  })

  it('partitions every one of the twelve rows into exactly one half', () => {
    expect(doh10UnpartitionedRows()).toEqual([])
    expect(DOH_10_CATALOGUE_SPLIT.policyRows).toHaveLength(9)
    expect(DOH_10_CATALOGUE_SPLIT.preferenceRows).toHaveLength(2)
    expect(DOH_10_CATALOGUE_SPLIT.acknowledgementRows).toHaveLength(1)
    expect(
      DOH_10_CATALOGUE_SPLIT.policyRows.length +
        DOH_10_CATALOGUE_SPLIT.preferenceRows.length +
        DOH_10_CATALOGUE_SPLIT.acknowledgementRows.length,
    ).toBe(12)
    // The two preference rows are exactly the two the source grants to all five.
    expect(DOH_10_CATALOGUE_SPLIT.preferenceRows.map((id) => doh10Row(id).sourceRef)).toEqual([
      'L28690',
      'L28693',
    ])
  })
})

/* ==================================================================== *
 * 8. THE VOCABULARY, THE FINDINGS AND THE SILENCES.
 * ==================================================================== */

describe('the module consumes the spine rather than re-declaring it', () => {
  it('reads the nineteen notification states off the shared vocabulary', () => {
    expect(NOTIFICATION_STATES).toHaveLength(19)
    const spelled = [...L(51605).matchAll(/`([a-z-]+)`/g)].map((m) => m[1])
    expect(spelled).toEqual([...NOTIFICATION_STATES])
    expect(L(51605)).toContain('The nineteen notification states')
    // Read to the end of the line: the Statement-of-Work clause after the list.
    expect(L(51605)).toContain('the first acknowledgement claims the item')
    // This card's own States field agrees and this module holds no copy.
    expect(L(28679)).toContain('no state named "sent" is treated as delivery')
  })

  it('names its own findings and silences with locators that resolve', () => {
    expect(DOH_10_FINDINGS).toHaveLength(9)
    expect(new Set(DOH_10_FINDINGS.map((f) => f.id)).size).toBe(9)
    for (const f of DOH_10_FINDINGS) {
      expect(f.what.trim()).not.toBe('')
      expect(f.why.trim()).not.toBe('')
      const ns = [...f.sourceRef.matchAll(/L(\d+)/g)].map((m) => Number(m[1]))
      expect(ns.length, `${f.id} cites no line`).toBeGreaterThan(0)
      for (const n of ns) {
        expect(n).toBeLessThanOrEqual(SOURCE_LINE_COUNT)
        expect(L(n).trim(), `${f.id} cites blank line L${n}`).not.toBe('')
      }
    }
    expect(UNSPECIFIED_IN_SOURCE).toHaveLength(4)
    for (const u of UNSPECIFIED_IN_SOURCE) {
      for (const m of u.sourceRef.matchAll(/L(\d+)/g)) {
        expect(L(Number(m[1])).trim(), `${u.id} cites blank line ${m[0]}`).not.toBe('')
      }
    }
  })
})
