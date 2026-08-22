/**
 * `SURF-CC`'s CROSS-SURFACE SEAM RECORDS — chapter 26, walked seam by seam.
 *
 * Chapter 26 contracts twenty-six seams: eighteen the Statement of Work's own
 * §1.4 map carries (§26.8), and eight more the source's prose requires and
 * that map omits (§26.9). Each contract opens with a Producer row and a
 * Consumer row, and those two rows are the only place the chapter says which
 * surfaces a seam actually joins.
 *
 * ── THE RULE THIS FILE APPLIES, ONCE ──────────────────────────────────────
 * A seam belongs to this surface when its own Producer or Consumer row names
 * the Client Command Center. That is one rule with no judgement in it, and
 * `tests/unit/cc-seams.test.ts` re-derives the whole set from the frozen
 * source at test time, so the fifteen rows below cannot drift from the
 * chapter and cannot be padded by hand.
 *
 * FIFTEEN SEAMS NAME THIS SURFACE, and the split matters more than the
 * count: THIRTEEN name it as a CONSUMER and TWO name it as a PRODUCER. Seam 3
 * and seam 9 are the two, and both are commonly mis-described as terminating
 * here. They do the opposite — seam 3's Consumer row is the Frontline devices
 * and seam 9's Producer row is Command Center action 10 — and a registry that
 * files them as inbound would have this surface receiving the two seams it
 * originates.
 *
 * ── THE DISPATCH'S OWN LIST WAS SHORT BY FIVE AND WRONG ON TWO ────────────
 * The brief for this task named seams 3, 4, 5, 6, 7, 8, 9, 21, 24 and 25, and
 * said all seven of 3 through 9 terminate on this surface. Measured against
 * the Producer and Consumer rows themselves: five further seams name the
 * Command Center and are missing from that list, and two of the ten it does
 * name run outward rather than inward. `SEAMS_THE_DISPATCH_LIST_OMITS` and
 * `CC_SEAMS_AS_PRODUCER` are both computed, so neither claim is carried as a
 * number this file wrote down.
 *
 * ── THIS FILE REACHES NO ROUTE, AND THAT IS DECLARED, NOT OVERLOOKED ──────
 * These records are surface-wide rather than module-scoped: no one of the
 * thirteen screens owns a cross-surface seam, and this task owns no path
 * under `app/` and no module directory. So nothing here is imported by a
 * page. The wiring, when a task that owns those paths takes it, is the same
 * one `src/surfaces/cc/shell/CommandCenterShell.tsx` already uses for the
 * spine's two seams — a seam notice rendered from the record — and the
 * natural host is the shell, beside `<CcFallbackDisclosure />`, because a
 * cross-surface seam is a property of the surface and not of a screen.
 * `tests/unit/cc-seams.test.ts` asserts the importer count is zero, so the
 * abstention goes red the day it stops being true.
 */

/** Which side of the contract this surface sits on. */
export type CcSeamRole = 'producer' | 'consumer'

/** Which of chapter 26's two seam sections carries the contract. */
export type Chapter26Section = '26.8.1' | '26.8.2' | '26.9'

export interface Chapter26CcSeam {
  /** The seam's own number, as the chapter numbers it. */
  readonly seam: number
  /** The heading's own words, after the em dash, including its full stop. */
  readonly title: string
  /** `producer` where the Producer row names this surface, else `consumer`. */
  readonly ccRole: CcSeamRole
  readonly section: Chapter26Section
  /** The Producer row, verbatim, attribution tail included. */
  readonly producer: string
  readonly producerLine: number
  /** The Consumer row, verbatim, attribution tail included. */
  readonly consumer: string
  readonly consumerLine: number
  readonly headingLine: number
}

/**
 * The fifteen, in the chapter's own order. Producer and Consumer are carried
 * verbatim rather than summarised, because the summary is exactly what got
 * seams 3 and 9 filed backwards.
 */
export const CHAPTER_26_CC_SEAMS = [
  {
    seam: 1,
    title: 'Capture events carrying the runtime envelope.',
    ccRole: 'consumer',
    section: '26.8.1',
    producer: 'Frontline Worker Application, sole origin [SoW Fact — §1.4 row 1]',
    producerLine: 49692,
    consumer:
      'Delivery Operations Hub as the official record; Client Command Center as live signal; the agents as learning signal [SoW Fact — §1.4 row 1]',
    consumerLine: 49693,
    headingLine: 49688,
  },
  {
    seam: 3,
    title: 'Command-channel actions.',
    ccRole: 'producer',
    section: '26.8.1',
    producer:
      'Delivery Operations Hub and Client Command Center decisions, recorded centrally [SoW Fact — §1.4 row 3, §1.3]',
    producerLine: 49736,
    consumer: 'Frontline devices [SoW Fact — §1.4 row 3]',
    consumerLine: 49737,
    headingLine: 49732,
  },
  {
    seam: 4,
    title: 'Escalations.',
    ccRole: 'consumer',
    section: '26.8.1',
    producer:
      'Standards and Operations Studio routing rules, resolved by the Delivery Operations Hub [SoW Fact — §1.4 row 4]',
    producerLine: 49759,
    consumer: 'Client Command Center for display and acknowledgement [SoW Fact — §1.4 row 4]',
    consumerLine: 49760,
    headingLine: 49755,
  },
  {
    seam: 5,
    title: 'The five standard report data sets.',
    ccRole: 'consumer',
    section: '26.8.1',
    producer: 'Delivery Operations Hub, which owns the data [SoW Fact — §1.4 row 5]',
    producerLine: 49782,
    consumer:
      'Client Command Center, which renders and supports the Report Builder [SoW Fact — §1.4 row 5]',
    consumerLine: 49783,
    headingLine: 49778,
  },
  {
    seam: 6,
    title: 'Two-lane learning.',
    ccRole: 'consumer',
    section: '26.8.1',
    producer: 'The agents, which propose [SoW Fact — §1.4 row 6]',
    producerLine: 49805,
    consumer:
      'Client Command Center for the Lane B decision; then the Standards and Operations Studio record or the server-side setting [SoW Fact — §1.4 row 6]',
    consumerLine: 49806,
    headingLine: 49801,
  },
  {
    seam: 7,
    title: 'Sync conflicts.',
    ccRole: 'consumer',
    section: '26.8.1',
    producer: 'Frontline offline writes [SoW Fact — §1.4 row 7]',
    producerLine: 49828,
    consumer:
      'Client Command Center review panel; Delivery Operations Hub audits [SoW Fact — §1.4 row 7]',
    consumerLine: 49829,
    headingLine: 49824,
  },
  {
    seam: 8,
    title: 'Evidence media.',
    ccRole: 'consumer',
    section: '26.8.1',
    producer: 'Frontline Worker Application, immutable at creation [SoW Fact — §1.4 row 8]',
    producerLine: 49849,
    consumer:
      'Client Command Center and Delivery Operations Hub, display only [SoW Fact — §1.4 row 8]',
    consumerLine: 49850,
    headingLine: 49845,
  },
  {
    seam: 9,
    title: 'Qualification clearances.',
    ccRole: 'producer',
    section: '26.8.1',
    producer: 'Client Command Center action 10 [SoW Fact — §1.4 row 9]',
    producerLine: 49870,
    consumer:
      'Command channel to the device; Delivery Operations Hub records [SoW Fact — §1.4 row 9]',
    consumerLine: 49871,
    headingLine: 49866,
  },
  {
    seam: 10,
    title: 'Worker records and qualifications.',
    ccRole: 'consumer',
    section: '26.8.2',
    producer: 'Delivery Operations Hub, supervisor-entered [SoW Fact — §1.4 row 10]',
    producerLine: 49922,
    consumer:
      'Frontline enforcement; Client Command Center signals; Shift Handoff Agent [SoW Fact — §1.4 row 10]',
    consumerLine: 49923,
    headingLine: 49918,
  },
  {
    seam: 15,
    title: 'The shift handoff brief.',
    ccRole: 'consumer',
    section: '26.8.2',
    producer:
      'Shift Handoff Agent, a reasoning agent, on Studio-configured timing [SoW Fact — §1.4 row 15, §3.7]',
    producerLine: 50029,
    consumer:
      'Client Command Center handoff panel; Delivery Operations Hub records [SoW Fact — §1.4 row 15]',
    consumerLine: 50030,
    headingLine: 50025,
  },
  {
    seam: 17,
    title: 'Notifications.',
    ccRole: 'consumer',
    section: '26.8.2',
    producer: 'One tenant notification model [SoW Fact — §1.4 row 17]',
    producerLine: 50073,
    consumer:
      'Delivery Operations Hub email and in-app; Client Command Center live feed; Frontline inbox [SoW Fact — §1.4 row 17]',
    consumerLine: 50074,
    headingLine: 50069,
  },
  {
    seam: 20,
    title: 'The tenant-configuration registry as the single enforcement point.',
    ccRole: 'consumer',
    section: '26.9',
    producer:
      'Tenant-configuration registry, Super Admin console object, one per tenant [SoW Fact — §8.19]',
    producerLine: 50192,
    consumer:
      'Every surface that reads a tenant setting: Delivery Operations Hub, Standards and Operations Studio, Client Command Center, Frontline Worker Application through the package, and the Super Admin console itself',
    consumerLine: 50193,
    headingLine: 50188,
  },
  {
    seam: 21,
    title:
      'The Delivery Operations Hub assignment service, called identically by the Client Command Center.',
    ccRole: 'consumer',
    section: '26.9',
    producer:
      'Delivery Operations Hub assignment service, sole implementation [SoW Fact — §1.4, §3.5]',
    producerLine: 50213,
    consumer:
      "The Delivery Operations Hub's own assignment screens and the Client Command Center's reassign action, as two callers of one service",
    consumerLine: 50214,
    headingLine: 50209,
  },
  {
    seam: 24,
    title: 'Device heartbeats and fleet telemetry, feeding the freshness marker.',
    ccRole: 'consumer',
    section: '26.9',
    producer:
      'Frontline Worker Application emits heartbeats and last-successful-sync telemetry; the Super Admin platform console holds the fleet inventory [SoW Fact — §6.2.3]',
    producerLine: 50278,
    consumer:
      'Client Command Center freshness marker on every tile and drill view; Super Admin devices and fleet module',
    consumerLine: 50279,
    headingLine: 50274,
  },
  {
    seam: 25,
    title: 'The clock-skew operational event into conflict-and-skew review.',
    ccRole: 'consumer',
    section: '26.9',
    producer:
      'Frontline Worker Application, as a lighter operational event [SoW Fact — §1.3, §7.10.4]',
    producerLine: 50299,
    consumer: 'Client Command Center conflict-and-skew review; Delivery Operations Hub records',
    consumerLine: 50300,
    headingLine: 50295,
  },
] as const satisfies readonly Chapter26CcSeam[]

export const CC_SEAM_NUMBERS: readonly number[] = CHAPTER_26_CC_SEAMS.map((s) => s.seam)

/** The two this surface ORIGINATES. Computed; never listed by hand. */
export const CC_SEAMS_AS_PRODUCER: readonly number[] = CHAPTER_26_CC_SEAMS.filter(
  (s) => s.ccRole === 'producer',
).map((s) => s.seam)

/** The thirteen this surface RECEIVES. */
export const CC_SEAMS_AS_CONSUMER: readonly number[] = CHAPTER_26_CC_SEAMS.filter(
  (s) => s.ccRole === 'consumer',
).map((s) => s.seam)

/**
 * The list the dispatch for this task carried. Kept so the correction below
 * is a subtraction anyone can check, rather than an assertion that a brief
 * was wrong.
 */
export const SEAM_LIST_AS_DISPATCHED = [
  3, 4, 5, 6, 7, 8, 9, 21, 24, 25,
] as const satisfies readonly number[]

/** Seams whose own Producer or Consumer row names this surface and which the dispatch list did not. */
export const SEAMS_THE_DISPATCH_LIST_OMITS: readonly number[] = CC_SEAM_NUMBERS.filter(
  (n) => !(SEAM_LIST_AS_DISPATCHED as readonly number[]).includes(n),
)

/** Seams the dispatch listed that name no Producer or Consumer row on this surface. */
export const SEAMS_THE_DISPATCH_LIST_ADDS: readonly number[] = SEAM_LIST_AS_DISPATCHED.filter(
  (n) => !CC_SEAM_NUMBERS.includes(n),
)

export function chapter26CcSeam(seam: number): Chapter26CcSeam {
  const found = CHAPTER_26_CC_SEAMS.find((s) => s.seam === seam)
  if (found === undefined) {
    throw new Error(`No chapter-26 seam ${seam} names the Client Command Center.`)
  }
  return found
}

/* ==================================================================== *
 * THE TELEMETRY CONTRADICTION — two readings, and no field to win in.
 * ==================================================================== */

/**
 * A reading of the source, and the lines it was read from. TWO FIELDS, so
 * there is nowhere to mark a winner even by accident — the shape slice 8's
 * strongest disclosure used, for the same reason.
 */
export interface SeamReading {
  readonly reading: string
  readonly sourceRefs: readonly string[]
}

/**
 * DOES AN OUTBOUND COMMAND CENTER TO SUPER ADMIN TELEMETRY PATH EXIST?
 *
 * Chapter 21 asserts one and chapter 26 refuses one, in the same words about
 * the same payload. Both readings are carried with their own locators and
 * NEITHER IS ADOPTED: a seam registry that listed the integration as present,
 * or as absent, would have made the choice this file exists not to make.
 *
 * It is not recorded as a seam above because the chapter-26 seam contracts
 * are the only thing that file records, and none of the twenty-six carries a
 * Command Center to Super Admin row.
 */
export const CC_SA_TELEMETRY_READINGS = [
  {
    reading:
      "Chapter 21 carries the integration as a row of its own: an outbound telemetry interconnection from this surface to the Super Admin platform console, drawn as an arrow from the Command Center to the console in the chapter's own interaction diagram, and held to a content rule by an acceptance criterion addressed to it.",
    sourceRefs: ['L35437', 'L35458', 'L35472'],
  },
  {
    reading:
      "Chapter 26 refuses it twice: the surface interaction matrix marks the Command Center to Super Admin cell Unavailable with the reason that no tenant surface reaches the platform console, and the chapter's own data-flow diagram routes the same telemetry from the Delivery Operations Hub to the console instead.",
    sourceRefs: ['L49254', 'L49239'],
  },
] as const satisfies readonly SeamReading[]
