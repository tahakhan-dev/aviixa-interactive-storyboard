import type { DecisionId } from '@/disclosure/decisions'

/**
 * THE SIX PROVENANCE CLASSES, FOR EVERY SURFACE.
 *
 * Section 42.4 draws a classification tree with six leaves and then tables the
 * contract those six leaves must satisfy. The table's header is L89465, its
 * separator L89466, and its six data rows L89467-L89472 — counted to the line
 * the body stops on, not inferred from where the table starts. The dispatch
 * brief for this file located the rows as starting at the header line, which
 * is two lines above the first of them.
 *
 * ── THE ABSOLUTE RULE, AND WHY IT LIVES IN A TABLE COLUMN ──────────────────
 * The rule has its own line and both dispatch briefs cited the table for it.
 * L89439 states it outright, names the two classes it binds, the three scopes
 * it holds under, and why it is not a style preference: labelling a packaged
 * clip as an agent selection makes the execution record assert that an agent
 * evaluated this worker's situation when no agent ran.
 *
 * That sentence is enforceable only because the source ALSO states it as a
 * column, and a sentence with a column behind it can be checked: five
 * of the six classes read `Explicitly prohibited` under "May be called live"
 * and only `PROV-1` reads `Allowed`. So the column is transcribed verbatim and
 * `contractPermits` in `./contract` reads it, rather than any rendering path
 * carrying its own opinion of which classes may claim to be live.
 *
 * The tree makes the same rule structural: there is no edge from the `PROV-3`
 * or `PROV-4` leaves back into the `PROV-1` label, and L89457 says an
 * implementation that produces one "has a defect, not a preference".
 *
 * ── WHAT "VISUALLY DISJOINT" WAS TURNED INTO ───────────────────────────────
 * `SB-42-401` (L89459) closes with "Six shapes, six meanings, no shared visual
 * language between them." An intention, until it is a property. The property
 * this module carries, asserted in `tests/unit/ai-provenance.test.ts` and
 * against real rendered output in `tests/component/provenance-mark.test.tsx`:
 *
 *   1. the six `markerText` values are pairwise distinct;
 *   2. none is a substring of another;
 *   3. each carries at least one WORD no other marker carries — the part that
 *      makes them separable at a glance rather than merely unequal;
 *   4. no record names a colour, and the six rendered marks stay distinct
 *      with every style attribute stripped. This build targets WCAG 2.2 AA
 *      and a distinction carried by colour is not a distinction.
 *
 * Each marker's words are the source's own where the source gives them: the
 * `PROV-2` badge and the `PROV-3` panel heading are quoted from L89459, and
 * `PROV-4`'s "rule" is the label its own tree leaf names at L89451.
 *
 * ── PROV-2 IS AN UNDECIDED CLASS AND RENDERS AS ONE ────────────────────────
 * Its offline cell reads `Client Decision Required`, and it is the only cell
 * in the column that does. The question is asked twice under two identifiers
 * with two different sets of options, and `src/disclosure/decisions.ts` holds
 * it once as `DEC-ONDEVICE-001` with `DEC-LOCALAI-001` as its alias. This
 * module cites the canonical identifier and restates nothing: a second copy of
 * the readings here is how two screens start disclosing one decision
 * differently.
 *
 * This module is data. It decides nothing; `./contract` does the deciding.
 */

export type ProvenanceClassId = 'PROV-1' | 'PROV-2' | 'PROV-3' | 'PROV-4' | 'PROV-5' | 'PROV-6'

export const PROVENANCE_CLASS_IDS = [
  'PROV-1',
  'PROV-2',
  'PROV-3',
  'PROV-4',
  'PROV-5',
  'PROV-6',
] as const satisfies readonly ProvenanceClassId[]

type MissingFromClassIds = Exclude<ProvenanceClassId, (typeof PROVENANCE_CLASS_IDS)[number]>
const _classIdsExhaustive: MissingFromClassIds extends never ? true : never = true
void _classIdsExhaustive

/**
 * The five contract columns a rendering path consults. The seventh column,
 * classification, is provenance about the contract rather than a permission,
 * so it is not one of these.
 */
export type ContractColumn =
  | 'mayBeCalledLive'
  | 'carriesModelOrAgentIdentity'
  | 'carriesContentVersion'
  | 'carriesHumanIdentity'
  | 'permittedWhileOffline'

export interface ProvenanceClass {
  readonly id: ProvenanceClassId
  /** Column 1, less the identifier: the class's name in the source's words. */
  readonly name: string
  /**
   * The rendered marker. Class-level and constant — an instance detail such
   * as an agent's name renders BESIDE it, never inside it, because a marker
   * that varies per instance cannot carry a disjointness property.
   */
  readonly markerText: string
  /** What the class means, in the words a screen can render. */
  readonly meaning: string
  /** Column 2, verbatim. */
  readonly mayBeCalledLive: string
  /** Column 3, verbatim. */
  readonly carriesModelOrAgentIdentity: string
  /** Column 4, verbatim. */
  readonly carriesContentVersion: string
  /** Column 5, verbatim. */
  readonly carriesHumanIdentity: string
  /** Column 6, verbatim. */
  readonly permittedWhileOffline: string
  /**
   * Which sense the offline cell carries, with the row it is read from.
   * `Unavailable` is overloaded across two senses that render oppositely and
   * the slice-4 adjudication is not re-litigated here — the per-cell sense is
   * recorded so a reviewer can check it rather than infer it.
   */
  readonly permittedWhileOfflineSense: string
  /** Column 7, verbatim, backticks included. */
  readonly classification: string
  /** `SB-42-401`'s sentence for this class, verbatim. */
  readonly treatment: string
  readonly treatmentRef: string
  /**
   * Open decisions this class is gated by. Cited through the canon, never
   * restated: the canon holds every reading and the alias identifier.
   */
  readonly decisionRefs: readonly DecisionId[]
  /** The table row this record transcribes. */
  readonly sourceRef: string
}

export const PROVENANCE_CLASSES = [
  {
    id: 'PROV-1',
    name: 'Cloud artificial intelligence',
    markerText: 'Live artificial intelligence',
    meaning: 'Produced by a model during this session, server side.',
    mayBeCalledLive: 'Allowed',
    carriesModelOrAgentIdentity: 'Allowed',
    carriesContentVersion: 'Allowed with conditions',
    carriesHumanIdentity: 'Not applicable — no human authored the selection',
    permittedWhileOffline: 'Unavailable',
    permittedWhileOfflineSense:
      'Unavailable in the sense of cannot happen at all: the class is defined by a server-side '
      + 'invocation during this session, so an offline device has no way to produce one. Not the '
      + 'other sense of the same token, a capability withheld for now. Read from the row at L89467.',
    classification: '`SoW Fact — §7.9.1, §5.2.1`',
    treatment:
      '`PROV-1` renders in a card with an agent badge, the agent\'s name in full ("Prevention Agent"), and a "Why you are seeing this" link opening the trigger and evidence list.',
    treatmentRef: 'L89459',
    decisionRefs: [],
    sourceRef: 'L89467',
  },
  {
    id: 'PROV-2',
    name: 'Validated on-device artificial intelligence',
    markerText: 'On-device assistant',
    meaning: 'Produced by a validated model running on the device itself.',
    mayBeCalledLive: 'Explicitly prohibited',
    carriesModelOrAgentIdentity: 'Allowed',
    carriesContentVersion: 'Allowed',
    carriesHumanIdentity: 'Not applicable — no human authored the selection',
    permittedWhileOffline: 'Client Decision Required',
    permittedWhileOfflineSense:
      'Undecided, and the only undecided cell in the column. Not a capability withheld and not '
      + 'one that cannot happen: the question of whether anything runs on the device is open, so '
      + 'the class renders as undecided with its identifiers rather than as a state a device '
      + 'could be in. Read from the row at L89468.',
    classification: '`Recommendation — R&D`',
    treatment:
      '`PROV-2`, if ever adopted, renders in the same card shape with a visibly different badge reading "On-device assistant" and a permanent line stating what the local model does and does not know.',
    treatmentRef: 'L89459',
    decisionRefs: ['DEC-ONDEVICE-001'],
    sourceRef: 'L89468',
  },
  {
    id: 'PROV-3',
    name: 'Cached approved guidance',
    markerText: 'Approved guidance',
    meaning: 'Approved content authored and released earlier, packaged and shown with its version.',
    mayBeCalledLive: 'Explicitly prohibited',
    carriesModelOrAgentIdentity: 'Explicitly prohibited',
    carriesContentVersion: 'Allowed',
    carriesHumanIdentity: 'Allowed with conditions',
    permittedWhileOffline: 'Allowed',
    permittedWhileOfflineSense:
      'Permitted outright. The content travelled inside the work package, so it is available '
      + 'with no network dependency at all. Read from the row at L89469.',
    classification: '`SoW Fact — §5.7.2, §7.12`',
    treatment:
      '`PROV-3` renders in a plain bordered panel headed "Approved guidance" with the content version and approval date.',
    treatmentRef: 'L89459',
    decisionRefs: [],
    sourceRef: 'L89469',
  },
  {
    id: 'PROV-4',
    name: 'Deterministic rules',
    markerText: 'Rule',
    meaning:
      'A packaged value producing an outcome by comparison, shown beside the field it governs with its limit and version.',
    mayBeCalledLive: 'Explicitly prohibited',
    carriesModelOrAgentIdentity: 'Explicitly prohibited',
    carriesContentVersion: 'Allowed',
    carriesHumanIdentity: 'Not applicable — the rule is authored, the outcome is arithmetic',
    permittedWhileOffline: 'Allowed',
    permittedWhileOfflineSense:
      'Permitted outright, and half of the terminal safe state named at L89474 — rules and an '
      + 'honest absence. Read from the row at L89470.',
    classification: '`SoW Fact — §3.2`',
    treatment:
      '`PROV-4` renders inline with the field it governs — the specification limits sit beside the measurement input, not in a card.',
    treatmentRef: 'L89459',
    decisionRefs: [],
    sourceRef: 'L89470',
  },
  {
    id: 'PROV-5',
    name: 'Manual human workflow',
    markerText: 'Manual human workflow',
    meaning: 'A named person decided or instructed, and the record is attributed to them.',
    mayBeCalledLive: 'Explicitly prohibited',
    carriesModelOrAgentIdentity: 'Not applicable — no model participated',
    carriesContentVersion: 'Allowed with conditions',
    carriesHumanIdentity: 'Allowed',
    permittedWhileOffline: 'Allowed with conditions',
    permittedWhileOfflineSense:
      'Permitted with conditions rather than outright, which is the one class whose offline cell '
      + 'is neither a plain yes nor a plain no. Read from the row at L89471.',
    classification: '`SoW Fact — §3.5`',
    treatment: '`PROV-5` renders with the person\'s name, role, and timestamp.',
    treatmentRef: 'L89459',
    decisionRefs: [],
    sourceRef: 'L89471',
  },
  {
    id: 'PROV-6',
    name: 'Artificial intelligence unavailable',
    markerText: 'Artificial intelligence unavailable',
    meaning: 'Nothing was produced, and the absence is rendered explicitly rather than left blank.',
    mayBeCalledLive: 'Explicitly prohibited',
    carriesModelOrAgentIdentity: 'Explicitly prohibited',
    carriesContentVersion: 'Not applicable — there is no content to version',
    carriesHumanIdentity: 'Not applicable — there is no decision to attribute',
    permittedWhileOffline: 'Allowed',
    permittedWhileOfflineSense:
      'Permitted outright, and the other half of the terminal safe state named at L89474. An '
      + 'honest absence is always renderable. Read from the row at L89472.',
    classification: '`SoW Fact — §8.7.5`',
    treatment:
      '`PROV-6` renders as a muted panel with a single sentence naming the current mode from section 42.3 and what the worker may do instead. Six shapes, six meanings, no shared visual language between them.',
    treatmentRef: 'L89459',
    decisionRefs: [],
    sourceRef: 'L89472',
  },
] as const satisfies readonly ProvenanceClass[]

type MissingFromClasses = Exclude<ProvenanceClassId, (typeof PROVENANCE_CLASSES)[number]['id']>
const _classesExhaustive: MissingFromClasses extends never ? true : never = true
void _classesExhaustive

const BY_ID = new Map<ProvenanceClassId, ProvenanceClass>(
  PROVENANCE_CLASSES.map((record) => [record.id, record]),
)

/**
 * Throws rather than returning a fallback class. A lookup that quietly
 * substitutes some other class is a mislabelling, which L89474 names as the
 * one failure mode this whole contract exists to prevent.
 */
export function provenanceClass(id: ProvenanceClassId): ProvenanceClass {
  const found = BY_ID.get(id)
  if (found === undefined) throw new Error(`No provenance class is registered as "${id}".`)
  return found
}
