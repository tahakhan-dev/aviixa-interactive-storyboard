/**
 * Slice gate 3 (spec S10): **no persisted table or fixture may use a worker
 * identifier as a grouping key for a behavioural measure.** Escalation keys
 * on `(Area, Shift)`, never on `(Worker)`.
 *
 * This module answers ONE question about ONE string:
 *
 *   > does this OBJECT KEY name a behavioural measure on a person?
 *
 * It is deliberately a different surface from `tests/coverage/slice-03-gates.test.ts`,
 * which scans source LINES for the same policy. A line carries prose and can
 * be a denial ("there is no per-worker row"); an object key carries none of
 * that context and never needs a denial exemption. Two surfaces, two
 * matchers — merging them would force one of them to be wrong.
 *
 * ## Why a matcher and not a regular expression over the raw key
 *
 * The regular expression this replaced was
 * `/count|rate|score|duration|…|ranking/i` applied to the raw key, and it
 * refused `accountState` — because `account` contains `count`. An account
 * state is a lifecycle token on a record, not a measure of anybody's
 * behaviour, so the gate was wrong and the fixture was right.
 *
 * That is the FOURTH time in this build a gate has matched a token inside a
 * larger term it does not mean: `signed` inside "signed-in", `18` inside
 * `MOD-SA-18`, `Worker` inside "Worker-Shift", and now `count` inside
 * "accountState". The standing rule is the same every time — **match the
 * semantic unit, not the substring** — so this matcher splits the key into
 * words first and only ever compares whole words.
 *
 * Splitting is what makes it camelCase-aware, and it is the whole trick:
 * `perShiftCount` → `per shift count` (a measure), while `permissions` →
 * `permissions` (one word, and NOT the word `per`).
 *
 * ## Three axes, because a behavioural measure arrives in three shapes
 *
 * Modelled on the three-axis reasoning in `slice-03-gates.test.ts`: a
 * one-axis gate is the version that shipped first there and missed most of
 * the ways the defect actually appears.
 *
 *   AXIS 1 — a MAGNITUDE: how much, how many, how good. `productivityScore`,
 *            `workerRanking`, `runsTotal`.
 *   AXIS 2 — a RATE or a SLICE BY PERSON: a measure per unit of time, work
 *            or person. `runsPerHour`, `perShiftCount`, `perWorkerTotal`.
 *   AXIS 3 — a DURATION: time spent, which is a pace measure worn backwards.
 *            `handlingDuration`, `idleMinutes`.
 *
 * Any one axis is enough to refuse the key. None of them fires on
 * `accountState`, `roleName`, `scopeLabel`, or on any key whose only match is
 * a substring inside an unrelated word.
 *
 * The both-directions proof lives in `tests/unit/doh-permissions.test.ts`
 * (`the person-measure key gate, proved in both directions`) — true positives
 * MUST match and false positives MUST NOT, because a gate whose test only
 * proves it stays quiet proves nothing. It lives in the unit project rather
 * than beside this file so it runs under `pnpm test:unit`; the `release`
 * project that owns `tests/coverage/**` only runs after a build.
 */

/**
 * The key, cut into lower-case words. Handles camelCase, PascalCase,
 * SCREAMING_SNAKE, kebab-case, dotted paths and digit boundaries, so one
 * word list covers every spelling the same concept arrives in.
 *
 * `PINCount` → `pin count`, not `p i n count`: the acronym rule runs before
 * the ordinary camel rule.
 */
function words(key: string): readonly string[] {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.toLowerCase())
}

/** AXIS 1 — a magnitude: how much, how many, how good, how it compares. */
const MAGNITUDE: ReadonlySet<string> = new Set([
  'count',
  'counts',
  'total',
  'totals',
  'tally',
  'score',
  'scores',
  'rating',
  'ratings',
  'rank',
  'ranks',
  'ranking',
  'rankings',
  'league',
  'average',
  'averages',
  'avg',
  'mean',
  'median',
  'percentile',
  'productivity',
  'efficiency',
  'performance',
])

/** AXIS 2 — a pace, stated directly. */
const PACE: ReadonlySet<string> = new Set([
  'rate',
  'rates',
  'pace',
  'throughput',
  'velocity',
  'tempo',
])

/**
 * AXIS 2, second shape — `per`/`by` followed by a unit. A measure sliced per
 * hour, per shift or per worker is the first step down the chain the spec
 * refuses: tenant-month is the coarsest honest unit, and a person is never a
 * unit at all.
 *
 * `per` and `by` only count as words in their own right, which is why
 * `permissions` and `bypass` walk past untouched.
 */
const SLICE_PREFIX: ReadonlySet<string> = new Set(['per', 'by'])

const SLICE_UNIT: ReadonlySet<string> = new Set([
  'hour',
  'hours',
  'minute',
  'minutes',
  'second',
  'seconds',
  'day',
  'days',
  'week',
  'weeks',
  'shift',
  'shifts',
  'run',
  'runs',
  'job',
  'jobs',
  'task',
  'tasks',
  'worker',
  'workers',
  'operator',
  'operators',
  'employee',
  'employees',
  'person',
  'people',
  'head',
])

/** AXIS 3 — a duration: time spent, which is a pace measure worn backwards. */
const DURATION: ReadonlySet<string> = new Set([
  'duration',
  'durations',
  'elapsed',
  'minutes',
  'seconds',
  'hours',
  'millis',
  'milliseconds',
  'idle',
  'downtime',
  'dwell',
])

/**
 * True when this object key names a behavioural measure on a person.
 *
 * Apply it to the keys of a record that IS about a person — a user register
 * row, a roster fixture, a worker record. The person half of the question is
 * the record; this function answers the measure half.
 *
 * Returns false for a lifecycle token (`accountState`), an identity field
 * (`roleName`, `displayName`), or an authority field (`scopeLabel`) — none of
 * which measures anybody, however many measure words hide inside their
 * letters.
 */
export function namesPersonBehaviouralMeasure(key: string): boolean {
  const parts = words(key)

  for (const [index, part] of parts.entries()) {
    // AXIS 1 and the direct half of AXIS 2 and AXIS 3: one word is enough.
    if (MAGNITUDE.has(part) || PACE.has(part) || DURATION.has(part)) return true

    // AXIS 2, second shape: `per`/`by` immediately followed by a unit. The
    // pair is the semantic unit here — `per` alone means nothing, and a bare
    // `shift` is a schedule, not a measure of a person.
    if (SLICE_PREFIX.has(part)) {
      const next = parts[index + 1]
      if (next !== undefined && SLICE_UNIT.has(next)) return true
    }
  }

  return false
}
