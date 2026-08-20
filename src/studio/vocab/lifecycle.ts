/**
 * Slice 5, task 3 -- the Studio's object-state vocabularies.
 *
 * D21 ruling, inherited from slice 4's D21 for the same reason the source
 * supplies: **the module identity cards govern the enumerations**, because
 * state names are `Derived Clarification` while the behaviours are `SoW Fact`.
 * What the identity cards lose is not discarded -- the three states that are
 * operationally distinct are modelled as flags in `D21_MODELLED_FLAGS`, each
 * attached to the object the source attaches it to.
 */

/**
 * The Workflow's own authoring status. L31924: "Draft, In Review, Published,
 * Archived. The first three are stated in §5.3.1; Archived follows from
 * §5.12.3's manual archival." `OBJ-STU-WORKFLOW`'s register row carries the
 * same four (L31124).
 *
 * D6, and `Archived` wins. `OBJ-036`'s lifecycle line (L8597) reads "Draft,
 * In Review, Published as authoring statuses of the workflow's current
 * version" and omits it; that is the NARROWER STATEMENT, not a contradiction,
 * because a current version is never the archived one. `MOD-STU-03`'s state
 * machine (L31959-L31972) draws Archived and its Library cannot express *not
 * linkable* without it.
 *
 * **Hoisted out of `MOD-STU-03` and declared once.** It is a lifecycle
 * vocabulary that `MOD-STU-03` and `MOD-STU-12` both read, and a second
 * declaration is exactly how two lists drift apart. The draft/released
 * PARTITION over these four is not vocabulary and stays in `MOD-STU-03` --
 * it is that module's own read-scope policy, drawn from its matrix row 2.
 */
export type WorkflowStatus = 'Draft' | 'In Review' | 'Published' | 'Archived'

export const WORKFLOW_STATUSES = [
  'Draft',
  'In Review',
  'Published',
  'Archived',
] as const satisfies readonly WorkflowStatus[]

const _workflowStatusesExhaustive: Exclude<WorkflowStatus, (typeof WORKFLOW_STATUSES)[number]> extends never ? true : never = true
void _workflowStatusesExhaustive

/**
 * L33426: "At republish the Author selects the bump classification and the
 * Reviewer validates it against the diff -- a mis-classified patch is
 * returned". PATCH auto-adopts; MINOR and MAJOR are the notified classes,
 * "with **MAJOR** marking restructuring".
 */
export type VersionBumpClass = 'PATCH' | 'MINOR' | 'MAJOR'

export const VERSION_BUMP_CLASSES = [
  'PATCH',
  'MINOR',
  'MAJOR',
] as const satisfies readonly VersionBumpClass[]

const _versionBumpClassesExhaustive: Exclude<VersionBumpClass, (typeof VERSION_BUMP_CLASSES)[number]> extends never ? true : never = true
void _versionBumpClassesExhaustive

/**
 * Adoption **per Job**, L33479, second sentence: "Adoption per Job is
 * Notified, Decided-adopt, Decided-defer, or Outdated after the update window
 * lapses."
 *
 * D5: `Outdated` belongs here and NOT on the version. The version's own states
 * are Published, Superseded, Archived -- same line, first sentence. `OBJ-037`
 * (L8616) collapses the two onto the version and is recorded as an erratum,
 * because collapsing loses the distinction between *a newer version exists*
 * and *this Job's update window lapsed*, which are separately notified.
 */
export type JobAdoptionState = 'Notified' | 'Decided-adopt' | 'Decided-defer' | 'Outdated'

export const JOB_ADOPTION_STATES = [
  'Notified',
  'Decided-adopt',
  'Decided-defer',
  'Outdated',
] as const satisfies readonly JobAdoptionState[]

const _jobAdoptionStatesExhaustive: Exclude<JobAdoptionState, (typeof JOB_ADOPTION_STATES)[number]> extends never ? true : never = true
void _jobAdoptionStatesExhaustive

/**
 * L33289: "Submitted, Returned with comments, Advanced, Released, Withdrawn. A
 * submission may cycle between Submitted and Returned any number of times;
 * each cycle is recorded."
 *
 * `Stalled` is NOT a member -- it is the D21 flag, drawn only in `SEQ-012`'s
 * diagram (L68307, "Submitted --> Stalled : No eligible reviewer exists") and
 * the only state that makes `DEC-RELAUTH-001`'s deadlock visible to a tenant.
 */
export type SubmissionState =
  | 'Submitted'
  | 'Returned with comments'
  | 'Advanced'
  | 'Released'
  | 'Withdrawn'

export const SUBMISSION_STATES = [
  'Submitted',
  'Returned with comments',
  'Advanced',
  'Released',
  'Withdrawn',
] as const satisfies readonly SubmissionState[]

const _submissionStatesExhaustive: Exclude<SubmissionState, (typeof SUBMISSION_STATES)[number]> extends never ? true : never = true
void _submissionStatesExhaustive

/**
 * L33839: "Defined, Built, Delivered, Pinned, Superseded. A package that fails
 * integrity verification is Quarantined and is never Delivered."
 *
 * `Quarantined` is the D21 flag: it is in the module's prose and absent from
 * its enumeration, and it is the state that stops a bad package reaching a
 * device.
 */
export type PackageState = 'Defined' | 'Built' | 'Delivered' | 'Pinned' | 'Superseded'

export const PACKAGE_STATES = [
  'Defined',
  'Built',
  'Delivered',
  'Pinned',
  'Superseded',
] as const satisfies readonly PackageState[]

const _packageStatesExhaustive: Exclude<PackageState, (typeof PACKAGE_STATES)[number]> extends never ? true : never = true
void _packageStatesExhaustive

/**
 * L32647: "Coaching assets: Uploaded, Approved, Indexed, Flagged for review,
 * Retired. An asset that is Approved but not yet Indexed is retrievable only
 * by metadata filter, not by semantic ranking".
 *
 * `AC-STU-072` -- indexing never changes approval state -- is what keeps the
 * seeded index simulation honest: `Approved` and `Indexed` are distinct and
 * neither implies the other.
 */
export type CoachingAssetState =
  | 'Uploaded'
  | 'Approved'
  | 'Indexed'
  | 'Flagged for review'
  | 'Retired'

export const COACHING_ASSET_STATES = [
  'Uploaded',
  'Approved',
  'Indexed',
  'Flagged for review',
  'Retired',
] as const satisfies readonly CoachingAssetState[]

const _coachingAssetStatesExhaustive: Exclude<CoachingAssetState, (typeof COACHING_ASSET_STATES)[number]> extends never ? true : never = true
void _coachingAssetStatesExhaustive

/**
 * L34030: "Composed, Evaluation pending, Evaluation passed, In approval,
 * Platform review, Deployed. Failure at the evaluation gate returns the
 * composition to Composed with the failing scenarios named. Deprecation,
 * disablement, and rollback states are `DEC-AGENTLC-001`."
 *
 * There is no terminal state, and the missing off switch is the substance of
 * `DEC-AGENTLC-001` -- not something to invent here.
 */
export type ComposedAgentState =
  | 'Composed'
  | 'Evaluation pending'
  | 'Evaluation passed'
  | 'In approval'
  | 'Platform review'
  | 'Deployed'

export const COMPOSED_AGENT_STATES = [
  'Composed',
  'Evaluation pending',
  'Evaluation passed',
  'In approval',
  'Platform review',
  'Deployed',
] as const satisfies readonly ComposedAgentState[]

const _composedAgentStatesExhaustive: Exclude<ComposedAgentState, (typeof COMPOSED_AGENT_STATES)[number]> extends never ? true : never = true
void _composedAgentStatesExhaustive

/**
 * L34573: "A grant is Assigned, Active, Revoked, or Expired, the last applying
 * to the implementation team's capacity at onboarding's end."
 *
 * D24: `Expired` applies to `GRANT-STU-IMPL` because §5.11.4 requires
 * revocation at onboarding's end. Whether the other two grants carry an expiry
 * is `DEC-TENGRANT-001` (L16457) and renders `Client Decision Required`.
 */
export type GrantState = 'Assigned' | 'Active' | 'Revoked' | 'Expired'

export const GRANT_STATES = [
  'Assigned',
  'Active',
  'Revoked',
  'Expired',
] as const satisfies readonly GrantState[]

const _grantStatesExhaustive: Exclude<GrantState, (typeof GRANT_STATES)[number]> extends never ? true : never = true
void _grantStatesExhaustive

/**
 * D21's three modelled flags. Each lives in prose or a diagram and in no
 * identity-card enumeration, and each is operationally distinct enough that
 * discarding it would lose a behaviour rather than a synonym.
 *
 * **`attachesTo` is not decorative.** The census and this slice's design table
 * both list `Distributable` beside the package states; the source attaches it
 * to a **version** -- L68465: "`Versioned` and `Distributable` are different
 * states, so a version can exist in history without ever having been safe to
 * run." Recording the attachment here is what stops a consumer flagging a
 * package `Distributable` and claiming the version is safe to run.
 */
export type D21FlagName = 'Quarantined' | 'Stalled' | 'Distributable'

export interface D21ModelledFlag {
  readonly flag: D21FlagName
  /** The object the source attaches the flag to. */
  readonly attachesTo: 'package' | 'submission' | 'version'
  /** Frozen-source line where the flag appears. */
  readonly locator: string
}

export const D21_MODELLED_FLAGS = [
  { flag: 'Quarantined', attachesTo: 'package', locator: 'L33839' },
  { flag: 'Stalled', attachesTo: 'submission', locator: 'L68307' },
  { flag: 'Distributable', attachesTo: 'version', locator: 'L68455' },
] as const satisfies readonly D21ModelledFlag[]

const _d21FlagsExhaustive: Exclude<D21FlagName, (typeof D21_MODELLED_FLAGS)[number]['flag']> extends never ? true : never = true
void _d21FlagsExhaustive
