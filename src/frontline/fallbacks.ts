/**
 * THE `FB-FL-*` PATTERN LIBRARY — FOURTEEN PATTERNS AND THE MODULE MAP.
 * Frozen source §22.9, patterns at L40098-L40124, map at header L40128,
 * separator L40129, data L40130-L40143.
 *
 * IT HAS TO BE A TABLE SOMETHING READS, NOT PROSE. `AC-FL-011-1` (L40151):
 * "Every functionality in this chapter names at least one `FB-FL-*`
 * pattern." Chapter 22 counts 181 functionalities, so a rule a reviewer
 * checks by eye is a rule that goes unchecked; `patternsForModule` below is
 * what the twelve module tasks read.
 *
 * A CORRECTION TO THE BRIEF THIS FILE WAS WRITTEN FROM, RECORDED HERE
 * BECAUSE IT CHANGES WHAT EVERY LATER TASK MAY CITE. The plan states the
 * pattern text is "truncated in the source at roughly 900-1400 characters
 * per pattern" and instructs that "no task brief may quote those tails". It
 * is not truncated. Measured against the hash-verified blueprint, the
 * fourteen pattern lines run 1188 to 2188 characters and every one of them
 * ends in a complete `Source status:` sentence. The truncation was in a
 * READING of the file, not in the file. So the terminal safe states below —
 * exactly the tails the plan said could not be quoted — are transcribed from
 * the source, and `AC-FL-011-2` ("every retry path has a bounded exit into a
 * named terminal safe state") is checkable rather than deferred.
 */

export type FrontlineFallbackId =
  | 'FB-FL-CORE-01'
  | 'FB-FL-AUTH-01'
  | 'FB-FL-PKG-01'
  | 'FB-FL-CAP-01'
  | 'FB-FL-UP-01'
  | 'FB-FL-CMD-01'
  | 'FB-FL-AI-01'
  | 'FB-FL-GATE-01'
  | 'FB-FL-SEV1-01'
  | 'FB-FL-STORE-01'
  | 'FB-FL-TIME-01'
  | 'FB-FL-SEC-01'
  | 'FB-FL-RENDER-01'
  | 'FB-FL-SCAN-01'

export type FrontlineModuleId =
  | 'MOD-FL-A1'
  | 'MOD-FL-A2'
  | 'MOD-FL-A3'
  | 'MOD-FL-A4'
  | 'MOD-FL-A5'
  | 'MOD-FL-A6'
  | 'MOD-FL-A7'
  | 'MOD-FL-B8'
  | 'MOD-FL-B9'
  | 'MOD-FL-B10'
  | 'MOD-FL-B11'
  | 'MOD-FL-B12'

export interface FrontlineFallbackPattern {
  readonly id: FrontlineFallbackId
  /** The pattern's own heading, verbatim. */
  readonly title: string
  /** The pattern's own Criticality clause, verbatim. */
  readonly criticality: string
  /**
   * The pattern's own Terminal safe state clause, verbatim, up to the next
   * labelled clause. `AC-FL-011-2` turns on this being present and named.
   */
  readonly terminalSafeState: string
  /** The modules the map lists against this pattern. */
  readonly primaryModules: readonly FrontlineModuleId[]
  /** The pattern's line, then the map row's line. */
  readonly sourceRef: string
}

export const FL_FALLBACK_PATTERNS = [
  {
    id: 'FB-FL-CORE-01',
    title: 'Connectivity loss during normal execution',
    criticality: 'low, because offline is the design centre',
    terminalSafeState:
      'the worker completes assigned Runs offline and the device holds all data',
    primaryModules: [
      'MOD-FL-A2',
      'MOD-FL-A3',
      'MOD-FL-A4',
      'MOD-FL-A6',
      'MOD-FL-B8',
      'MOD-FL-B10',
      'MOD-FL-B12',
    ],
    sourceRef: 'L40098 (pattern), L40130 (map)',
  },
  {
    id: 'FB-FL-AUTH-01',
    title: 'Authentication or authority data cannot be refreshed',
    criticality: 'high, because qualification enforcement depends on it',
    terminalSafeState:
      'no session, all local data preserved, device usable only to display the honest state',
    primaryModules: ['MOD-FL-A1', 'MOD-FL-A6', 'MOD-FL-B9', 'MOD-FL-B11'],
    sourceRef: 'L40100 (pattern), L40131 (map)',
  },
  {
    id: 'FB-FL-PKG-01',
    title: 'Work package missing, incomplete, or failing integrity verification',
    criticality: 'high',
    terminalSafeState:
      'the Run is never partially rendered and never started against an unverified package',
    primaryModules: ['MOD-FL-A2', 'MOD-FL-A3', 'MOD-FL-A6'],
    sourceRef: 'L40102 (pattern), L40132 (map)',
  },
  {
    id: 'FB-FL-CAP-01',
    title: 'A capture cannot be committed locally',
    criticality: 'critical, because this is the point where data is created',
    terminalSafeState:
      'a blocked step with an un-committed value visible; no partial record, no phantom capture',
    primaryModules: ['MOD-FL-A4', 'MOD-FL-A5'],
    sourceRef: 'L40104 (pattern), L40133 (map)',
  },
  {
    id: 'FB-FL-UP-01',
    title: 'Upload of a committed capture or evidence object fails',
    criticality: 'medium; the data is already safe locally',
    terminalSafeState:
      'the item is retained on the device and never deleted; media is evicted only after confirmed server receipt plus an integrity check',
    primaryModules: ['MOD-FL-A4', 'MOD-FL-A6'],
    sourceRef: 'L40106 (pattern), L40134 (map)',
  },
  {
    id: 'FB-FL-CMD-01',
    title: 'A command cannot be downloaded, validated, or applied',
    criticality: 'high for suspension and lot release',
    terminalSafeState:
      'the pre-command state is preserved, and holds stay in force rather than lifting on an unvalidated release',
    primaryModules: ['MOD-FL-A6', 'MOD-FL-A7', 'MOD-FL-B9', 'MOD-FL-B10', 'MOD-FL-B11'],
    sourceRef: 'L40108 (pattern), L40135 (map)',
  },
  {
    id: 'FB-FL-AI-01',
    title: 'The agentic and reasoning layer is unavailable',
    criticality: 'low, by design',
    terminalSafeState: 'full execution continues with authored guidance only',
    primaryModules: ['MOD-FL-B8', 'MOD-FL-A5'],
    sourceRef: 'L40110 (pattern), L40136 (map)',
  },
  {
    id: 'FB-FL-GATE-01',
    title: 'A qualification gate blocks a step',
    criticality: 'high, because it governs who may perform gated work',
    terminalSafeState:
      'the parked Run, with all prior captures preserved and queued. There is no on-device worker override, ever',
    primaryModules: ['MOD-FL-B9', 'MOD-FL-B11', 'MOD-FL-A6'],
    sourceRef: 'L40112 (pattern), L40137 (map)',
  },
  {
    id: 'FB-FL-SEV1-01',
    title: 'A Severity 1 classification occurs and escalation cannot be delivered',
    criticality: 'maximum',
    terminalSafeState:
      'the breaching lot, unit, or run is frozen locally, and only a Quality Manager can release it, through a lot-release command',
    primaryModules: ['MOD-FL-A5'],
    sourceRef: 'L40114 (pattern), L40138 (map)',
  },
  {
    id: 'FB-FL-STORE-01',
    title: 'On-device storage is exhausted',
    criticality: 'critical, because it can block capture',
    terminalSafeState:
      'capture blocked with all existing data preserved; never eviction of unconfirmed evidence',
    primaryModules: ['MOD-FL-A4', 'MOD-FL-A6', 'MOD-FL-A7'],
    sourceRef: 'L40116 (pattern), L40139 (map)',
  },
  {
    id: 'FB-FL-TIME-01',
    title: 'Clock skew beyond the tenant threshold',
    criticality: 'medium',
    terminalSafeState:
      'the record is preserved with both timestamps and the skew flag; nothing is discarded and nothing is silently corrected',
    primaryModules: ['MOD-FL-A6'],
    sourceRef: 'L40118 (pattern), L40140 (map)',
  },
  {
    id: 'FB-FL-SEC-01',
    title: 'Security event: suspension, de-authorisation, remote wipe, or lockout',
    criticality: 'maximum for the compliance stop',
    terminalSafeState:
      'locked device with local data preserved and no further capture possible',
    primaryModules: ['MOD-FL-A7', 'MOD-FL-A1', 'MOD-FL-B11'],
    sourceRef: 'L40120 (pattern), L40141 (map)',
  },
  {
    id: 'FB-FL-RENDER-01',
    title: 'A screen element cannot be rendered',
    criticality: 'high, because a partially rendered gated step is unsafe',
    terminalSafeState:
      'a blocked Run with complete, immutable prior captures; never a skipped gated step',
    primaryModules: ['MOD-FL-A3'],
    sourceRef: 'L40122 (pattern), L40142 (map)',
  },
  {
    id: 'FB-FL-SCAN-01',
    title: 'Scanner hardware fails or a code will not read',
    criticality: 'medium',
    terminalSafeState:
      'a blocked step with no fabricated identity; the platform never invents a unit identifier',
    primaryModules: ['MOD-FL-A4', 'MOD-FL-A3'],
    sourceRef: 'L40124 (pattern), L40143 (map)',
  },
] as const satisfies readonly FrontlineFallbackPattern[]

type MissingFromPatterns = Exclude<
  FrontlineFallbackId,
  (typeof FL_FALLBACK_PATTERNS)[number]['id']
>
const _patternsExhaustive: MissingFromPatterns extends never ? true : never = true
void _patternsExhaustive

/**
 * The map read the other way. DERIVED from the patterns rather than
 * transcribed a second time, so the two directions cannot disagree.
 */
export function patternsForModule(
  module: FrontlineModuleId,
): readonly FrontlineFallbackPattern[] {
  return FL_FALLBACK_PATTERNS.filter((p) =>
    (p.primaryModules as readonly FrontlineModuleId[]).includes(module),
  )
}

export function fallbackPatternById(id: FrontlineFallbackId): FrontlineFallbackPattern {
  const found = FL_FALLBACK_PATTERNS.find((p) => p.id === id)
  if (found === undefined) throw new Error(`no FB-FL pattern registered: ${id}`)
  return found
}

/**
 * `AC-FL-011-1`'s question, asked of a module's declared functionality list.
 * Returns the functionalities naming no pattern; empty is the criterion met.
 * Wave 1 and 2 hand it their own lists — this is the one place the rule
 * lives, so twelve tasks do not each write their own version of it.
 */
export function functionalitiesNamingNoPattern(
  functionalities: readonly { readonly id: string; readonly patterns: readonly FrontlineFallbackId[] }[],
): readonly string[] {
  return functionalities.filter((f) => f.patterns.length === 0).map((f) => f.id)
}
