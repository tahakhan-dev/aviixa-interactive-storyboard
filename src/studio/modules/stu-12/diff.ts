import type { VersionBumpClass } from '@/studio/vocab'

/**
 * C6 — **the diff engine is implemented HERE**, in the module the source makes
 * its owner, and injected at this module's own route. `MOD-STU-11` declares
 * the interface it consumes and ships `diffUnavailable` as its default; it
 * never implements one, and nothing in this file edits it.
 *
 * The engine answers one question — what changed between two versions, at
 * screen level — and it answers it in three parts, because three different
 * readers need three different things from it (L33438):
 *
 * - the **Reviewer** validates the bump classification against it, so it must
 *   say what KIND of change each one is (`VersionChangeKind`);
 * - the **Release Authority** signs off against it, so it must show the
 *   changed screens with field-level before and after values;
 * - the **change notice** on the device is drawn from the republish
 *   description, not from here, so the engine renders no worker-facing text.
 *
 * ### Unavailable is a first-class answer, and it HOLDS
 *
 * `FUNC-STU-12-01-A-2` (L33486): "where the diff engine is unavailable, the
 * classification cannot be validated and the submission is held rather than
 * advanced, because advancing an unvalidated classification could auto-adopt a
 * behaviour change." So `DiffResult` has an unavailable arm carrying a reason,
 * and there is no arm that reports "no changes found" for an engine that could
 * not look — those are different answers and only one of them is a fact.
 *
 * ### Determinism
 *
 * No clock, no randomness. The seeded engine returns the source's own
 * illustrative diff (L33548) and the same call returns the same value.
 */

/* ==================================================================== *
 * WHAT KIND OF CHANGE IT IS — L33426-L33427, transcribed.
 * ==================================================================== */

export type VersionChangeKindId =
  // PATCH — "corrections that change no operating behaviour" (L33426).
  | 'typographical'
  | 'clarified-phrase'
  | 'reference-image'
  | 'lane-b-approved-value'
  | 'instruction-text'
  | 'coaching-content'
  // MINOR and MAJOR — the notified classes (L33427).
  | 'specification-limits'
  | 'gates'
  | 'timing'
  | 'severity-mapping'
  | 'sequence'
  | 'screens-added-or-removed'
  | 'restructuring'

export interface VersionChangeKind {
  readonly id: VersionChangeKindId
  /**
   * `true` for the classes L33427 calls notified — "changes to what the worker
   * does or what the platform enforces". A PATCH carrying one of these is
   * mis-classified and is returned (`AC-STU-106`, L33584).
   */
  readonly notified: boolean
  /** L33427 — "with **MAJOR** marking restructuring". */
  readonly marksMajor: boolean
  readonly words: string
  readonly sourceRef: string
}

const PATCH_REF = 'L33426'
const NOTIFIED_REF = 'L33427'

export const VERSION_CHANGE_KINDS = [
  { id: 'typographical', notified: false, marksMajor: false, words: 'a typographical error', sourceRef: PATCH_REF },
  { id: 'clarified-phrase', notified: false, marksMajor: false, words: 'a clarified phrase', sourceRef: PATCH_REF },
  { id: 'reference-image', notified: false, marksMajor: false, words: 'an updated reference image', sourceRef: PATCH_REF },
  {
    id: 'lane-b-approved-value',
    notified: false,
    marksMajor: false,
    words: 'a Lane-B-approved value',
    sourceRef: PATCH_REF,
  },
  {
    id: 'instruction-text',
    notified: false,
    marksMajor: false,
    // The diff reports instruction text added or removed (L33438), and text
    // alone changes no operating behaviour — a clarified phrase is the
    // source's own patch exemplar. Where the wording changes what the worker
    // DOES, the change also touches sequence, gates or limits, and those
    // kinds carry the notification.
    words: 'instruction text added or removed',
    sourceRef: 'L33438',
  },
  {
    id: 'coaching-content',
    notified: false,
    marksMajor: false,
    words: 'coaching content',
    sourceRef: 'L33438',
  },
  {
    id: 'specification-limits',
    notified: true,
    marksMajor: false,
    words: 'specification-limit values',
    sourceRef: NOTIFIED_REF,
  },
  { id: 'gates', notified: true, marksMajor: false, words: 'gates', sourceRef: NOTIFIED_REF },
  { id: 'timing', notified: true, marksMajor: false, words: 'timing', sourceRef: NOTIFIED_REF },
  {
    id: 'severity-mapping',
    notified: true,
    marksMajor: false,
    words: 'severity mappings and deviation-rule updates',
    sourceRef: NOTIFIED_REF,
  },
  { id: 'sequence', notified: true, marksMajor: false, words: 'sequence', sourceRef: NOTIFIED_REF },
  {
    id: 'screens-added-or-removed',
    notified: true,
    marksMajor: false,
    words: 'screens added or removed',
    sourceRef: NOTIFIED_REF,
  },
  {
    id: 'restructuring',
    notified: true,
    marksMajor: true,
    words: 'restructuring',
    sourceRef: NOTIFIED_REF,
  },
] as const satisfies readonly VersionChangeKind[]

type MissingFromChangeKinds = Exclude<
  VersionChangeKindId,
  (typeof VERSION_CHANGE_KINDS)[number]['id']
>
const _changeKindsExhaustive: MissingFromChangeKinds extends never ? true : never = true
void _changeKindsExhaustive

const CHANGE_KIND_BY_ID = new Map<VersionChangeKindId, VersionChangeKind>(
  VERSION_CHANGE_KINDS.map((k) => [k.id, k]),
)

export function changeKind(id: VersionChangeKindId): VersionChangeKind {
  // Total by the exhaustiveness check above; the fallback is the strictest
  // member, so a caller that defeated the type system gets a notified answer
  // rather than a permissive one.
  return CHANGE_KIND_BY_ID.get(id) ?? VERSION_CHANGE_KINDS[12]
}

/**
 * The kinds that make a change a notified class. One function, so the
 * mis-classification check and the screen read the same list — a second
 * `.filter()` beside this one is how two lists drift.
 */
export function notifiedChangeKinds(
  kinds: readonly VersionChangeKind[] = VERSION_CHANGE_KINDS,
): readonly VersionChangeKind[] {
  return kinds.filter((k) => k.notified)
}

/**
 * The classification a diff DEMANDS at minimum. `PATCH` where nothing notified
 * changed; `MAJOR` where something marks restructuring; `MINOR` otherwise.
 * The Author still chooses (L33424) — this is what the Reviewer validates the
 * choice against.
 */
export function minimumBumpFor(kinds: readonly VersionChangeKindId[]): VersionBumpClass {
  const resolved = kinds.map(changeKind)
  if (resolved.some((k) => k.marksMajor)) return 'MAJOR'
  return resolved.some((k) => k.notified) ? 'MINOR' : 'PATCH'
}

/* ==================================================================== *
 * THE SCREEN-LEVEL DIFF.
 * ==================================================================== */

export interface DiffField {
  readonly field: string
  readonly before: string
  readonly after: string
  readonly kind: VersionChangeKindId
  /** L33546 — specification-limit changes are highlighted in their own row. */
  readonly isSpecificationLimit: boolean
}

export interface DiffScreen {
  /** The screen's number in the Workflow, as the diff lists it. */
  readonly screen: number
  readonly name: string
  readonly fields: readonly DiffField[]
}

export type VersionDiffResult =
  | {
      readonly available: true
      readonly from: string
      readonly to: string
      readonly changedScreens: readonly DiffScreen[]
      readonly changeKinds: readonly VersionChangeKindId[]
      readonly changeSummary: string
    }
  | { readonly available: false; readonly reason: string }

export interface VersionDiffEngine {
  /** Owned here. `MOD-STU-11` consumes this shape and never implements it. */
  readonly ownedBy: 'MOD-STU-12'
  readonly diff: (from: string, to: string) => VersionDiffResult
}

/**
 * THE DEFAULT, and the reason it is this one. An unwired engine must not let a
 * publication through: the classification cannot be validated, so the
 * submission is HELD rather than advanced.
 */
export const versionDiffUnavailable: VersionDiffEngine = {
  ownedBy: 'MOD-STU-12',
  diff: () => ({
    available: false,
    reason:
      'The diff engine cannot be reached, so the classification cannot be validated against the diff.',
  }),
}

/**
 * The source's own worked example, L33548: eight changed screens, the lower
 * limit unchanged at 44 and the upper unchanged at 47, and the band boundaries
 * re-based — which is why Sam's MINOR is right and a PATCH would have been
 * returned. Screens 3 through 10 are the eight bolt screens (L32525).
 */
const BOLTS = ['A front-left', 'B front-right', 'C mid-left', 'D mid-right', 'E rear-left', 'F rear-right', 'G spare-left', 'H rear-right'] as const

function severityBandFields(): readonly DiffField[] {
  return [
    {
      field: 'Severity 2 band',
      before: '0–8 % outside tolerance',
      after: '0–10 % outside tolerance',
      kind: 'severity-mapping',
      isSpecificationLimit: false,
    },
    {
      field: 'Severity 1 band',
      before: 'beyond 8 %',
      after: 'beyond 10 %',
      kind: 'severity-mapping',
      isSpecificationLimit: false,
    },
    {
      field: 'Torque specification',
      before: '44–47 Newton metres against DWG-A441',
      after: '44–47 Newton metres against DWG-A441 rev B',
      kind: 'specification-limits',
      isSpecificationLimit: true,
    },
  ]
}

const PATCH_SCREEN: DiffScreen = {
  screen: 2,
  name: 'Preparation',
  fields: [
    {
      field: 'Instruction text',
      before: 'Check the torque wrench calibration lable.',
      after: 'Check the torque wrench calibration label.',
      kind: 'typographical',
      isSpecificationLimit: false,
    },
  ],
}

/**
 * A seeded engine for this storyboard's fixtures. It is a FIXTURE, not a
 * simulation of a real comparison: the storyboard is browser-only and there is
 * no second version stored to compare against, so the honest thing is a seeded
 * answer that says which change kinds it carries.
 *
 * Parameterised on the classification the caller is exercising, because the
 * screen has to be able to show BOTH the correctly classified MINOR and the
 * mis-classified PATCH that gets returned — and a fixture that could only
 * produce one of them would make the return path unreachable from a render.
 */
export function seededVersionDiffEngine(carrying: VersionBumpClass): VersionDiffEngine {
  return {
    ownedBy: 'MOD-STU-12',
    diff: (from, to) =>
      carrying === 'PATCH'
        ? {
            available: true,
            from,
            to,
            changedScreens: [PATCH_SCREEN],
            changeKinds: ['typographical'],
            changeSummary: 'Typographical correction on the preparation screen; no operating behaviour changed',
          }
        : {
            available: true,
            from,
            to,
            changedScreens: BOLTS.map((bolt, index) => ({
              screen: index + 3,
              name: `Bolt ${bolt}`,
              fields: severityBandFields(),
            })),
            changeKinds:
              carrying === 'MAJOR'
                ? ['severity-mapping', 'specification-limits', 'restructuring']
                : ['severity-mapping', 'specification-limits'],
            changeSummary:
              'Torque specification updated per engineering change order; severity bands re-based',
          },
  }
}

/**
 * The one reader every diff view calls. It takes its ENGINE as a parameter and
 * never a module-load default, so a screen cannot be wired to a snapshot of
 * one — the defect this build shipped three times in slice 4.
 */
export function screenLevelDiff(
  engine: VersionDiffEngine,
  from: string,
  to: string,
): VersionDiffResult {
  return engine.diff(from, to)
}
