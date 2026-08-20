import { SEEDED_CERTIFICATION_TYPES } from '../../hub/location-configuration/fixtures'
import type {
  Assignment,
  QualificationRequirement,
  RawTenantPosture,
  RunOnDevice,
  TagMappingRead,
  WorkflowUnderAuthoring,
} from '@/studio/modules/stu-13/qualifications'

/**
 * `MOD-STU-13`'s seeded scenario — the source's own Bright Bikes worked
 * example at **L33727**, and slice 4's certification-type fixture underneath
 * it.
 *
 * ### THE CERTIFICATION LIST IS SLICE 4'S, EXTENDED HERE, AND THE EXTENSION
 * ### IS DECLARED RATHER THAN SILENT — A FINDING
 *
 * `AC-STU-119` (L33770) seams this module to `MOD-DOH-04`'s certification
 * types: the Studio reads that list and can never create, edit or delete a
 * row in it. That list is slice 4's D22 fixture,
 * `SEEDED_CERTIFICATION_TYPES`, and it is imported here rather than copied —
 * a second copy of a master-data list is exactly what the seam exists to
 * prevent.
 *
 * It holds four rows: Lockout and tagout, Solvent handling, Metrology and
 * gauge calibration, and Counterbalance truck operation. **Neither of the two
 * certifications this module's own illustrative example names is among
 * them** — L33727 requires "Torque Wrench Operator Certification" as the
 * baseline and "Pneumatic Tool Certification" as the screen-level override,
 * and L54899 names the torque certification again as what a Service Type tag
 * maps to.
 *
 * The two lists were written for different modules and neither is wrong. The
 * choice here is to seed the source's own two ALONGSIDE slice 4's four, with
 * the locator on each, so that:
 *
 * - the screen can render the worked example the source states, instead of
 *   showing the tenant's own published example blocked at check 8; and
 * - `MAINTAINED_CERTIFICATIONS` stays ONE list, so publish check 8 has one
 *   thing to be true about.
 *
 * The alternative — treating slice 4's four as the whole truth — would make
 * L33727's baseline itself unmaintained, which is a statement about the
 * fixture and not about the product. Recorded as a finding for the
 * controller: the D22 seeded list has no torque or pneumatic row, and slice 4
 * has no screen that would add one.
 */

/** L33727 — the Workflow baseline of the source's own worked example. */
export const TORQUE_CERTIFICATION = 'Torque Wrench Operator Certification'

/** L33727 — the additional certification screens 3 through 10 require. */
export const PNEUMATIC_CERTIFICATION = 'Pneumatic Tool Certification'

/**
 * What the tenant maintains, read across the `worker-certification-list`
 * seam. Names, not records: this module names certifications, never people
 * (L33756), so nothing here carries personal data.
 */
export const MAINTAINED_CERTIFICATIONS: readonly string[] = [
  ...SEEDED_CERTIFICATION_TYPES.map((c) => c.name),
  TORQUE_CERTIFICATION,
  PNEUMATIC_CERTIFICATION,
]

/**
 * The Workflow in view — `SEQ-011`'s wheel-bolt torque verification, the same
 * Workflow the rest of this slice's screens show their own slice of.
 */
export const WHEEL_BOLT_WORKFLOW: WorkflowUnderAuthoring = {
  workflowId: 'WF-WHEEL-BOLT',
  workflowName: 'Assembly — Wheel Bolt Torque Verification',
  serviceTypeTag: 'Torque verification',
}

/**
 * The tenant's tag-to-qualification-set mapping, as it answers for that tag.
 *
 * IT CARRIES MORE THAN THE AUTHORED SET ON PURPOSE. L54899 is the source's
 * worked case: "Priya maps a Service Type tag to a qualification set
 * including Torque Wrench Operator Certification. Sam creates a Job with that
 * tag; the requirements pre-populate and he removes one that does not apply.
 * The Job runs on his edited set, not the tag's." A fixture whose tag set
 * equals the authored set cannot tell a build that honours the edit from one
 * that silently re-applies the tag — the assertion would pass either way.
 */
export const BRIGHT_BIKES_TAG_MAPPING: TagMappingRead = {
  ok: true,
  certifications: [TORQUE_CERTIFICATION, 'Metrology and gauge calibration'],
}

/** L33727 — Bright Bikes runs hard-block. Seven days is the tenant's duration. */
export const SEEDED_POSTURE: RawTenantPosture = {
  posture: 'hard-block',
  clearanceDurationDays: 7,
}

/** The version carrying the new overrides publishes here. */
export const PUBLISHED_AT = '2026-08-14T00:00:00Z'

/**
 * Maya and Ahmed from L33727, plus one assignment whose Run is scheduled
 * after publication so that both halves of L33618 have something to be true
 * about: `active` assignments grandfather, later Runs take the change.
 */
export const BRIGHT_BIKES_ASSIGNMENTS: readonly Assignment[] = [
  {
    assignmentId: 'ASG-MAYA-0814',
    workerName: 'Maya',
    runScheduledAt: '2026-08-13T06:00:00Z',
    active: true,
    flagged: false,
    continuation: null,
    evaluation: 'Satisfied',
  },
  {
    assignmentId: 'ASG-AHMED-0814',
    workerName: 'Ahmed',
    runScheduledAt: '2026-08-13T14:00:00Z',
    active: true,
    flagged: false,
    continuation: null,
    evaluation: 'Satisfied',
  },
  {
    assignmentId: 'ASG-MAYA-0816',
    workerName: 'Maya',
    runScheduledAt: '2026-08-16T06:00:00Z',
    active: false,
    flagged: false,
    continuation: null,
    evaluation: 'Satisfied',
  },
]

/**
 * Ahmed's assigned runs on `TAB-014`. L33727: when he reaches screen 3
 * offline the run parks and "he continues his other assigned runs".
 */
export const BRIGHT_BIKES_RUNS: readonly RunOnDevice[] = [
  {
    runId: 'RUN-2026-08-14-A',
    name: 'Wheel Bolt Torque Verification — Line A',
    state: 'Available',
    parkedReason: null,
  },
  {
    runId: 'RUN-2026-08-14-B',
    name: 'Wheel Station Pre-shift Check',
    state: 'Available',
    parkedReason: null,
  },
  {
    runId: 'RUN-2026-08-14-C',
    name: 'Frame Alignment Inspection',
    state: 'Available',
    parkedReason: null,
  },
]

/**
 * The screens the source names as carrying the override: "screens 3 through
 * 10 of Assembly — Wheel Bolt Torque Verification" (L33727).
 */
export const OVERRIDE_SCREENS: readonly { readonly screenId: string; readonly screenName: string }[] =
  [3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    screenId: `screen ${n}`,
    screenName: 'Wheel Bolt Torque Verification',
  }))

/**
 * A second Workflow in the same workspace, so `SB-STU-16`'s cross-Workflow tab
 * shows a WORKSPACE and not one Workflow reported as a count of one.
 *
 * It shares the torque certification with the wheel-bolt Workflow and adds one
 * of its own, so the tab's two counts differ from each other and from the
 * number of rows — a view whose every count reads `1` cannot show a reader
 * whether the counts mean anything.
 */
export const OTHER_WORKSPACE_REQUIREMENTS: readonly QualificationRequirement[] = [
  {
    workflowId: 'WF-BRAKE-BLEED',
    workflowName: 'Assembly — Brake Bleed and Pressure Check',
    serviceTypeTag: null,
    baseline: { certifications: [TORQUE_CERTIFICATION], source: 'Authored' },
    overrides: [
      {
        screenId: 'screen 6',
        screenName: 'Brake Bleed and Pressure Check',
        certification: 'Solvent handling',
      },
    ],
    status: 'Published',
  },
]
