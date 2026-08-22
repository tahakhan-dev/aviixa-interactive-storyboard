import type { DecisionReading } from '@/disclosure/decisions'
import type { RoleId } from '@/domain/roles'
import { CC_LOCAL_DISCLOSURES, type CcLocalDisclosure } from '@/surfaces/cc/decisions/disclosure'
import { CC_LINK_OUT_CELLS, type CcLinkOutCell } from '@/surfaces/cc/decisions/link-outs'
import { ccElementAssignment, ccPushedShowsBothTimes } from '@/surfaces/cc/live/model'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen, ccScreenSlug, ccPathname } from '@/surfaces/cc/screens'
import { ccSeam, ccSeamStatus, type CcSeamDefinition, type CcSeamStatus } from '@/surfaces/cc/seams'
import {
  CC10_COLUMNS,
  CC10_MATRIX,
  CC10_RESOLUTION_ROW_ORDINALS,
  cc10Row,
  type Cc10Column,
} from './matrix'

/**
 * `MOD-CC-10` — The Sync-Conflict Review Panel, chapter 21. THE SERVER
 * MODULE: everything the screen renders is built here, and the component is
 * the only thing that crosses to the client.
 *
 * THAT SPLIT IS NOT A STYLE CHOICE. Four Run Player panels shipped in slice 7
 * with `data-testid="fl-panel-undefined"` in the built HTML while every
 * component test passed, because they declared their panel data as a
 * module-scope const in a `'use client'` file — Next.js replaces a client
 * module's exports with client references, so the string fields are gone by
 * the time a server component prerenders them, and a component suite mounts
 * the component and never crosses that boundary. Neither this file, `matrix.ts`
 * beside it, nor `SyncConflictReviewPanel.tsx` carries `'use client'`, and
 * none of the three may acquire one while it exports data.
 *
 * ── WHAT THIS MODULE IS FOR, IN THE SOURCE'S OWN TERMS ───────────────────
 *
 * L38056: "To make automatic conflict resolution reviewable without ever
 * making it blocking, and to prevent a clock-skewed write from silently
 * winning." The panel is a review instrument and NEVER a blocker (L38064),
 * which is why every failure path here ends in the automatic resolutions
 * standing unreviewed rather than in work stopping (L38215).
 *
 * ── THE ONE SAFETY RULE, AND THE SOURCE SAYS SO ITSELF ───────────────────
 *
 * L38072: "The exclusion of skew-flagged conflicts from Resolve All is the
 * module's single most important safety rule and must be enforced at the
 * service, not only in the interface." It is stated four more times —
 * L38068 in the guard paragraph, L38203 as `FUNC-CC-1002-1-3` ("including
 * through direct application-programming-interface calls"), `AC-CC-344`
 * (L38223) "enforced at the service", and L38187 in the security paragraph
 * ("an interface-only exclusion would be bypassable and would defeat the
 * guard"). Five statements of one rule is the source insisting.
 *
 * **This storyboard has no service to enforce it in.** So the rule is carried
 * as a stated obligation on the seam below rather than half-implemented in a
 * disabled button, because a disabled button IS the interface-only exclusion
 * the source names and rejects. `CC10_RESOLVE_ALL_EXCLUSION` is the sentence,
 * and the panel renders it where the control would be.
 *
 * ── THE COCKPIT RULE ─────────────────────────────────────────────────────
 *
 * The Command Center owns no operational record. Resolution is action 5 of
 * `MOD-CC-13`'s closed set of ten (L38175, "exercises action 5 of
 * `MOD-CC-13`"; L38669, "Resolve or Resolve All sync conflicts"), executed
 * against "Sync-conflict records on the Delivery Operations Hub" — that same
 * row's own words. Wave 0 declared that seam in `@/surfaces/cc/seams` as
 * `operational-action-set`; this module CONSUMES it and does not restate it.
 */

/* ==================================================================== *
 * IDENTITY, read off the card rather than off the spine, so the two can
 * disagree loudly instead of quietly. `cc10Identity()` asserts they agree.
 * ==================================================================== */

export interface Cc10Identity {
  readonly moduleId: 'MOD-CC-10'
  /** The `**Identity.**` paragraph's own `Name:` field. */
  readonly name: string
  readonly purpose: string
  readonly userBenefit: string
  /** The `Source section` the identity paragraph names. */
  readonly sourceSection: string
  /** `## 21.13` heading line through the rule that closes the card. */
  readonly cardSpan: string
  readonly identityRef: string
  readonly purposeRef: string
  readonly userBenefitRef: string
  /** The §25.5 screen-register row for `SCR-CC-10`. */
  readonly registerRef: string
  /** The §21.1.5 module-inventory row. */
  readonly inventoryRef: string
}

export const CC10_IDENTITY = {
  moduleId: 'MOD-CC-10',
  name: 'Sync-conflict review panel',
  purpose:
    'To make automatic conflict resolution reviewable without ever making it blocking, and to ' +
    'prevent a clock-skewed write from silently winning.',
  userBenefit:
    'A Quality Manager can see every place two records disagreed, what the platform decided, and ' +
    'why, and can flag a wrong resolution into the correction path without work ever having ' +
    'stopped.',
  sourceSection: '§6.11',
  cardSpan: 'L38048-L38243',
  identityRef: 'L38054',
  purposeRef: 'L38056',
  userBenefitRef: 'L38058',
  registerRef: 'L48395',
  inventoryRef: 'L35195',
} as const satisfies Cc10Identity

/**
 * The spine's record for this module, and the screen it owns. Reached through
 * the spine's own accessors so the module id and the screen id are spelled
 * once each, in wave 0's files, and never a second time here.
 */
export const CC10_SPINE = ccModule('MOD-CC-10')
export const CC10_SCREEN = ccScreen('SCR-CC-10')

/**
 * `/command-center/<slug>`, DERIVED. There is no route string in this module.
 *
 * **THE BRIEF FOR THIS TASK NAMED A DIFFERENT ROUTE AND THE SPINE WINS.** The
 * dispatch said `/command-center/sync-conflict-review`; `@/surfaces/cc/modules`
 * declares `slug: 'sync-conflict-review-panel'`, which is also the register's
 * own screen name at L48395 and the inventory's own module name at L35195 —
 * both read "Sync-conflict review panel". Had the directory been built under
 * the brief's shorter name, `CC_NAV` would have published
 * `/command-center/sync-conflict-review-panel` for a directory that does not
 * exist: a 404 in the shipped navigation, fixable only by editing wave 0's
 * spine, which no slice-8 task owns. Deriving the path here means the
 * directory name is the single literal, and the covering gate asserts a
 * directory of exactly that name is on disk.
 */
export const CC10_SLUG: string = (() => {
  const slug = ccScreenSlug(CC10_SCREEN)
  if (slug === null) {
    throw new Error('SCR-CC-10 is owned by MOD-CC-10 and must resolve to a slug.')
  }
  return slug
})()

export const CC10_PATHNAME: string = ccPathname(CC10_SLUG)

/* ==================================================================== *
 * THE SEAM, CONSUMED.
 * ==================================================================== */

export const CC10_SEAM: CcSeamDefinition = ccSeam('operational-action-set')
export const CC10_SEAM_STATUS: CcSeamStatus = ccSeamStatus(CC10_SEAM)

/**
 * The exclusion, as a sentence rather than as a disabled control. `enforcedAt`
 * is `'service'` because the source says so five times and because this
 * storyboard has no service — naming the place the rule must live is the
 * honest statement; drawing a greyed-out button would be the interface-only
 * exclusion L38187 calls bypassable.
 */
export const CC10_RESOLVE_ALL_EXCLUSION = {
  rule:
    'Skew-flagged conflicts are excluded from Resolve All. Bulk acceptance is not review, so a ' +
    'skew-flagged write is resolvable only individually, by a Quality Manager.',
  enforcedAt: 'service',
  whyNotHere:
    'The Command Center owns no operational record and this storyboard runs no resolution ' +
    'service. The exclusion is stated where the control would be, and is not simulated by ' +
    'disabling one: L38187 records that "an interface-only exclusion would be bypassable and ' +
    'would defeat the guard", and a disabled button is exactly that.',
  sourceRefs: ['L38068', 'L38072', 'L38187', 'L38203', 'L38223'],
} as const

/* ==================================================================== *
 * THE STORYBOARD, `SB-CC-21`, TRANSCRIBED.
 *
 * L38144 names it and it occurs EXACTLY ONCE in all 122,241 lines, measured.
 * The dispatch for this task cited the storyboard as `SCR-CC-CONF-01` at
 * L80541 — that identifier appears at L80200, L80300 and L80541, all three in
 * chapter 36, and L80541 sits inside the very span L80485-L80602 the same
 * brief forbids this task to read. Chapter 21's storyboard is `SB-CC-21`, and
 * that is the one transcribed here.
 *
 * ITS ARITHMETIC RECONCILES, WHICH IS WORTH SAYING IN A SLICE OF NINE COUNT
 * CONTRADICTIONS. The header (L38146) reads "3 conflicts · 1 skew-flagged ·
 * showing 3 of 3"; the panel control (L38157) reads "Resolve All (2 ordinary
 * conflicts; 1 skew-flagged conflict excluded)". 3 − 1 = 2, and "3 of 3" says
 * the cap does not bite in this example — which is why the example cannot
 * illustrate `DEC-CONFLICTCAP-001` and the decision is disclosed separately.
 * ==================================================================== */

export interface Cc10StoryboardVersion {
  readonly version: string
  readonly value: string
  readonly deviceTimestamp: string
  readonly serverReceipt: string
  readonly worker: string
  readonly device: string
  readonly sourceRef: string
}

/** Header L38150, separator L38151, data L38152-L38153 — TWO rows, six columns. */
export const CC10_STORYBOARD_VERSIONS = [
  {
    version: 'A',
    value: 'Complete',
    deviceTimestamp: '10:14:02',
    serverReceipt: '10:22:14',
    worker: 'Maya',
    device: 'TAB-014',
    sourceRef: 'L38152',
  },
  {
    version: 'B',
    value: 'Complete',
    deviceTimestamp: '10:16:41',
    serverReceipt: '10:16:44',
    worker: 'Ahmed',
    device: 'TAB-015',
    sourceRef: 'L38153',
  },
] as const satisfies readonly Cc10StoryboardVersion[]

export const CC10_STORYBOARD = {
  id: 'SB-CC-21',
  title: 'one conflict entry',
  titleRef: 'L38144',
  header: '3 conflicts · 1 skew-flagged · showing 3 of 3',
  headerRef: 'L38146',
  entry:
    'Containment checklist item 3 · `RUN-2026-08-14-A` · affected record: containment checklist ' +
    'instance `CHK-8841`',
  entryRef: 'L38148',
  verdict:
    'Winning write: version B, by device timestamp. Clock skew: version A device clock within ' +
    'threshold. Status: automatically resolved, unreviewed.',
  verdictRef: 'L38155',
  entryControls: ['Accept', 'Flag this resolution as wrong'],
  panelControl: 'Resolve All (2 ordinary conflicts; 1 skew-flagged conflict excluded)',
  controlsRef: 'L38157',
  /** Read off the header and the control, not restated: 3 total, 1 flagged, 2 ordinary. */
  totalConflicts: 3,
  skewFlagged: 1,
  ordinaryConflicts: 2,
} as const

/* ==================================================================== *
 * THE SECOND TREATMENT. STATED, NOT READ.
 * ==================================================================== */

/**
 * §36.6 carries a second, conflicting treatment of `MOD-CC-10` at
 * **L80485-L80602**, with a NINE-row matrix whose persona columns run in the
 * opposite order to chapter 21's. It is built by a different implementer and
 * **no cell of it is transcribed, quoted, reconciled or merged here.**
 *
 * The split is deliberate. The two treatments disagree, the source does not
 * settle the disagreement, and one author holding both would reconcile it —
 * which is a ruling this build is not permitted to make. What this file is,
 * therefore, is the chapter-21 reading of `MOD-CC-10` and not the whole of
 * what the source says about it. Anything reading `CC10_MATRIX` as the
 * module's only permission table is reading it wrong, and this record is here
 * so that cannot happen silently.
 */
export const CC10_SECOND_TREATMENT = {
  where: '§36.6',
  span: 'L80485-L80602',
  matrixRows: 9,
  columnOrder: 'the opposite of chapter 21’s — Worker first, Tenant Admin fourth',
  heldBy: 'a separate task, deliberately not this one',
  statement:
    'A second, conflicting treatment of MOD-CC-10 exists at L80485-L80602 with a nine-row ' +
    'permission matrix whose persona columns run in the opposite order. It is transcribed ' +
    'elsewhere. The two disagree on questions the source does not settle, so neither is merged ' +
    'into the other and this file carries the chapter-21 reading only.',
} as const

/* ==================================================================== *
 * LOCAL DISCLOSURE, in the canon's own shape.
 *
 * `src/disclosure/decisions.ts` holds twenty-nine records and neither of the
 * two below. `DecisionReading` is IMPORTED from it rather than redeclared, the
 * gap is declared on `canonNote`, and `tests/unit/cc-10.test.ts` asserts both
 * identifiers are ABSENT from the canon — so the moment a later task lifts
 * them in, this suite goes red and forces the switch rather than leaving two
 * spellings of one decision on the tree. `Stu14LocalDisclosure` set this
 * idiom; the canon file is another task's path and is read here, never
 * written.
 * ==================================================================== */

export interface Cc10LocalDisclosure {
  readonly decisionRef: 'DEC-CONFLICTCAP-001' | 'DEC-PLUS-001'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly adopted: string
  /** Named on screen as this build's pick, never as the source's answer. */
  readonly clientDelegated: true
  readonly canonNote: string
}

export const CC10_DISCLOSURES = [
  {
    decisionRef: 'DEC-CONFLICTCAP-001',
    question:
      'What is the conflict list’s cap, how does a reviewer reach conflicts beyond it, and what ' +
      'does Resolve All do about them?',
    readings: [
      {
        text:
          'The source states the list is "capped" and carries a total count, and that Resolve All ' +
          'accepts every LISTED ordinary conflict. It states neither the cap’s value, nor how a ' +
          'reviewer reaches conflicts beyond it, nor what happens to those conflicts when Resolve ' +
          'All is used. The decision is raised in this module’s own section and is new here.',
        locator: 'DEC-CONFLICTCAP-001 · L38076 · panel paragraph L38074',
      },
      {
        text:
          'Option (a) — state the cap and page, with Resolve All acting on the current page only ' +
          'and saying so. Option (b) — state the cap and have Resolve All act on every ordinary ' +
          'conflict regardless of listing, with a confirmation stating the true count. Option (c) ' +
          '— make the cap a tenant setting above a platform floor. The blueprint recommends (a), ' +
          'as a Recommendation — R&D, because it keeps the action’s effect identical to what the ' +
          'reviewer can see; it objects to (b) as the same bulk-acceptance-is-not-review problem ' +
          'the skew-flagged exclusion exists to prevent.',
        locator: 'DEC-CONFLICTCAP-001 · L38076 · alternate path L38119',
      },
      {
        text:
          'The risk register states the exposure rather than the mechanism: conflicts beyond the ' +
          'list cap remain unreviewed and unreachable.',
        locator: 'RISK-CC-005 · L38985 · decision register row L38955',
      },
    ],
    adopted:
      'No cap value is invented. The panel states that the list is capped, that the cap’s value ' +
      'and the paging behaviour are open under DEC-CONFLICTCAP-001, and that this build shows the ' +
      'storyboard’s own "3 of 3" — a case where the cap does not bite and therefore cannot ' +
      'illustrate the question. Decision owner, from the register row: the client’s product owner ' +
      'with the quality lead.',
    clientDelegated: true,
    canonNote:
      'The shared decision canon carries no record for DEC-CONFLICTCAP-001. Declared here as a ' +
      'gap for the canon rather than filed under a neighbouring identifier, and the covering gate ' +
      'asserts its absence so the disclosure cannot outlive the gap.',
  },
  {
    decisionRef: 'DEC-PLUS-001',
    question:
      'What does the plus notation mean — "Quality Manager and above" — across five additive, ' +
      'non-hierarchical roles?',
    readings: [
      {
        text:
          'Reading A: the plus form is a shorthand for an ordering across the five roles, in which ' +
          'a Quality Manager can do everything a Supervisor can do and more.',
        locator: 'DEC-PLUS-001 · L14670',
      },
      {
        text:
          'Reading B: the plus form is a shorthand for an enumerated set, and the roles remain ' +
          'unordered and purely additive, so "Supervisor+" means "the enumerated set of role types ' +
          'that hold this action", which the matrices happen to abbreviate. The source adds that ' +
          'both readings are visible in it, that the blueprint does not resolve them, and that ' +
          '"every fragment that consumes an authority matrix must reference DEC-PLUS-001 and ' +
          'preserve both readings."',
        locator: 'DEC-PLUS-001 · L14670',
      },
      {
        text:
          'It reaches this module twice, and both times through the ACTION set rather than through ' +
          'the matrix: action 5’s authority column reads "Quality Manager and above; Supervisors ' +
          'view", and FUNC-CC-1003-2-1 reads "Roles allowed: Quality Manager only under ' +
          'DEC-PLUS-001". The readiness register records the Command Center action set as blocked ' +
          'on precisely this decision.',
        locator: 'L38669 · FUNC-CC-1003-2-1 L38209 · readiness row L116624',
      },
    ],
    adopted:
      'Nothing is resolved. It does not have to be, HERE, and that is the finding rather than the ' +
      'evasion: chapter 21’s matrix uses no plus notation at all — it names all five roles ' +
      'explicitly in all forty cells, so this module’s own permission table is determinate where ' +
      'the closed action set it exercises is not. The panel therefore renders the matrix as ' +
      'written and discloses that the authority column of action 5, which it reaches THROUGH ' +
      'MOD-CC-13, inherits the open ordering. Decision owner: the client, with JBS product ' +
      '(L119059).',
    clientDelegated: true,
    canonNote:
      'The shared decision canon carries no record for DEC-PLUS-001, though the blueprint says at ' +
      'L3836 and L4379 that it is "carried in this blueprint\'s decision canon" — the blueprint\'s ' +
      'canon, which is a chapter of the source, not this repository\'s. Declared here as a gap, ' +
      'and the covering gate asserts its absence from src/disclosure/decisions.ts.',
  },
] as const satisfies readonly Cc10LocalDisclosure[]

/* ==================================================================== *
 * DERIVED READINGS OF THE MATRIX. Computed, never restated.
 * ==================================================================== */

/**
 * `AC-CC-348` (L38227): "Supervisors can view the panel and cannot reach any
 * resolution endpoint." Both clauses read off the matrix rather than asserted:
 * rows 1 and 2 give the Supervisor `Read-only`, and rows 3, 4 and 5 — the
 * three resolution rows — give `Explicitly prohibited`.
 *
 * Row 6 is the reason this is computed from `CC10_RESOLUTION_ROW_ORDINALS` and
 * not from the word "Resolve": the Supervisor MAY flag an automatic resolution
 * as wrong (L38089, `Allowed`), and flagging opens the append-only correction
 * path rather than altering the sync result (L38113, `AC-CC-346` L38225). A
 * substring rule over the capability text would catch "resolution" in row 6 and
 * report the criterion violated by the source's own matrix.
 */
export function cc10SupervisorHoldsNoResolutionPower(): boolean {
  return CC10_RESOLUTION_ROW_ORDINALS.every(
    (n) => cc10Row(n).cells.Supervisor.token === 'Explicitly prohibited',
  )
}

/**
 * The two roles `@/surfaces/cc/access` excludes from the whole surface, read
 * back out of THIS matrix. They are prohibited in all eight rows here and shut
 * out at the door there, from two independent places in the source — L34963
 * and L34965 for the door, L38084-L38091 for the cells — and the gate asserts
 * the two agree rather than either file asserting it alone.
 */
export function cc10ColumnsProhibitedThroughout(): readonly string[] {
  return ['Tenant Admin', 'Supervisor', 'Quality Manager', 'Read-only Auditor', 'Worker'].filter(
    (c) =>
      CC10_MATRIX.every(
        (row) => row.cells[c as keyof typeof row.cells].token === 'Explicitly prohibited',
      ),
  )
}

/* ==================================================================== *
 * THE CAP, RENDERED — AND IT IS ASKED TWICE, UNDER TWO IDENTIFIERS.
 * ==================================================================== */

/**
 * The panel body owed the rendered cap and did not carry it. It does now,
 * and what it renders is the QUESTION rather than a number.
 *
 * TWO IDENTIFIERS, BOTH RAISED BY THE FROZEN SOURCE, NEITHER THIS BUILD'S.
 * `DEC-CONFLICTCAP-001` is raised at L38076 inside this module's own section
 * and registered at L38955. `DEC-SYNC-006` carries its own card — question,
 * three options, recommendation, trade-offs and owner — at L80504 in §36.6,
 * is carved out as the cap value's source status at L80587, repeated in the
 * traceability paragraph at L80601, and gets a consolidated §37B register row
 * at L81737. The source's own decision index records them as first raised in
 * different chapters: L115407 gives `DEC-CONFLICTCAP-001` to chapter 21 and
 * L115111 gives `DEC-SYNC-006` to chapter 36.
 *
 * NEITHER IDENTIFIER IS RESPELLED HERE, AND THAT IS A GATE RATHER THAN A
 * PREFERENCE. `src/offline/decisions-37b.ts` holds `DEC-SYNC-006`'s record;
 * `tests/unit/offline-decisions-37b.test.ts` walks all of `src/` looking for
 * a `decisionRef` field bearing that identifier, and goes red on any file
 * carrying one without being named in `DEC_37B_ALSO_DISCLOSED_IN`, which is
 * that module's array and not this task's. NOTE FOR ANY LATER HAND EDITING
 * THIS COMMENT: that scan is a plain substring test over the whole file, so a
 * COMMENT spelling the field-and-value pair trips it exactly as a declaration
 * does. Writing the pair out here once turned that suite red, which is why
 * this paragraph describes it instead. So this module POINTS, and the
 * surface record in `src/surfaces/cc/decisions/disclosure.ts` — which already
 * carries both readings with both locators and chooses neither — is what the
 * panel renders.
 *
 * THE STORYBOARD PRINTS A NUMERAL AND SAYS IT IS NOT ONE. L80541's overflow
 * state reads "Showing the 50 most recent of 912 conflicts" and the same
 * sentence ends "with the numeral standing for whatever `DEC-SYNC-006`
 * settles". Fifty is an illustration. Chapter 21's own storyboard header
 * (L38146) reads "3 conflicts · 1 skew-flagged · showing 3 of 3", where the
 * cap does not bite at all — so neither storyboard can supply a value, and
 * this build renders none.
 */
export const CC10_CAP = {
  whatIsRendered:
    'The list is capped and carries a total count. This panel renders the storyboard’s own ' +
    'header, "3 conflicts · 1 skew-flagged · showing 3 of 3", in which the cap does not bite — so ' +
    'nothing on this screen illustrates the cap, and nothing on it states a cap value.',
  whatIsRenderedRef: 'L38146',
  whyNoValue:
    'No cap value is invented. The other storyboard of this same panel prints "Showing the 50 ' +
    'most recent of 912 conflicts" and says in the same sentence that the numeral stands for ' +
    'whatever the decision settles. A build that read fifty as the cap would be shipping a ' +
    'contractual value the source explicitly declined to state.',
  whyNoValueRef: 'L80541',
  askedTwice:
    'The same cap is asked twice, under two identifiers the source raises in two chapters, with ' +
    'two owners and two recommendations that do not agree. Both readings are carried below and ' +
    'neither is chosen.',
  /** The surface record that carries both readings. Read, never rewritten. */
  bothReadingsHeldBy: 'src/surfaces/cc/decisions/disclosure.ts',
  /** `DEC-SYNC-006`'s own record. Pointed at; its spelling is not repeated. */
  secondIdentifierHeldBy: 'src/offline/decisions-37b.ts',
  sourceRefs: ['L38076', 'L38955', 'L80504', 'L80541', 'L80587', 'L80601', 'L81737'] as const,
} as const

/**
 * The surface-level record for this panel's cap, READ from wave-1's file.
 * Found by identifier rather than by index so a reordering of that array
 * cannot silently hand this panel a different decision.
 */
export const CC10_CAP_DISCLOSURE: CcLocalDisclosure = (() => {
  const found = CC_LOCAL_DISCLOSURES.find((d) => d.decisionRef === 'DEC-CONFLICTCAP-001')
  if (found === undefined) {
    throw new Error(
      'src/surfaces/cc/decisions/disclosure.ts no longer carries DEC-CONFLICTCAP-001. That record ' +
        'is the only place on this tree holding BOTH identifiers the source raises for this ' +
        'panel’s cap with both locators and no winner; without it the panel would either render ' +
        'one of the two as though it were the source’s answer, or mint a second spelling of the ' +
        'other, and both are defects this build records by name.',
    )
  }
  return found
})()

/* ==================================================================== *
 * ACTION 5 IS STATED THREE TIMES AND THE THREE DISAGREE.
 * ==================================================================== */

/**
 * This module's own capability is action 5 of the closed set of ten, and
 * three tables in the frozen source answer who holds it. They do not agree,
 * and no acceptance criterion in this build tests that they should.
 *
 * The DISPATCH named one cell of one disagreement — the Quality Manager's.
 * Read header-keyed across all five persona columns, §25.4's row differs
 * from §21.16's on FOUR of the five, and the Tenant Admin pair is the
 * ABSENT-versus-DISABLED conflict this build has carried since slice 4:
 * `src/ui/WriteControl.tsx` draws `explicitlyProhibited` as nothing at all
 * and `unavailable` as a disabled control carrying its reason, so the two
 * tables do not merely use different words, they render oppositely.
 *
 * The Supervisor is the one column all three agree on: `Read-only`, three
 * times. It is recorded here for the same reason the skew near-miss is
 * recorded in the second treatment — so the next reader does not rediscover
 * the agreement and file it as a fifth divergence.
 */
export interface Cc10Action5Statement {
  /** Which table, in the source's own section number. */
  readonly table: string
  /** That table's line for the action-5 row. */
  readonly sourceRef: string
  /** The row's own name for the action, verbatim. Three tables, three spellings. */
  readonly actionText: string
  /** The five persona cells, verbatim, keyed by this build's own column words. */
  readonly cells: Readonly<Record<Cc10Column, string>>
}

export const CC10_ACTION_5_STATEMENTS = [
  {
    table: '§21.1.2 surface-level permission matrix',
    sourceRef: 'L35011',
    actionText: 'Resolve or Resolve All sync conflicts',
    cells: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Read-only',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
  },
  {
    table: '§21.16 MOD-CC-13 action matrix',
    sourceRef: 'L38686',
    actionText: 'Resolve or Resolve All sync conflicts',
    cells: {
      'Tenant Admin': 'Explicitly prohibited',
      Supervisor: 'Read-only',
      'Quality Manager': 'Allowed',
      'Read-only Auditor': 'Explicitly prohibited',
      Worker: 'Explicitly prohibited',
    },
  },
  {
    table: '§25.4 actions and permissions across the ten operational actions',
    sourceRef: 'L48448',
    actionText: 'Resolve or Resolve-All sync conflicts',
    cells: {
      'Tenant Admin': 'Unavailable',
      Supervisor: 'Read-only',
      'Quality Manager':
        'Allowed with conditions — skew-flagged conflicts are excluded from Resolve All',
      'Read-only Auditor': 'Not applicable — no Command Center access',
      Worker: 'Not applicable — different surface',
    },
  },
] as const satisfies readonly Cc10Action5Statement[]

/**
 * The columns on which the three statements do NOT all agree, computed off
 * the statements rather than listed beside them — a hand-written list is a
 * second thing to keep in step and it will not be kept in step.
 */
export const CC10_ACTION_5_DIVERGENT_COLUMNS: readonly Cc10Column[] = CC10_COLUMNS.filter(
  (column) => new Set(CC10_ACTION_5_STATEMENTS.map((s) => s.cells[column])).size > 1,
)

/**
 * `Resolve-All` against `Resolve All` — a hyphen — which is why the three
 * rows above cannot be joined by their action name. Computed, so it states
 * what the three `actionText` fields actually are.
 */
export const CC10_ACTION_5_NAME_SPELLINGS = [
  ...new Set(CC10_ACTION_5_STATEMENTS.map((s) => s.actionText)),
] as const satisfies readonly string[]

/* ==================================================================== *
 * THE FRESHNESS CLASS, CONSUMED.
 * ==================================================================== */

/**
 * `Sync-conflict event` is a **Pushed** element on the surface's class
 * assignment table, and its marker obligation is `Both device timestamps and
 * server receipt` — THREE times, not two. The dispatch for this task dropped
 * `and server receipt`, which is the same shape as the `Report figures`
 * error wave 0 recorded: a paraphrase true of the row and false of its words.
 *
 * The class and the obligation are READ from wave-0's assignment table
 * rather than restated, and `ccPushedShowsBothTimes` is what checks the
 * storyboard's own version table meets the obligation. No `LiveFreshnessMarker`
 * is mounted: a marker needs a device count, an offline count and an age,
 * this panel has none of the three, and inventing them would render an
 * illustrative number as a value — which is the very defect the cap section
 * above refuses.
 */
export const CC10_FRESHNESS = ccElementAssignment('Sync-conflict event')

/** The storyboard's own two rows, checked against the obligation. */
export const CC10_FRESHNESS_MET: boolean = CC10_STORYBOARD_VERSIONS.every((v) =>
  ccPushedShowsBothTimes({ originTime: v.deviceTimestamp, receiptTime: v.serverReceipt }),
)

/* ==================================================================== *
 * ONE CELL OF THIS MATRIX NEEDS A LINK RATHER THAN A CONTROL.
 * ==================================================================== */

/**
 * Row 8's Tenant Admin cell is `Explicitly prohibited` and then names where
 * the act lives — "a tenant setting in the Delivery Operations Hub tenant
 * administration area" (L38091). `src/ui/WriteControl.tsx` renders
 * `explicitlyProhibited` as nothing at all, so a faithful transcription
 * produces an empty cell where the source names a destination, and
 * `AC-CC-301` (L37802) requires each such control to BE a link.
 *
 * The cell is wave-1's measured population-B row, not a second reading of
 * L38091 written here. It is looked up by id and the lookup throws rather
 * than falling back, because a silent fallback is how the link disappears.
 */
export const CC10_CLOCK_SKEW_LINK_OUT: CcLinkOutCell = (() => {
  const found = CC_LINK_OUT_CELLS.find((c) => c.id === 'cc-10-clock-skew-threshold')
  if (found === undefined) {
    throw new Error(
      'CC_LINK_OUT_CELLS no longer carries cc-10-clock-skew-threshold. That row (L38091) is this ' +
        "module's only population-B cell: prohibited, and naming the Delivery Operations Hub " +
        'tenant administration area as the place the act lives. Without it the cell renders as ' +
        'nothing at all, which is what AC-CC-301 forbids.',
    )
  }
  return found
})()

/**
 * The role the link-out model is asked about, STATED rather than inferred,
 * and it is not an access decision — `evaluateCCAccess` answers that at the
 * door on a real request. The register's own row for this screen (L48395)
 * reads "Supervisor for viewing, Quality Manager for resolution", and the
 * Quality Manager is the role this module's matrix grants the panel to
 * outright, so it is the role the rendering is shown for.
 */
export const CC10_LINK_OUT_VIEWER_ROLE: RoleId = 'QUALITY_MANAGER'

/* ==================================================================== *
 * WHAT THIS SCREEN NOW MOUNTS, AND ONE SEAM THAT STILL READS OPEN.
 * ==================================================================== */

/**
 * L38793 enumerates the modules whose screens exercise one or more of the
 * ten operational actions and names `MOD-CC-10` for 5. So this screen mounts
 * `MOD-CC-13`'s action rail, and does not implement resolution itself.
 *
 * THE SEAM REGISTRY STILL REPORTS THIS SEAM OPEN, AND IT IS NOT THIS TASK'S
 * TO CLOSE. `ccSeamStatus` derives status from `ownerSlice <= THIS_SLICE`,
 * and `src/surfaces/cc/seams.ts` still declares `THIS_SLICE = 8` while both
 * seams name `ownerSlice: 9`. `MOD-CC-13` has now landed — its rail is the
 * component mounted on this screen — so the derivation is stale rather than
 * wrong, and the file is another task's path. Reported, not edited; and the
 * panel says so on screen rather than rendering a contradiction silently.
 */
export const CC10_ACTION_RAIL_MOUNT = {
  railComponent: 'src/surfaces/cc/modules/cc-13/Cc13ActionRail.tsx',
  whyHere:
    'The interconnection line for the closed action set names this module for action 5, so this ' +
    'screen is one of the seven the rail mounts on. MOD-CC-13 owns no route of its own: AC-CC-040 ' +
    'forbids a fourteenth module route and the spine gives it no slug, so the rail can only ever ' +
    'reach a client by mounting inside another module’s screen.',
  whyHereRef: 'L38793',
  whyNotTheOtherRail:
    'Two rails exist deliberately. src/surfaces/cc/actions/ActionRail.tsx is the module CARD and ' +
    'renders the two §21.16 tables as data; this is the control rail SB-16-02 draws, ten controls ' +
    'in three visual states. Neither is the other’s second spelling.',
  seamStillReadsOpen:
    'The seam registry still reports the operational-action-set seam OPEN, because it derives ' +
    'status from a slice number that has not been advanced past 8 while both of its rows name ' +
    'slice 9 as their owner. MOD-CC-13 has landed and its rail is mounted above. The seam file is ' +
    'not this module’s to edit, so the staleness is stated here rather than corrected there.',
} as const

/**
 * §36.6's treatment of this module is now rendered on this screen, beneath
 * chapter 21's. It was imported by no page and no component test when this
 * task opened it, which is the difference between a disclosure existing in
 * the tree and a disclosure being made to a client.
 */
export const CC10_SECOND_TREATMENT_WIRED = {
  component: 'src/surfaces/cc/modules/cc-10-s366/SecondTreatmentDisclosure.tsx',
  statement:
    'Both treatments are on this screen and neither is merged into the other. The chapter-21 ' +
    'matrix above is eight rows with the persona columns running Tenant Admin first; the §36.6 ' +
    'matrix below is nine rows with the same five columns running Worker first. They disagree on ' +
    'four questions, all four are shown with both locators, and none of the four is answered here.',
  wasReachableBefore: false,
} as const
