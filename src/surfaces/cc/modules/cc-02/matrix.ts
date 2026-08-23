import type { PermissionOutcome } from '@/policy/decision'
import type { DecisionReading } from '@/disclosure/decisions'
import type { RoleId } from '@/domain/roles'

/* ==================================================================== *
 * `MOD-CC-02` — SYNC STATE AND CONNECTIVITY. THE PERMISSION MATRIX.
 *
 * The identity card opens at L36427 and its `**Identity.**` paragraph is
 * L36433. The matrix is header L36450, separator L36451, data L36452 to
 * L36459 — EIGHT data rows, each of six cells, counted off the source rather
 * than read off a span. The header and every data row split into exactly six
 * cells, so no row is short and none carries a stray pipe.
 *
 * THE COLUMN ORDER IS THIS CARD'S OWN AND IT IS NOT THE FRONTLINE'S. L36450
 * reads `Capability on this module | Tenant Admin | Supervisor | Quality
 * Manager | Read-only Auditor | Worker`. Tenant Admin is FIRST. The Frontline
 * cards put Worker first, and a positional transcription carried across from
 * one of those would swap Tenant Admin and Worker on every row — silently,
 * because both readings are internally coherent. Every cell below is keyed on
 * the role its own column names, and `CC02_COLUMN_ORDER` records the order as
 * a transcription so a test can compare it with L36450 instead of trusting
 * the shape of this array.
 *
 * THE TOKENS ARE NOT BACKTICKED HERE, and that is the card's own typography
 * rather than an omission: chapter 21's matrices write `Allowed` and
 * `Explicitly prohibited` as plain words where chapter 22's write them in
 * backticks. Transcribed as written.
 *
 * `cells` IS A TOTAL RECORD OVER THE FIVE TENANT ROLES, so a blank cell is
 * untypeable. There is no sixth column and no platform role on this card.
 * ==================================================================== */

/** The header cells of L36450, in order, verbatim. */
export const CC02_COLUMN_ORDER = [
  'Capability on this module',
  'Tenant Admin',
  'Supervisor',
  'Quality Manager',
  'Read-only Auditor',
  'Worker',
] as const satisfies readonly string[]

/**
 * The five role columns read onto the platform's role identifiers, in the
 * card's own column order. Kept beside `CC02_COLUMN_ORDER` rather than
 * derived from it, because the mapping from a column heading to a `RoleId` is
 * the step a positional transcription gets wrong and it should be visible.
 */
export const CC02_ROLE_COLUMNS = [
  'TENANT_ADMIN',
  'SUPERVISOR',
  'QUALITY_MANAGER',
  'READONLY_AUDITOR',
  'WORKER',
] as const satisfies readonly RoleId[]

export type Cc02RoleColumn = (typeof CC02_ROLE_COLUMNS)[number]

/** One transcribed cell: the source's words, and what they mean. */
export interface Cc02Cell {
  /** The cell exactly as the source writes it, em-dash qualifier included. */
  readonly verbatim: string
  readonly outcome: PermissionOutcome
}

/**
 * THE HEAD TOKEN DECIDES THE OUTCOME, AND THE MATCH IS EXACT.
 *
 * `Allowed` is a prefix of `Allowed with conditions`. Slice 7 shipped a gate
 * that could not fail for exactly that reason, and a classifier written with
 * `startsWith` inverts row 8 — the one row on this card where the difference
 * between the two tokens is the whole ruling. So the qualifier is split off
 * at the em-dash FIRST and the remaining head is compared with `===`. There
 * is no prefix comparison anywhere in this file.
 *
 * The four heads below are every head this card uses. A cell whose head is
 * not one of them throws rather than defaulting, because a silent default is
 * how an untranscribed token becomes `allowed`.
 */
const OUTCOME_BY_HEAD = {
  'Allowed with conditions': 'allowedWithConditions',
  Allowed: 'allowed',
  'Read-only': 'readOnly',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<string, PermissionOutcome>

export function cc02CellOutcome(verbatim: string): PermissionOutcome {
  const head = verbatim.split('—')[0]?.trim() ?? ''
  const outcome = (OUTCOME_BY_HEAD as Record<string, PermissionOutcome | undefined>)[head]
  if (outcome === undefined) {
    throw new Error(
      `MOD-CC-02 matrix cell head "${head}" is not one of the four tokens this card uses. ` +
        'The cell was transcribed from L36452-L36459; a new head means the transcription drifted.',
    )
  }
  return outcome
}

const cell = (verbatim: string): Cc02Cell => ({ verbatim, outcome: cc02CellOutcome(verbatim) })

const ALLOWED = cell('Allowed')
const PROHIBITED = cell('Explicitly prohibited')

export type Cc02RowId =
  | 'see-the-freshness-marker'
  | 'expand-the-marker'
  | 'see-the-connectivity-banner'
  | 'see-as-of-stamps'
  | 'see-run-completion-states'
  | 'configure-the-refresh-interval'
  | 'configure-the-connectivity-thresholds'
  | 'manually-close-a-stuck-run'

/**
 * Where a row's act actually happens. `this-module` is chrome MOD-CC-02
 * draws. `another-surface` is an act this surface does not carry at all, and
 * the only thing the Command Center may offer for one of those is a way to
 * REACH it.
 */
export type Cc02RowSurface = 'this-module' | 'another-surface'

export interface Cc02Row {
  readonly id: Cc02RowId
  /** Verbatim from the `Capability on this module` column. */
  readonly capability: string
  readonly surface: Cc02RowSurface
  readonly cells: Record<Cc02RoleColumn, Cc02Cell>
  /** This row's own line in the matrix. */
  readonly sourceRef: string
  /** The functionality that specifies the act, and its line. */
  readonly specRef: string
  /**
   * For an `another-surface` row: whether the source says the Command Center
   * offers a way to REACH the act. True on exactly one row, and its warrant
   * is the cell's own final clause, "reached by a link from the drill"
   * (L36459). Always `false` for a row this module draws — there is nothing
   * to link out to.
   */
  readonly reachableFromHere: boolean
  /**
   * For an `another-surface` row: what the Command Center offers instead of
   * the act, in the source's own terms. `null` for a row this module draws.
   */
  readonly offeredHere: string | null
}

export const CC02_MATRIX = [
  {
    id: 'see-the-freshness-marker',
    capability: 'See the freshness marker on any element',
    surface: 'this-module',
    cells: {
      TENANT_ADMIN: ALLOWED,
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36452',
    specRef: 'FUNC-CC-0201-1-1 · L36528',
    reachableFromHere: false,
    offeredHere: null,
  },
  {
    id: 'expand-the-marker',
    capability: 'Expand the marker to the device list',
    surface: 'this-module',
    cells: {
      TENANT_ADMIN: ALLOWED,
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36453',
    specRef: 'FUNC-CC-0201-1-2 · L36529',
    reachableFromHere: false,
    offeredHere: null,
  },
  {
    /*
     * THE TENANT ADMIN CELL IS `Allowed`, QUALIFIED, NOT `Allowed with
     * conditions`. The head token is `Allowed` and the em-dash clause names
     * WHO the banner is addressed to rather than a condition on seeing it —
     * L36510's notification row reads "Tenant Admin, named; rendered to all
     * in-scope Command Center users under the strengthened rule", and the
     * concentration row at L35244 reads "Tenant Admin for the banner". The
     * qualifier is carried verbatim so a reader can see the distinction; it
     * is not promoted to a condition this build invented.
     */
    id: 'see-the-connectivity-banner',
    capability: 'See the site-wide connectivity banner',
    surface: 'this-module',
    cells: {
      TENANT_ADMIN: cell('Allowed — named recipient'),
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36454',
    specRef: 'FUNC-CC-0202-1-2 · L36536',
    reachableFromHere: false,
    offeredHere: null,
  },
  {
    /*
     * A CONTRADICTION INSIDE ONE CARD, ON THE TENANT ADMIN, RECORDED RATHER
     * THAN TIDIED. This cell says `Allowed`, and the capability it grants is
     * TWO acts joined by "and". The card specifies them as two
     * functionalities with different role lists:
     *
     *   FUNC-CC-0203-1-1, the as-of stamp (L36542) — "Roles allowed: all
     *     viewers. Roles prohibited: none beyond module access."  Tenant
     *     Admin allowed.
     *   FUNC-CC-0203-1-2, the late-arrival flag (L36543) — "Roles allowed:
     *     Supervisor, Quality Manager. Roles prohibited: Read-only Auditor,
     *     Worker, TENANT ADMIN."  Tenant Admin prohibited.
     *
     * So the matrix grants in one cell what the specification refuses in
     * half of it. The cell is transcribed as written because the matrix is
     * the card's own statement of "roles that see and use it"; the split is
     * carried on `CC02_AS_OF_SPLIT` below so a renderer can honour the
     * narrower half without this build choosing which statement wins.
     */
    id: 'see-as-of-stamps',
    capability: 'See as-of stamps and late-arrival flags',
    surface: 'this-module',
    cells: {
      TENANT_ADMIN: ALLOWED,
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36455',
    specRef: 'FUNC-CC-0203-1-1 · L36542',
    reachableFromHere: false,
    offeredHere: null,
  },
  {
    /*
     * THE ONLY `Read-only` CELL ON THE CARD, AND THE SPECIFICATION IS SILENT
     * ABOUT IT. `FUNC-CC-0204-1-1` at L36547 is this row's functionality and
     * its lists are "Roles allowed: Supervisor, Quality Manager, Plant
     * Manager persona. Roles prohibited: Read-only Auditor, Worker." The
     * Tenant Admin appears in NEITHER, so the matrix grants a read the
     * specification neither grants nor refuses.
     *
     * That is a gap and not the contradiction row 4 carries, and the two are
     * kept distinct on purpose: row 4 has two statements that disagree, this
     * row has one statement and a silence. `readOnly` is a permission outcome
     * in its own right (`@/policy/decision`), so the cell is representable
     * exactly as written without being read up to `allowed` or down to
     * `explicitlyProhibited`.
     */
    id: 'see-run-completion-states',
    capability: 'See run completion states',
    surface: 'this-module',
    cells: {
      TENANT_ADMIN: cell('Read-only'),
      SUPERVISOR: ALLOWED,
      QUALITY_MANAGER: ALLOWED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36456',
    specRef: 'FUNC-CC-0204-1-1 · L36547',
    reachableFromHere: false,
    offeredHere: null,
  },
  {
    /*
     * PROHIBITED IN EVERY COLUMN, AND THE TENANT ADMIN'S QUALIFIER SAYS WHERE
     * THE SETTING LIVES INSTEAD. That makes it an `another-surface` row even
     * though no role may perform it here: the act exists, on the Hub, and the
     * qualifier is the source telling a reader so.
     */
    id: 'configure-the-refresh-interval',
    capability: 'Configure the refresh interval',
    surface: 'another-surface',
    cells: {
      TENANT_ADMIN: cell(
        'Explicitly prohibited — tenant settings live in the Delivery Operations Hub tenant administration area',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36457',
    specRef: 'the refresh-interval floor · L35837, DEC-REFRESH-001 · L35839',
    reachableFromHere: false,
    offeredHere:
      'Nothing. The Command Center offers no path to this setting at all — unlike row 8, which the ' +
      'source explicitly reaches by a link. A control drawn here would be a record-or-configuration ' +
      'edit, the third of the four absolute exclusions at L38704.',
  },
  {
    id: 'configure-the-connectivity-thresholds',
    capability: 'Configure the connectivity-loss thresholds',
    surface: 'another-surface',
    cells: {
      TENANT_ADMIN: cell(
        'Explicitly prohibited — configurable defaults held platform-side and in tenant settings',
      ),
      SUPERVISOR: PROHIBITED,
      QUALITY_MANAGER: PROHIBITED,
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36458',
    specRef: 'the three thresholds · L36469',
    reachableFromHere: false,
    offeredHere:
      'Nothing, on the same footing as the refresh-interval row above. The qualifier names two ' +
      'places the defaults are held and neither is this surface.',
  },
  {
    /*
     * ROW 8 — THE CROSS-SURFACE ROW, AND THE LINK IS THE WHOLE CELL.
     *
     * The Supervisor cell reads "Allowed with conditions — performed on the
     * Delivery Operations Hub run record with a mandatory note, reached by a
     * link from the drill". Three clauses, and the permissive head belongs to
     * NONE of the acts this module draws:
     *
     *   performed on ... the Hub run record  — the act is the Hub's
     *   with a mandatory note                — the Hub's own precondition
     *   reached by a link from the drill     — what the Command Center offers
     *
     * `FUNC-CC-0204-2-1` at L36551 names the functionality "Offer a link to
     * manual close on the Delivery Operations Hub run record", and its
     * prohibition list ends "and every role from performing it as one of the
     * ten operational actions". L36467 says it plainly: "The one write
     * reachable through this module's navigation ... is executed there, not
     * here". L36516 says the audited event is written on the Hub record.
     *
     * SO BUILDING THE CLOSE HERE BREACHES AN ABSOLUTE EXCLUSION. L38704 —
     * "It cannot edit any record or any configuration" — is one of four that
     * L38707 calls "properties of the surface", not defaults a role grant may
     * relax. L48368 restates them for every screen. What this module ships is
     * `CC02_MANUAL_CLOSE_LINK` below: a destination and a precondition, and
     * no act.
     *
     * THE QUALITY MANAGER CELL INHERITS BY REFERENCE. "Allowed with
     * conditions — same conditions" carries no conditions of its own, so a
     * reader of that cell alone learns neither the surface nor the note. Both
     * cells are transcribed as written and the inheritance is noted here.
     */
    id: 'manually-close-a-stuck-run',
    capability: 'Manually close a stuck run',
    surface: 'another-surface',
    cells: {
      TENANT_ADMIN: PROHIBITED,
      SUPERVISOR: cell(
        'Allowed with conditions — performed on the Delivery Operations Hub run record with a mandatory note, reached by a link from the drill',
      ),
      QUALITY_MANAGER: cell('Allowed with conditions — same conditions'),
      READONLY_AUDITOR: PROHIBITED,
      WORKER: PROHIBITED,
    },
    sourceRef: 'L36459',
    specRef: 'FUNC-CC-0204-2-1 · L36551',
    reachableFromHere: true,
    offeredHere:
      'A link to the Delivery Operations Hub run record, and nothing else. The act, its mandatory ' +
      'note and its audited event are all the Hub\'s (L36467, L36516). Offering a way to reach an act ' +
      'is not offering the act, and that distinction is what keeps this row clear of L38704.',
  },
] as const satisfies readonly Cc02Row[]

export function cc02Row(id: Cc02RowId): Cc02Row {
  const found = CC02_MATRIX.find((r) => r.id === id)
  if (found === undefined) throw new Error(`Unknown MOD-CC-02 matrix row: ${id}`)
  return found
}

/**
 * WHAT MAY BE DRAWN FOR A ROW, AND THE ORDER OF THE QUESTIONS IS THE RULE.
 *
 * THE SURFACE QUESTION IS ASKED FIRST AND THE TOKEN IS NEVER CONSULTED. That
 * ordering is the whole guard. `src/surfaces/doh/boundary.ts` names the shape
 * this prevents in its own words: "Nobody writes `surface: 'another-surface'`
 * and then draws a button on it; what happens is that the cell reads
 * `Allowed`, the row gets classified by its token, and the button follows
 * honestly from a wrong classification." It also records that slice 6 could
 * not exercise the case because no adjacent row then held a permissive token.
 * ROW 8 IS THAT CASE: an `another-surface` row whose Supervisor and Quality
 * Manager cells both open `Allowed with conditions`.
 *
 * Read this fold against `evaluateCCAccess`, which asks the surface exclusion
 * before it reads the request for the same reason. A fold that consulted
 * `cells[role].outcome` first would draw a close button for two roles and be
 * right about the token every time.
 */
export type Cc02Affordance = 'chrome' | 'link-out' | 'never-drawn'

export function cc02Affordance(row: Cc02Row): Cc02Affordance {
  if (row.surface === 'another-surface') {
    return row.reachableFromHere ? 'link-out' : 'never-drawn'
  }
  return 'chrome'
}

/**
 * ROW 4'S TWO HALVES, AND THE TENANT ADMIN'S TWO ANSWERS.
 *
 * The row grants "as-of stamps and late-arrival flags" in one `Allowed`
 * cell; the card specifies the halves separately and gives the Tenant Admin
 * opposite answers. Both statements are carried, neither is chosen, and a
 * renderer decides per HALF rather than per row — which is possible only
 * because the halves are named here.
 *
 * There is deliberately no `tenantAdminSees` boolean and no resolved outcome:
 * a single field would be this build answering it.
 */
export interface Cc02AsOfHalf {
  readonly half: 'as-of stamp' | 'late-arrival flag'
  /** Verbatim `Roles allowed:` from the functionality. */
  readonly rolesAllowed: string
  /** Verbatim `Roles prohibited:` from the functionality. */
  readonly rolesProhibited: string
  readonly sourceRef: string
}

export const CC02_AS_OF_SPLIT = [
  {
    half: 'as-of stamp',
    rolesAllowed: 'all viewers',
    rolesProhibited: 'none beyond module access',
    sourceRef: 'FUNC-CC-0203-1-1 · L36542',
  },
  {
    half: 'late-arrival flag',
    rolesAllowed: 'Supervisor, Quality Manager',
    rolesProhibited: 'Read-only Auditor, Worker, Tenant Admin',
    sourceRef: 'FUNC-CC-0203-1-2 · L36543',
  },
] as const satisfies readonly Cc02AsOfHalf[]

/* ==================================================================== *
 * THE LINK-OUT, AS A DESTINATION AND A PRECONDITION.
 *
 * A record rather than a component, so nothing here can acquire a handler.
 * There is deliberately no `onClose`, no `submit`, and no note FIELD — a note
 * input rendered here would be the Command Center collecting the Hub's
 * mandatory note, which is the edit wearing a different hat.
 * ==================================================================== */

export interface Cc02LinkOut {
  /** What the source calls the destination. */
  readonly destination: string
  /** The surface that owns the act. */
  readonly owningSurface: 'SURF-DOH'
  /** Where the link is offered from, in the source's words. */
  readonly reachedFrom: string
  /** The Hub's precondition, stated here so a reader knows it exists. */
  readonly precondition: string
  /** Acts this module does NOT offer, and the line that excludes each. */
  readonly notOfferedHere: readonly string[]
  readonly sourceRefs: readonly string[]
}

export const CC02_MANUAL_CLOSE_LINK: Cc02LinkOut = {
  destination: 'the Delivery Operations Hub run record',
  owningSurface: 'SURF-DOH',
  reachedFrom: 'a link from the drill',
  precondition: 'a mandatory note, taken and audited on the Hub record',
  notOfferedHere: [
    'Performing the close — the act is executed on the Hub, not here (L36467).',
    'Taking the mandatory note — the audited event carrying it is written on the Hub record (L36516).',
    'Performing it as one of the ten operational actions — FUNC-CC-0204-2-1 prohibits every role from doing so (L36551).',
    'Editing the run record in any way — the third absolute exclusion, for every role (L38704).',
  ],
  sourceRefs: ['L36459', 'L36467', 'L36485', 'L36516', 'L36551', 'L38704', 'L48368'],
}

/* ==================================================================== *
 * THE DECISIONS THIS MODULE DISCLOSES — AND THE ONE IT DOES NOT RESPELL.
 *
 * `DEC-STUCK-001` IS ALREADY DISCLOSED TWICE AND IS NOT DISCLOSED AGAIN HERE.
 * `src/frontline/modules/fl-b11/service.ts` carries the full card as
 * `B11_DISCLOSURES`, and `src/surfaces/doh/modules/doh-06/matrix.ts` carries
 * it as `DEC_STUCK_001` beside the row whose cell IS Reading A. Both quote
 * L5255, L5256, L5258, L5259 and AC-RUN-004 at L7128. A third spelling is the
 * defect this build records most often, so this module points at them.
 *
 * AND THE DISPATCH BRIEF WAS WRONG ABOUT WHERE IT SITS. The brief stated that
 * L36459's cell "also carries DEC-STUCK-001". It does not: L36459 names no
 * decision at all, and the two places this card DOES name one for manual
 * close — `FUNC-CC-0204-2-1` at L36551 and the Source status at L36614 —
 * both name `DEC-CCWRITE-001`. `DEC-STUCK-001` occurs sixteen times in the
 * frozen source and none of them is inside §21.5. It reaches this module by
 * the coverage map instead: `AC-COV-093` at L4371 reads "The `§6.2` row
 * carries `DEC-RUNSTATE-001` and `DEC-STUCK-001`", and §6.2 is this module's
 * own Source section per L36433.
 *
 * WHICH MAKES THE CARD'S OWN ALTERNATE PATH THE SHARPER FINDING. L36485
 * reads "the run then stands submitted with the gap recorded" — Reading B,
 * stated as flat fact, inside the module that RENDERS the three run states.
 * L27917's matrix cell states Reading A as flat fact — "the run is `complete`
 * at close time". Both are frozen source, they disagree, and `AC-RUN-004` at
 * L7128 refuses both. This module renders `submitted`, `complete` and
 * `finished` (L36469) and therefore renders whichever the answer is, so it
 * asserts NEITHER: `CC02_RUN_STATES` in `./chrome` carries all three with no
 * transition into any of them for a manually closed run.
 *
 * SO WHAT IS DISCLOSED HERE IS ONE DECISION, NOT TWO. §21.5 names two —
 * `DEC-CCWRITE-001` and `DEC-REFRESH-001` — and only the first is new to this
 * build. `DEC-REFRESH-001` is already carried in full by
 * `app/super-admin/tenant-configuration-registry/fixtures.ts`, with the floor
 * against the "shorter is stricter" direction, both locators, and the entry
 * rule stated; a record here would be the same second spelling `DEC-STUCK-001`
 * would have been. Row 7 prohibits configuring the interval in every column,
 * so this module draws no control the decision governs. Both are pointed at
 * by `CC02_DECISIONS_HELD_ELSEWHERE` below instead.
 *
 * `DEC-CCWRITE-001` IS ABSENT FROM EVERYTHING. Zero occurrences in `src/`,
 * `tests/` and `app/`, and absent from `@/disclosure/decisions` — it is not a
 * member of that file's `DecisionId` union — and that file is another task's
 * path. The `Stu14LocalDisclosure` idiom applies: the
 * canon's own record shape, `DecisionReading` IMPORTED rather than redeclared
 * so there is no field in which a reading could be marked the answer, the gap
 * declared on `canonNote`, and the unit suite asserting the absence so this
 * stand-in goes red the moment the canon absorbs it.
 * ==================================================================== */

/**
 * The decisions §21.5 names in its own text AND that no other module already
 * holds. One, and it is not in the canon either.
 */
export const CC02_DECISION_REFS = ['DEC-CCWRITE-001'] as const

export type Cc02DecisionRef = (typeof CC02_DECISION_REFS)[number]

export interface Cc02Disclosure {
  readonly decisionRef: Cc02DecisionRef
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why §21.5 is a place this decision has to be disclosed. */
  readonly whyHere: string
  /** Why it is disclosed here rather than through the shared renderer. */
  readonly canonNote: string
}

const CANON_NOTE =
  'The shared decision canon at @/disclosure/decisions carries no record keyed to this identifier — ' +
  'it is not a member of that file’s DecisionId union — and that file is ' +
  'another task’s path. Disclosed here in the canon’s own record shape so it can be absorbed ' +
  'without a rewrite, and declared as a gap rather than filed under a neighbouring identifier. ' +
  'This module’s unit suite asserts the absence, so the disclosure moves to the canon the moment ' +
  'the canon holds it.'

export const CC02_DISCLOSURES = [
  {
    decisionRef: 'DEC-CCWRITE-001',
    question:
      'Whether the closed set of ten operational actions is complete, given the writes that originate on this surface and sit outside it. Manual close of a stuck run is one of them, and it is row 8 of this module’s matrix.',
    readings: [
      {
        text: 'The set is closed at ten as a set of operational actions, yet several writes originate on this surface and sit outside it: report-format authoring, which the source explicitly excludes; manual close of a stuck run, which the source explicitly excludes; prior-case relevance marks; and optional one-tap feedback on agent outputs.',
        locator: 'DEC-CCWRITE-001 · L38713',
      },
      {
        text: 'The source describes the ten as the closed set of Command Center operational actions, and separately places at least two writes that originate on this surface outside that set.',
        locator: 'the contradiction as §21.2 states it · L35350',
      },
      {
        text: 'Manual close and its exclusion from the ten: `SoW Fact — §6.2.6`, recorded under `DEC-CCWRITE-001`.',
        locator: '§21.5 Source status · L36614',
      },
      {
        text: 'Roles prohibited: Tenant Admin, Read-only Auditor, Worker; and every role from performing it as one of the ten operational actions.',
        locator: 'FUNC-CC-0204-2-1 · L36551',
      },
      {
        text: 'Writes originating on this surface outside the ten erode the scope promise. Mitigation: the closed set counts operational actions only. Recorded as `DEC-CCWRITE-001` with an option to restate the closed set.',
        locator: 'RISK-CC-010 · L38990',
      },
    ],
    adopted:
      'Nothing is adopted, because this module draws no control whose behaviour turns on the answer. ' +
      'Row 8 is offered as a LINK and never as an act — CC02_MANUAL_CLOSE_LINK carries a destination ' +
      'and a precondition and no handler — and that is true under either reading: a write that is ' +
      'inside the ten is still executed through the owning Hub service, and a write that is outside ' +
      'them is still not this surface\'s to perform. What the disclosure prevents is a later task ' +
      'reading row 8\'s permissive head as licence to draw the close here.',
    whyHere:
      'The Supervisor cell of row 8 (L36459) opens `Allowed with conditions`, and a reader of the ' +
      'matrix alone sees a permission granted to two roles. The card names the governing decision ' +
      'nowhere in the matrix — only at L36551 and L36614 — so the cell reads as settled where it is ' +
      'read.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly Cc02Disclosure[]

/**
 * THE TWO DECISIONS §21.5 TOUCHES THAT ARE ALREADY HELD, AND WHO HOLDS THEM.
 *
 * Both were candidates for a record here and both would have been a SECOND
 * SPELLING of a ruling that already exists — the defect this build records
 * most often. Exported so the unit suite asserts each holder still holds it:
 * the moment one is removed, this module becomes the place that has to grow
 * the spelling, and the suite says so rather than leaving a silent gap.
 */
export interface Cc02DecisionHeldElsewhere {
  readonly decisionRef: string
  /** Shipped files carrying the full record. Never one of this module's. */
  readonly heldBy: readonly string[]
  /**
   * A frozen-source locator every holder must carry, so "holds it" means the
   * record and not merely the identifier. The first writing of the gate over
   * this register asked only that each holder's text contained the
   * identifier — and passed when `heldBy` was pointed at THIS FILE, which
   * names all three. A pointer that can point at itself is not a pointer.
   */
  readonly heldByLocator: string
  /** Why a record here would add nothing. */
  readonly whyNotHere: string
}

export const CC02_DECISIONS_HELD_ELSEWHERE = [
  {
    decisionRef: 'DEC-STUCK-001',
    heldBy: [
      'src/frontline/modules/fl-b11/service.ts',
      'src/surfaces/doh/modules/doh-06/matrix.ts',
    ],
    heldByLocator: 'L5255',
    whyNotHere:
      'Both carry the card at L5253-L5261 with Reading A (L5255), Reading B (L5256), the options ' +
      '(L5258), the recommendation (L5259) and AC-RUN-004 refusing both (L7128). This module reaches ' +
      'the decision through the coverage map rather than through §21.5 — AC-COV-093 (L4371) puts it ' +
      'on the §6.2 row, and §6.2 is this card\'s Source section (L36433) — and what it owes is not a ' +
      'third record but a refusal to route a manual close into either state. See CC02_RUN_STATES.',
  },
  {
    decisionRef: 'DEC-REFRESH-001',
    heldBy: ['app/super-admin/tenant-configuration-registry/fixtures.ts'],
    heldByLocator: 'L35839',
    whyNotHere:
      'That registry already carries the tension in full — the floor against the "shorter is ' +
      'stricter" direction, cited to L12899 and L35839, with the entry rule stated and no clamping ' +
      'built. Row 6 of this matrix (L36457) prohibits configuring the interval in EVERY column, so ' +
      'this ' +
      'module draws no control the decision governs; what it renders is the interval\'s consequence, ' +
      'a marker whose age grows, and an age is not a promise about the next refresh.',
  },
] as const satisfies readonly Cc02DecisionHeldElsewhere[]
