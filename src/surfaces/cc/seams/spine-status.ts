import { CC_SEAMS, ccSeamStatus, type CcSeamId, type CcSeamStatus } from '@/surfaces/cc/seams'

/**
 * THE SPINE'S OWN SEAM REGISTRY REPORTS BOTH ITS SEAMS OPEN, AND BOTH ARE
 * NOW CLOSED IN SUBSTANCE. This file records that and changes nothing.
 *
 * `src/surfaces/cc/seams.ts` is slice 8's and this task owns no line of it.
 * Its `ccSeamStatus` derives status rather than storing it — `ownerSlice <=
 * THIS_SLICE` — which is the right shape and is the shape
 * `src/surfaces/doh/seams.ts` and `src/studio/seams.ts` already ship. What it
 * still has is one hand-maintained number: `THIS_SLICE`, declared 8, while
 * both of its rows name `ownerSlice: 9`. So both report `open`.
 *
 * ── THE VERDICT: STALE, NOT WRONG, AND NOT THIS TASK'S TO ADVANCE ─────────
 * The number is not a defect in the derivation; it is the derivation's one
 * input and the idiom is that the slice which closes a seam advances it. The
 * Hub's file shows the manoeuvre being performed: its `THIS_SLICE` reads 6
 * and its header walks each seam that closed at that number against what the
 * previous slice had recorded, because a seam closed without reading its
 * recorded expectation is a seam closed on a guess. Slice 9 closed both of
 * this surface's and no task in the slice owned the file, so nobody
 * performed it.
 *
 * That is exactly the failure the file's own header warns about one level
 * down: a second thing to keep in step will not be kept in step. Removing
 * the stored `status` field and then storing the slice number moved the
 * hazard rather than removing it.
 *
 * ── WHY BOTH ARE CLOSED IN SUBSTANCE, EACH CHECKED SEPARATELY ─────────────
 * `sync-state-chrome-host` — `MOD-CC-02` is chrome with no screen of its
 * own and needs `MOD-CC-01`'s board to host it. The board exists, and
 * `app/command-center/live-shift-board/page.tsx` fills the shell's `chrome`
 * prop with `MOD-CC-02`'s own components. The host is built and the chrome
 * is on it.
 *
 * `operational-action-set` — `MOD-CC-10` needed action 5 to belong to
 * `MOD-CC-13`'s closed set rather than to the panel. `MOD-CC-13` exists, its
 * control rail is `src/surfaces/cc/modules/cc-13/Cc13ActionRail.tsx`, and
 * the panel mounts it. `MOD-CC-10`'s own task reported this seam and pinned
 * the constant in `tests/unit/cc-10.test.ts` so its on-screen note cannot
 * outlive the condition it describes.
 *
 * THE SECOND SEAM WAS REPORTED BY THAT TASK; THE FIRST WAS NOT REPORTED BY
 * ANYONE, because the board's task and the chrome's task each saw only their
 * own half and neither had cause to read the registry's arithmetic. That is
 * the whole reason this file exists rather than a second copy of a note.
 *
 * ── WHAT WHOEVER FIXES IT HAS TO CHANGE IN THE SAME COMMIT ────────────────
 * Advancing `THIS_SLICE` to 9 turns both seams `closed`, stops
 * `CommandCenterShell`'s `SeamNotice` rendering either, and turns red both
 * the gate in `tests/unit/cc-10.test.ts` and the one in
 * `tests/unit/cc-seams.test.ts` that hold the constant at 8. That is the
 * design: the two on-screen notes and this record must be removed in the
 * same change that makes them false.
 */
export interface CcSpineSeamVerdict {
  readonly id: CcSeamId
  /** What the registry reports today. */
  readonly reported: CcSeamStatus
  /** Whether the owning half is built and reached, checked on its own terms. */
  readonly owningHalfBuilt: boolean
  /** The file that proves it, so the claim is openable. */
  readonly evidence: string
}

export const CC_SPINE_SEAM_VERDICTS = [
  {
    id: 'sync-state-chrome-host',
    reported: 'open',
    owningHalfBuilt: true,
    evidence:
      'app/command-center/live-shift-board/page.tsx mounts MOD-CC-01 and fills the shell chrome prop with MOD-CC-02 components through src/surfaces/cc/modules/cc-01/BoardSyncChrome.tsx.',
  },
  {
    id: 'operational-action-set',
    reported: 'open',
    owningHalfBuilt: true,
    evidence:
      'src/surfaces/cc/modules/cc-13/Cc13ActionRail.tsx exists and app/command-center/sync-conflict-review-panel/page.tsx mounts it, which is MOD-CC-10 exercising action 5 rather than implementing resolution.',
  },
] as const satisfies readonly CcSpineSeamVerdict[]

/** The seams the registry still reports open. Derived, so it empties itself. */
export const SPINE_SEAMS_REPORTING_OPEN: readonly CcSeamId[] = CC_SEAMS.filter(
  (s) => ccSeamStatus(s) === 'open',
).map((s) => s.id)

/** Reported open while the owning half is built. The measure of the staleness. */
export const SPINE_SEAMS_STALE: readonly CcSeamId[] = CC_SPINE_SEAM_VERDICTS.filter(
  (v) => v.owningHalfBuilt && SPINE_SEAMS_REPORTING_OPEN.includes(v.id),
).map((v) => v.id)

export const SPINE_SEAM_RULING = {
  file: 'src/surfaces/cc/seams.ts',
  ownedBy: 'slice 8',
  constant: 'THIS_SLICE',
  declared: 8,
  ruling:
    'Stale, not wrong. The derivation is sound and its one input was never advanced, because the idiom is that the slice closing a seam advances the number and no slice-9 task owned the file. Reported, not edited.',
  fixTouches: [
    'src/surfaces/cc/seams.ts',
    'src/surfaces/cc/modules/cc-10/service.ts',
    'tests/unit/cc-10.test.ts',
    'src/surfaces/cc/seams/spine-status.ts',
    'tests/unit/cc-seams.test.ts',
  ],
} as const
