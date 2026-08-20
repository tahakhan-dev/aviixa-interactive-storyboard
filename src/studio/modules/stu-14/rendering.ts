import type { StudioAccessDecision, StudioAccessInput } from '@/studio/access/evaluate'
import { evaluateStudioAccess } from '@/studio/access/evaluate'
import type { DecisionReading } from '@/studio/disclosure/decisions'
import {
  SEEDED_SCENARIO,
  SEEDED_STATE,
  SEEDED_TENANT,
  affordanceFor,
  studioGrantsFor,
  studioIdentityFor,
  type CapabilityAffordance,
  type Stu18Scenario,
} from '@/studio/modules/stu-18/rendering'
import { STU_14_MATRIX, stu14Row, type Stu14RowId } from './matrix'

/**
 * `MOD-STU-14`'s rendering rule, decided ONCE and read by the screen.
 *
 * WHY THIS IMPORTS `stu-18/rendering` RATHER THAN COPYING IT. The six-token
 * affordance rule (`allowed`/`allowedWithConditions` → enabled;
 * `readOnly`/`unavailable` → disabled carrying the CELL'S OWN WORDS;
 * `clientDecisionRequired` → the open decision; `explicitlyProhibited` →
 * ABSENT) is a SURFACE rule, not a module one, and five modules already read
 * it from there.
 *
 * **THERE IS NO SERVICE IN THIS FILE, AND THAT IS THE POINT.** `SB-STU-17` is
 * a read-only manifest. Every write row of this card is `Explicitly
 * prohibited` in all eight columns, and the three rows with an `Allowed` cell
 * anywhere — the build, the re-pull, and execution — are acts of other
 * surfaces (R22). So there is nothing for an enabled control to invoke, no
 * control to draw, and no handler to write. A module that offered one would
 * be putting a Build button on a Studio screen, which is the defect this task
 * is named for.
 *
 * **EVERY REFUSAL ON THIS SCREEN IS AN ABSENCE, AND IT IS CHECKABLE.** A cell
 * renders disabled only where its `routedTo` names a capability this persona
 * actually holds on this surface; no cell of this card names one (see
 * `./matrix.ts`), so `Explicitly prohibited` renders as a note where a
 * control would be and never as a disabled button implying a condition that
 * could become true.
 *
 * **SCOPE IS ENFORCED IN THE READ.** `pinnedVersionAffordance` is asked ONCE
 * for the whole view; where it refuses, the manifest is not drawn rather than
 * drawn and hidden.
 *
 * NO POLICY UNDER `src/ui/`. This file is under `src/studio/`, it computes
 * decisions, and the component it feeds only draws.
 */

export type Stu14Scenario = Stu18Scenario

export function stu14Scenario(over: Partial<Stu14Scenario> = {}): Stu14Scenario {
  return { ...SEEDED_SCENARIO, ...over }
}

/** THE ONE ACCESS CALL THIS MODULE MAKES, per row, over the matrix ROW. */
export function stu14Decision(id: Stu14RowId, s: Stu14Scenario): StudioAccessDecision {
  const input: StudioAccessInput = {
    row: stu14Row(id),
    identity: studioIdentityFor(s.persona),
    grants: studioGrantsFor(s),
    commercialTier: s.commercialTier,
    identityLayer: s.identityLayer,
    state: SEEDED_STATE,
    online: s.online,
    resourceTenant: SEEDED_TENANT,
    // No row of this card occupies an approval stage: a package is assembled
    // by the platform from content that already passed the chain, and
    // `OBJ-045` states it outright — "the package is not separately approved
    // or published; its contents were" (L8763). Written as `null` rather than
    // omitted, so the floor is declared rather than forgotten.
    authorOfRecord: null,
    reviewerOfRecord: null,
    releaseAuthorityOfRecord: null,
  }
  return evaluateStudioAccess(input)
}

const ROW_LABELS = {
  'define-package-contents': 'Define package contents',
  'swap-the-package-of-an-in-flight-run': 'Swap the package of an in-flight Run',
  'include-training-library-content-in-a-package': 'Include Training Library content',
  'exclude-a-severity-mapping-from-a-package': 'Exclude a severity mapping',
  'view-which-package-version-a-run-is-pinned-to': 'View the pinned package version',
} as const satisfies Readonly<Record<Stu14RowId, string>>

export function packageManifestAffordance(
  id: Stu14RowId,
  s: Stu14Scenario,
): CapabilityAffordance {
  return affordanceFor(ROW_LABELS[id], stu14Decision(id, s))
}

/**
 * ROW 7 — whether this persona reads the manifest at all, and how. Asked
 * ONCE for the whole view. The Read-only Auditor's answer is
 * `DEC-AUDSTU-001` and renders as the open decision, never as a guess in
 * either direction (`AC-STU-157`, L34674).
 */
export function pinnedVersionAffordance(s: Stu14Scenario): CapabilityAffordance {
  return packageManifestAffordance('view-which-package-version-a-run-is-pinned-to', s)
}

export interface PackageRefusal {
  readonly id: Stu14RowId
  readonly capability: string
  /** The cell's own words, through the evaluator. Never a bare status token. */
  readonly note: string
  readonly sourceRefs: readonly string[]
}

/**
 * The four rows this card refuses to everyone, each listed with the reason
 * where a control would have been.
 *
 * THE LIST IS THE SAME LENGTH FOR EVERY PERSONA. `AC-STU-155` requires an
 * unavailable capability to be shown with its reason rather than hidden, and
 * a list that shortened for some personas would let a reader infer a
 * capability from the gap. Row 7 is not here: it is what the screen IS, and
 * `pinnedVersionAffordance` answers it once for the whole view.
 */
export function packageRefusals(s: Stu14Scenario): readonly PackageRefusal[] {
  return STU_14_MATRIX.filter((row) => row.id !== 'view-which-package-version-a-run-is-pinned-to')
    .map((row) => {
      const affordance = packageManifestAffordance(row.id, s)
      return {
        id: row.id,
        capability: row.capability,
        note: affordance.kind === 'absent' ? affordance.note : renderedNote(affordance),
        sourceRefs: row.sourceRefs,
      }
    })
}

function renderedNote(affordance: CapabilityAffordance): string {
  switch (affordance.kind) {
    case 'absent':
      return affordance.note
    case 'disabled':
      return affordance.reason
    case 'decision-open':
      return affordance.note
    case 'enabled':
      // Unreachable on these four rows and left as a real branch rather than
      // a cast: if one of them ever evaluates to a permission, the screen
      // says so out loud instead of silently printing a refusal note.
      return affordance.note
  }
}

/* ==================================================================== *
 * TWO OPEN DECISIONS THE STUDIO DECISION CANON DOES NOT CARRY.
 * ==================================================================== */

/**
 * `DEC-PKGFIELD-001` (L33807) and `DEC-STORE-001` (L33850) are both
 * `Client Decision Required` in this module's own Source status block
 * (L33959), and **`src/studio/disclosure/decisions.ts` carries a
 * record for neither**. `D14` mentions `DEC-PKGFIELD-001` inside its adopted
 * text but the canon has no record keyed to it, and `DEC-STORE-001` appears
 * in the canon nowhere at all.
 *
 * They are disclosed HERE, in the canon's own shape, and the gap is declared
 * on `canonNote` rather than papered over by borrowing a neighbouring `D*`
 * identifier — which is how a client searching the canon for one of these
 * would find someone else's decision instead. The task report carries the
 * gap; the canon file is another agent's path list and is read here, never
 * written.
 */
export interface Stu14LocalDisclosure {
  readonly decisionRef: 'DEC-PKGFIELD-001' | 'DEC-STORE-001'
  readonly question: string
  readonly readings: readonly DecisionReading[]
  readonly adopted: string
  /** Why this is disclosed locally rather than through the canon. */
  readonly canonNote: string
}

export const STU_14_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-PKGFIELD-001',
    question:
      'Which values ship inside the package and which live only server-side, field by field?',
    readings: [
      {
        text:
          '§6.7.4 states that the authoritative field-by-field assignment is carried in the ' +
          'package contract of Part VII. Part VII does not enumerate it, so the assignment is ' +
          'stated to exist and is nowhere written down.',
        locator: 'DEC-PKGFIELD-001 · L33807',
      },
      {
        text:
          'The five numbered content classes above are the source’s own list and are the best ' +
          'available approximation — but they are a CONTENT list rather than a field-by-field ' +
          'assignment, and an approved Lane-B value cannot be routed deterministically to either ' +
          'the patch-publication path or the immediate-application path without one.',
        locator: 'DEC-PKGFIELD-001 · L33807 · content classes L33793-L33797',
      },
    ],
    adopted:
      'The manifest presents the five numbered content classes and says plainly that they are a ' +
      'content list, not the field-by-field assignment §6.7.4 promises. No field map is invented ' +
      'here. Decision owner: the platform architect, as an input to the Frontline functional ' +
      'specification.',
    canonNote:
      'The Studio decision canon carries no record for DEC-PKGFIELD-001. D14 (DEC-LANEB-001) ' +
      'names it inside its adopted text as a dependency, which is not the same as disclosing it. ' +
      'Declared here as a gap for the canon rather than filed under a neighbouring identifier.',
  },
  {
    decisionRef: 'DEC-STORE-001',
    question: 'What does a device do when storage runs out?',
    readings: [
      {
        text:
          'Device storage-full behaviour generally is explicitly deferred to the Frontline ' +
          'functional specification and carried as DEC-STORE-001; no behaviour is invented here.',
        locator: 'DEC-STORE-001 · L33850 · FUNC-STU-14-01-B-1 L33850',
      },
      {
        text:
          'What IS stated: coaching assets are included subject to available storage, media is ' +
          'evicted only after confirmed server receipt plus an integrity check, and where storage ' +
          'forces omission the omission is reported and the Run proceeds, because coaching is ' +
          'assistance rather than enforcement.',
        locator: 'L53640 · FUNC-STU-14-01-B-1 L33850',
      },
    ],
    adopted:
      'Storage-full behaviour is deferred and no behaviour is invented here, so this module ' +
      'chooses no asset to drop. It records, by asset name, whatever the device reported ' +
      'omitting — which is the one ' +
      'thing the source does state (AC-STU-127) — and stops there. Run-critical contents are ' +
      'never the omission: no role may prioritise coaching above them.',
    canonNote:
      'The Studio decision canon carries no record for DEC-STORE-001 at all. Declared here as a ' +
      'gap for the canon rather than filed under a neighbouring identifier.',
  },
] as const satisfies readonly Stu14LocalDisclosure[]
