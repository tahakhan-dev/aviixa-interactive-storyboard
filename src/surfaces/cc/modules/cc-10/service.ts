import type { DecisionReading } from '@/disclosure/decisions'
import { ccModule } from '@/surfaces/cc/modules'
import { ccScreen, ccScreenSlug, ccPathname } from '@/surfaces/cc/screens'
import { ccSeam, ccSeamStatus, type CcSeamDefinition, type CcSeamStatus } from '@/surfaces/cc/seams'
import { CC10_MATRIX, CC10_RESOLUTION_ROW_ORDINALS, cc10Row } from './matrix'

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
  cardSpan: 'L38048-L38246',
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
