import { aiMode, type AiModeId, type AiModeRow } from '@/ai/modes'
import { catalogueRow, type CatalogueRow } from '@/ai/failures/catalogue'
import type { ProvenanceClassId } from '@/ai/provenance/classes'

/**
 * THE MODE-TO-FAILURE JOIN, SHARED ACROSS THE FIVE SURFACES.
 *
 * ── WHY IT IS HERE RATHER THAN IN A SURFACE ────────────────────────────────
 * `src/surfaces/cc/modules/cc-08/degradation.ts` built this join privately for
 * its own two rows and recorded the reason it must not stay private
 * (`no-mode-to-failure-join-in-the-source`): "every other surface that renders
 * a mode beside a failure will need the same join, and four private copies of
 * it is the duplicate-vocabulary shape this build keeps shipping." This module
 * is that shared join. `MOD-CC-08`'s copy is not on the path list of the task
 * that wrote this file and is left as it stands; collapsing it into this one is
 * a single-caller change for whoever owns that file next, and it is reported as
 * an open seam rather than done from outside.
 *
 * ── WHAT THE SOURCE DOES AND DOES NOT SAY ──────────────────────────────────
 * §42.3's mode matrix (rows L89356-L89371) and §43.2's failure catalogue never
 * reference each other. Two modes are pauses — `AIMODE-13` Tenant suspension
 * (L89368) and `AIMODE-14` Platform suspension (L89369) — and two failures are
 * pauses: `FAIL-AI-41` "Emergency pause, platform-wide" and `FAIL-AI-42`
 * "Emergency pause, per tenant". **No line of the frozen source names a pause
 * mode and a pause failure together.** The pairing below is therefore a build
 * inference under `APP-012`, carried as `MODE_FAILURE_JOIN_INFERENCE` and
 * rendered wherever a join is rendered.
 *
 * ── WHAT MAKES IT CHECKABLE RATHER THAN ASSERTED ───────────────────────────
 * Both halves name their own scope in their own words: the mode row's `name`
 * against the catalogue row's `failureMode` cell. `joinModeToFailure` reads the
 * scope off each side and THROWS where they disagree or where either side names
 * none.
 *
 * THE CRITERION BEHIND THAT THROW IS `AC-42-301` (L89400), AND NAMING
 * `AC-42-303` FOR IT WAS WRONG. `AC-42-303` (L89402) reads "`AIMODE-13` and
 * `AIMODE-14` are distinguishable from `AIMODE-03` and `AIMODE-05` on every
 * surface that shows a state, because a paused platform and an unreachable one
 * call for different human responses." That distinguishes PAUSE modes from
 * OUTAGE modes, and the source names it so itself: its own test, `TEST-42-302`
 * at L89409, is titled "Pause-versus-outage test". It says nothing about telling
 * one pause scope from the other, and it could not: the §42.3 matrix rows for
 * the two pause modes, L89368 and L89369, are BYTE-IDENTICAL in all five
 * columns after the mode name — worker label, agent invocation, deterministic
 * safety, escalation delivery and classification alike. The mode matrix cannot
 * settle tenant-versus-platform.
 *
 * WHAT SETTLES IT IS THE FAILURE CATALOGUE, AND THE SPLIT IS PER SURFACE.
 * `FAIL-AI-41` (L90513) and `FAIL-AI-42` (L90514) carry BYTE-IDENTICAL Frontline
 * message cells — both "Live coaching paused by the platform." — while their
 * tenant-web cells differ: "Agents paused by the platform. Deterministic checks
 * are unaffected." against "Agents paused by the platform for this workspace."
 * Their operational bands differ too, `Critical` against `Major`. So the Client
 * Command Center CAN tell the two pause scopes apart and the worker's device
 * CANNOT, by the source's own design. That is the measured basis for refusing a
 * mismatched pair rather than rendering one: the scope is only recoverable from
 * the catalogue row, so a join that guessed it would be the single point where a
 * platform-wide pause reaches a tenant surface as that tenant's own, with no
 * other cell able to contradict it. It is why `MOD-CC-08` computes this
 * distinction off the two records rather than asserting it, and why this join
 * does the same.
 *
 * The criterion the throw legitimately leans on is `AC-42-301` (L89400) —
 * "every surface that displays an artificial-intelligence availability state for
 * a given tenant displays the same mode" — because a pair whose halves disagree
 * about scope is a surface showing a state for the wrong tenant scope.
 *
 * `pauseScopeOf` is deliberately not a classifier over a whole sentence. It
 * looks for the source's own two scope words and returns `null` rather than
 * guessing, including for a sentence naming BOTH — that is ambiguity, not a
 * tie. A resolver that always answers is how "per tenant" becomes
 * "platform-wide" on a screen a tenant reads.
 *
 * ── PROVENANCE ─────────────────────────────────────────────────────────────
 * `PROV-4`. Two transcribed registers and a scope comparison. No agent
 * produced any of it and no path over it may describe it as live artificial
 * intelligence.
 */

/* ==================================================================== *
 * THE SCOPE VOCABULARY.
 * ==================================================================== */

/**
 * The two scopes the source gives the pause, in its own two words. L87785 —
 * "platform-wide, or per tenant" — and L87821, the initiation step. There is no
 * third: the site-scoped pause is `Recommendation — R&D` under
 * `DEC-AIPAUSE-001` and is not a member of this vocabulary, which is why a
 * site-scoped anything cannot be joined here even by accident.
 */
export type PauseScope = 'platform-wide' | 'per tenant'

export const PAUSE_SCOPES = ['platform-wide', 'per tenant'] as const satisfies readonly PauseScope[]

type MissingFromScopes = Exclude<PauseScope, (typeof PAUSE_SCOPES)[number]>
const _scopesExhaustive: MissingFromScopes extends never ? true : never = true
void _scopesExhaustive

/**
 * The scope a sentence states about itself, or `null` where it states none or
 * more than one. See the module doc for why `null` rather than a default.
 */
export function pauseScopeOf(sentence: string): PauseScope | null {
  const lowered = sentence.toLowerCase()
  const named = PAUSE_SCOPES.filter((scope) =>
    scope === 'platform-wide' ? lowered.includes('platform') : lowered.includes('tenant'),
  )
  return named.length === 1 ? (named[0] ?? null) : null
}

/* ==================================================================== *
 * THE JOIN.
 * ==================================================================== */

export const MODE_FAILURE_JOIN_INFERENCE =
  'The frozen source never joins the mode vocabulary to the failure catalogue: no line names a ' +
  'pause mode and a pause failure together. This pairing is therefore a build inference under ' +
  '`APP-012` and not the source\'s own statement. It is joined on the scope each side names for ' +
  'itself — the mode row\'s name against the catalogue row\'s failure-mode cell — and a pair whose ' +
  'halves disagree, or either of whose halves names no scope, is a thrown error rather than a ' +
  'rendered guess.'

/**
 * One operating mode joined to the catalogued failure that messages it.
 *
 * Nothing on this record is spelled here. The worker label, the tenant message
 * and the operational band are all read off the two records named, so a join
 * cannot claim a message its own halves do not carry — a second spelling of an
 * "exact user-visible message" is the defect the source's own label exists to
 * prevent.
 */
export interface ModeFailureJoin {
  readonly scope: PauseScope
  readonly mode: AiModeRow
  readonly failure: CatalogueRow
  /**
   * The mode matrix's own Frontline-visible chip text for this mode, taken off
   * the mode row.
   *
   * NAMED FOR THE SURFACE, NOT FOR THE PERSON, AND THAT IS DELIBERATE. The
   * mode row's own field is `workerLabel` and stays so; a join field of that
   * name reads to `tests/coverage/slice-03-gates.test.ts`'s support-not-
   * surveillance gate as a record keyed by a person — `worker` plus `label` is
   * exactly the shape it convicts — and it convicted the first consumer of this
   * join for spelling it. The gate is right to be blunt there, and this is the
   * more accurate name in any case: it is the text a SURFACE shows, not a
   * property of a worker.
   */
  readonly frontlineChipText: string
  /** The catalogue's own tenant-web cell for this failure. */
  readonly tenantWebMessage: string
  /**
   * The OPERATIONAL band, as the catalogue's own cell writes it — a string and
   * never a component. `AC-43-103` (L89975) forbids sharing a rendering
   * component with the manufacturing severity catalogue, and a band handed
   * across as data cannot smuggle one in.
   */
  readonly operationalSeverity: string
  /** Why this mode and this failure are one row. Rendered, never silent. */
  readonly inference: string
}

/**
 * Join one mode to one failure on the scope each states for itself.
 *
 * Throws where the two halves disagree, and where either names no scope. Both
 * are refusals rather than fallbacks: `AC-42-301` (L89400) requires every
 * surface showing an availability state for a given tenant to show the same
 * mode, and a join that picked a side would be the one place a platform-wide
 * state gets rendered as one tenant's, or the reverse.
 */
export function joinModeToFailure(modeId: AiModeId, failureId: string): ModeFailureJoin {
  const mode = aiMode(modeId)
  const failure = catalogueRow(failureId)
  const fromMode = pauseScopeOf(mode.name)
  const fromFailure = pauseScopeOf(failure.cells.failureMode)
  if (fromMode === null || fromFailure === null || fromMode !== fromFailure) {
    throw new Error(
      `${modeId} ("${mode.name}") cannot be joined to ${failureId} ` +
        `("${failure.cells.failureMode}") on scope. The mode side reads ${String(fromMode)} and ` +
        `the failure side reads ${String(fromFailure)}. A pause whose two halves disagree about ` +
        'whether it is one tenant or the whole platform would render one scope as the other, ' +
        'which is what `AC-42-301` forbids: every surface showing an availability state for a ' +
        'given tenant shows the same mode. It is refused rather than rendered.',
    )
  }
  return {
    scope: fromMode,
    mode,
    failure,
    frontlineChipText: mode.workerLabel,
    tenantWebMessage: failure.cells.tenantWebMessage,
    operationalSeverity: failure.cells.operationalSeverity,
    inference: MODE_FAILURE_JOIN_INFERENCE,
  }
}

/**
 * The candidate pause pairs, as identifiers only. No scope, no message and no
 * band is written here — all three are read off the two records each names, so
 * a row cannot claim a scope its own halves do not carry.
 */
export const PAUSE_MODE_FAILURE_PAIRS = [
  { modeId: 'AIMODE-14', failureId: 'FAIL-AI-41' },
  { modeId: 'AIMODE-13', failureId: 'FAIL-AI-42' },
] as const satisfies readonly { readonly modeId: AiModeId; readonly failureId: string }[]

/**
 * The pause joins, built and checked. Every pair is joined through
 * `joinModeToFailure`, so a disagreeing pair throws; and the resolved scopes
 * must be distinct, because two rows carrying one scope means one screen for
 * both, which is what `AC-42-301` forbids by another route.
 */
export function pauseJoins(): readonly ModeFailureJoin[] {
  const joins = PAUSE_MODE_FAILURE_PAIRS.map((pair) =>
    joinModeToFailure(pair.modeId, pair.failureId),
  )
  const scopes = new Set(joins.map((join_) => join_.scope))
  if (scopes.size !== joins.length) {
    throw new Error(
      'The pause joins resolved onto fewer scopes than there are joins. Two rows carrying one ' +
        'scope means one screen for both, which is what `AC-42-301` forbids.',
    )
  }
  return joins
}

/**
 * The join for one scope. Returns the single join or throws — never a silent
 * first match, because `modesCarryingWorkerLabel` exists precisely because
 * three worker labels have two owners each in this vocabulary.
 */
export function pauseJoinForScope(scope: PauseScope): ModeFailureJoin {
  const matches = pauseJoins().filter((join_) => join_.scope === scope)
  const [only] = matches
  if (only === undefined || matches.length > 1) {
    throw new Error(
      `"${scope}" resolves to ${String(matches.length)} pause joins and a surface needs exactly ` +
        'one. Anything else is a scope rendered as a state it does not name.',
    )
  }
  return only
}

/* ==================================================================== *
 * PROVENANCE.
 * ==================================================================== */

/** The one class every rendering path over this join emits. */
export const MODE_FAILURE_JOIN_PROVENANCE: ProvenanceClassId = 'PROV-4'
