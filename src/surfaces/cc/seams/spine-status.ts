import { CC_SEAMS, ccSeamStatus, type CcSeamId } from '@/surfaces/cc/seams'

/**
 * BOTH SEAMS ARE CLOSED, AND THIS FILE IS THE RECORD OF THE SLICE THEY SPENT
 * REPORTING OTHERWISE. It carried the finding while the number was stale; it
 * carries the account now the number has moved. Nothing here is deleted on
 * closure, because the interval is the whole thing worth keeping.
 *
 * ── WHAT WAS WRONG, IN ONE SENTENCE ───────────────────────────────────────
 * `src/surfaces/cc/seams.ts` derives status rather than storing it —
 * `ownerSlice <= THIS_SLICE` — which is the right shape and is the shape
 * `src/surfaces/doh/seams.ts` and `src/studio/seams.ts` already ship. But it
 * left one hand-maintained number, and for a whole slice that number read 8
 * while both rows read `ownerSlice: 9`, so both reported `open` on a tree
 * where both owning halves had shipped.
 *
 * REMOVING THE STORED `status` FIELD MOVED THE HAZARD RATHER THAN REMOVING
 * IT. A second thing to keep in step will not be kept in step, and the slice
 * number is a second thing to keep in step. What the derivation buys is that
 * the number is ONE place and closing a seam is one edit — not that the edit
 * makes itself. The idiom is that the slice which closes a seam advances it,
 * the Hub's file shows the manoeuvre being performed at its own number, and
 * no slice-9 task owned this surface's file, so nobody performed it.
 *
 * ── THE COST, MEASURED ON THE EXPORT RATHER THAN INFERRED ─────────────────
 * `CommandCenterShell`'s `SeamNotice` printed `whatIsMissing` for an open
 * seam, and `whatIsMissing` is written in the present tense of an absent
 * half. So "Until that board exists there is no host" printed on twelve of
 * the thirteen Command Center pages — every one except the board that
 * disproves it — and `MOD-CC-10`'s panel shipped one card saying the action
 * set had neither a module nor a screen in this slice two sentences before
 * saying this screen is one the rail mounts on. That is this build's defect
 * shape 6: a state fold applied to one branch, so one card contradicts
 * itself two paragraphs apart.
 *
 * ── WHY IT SURVIVED EVERY GATE, WHICH IS THE PART WORTH CARRYING ──────────
 * Five files pinned the stale value, each by asserting either the literal
 * source text `const THIS_SLICE = 8` or the literal status `open`.
 * A test written that way can only ever fail ON THE FIX. The gate in
 * `tests/unit/cc-seams.test.ts` said in its own comment that it "FAILS THE
 * DAY `THIS_SLICE` IS ADVANCED, which is the point" — the intent was right
 * and the implementation was the thing that hid the defect for a slice. The
 * successors assert the derivation and the rendered consequence instead.
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
 * the panel mounts it.
 *
 * THE SECOND SEAM WAS REPORTED BY `MOD-CC-10`'S OWN TASK; THE FIRST WAS
 * REPORTED BY NOBODY, because the board's task and the chrome's task each saw
 * only their own half and neither had cause to read the registry's
 * arithmetic. That is the whole reason this file exists rather than a second
 * copy of a note.
 *
 * ── THE ONE SHAPE THAT CHANGED HERE ──────────────────────────────────────
 * A VERDICT USED TO STORE ITS OWN `reported: 'open'`, which is this file's
 * whole subject committed one level down: it was a hand-written copy of an
 * answer the registry already derives, and it would have gone on saying
 * `open` after the fix with nothing to notice. The field is gone. A verdict
 * now carries only what the registry cannot derive — whether the owning half
 * is built, and the file that proves it — and the status comes from
 * `ccSeamStatus`, through `SPINE_SEAMS_REPORTING_OPEN` and
 * `SPINE_SEAMS_STALE`, which empty themselves.
 */
export interface CcSpineSeamVerdict {
  readonly id: CcSeamId
  /** Whether the owning half is built and reached, checked on its own terms. */
  readonly owningHalfBuilt: boolean
  /** The file that proves it, so the claim is openable. */
  readonly evidence: string
}

export const CC_SPINE_SEAM_VERDICTS = [
  {
    id: 'sync-state-chrome-host',
    owningHalfBuilt: true,
    evidence:
      'app/command-center/live-shift-board/page.tsx mounts MOD-CC-01 and fills the shell chrome prop with MOD-CC-02 components through src/surfaces/cc/modules/cc-01/BoardSyncChrome.tsx.',
  },
  {
    id: 'operational-action-set',
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
  /** What the constant read while the finding stood. Historical, not current. */
  declaredWhenReported: 8,
  /** What it reads now, and the slice both rows name as their owner. */
  advancedTo: 9,
  ruling:
    'Was stale, not wrong: the derivation was sound and its one input had never been advanced, because the idiom is that the slice closing a seam advances the number and no slice-9 task owned the file. Advanced to 9 in one change with the prose and the five pinning assertions, after each closure was checked against what the row had recorded rather than against the calendar alone.',
  /**
   * WHAT THE FIX ACTUALLY TOUCHED. This list held five files while the
   * finding stood and was short by exactly three — `tests/unit/cc-spine.test.ts`,
   * `tests/component/cc-shell.test.tsx` and `tests/component/cc-10.test.tsx`
   * each pinned the stale value in their own form, so anyone performing the
   * fix from the five left three suites red. Eight, measured by performing it.
   */
  fixTouches: [
    'src/surfaces/cc/seams.ts',
    'src/surfaces/cc/modules/cc-10/service.ts',
    'src/surfaces/cc/seams/spine-status.ts',
    'tests/unit/cc-seams.test.ts',
    'tests/unit/cc-spine.test.ts',
    'tests/unit/cc-10.test.ts',
    'tests/component/cc-shell.test.tsx',
    'tests/component/cc-10.test.tsx',
  ],
} as const
