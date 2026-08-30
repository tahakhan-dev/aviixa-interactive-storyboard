/**
 * # THE ABSOLUTE RULE'S ENUMERATION, AND THE COUNT THAT DOES NOT RECONCILE
 *
 * §34.4 opens at L78380 and states the rule absolutely at L78386: no surface —
 * the Delivery Operations Hub, the Standards and Operations Studio, the Client
 * Command Center, the Frontline Worker Application or the Super Admin platform
 * console — may display, phrase, colour, badge, animate, count, aggregate,
 * export or notify in any way that implies an offline tablet has received or
 * applied any of the artefacts enumerated below.
 *
 * The enumeration is semicolon-separated inside that one line and it holds
 * TWENTY-ONE items. Four other places call it twenty-two: `AC-OFF-401` at
 * L78442, `TEST-OFF-402` at L78452, the section's traceability paragraph at
 * L78458, and the chapter's derivation register at L78951.
 *
 * BOTH NUMBERS ARE CARRIED AND NEITHER IS CHOSEN, and that is not caution —
 * it is the same mechanism `src/surfaces/doh/job-owner.ts` uses for
 * `MOD-DOH-16`'s contradicted Tenant Admin column. There is deliberately NO
 * export named `ARTEFACT_COUNT`: a caller that needs a number has to reach
 * into `ARTEFACT_COUNT_CONTRADICTION` and pick one in its own code, in view of
 * both locators. Exporting a single figure would settle, silently and on the
 * client's behalf, which of the two the product ships.
 *
 * WHY THE COUNT MATTERS RATHER THAN BEING A CURIOSITY. `AC-OFF-401` is stated
 * over the twenty-two enumerated artefacts. An acceptance criterion whose
 * population is one larger than the population that exists is a criterion
 * nobody can discharge, so the gap is recorded here where a test can read it
 * rather than left for each reader to rediscover.
 *
 * The controller's brief for this task gave the fourth claim as L78950. That
 * line carries the Twenty-event five-surface matrix row instead; the
 * twenty-two claim is the row after it. Corrected here against the frozen
 * source and reported.
 */

/**
 * The twenty-one artefacts, in the exact order and the exact words L78386
 * enumerates them. The leading `or` on the final item is the sentence's own
 * conjunction and is not part of the artefact, so it is not transcribed.
 */
export const ENUMERATED_ARTEFACTS = [
  'a command',
  'a publication',
  'an approval',
  'a role change',
  'a scope change',
  'a qualification change',
  'a revocation',
  'a suspension',
  'a remote wipe',
  'a hold release',
  'an artificial-intelligence action',
  'an artificial-intelligence model',
  'a configuration change',
  'a scheduled publication',
  'a scheduled package activation or expiry',
  'a scheduled feature-control change',
  'a scheduled tenant suspension or restoration',
  'a scheduled qualification warning or expiry',
  'a scheduled notification or escalation',
  'a scheduled artificial-intelligence action or expiry',
  'a scheduled-work failure or replay',
] as const

export type EnumeratedArtefact = (typeof ENUMERATED_ARTEFACTS)[number]

/** The frozen-source line the enumeration itself is transcribed from. */
export const ENUMERATION_LINE = 78386

/** One reading of how many artefacts the rule governs, and where it is stated. */
export interface ArtefactCountReading {
  readonly count: number
  readonly blueprintLine: number
  /** The source's own words at that line, verbatim, carrying the number. */
  readonly words: string
}

/**
 * The two readings. `counted` is what L78386 actually enumerates; `claimed` is
 * what the four downstream statements assert about it. Nothing here reconciles
 * them and nothing here prefers one.
 */
export const ARTEFACT_COUNT_CONTRADICTION: {
  readonly counted: ArtefactCountReading
  readonly claimed: readonly ArtefactCountReading[]
  readonly statement: string
} = {
  counted: {
    count: ENUMERATED_ARTEFACTS.length,
    blueprintLine: ENUMERATION_LINE,
    words: 'may display, phrase, colour, badge, animate, count, aggregate, export or notify in any way',
  },
  claimed: [
    {
      count: 22,
      blueprintLine: 78442,
      words: 'any of the twenty-two enumerated artefacts against a device that has not acknowledged',
    },
    {
      count: 22,
      blueprintLine: 78452,
      words: 'For each of the twenty-two artefacts, issue it against an offline device',
    },
    {
      count: 22,
      blueprintLine: 78458,
      words: 'The generalisation to twenty-two artefact types, the three-clause element test',
    },
    {
      count: 22,
      blueprintLine: 78951,
      words: 'Twenty-two-artefact absolute honesty rule',
    },
  ],
  statement:
    'The rule at L78386 enumerates twenty-one artefacts. Four statements built on it — ' +
    'AC-OFF-401 at L78442, TEST-OFF-402 at L78452, the traceability paragraph at L78458 and ' +
    'the derivation register at L78951 — each call the same enumeration twenty-two. The ' +
    'enumeration was counted item by item against its own semicolons rather than trusted; ' +
    'both readings are carried because the source states both and reconciles neither, and ' +
    'because a build that picked one would be answering, without the client, whether a ' +
    'twenty-second artefact type was dropped in drafting or was never there.',
}
