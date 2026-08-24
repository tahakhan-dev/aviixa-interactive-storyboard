import {
  CC13_ACTIONS,
  CC13_TOKENS,
  CC13_TOKEN_OUTCOME,
  cc13Action,
  type Cc13Column,
  type Cc13Ordinal,
  type Cc13Token,
} from '@/surfaces/cc/actions/action-set'
import { CC_CLAIMED_SLUGS, CC_MODULE_SPINE, ccModule, type CcModuleId } from '@/surfaces/cc/modules'
import { dohModuleById } from '@/surfaces/doh/modules'

/* ==================================================================== *
 * `MOD-CC-13` — THE MODULE TREATMENT: HOW THE TEN ARE RENDERED, AND
 * WHERE.
 *
 * WHAT IS ALREADY BUILT AND IS NOT REBUILT HERE. Wave 0 shipped
 * `src/surfaces/cc/actions/` — both §21.16 tables transcribed header-keyed
 * and counted, the four absolute exclusions, the `AC-CC-407` gap,
 * `CC13_OWNING_PLACES`, the writes-outside-the-ten register, the per-device
 * propagation roll-up, and `ActionRail.tsx`, which renders all of that as
 * the module's CARD. Those files are pinned and are read here, never
 * written. `readings.ts` beside this file adds the two other tables that
 * answer the same permission question; this file adds the rail's own
 * behaviour and its mounting, and nothing else.
 *
 * ── THE RAIL IS SPECIFIED IN CHAPTER 16, NOT IN §21.16 ──────────────────
 *
 * §21.16 says what the ten actions ARE. What the rail LOOKS LIKE is
 * `SB-16-02` at L20195, its worked example at L20197, and the source's own
 * named test `TEST-16-13` at L20238. Everything in `CC13_RAIL_SPEC` below is
 * quoted from those three lines. The module card's own storyboard, `SB-CC-24`
 * at L38765, is action 8's reassignment panel — a different drawing of a
 * different thing, and not this.
 *
 * ── THREE VISUAL STATES, AND ABSENT IS THE NARROW ONE ───────────────────
 *
 * L20195: "For the acting person, each renders in one of three visual
 * states: enabled; disabled with an inline reason; or absent only where the
 * action is `Not applicable` to the selected object, which is stated in a
 * tooltip rather than left as an empty space."
 *
 * ABSENT IS RESERVED FOR THE OBJECT, NOT THE ROLE. A role refusal is
 * "disabled with an inline reason" — the second state — because the word in
 * the sentence is "only". That is the OPPOSITE of what this build's shared
 * write-control does, and the inversion is recorded rather than repaired in
 * a file this task does not own; see `CC13_ABSENCE_INVERSION`.
 *
 * ── ROW 4 IS NOT A DISABLED CONTROL. IT IS A DIFFERENT CONTROL ──────────
 *
 * The single sharpest thing in this module, and it is the prefix trap the
 * matrix carries live. Row 4's Supervisor cell (L38685) READS `Explicitly
 * prohibited — may request with a note`. Classified by its token alone the
 * Supervisor gets nothing; classified by its token under this build's write
 * control the Supervisor gets nothing drawn at all. The whole clause says
 * otherwise, and the source says it three times. Each is quoted below on the
 * line of its own citation, and NO QUOTATION HERE NESTS A SECOND PAIR OF
 * DOUBLE QUOTES — `tests/coverage/locator-fidelity.test.ts` reads an escaped
 * inner quote as the end of the span and binds the orphaned tail to the NEXT
 * citation, which reported this file citing L38738 for words that sit at
 * L20195. The labels the source puts in quotation marks are written here
 * without them, and the exact strings are asserted against their lines in
 * `tests/unit/cc-13.test.ts` instead.
 *
 * L20195 — "which is the source's own Supervisor-side behaviour, not a disabled version of the Quality Manager control." That is of the release control rendering, for a Supervisor, as the request-with-note control.
 *
 * L38738 — "The release control is not rendered; the request-with-note control is."
 *
 * L20238 — `TEST-16-13`, which asserts the release label appears as the request label "rather than as a disabled release control."
 *
 * So the token PROHIBITS and the note GRANTS A DIFFERENT ACT, and the rail
 * renders the different act, enabled. `FUNC-CC-1304-1-2` (L38836) is that
 * act's own functionality and its title is the label verbatim.
 *
 * ── THERE IS NO ACTIVE ROLE, SO THE RAIL TAKES A SET OF GRANTS ──────────
 *
 * L20195 — "There is no role indicator, because there is no active role."
 *
 * L20197 — "There is no dropdown asking which role he is using." It works the
 * case: Sam holds Supervisor at an Area AND Quality Manager at a Site.
 *
 * L48458 — "multi-role is additive and the audit records identity, not a role
 * being acted as" — is where the platform states the rule.
 *
 * `heldColumns` is therefore a SET, never one role. Reducing it asks whether
 * ANY grant the person holds permits the act, which needs no ordering over
 * the four tokens and asserts none. Which tokens permit is DERIVED from wave
 * 0's `CC13_TOKEN_OUTCOME` — the same two outcomes `@/policy/decision` puts
 * in its own acting set — so a token remapped there changes this and a
 * second opinion cannot form here.
 * ==================================================================== */

/**
 * The three states L20195 names, in its own words and its own order. Closed:
 * a fourth would be this build adding a rendering the storyboard does not
 * describe.
 */
export const CC13_RAIL_STATES = [
  'enabled',
  'disabled',
  'absent',
] as const satisfies readonly string[]

export type Cc13RailState = (typeof CC13_RAIL_STATES)[number]

/**
 * The scope filter that sits above the rail. Two values, both L20195's own
 * words — "the current scope filter — Site or Area". Not a `string`: a third
 * value would be a scope the storyboard does not offer.
 */
export const CC13_SCOPE_FILTERS = ['Site', 'Area'] as const satisfies readonly string[]

export type Cc13ScopeFilter = (typeof CC13_SCOPE_FILTERS)[number]

/** The rail's stated behaviour, each clause with the line that carries it. */
export const CC13_RAIL_SPEC = {
  storyboard: 'SB-16-02',
  screenName: 'SCR-CC-ACTIONS',
  sourceRef: 'L20195',
  ordering: 'The rail lists the ten operational actions in their canonical order.',
  everyActionShown: 'The action rail shows all ten actions.',
  everyActionShownRef: 'L20197',
  aboveTheRail:
    "Above the rail sits the person's name and the current scope filter — Site or Area — and nothing else. There is no role indicator, because there is no active role.",
  namedTest: 'TEST-16-13',
  namedTestRef: 'L20238',
  /**
   * L20197's own wording for a target the person's grants do not reach. It
   * is a DISABLE with an inline reason, not an absence — the same state a
   * role refusal reaches, arrived at from the scope side.
   */
  outOfScopeReason: 'Out of scope for your grants',
  outOfScopeRef: 'L20197',
} as const

/**
 * ACTION 4'S SUPERVISOR SUBSTITUTION. The label is not this build's
 * paraphrase: L20195 and `TEST-16-13` both write it inside quotation marks
 * and `FUNC-CC-1304-1-2` (L38836) uses it as that functionality's title.
 */
export const CC13_SUPERVISOR_SUBSTITUTION = {
  ordinal: 4,
  column: 'Supervisor',
  /** What the matrix cell says, verbatim. The token prohibits. */
  cellText: 'Explicitly prohibited — may request with a note',
  cellRef: 'L38685',
  /** What the rail draws instead. Enabled, and a different act. */
  substituteLabel: 'Request release with a note',
  substituteRefs: ['L20195', 'L38738', 'L38836'],
  whatItIsNot:
    'Not a disabled version of the Quality Manager control, and not an absence. The token prohibits releasing; the note grants requesting, which is a different act with its own authority and its own audit entry — L38810: "no role can both request and grant a lot release in the same act, because request and release are different actions with different authorities".',
} as const satisfies {
  readonly ordinal: Cc13Ordinal
  readonly column: Cc13Column
  readonly cellText: string
  readonly cellRef: string
  readonly substituteLabel: string
  readonly substituteRefs: readonly string[]
  readonly whatItIsNot: string
}

/* ==================================================================== *
 * WHERE THE RAIL MOUNTS. THE SOURCE NAMES SEVEN MODULES, NOT TWELVE.
 *
 * L38793: "**Interconnections.** Every other module on this surface is
 * where one or more of the ten actions is exercised: `MOD-CC-04` for 1, 2,
 * 4, 7 and 9; `MOD-CC-05` for 2; `MOD-CC-06` for 3; `MOD-CC-09` for 1 and
 * 10; `MOD-CC-10` for 5; `MOD-CC-12` for 6; `MOD-CC-03` for 8."
 *
 * THE SENTENCE AND ITS ENUMERATION DISAGREE. "Every other module on this
 * surface" is twelve; the list names SEVEN. The dispatch for this task says
 * the rail "must mount inside the twelve module screens" — that is the
 * sentence's claim, and the enumeration beneath it supports seven. Both are
 * carried: `CC13_EXERCISED_ON` is the enumeration and
 * `CC13_MOUNT_FINDINGS` records the gap. No module is added to the list to
 * make the sentence true, which would be inventing an interconnection the
 * source does not state.
 *
 * The enumeration is complete over the ACTIONS even though it is incomplete
 * over the modules: all ten ordinals appear at least once. That is checked
 * in `tests/unit/cc-13.test.ts` by set difference against wave 0's ten,
 * never by counting to ten.
 * ==================================================================== */

export interface Cc13ExerciseSite {
  readonly module: CcModuleId
  /** The actions L38793 says are exercised on that module, in its own order. */
  readonly ordinals: readonly Cc13Ordinal[]
}

export const CC13_EXERCISED_ON = [
  { module: 'MOD-CC-04', ordinals: [1, 2, 4, 7, 9] },
  { module: 'MOD-CC-05', ordinals: [2] },
  { module: 'MOD-CC-06', ordinals: [3] },
  { module: 'MOD-CC-09', ordinals: [1, 10] },
  { module: 'MOD-CC-10', ordinals: [5] },
  { module: 'MOD-CC-12', ordinals: [6] },
  { module: 'MOD-CC-03', ordinals: [8] },
] as const satisfies readonly Cc13ExerciseSite[]

export const CC13_EXERCISE_MAP_REF = 'L38793'

/** The modules L38793 names, deduplicated by construction above. */
export const CC13_EXERCISING_MODULES: readonly CcModuleId[] = CC13_EXERCISED_ON.map((s) => s.module)

/** Every ordinal the enumeration reaches. Computed, so it cannot be stale. */
export const CC13_ORDINALS_WITH_A_NAMED_SITE: readonly Cc13Ordinal[] = CC13_ACTIONS.map(
  (a) => a.ordinal,
).filter((o) => CC13_EXERCISED_ON.some((s) => (s.ordinals as readonly Cc13Ordinal[]).includes(o)))

/** The sites that name a given action, for a screen asking what it hosts. */
export function cc13SitesForAction(ordinal: Cc13Ordinal): readonly CcModuleId[] {
  return CC13_EXERCISED_ON.filter((s) =>
    (s.ordinals as readonly Cc13Ordinal[]).includes(ordinal),
  ).map((s) => s.module)
}

/** The actions L38793 names on a given module, or an empty list if it names none. */
export function cc13ActionsOnModule(module: CcModuleId): readonly Cc13Ordinal[] {
  return CC13_EXERCISED_ON.find((s) => s.module === module)?.ordinals ?? []
}

/* ==================================================================== *
 * THE ROUTELESSNESS, ASSERTED AGAINST THE SPINE AND NOT AGAINST A
 * DIRECTORY LISTING.
 *
 * `MOD-CC-13` is the only routeless ACTION module on this surface, and that
 * qualifier is load-bearing: TWO modules claim no slug, not one. `MOD-CC-02`
 * is the other abstention on the spine and it is chrome, not a rail;
 * `MOD-CC-07` DOES claim a route — L48398 names it on `SCR-CC-13` and the
 * navigation diagram at L48412 draws `SCR-CC-13 Learning read view` — and
 * `src/surfaces/cc/modules.ts` gives it `slug: 'learning-read-view'`.
 *
 * THE CHECK IS `CC_CLAIMED_SLUGS`, DELIBERATELY. A gate written against a
 * literal listing of `app/command-center/` would be green today because
 * one directory exists there and red the day any sibling task builds its
 * screen — a gate that fails on somebody else's correct work. The spine is
 * the thing that decides whether this module has a route, so the spine is
 * what is asserted against.
 * ==================================================================== */

export const CC13_ROUTELESSNESS = {
  module: 'MOD-CC-13',
  /**
   * Read off wave 0's spine, which records `slug: null` with its reason.
   * Nothing here changes it, and nothing here reads a directory listing:
   * `app/command-center/` gains a sibling's directory on any day of this
   * slice, and a gate keyed on that listing would go red on their work.
   */
  claimsNoSlug: ccModule('MOD-CC-13').slug === null,
  /** For a gate to difference against the spine rather than against a literal. */
  claimedSlugsOnThisSurface: CC_CLAIMED_SLUGS.length,
  forbiddenBy: 'AC-CC-040',
  forbiddenByRef: 'L35261',
  forbiddenByText:
    'The surface exposes exactly thirteen modules; no fourteenth module route exists.',
  /**
   * THE ROUTELESS SET, READ OFF THE SPINE RATHER THAN COUNTED IN A SENTENCE.
   * Two modules, and the sentence below says "action module" because of it —
   * a bare "the only routeless module" was false the day `MOD-CC-02` landed
   * and no gate could see it, because the claim was prose.
   */
  routelessModules: CC_MODULE_SPINE.filter((m) => m.slug === null).map((m) => m.id),
  onlyRoutelessActionModule:
    "The only routeless ACTION module, not the only routeless module: MOD-CC-02 is the spine's other abstention and it is chrome mounted into a board, not a rail. MOD-CC-07 is not routeless at all: L48398 names it on SCR-CC-13 and the spine gives it slug 'learning-read-view'.",
} as const

/* ==================================================================== *
 * TWO FINDINGS THIS MODULE OWED. ONE IS STILL OPEN; THE SECOND IS CLOSED
 * AND SAYS SO, WHICH IS THE PART THAT WENT WRONG LAST TIME — a finding whose
 * subject was repaired by somebody else and which kept asserting the old
 * state reads as a live defect and is worse than no finding at all.
 * ==================================================================== */

/**
 * THE ABSENCE INVERSION. `src/ui/WriteControl.tsx` renders a `BASE_ROLE`
 * `explicitlyProhibited` as ABSENT — `ProhibitionNotice` with
 * `kind: 'absent'`, a plain note where a control would be — and renders
 * every other refusal, `unavailable` and `notApplicable` alike, as a
 * DISABLED control carrying its reason. L20195 asks for the reverse on this
 * rail: absent is reserved for `Not applicable` to the selected OBJECT, and
 * a role refusal is disabled with an inline reason.
 *
 * NOT REPAIRED, FOR TWO REASONS THAT BOTH HOLD ON THEIR OWN. That file is
 * not this task's and has eight callers on three other surfaces, every one
 * of which would change what it draws. And the general question — whether a
 * role-refused control renders as nothing or as a disabled control with its
 * reason — is UNSETTLED in the frozen source; `WriteControl`'s own header
 * says a source adjudication returned inconsistent at named-test strength.
 * L20195 settles it for THIS RAIL and for nothing else, so the rail applies
 * L20195 through `ProhibitionNotice` — the same component `WriteControl`
 * uses for the same three renderings — rather than forking the write
 * control or bending eight callers to one storyboard's sentence.
 */
export const CC13_ABSENCE_INVERSION = {
  railRule:
    'Absent only where the action is Not applicable to the selected object, stated in a tooltip rather than left as an empty space. A role refusal is disabled with an inline reason.',
  railRuleRef: 'L20195',
  buildRule:
    'src/ui/WriteControl.tsx renders a BASE_ROLE explicitlyProhibited as absent and every other refusal, notApplicable included, as a disabled control with its reason.',
  finding:
    "The two mappings are inverted on both of the outcomes they share. The rail applies L20195 through ProhibitionNotice, which is the component WriteControl itself uses; WriteControl is not edited, because it is another task's file, it has callers on three surfaces, and the general question it declines to settle is genuinely unsettled in the source. L20195 settles it for this rail only.",
} as const

/**
 * THE AUDIT POINTER, AND THE DESTINATION THIS BUILD DOES NOT HAVE.
 *
 * L38657 is the discipline: "every action is a command against a Delivery
 * Operations Hub-owned record, executed through the owning Delivery
 * Operations Hub service, written to the Delivery Operations Hub audit trail
 * — the Command Center is the cockpit, never the engine." Every one of the
 * ten therefore needs BOTH: the control here and a pointer to the record
 * there. That is not the same population as the module-matrix cells that get
 * a link INSTEAD of a control — `src/ui/CrossSurfaceLink.tsx` is theirs, it
 * says in its own header that it has no prop that could add a control, and
 * using it for these ten would delete the ten controls the module exists to
 * place.
 *
 * THE POINTER IS NAMED **AND** LINKED, AND THE LINK REPLACED AN ABSTENTION
 * THAT HAD STOPPED BEING TRUE. This block used to read "no route under
 * `app/hub/` is an audit view, so a href here would point at a 404" and set
 * `destinationBuilt: false`. Slice 11 wave 2 built that route:
 * `SCR-DOH-20`, the audit log explorer (L48114), is `MOD-DOH-11`'s screen and
 * ships at `app/hub/audit-and-retention/`. The abstention's own closing
 * sentence promised "a link is offered the day a Hub audit route exists";
 * that day arrived and the sentence did not come back, on eight Command
 * Center pages, with `tests/unit/cc-13.test.ts` asserting the stale `false`.
 *
 * SO THE HREF IS DERIVED AND THE CLAIM IS GATED, because a comment is not a
 * gate and this is the third abstention in this build to rot. The route is
 * `/hub/` plus `dohModuleById('MOD-DOH-11').slug` — the DOH spine's own field,
 * so the segment has one spelling in this tree and a renamed Hub route moves
 * this href with it. And `destinationBuilt` is no longer a boolean anything
 * can pin: `tests/unit/cc-13.test.ts` asserts it EQUALS whether that route's
 * `page.tsx` is on disk, so it reds in BOTH directions — a deleted route with
 * the link still drawn, and a built route with the abstention still standing.
 *
 * The place is still named beside the link, from wave 0's
 * `CC13_OWNING_PLACES`, which reads the `Executes via` column; row 9's is
 * `null` there because that column names no owner, and a link to the audit
 * explorer does not invent one.
 *
 * ONE PRECISION ON L48437. Its sentence is general — "Every action links to
 * its Delivery Operations Hub audit entry" — but it is a row of storyboard
 * `SB-25-03`'s panel-field table, which is `SCR-CC-05`'s (L48421). The
 * obligation is quoted as it stands and its location is stated, rather than
 * promoted to a surface-wide criterion it is not filed as.
 */
export const CC13_AUDIT_POINTER = {
  obligation:
    'Audit or history link | Every action links to its Delivery Operations Hub audit entry',
  obligationRef: 'L48437',
  obligationContext:
    "A panel-field row of storyboard SB-25-03, the deviation workspace SCR-CC-05 (L48421). The sentence is general; its filing is one screen's storyboard.",
  disciplineRef: 'L38657',
  /**
   * The Hub audit view, as a route rather than as a promise. Derived from the
   * DOH spine's own slug for `MOD-DOH-11`; never typed here.
   */
  destinationRoute: `/hub/${dohModuleById('MOD-DOH-11').slug}`,
  destinationScreen: 'SCR-DOH-20',
  destinationScreenRef: 'L48114',
  destinationBuilt: true,
  whyLinked:
    "Every action links to the Delivery Operations Hub audit entry through SCR-DOH-20, the audit log explorer (L48114) -- MOD-DOH-11's own screen, and the one place this build searches, filters and exports the immutable audit record. The link carries no record identifier, because no Hub service exists here to name one; it points at the explorer, and the owning place is named beside it from the Executes via column.",
} as const

export const CC13_MOUNT_FINDINGS = [
  {
    finding:
      'L38793 opens "Every other module on this surface is where one or more of the ten actions is exercised" and then enumerates seven modules. Every other module is twelve. The enumeration is complete over the ten actions and incomplete over the modules; the five it does not name are MOD-CC-01, MOD-CC-02, MOD-CC-07, MOD-CC-08 and MOD-CC-11. No module is added to the list here.',
    sourceRefs: ['L38793'],
  },
  {
    finding:
      "CLOSED, and left on the record rather than deleted. MOD-CC-13 has no route -- AC-CC-040 (L35261) forbids a fourteenth -- and when this finding was written its rail was imported by no page: the mount is the actionRail prop of CommandCenterShell, filled by a screen under app/, and this module owns no file there. The wiring landed afterwards. Command Center pages under app/ now import and render Cc13ActionRail -- the count is deliberately not written here, because tests/unit/cc-13.test.ts counts them off the tree -- and registries/generated/modules.json derives this module's mounted-in-another-screen status from precisely those imports, so the routelessness stands and the unmounted half does not.",
    sourceRefs: ['L35261', 'L38793'],
  },
] as const satisfies readonly {
  readonly finding: string
  readonly sourceRefs: readonly string[]
}[]

/* ==================================================================== *
 * THE RENDERING DECISION FOR ONE CONTROL.
 * ==================================================================== */

export interface Cc13RailContext {
  /** The grants the person holds, as this matrix's own column words. A set. */
  readonly heldColumns: readonly Cc13Column[]
  /**
   * Where the selected object puts this action out of the person's grants.
   * Disabled with the inline reason, never absent — L20197's own case.
   */
  readonly outOfScope?: readonly Cc13Ordinal[]
  /**
   * Actions the selected object makes `Not applicable`, each with the stated
   * reason. The ONLY route to `absent`, and the reason is required because
   * L20195 says it is "stated in a tooltip rather than left as an empty
   * space".
   */
  readonly notApplicable?: Partial<Record<Cc13Ordinal, string>>
}

export interface Cc13RailRendering {
  readonly ordinal: Cc13Ordinal
  readonly state: Cc13RailState
  /** What the control says. Equals the matrix action except on the substitution. */
  readonly label: string
  /** `true` only where the label is not this action's own — row 4, Supervisor. */
  readonly substituted: boolean
  /** The inline reason. Non-null for `disabled` and for `absent`, null for `enabled`. */
  readonly reason: string | null
  /** A condition that applies to a granted act, surfaced beside it. */
  readonly condition: string | null
  /** The cell this rendering was decided from, and its line. */
  readonly decidedBy: Cc13Column | null
  readonly sourceRef: string
}

/**
 * The tokens that let a person act. DERIVED from wave 0's token-to-outcome
 * map, never listed here: `allowed` and `allowedWithConditions` are the two
 * of `@/policy/decision`'s nine that permit an action and that this matrix's
 * four tokens reach. A literal list would be a second spelling of wave 0's
 * mapping and would keep its old answer if that mapping ever changed.
 */
const ACTING_TOKENS: ReadonlySet<Cc13Token> = new Set(
  CC13_TOKENS.filter(
    (t) => CC13_TOKEN_OUTCOME[t] === 'allowed' || CC13_TOKEN_OUTCOME[t] === 'allowedWithConditions',
  ),
)

/**
 * One control's rendering, from the person's grants and the selected object.
 *
 * BRANCH ORDER IS ROLE, THEN SCOPE, THEN OBJECT, and it is deliberate. If
 * the object made an action `Not applicable` for a person who is also
 * prohibited, an object-first order would render ABSENT and hide a true
 * prohibition behind an object condition that may not hold tomorrow. Role
 * first means a refusal is always stated. Absent is then reached only where
 * the person could otherwise have acted, which is the narrow reading of
 * L20195's "only".
 */
export function cc13RailRendering(
  ordinal: Cc13Ordinal,
  context: Cc13RailContext,
): Cc13RailRendering {
  const action = cc13Action(ordinal)
  const base = {
    ordinal,
    label: action.matrixAction,
    substituted: false,
    condition: null,
    sourceRef: action.matrixRef,
  } as const

  // The substitution is checked before anything else, because on this cell
  // the token is a prohibition and the note is a grant, and a classifier
  // that reaches the token first has already lost the act.
  const sub = CC13_SUPERVISOR_SUBSTITUTION
  if (ordinal === sub.ordinal && context.heldColumns.includes(sub.column)) {
    return {
      ...base,
      label: sub.substituteLabel,
      substituted: true,
      state: 'enabled',
      reason: null,
      decidedBy: sub.column,
    }
  }

  const acting = context.heldColumns.find((c) => ACTING_TOKENS.has(action.cells[c].token))
  if (acting === undefined) {
    // No held grant permits the act. Disabled with the reason, never absent.
    const first = context.heldColumns[0]
    const cell = first === undefined ? null : action.cells[first]
    return {
      ...base,
      state: 'disabled',
      reason:
        cell === null
          ? 'No grant you hold names a column of this matrix.'
          : `${cell.text} — for the grant you hold on this surface.`,
      decidedBy: first ?? null,
    }
  }

  if (context.outOfScope?.includes(ordinal) === true) {
    return {
      ...base,
      state: 'disabled',
      reason: CC13_RAIL_SPEC.outOfScopeReason,
      decidedBy: acting,
    }
  }

  const na = context.notApplicable?.[ordinal]
  if (na !== undefined) {
    return { ...base, state: 'absent', reason: na, decidedBy: acting }
  }

  return {
    ...base,
    state: 'enabled',
    reason: null,
    condition: action.cells[acting].note,
    decidedBy: acting,
  }
}

/** All ten, in the canonical order L20195 requires. Never a subset. */
export function cc13Rail(context: Cc13RailContext): readonly Cc13RailRendering[] {
  return CC13_ACTIONS.map((a) => cc13RailRendering(a.ordinal, context))
}
