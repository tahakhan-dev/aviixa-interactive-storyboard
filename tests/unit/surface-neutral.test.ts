import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe, presentOrNull } from '../probe-paths'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import {
  OPEN_DECISIONS,
  OPEN_DECISION_IDS,
  decisionRecord,
  type DecisionId,
} from '@/disclosure/decisions'
import { FiveSurfaceEffects } from '@/ui/shared/FiveSurfaceEffects'
import {
  JOURNEY_SURFACES,
  affected,
  noEffect,
  type JourneyStep,
} from '@/ui/shared/journey'

/**
 * Slice 6, wave 0, task 1 — the two mechanisms fifteen slice-6 tasks consume,
 * gated on the property that made them worth moving rather than on the fact
 * that they moved.
 *
 * The defect this exists to stop is not a broken import. It is a Hub screen
 * disclosing `DEC-LANEB-001` in its own words while a Studio screen discloses
 * it in the canon's — two disclosures of one open decision, which the client
 * then has to reconcile before answering it. So the gates below are about
 * IDENTITY (one source identifier, one record, one wording, one locator set)
 * and about REACH (a Hub-shaped step renders through the same panel, with no
 * Studio field in the way), not about file paths.
 */

/* ── the scan ─────────────────────────────────────────────────────────── */

/**
 * Probe-aware, through the one hoisted predicate: a concurrent suite's
 * scratch probe is another process's business, and a walk that lists one then
 * ENOENTs on it fails a correct build on a race. `tests/probe-paths` carries
 * the account.
 */
const walk = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((entry) => {
    if (isForeignProbe(entry)) return []
    const path = join(dir, entry)
    const stat = presentOrNull(() => statSync(path))
    if (stat === null) return []
    return stat.isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(path) ? [path] : []
  })

/**
 * A `@/studio` import in a surface-neutral module. Matched on the import
 * SPECIFIER, not on the word anywhere in the file, so a doc comment naming
 * `SURF-STU` — which both modules legitimately do — is not a finding.
 */
const STUDIO_IMPORT = /from\s+'@\/studio\//

describe('the lift is real: nothing surface-neutral reaches back into one surface', () => {
  // Fails if a neutral module imports from `@/studio` again. Proved by
  // planting `import { STU_MODULES } from '@/studio/modules'` into
  // `src/ui/shared/journey.ts`: red, naming that file.
  it('finds files under both neutral homes, and no @/studio import in any of them', () => {
    const neutral = [...walk('src/disclosure'), ...walk('src/ui/shared')]
    expect(neutral.length).toBeGreaterThanOrEqual(4)
    expect(neutral.filter((f) => STUDIO_IMPORT.test(readFileSync(f, 'utf8')))).toEqual([])
  })

  /**
   * The Studio-only spelling of the step's workflow reference is GONE, not
   * shadowed by a second field carrying the same thing — which is the defect
   * a "lift" most often ships. The whole tree is scanned INCLUDING this file,
   * so the needle is assembled rather than written: spelling it here would
   * make the gate report itself, which is how a scan gets an exemption and
   * then stops seeing the thing it exempted.
   */
  it('has no Studio-only workflow field left anywhere, so there is one and not two', () => {
    const retired = 'wf' + 'Aut'
    const everywhere = [...walk('src'), ...walk('app'), ...walk('tests')]
    expect(everywhere.filter((f) => readFileSync(f, 'utf8').includes(retired))).toEqual([])
  })
})

/* ── the canon's membership, asserted here and nowhere else ───────────── */

/**
 * THE ONE HAND-MAINTAINED COPY OF THE CANON'S MEMBERSHIP, AND WHY IT IS HERE.
 *
 * Slice 10 raised the canon from twenty-nine records to forty-three and eleven
 * hand-maintained copies of the old number went stale at once: a literal id
 * list and a length in a Studio VOCABULARY test, a named-refs count below,
 * four expiry gates that pinned the count of a canon they only needed to be
 * ABSENT from, two absence sweeps, and a runtime string. Eleven copies of one
 * derived number is a number that will be edited eleven times a slice until
 * someone edits it wrongly, and a Studio test going red because the Command
 * Center registered a decision is that gate.
 *
 * So membership is asserted exactly once, and it is asserted HERE because this
 * is the suite that owns `src/disclosure/` — the canon is surface-neutral, so
 * the gate over it has to be too. Every other file asserts only what it owns:
 * that its own identifier is absent from the canon, or that its own record is
 * present and well-formed. None of them asserts a global count.
 *
 * WHY A LITERAL LIST RATHER THAN A LENGTH. Three things lock together inside
 * the module: the `DecisionId` union, `OPEN_DECISION_IDS`, and the records. The
 * union and the id list are held together at COMPILE time (`as const satisfies
 * readonly DecisionId[]` one way, `_decisionIdsExhaustive` the other), so a
 * deletion from all three leaves nothing inside the module to notice it. Only a
 * list declared OUTSIDE it can, which is what this is — and because it is typed
 * `readonly DecisionId[]`, it catches that deletion twice over: the plant below
 * is red here at run time AND a `tsc` error naming the id, because the literal
 * no longer resolves against the union. A `toHaveLength` in its place would be
 * the `toEqual([...MY_CONSTANT])` entry in this build's catalogue of gates that
 * could not fail: satisfied by any 43 records at all.
 */
const CANON_IDS: readonly DecisionId[] = [
  'D1',
  'D2',
  'DEC-AUDSTU-001',
  'D4',
  'D5',
  'D6',
  'DEC-WFROLL-001',
  'D8',
  'D9',
  'D10',
  'D11',
  'DEC-CAPAUTH-001',
  'DEC-DELEG-001',
  'DEC-LANEB-001',
  'DEC-LIB-001',
  'DEC-WIDIFF-001',
  'DEC-LIBREV-001',
  'DEC-LANEBAUTH-001',
  'DEC-CAP-001',
  'DEC-TAX-002',
  'D21',
  'D22',
  'DEC-STUXREF-001',
  'DEC-TENGRANT-001',
  'DEC-ROLE-001',
  'DEC-RELAUTH-001',
  'DEC-EMBED-001',
  'DEC-ARCH-001',
  'D29',
  'DEC-AUDITSUP-001',
  'DEC-AUDITQM-001',
  'DEC-AUDITHASH-001',
  'DEC-AUDITOFF-001',
  'DEC-NOTIFCOUNT-001',
  'DEC-NOTIFSEV-001',
  'DEC-NOTIFPRI-001',
  'DEC-NOTIFPREF-001',
  'DEC-NOTIFACK-001',
  'DEC-SCHED-002',
  'DEC-SCHED-011',
  'DEC-FINISH-002',
  'DEC-CMDEXP-001',
  'S10-IDENT-SCHED-001',
]

/**
 * The ONE record in the canon carrying no readings, named by id rather than
 * exempted by a relaxed floor. `DEC-FINISH-002` is named as a contradiction
 * and indexed, and neither occurrence writes either reading down, so the
 * absence IS its disclosure and inventing two would have been the worse
 * outcome. A floor of `>= 0`, or an unconditional exception, would let any
 * later record ship with no readings at all — so the exception set is asserted
 * EXACTLY, and a second empty-readings record is red here rather than silent.
 */
const NO_READINGS_BY_DESIGN: readonly DecisionId[] = ['DEC-FINISH-002']

/**
 * Every record carrying a second spelling of its own question. THREE, not one:
 * `DEC-WFROLL-001` (`DEC-VERROLL-001`), `DEC-SCHED-002`
 * (`DEC-SCHED-MISFIRE-001`), and `S10-IDENT-SCHED-001`, whose subject is a
 * non-human identity register rather than a decision and which therefore
 * carries the re-spellings rather than one. Where the source asks one question
 * under two identifiers and never cross-references them, dropping one makes
 * the card unfindable by a client searching on the other, so the set is
 * asserted in full rather than "the only alias on the surface".
 */
const ALIAS_BEARING: readonly DecisionId[] = [
  'DEC-WFROLL-001',
  'DEC-SCHED-002',
  'S10-IDENT-SCHED-001',
]

describe('the canon’s membership, asserted in exactly one place', () => {
  /**
   * FAILS IF: a record is lost, added, renamed or reordered. Both spellings of
   * the canon are checked against a list declared OUTSIDE the module, so a
   * deletion that keeps the union, the id list and the records consistent —
   * the only kind that type-checks — still goes red.
   *
   * Planted: the `DEC-CMDEXP-001` record deleted from `OPEN_DECISIONS` only.
   * RED, naming the record list. Planted again: deleted from `OPEN_DECISIONS`,
   * `OPEN_DECISION_IDS` and the `DecisionId` union together, which typechecks
   * clean. RED here, naming `OPEN_DECISION_IDS`.
   */
  it('holds exactly the records this gate names, by both spellings', () => {
    expect(OPEN_DECISION_IDS, 'the declared id list').toEqual(CANON_IDS)
    expect(OPEN_DECISIONS.map((d) => d.id), 'the records').toEqual(CANON_IDS)
  })

  /**
   * FAILS IF: a record ships malformed — no question, no adopted position, a
   * reading with no text, or a locator that names no line. Canon-wide, because
   * it is the canon's shape and not one surface's.
   */
  it('gives every record a question, an adopted position, and readings that name lines', () => {
    for (const d of OPEN_DECISIONS) {
      expect(d.question.length, `${d.id} question`).toBeGreaterThan(0)
      expect(d.adopted.length, `${d.id} adopted`).toBeGreaterThan(0)
      for (const r of d.readings) {
        expect(r.locator, `${d.id} locator`).toMatch(/L\d{3,6}/)
        expect(r.text.length, `${d.id} reading text`).toBeGreaterThan(0)
      }
    }
  })

  /**
   * FAILS IF: a record ships with fewer than two readings and is not the one
   * the canon states carries none — in EITHER direction. A new thin record is
   * red because it is not in the exception set; the exception losing its own
   * emptiness is red because the set is asserted exactly.
   *
   * Planted: one reading deleted from `DEC-AUDITQM-001`, leaving it with one.
   * RED — the measured set gained a member the exception set does not name.
   */
  it('gives every record two readings except the one that discloses having none', () => {
    const thin = OPEN_DECISIONS.filter((d) => d.readings.length < 2).map((d) => d.id)
    expect(thin, 'records below the two-reading floor').toEqual(NO_READINGS_BY_DESIGN)
    for (const id of NO_READINGS_BY_DESIGN) {
      expect(decisionRecord(id).readings, `${id} readings`).toEqual([])
    }
  })

  /**
   * FAILS IF: an alias is dropped, or a record gains one without being named
   * here. Dropping one is not a cosmetic loss: it is the client searching on
   * the spelling the build discarded and finding nothing.
   *
   * Planted: `alias` nulled on `DEC-SCHED-002`. RED, naming the set.
   */
  it('carries a second spelling on exactly the three records that have one', () => {
    expect(OPEN_DECISIONS.filter((d) => d.alias !== null).map((d) => d.id)).toEqual(ALIAS_BEARING)
    expect(decisionRecord('DEC-WFROLL-001').alias).toBe('DEC-VERROLL-001')
    expect(decisionRecord('DEC-SCHED-002').alias).toBe('DEC-SCHED-MISFIRE-001')
    expect(decisionRecord('S10-IDENT-SCHED-001').alias).toContain('IDENT-SCHED-CTL')
  })
})

/* ── the canon's key ──────────────────────────────────────────────────── */

describe('one decision, one key, whichever surface cites it', () => {
  /**
   * THE INVARIANT THE RE-KEY BUYS. Where the source names a decision, that
   * name IS the key, so a Hub screen and a Studio screen citing the same
   * source identifier cannot reach different records. Where the source names
   * none, `decisionRef` is null and says so.
   *
   * Fails if a record is keyed on anything other than its own source
   * identifier. Proved by planting `id: 'D14'` back onto the
   * `DEC-LANEB-001` record: red, naming D14/DEC-LANEB-001.
   */
  it('keys every source-named decision on the source’s own identifier', () => {
    const wrong = OPEN_DECISIONS.filter((d) => d.decisionRef !== null && d.decisionRef !== d.id)
    expect(wrong.map((d) => [d.id, d.decisionRef])).toEqual([])
  })

  /**
   * The other half, so the invariant cannot be satisfied by nulling every ref.
   * It used to be a pair of counts — twenty-nine records, seventeen of them
   * named — which is a stored copy of a derived answer and went stale the
   * moment fourteen records landed. The RULE those counts were standing in for
   * is exact and needs no number: a record keyed on the source's own
   * identifier spells it `DEC-*` and repeats it in `decisionRef`; a record
   * keyed on this build's own key does not, and says so with `null`. Both
   * directions, so neither nulling every ref nor inventing one passes.
   *
   * `S10-IDENT-SCHED-001` is the reason this is a prefix rule rather than "is
   * it a D-number": its subject is a non-human identity register the source
   * raises no decision for, so it carries a build-local key that is not a
   * `D`-number and a null ref.
   */
  it('names a source identifier on exactly the records whose key is one', () => {
    const misfiled = OPEN_DECISIONS.filter(
      (d) => d.id.startsWith('DEC-') !== (d.decisionRef !== null),
    )
    expect(misfiled.map((d) => [d.id, d.decisionRef])).toEqual([])
    // A floor, so the rule is not vacuous on an empty or all-null canon.
    expect(OPEN_DECISIONS.filter((d) => d.decisionRef !== null).length).toBeGreaterThan(0)
    expect(OPEN_DECISIONS.filter((d) => d.decisionRef === null).length).toBeGreaterThan(0)
  })

  /**
   * Fails if one source decision ever gets two records — the structural form
   * of "a second wording of one decision". Proved by planting a copy of the
   * `DEC-LIB-001` record under the id `D9`: red, naming DEC-LIB-001.
   */
  it('gives one source decision exactly one record', () => {
    const refs = OPEN_DECISIONS.map((d) => d.decisionRef).filter((r) => r !== null)
    const duplicated = refs.filter((r, i) => refs.indexOf(r) !== i)
    expect(duplicated).toEqual([])
  })
})

/* ── the four slice 5 and slice 6 both cite ───────────────────────────── */

/**
 * The locator sets, written here as literals and checked against the frozen
 * source rather than read off the record they police: `AC-STU-097` is at
 * L33397, `AC-STU-138` at L34332, the `DEC-LANEB-001` card at L33253,
 * `DEC-WFROLL-001` at L53350 with its card at L53710, `DEC-VERROLL-001` at
 * L8623, `DEC-LIB-001` at L32591 and L33805, `DEC-TAX-002` at L31892 and
 * L31894. A pointer and its corroborating literal moving together is the
 * failure this shape exists to survive.
 */
const SHARED: readonly (readonly [DecisionId, readonly string[]])[] = [
  [
    'DEC-LANEB-001',
    ['AC-STU-097 · L33397 · card DEC-LANEB-001 L33253', 'AC-STU-138 · L34332 · card DEC-LANEB-001 L33253'],
  ],
  ['DEC-WFROLL-001', ['DEC-WFROLL-001 · L53350 · card at L53710', 'DEC-VERROLL-001 · L8623']],
  ['DEC-LIB-001', ['DEC-LIB-001 · L32591', 'DEC-LIB-001 · L32591 · L33805']],
  ['DEC-TAX-002', ['DEC-TAX-002 · L31894', 'DEC-TAX-002 · L31892']],
]

const disclose = (id: DecisionId): string =>
  renderToStaticMarkup(createElement(DecisionDisclosure, { id }))

describe('the four identifiers slice 5 and slice 6 both cite', () => {
  /**
   * A Hub screen cites these by writing the source identifier — the same
   * string the Studio screen writes — and gets this component and this
   * record. Fails if a reading is dropped or a locator is reworded on any of
   * the four. Proved by planting a one-character edit into
   * `DEC-LIB-001`'s second locator: red, naming that locator.
   */
  it('renders every reading with its own frozen locator, on all four', () => {
    for (const [id, locators] of SHARED) {
      const markup = disclose(id)
      expect(decisionRecord(id).readings.length, `${id} readings`).toBe(locators.length)
      for (const locator of locators) expect(markup, `${id} renders ${locator}`).toContain(locator)
    }
  })

  // Fails if the alias stops rendering, so a client searching on
  // DEC-VERROLL-001 stops finding the card DEC-WFROLL-001 heads.
  it('renders both identifiers for the rollback question', () => {
    const markup = disclose('DEC-WFROLL-001')
    expect(markup).toContain('DEC-WFROLL-001')
    expect(markup).toContain('also cited as DEC-VERROLL-001')
  })
})

describe('the rule the canon exists to enforce survives the move', () => {
  /**
   * `APP-012`: the client delegated the decision. Every record, not a sample
   * — a disclosure that quietly stops labelling its position is exactly how
   * an open question becomes a settled one on screen.
   */
  it('labels the build position a client-delegated choice on every record', () => {
    for (const d of OPEN_DECISIONS) {
      const markup = disclose(d.id)
      expect(markup, `${d.id}`).toContain(
        'A client-delegated choice under APP-012, not a position the source settled.',
      )
      expect(markup, `${d.id} adopted`).toContain(d.adopted.slice(0, 40))
    }
  })

  // A reading still has nowhere to be marked as the answer.
  it('gives a reading exactly two fields', () => {
    for (const d of OPEN_DECISIONS)
      for (const r of d.readings)
        expect(Object.keys(r).sort(), `${d.id}`).toEqual(['locator', 'text'])
  })
})

/* ── the five-surface panel, from a surface that is not the Studio ────── */

/**
 * A Hub step, built here rather than imported, because the point is that the
 * panel takes a step from a surface whose journey does not exist yet.
 * `WF-ORG-004` (L52656) is the Hub's Job creation-and-approval workflow.
 */
const HUB_STEP: JourneyStep = {
  number: 2,
  title: 'Approve the Job',
  workflowRef: 'WF-ORG-004',
  sourceRef: 'L52656',
  ownerModule: 'MOD-DOH-05',
  actingSurface: 'DOH',
  effects: {
    DOH: affected('the Job reaches approved and the approval is recorded against a second identity', 'L52658'),
    STU: noEffect('it authors nothing; the workflow version the Job references is already published', 'L52658'),
    CC: noEffect('a Job approval is not an in-shift decision', 'L52658'),
    FL: noEffect('no device receives anything until a run is scheduled and a package pinned', 'L52658'),
    SA: noEffect('the console holds no tenant Job record', 'L52658'),
  },
  note: null,
}

describe('the panel renders a step from any surface', () => {
  /**
   * Fails if any surface row disappears or renders blank for a step the
   * Studio did not author. Proved by planting a `return null` for the `CC`
   * row in `FiveSurfaceEffects`: red, naming effect-CC.
   */
  it('renders all five surface rows for a Hub step, none blank', () => {
    const html = renderToStaticMarkup(createElement(FiveSurfaceEffects, { step: HUB_STEP }))
    for (const surface of JOURNEY_SURFACES)
      expect(html, `${surface.code}`).toContain(`data-testid="effect-${surface.code}"`)
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    expect(text).toContain('No direct effect — a Job approval is not an in-shift decision')
    expect(text).toContain('WF-ORG-004')
  })

  /**
   * The generalisation must not have narrowed the field. The source writes
   * compounds it has no identifier for, and the qualifier is the only thing
   * telling a reader the step is not squarely inside that workflow. Fails if
   * `workflowRef` is ever typed or rendered as a bare `WF-<FAMILY>-<NNN>`.
   * Proved by planting a `.slice(0, 10)` on the rendered value: red.
   */
  it('renders a compound workflow reference whole, and omits the row entirely for null', () => {
    const compound = renderToStaticMarkup(
      createElement(FiveSurfaceEffects, {
        step: { ...HUB_STEP, workflowRef: 'WF-AUT-002 into WF-AUT-004' },
      }),
    ).replace(/<[^>]+>/g, ' ')
    expect(compound).toContain('WF-AUT-002 into WF-AUT-004')

    const none = renderToStaticMarkup(
      createElement(FiveSurfaceEffects, { step: { ...HUB_STEP, workflowRef: null } }),
    )
    expect(none).not.toContain('WF-')
  })
})
