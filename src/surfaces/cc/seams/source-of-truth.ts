import type { PermissionOutcome } from '@/policy/decision'

/**
 * §26.7's SOURCE-OF-TRUTH MATRIX — the one table that answers, per record
 * type, which surface holds the truth.
 *
 * ── WHERE IT IS, COUNTED RATHER THAN SUBTRACTED ───────────────────────────
 * Header L49574, separator L49575, data L49576 to L49601 — TWENTY-SIX data
 * rows, counted by walking them. The first non-blank line below the body is
 * L49603, which opens the section's failure ladder; the line immediately
 * after the table is blank and is therefore cited nowhere.
 *
 * ── SEVEN COLUMNS, AND THIS FILE TRANSCRIBES TWO OF THEM ──────────────────
 * The header runs `Record type`, `Single source of truth`, then one column
 * per surface. The two carried here are the record type and the single
 * source of truth — the question this table exists to answer — plus this
 * surface's own cell. The other four surfaces' cells are not this surface's
 * to transcribe and are not copied.
 *
 * EVERY CELL IS READ HEADER-KEYED. `tests/unit/cc-seams.test.ts` splits
 * L49574 on its own pipes, finds `Client Command Center` by name, and reads
 * every row at that index. A positional read of this table is one column
 * away from the Standards and Operations Studio's, which reads `Unavailable`
 * on fourteen rows and would look entirely plausible.
 *
 * ── THE TOKEN IS THE BACKTICKED SPAN, NOT THE HEAD BEFORE A DASH ──────────
 * A ` — ` split is the wrong instrument on this table and would ship four
 * wrong tokens. Twelve of its twenty-six cells separate the note with a dash,
 * ten carry no note, and FOUR append one with no dash at all: L49590
 * continues with a comma, and L49577, L49584 and L49601 with a space. Split
 * on the dash, the whole of `Read-only display, plus mark-reviewed as action
 * 7` becomes the token. The token is the FIRST BACKTICKED SPAN and is
 * compared for exact equality; the note is whatever follows it, with the
 * separator dropped and the words kept.
 *
 * ── TWO `Read-only` CELLS CARRY A WRITE GRANT IN THEIR NOTE ───────────────
 * `SOT_READ_ONLY_CELLS_CARRYING_A_GRANT` computes them: evidence media reads
 * `Read-only` and then grants mark-reviewed as action 7, and the execution
 * summary reads `Read-only` and then grants the anomaly review actions. This
 * is the L38685 prefix trap arriving from the other side — there the token
 * prohibits and the note grants; here the token is read-only and the note
 * grants — and a screen built from the token alone renders neither.
 *
 * ── THIS TABLE IS ONE OF SIX ANSWERING ONE QUESTION ───────────────────────
 * §21.1.2, §21.16, §25.4, this one, `MTX-TEN-02c` in chapter 17, and the
 * module-to-actor concentration table, which answers by omitting the Tenant
 * Admin entirely. This file records only its own, with its own locators, and
 * adjudicates none of the others. `MTX-TEN-02c` is the one of the six that
 * carries a decision identifier, `DEC-TACC-001`, and `MOD-CC-03`'s and
 * `MOD-CC-07`'s tasks reached it independently; nothing here re-spells it.
 */

/**
 * The four tokens THIS COLUMN uses. The full matrix uses more — its other
 * four surface columns add `Allowed`, `Cached read-only while offline` and
 * `Not applicable` — and this is deliberately the vocabulary of the column
 * transcribed, not of the table. `SOT_TOKENS_USED` re-derives it from the
 * rows and the gate holds the two equal in both directions, so a token that
 * appears in a row and not here fails rather than passing quietly.
 */
export const CC_SOT_TOKENS = [
  'Read-only',
  'Allowed with conditions',
  'Unavailable',
  'Explicitly prohibited',
] as const satisfies readonly string[]

export type CcSotToken = (typeof CC_SOT_TOKENS)[number]

/**
 * The token in this build's own permission vocabulary. The nine outcomes
 * live in `@/policy/decision` and none is redeclared here — only mapped.
 */
export const CC_SOT_TOKEN_OUTCOME = {
  'Read-only': 'readOnly',
  'Allowed with conditions': 'allowedWithConditions',
  Unavailable: 'unavailable',
  'Explicitly prohibited': 'explicitlyProhibited',
} as const satisfies Record<CcSotToken, PermissionOutcome>

export interface CcSourceOfTruthRow {
  /** The `Record type` column, verbatim. */
  readonly recordType: string
  /** The `Single source of truth` column, verbatim. */
  readonly singleSourceOfTruth: string
  /** The first backticked span of the `Client Command Center` cell. */
  readonly ccToken: CcSotToken
  /** Everything after that span, separator dropped, or `null` where there is none. */
  readonly ccNote: string | null
  readonly line: number
}

export const CC_SOURCE_OF_TRUTH = [
  {
    recordType: 'Capture event and runtime envelope',
    singleSourceOfTruth: 'Delivery Operations Hub record; Frontline is sole origin',
    ccToken: 'Read-only',
    ccNote: null,
    line: 49576,
  },
  {
    recordType: 'Evidence media',
    singleSourceOfTruth: 'Frontline creation, immutable; Delivery Operations Hub stores',
    ccToken: 'Read-only',
    ccNote: 'display, plus mark-reviewed as action 7',
    line: 49577,
  },
  {
    recordType: 'Deviation classification',
    singleSourceOfTruth: 'On-device deterministic classification',
    ccToken: 'Allowed with conditions',
    ccNote: 'Quality Manager reclassification with a recorded reason at review time',
    line: 49578,
  },
  {
    recordType: 'Hold on Lot, Unit or Run',
    singleSourceOfTruth:
      'Frontline places locally; Delivery Operations Hub records; release is a Command Center action executed through Hub services',
    ccToken: 'Allowed with conditions',
    ccNote: 'release is Quality Manager only; Supervisors request with a note',
    line: 49579,
  },
  {
    recordType: 'Workflow and published versions',
    singleSourceOfTruth: 'Standards and Operations Studio',
    ccToken: 'Read-only',
    ccNote: null,
    line: 49580,
  },
  {
    recordType: 'Work package',
    singleSourceOfTruth: 'Standards and Operations Studio content, delivered and pinned per run',
    ccToken: 'Unavailable',
    ccNote: null,
    line: 49581,
  },
  {
    recordType: 'Job record',
    singleSourceOfTruth: 'Delivery Operations Hub',
    ccToken: 'Explicitly prohibited',
    ccNote: 'creating Jobs is deliberately impossible here',
    line: 49582,
  },
  {
    recordType: 'Run record and lifecycle',
    singleSourceOfTruth: 'Delivery Operations Hub',
    ccToken: 'Explicitly prohibited',
    ccNote: 'creating or stopping runs is deliberately impossible here',
    line: 49583,
  },
  {
    recordType: 'Worker record and qualifications',
    singleSourceOfTruth: 'Delivery Operations Hub, supervisor-entered',
    ccToken: 'Read-only',
    ccNote: 'signals',
    line: 49584,
  },
  {
    recordType: 'Qualification clearance',
    singleSourceOfTruth:
      'Client Command Center action 10, executed through Hub services; Hub records',
    ccToken: 'Allowed with conditions',
    ccNote: 'Supervisor and above',
    line: 49585,
  },
  {
    recordType: 'Parts registry',
    singleSourceOfTruth: 'Delivery Operations Hub master data, with Studio inline add',
    ccToken: 'Unavailable',
    ccNote: null,
    line: 49586,
  },
  {
    recordType: 'Training content',
    singleSourceOfTruth: 'Standards and Operations Studio',
    ccToken: 'Unavailable',
    ccNote: null,
    line: 49587,
  },
  {
    recordType: 'Escalation routing rules',
    singleSourceOfTruth:
      'Standards and Operations Studio authoring; Delivery Operations Hub resolves roles to people on shift',
    ccToken: 'Read-only',
    ccNote: 'displays full structured state',
    line: 49588,
  },
  {
    recordType: 'Escalation acknowledgement state',
    singleSourceOfTruth: 'Delivery Operations Hub record, one state',
    ccToken: 'Allowed with conditions',
    ccNote: 'acknowledge from feed or notification, Supervisor and above',
    line: 49589,
  },
  {
    recordType: 'Execution summary and Anomaly Register',
    singleSourceOfTruth: 'Delivery Operations Hub, computed at completion',
    ccToken: 'Read-only',
    ccNote: 'plus anomaly review actions',
    line: 49590,
  },
  {
    recordType: 'Shift handoff brief',
    singleSourceOfTruth: 'Shift Handoff Agent produces; Delivery Operations Hub records',
    ccToken: 'Allowed with conditions',
    ccNote: 'acknowledge and annotate, Supervisor and above',
    line: 49591,
  },
  {
    recordType: 'Lane A preference tuning',
    singleSourceOfTruth: 'The agents themselves, logged and reversible',
    ccToken: 'Read-only',
    ccNote: null,
    line: 49592,
  },
  {
    recordType: 'Lane B configured values',
    singleSourceOfTruth:
      'The surface that owns the value — Studio for package-borne, server-side settings otherwise',
    ccToken: 'Allowed with conditions',
    ccNote: 'the decision, Quality Manager and above',
    line: 49593,
  },
  {
    recordType: 'Sync conflicts',
    singleSourceOfTruth:
      'Frontline offline writes create them; Client Command Center resolves; Delivery Operations Hub audits',
    ccToken: 'Allowed with conditions',
    ccNote: 'Quality Manager and above resolve; Supervisors view only',
    line: 49594,
  },
  {
    recordType: 'Tenant settings',
    singleSourceOfTruth: 'The tenant-configuration registry, one object per tenant',
    ccToken: 'Explicitly prohibited',
    ccNote: 'editing configuration is deliberately impossible here',
    line: 49595,
  },
  {
    recordType: 'Severity catalog',
    singleSourceOfTruth: 'Super Admin platform console, one global catalog',
    ccToken: 'Read-only',
    ccNote: null,
    line: 49596,
  },
  {
    recordType: 'Tenant action bundles above the Severity 1 floor',
    singleSourceOfTruth: 'Tenant configuration, bounded by the registry',
    ccToken: 'Read-only',
    ccNote: null,
    line: 49597,
  },
  {
    recordType: 'Tenant audit log',
    singleSourceOfTruth: 'Delivery Operations Hub, one immutable log per tenant',
    ccToken: 'Read-only',
    ccNote: 'decisions are ingested',
    line: 49598,
  },
  {
    recordType: 'Platform audit log',
    singleSourceOfTruth: 'Super Admin platform console, append-only',
    ccToken: 'Unavailable',
    ccNote: null,
    line: 49599,
  },
  {
    recordType: 'Usage ledger and Worker-Shift meter',
    singleSourceOfTruth:
      'Super Admin platform console owns management; the Delivery Operations Hub shows the tenant a read-only view',
    ccToken: 'Unavailable',
    ccNote: null,
    line: 49600,
  },
  {
    recordType: 'Device fleet inventory',
    singleSourceOfTruth: 'Super Admin platform console',
    ccToken: 'Read-only',
    ccNote: 'through the freshness marker',
    line: 49601,
  },
] as const satisfies readonly CcSourceOfTruthRow[]

/** Counted from the rows, so it cannot be a span subtracted. */
export const SOT_ROW_COUNT: number = CC_SOURCE_OF_TRUTH.length

/** The tokens the column actually uses, derived from the rows. */
export const SOT_TOKENS_USED: readonly CcSotToken[] = CC_SOT_TOKENS.filter((t) =>
  CC_SOURCE_OF_TRUTH.some((r) => r.ccToken === t),
)

export function ccSourceOfTruth(recordType: string): CcSourceOfTruthRow {
  const found = CC_SOURCE_OF_TRUTH.find((r) => r.recordType === recordType)
  if (found === undefined) {
    throw new Error(`No §26.7 record type "${recordType}". The matrix has ${SOT_ROW_COUNT} rows.`)
  }
  return found
}

export function ccSourceOfTruthOutcome(recordType: string): PermissionOutcome {
  return CC_SOT_TOKEN_OUTCOME[ccSourceOfTruth(recordType).ccToken]
}

/**
 * The surfaces the `Single source of truth` column can name, other than this
 * one. `Hub` rather than `Delivery Operations Hub` because the qualification
 * clearance row (L49585) writes the short form twice and the long form not at
 * all — a check for the long form reads that row as naming no other surface,
 * which is the opposite of what it says.
 */
const OTHER_SURFACE_WORDS = [
  'Frontline',
  'Hub',
  'Studio',
  'Super Admin',
  'agents',
] as const satisfies readonly string[]

/** Rows whose source-of-truth cell names this surface at all. */
export const SOT_ROWS_NAMING_THE_COMMAND_CENTER: readonly number[] = CC_SOURCE_OF_TRUTH.filter(
  (r) => r.singleSourceOfTruth.includes('Command Center'),
).map((r) => r.line)

/**
 * Rows whose source-of-truth cell names this surface AND NO OTHER — the
 * measurable form of L49537's statement that this surface owns no records.
 * The answer is none: each of the three rows that name the Command Center
 * names it as the actor and another surface as the holder.
 */
export const SOT_ROWS_WHERE_THE_COMMAND_CENTER_IS_SOLE_SOURCE: readonly number[] =
  CC_SOURCE_OF_TRUTH.filter(
    (r) =>
      r.singleSourceOfTruth.includes('Command Center') &&
      !OTHER_SURFACE_WORDS.some((w) => r.singleSourceOfTruth.includes(w)),
  ).map((r) => r.line)

/** `Read-only` cells whose note grants one of the ten operational actions. */
export const SOT_READ_ONLY_CELLS_CARRYING_A_GRANT: readonly number[] = CC_SOURCE_OF_TRUTH.filter(
  (r) => r.ccToken === 'Read-only' && r.ccNote !== null && /\baction/.test(r.ccNote),
).map((r) => r.line)

/* ==================================================================== *
 * THE TWO ROWS THAT PULL OPPOSITE WAYS, AND THE CRITERION THAT HOLDS
 * THEM TOGETHER.
 * ==================================================================== */

/**
 * L49593 grants this surface the Lane B decision and L49595 marks
 * configuration editing deliberately impossible here. They are TWO data rows
 * apart, not one: L49594, the sync-conflicts row, sits between them. The
 * adjacency is not the point and stating it as one row overstates it.
 *
 * `AC-CC-060` (L35470) reconciles them rather than choosing: the surface
 * holds exactly one outbound configuration path, and it is the Lane B
 * application path. So the Lane B grant is that one path and the tenant
 * settings prohibition is every other, and neither row is softened. Task 12
 * builds the path; this file records the seam.
 */
export const LANE_B_AND_TENANT_SETTINGS = {
  laneBRow: 49593,
  rowBetween: 49594,
  tenantSettingsRow: 49595,
  dataRowsApart: 2,
  reconciledBy: 'AC-CC-060',
  reconciledByRef: 'L35470',
  reconciliation:
    'The surface holds exactly one outbound configuration path, the Lane B application path, and no other configuration write is reachable. The Lane B grant IS that path; the tenant-settings prohibition is everything else. Neither cell is softened to fit the other.',
  builtBy:
    'The Lane B application path belongs to the MOD-CC-06 task, not to this file. Recorded here as the seam it is.',
} as const

/* ==================================================================== *
 * THE ESCALATION ROWS — a decomposition, and a record type the matrix
 * has no row for.
 * ==================================================================== */

/**
 * §26.7 carries a row for the escalation ACKNOWLEDGEMENT state (L49589) and
 * a row for the escalation ROUTING RULES (L49588). It carries no row for the
 * escalation RESOLUTION state, and the source holds resolution distinct from
 * acknowledgement in four places: L37844 states the distinction in prose,
 * `MOD-CC-09`'s matrix carries a `Resolve an escalation` row of its own at
 * L37866, `FUNC-CC-0903-1-2` (L38001) keeps them apart as separate
 * timestamped acts, and seam 4's own Audit row (L49772) says they are
 * distinct timestamped states on the Hub-owned record.
 *
 * SO THIS IS NOT A CONTRADICTION AND IT IS NOT RECORDED AS ONE. §26.7's row
 * is keyed on a record type and the record type it names is the
 * acknowledgement state; a matrix that names one state cannot be read as
 * denying a state it does not name. What is measurable is the GAP: a table
 * whose own `AC-26.7-02` requires that no cell be blank has no row at all
 * for the second of two states the rest of the source holds distinct.
 */
export const ESCALATION_STATE_ROWS = {
  routingRulesRow: 49588,
  acknowledgementStateRow: 49589,
  resolutionStateRow: null,
  distinctionStatedAt: ['L37844', 'L37866', 'L38001', 'L49772'],
  whatIsMeasured:
    'The source-of-truth matrix has a row for the escalation acknowledgement state and none for the escalation resolution state, while four other statements hold acknowledge and resolve distinct. Recorded as a gap in the matrix, not as a contradiction with MOD-CC-09: a row keyed on one record type denies nothing about a record type it does not carry.',
} as const
