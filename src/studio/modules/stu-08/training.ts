import type { TenantId } from '@/domain/ids'
import { isRefusal } from '@/policy/decision'
import {
  STUDIO_PERSONA_COLUMNS,
  evaluateStudioAccess,
  type StudioIdentity,
  type StudioPersonaColumn,
} from '@/studio/access/evaluate'
import {
  applyTransition,
  type ApprovalAuditEntry,
  type ApprovalChain,
  type ApprovalContext,
  type ApprovalTransitionId,
  type ChainStaffing,
  type DiffEngine,
} from '@/studio/modules/stu-11/chain'
import { stu08Row } from './matrix'
import {
  SEEDED_SCENARIO,
  SEEDED_STATE,
  SEEDED_TENANT,
  SEEDED_TIER,
  studioGrantsFor,
  studioIdentityFor,
} from '@/studio/modules/stu-18/rendering'
import { LOCALES, type Locale, type WorkflowStatus } from '@/studio/vocab'

/**
 * `MOD-STU-08`'s content model — `OBJ-STU-TRAINING`, its register, and the
 * ONE write path every act on this module goes through.
 *
 * ### THE EXCLUSION IS ENFORCED BY OMISSION, NOT BY A GUARD
 *
 * L32798 and `FUNC-STU-08-03-A-1` (L32849) require every training item to be
 * excluded from the offline work package, and `AC-STU-080` (L32922) states it
 * as an acceptance criterion: "No work package, in any configuration,
 * contains a Training Library item."
 *
 * **This file contains no reference to a package, a manifest, or
 * `MOD-STU-14`, and that is the enforcement.** A guard that filters training
 * items out of a package can be deleted by a later refactor together with the
 * test that covers it; an absent reference cannot. It is the same shape as
 * `MOD-STU-12`'s publish, which never touches the run register and therefore
 * cannot rebase pinned work. `tests/unit/stu-training.test.ts` asserts the
 * omission by scanning every import specifier in this module, keyed on the
 * SHAPE of a packaging import rather than on one spelling of it.
 *
 * What this module DOES expose to the package side is `trainingItemIds` — a
 * READ, which `MOD-STU-14`'s integrity check (L32918) consumes to verify that
 * no package definition names one. The verification lives with the package;
 * the identifiers live here; nothing here can put one into a package.
 *
 * ### VIEWING PRODUCES NO PRODUCTION RECORD, ALSO BY OMISSION
 *
 * L32799 and `AC-STU-081` (L32923): viewing is not execution, generates no
 * run telemetry, and never substitutes for a qualification. So there is no
 * view act, no telemetry sink and no qualification field anywhere in this
 * module. `AUDITED_TRAINING_ACTS` is the closed set L32912 names — "Every
 * upload, submission, review outcome, release, and archival is audited" —
 * and viewing is not one of the five because it produces nothing to audit.
 *
 * ### ONE MUTATOR, ONE AUDIT JUNCTION
 *
 * `applyTrainingAct` is the only function in this module that returns a
 * changed register. Chain-governed acts route through `MOD-STU-11`'s
 * `applyTransition`, which writes the audit entry before it mutates and
 * refuses outright where the write fails; archival and upload write through
 * the same sink at the same point in the same function. A rule applied at one
 * junction every path crosses is inherited by a new branch rather than
 * remembered by its author.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 * Every timestamp is the caller's.
 */

/* ==================================================================== *
 * THE OBJECT.
 * ==================================================================== */

/**
 * `OBJ-STU-TRAINING` (L32833) = `OBJ-044` (L8741). **D11: the numeric
 * register is canonical and the mnemonic is a label**, so the record carries
 * both identifiers and neither is presented as a second object.
 */
export const TRAINING_ITEM_OBJECT = {
  numericId: 'OBJ-044',
  mnemonic: 'OBJ-STU-TRAINING',
  numericRef: 'L8741',
  mnemonicRef: 'L32833',
  note:
    'One object under two identifiers. D11: the numeric register is canonical and the mnemonic ' +
    'is a label, so nothing here treats them as two objects with two lifecycles.',
} as const

/**
 * `SB-STU-11` (L32887), verbatim. The banner is not conditional on a persona,
 * a state or a connection — it states three things the module deliberately
 * does not do, which is what its "In simple words" paragraph (L32790) says
 * the module is about.
 */
export const TRAINING_BANNER =
  'Training content is delivered online only. It is excluded from offline work packages, ' +
  'generates no production record, and never substitutes for a qualification.'

/**
 * The exclusion guarantee, as a record rather than as prose in a component.
 * `MOD-STU-14` owns the package and its integrity check; this is the
 * statement from THIS side, and it names the identifiers the two modules
 * meet on.
 */
export const TRAINING_PACKAGE_EXCLUSION = {
  acceptanceCriterion: 'AC-STU-080',
  /**
   * `omission`, and it is the whole point. Nothing in this module can add an
   * item to a package because nothing in this module knows a package exists.
   */
  enforcedBy: 'omission',
  statement:
    'No work package, in any configuration, contains a Training Library item. On restoration, ' +
    'package definitions are re-verified to confirm no training item was included; any inclusion ' +
    'is treated as a package integrity failure and the package is quarantined rather than ' +
    'delivered. A failure here never blocks a Run, because no Run depends on training content.',
  /** What the package side reads from here. A read, never a write. */
  consumedBy: 'MOD-STU-14’s package integrity check, over `trainingItemIds`',
  sourceRefs: ['L32798', 'FUNC-STU-08-03-A-1 L32849', 'L32918', 'L32922', 'AC-STU-120 L33941'],
} as const

/**
 * A GAP DECLARED, NOT FILLED. L32798 puts "storage, entitlement, and
 * package-exclusion controls" platform-side, and L32827 makes a storage
 * entitlement a precondition of this module — but `src/studio/seams.ts`
 * registers no seam for a platform-side storage entitlement, so there is no
 * `StudioSeamNotice` to render for it. The absence is stated on screen rather
 * than being papered over with an invented seam or a fabricated control, and
 * it is reported to the controller as a registry gap.
 */
export const STORAGE_ENTITLEMENT_GAP = {
  registeredSeam: null,
  screenNote:
    'Storage, entitlement and package-exclusion controls sit platform-side (L32798). The Studio ' +
    'states the entitlement and what remains of it; it does not raise, lower or administer one, ' +
    'and no control here does. No cross-slice seam is registered for the platform-side storage ' +
    'entitlement, so this is a declared gap rather than a rendered seam.',
  sourceRefs: ['L32798', 'L32827', 'L32865', 'L32910'],
} as const

/* ==================================================================== *
 * THE ITEM.
 * ==================================================================== */

/**
 * The five acts L32912 audits, in the source's own order and wording: "Every
 * upload, submission, review outcome, release, and archival is audited with
 * the same permanent history as work instructions."
 *
 * Viewing is not among them, and its absence is the rule rather than an
 * oversight — `AC-STU-081` (L32923).
 */
export type AuditedTrainingAct =
  | 'upload'
  | 'submission'
  | 'review outcome'
  | 'release'
  | 'archival'

export const AUDITED_TRAINING_ACTS = [
  'upload',
  'submission',
  'review outcome',
  'release',
  'archival',
] as const satisfies readonly AuditedTrainingAct[]

type MissingFromAudited = Exclude<AuditedTrainingAct, (typeof AUDITED_TRAINING_ACTS)[number]>
const _auditedExhaustive: MissingFromAudited extends never ? true : never = true
void _auditedExhaustive

export interface TrainingAuditEntry {
  readonly act: AuditedTrainingAct
  readonly itemId: string
  readonly identityId: string
  readonly at: string
  /** L33387 — the permanent history records what happened, not just that it did. */
  readonly detail: string
  /** A refusal is recorded AS A REFUSAL and never as a transition. */
  readonly outcome: 'applied' | 'refused'
  /** The chain transition this entry came from, or `null` for upload and archival. */
  readonly transition: ApprovalTransitionId | null
}

export type TrainingAuditWrite = (entry: TrainingAuditEntry) => 'committed' | 'failed'

/**
 * `OBJ-STU-TRAINING`. The five fields `SB-STU-11` (L32887) asks a list row to
 * show — title, language coverage, version, status, last published date —
 * plus the approval log the same sentence requires on each item.
 *
 * `status` uses `WorkflowStatus`, the four states L32835 names: "Draft, In
 * Review, Published, Archived, mirroring the Workflow lifecycle because the
 * source requires the same chain and the same permanent history." A second
 * four-member enumeration spelled the same way is a defect even when both
 * spellings work, so the hoisted vocabulary is consumed rather than copied.
 *
 * THERE IS NO TELEMETRY FIELD AND NO QUALIFICATION FIELD. Not one is omitted
 * by oversight: `FUNC-STU-08-03-B-1` (L32851) prohibits every role from
 * configuring one, and a field nothing may ever set is a field that should
 * not exist.
 */
export interface TrainingItem {
  readonly id: string
  readonly title: string
  /** Authored per language, never translated at run time (L32797, AC-STU-083). */
  readonly authoredLocales: readonly Locale[]
  readonly version: string | null
  readonly status: WorkflowStatus
  readonly lastPublishedAt: string | null
  /** Megabytes against the tenant's platform-side entitlement. */
  readonly sizeMb: number
  /** The permanent history — every committed transition, in order (L32912). */
  readonly approvalLog: readonly ApprovalAuditEntry[]
  /** `MOD-STU-11`'s chain value, or `null` before a submission exists. */
  readonly chain: ApprovalChain | null
}

/**
 * The tenant's platform-side storage entitlement for training content
 * (L32798, L32827). The Studio STATES it; it never administers it.
 */
export interface StorageEntitlement {
  readonly ceilingMb: number
  readonly usedMb: number
}

export function remainingStorageMb(entitlement: StorageEntitlement): number {
  return entitlement.ceilingMb - entitlement.usedMb
}

export interface TrainingRegister {
  readonly tenant: TenantId
  readonly items: readonly TrainingItem[]
  readonly entitlement: StorageEntitlement
}

/**
 * The Bright Bikes seed, the source's own illustrative example (L32889):
 * Elena publishes a twelve-minute orientation video, "Wheel Station Safety
 * and Torque Basics", in English and Spanish.
 */
export const SEEDED_TRAINING_REGISTER: TrainingRegister = {
  tenant: SEEDED_TENANT,
  items: [
    {
      id: 'TRN-001',
      title: 'Wheel Station Safety and Torque Basics',
      authoredLocales: [...LOCALES],
      version: null,
      status: 'Draft',
      lastPublishedAt: null,
      sizeMb: 310,
      approvalLog: [],
      chain: null,
    },
  ],
  entitlement: { ceilingMb: 4_096, usedMb: 310 },
}

/** What `MOD-STU-14`'s package integrity check reads. A read, never a write. */
export function trainingItemIds(register: TrainingRegister): readonly string[] {
  return register.items.map((item) => item.id)
}

/* ==================================================================== *
 * THE ACTORS. Reused from MOD-STU-18's seeds, never re-declared.
 * ==================================================================== */

/**
 * The chain needs three DISTINCT people (L33245, L33243) and `MOD-STU-18`
 * seeds exactly one Quality Manager, so this module adds exactly one more —
 * the tenant-default Release Authority — and takes every other actor from
 * `MOD-STU-18`'s own seeded identities rather than minting a second register.
 *
 * REPORTED, NOT REACHED FOR: `studioIdentityFor` is keyed on the persona
 * COLUMN and the chain is keyed on an IDENTITY, so an identity-keyed lookup
 * belongs beside the seeds in `stu-18/rendering.ts`. Lifting it would edit a
 * file this task does not own.
 */
export const TRAINING_RELEASE_AUTHORITY: StudioIdentity = {
  identityId: 'IDN-BB-RELEASE',
  roles: ['QUALITY_MANAGER'],
  signedIn: true,
  tenant: SEEDED_TENANT,
}

function personaOf(identityId: string): StudioPersonaColumn | null {
  for (const persona of STUDIO_PERSONA_COLUMNS) {
    if (studioIdentityFor(persona).identityId === identityId) return persona
  }
  return null
}

function actorFor(identityId: string): {
  identity: StudioIdentity
  persona: StudioPersonaColumn | null
} {
  const persona = personaOf(identityId)
  if (persona === null) {
    if (identityId === TRAINING_RELEASE_AUTHORITY.identityId) {
      return { identity: TRAINING_RELEASE_AUTHORITY, persona: null }
    }
    // An unknown actor is not guessed into a role. It resolves no persona
    // column, and the evaluator refuses it by name.
    return {
      identity: { identityId, roles: [], signedIn: true, tenant: SEEDED_TENANT },
      persona: null,
    }
  }
  return { identity: studioIdentityFor(persona), persona }
}

/**
 * Who may occupy which stage on a training submission. Read by
 * `checkChainStaffable` BEFORE a submission is accepted, so a tenant that
 * cannot release learns it at submission rather than after the authoring
 * cycle is spent (`FUNC-STU-11-02-A-2`, `DEC-RELAUTH-001`).
 */
export const TRAINING_STAFFING: ChainStaffing = {
  authoringGrantHolders: ['IDN-BB-ELENA', 'IDN-BB-SAM'],
  reviewerEligible: ['IDN-BB-ELENA', 'IDN-BB-SAM'],
  releaseAuthorityEligible: ['IDN-BB-ELENA', TRAINING_RELEASE_AUTHORITY.identityId],
}

/**
 * `MOD-STU-12` owns the real diff engine; this is the fixture this
 * storyboard hands the chain, exactly as `MOD-STU-11` hands one for the
 * Workflow. `ownedBy` says whose it is so the borrowing is visible.
 */
const TRAINING_DIFF_ENGINE: DiffEngine = {
  ownedBy: 'MOD-STU-12',
  diff: () => ({
    available: true,
    changedScreens: 1,
    changeSummary: 'Orientation content authored in English and Spanish',
    nextVersion: 'v1.0.0',
  }),
}

/* ==================================================================== *
 * THE ONE MUTATOR.
 * ==================================================================== */

export type TrainingAct =
  | { readonly kind: 'upload'; readonly title: string; readonly sizeMb: number }
  | { readonly kind: 'submit' }
  | { readonly kind: 'advance' }
  | { readonly kind: 'release' }
  | { readonly kind: 'archive' }

export type TrainingActResult =
  | { readonly outcome: 'applied'; readonly register: TrainingRegister }
  | {
      readonly outcome: 'refused'
      /** The register, byte-for-byte as it was. */
      readonly register: TrainingRegister
      readonly reason: string
    }

/** The transition each chain-governed act takes, and the act it is audited as. */
const CHAIN_ACTS = {
  submit: { transition: 'submit', audited: 'submission' },
  advance: { transition: 'advance', audited: 'review outcome' },
  release: { transition: 'release', audited: 'release' },
} as const satisfies Readonly<
  Record<string, { transition: ApprovalTransitionId; audited: AuditedTrainingAct }>
>

/**
 * ONE mapping from the chain's state to the item's status, so the two can
 * never disagree. L32835's four states against L33289's five submission
 * states: `Submitted`, `Advanced` and `Returned with comments` are all "In
 * Review" to a reader of the library, `Released` is `Published`, and a
 * withdrawn submission is back to a `Draft`. `Archived` is not reached from
 * here — archival is its own act, outside the chain (L32821).
 */
function statusFromChain(chain: ApprovalChain): WorkflowStatus {
  switch (chain.state) {
    case 'Released':
      return 'Published'
    case 'Withdrawn':
      return 'Draft'
    default:
      return 'In Review'
  }
}

function itemIndex(register: TrainingRegister, itemId: string): number {
  return register.items.findIndex((item) => item.id === itemId)
}

function replaced(
  register: TrainingRegister,
  index: number,
  item: TrainingItem,
): TrainingRegister {
  return { ...register, items: register.items.map((old, i) => (i === index ? item : old)) }
}

/**
 * THE ONE ENTRY POINT. Every act on this module returns from here, and the
 * audit sink is a REQUIRED parameter with no default: a write with nowhere to
 * record it is not a write this module performs.
 *
 * Chain-governed acts hand `MOD-STU-11` an adapter over the SAME sink, so the
 * ordering rule that file holds — audit after every domain refusal, before
 * any mutation — governs them without being restated here. Upload and
 * archival are not chain transitions (L32817, L32821), so they write through
 * the same sink at the same point in this function and refuse identically
 * when it fails.
 */
export function applyTrainingAct(
  register: TrainingRegister,
  itemId: string,
  act: TrainingAct,
  identityId: string,
  writeAudit: TrainingAuditWrite,
  at = '2026-03-02T09:00:00.000Z',
): TrainingActResult {
  const { identity, persona } = actorFor(identityId)

  if (act.kind === 'upload') {
    const remaining = remainingStorageMb(register.entitlement)
    if (act.sizeMb > remaining) {
      return {
        outcome: 'refused',
        register,
        reason:
          `Upload refused: “${act.title}” needs ${act.sizeMb} MB and ${remaining} MB remain of ` +
          `this tenant’s ${register.entitlement.ceilingMb} MB training-content entitlement. The ` +
          'entitlement is named because the control that raises it sits platform-side (L32798, ' +
          'L32865); nothing in the Studio can widen it.',
      }
    }
    const newItem: TrainingItem = {
      id: `TRN-${String(register.items.length + 1).padStart(3, '0')}`,
      title: act.title,
      authoredLocales: [...LOCALES],
      version: null,
      status: 'Draft',
      lastPublishedAt: null,
      sizeMb: act.sizeMb,
      approvalLog: [],
      chain: null,
    }
    const written = writeAudit({
      act: 'upload',
      itemId: newItem.id,
      identityId,
      at,
      detail: `${act.title} — ${act.sizeMb} MB, authored in ${newItem.authoredLocales.join(' and ')}`,
      outcome: 'applied',
      transition: null,
    })
    if (written === 'failed') {
      return {
        outcome: 'refused',
        register,
        reason:
          'The audit entry could not be written, so the upload is not recorded and does not ' +
          'happen. The permanent history commits with the change or neither does (L32912, L33387).',
      }
    }
    return {
      outcome: 'applied',
      register: {
        ...register,
        items: [...register.items, newItem],
        entitlement: {
          ...register.entitlement,
          usedMb: register.entitlement.usedMb + act.sizeMb,
        },
      },
    }
  }

  const index = itemIndex(register, itemId)
  const item = register.items[index]
  if (item === undefined) {
    return {
      outcome: 'refused',
      register,
      reason: `No training item “${itemId}” is in this register, so there is nothing to act on.`,
    }
  }

  if (act.kind === 'archive') {
    // Row 5 of THIS module's table (L32821), through the same evaluator every
    // control uses — per row, never a role list, and never a hand-written
    // persona check beside the matrix that already answers it.
    const decision = evaluateStudioAccess({
      row: stu08Row('archive-content'),
      identity,
      grants: persona === null ? {} : studioGrantsFor({ ...SEEDED_SCENARIO, persona }),
      commercialTier: SEEDED_TIER,
      identityLayer: 'reachable',
      state: SEEDED_STATE,
      online: true,
      resourceTenant: register.tenant,
      authorOfRecord: null,
      reviewerOfRecord: null,
      releaseAuthorityOfRecord: null,
    })
    if (isRefusal(decision.decision)) {
      return { outcome: 'refused', register, reason: decision.reason }
    }
    const written = writeAudit({
      act: 'archival',
      itemId: item.id,
      identityId,
      at,
      detail: `${item.title} — archived; it remains permanently readable in history`,
      outcome: 'applied',
      transition: null,
    })
    if (written === 'failed') {
      return {
        outcome: 'refused',
        register,
        reason:
          'The audit entry could not be written, so the archival is not recorded and the item ' +
          'stays exactly where it was. The permanent history commits with the change or neither ' +
          'does (L32912, L33387).',
      }
    }
    return { outcome: 'applied', register: replaced(register, index, { ...item, status: 'Archived' }) }
  }

  const { transition, audited } = CHAIN_ACTS[act.kind]
  const context: ApprovalContext = {
    actor: identity,
    grants: persona === null ? {} : studioGrantsFor({ ...SEEDED_SCENARIO, persona }),
    commercialTier: SEEDED_TIER,
    identityLayer: 'reachable',
    domain: SEEDED_STATE,
    online: true,
    at,
    audit: (entry: ApprovalAuditEntry) => {
      const written = writeAudit({
        act: audited,
        itemId: item.id,
        identityId: entry.actor,
        at: entry.at,
        detail:
          `${item.title} — ${entry.transition}` +
          (entry.version === null ? '' : `, version ${entry.version}`),
        outcome: entry.kind === 'refusal' ? 'refused' : 'applied',
        transition: entry.transition,
      })
      return written === 'committed'
        ? { ok: true }
        : { ok: false, reason: 'The training-library audit sink refused the entry' }
    },
    staffing: TRAINING_STAFFING,
    diff: TRAINING_DIFF_ENGINE,
  }

  const outcome = applyTransition(item.chain, transition, context, {
    submissionId: `SUB-${item.id}`,
    consumer: 'training-library',
    subject: item.title,
    tenant: register.tenant,
  })

  if (!outcome.ok) {
    return { outcome: 'refused', register, reason: outcome.refusal.reason }
  }

  const chain = outcome.chain
  return {
    outcome: 'applied',
    register: replaced(register, index, {
      ...item,
      chain,
      status: statusFromChain(chain),
      version: chain.versionMinted,
      lastPublishedAt: chain.state === 'Released' ? at : item.lastPublishedAt,
      approvalLog: chain.log,
    }),
  }
}

/* ==================================================================== *
 * The named wrappers. Every one routes through `applyTrainingAct`.
 * ==================================================================== */

/**
 * FIVE ACTS, AND THE OMISSIONS ARE DELIBERATE. `withdraw`, `resubmit`,
 * `return-with-comments` and `decline` are `MOD-STU-11`'s own approval queue
 * (`SB-STU-14`, L33357), which owns the Reviewer's two lawful outcomes and
 * the Author's corrections. Offering them here would be a second approval
 * screen for one chain — this module is a CONSUMER of the chain (L32846),
 * not a second one.
 */
export const trainingService = {
  upload: (
    register: TrainingRegister,
    title: string,
    sizeMb: number,
    identityId: string,
    writeAudit: TrainingAuditWrite,
  ): TrainingActResult =>
    applyTrainingAct(register, '', { kind: 'upload', title, sizeMb }, identityId, writeAudit),

  submit: (
    register: TrainingRegister,
    itemId: string,
    identityId: string,
    writeAudit: TrainingAuditWrite,
  ): TrainingActResult =>
    applyTrainingAct(register, itemId, { kind: 'submit' }, identityId, writeAudit),

  advance: (
    register: TrainingRegister,
    itemId: string,
    identityId: string,
    writeAudit: TrainingAuditWrite,
  ): TrainingActResult =>
    applyTrainingAct(register, itemId, { kind: 'advance' }, identityId, writeAudit),

  release: (
    register: TrainingRegister,
    itemId: string,
    identityId: string,
    writeAudit: TrainingAuditWrite,
  ): TrainingActResult =>
    applyTrainingAct(register, itemId, { kind: 'release' }, identityId, writeAudit),

  archive: (
    register: TrainingRegister,
    itemId: string,
    identityId: string,
    writeAudit: TrainingAuditWrite,
  ): TrainingActResult =>
    applyTrainingAct(register, itemId, { kind: 'archive' }, identityId, writeAudit),
}
