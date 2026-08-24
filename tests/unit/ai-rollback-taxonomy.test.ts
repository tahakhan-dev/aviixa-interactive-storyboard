import { describe, expect, it } from 'vitest'
import { isForeignProbe } from '../probe-paths'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  ROLLBACK_FORMS,
  ROLLBACK_FORM_IDS,
  ROLLBACK_MAY_NEVER,
  ROLLBACK_NO_SINGLE_CONTROL,
  ROLLBACK_PROVENANCE,
  ROLLBACK_SOURCE_LINES,
  ROLLBACK_TABLE_HEADER_LINE,
  rollbackForm,
} from '@/ai/controls/rollback'

/**
 * §40.15'S ROLLBACK TAXONOMY — EIGHT FORMS THAT MAY NOT BE CONFLATED.
 *
 * L87803: "Rollback appears on this platform in several distinct forms and
 * they must not be conflated." The table's header is L87805, its separator
 * L87806, and its data runs L87807 to L87814 — EIGHT rows, counted one at a
 * time from the header down rather than inferred from the span, because a span
 * states where a table is and not how many rows it has.
 *
 * WHAT EACH CASE BELOW IS FOR — the defect it would have caught:
 *
 *   1. A TABLE READ SHORT OR LONG. The line above the header and the line
 *      below the last row are both asserted NOT to be table rows, so the
 *      transcription cannot stop early or run into the paragraph after it.
 *      Nothing in the module states a count.
 *   2. ONE CONTROL LABELLED "ROLLBACK". The whole `src/` and `app/` tree is
 *      swept for an operable element whose accessible name is a bare rollback
 *      word: eight forms behind one button is exactly what L87803 forbids.
 *   3. THE FORM THAT REVERSES NOTHING. `Evidence or audit reversal` (L87814)
 *      reverses `Nothing` and is `Explicitly prohibited`. A register that let
 *      it look like the other seven would offer a control for undoing an
 *      audit record.
 *   4. AN INVENTED MECHANISM. `Composed-agent rollback` (L87812) is "Not
 *      specified in the Statement of Work" and must render as that, under
 *      `DEC-AGENTLC-001`.
 *   5. A GOVERNING DECISION DROPPED. Three rows name one — `DEC-LANEA-001`,
 *      `DEC-AGENTLC-001`, `DEC-MODEL-001` — and they are read off the row's
 *      own bytes rather than assigned, so a row cannot lose its decision
 *      silently.
 */

/* ── the frozen source ─────────────────────────────────────────────────── */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'

const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)

/** One-based, so a test reads the same number a citation writes. */
const lineAt = (n: number): string => sourceLines[n - 1] ?? ''

describe('the frozen source this register was built from', () => {
  it('is the bytes every locator below was measured against', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(122_241)
  })
})

describe('the rollback table, as the frozen bytes write it', () => {
  it('carries the header at L87805 and its separator on the line below', () => {
    expect(ROLLBACK_TABLE_HEADER_LINE).toBe(87_805)
    expect(lineAt(ROLLBACK_TABLE_HEADER_LINE)).toBe(
      '| Rollback form | What it reverses | Mechanism | Source |',
    )
    expect(lineAt(ROLLBACK_TABLE_HEADER_LINE + 1)).toBe('|---|---|---|---|')
  })

  it('transcribes every line verbatim, header and separator included', () => {
    ROLLBACK_SOURCE_LINES.forEach((line, index) => {
      expect(line, `L${String(ROLLBACK_TABLE_HEADER_LINE + index)}`).toBe(
        lineAt(ROLLBACK_TABLE_HEADER_LINE + index),
      )
    })
  })

  it('stops exactly where the table stops, at both ends', () => {
    // THE OFF-BY-ONE GATE. Neither boundary line is a table row, so the
    // transcription cannot have started one row late or run one row long.
    const above = lineAt(ROLLBACK_TABLE_HEADER_LINE - 1)
    const below = lineAt(ROLLBACK_TABLE_HEADER_LINE + ROLLBACK_SOURCE_LINES.length)
    expect(above.trim().startsWith('|')).toBe(false)
    expect(below.trim().startsWith('|')).toBe(false)
    // And the last transcribed line IS a row, so it did not stop one short.
    expect(ROLLBACK_SOURCE_LINES.at(-1)?.startsWith('|')).toBe(true)
  })

  it('reads the same forms the frozen rows name, in source order', () => {
    // The population as a LITERAL LIST declared here, outside the module. A
    // length would pass over a renamed form and over a duplicated one; this
    // fails on an addition, on a removal and on a re-ordering.
    expect(ROLLBACK_FORM_IDS).toEqual([
      'lane-a-reversal',
      'configuration-change-reversal',
      'workflow-version-rollback',
      'atom-or-agent-disablement',
      'model-binding-rollback',
      'composed-agent-rollback',
      'emergency-pause',
      'evidence-or-audit-reversal',
    ])
  })

  it('gives every form the line it was read from, one row apart, in order', () => {
    ROLLBACK_FORMS.forEach((form, index) => {
      expect(form.sourceRef).toBe(`L${String(87_807 + index)}`)
      expect(lineAt(87_807 + index)).toContain(form.form)
    })
  })
})

/**
 * A CONTROL WHOSE VISIBLE NAME IS JUST "ROLLBACK", IN EVERY SPELLING JSX ALLOWS.
 *
 * React renders all of them identically and a reader cannot tell them apart on
 * screen, so a pattern that lists some of them is a pattern a future edit
 * walks past by changing a quote character. Declared once, probed below.
 *
 * TWO GAPS BETWEEN THAT CLAIM AND WHAT THIS PATTERN USED TO DO:
 *
 *  1. THE JSX EXPRESSION CHILD. `>{'Rollback'}<` renders exactly what
 *     `>Rollback<` renders, and no branch matched it. Prettier writes that
 *     form whenever a child begins or ends with whitespace or a brace.
 *  2. THE OTHER NAMING ATTRIBUTES. Only `label` and `aria-label` were read.
 *     `title` is announced, `value` is the visible name of a submit input,
 *     `alt` is the accessible name of an image button, and `placeholder` is
 *     read where nothing else names a field.
 *
 * `aria-labelledby` IS DELIBERATELY OUTSIDE, and that is the one limit here.
 * It carries an ID REFERENCE, not text: convicting it means resolving the
 * target element's own content across files, which a text scan cannot do. The
 * case below asserts that limit rather than leaving it implied.
 */
const NAME_ATTRIBUTE = 'aria-label|label|title|value|alt|placeholder'
const LABELLED_ROLLBACK = new RegExp(
  `(?:${NAME_ATTRIBUTE})=(?:"([^"]*)"|'([^']*)'|\\{"([^"]*)"\\}|\\{'([^']*)'\\}|\\{\`([^\`$]*)\`\\})`
    + '|>\\s*(Roll ?back)\\s*<'
    + '|>\\s*\\{\\s*(?:"([^"]*)"|\'([^\']*)\'|`([^`$]*)`)\\s*\\}\\s*<',
  'gi',
)

describe('L87803 — the forms may not be conflated', () => {
  it('quotes the rule from the line that carries it', () => {
    expect(lineAt(87_803)).toContain(
      'Rollback appears on this platform in several distinct forms and they must not be conflated.',
    )
    expect(ROLLBACK_NO_SINGLE_CONTROL.sourceRef).toBe('L87803')
  })

  it('offers no operable element anywhere in src/ or app/ whose name is just "rollback"', () => {
    // A reader who can press one button labelled "rollback" has been told the
    // eight forms are one thing. Scoped to a control's own visible label — a
    // JSX text child or a `label`/`aria-label` value — so prose about rollback
    // is untouched and only an affordance is convicted.
    const offenders: string[] = []
    for (const file of walk('src').concat(walk('app'))) {
      if (!/\.tsx$/.test(file)) continue
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(LABELLED_ROLLBACK)) {
        const value = (match.slice(1).find((group) => group !== undefined) ?? '').trim()
        if (/^roll ?back$/i.test(value)) offenders.push(`${file}: ${value}`)
      }
    }
    expect(offenders, 'a single control labelled "rollback" (L87803)').toEqual([])
  })

  it('catches every JSX spelling of that label, not the three it happened to list', () => {
    // The pattern used to accept `label="Rollback"`, `aria-label="Rollback"` and
    // `>Rollback<` and MISS `label={"Rollback"}` and the backtick form — two
    // spellings React treats identically and a reader cannot tell apart on
    // screen. Proved by probe rather than by reading the regex.
    const convicts = (source: string): boolean =>
      [...source.matchAll(LABELLED_ROLLBACK)].some((match) =>
        /^roll ?back$/i.test((match.slice(1).find((g) => g !== undefined) ?? '').trim()),
      )
    for (const spelling of [
      '<Button label="Rollback" />',
      "<Button label={'Rollback'} />",
      '<Button label={"Rollback"} />',
      '<Button label={`Rollback`} />',
      '<Button aria-label="Rollback" />',
      '<Button aria-label={`Roll back`} />',
      "<Button label='Rollback' />",
      '<button>Rollback</button>',
      '<button> Roll back </button>',
      // The JSX expression child — identical on screen, previously unmatched.
      "<button>{'Rollback'}</button>",
      '<button>{"Roll back"}</button>',
      '<button>{`Rollback`}</button>',
      // The other attributes that become a control's announced name.
      '<button title="Rollback" />',
      '<input type="submit" value="Rollback" />',
      '<img alt="Rollback" />',
      '<input placeholder="Rollback" />',
    ]) {
      expect(spelling, `a rollback label spelled: ${spelling}`).toSatisfy(convicts)
    }
    // And the prose this build needs everywhere is untouched.
    for (const innocent of [
      '<p>Rollback appears in eight distinct forms.</p>',
      '<Button label="Rollback of a model version" />',
      '// Rollback is not one control.',
      '<Button label={`Rollback — ${form.form}`} />',
    ]) {
      expect(innocent, `a false alarm on: ${innocent}`).not.toSatisfy(convicts)
    }
  })

  /**
   * THE LIMIT, ASSERTED AS A LIMIT. `aria-labelledby` names another element
   * by id and carries no text of its own, so a control accessibly named
   * "Rollback" through a referenced heading passes this scan. Closing it
   * needs the reference resolved — the target may be in another component and
   * its text may be composed at run time — which is a rendered-DOM check, not
   * a source scan. Written as a live expectation so that the day someone
   * closes it, this case reds and sends them to the paragraph above rather
   * than to a comment that has quietly gone stale.
   */
  it('and does NOT convict a name reached through aria-labelledby, which is the open limit', () => {
    const convicts = (source: string): boolean =>
      [...source.matchAll(LABELLED_ROLLBACK)].some((match) =>
        /^roll ?back$/i.test((match.slice(1).find((g) => g !== undefined) ?? '').trim()),
      )
    // Named "Rollback" on screen, and invisible to a text scan: the id
    // reference is not followed, and the referenced element's own text is a
    // binding rather than a literal. The referenced element is commonly in
    // another file as well, which no per-file scan can join.
    expect(convicts('<button aria-labelledby="rb" /><h2 id="rb">{ROLLBACK_HEADING}</h2>'))
      .toBe(false)
    // The direct spelling of the same control IS convicted, so the gap is the
    // indirection and not the phrase.
    expect(convicts('<button aria-label="Rollback" />')).toBe(true)
  })
})

describe('the row that reverses nothing, and the row with no mechanism', () => {
  it('holds `Evidence or audit reversal` as prohibited and reversing nothing', () => {
    const form = rollbackForm('evidence-or-audit-reversal')
    expect(form.sourceRef).toBe('L87814')
    expect(form.whatItReverses).toBe('Nothing')
    expect(form.reversesNothing).toBe(true)
    expect(form.prohibited).toBe(true)
    expect(form.mechanism).toContain('evidence is immutable and audit history is never removed')
  })

  it('is the only prohibited form, and the only one reversing nothing', () => {
    expect(ROLLBACK_FORMS.filter((f) => f.prohibited).map((f) => f.id)).toEqual([
      'evidence-or-audit-reversal',
    ])
    expect(ROLLBACK_FORMS.filter((f) => f.reversesNothing).map((f) => f.id)).toEqual([
      'evidence-or-audit-reversal',
    ])
  })

  it('holds `Composed-agent rollback` as a stated absence under DEC-AGENTLC-001', () => {
    const form = rollbackForm('composed-agent-rollback')
    expect(form.sourceRef).toBe('L87812')
    expect(form.mechanism).toContain('Not specified in the Statement of Work')
    expect(form.notSpecified).toBe(true)
    expect(form.governingDecisions).toEqual(['DEC-AGENTLC-001'])
  })

  it('reads each row\'s governing decisions off the row rather than assigning them', () => {
    const withDecisions = ROLLBACK_FORMS.filter((f) => f.governingDecisions.length > 0)
    expect(withDecisions.map((f) => [f.id, f.governingDecisions])).toEqual([
      ['lane-a-reversal', ['DEC-LANEA-001']],
      ['model-binding-rollback', ['DEC-MODEL-001']],
      ['composed-agent-rollback', ['DEC-AGENTLC-001']],
    ])
    for (const form of withDecisions) {
      for (const id of form.governingDecisions) {
        expect(lineAt(Number(form.sourceRef.slice(1)))).toContain(id)
      }
    }
  })
})

describe('L87816 — what rollback may never do', () => {
  it('carries the three prohibitions the line states, each quoting its own clause', () => {
    const line = lineAt(87_816)
    expect(line).toContain('**What rollback may never do.**')
    expect(ROLLBACK_MAY_NEVER).toHaveLength(4)
    for (const rule of ROLLBACK_MAY_NEVER) {
      expect(rule.sourceRef).toBe('L87816')
      expect(line, rule.rule).toContain(rule.quotation)
    }
  })
})

describe('provenance', () => {
  it('emits exactly one class, and it is the deterministic-rule one', () => {
    expect(ROLLBACK_PROVENANCE).toBe('PROV-4')
  })
})

/* ── the sweep ─────────────────────────────────────────────────────────── */

function walk(root: string): string[] {
  const out: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (isForeignProbe(entry)) continue
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) visit(path)
      else out.push(path)
    }
  }
  visit(join(process.cwd(), root))
  return out
}
