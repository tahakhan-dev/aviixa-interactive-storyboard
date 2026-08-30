/**
 * `MOD-FL-A4` — Data Capture and Evidence. The identity card, transcribed.
 *
 * The card runs L40708-L40716: Identifier and Name (L40708), Purpose
 * (L40710), User benefit (L40712), Owning surface (L40714), and Roles that
 * see and use it (L40716). Five statements, and each one is carried WHOLE
 * rather than trimmed to fit a card — the Owning-surface line's second
 * sentence is the one that stops this module being built as if the oversight
 * surfaces could edit what it produces, and a trimmed version loses exactly
 * that.
 *
 * The five behaviour statements below are from the same section and are on
 * the card in the same sense: they are claims this module makes on screen.
 * Offline behaviour (L40757) is here because `AC-FL-000-4` (L39099) and this
 * build's standing position both require the offline account to be STATED
 * even where slice 7 does not simulate it — a screen that renders only the
 * connected path implies the capture layer needs a network, and L40757 says
 * in its own words that "Nothing about capture depends on connectivity."
 *
 * NOTHING HERE IS PARAPHRASED, and nothing here counts anything. There is no
 * pace, no timer, no countdown, no ranking and no productivity comparison in
 * any string this file holds — `AC-FL-000-5` (L39100) and `AC-SCOPE-045`
 * (L2683) are categorical, and `tests/unit/fl-a4.test.ts` sweeps every string
 * this module renders rather than trusting this sentence.
 */

export type Fla4CharterStatementId =
  | 'identifier'
  | 'purpose'
  | 'user-benefit'
  | 'owning-surface'
  | 'roles'
  | 'offline-behaviour'
  | 'online-behaviour'
  | 'reconnect-behaviour'
  | 'artificial-intelligence'
  | 'security'
  | 'terminal-safe-state'

export const FLA4_CHARTER_STATEMENT_IDS = [
  'identifier',
  'purpose',
  'user-benefit',
  'owning-surface',
  'roles',
  'offline-behaviour',
  'online-behaviour',
  'reconnect-behaviour',
  'artificial-intelligence',
  'security',
  'terminal-safe-state',
] as const satisfies readonly Fla4CharterStatementId[]

type MissingFromStatementIds = Exclude<
  Fla4CharterStatementId,
  (typeof FLA4_CHARTER_STATEMENT_IDS)[number]
>
const _statementIdsExhaustive: MissingFromStatementIds extends never ? true : never = true
void _statementIdsExhaustive

/** The source's own classification vocabulary, in the source's own words. */
export type Fla4SourceClass =
  | 'SoW Fact'
  | 'Derived Clarification'
  | 'Client Decision Required'

export interface Fla4CharterStatement {
  readonly id: Fla4CharterStatementId
  /** The heading the claim renders under. */
  readonly heading: string
  /** The claim, in the frozen source's own words. Never paraphrased. */
  readonly text: string
  readonly sourceRef: string
  readonly sourceClass: Fla4SourceClass
}

export const FLA4_CHARTER_STATEMENTS = [
  {
    id: 'identifier',
    heading: 'Identifier and name',
    text: 'MOD-FL-A4. Data Capture and Evidence.',
    sourceRef: 'L40708',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'purpose',
    heading: 'Purpose',
    text: 'To be where the application earns its less-error-prone-than-paper claim and where the platform’s evidence integrity is established at source.',
    sourceRef: 'L40710',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'user-benefit',
    heading: 'User benefit',
    text: 'Mistakes are caught at the moment of entry rather than at review a day later. Photographs are taken once and are correct forever. Nobody types a part number that the step already knows.',
    sourceRef: 'L40712',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'owning-surface',
    heading: 'Owning surface',
    text: 'Frontline Worker Application (SURF-FL), sole point of creation. The Client Command Center and the Delivery Operations Hub display evidence; they never edit it.',
    sourceRef: 'L40714',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'roles',
    heading: 'Roles that see and use it',
    text: 'Worker, for capture. Supervisor and Quality Manager see the resulting evidence on oversight surfaces, read-only, and may mark evidence reviewed there (Client Command Center action 7, Quality Manager and above).',
    sourceRef: 'L40716',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'offline-behaviour',
    heading: 'Offline behaviour',
    text: 'Fully identical capture, evaluation, feedback, evidence writing, and envelope construction. Nothing about capture depends on connectivity. Only the server-receipt timestamp is absent, and the record shows the capture as not yet server received.',
    sourceRef: 'L40757',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'online-behaviour',
    heading: 'Online behaviour',
    text: 'Identical capture behaviour, plus immediate upload of committed captures and evidence, plus agent-selected coaching where a Prevention Agent card fires at the step. Live in-specification feedback is unchanged, because it never depended on the network.',
    sourceRef: 'L40755',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'reconnect-behaviour',
    heading: 'Reconnect behaviour',
    text: 'Committed captures and evidence upload on the durable, resumable queue; media is evicted from the device only after confirmed server receipt plus an integrity check, never on the strength of an attempted upload.',
    sourceRef: 'L40759',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'artificial-intelligence',
    heading: 'Artificial-intelligence behaviour',
    text: 'Not applicable to the capture and evaluation path — no artificial-intelligence model sits in the deviation-triggering path, and detection is rule-based and runs on the worker’s device.',
    sourceRef: 'L40761',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'security',
    heading: 'Security',
    text: 'Captured media stays in the application’s encrypted store and never touches the device gallery: a photo taken for a torque-proof screen is bound into the platform’s evidence chain and does not leak into a camera roll where it could be shared, deleted, or stripped of its binding.',
    sourceRef: 'L40783',
    sourceClass: 'SoW Fact',
  },
  {
    id: 'terminal-safe-state',
    heading: 'Terminal safe state',
    text: 'The terminal safe state is a blocked step with an explicit statement that the reading was not recorded and must not be treated as recorded, because a worker who believes a value is recorded when it is not is the single most dangerous state this module can produce.',
    sourceRef: 'L40859',
    sourceClass: 'Derived Clarification',
  },
] as const satisfies readonly Fla4CharterStatement[]

/**
 * Total over the eleven. Never throws: a placeholder that DISCLOSES the
 * registry defect on screen beats a render that crashes, and the covering
 * test asserts the ids and the records agree, so it is unreachable while that
 * test holds.
 */
export function fla4CharterStatement(id: Fla4CharterStatementId): Fla4CharterStatement {
  return (
    FLA4_CHARTER_STATEMENTS.find((s) => s.id === id) ?? {
      id,
      heading: 'Missing charter statement',
      text: `No charter statement is recorded for “${id}”. This is a defect in this build’s registry, stated here rather than hidden.`,
      sourceRef: 'none',
      sourceClass: 'Derived Clarification',
    }
  )
}
