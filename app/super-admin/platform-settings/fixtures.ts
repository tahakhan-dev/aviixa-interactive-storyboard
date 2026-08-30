import type { RoleId } from '@/domain/roles'
import type { CommandState } from '@/surfaces/sa/command-state'

/**
 * MOD-SA-07 Platform Settings — the seeded fixtures this module's screen
 * steps through. No backend and no clock: every "as of" value below is a
 * fixture string, never a computed time (spec §8, and the no-ambient-Date
 * rule).
 *
 * Every entry carries the frozen-source line it came from. Nothing here was
 * invented to fill a panel. Where the source names a thing and never defines
 * it — the Orchestration category, three of the eight floor-register rows,
 * the enumeration of the seventeen governed settings — the gap is carried as
 * data and rendered as a gap, because a plausible invented setting reads
 * back as a requirement.
 */

/* ------------------------------------------------------------------ *
 * The four platform roles. The `ROLE-PLAT-*` identifiers are the plan's
 * annotation for the same four accounts `@/domain/roles` already carries.
 * The selector is a VIEW SWITCHER, not a login (spec §8).
 * ------------------------------------------------------------------ */

export interface Sa07PlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
}

export const SA07_PLATFORM_ROLES = [
  { id: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin', roleAnnotation: 'ROLE-PLAT-ROOT' },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN' },
  { id: 'PLATFORM_ENGINEER', name: 'Platform Engineer', roleAnnotation: 'ROLE-PLAT-ENG' },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP' },
] as const satisfies readonly Sa07PlatformRole[]

/* ------------------------------------------------------------------ *
 * Closed vocabularies (extraction chunk CHK-013, L44644).
 * `as const satisfies` keeps each member literal-narrowed, so the
 * exhaustiveness checks below are real rather than vacuous.
 * ------------------------------------------------------------------ */

/** OBJ-SA-SETTING (L44644). Ten states; `refused` is terminal for an invariant. */
export type SettingState =
  | 'drafted' | 'classified' | 'submitted' | 'pending' | 'approved'
  | 'returned' | 'applied' | 'distributed' | 'reconciled' | 'refused'
export const SETTING_STATES = [
  'drafted', 'classified', 'submitted', 'pending', 'approved',
  'returned', 'applied', 'distributed', 'reconciled', 'refused',
] as const satisfies readonly SettingState[]
type MissingSettingState = Exclude<SettingState, (typeof SETTING_STATES)[number]>
const _settingStatesExhaustive: MissingSettingState extends never ? true : never = true
void _settingStatesExhaustive

/** OBJ-SA-PAUSE (L44644, L44583). */
export type PauseState =
  | 'AgentsRunning' | 'PauseRequested' | 'Checkpointing' | 'Paused' | 'ResumeRequested'
export const PAUSE_STATES = [
  'AgentsRunning', 'PauseRequested', 'Checkpointing', 'Paused', 'ResumeRequested',
] as const satisfies readonly PauseState[]
type MissingPauseState = Exclude<PauseState, (typeof PAUSE_STATES)[number]>
const _pauseStatesExhaustive: MissingPauseState extends never ? true : never = true
void _pauseStatesExhaustive

/** OBJ-SA-LOCALEPACK (L44644, L44503). */
export type LocalePackState =
  | 'Prepared' | 'Checking' | 'Failed' | 'Published' | 'Distributing' | 'InForce'
export const LOCALE_PACK_STATES = [
  'Prepared', 'Checking', 'Failed', 'Published', 'Distributing', 'InForce',
] as const satisfies readonly LocalePackState[]
type MissingLocalePackState = Exclude<LocalePackState, (typeof LOCALE_PACK_STATES)[number]>
const _localePackStatesExhaustive: MissingLocalePackState extends never ? true : never = true
void _localePackStatesExhaustive

/** OBJ-unnumbered-SEEDEDTAX (L54864) — the platform-seeded taxonomy entry. */
export type SeededTaxonomyState =
  | 'Drafted' | 'LocaleBlocked' | 'Approved' | 'Published' | 'Deprecated' | 'Restored'
export const SEEDED_TAXONOMY_STATES = [
  'Drafted', 'LocaleBlocked', 'Approved', 'Published', 'Deprecated', 'Restored',
] as const satisfies readonly SeededTaxonomyState[]
type MissingSeededTaxState = Exclude<SeededTaxonomyState, (typeof SEEDED_TAXONOMY_STATES)[number]>
const _seededTaxStatesExhaustive: MissingSeededTaxState extends never ? true : never = true
void _seededTaxStatesExhaustive

/**
 * The change class the source assigns to a settings change. AC-SA-07-15-03
 * (L44627): "Change class is determined by the setting, never by the
 * operator's role" — which is why this lives on the setting row and never on
 * the role.
 */
export type ChangeClass = 'engineering' | 'admin' | 'critical'
export const CHANGE_CLASSES = ['engineering', 'admin', 'critical'] as const satisfies readonly ChangeClass[]
type MissingChangeClass = Exclude<ChangeClass, (typeof CHANGE_CLASSES)[number]>
const _changeClassesExhaustive: MissingChangeClass extends never ? true : never = true
void _changeClassesExhaustive

export const CHANGE_CLASS_LABEL: Record<ChangeClass, string> = {
  engineering: 'Engineering class — Platform Engineer proposes, Admin approves',
  admin: 'Admin class — an Admin action, applied and audited',
  critical: 'Critical class — routes to root approval',
}

/* ------------------------------------------------------------------ *
 * The ten navigable categories (D21; L44633 names all fifteen
 * sub-groups, of which 23.7.1–23.7.10 are the navigable categories and
 * 23.7.11–23.7.15 are the cross-cutting sections below).
 * ------------------------------------------------------------------ */

export type SettingsCategoryId =
  | 'model-and-inference' | 'orchestration' | 'governance-and-safety'
  | 'memory-and-data' | 'security-and-access' | 'integrations'
  | 'tenancy' | 'observability' | 'compliance' | 'system'

export interface CategorySetting {
  readonly name: string
  /** The value the source actually states. Never a value invented to fill a row. */
  readonly value: string
  readonly changeClass: ChangeClass
  readonly sourceRef: string
}

export interface SettingsCategory {
  readonly id: SettingsCategoryId
  /** 23.7.N — an annotation, exactly like SCR-SA-NN. Never a route key. */
  readonly sectionAnnotation: string
  readonly name: string
  readonly summary: string
  /** Empty where the source names the category and defines nothing inside it. */
  readonly settings: readonly CategorySetting[]
}

export const SETTINGS_CATEGORIES = [
  {
    id: 'model-and-inference',
    sectionAnnotation: '23.7.1',
    name: 'Model and Inference',
    summary:
      'Which model fills each router role, and what happens when one is unavailable. Nothing here can move a capability past the evaluation gate.',
    settings: [
      {
        name: 'Model router roles',
        value: 'Four roles — primary, fallback, lightweight, embedding',
        changeClass: 'engineering',
        sourceRef: 'L44051',
      },
    ],
  },
  {
    id: 'orchestration',
    sectionAnnotation: '23.7.2',
    name: 'Orchestration',
    summary:
      'The frozen source lists this category by name at L44633 and defines no setting, no acceptance criterion and no control inside it. Nothing is drawn here, and nothing was invented to fill it.',
    settings: [],
  },
  {
    id: 'governance-and-safety',
    sectionAnnotation: '23.7.3',
    name: 'Governance and Safety',
    summary:
      'The gate-escalation defaults. A gate that is not answered escalates rather than lapsing.',
    settings: [
      {
        name: 'Gate-escalation timeout',
        value: '10 minutes for Severity 1, 30 minutes otherwise',
        changeClass: 'engineering',
        sourceRef: 'L44139',
      },
    ],
  },
  {
    id: 'memory-and-data',
    sectionAnnotation: '23.7.4',
    name: 'Memory and Data',
    summary:
      'Retention posture and data residency. Residency is a stated posture, not a per-tenant control.',
    settings: [
      {
        name: 'Per-tenant retention horizon',
        value: 'Default 15 years',
        changeClass: 'critical',
        sourceRef: 'L44187, retention-value changes are critical class L55942',
      },
    ],
  },
  {
    id: 'security-and-access',
    sectionAnnotation: '23.7.5',
    name: 'Security and Access',
    summary:
      'How a console account proves who it is, and what the compliance-emergency path costs in authorisations.',
    settings: [
      {
        name: 'Console sign-in path',
        value:
          'Single sign-on with multi-factor. No password-only sign-in path exists for any console account.',
        changeClass: 'critical',
        sourceRef: 'AC-SA-07-05-01, L44236',
      },
      {
        name: 'Compliance-emergency dual control',
        value:
          'Two authorisations — the root and one Admin. This cannot be reduced to one.',
        changeClass: 'critical',
        sourceRef: 'AC-SA-07-05-03, L44236',
      },
      {
        name: 'Compliance-emergency time box',
        value: 'Not yet set — DEC-SEC-017',
        changeClass: 'critical',
        sourceRef: 'D19; the source suggests one hour and never settles it',
      },
    ],
  },
  {
    id: 'integrations',
    sectionAnnotation: '23.7.6',
    name: 'Integrations',
    summary:
      'The narrow integration surface. The category exists to state what the platform talks to, not to let an operator add something new to that list.',
    settings: [
      {
        name: 'Notification channels',
        value: 'Exactly two, platform-wide at every tier — in-app and email',
        changeClass: 'critical',
        sourceRef: 'AC-SA-07-06-01, L44281',
      },
    ],
  },
  {
    id: 'tenancy',
    sectionAnnotation: '23.7.7',
    name: 'Tenancy',
    summary:
      'How a tenant comes into existence, and the platform-seeded taxonomy every tenant workspace reads and none of them edits.',
    settings: [
      {
        name: 'Auto-provisioning',
        value:
          'Off. No public self-signup path exists at V1; onboarding is invitation-driven.',
        changeClass: 'admin',
        sourceRef: 'AC-SA-07-07-02, L44315',
      },
      {
        name: 'Platform-seeded taxonomy',
        value:
          '8 starter Job Types plus 8 Service Types, read-only in every tenant workspace. The names themselves are owed under DEC-TAX-002.',
        changeClass: 'admin',
        sourceRef: 'AC-SA-07-07-03, L44315',
      },
      {
        name: 'Regulated-Industry mode',
        value:
          'A bundle of 5 independently settable constituents; it tightens critical re-notification from 4 hours to 1 hour.',
        changeClass: 'admin',
        sourceRef: 'L44315, L44340',
      },
    ],
  },
  {
    id: 'observability',
    sectionAnnotation: '23.7.8',
    name: 'Observability',
    summary:
      'How often state is refreshed, and the rule that silence on the alerting path is itself a signal.',
    settings: [
      {
        name: 'State refresh floor',
        value:
          'Default 60 seconds, configurable to 30 seconds per tenant. Faster than 30 seconds requires a recorded scale validation.',
        changeClass: 'engineering',
        sourceRef: 'AC-SA-07-08-02, L44359; L42844',
      },
      {
        name: 'Alerting-path heartbeat',
        value:
          'Silence on the alerting path is itself detected and raised as an incident.',
        changeClass: 'engineering',
        sourceRef: 'AC-SA-07-08-03, L44359',
      },
    ],
  },
  {
    id: 'compliance',
    sectionAnnotation: '23.7.9',
    name: 'Compliance',
    summary:
      'The stated compliance posture. The console never renders a certification claim beyond it.',
    settings: [
      {
        name: 'Certification posture',
        value:
          'Rendered exactly as stated, and never beyond it. A posture is not a certificate.',
        changeClass: 'admin',
        sourceRef: 'AC-SA-07-09-01, L44392',
      },
    ],
  },
  {
    id: 'system',
    sectionAnnotation: '23.7.10',
    name: 'System',
    summary:
      'Platform-side scheduling behaviour: a missed window is data, never an absence.',
    settings: [
      {
        name: 'Scheduler misfire recording',
        value:
          'Every platform scheduler records a misfire with its window rather than skipping silently.',
        changeClass: 'engineering',
        sourceRef: 'AC-SA-07-10-01, L44433',
      },
      {
        name: 'Record-finish window',
        value:
          'Default 48 hours, bounds 24 hours to 7 days — carried as an open decision, DEC-FINISH-001, because the source states the bounds settled in two places and open in a third.',
        changeClass: 'critical',
        sourceRef: 'L44543, DEC-FINISH-001 L46211',
      },
    ],
  },
] as const satisfies readonly SettingsCategory[]

type MissingCategory = Exclude<SettingsCategoryId, (typeof SETTINGS_CATEGORIES)[number]['id']>
const _categoriesExhaustive: MissingCategory extends never ? true : never = true
void _categoriesExhaustive

/* ------------------------------------------------------------------ *
 * The cross-cutting sections (D21: 23.7.11–23.7.15 are NOT categories).
 * ------------------------------------------------------------------ */

export interface CrossCuttingSection {
  readonly id: string
  readonly sectionAnnotation: string
  readonly name: string
  readonly screenAnnotation: string
}

export const CROSS_CUTTING_SECTIONS = [
  {
    id: 'severity-catalog',
    sectionAnnotation: '23.7.11',
    name: 'The global severity catalog',
    screenAnnotation: 'SCR-SA-09 (L42801)',
  },
  {
    id: 'locale-packs',
    sectionAnnotation: '23.7.12',
    name: 'Locale packs and versioning policy',
    screenAnnotation: 'L44503, L44524',
  },
  {
    id: 'invariants-and-floor-register',
    sectionAnnotation: '23.7.13',
    name: 'Enforced invariants and the platform floor register',
    screenAnnotation: 'SCR-SA-10 (L42802)',
  },
  {
    id: 'emergency-pause',
    sectionAnnotation: '23.7.14',
    name: 'The emergency pause',
    screenAnnotation: 'SCR-SA-11 (L42803)',
  },
  {
    id: 'settings-as-approvable-objects',
    sectionAnnotation: '23.7.15',
    name: 'Settings changes as approvable objects',
    screenAnnotation: 'L44612, L44627',
  },
] as const satisfies readonly CrossCuttingSection[]

/* ------------------------------------------------------------------ *
 * The platform floor register — eight rows (L4562, L44534).
 * ------------------------------------------------------------------ */

export interface FloorRegisterRow {
  readonly name: string
  readonly floorOrCeiling: string
  /**
   * False where the source states the row COUNT but never names the row.
   * Three of the eight are in that position; they render as gaps rather
   * than as a plausible row somebody would later cite as a requirement.
   */
  readonly namedInSource: boolean
  readonly sourceRef: string
}

export const FLOOR_REGISTER_ROWS = [
  {
    name: 'Severity 1 floor',
    floorOrCeiling:
      'Automatic lot freeze plus Quality-Manager-only release. Tenants may add actions above the floor; they may never remove or weaken it.',
    namedInSource: true,
    sourceRef: 'L44538, AC-SA-07-11-02 L44490',
  },
  {
    name: 'Minimum genealogy depth',
    floorOrCeiling: 'One level of as-built links plus the full rework history. Tenants may not reduce it.',
    namedInSource: true,
    sourceRef: 'L44539',
  },
  {
    name: 'Offline credential-trust window',
    floorOrCeiling: 'Default approximately 24 hours; ceiling 72 hours. Tenant-set below the ceiling.',
    namedInSource: true,
    sourceRef: 'L44540, L45466',
  },
  {
    name: 'Record-finish window',
    floorOrCeiling:
      'Default 48 hours; bounds 24 hours to 7 days. Carried as open — DEC-FINISH-001.',
    namedInSource: true,
    sourceRef: 'L44543, L46211',
  },
  {
    name: 'Clock-skew threshold',
    floorOrCeiling: 'Default approximately 5 minutes; ceiling 60 minutes. Tenant-set below the ceiling.',
    namedInSource: true,
    sourceRef: 'L42704, L45466',
  },
  {
    name: 'Row 6',
    floorOrCeiling: 'Not named in the frozen source.',
    namedInSource: false,
    sourceRef: 'L4562, L44534 state the count as eight and enumerate five',
  },
  {
    name: 'Row 7',
    floorOrCeiling: 'Not named in the frozen source.',
    namedInSource: false,
    sourceRef: 'L4562, L44534 state the count as eight and enumerate five',
  },
  {
    name: 'Row 8',
    floorOrCeiling: 'Not named in the frozen source.',
    namedInSource: false,
    sourceRef: 'L4562, L44534 state the count as eight and enumerate five',
  },
] as const satisfies readonly FloorRegisterRow[]

/**
 * AC-SA-19-05 (L46318): "All seventeen governed settings are present and each
 * has a floor-register bound." The count is closed. The LIST is not: the
 * frozen source enumerates it nowhere, in any chapter. This module renders
 * the count and the settings the source does name, and refuses to present
 * those as "the seventeen" — see `SA07_UNSPECIFIED_IN_SOURCE`.
 */
export const GOVERNED_SETTINGS_COUNT = 17

/* ------------------------------------------------------------------ *
 * Aggregate freshness. Fixture strings, never a computed clock.
 * ------------------------------------------------------------------ */

export const POSTURE_AS_OF = 'As of 2026-08-17 09:14 UTC'
export const POSTURE_STALE_AS_OF = 'Stale — as of 2026-08-17 03:02 UTC, 6 hours 12 minutes old'
export const POSTURE_ORIGIN = 'origin: the platform settings change ledger'

/** Counts by OBJ-SA-SETTING state. A state with nothing in it is omitted, never rendered as nought. */
export interface PostureCount {
  readonly state: SettingState
  readonly count: number
}

export const SETTINGS_POSTURE = [
  { state: 'pending', count: 3 },
  { state: 'approved', count: 1 },
  { state: 'distributed', count: 4 },
  { state: 'reconciled', count: 9 },
  { state: 'refused', count: 2 },
] as const satisfies readonly PostureCount[]

/* ------------------------------------------------------------------ *
 * The severity catalog and locale packs — both distribute to devices,
 * so both render the fifteen-state command vocabulary (L42846, and the
 * census's shared-rendering rule at L42886).
 * ------------------------------------------------------------------ */

export interface DistributionRow {
  readonly artifact: string
  readonly version: string
  /**
   * Typed against the closed fifteen, so a state that is not one of them —
   * "distributed", say, which is an OBJ-SA-SETTING state and not a command
   * state — fails to compile rather than to render.
   */
  readonly commandState: CommandState
  readonly note: string
}

export const SEVERITY_CATALOG_DISTRIBUTION = [
  {
    artifact: 'Severity-classification table',
    version: 'v4.2.0',
    commandState: 'acknowledged',
    note: 'Devices applied at the next sync, in order, and acknowledged. In-flight runs stayed pinned to the version they started on.',
  },
  {
    artifact: 'Severity-classification table',
    version: 'v4.3.0',
    commandState: 'created',
    note: 'Proposed change, awaiting root approval. Nothing has been authorized and nothing has reached a device.',
  },
] as const satisfies readonly DistributionRow[]

export const LOCALE_PACKS = [
  { language: 'English', version: 'v2.1.0', state: 'InForce' },
  { language: 'Spanish', version: 'v2.1.0', state: 'Distributing' },
  {
    language: 'Spanish',
    version: 'v2.2.0-rc1',
    state: 'Failed',
  },
] as const satisfies readonly { readonly language: string; readonly version: string; readonly state: LocalePackState }[]

/* ------------------------------------------------------------------ *
 * D22 — the User-Mandated Product Extension material, kept apart from
 * the SoW-Fact categories above so contract and extension are
 * distinguishable on screen (L54620, L98419).
 * ------------------------------------------------------------------ */

export const EXTENSION_LABEL = 'User-Mandated Product Extension — not SoW Fact'

export interface ExtensionItem {
  readonly name: string
  readonly detail: string
  readonly sourceRef: string
}

export const EXTENSION_SCHEDULED_WORK = [
  {
    name: 'Scheduled-work register',
    detail:
      'One row per SCHED- identifier with its occurrences, misfires, dead-letter shelf and reconciliation status. A misfire is data, not an absence.',
    sourceRef: 'L98419',
  },
  {
    name: 'Schedule Definition',
    detail:
      'Draft, pending approval, approved, active, paused, suspended by tenant state, held by a maintenance window, superseded, retired, archived.',
    sourceRef: 'OBJ-SCHEDDEF L98871',
  },
  {
    name: 'Prohibition checklist on Schedule Definition approval',
    detail:
      'Satisfied, not applicable with a reason, or blocking. A blocking prohibition prevents submission.',
    sourceRef: 'L98835',
  },
] as const satisfies readonly ExtensionItem[]

export const EXTENSION_FEATURE_CONTROL = [
  {
    name: 'WF-FEAT-001 — enabling or disabling a feature globally',
    detail:
      'Admin or Platform Engineer proposes; on failure the prior behaviour stays in force everywhere, the change is recorded as failed with its reason, and the split state is named while it existed.',
    sourceRef: 'L54620',
  },
  {
    name: 'WF-FEAT-003 — scheduling a feature change with expiry, cancellation and rollback',
    detail:
      'On a missed window the prior state remains in force and the missed occurrence stays visible.',
    sourceRef: 'L54691',
  },
  {
    name: 'WF-FEAT-004 — partial propagation across the five surfaces',
    detail:
      'While a divergence exists the most restrictive state governs enforcement, and the divergence is named on every surface that shows the feature.',
    sourceRef: 'L54733',
  },
  {
    name: 'WF-FEAT-005 — a feature change while worker devices are offline',
    detail:
      'The run completes on its pinned package and the change takes effect at the next execution — never mid-run.',
    sourceRef: 'L54770',
  },
] as const satisfies readonly ExtensionItem[]

/**
 * D7: the PER-TENANT feature override is not built here — it is a flag on the
 * tenant record and belongs to MOD-SA-11. Only GLOBAL feature control stays
 * in this module.
 */
export const PER_TENANT_OVERRIDE_NOTE =
  'WF-FEAT-002, the per-tenant feature override, is not offered here. It is a flag on the tenant record, so it belongs to MOD-SA-11 Tiers, Entitlements and Caps (D7, AC-SA-11-04 L45342). Global feature control stays in this module.'

/* ------------------------------------------------------------------ *
 * Prohibitions rendered as ABSENT — nothing drawn, a note where a
 * control would sit.
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
  /** Which panel the note belongs beside. */
  readonly placement: 'integrations' | 'memory-and-data' | 'pause' | 'invariants'
}

export const SA07_ABSENT_CONTROLS = [
  {
    label: 'Adding an outbound integration destination',
    placement: 'integrations',
    note: 'No control exists to add an outbound destination, for any account including the root, and no free-text endpoint field appears anywhere in this category. The absence IS the control — the narrow integration surface is enforced by there being nothing to type into (L95576).',
  },
  {
    label: 'A per-tenant region control',
    placement: 'memory-and-data',
    note: 'No control exists to set a data region per tenant, for any account including the root. Region-per-tenant is roadmap, and a control here would misrepresent a capability the platform does not have (L97239).',
  },
  {
    label: 'Pause the deterministic layer',
    placement: 'pause',
    note: 'No control exists to pause the deterministic layer, for any account including the root. On-device classification, specification checks and the Severity 1 hold keep running through every pause — that is the point of the pause, not a limitation of it (L65614, AC-SA-07-14-05 L44604).',
  },
  {
    label: 'An off switch, an approval path, or a configuration key on any of the six invariants',
    placement: 'invariants',
    note: 'None of the three exists on any screen, for any account including the root. What is drawn above is a status readout (AC-SA-INV-003, L47849).',
  },
] as const satisfies readonly AbsentControl[]

/* ------------------------------------------------------------------ *
 * Workflows this module renders. Every entry says HOW it was matched,
 * because none of them carries `module_id: MOD-SA-07` in the extract.
 * ------------------------------------------------------------------ */

export interface Sa07Workflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  readonly matchedBy: string
}

export const SA07_WORKFLOWS = [
  {
    id: 'unnumbered',
    name: 'A settings change from intent to effect',
    actor: 'Console operator',
    trigger: "A console operator opens the setting's category and edits the value",
    terminalStates: [
      'refused outright where the setting is one of the six enforced invariants',
      'applied with its audit event in one transaction',
      'distributed as a versioned artifact and reconciled',
    ],
    matchedBy: 'name and line proximity — L43996, inside the §8.7 Platform Settings run',
  },
  {
    id: 'unnumbered',
    name: 'Severity catalog change workflow',
    actor: 'Console operator proposing; Root Super Admin approving',
    trigger: 'An operator proposes a catalog change',
    terminalStates: [
      'devices apply at next sync in order; in-flight runs remain pinned',
      'per-device package inventory reconciles',
    ],
    matchedBy: 'name and line proximity — L44469, adjacent to 23.7.11',
  },
  {
    id: 'unnumbered',
    name: 'Locale pack publication workflow',
    actor: 'Platform team',
    trigger: 'A locale pack version is prepared',
    terminalStates: [
      'publication fails naming untranslated keys',
      'in force per device; in-flight runs stay pinned',
    ],
    matchedBy: 'name and line proximity — L44500, adjacent to 23.7.12',
  },
  {
    id: 'unnumbered',
    name: 'An emergency pause, told honestly',
    actor: 'Platform Engineer or Admin proposing; Root Super Admin approving',
    trigger: 'A pause proposal enters the approval queue as critical class',
    terminalStates: [
      'agent activity suspended; in-flight agent runs checkpoint at the next stage boundary and park',
      'resume proposed and approved separately, audited as its own act',
    ],
    matchedBy: 'name; the SB-RBAC-08 screen at L21588 carries module_id MOD-SA-07',
  },
  {
    id: 'WF-TAX-001 / WF-TAX-002',
    name: 'Administering a platform-seeded Job Type or Service Type tag',
    actor: 'platform Admin as drafter',
    trigger: 'An entry is drafted with its code and display names in both locales',
    terminalStates: ['the prior catalog is in force globally'],
    matchedBy:
      'line proximity — L54845 and L54883, the same run as the Deprecate/Restore controls tagged MOD-SA-07 at L54850',
  },
] as const satisfies readonly Sa07Workflow[]

/* ------------------------------------------------------------------ *
 * Unspecified in source. Named, never invented.
 * ------------------------------------------------------------------ */

export interface UnspecifiedAffordance {
  readonly affordance: string
  readonly note: string
}

export const SA07_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'The Orchestration category (23.7.2)',
    note: 'The source lists the category by name at L44633 and defines no setting, no acceptance criterion and no control inside it. The category is navigable and empty. Nothing was drafted to fill it.',
  },
  {
    affordance: 'The list of governed settings behind the stated count',
    note: 'AC-SA-19-05 (L46318) closes the count at seventeen and states that each carries a floor-register bound. The list itself appears in no chapter of the frozen source. The settings shown in the ten categories are the ones the source names; this screen does not present them as being the seventeen, because that mapping would be an inference the source never makes.',
  },
  {
    affordance: 'Three of the eight platform floor-register rows',
    note: 'The count is stated as eight in two places (L4562, L44534). Five rows are named across the source. The remaining three are shown as unnamed rows rather than filled with plausible bounds.',
  },
  {
    affordance: 'An edit affordance for any setting value',
    note: 'The source describes the settings-change lifecycle (drafted through reconciled) and the change classes, but names no field-level edit control on any of the ten categories. No input is drawn. Values render read-only with their change class and approval route stated.',
  },
  {
    affordance: 'The severity catalog editor itself (SCR-SA-09)',
    note: 'The screen is named at L42801 and its change workflow at L44469, but the editor’s fields, its severity bands and its validation rules are described nowhere. The catalog renders as its distribution posture and its critical-class approval route, not as a form.',
  },
  {
    affordance: 'A locale-pack upload or authoring affordance',
    note: 'The publication workflow and the six pack states are defined (L44500, L44503); how a pack enters "Prepared" is not. No upload control is drawn.',
  },
  {
    affordance: 'The compliance-emergency time box',
    note: 'Required and unset — DEC-SEC-017. The source suggests one hour and never settles it, so it renders as required-and-unset rather than being hard-coded to the suggestion (D19).',
  },
  {
    affordance: 'The eight starter Job Type and Service Type names',
    note: 'The count is stated (8 plus 8, L44315); the names are owed under DEC-TAX-002. The taxonomy pane renders the count and the entry lifecycle, not sixteen invented codes.',
  },
] as const satisfies readonly UnspecifiedAffordance[]

/* ------------------------------------------------------------------ *
 * Conflicts in the source, each carried with how it was resolved.
 * ------------------------------------------------------------------ */

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const SA07_SOURCE_CONFLICTS = [
  {
    topic: 'Ten categories, fifteen acceptance-criteria sub-groups (D21)',
    conflict:
      'L44633 states ten categories; the acceptance criteria run AC-SA-07-01-xx through AC-SA-07-15-xx.',
    resolution:
      'Ten navigable categories. 23.7.11 through 23.7.15 render as cross-cutting sections, which matches the screen inventory — the catalog, the register and the pause each carry their own screen annotation at L42801 to L42803.',
  },
  {
    topic: 'Who may pause (D8, DEC-PAUSE-001)',
    conflict:
      'Four incompatible readings of who may trigger the emergency pause sit in the source at once.',
    resolution:
      'Admin proposes, root approves — the only reading consistent with "no fallback depends indefinitely on one person". The Platform Engineer’s control is drawn and inert with that reason named. The decision is open.',
  },
  {
    topic: 'A switch that stops a runaway agent loop (D8)',
    conflict:
      'The source describes such a switch beside the emergency pause and warns that the two must not be conflated.',
    resolution:
      'Not built. Two controls that stop different things, described in one paragraph, become one control the moment somebody builds them together.',
  },
  {
    topic: 'Scheduled-work and feature-control classification (D22)',
    conflict:
      'This material is classified "User-Mandated Product Extension" at L54620 and L98419, not SoW Fact, while sitting inside the same module.',
    resolution:
      'Built, and visibly separated under its own label, so contract and extension are distinguishable at a glance.',
  },
  {
    topic: 'Two failure idioms that look alike and are not',
    conflict:
      'A refused invariant edit is RECORDED as an attempt against a locked setting (AC-SEC-602, L104033); a looser-than-floor register value is REJECTED at entry and never stored (AC-SA-07-13-04, L44568).',
    resolution:
      'Both are built, and they are rendered differently. One leaves a record; the other leaves nothing, deliberately.',
  },
  {
    topic: 'Module-level roles_allowed (D16)',
    conflict:
      'This module’s roles_allowed ranges from root-only (L11664) to all four (L21084).',
    resolution:
      'Module-level roles_allowed is authoritative nowhere. Every affordance below is driven by its own allowed-roles through evaluateAccess, and all four roles read every panel.',
  },
] as const satisfies readonly SourceConflict[]
