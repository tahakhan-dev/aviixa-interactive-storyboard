import { STU_MODULES, type StudioModuleId } from './modules'

/**
 * The SURF-STU spine, part 3 of 3: the cross-slice seam registry. Spec §5,
 * census §6.
 *
 * A SILENT STUB IS THE DEFECT THIS REGISTRY EXISTS TO PREVENT (R10, R21).
 * Every seam is a named interface with a stated owner and a contract
 * sentence, rendered by `@/ui/stu/StudioSeamNotice`, so a module screen
 * that reaches a dependency it does not own says which slice and module
 * owns the other half rather than quietly omitting the behaviour or faking
 * it.
 *
 * WHERE THE COUNTERPART IS UNSCHEDULED, THE ABSENCE IS DECLARED RATHER THAN
 * GUESSED. Four of the rows below carry NO owning slice at all (census
 * §6.3) — the severity action bundle editor, the tag-to-qualification-set
 * mapping, the composed-agent platform review queue, and the multimodal
 * embedding service. The Parts Registry was a fifth and is not any more:
 * slice 6 shipped `MOD-DOH-19`, so that row now carries `ownerSlices: [6]`
 * and reads `scheduled`. An unscheduled declaration that has stopped being
 * true reads, from a screen, exactly like one nobody ever looked up.
 *
 * Slice 4 hit two unregistered dependencies and both modules declared the
 * absence instead of borrowing the nearest identifier; one pinned "the
 * registry lacks this row" with a test built to go red when the row landed,
 * and it did. `ownerSlices: []` is that declaration here, and
 * `stuSeamStatus` derives `unscheduled` from it rather than from a second
 * hand-written flag that could disagree.
 *
 * NO COUNT IS ASSERTED ANYWHERE. The plan's standing ruling — "the census
 * does not reconcile with itself … no gate may key on those numbers.
 * Contents, never cardinality" — applies here as much as to the matrices:
 * the design's §5 table and the census's §6.1/§6.2 tables do not agree with
 * the brief's "twenty-one seams". Every row the census names is registered
 * below, by name, and the covering test asserts the rows, never how many.
 */

/**
 * The slice being built. `stuSeamStatus` reads it so that "built" is
 * derived from the owning slice rather than restated as a second field a
 * hand edit could put out of step with the number beside it.
 */
const THIS_SLICE = 5

export type StudioSeamId =
  // Census §6.1 — the counterpart is already built.
  | 'grant-assignment-and-revocation'
  | 'worker-certification-list'
  | 'worker-profile-difficulty-field'
  | 'qualification-gate-posture-and-clearance-duration'
  | 'shift-timing-for-handoff-schedule'
  | 'tenant-suspension-state'
  | 'atomic-capability-registry'
  | 'global-severity-catalog'
  | 'evaluation-harness'
  // Census §6.2 — the counterpart is registered but unbuilt.
  | 'job-and-run-linkage-counts'
  | 'job-owner-and-adoption-decision'
  | 'package-build-trigger-and-pin'
  | 'qualification-validation-at-assignment'
  | 'frontline-training-library-viewer'
  | 'package-delivery-on-device'
  | 'qualification-clearance-action-ten'
  | 'lane-b-decision'
  | 'escalation-delivery-and-role-resolution'
  | 'tenant-audit-log'
  | 'composed-agent-platform-review'
  // Census §6.3 — no owning slice when the census was taken. Declared,
  // never guessed; `parts-registry` has since acquired one.
  | 'parts-registry'
  | 'severity-action-bundle-editor'
  | 'tag-to-qualification-set-mapping'
  | 'composed-agent-platform-review-queue'
  | 'multimodal-embedding-service'

/**
 * DERIVED FROM `ownerSlices`, NEVER STORED. `built` is a seam whose every
 * owning slice has already shipped; `unscheduled` is a seam with no owning
 * slice at all; everything else is `scheduled`. A stored field would be a
 * second thing to keep true, and the one the notice reads.
 */
export type StudioSeamStatus = 'built' | 'scheduled' | 'unscheduled'

export const STUDIO_SEAM_STATUSES = [
  'built',
  'scheduled',
  'unscheduled',
] as const satisfies readonly StudioSeamStatus[]

type MissingFromSeamStatuses = Exclude<StudioSeamStatus, (typeof STUDIO_SEAM_STATUSES)[number]>
const _seamStatusesExhaustive: MissingFromSeamStatuses extends never ? true : never = true
void _seamStatusesExhaustive

export interface StudioSeamDefinition {
  readonly id: StudioSeamId
  /** One short phrase — what the seam is, as the census names it. */
  readonly name: string
  /** The Studio modules that need the other half. Never empty. */
  readonly consumingModules: readonly StudioModuleId[]
  /**
   * Who owns the other half, stated even where no slice does — the whole
   * point of the §6.3 rows is that the OWNER is known and the SCHEDULE is
   * not.
   */
  readonly owner: string
  /**
   * The slices that own the counterpart. **Empty declares an unscheduled
   * dependency** — it is never a placeholder for a number nobody looked up.
   */
  readonly ownerSlices: readonly number[]
  /** What the seam guarantees, and what happens when it cannot answer. */
  readonly contract: string
  readonly sourceRef: string
}

export const STU_SEAMS = [
  /* ---- Census §6.1 — consumption, the counterpart is already built ---- */
  {
    id: 'grant-assignment-and-revocation',
    name: 'Grant assignment and revocation',
    consumingModules: ['MOD-STU-18'],
    owner: 'MOD-DOH-09, the tenant administration area in the Delivery Operations Hub',
    ownerSlices: [4],
    contract:
      'Grant administration sits in the tenant administration area inside the Delivery Operations Hub. Revocation is an identity-layer action rather than a Studio-layer one, so it holds even if the Studio is degraded. Where a grant cannot be evaluated the Studio denies the authoring capability rather than assuming it, failing closed.',
    sourceRef: 'L34532, L31944, L34588, L34584',
  },
  {
    id: 'worker-certification-list',
    name: 'Worker certification list',
    consumingModules: ['MOD-STU-13'],
    owner: 'MOD-DOH-04',
    ownerSlices: [4],
    contract:
      'The Studio cannot create, edit or delete a certification record. An override naming an unmaintained certification blocks publication with the certification named. Lands on slice 4’s D22 certification-type fixture — the same fixture, never a second one.',
    sourceRef: 'AC-STU-119 L33770',
  },
  {
    id: 'worker-profile-difficulty-field',
    name: 'Worker-profile difficulty field',
    consumingModules: ['MOD-STU-09'],
    owner: 'MOD-DOH-04',
    ownerSlices: [4],
    contract:
      'The profile field is Delivery Operations Hub master data — an additive fixture field, not a new module. Unreadable resolves to the standard level as a defined default rather than an absence.',
    sourceRef: 'L32970, L32998',
  },
  {
    id: 'qualification-gate-posture-and-clearance-duration',
    name: 'Qualification gate posture and clearance duration',
    consumingModules: ['MOD-STU-13'],
    owner: 'The tenant administration area, over slice 4’s floor register',
    ownerSlices: [4],
    contract:
      'Unreadable resolves to the stricter posture, hard-block, because the configurability principle permits stricter and never looser.',
    sourceRef: 'L33674',
  },
  {
    id: 'shift-timing-for-handoff-schedule',
    name: 'Shift timing for SCHED-HANDOFF-001',
    consumingModules: ['MOD-STU-02'],
    owner: 'MOD-DOH-03',
    ownerSlices: [4],
    contract:
      'Default 30 minutes before shift end, computed against the Shift’s own end time rather than a clock this surface holds.',
    sourceRef: 'L67942',
  },
  {
    id: 'tenant-suspension-state',
    name: 'Tenant suspension state',
    consumingModules: ['MOD-STU-10'],
    owner: 'MOD-DOH-01',
    ownerSlices: [4],
    contract:
      'Under soft suspension master-data writes are blocked, including new parts. The refusal names the suspension state, not a technical fault.',
    sourceRef: 'L33121, L33145',
  },
  {
    id: 'atomic-capability-registry',
    name: 'Atomic capability registry, entitlement set and tier',
    consumingModules: ['MOD-STU-01', 'MOD-STU-15'],
    owner: 'MOD-SA-02 / MOD-SA-11',
    ownerSlices: [3],
    contract:
      'Capabilities outside entitlement are visible as unavailable with a stated reason, never silently absent.',
    sourceRef: 'AC-STU-008 L30783',
  },
  {
    id: 'global-severity-catalog',
    name: 'Global severity catalog',
    consumingModules: ['MOD-STU-05', 'MOD-STU-14'],
    owner: 'MOD-SA-07',
    ownerSlices: [3],
    contract:
      'Unreadable blocks publication rather than offering a stale level list.',
    sourceRef: 'L31767',
  },
  {
    id: 'evaluation-harness',
    name: 'Evaluation harness results',
    consumingModules: ['MOD-STU-15'],
    owner: 'MOD-SA-05',
    ownerSlices: [3],
    contract:
      'Unreachable holds the composition at Evaluation pending, and it is never advanced on an assumption.',
    sourceRef: 'L34050',
  },

  /* ---- Census §6.2 — forward, the counterpart is registered but unbuilt ---- */
  {
    id: 'job-and-run-linkage-counts',
    name: 'Job and Run linkage counts',
    consumingModules: ['MOD-STU-03', 'MOD-STU-12'],
    owner: 'MOD-DOH-05 / MOD-DOH-06',
    ownerSlices: [6],
    contract:
      'Renders "Linkage unavailable, last retrieved at" with a timestamp — never zero, because zero is a business answer and this is an absence of one.',
    sourceRef: 'AC-STU-053 L32018',
  },
  {
    id: 'job-owner-and-adoption-decision',
    name: 'Job Owner identity and the adoption decision',
    consumingModules: ['MOD-STU-12'],
    owner: 'MOD-DOH-05',
    ownerSlices: [6],
    contract:
      'A whole matrix column whose only Allowed cell is the adoption decision. The permission keys on a field value, not on a role.',
    sourceRef: 'L33456',
  },
  {
    id: 'package-build-trigger-and-pin',
    name: 'Package build trigger and the pin',
    consumingModules: ['MOD-STU-14'],
    owner: 'MOD-DOH-06',
    ownerSlices: [6],
    contract:
      'The build fires at run assignment in the Delivery Operations Hub. Slice 5 builds the definition, the manifest and the pinning contract and renders the pin; it never fires a build.',
    sourceRef: 'L33823, L53668',
  },
  {
    id: 'qualification-validation-at-assignment',
    name: 'Qualification validation at assignment',
    consumingModules: ['MOD-STU-13'],
    owner: 'MOD-DOH-07',
    ownerSlices: [6],
    contract:
      'The first of three enforcement points. Slice 5 owns the requirement and the evaluator; this enforcement point is slice 6’s.',
    sourceRef: 'census §6.2, module card L33624',
  },
  {
    id: 'frontline-training-library-viewer',
    name: 'Frontline Training Library Viewer',
    consumingModules: ['MOD-STU-08'],
    owner: 'MOD-FL-B12',
    ownerSlices: [7],
    contract:
      'Named three times in the matrix as the Worker’s route. Slice 5 builds the authoring and the exclusion guarantee; the viewer is slice 7’s.',
    sourceRef: 'L32822-L32824',
  },
  {
    id: 'package-delivery-on-device',
    name: 'Package delivery, on-device evaluation and reconnect',
    consumingModules: ['MOD-STU-14'],
    owner: 'MOD-FL-A* / MOD-FL-B*, the Frontline Worker Application',
    ownerSlices: [7, 8],
    contract:
      'Slice 5 owns the manifest and the integrity check; the device owns delivery, evaluation and reconnect. No Studio view claims a device state.',
    sourceRef: 'census §6.2, L33839',
  },
  {
    id: 'qualification-clearance-action-ten',
    name: 'Qualification clearance, action ten',
    consumingModules: ['MOD-STU-13'],
    owner: 'MOD-CC-13',
    ownerSlices: [9],
    contract:
      'The source bars the Studio from granting a clearance, and any agent from granting one. The Hub renders the register, the Command Center exercises the grant, and the Studio renders the requirement.',
    sourceRef: 'L33676',
  },
  {
    id: 'lane-b-decision',
    name: 'Lane-B decision',
    consumingModules: ['MOD-STU-16'],
    owner: 'MOD-CC-06 / MOD-CC-13 action 3',
    ownerSlices: [9],
    contract: 'The Studio displays, it does not decide.',
    sourceRef: 'L34293',
  },
  {
    id: 'escalation-delivery-and-role-resolution',
    name: 'Escalation delivery and role-to-person resolution',
    consumingModules: ['MOD-STU-07'],
    owner: 'MOD-DOH-10',
    ownerSlices: [10],
    contract:
      'Escalation delivery is server-side and is not packaged. The Studio produces routing rules; the Hub resolves them from roles to persons.',
    sourceRef: 'L33799, L31120',
  },
  {
    id: 'tenant-audit-log',
    name: 'The tenant audit log',
    // The census's own consumer column reads "every Studio write". That is
    // every module, MOD-STU-01 included: its Tier-2 refusals are themselves
    // audited acts, and "if the audit write fails, the refusal is still
    // enforced because refusing is the safe direction" (L31599).
    consumingModules: STU_MODULES.map((m) => m.id),
    owner: 'MOD-DOH-17 / MOD-DOH-18',
    ownerSlices: [10],
    contract:
      'The Studio keeps no audit log of its own. Read-through over a seeded fixture — the same pattern slice 4 adopted for Platform Access History, and for the same reason: a second store would be invisible until slice 10 tried to reconcile.',
    sourceRef: 'L31481',
  },
  {
    id: 'composed-agent-platform-review',
    name: 'Composed-agent platform review',
    consumingModules: ['MOD-STU-15'],
    owner: 'SURF-SA',
    ownerSlices: [12],
    contract:
      'A composition is held at Platform review and is never advanced on an assumption. The REVIEW has a surface and a slice; the QUEUE it sits in has neither — see `composed-agent-platform-review-queue`, which is a separate row for exactly that reason.',
    sourceRef: 'census §6.2, L34030',
  },

  /* ---- Census §6.3 — unregistered when the census was taken. Declared,
   *      not guessed. `parts-registry` is no longer among them. ---- */
  {
    /**
     * NO LONGER UNSCHEDULED, AND THAT IS THE WHOLE OF THE FIX. This row sat
     * under the §6.3 heading with `ownerSlices: []` because when slice 5 was
     * built `MOD-DOH-19` was assigned to no slice anywhere in the repo. The
     * re-plan`s §3.0 ruled it into slice 6 — its only dependency
     * (`MOD-DOH-02`) shipped in slice 4 and its second entry point
     * (`MOD-STU-10`) shipped in slice 5 — and slice 6 shipped it, route and
     * matrix. `stuSeamStatus` derives `scheduled` from the number below, so
     * the notice stops saying "owner stated, no slice assigned" about a
     * module that is built.
     *
     * IT STAYS IN THIS BLOCK RATHER THAN MOVING UP, because the block
     * headings record where the CENSUS put each row. Moving it would erase
     * the fact that the census had no slice for it; the number is what
     * carries the correction, and it is the only thing `stuSeamStatus`
     * reads.
     */
    id: 'parts-registry',
    name: 'The parts registry',
    consumingModules: ['MOD-STU-10'],
    owner:
      'MOD-DOH-19 Parts Registry — excluded from slice 4 and named in no later slice’s stated scope at the time this row was written; ruled into slice 6 by the re-plan §3.0 and shipped there, with a route at /hub/parts-registry and its own control matrix (L30070-L30077)',
    ownerSlices: [6],
    contract:
      'MOD-STU-10 depends on it entirely. The seam returns a confirmed or an unconfirmed outcome and the unconfirmed path is the one the gate exercises: if the hand-off cannot be confirmed the reference is not created, because a reference to a part that does not exist in the registry would break genealogy. CROSS-SLICE FINDING, DISCLOSED AND NOT RESOLVED: MOD-STU-10 row 4 (L33116) routes the Tenant Admin into a Hub act — "Complete a skeletal part record", `Allowed — in the Delivery Operations Hub, subject to its own permissions" — and MOD-DOH-19`s own matrix (L30070-L30077, eight rows) contains no row for it. Its nearest row is "Edit a part record" (L30072), which is a field write and not the Skeletal-to-Complete transition the Studio names; the registry`s own state pair is Skeletal and Complete. No row is minted on the Hub side to receive this pointer, because minting one would manufacture a capability in order to justify a pointer, which is the defect and not the fix. Both statements stand as the source wrote them.',
    sourceRef: 'L33143, AC-STU-096 L33220; the finding: L33116 against L30070-L30077',
  },
  {
    id: 'severity-action-bundle-editor',
    name: 'The severity action bundle editor',
    consumingModules: ['MOD-STU-05', 'MOD-STU-14'],
    owner:
      'Stated only as "the tenant administration area". No MOD-DOH-* identifier appears in any card read, and OBJ-049 exists in the object register with no owning module',
    ownerSlices: [],
    contract:
      'MOD-STU-05’s Section 7 consequence preview READS the bundle and MOD-STU-14 packages it. No Studio route offers an editor for it — that is a cross-surface statement, never a control.',
    sourceRef: 'L32379, L33795, OBJ-049 L8837',
  },
  {
    id: 'tag-to-qualification-set-mapping',
    name: 'The tag-to-qualification-set mapping',
    consumingModules: ['MOD-STU-13'],
    owner:
      'Stated only as "tenant administration area master data". No module owns it in any card read',
    ownerSlices: [],
    contract:
      'A named read interface with the source’s own "convenience rather than a requirement" fallback: unreadable means the author states the baseline manually and publication is NOT blocked. This is the one unreadable seam on the surface that does not block.',
    sourceRef: 'L33638, L33662',
  },
  {
    id: 'composed-agent-platform-review-queue',
    name: 'The composed-agent platform review queue',
    consumingModules: ['MOD-STU-15'],
    owner: 'Named in the source, with no MOD-SA-* identifier attached to it anywhere',
    ownerSlices: [],
    contract:
      'A named interface over a seeded outcome fixture. The review itself is scheduled to SURF-SA in slice 12; the queue that holds it is not scheduled anywhere, and the two are registered separately rather than the queue inheriting the review’s slice.',
    sourceRef: 'L67927',
  },
  {
    id: 'multimodal-embedding-service',
    name: 'The multimodal embedding and indexing service',
    consumingModules: ['MOD-STU-07'],
    owner: 'External — the source names the service, currently Gemini Embedding 2.0, and no module',
    ownerSlices: [],
    contract:
      'The storyboard is browser-only with no network, so the index is a seeded fixture with an explicit "not indexed" state. Indexing never changes approval state, which is what makes the simulation honest; DEC-EMBED-001 renders on screen.',
    sourceRef: 'L31191, AC-STU-072 L32764',
  },
] as const satisfies readonly StudioSeamDefinition[]

type MissingFromSeams = Exclude<StudioSeamId, (typeof STU_SEAMS)[number]['id']>
const _seamsExhaustive: MissingFromSeams extends never ? true : never = true
void _seamsExhaustive

/**
 * SEAMS THE STUDIO OWNS FOR LATER SLICES (census §6.4). Registered here
 * rather than left as prose because the handover is the thing that goes
 * missing: a later slice looking for the package manifest's contract needs
 * a row to find, not a paragraph in a spec that closed.
 *
 * A separate export rather than a `direction` discriminator on the rows
 * above: these have no consuming Studio module and no `StudioSeamNotice` to
 * draw — nothing in slice 5 renders an absence for a seam slice 5 owns.
 */
export interface StudioOwnedSeam {
  readonly id: string
  readonly name: string
  /** The slices that consume it. */
  readonly consumingSlices: readonly number[]
  readonly contract: string
  readonly sourceRef: string
}

export const STU_OWNED_SEAMS = [
  {
    id: 'work-package-definition-and-manifest',
    name: 'The work-package definition and manifest',
    consumingSlices: [7, 8],
    contract:
      'The five numbered content classes, the two exclusions, the integrity check and quarantine.',
    sourceRef: 'L33793-L33797, L33799, L33839, L68396',
  },
  {
    id: 'agent-operating-parameters',
    name: 'Agent operating parameters',
    consumingSlices: [11],
    contract:
      'What each of the three standard agents needs, and where it is configured.',
    sourceRef: 'L31705-L31709',
  },
  {
    id: 'threshold-and-deviation-rule-context',
    name: 'Threshold and deviation-rule context',
    consumingSlices: [9],
    contract: 'INT-STU-CC, outbound — the Command Center reads the thresholds the Studio sets.',
    sourceRef: 'L31189',
  },
  {
    id: 'escalation-routing-rules',
    name: 'Escalation routing rules',
    consumingSlices: [10],
    contract:
      'The Studio is the producer of escalation routing rules, which the Delivery Operations Hub then resolves from roles to persons.',
    sourceRef: 'L31120',
  },
  {
    id: 'procedural-and-semantic-memory-writes',
    name: 'Procedural and semantic memory writes',
    consumingSlices: [11],
    contract:
      'The Studio’s write into procedural and semantic memory. Profile memory holds aggregates only, under the personal-information redaction policy.',
    sourceRef: 'L34218-L34219, L34322',
  },
] as const satisfies readonly StudioOwnedSeam[]

/** Every reader takes its register as a parameter. */
export function stuSeamById(
  seams: readonly StudioSeamDefinition[],
  id: StudioSeamId,
): StudioSeamDefinition {
  const found = seams.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown SURF-STU seam: ${id}`)
  return found
}

/**
 * Derived, never stored — see `StudioSeamStatus`. A seam with no owning
 * slice is `unscheduled` and the notice says "owner stated, no slice
 * assigned" over it; a seam every one of whose owning slices has already
 * shipped is `built`, and drawing it as an absence would be a false
 * absence — slice 4's defect shape 4.
 */
export function stuSeamStatus(seam: StudioSeamDefinition): StudioSeamStatus {
  if (seam.ownerSlices.length === 0) return 'unscheduled'
  return seam.ownerSlices.every((slice) => slice < THIS_SLICE) ? 'built' : 'scheduled'
}
