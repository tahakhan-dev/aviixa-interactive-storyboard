/**
 * What the charter CLAIMS, and where each claim was read.
 *
 * Every statement here renders on the module's route. That is the whole
 * discipline: a claim held in data and never drawn is a code comment, and a
 * code comment is not a disclosure. The covering test walks this list against
 * the rendered markup, so adding a statement without rendering it goes red.
 *
 * Nothing in this list is paraphrased. Where the source's sentence is long,
 * the sentence is carried whole rather than trimmed to fit a card.
 *
 * NO STUDIO MODULE COUNT APPEARS HERE, AND THAT IS DELIBERATE. `AC-STU-014`
 * (L30992) binds this build's own screens: "No document, screen, or interface
 * produced by this programme presents a Studio module count as a
 * Statement-of-Work fact." The count is derived (L30897, L30899,
 * `DEC-STUDIO-001`), and this build renders it in exactly one scoped element
 * on the Studio module index, where its qualifier travels with it. This module
 * says "every module on this surface" instead, and a test asserts no count
 * reaches this route.
 */

export type CharterStatementId =
  | 'purpose'
  | 'user-benefit'
  | 'authority'
  | 'no-create-control'
  | 'enable-appears'
  | 'disable-blocks'
  | 'entitlement-visible'
  | 'objects'
  | 'states'
  | 'service-layer'
  | 'audit'
  | 'api-refusal'
  | 'offline'
  | 'artificial-intelligence'
  | 'interconnections'

export const CHARTER_STATEMENT_IDS = [
  'purpose',
  'user-benefit',
  'authority',
  'no-create-control',
  'enable-appears',
  'disable-blocks',
  'entitlement-visible',
  'objects',
  'states',
  'service-layer',
  'audit',
  'api-refusal',
  'offline',
  'artificial-intelligence',
  'interconnections',
] as const satisfies readonly CharterStatementId[]

type MissingFromStatementIds = Exclude<CharterStatementId, (typeof CHARTER_STATEMENT_IDS)[number]>
const _statementIdsExhaustive: MissingFromStatementIds extends never ? true : never = true
void _statementIdsExhaustive

/** How the source classifies the claim, in the source's own vocabulary. */
export type CharterSourceClass = 'SoW Fact' | 'Derived Clarification' | 'Client Decision Required'

export interface CharterStatement {
  readonly id: CharterStatementId
  /** The heading the claim renders under. */
  readonly heading: string
  /** The claim, in the frozen source's own words. */
  readonly text: string
  readonly sourceRef: string
  readonly sourceClass: CharterSourceClass
}

export const CHARTER_STATEMENTS = [
  {
    id: 'purpose',
    heading: 'Purpose',
    text: 'Establish and enforce the Studio’s authority boundary: enable, configure, compose; never define',
    sourceRef: 'L31565',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'user-benefit',
    heading: 'User benefit',
    text: 'A tenant can never accidentally create a safety-critical capability that has no evaluation scenarios behind it, and can always see why a control does not exist',
    sourceRef: 'L31566',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'authority',
    heading: 'The Tier-2 boundary, in four verbs',
    text: 'Enable — turn on a registered capability within the tenant’s entitlement. Configure — set that capability’s parameters per screen and per workflow. Compose — assemble registered capabilities into a new reasoning agent in the Agent Builder. Never define — never create the capability itself, never alter a core agent’s definition, never change the memory architecture, and never modify the evaluation harness.',
    sourceRef: 'L11987',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'no-create-control',
    heading: 'AC-STU-005',
    text: 'No user interface control anywhere in the Studio creates, edits, or deletes an atomic capability.',
    sourceRef: 'L30780',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'enable-appears',
    heading: 'AC-STU-006',
    text: 'Enabling a capability makes its configuration surface appear on the relevant screens with no orchestrator deployment and no tenant-side engineering task.',
    sourceRef: 'L30781',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'disable-blocks',
    heading: 'AC-STU-007',
    text: 'Disabling a capability removes its configuration surface and blocks publication of any Workflow whose screens depend on it, naming the dependent screens.',
    sourceRef: 'L30782',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'entitlement-visible',
    heading: 'AC-STU-008',
    text: 'Capabilities outside the tenant’s entitlement are visible as unavailable with a stated reason, never silently absent.',
    sourceRef: 'L30783',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'objects',
    heading: 'Outputs and objects',
    text: 'No persisted business object. The module’s output is the set of enforcement decisions applied by other modules: which configuration surfaces exist, which controls are absent, and which actions are refused.',
    sourceRef: 'L31585',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'states',
    heading: 'States',
    text: 'Not applicable — the charter is a standing constraint and has no lifecycle.',
    sourceRef: 'L31589',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'service-layer',
    heading: 'Security',
    text: 'The boundary is enforced at the service layer, not the user-interface layer, so that a crafted application programming interface request is refused identically to a user-interface action. Tenant isolation applies: a request naming another tenant’s capability enablement is refused and audited.',
    sourceRef: 'L31668',
    sourceClass: 'Derived Clarification',
  },
  {
    id: 'audit',
    heading: 'Audit-NOT-RENDERED',
    text: 'Every enablement change, every refusal of a define-class request, and every publication blocked on a capability dependency writes to the tenant audit log in the same transaction as the decision.',
    sourceRef: 'L31666',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'api-refusal',
    heading: 'AC-STU-041',
    text: 'A define-class request is refused at the service layer and audited, whether it originates from the user interface or from an application programming interface call.',
    sourceRef: 'L31674',
    sourceClass: 'Derived Clarification',
  },
  {
    id: 'offline',
    heading: 'Offline behaviour',
    text: 'Unavailable — the Studio requires an active connection. The Frontline consequence of this module is that a device only ever executes capabilities that were enabled and configured at package build time, which is why an offline device cannot acquire a new capability.',
    sourceRef: 'L31646',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'artificial-intelligence',
    heading: 'Artificial-intelligence behaviour',
    text: 'None. This module contains no model and makes no inference. It is a deterministic authority check.',
    sourceRef: 'L31650',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'interconnections',
    heading: 'What it constrains',
    text: 'Constrains MOD-STU-05 (which sections appear), MOD-STU-07 (what may be curated versus defined), MOD-STU-12 (publication blocking on unmet capability dependencies), and MOD-STU-15 (composition scope).',
    sourceRef: 'L31656',
    sourceClass: 'SoW Fact',
  },
] as const satisfies readonly CharterStatement[]

/**
 * Total over the fifteen. Never throws: a placeholder that DISCLOSES the
 * registry defect on screen is better than a render that crashes, and the
 * covering test asserts the ids and the records agree, so it is unreachable
 * while that test holds.
 */
export function charterStatement(id: CharterStatementId): CharterStatement {
  return (
    CHARTER_STATEMENTS.find((s) => s.id === id) ?? {
      id,
      heading: 'Missing charter statement',
      text: `No charter statement is recorded for “${id}”. This is a defect in this build’s registry, stated here rather than hidden.`,
      sourceRef: 'none',
      sourceClass: 'Derived Clarification',
    }
  )
}
