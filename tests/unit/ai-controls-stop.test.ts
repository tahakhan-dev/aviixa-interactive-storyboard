import { describe, expect, it } from 'vitest'
import { isForeignProbe, ownProbeDir, withPlanted } from '../probe-paths'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isRefusal, permitsAction } from '@/policy/decision'
import { AI_AGENT_ROSTER, type AiAgentId } from '@/ai/agents/roster'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import {
  AGENT_IDENTITY_COLUMNS,
  AGENT_INITIATION_REFUSALS,
  FRONTLINE_PAUSE_DISCLOSURE,
  KILL_SWITCH,
  PAUSE_RESUME_WORKFLOW,
  PAUSE_SEMANTICS,
  pauseSemanticBody,
  PAUSE_SHIPPED_SCOPES,
  RESUME_IS_SEPARATE,
  SITE_SCOPED_PAUSE,
  STOP_ACTS,
  STOP_CONTROLS_PROVENANCE,
  STOP_MECHANISMS,
  refuseAgentInitiation,
} from '@/ai/controls/stop'

/**
 * §40.15'S THREE STOP-AND-START CONTROLS, AND THE ONE PLACE ALL FOUR ACTS
 * REFUSE A NON-HUMAN IDENTITY.
 *
 * WHAT EACH CASE BELOW IS FOR — the defect it would have caught:
 *
 *   1. A THIRD PAUSE SCOPE AS A WORKING CONTROL. The site-scoped pause is
 *      `Recommendation — R&D` under `DEC-AIPAUSE-001` (L91229) and its matrix
 *      row (L91289) reads `Client Decision Required` in three role cells and
 *      `Explicitly prohibited` in the fourth. It renders disabled with both
 *      readings — never absent, never working.
 *   2. THE KILL SWITCH CONFLATED WITH THE PAUSE. Two mechanisms, two settings
 *      categories, two approval classes (L87795). Each of the kill switch's
 *      four unstated attributes is asserted individually against L87795's own
 *      sentence, so a register that quietly gave it a scope goes red.
 *   3. AN AUTOMATIC RESUME. `AC-AI-015-5` (L87890) — "no automatic resume
 *      exists" — and `TEST-AI-015-5` (L87902) is the test that would find one.
 *      `src/ai/controls/` and the incident route are swept for a timer.
 *   4. AN AGENT INITIATING A STOP. `AC-AI-015-7` (L87892) — "No agent can
 *      initiate a pause, a resume, a kill, or any rollback." Every one of the
 *      four acts is attempted from every roster identity and asserted refused
 *      AND audited, which is what `TEST-AI-015-7` (L87904) requires.
 *   5. A HUMAN SESSION ANSWERING A NON-HUMAN CELL. The refusal routes through
 *      `evaluateColumnAccess`, whose identity arm throws when handed one
 *      (L99197). That is the slice-10 mechanism rather than a new check.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)
const lineAt = (n: number): string => sourceLines[n - 1] ?? ''

describe('the frozen source these controls were built from', () => {
  it('is the bytes every locator below names', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(122_241)
  })
})

describe('the three fixed semantics, stated exactly (L87789-L87791)', () => {
  it('carries three, each quoting the numbered line it is read from', () => {
    // A literal list outside the module: the three keys, in source order.
    expect(PAUSE_SEMANTICS.map((s) => s.id)).toEqual([
      'checkpoint-at-stage-boundary',
      'renders-as-unavailability-never-silence',
      'never-suppresses-the-deterministic-layer',
    ])
    PAUSE_SEMANTICS.forEach((semantic, index) => {
      const lineNumber = 87_789 + index
      expect(semantic.sourceRef).toBe(`L${String(lineNumber)}`)
      expect(lineAt(lineNumber)).toContain(semantic.heading)
      expect(lineAt(lineNumber)).toContain(semantic.quotation)
      expect(lineAt(lineNumber)).toContain('SoW Fact — §8.7.5')
    })
  })

  /* ================================================================ *
   * R7-C04 — MARKDOWN MARKERS REACHED A READER, ON THE SENTENCE THAT
   * SAYS WHAT SAFETY STILL DOES WHILE AGENTS ARE PAUSED.
   *
   * The screen stripped LEADING emphasis only, so the third semantic's
   * internal `**The pause governs agents, nothing else**` rendered with
   * its asterisks. `quotation` stays verbatim -- the case above opens
   * L87789-L87791 and asserts it -- and `pauseSemanticBody()` is what a
   * screen prints. Asserting the DIFFERENCE, rather than only the
   * absence, is what stops the leak being closed by loosening the
   * transcription instead.
   * ================================================================ */
  it('what a screen prints carries no markdown, and differs from the source by markers alone', () => {
    // The gate is not passing on an array that never had the defect: at
    // least one quotation must carry emphasis INSIDE it, past the lead.
    const withInternalEmphasis = PAUSE_SEMANTICS.filter(
      (s) => s.quotation.replace(/^\*\*[^*]+\*\*\s*/, '').includes('**'),
    )
    expect(withInternalEmphasis.map((s) => s.id)).toEqual([
      'never-suppresses-the-deterministic-layer',
    ])

    for (const semantic of PAUSE_SEMANTICS) {
      const body = pauseSemanticBody(semantic)
      expect(body, `${semantic.id} prints markdown emphasis`).not.toContain('**')
      expect(body, `${semantic.id} prints a code-span marker`).not.toContain('`')
      // Markers removed and NOTHING else: same characters, same order.
      expect(
        semantic.quotation.replaceAll('**', '').replaceAll('`', '').trimStart(),
        `${semantic.id} was reworded rather than stripped`,
      ).toBe(`${semantic.heading}. ${body}`.replace(/^\. /, ''))
    }
  })

  it('holds the deterministic layer untouched as a semantic and not a caveat', () => {
    const third = PAUSE_SEMANTICS.at(-1)
    expect(third?.quotation).toContain('The pause governs agents, nothing else')
  })
})

describe('the two scopes the source gives the pause, and the third it does not', () => {
  it('ships exactly the two source-defined scopes, consumed from the shared join', () => {
    expect(PAUSE_SHIPPED_SCOPES).toEqual(['platform-wide', 'per tenant'])
  })

  it('renders the site-scoped pause disabled, with both readings and every locator', () => {
    expect(SITE_SCOPED_PAUSE.shippable).toBe(false)
    expect(SITE_SCOPED_PAUSE.decision).toBe('DEC-AIPAUSE-001')
    // Both readings of the matrix row, neither obeyed.
    expect(SITE_SCOPED_PAUSE.readings.length).toBeGreaterThan(1)
    for (const reading of SITE_SCOPED_PAUSE.readings) {
      const lineNumber = Number(reading.locator.replace(/^L/, '').split(' ')[0])
      expect(lineAt(lineNumber), reading.locator).not.toBe('')
    }
  })

  it('pins every line DEC-AIPAUSE-001 occurs on, and no other', () => {
    // MEASURED: exactly five lines in the whole file carry the identifier, and
    // the index row at L115250 states the count as five, which matches. It is
    // ABSENT from the §41.9 register (rows L88882-L88909), so citing a row
    // there for it would be citing a line that does not contain it.
    const occurrences = sourceLines
      .map((line, index) => (line.includes('DEC-AIPAUSE-001') ? index + 1 : null))
      .filter((n): n is number => n !== null)
    expect(occurrences).toEqual([91_229, 91_289, 91_319, 91_341, 115_250])
    for (const locator of SITE_SCOPED_PAUSE.locators) {
      expect(occurrences).toContain(Number(locator.replace(/^L/, '')))
    }
  })
})

describe('the kill switch is a different thing (L87795)', () => {
  it('names all four unstated attributes, each found in the line that says so', () => {
    expect(KILL_SWITCH.sourceRef).toBe('L87795')
    expect(KILL_SWITCH.decision).toBe('DEC-KILL-001')
    expect(KILL_SWITCH.unstated).toEqual(['scope', 'threshold', 'initiating authority', 'approval class'])
    const line = lineAt(87_795)
    expect(line).toContain(
      "The Statement of Work does not state the kill switch's scope, threshold, initiating " +
        'authority, or approval class',
    )
    expect(line).toContain('Orchestration setting')
    expect(line).toContain('Governance and Safety setting')
  })

  it('carries the two mechanisms as two records in two settings categories', () => {
    expect(STOP_MECHANISMS.map((m) => m.id)).toEqual(['emergency-pause', 'runaway-loop-kill-switch'])
    const [pause, kill] = STOP_MECHANISMS
    expect(pause?.settingsCategory).toBe('Governance and Safety')
    expect(kill?.settingsCategory).toBe('Orchestration')
    expect(pause?.approvalClass).not.toBe(kill?.approvalClass)
  })

  it('carries the DEC-KILL-001 card at L87797, not the paragraph above it', () => {
    expect(lineAt(87_797)).toContain('`DEC-KILL-001` — the runaway-loop kill switch')
    expect(lineAt(87_796)).toBe('')
  })
})

describe('resume is a separate act, and there is no automatic one', () => {
  it('quotes AC-AI-015-5 from the row that carries it', () => {
    expect(RESUME_IS_SEPARATE.sourceRefs).toContain('L87890')
    expect(lineAt(87_890)).toContain('`AC-AI-015-5`')
    expect(lineAt(87_890)).toContain('no automatic resume exists')
    expect(lineAt(87_902)).toContain('`TEST-AI-015-5`')
  })

  it('has no timer, no window and no auto-resume path in the code TEST-AI-015-5 would search', () => {
    // The scan the criterion implies, run on the files this task wrote. A
    // resume that fires on a clock is the defect; a resume that fires on an
    // approval is the feature, so the scan hunts scheduling primitives rather
    // than the word "resume".
    // TREE-WIDE, BECAUSE A DIRECTORY LIST IS A LIST OF DIRECTORIES SOMEONE
    // THOUGHT OF. This sweep first missed `app/super-admin/platform-settings/`
    // — where the propose and approve rows for the pause live, `PAUSE_STATES`,
    // `PauseRequested`, `ResumeRequested`, all of it — and the fix was to add
    // that one directory, which leaves an `autoResume` in `src/ai/failures/`,
    // a new `src/ai/resume/`, or any other console screen just as invisible.
    // `tests/unit/ai-rollback-taxonomy.test.ts` scans `walk('src')` plus
    // `walk('app')` for its own prohibition, so the tree-wide form was to hand.
    // Measured over the whole tree with comments stripped: ZERO offenders, so
    // no exemption is needed and none is granted.
    const own = ownProbeDir('resume')
    const scan = (): string[] =>
      walk('src', own)
        .concat(walk('app', own))
        // Comment lines are stripped: this file's own prose explains the rule.
        .filter((file) =>
          /setTimeout|setInterval|autoResume|resumeAfter|resumeTimer|resumeWindow/i.test(
            readFileSync(file, 'utf8')
              .split('\n')
              .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
              .join('\n'),
          ),
        )
    expect(scan(), 'an automatic resume path (AC-AI-015-5, L87890)').toEqual([])
    // And the widened scope convicts a timer planted where the old four-
    // directory list could not see it.
    withPlanted(
      join(process.cwd(), 'src', 'ai', 'failures'),
      'probe.ts',
      'export const autoResume = (): void => {\n  setTimeout(() => undefined, 1)\n}\n',
      (probe) => {
        expect(scan()).toContain(probe)
      },
      own,
    )
  })
})

describe('the pause and resume workflow, ten numbered steps (L87820-L87829)', () => {
  it('transcribes every step verbatim and in order, and stops where the list stops', () => {
    PAUSE_RESUME_WORKFLOW.forEach((step, index) => {
      const lineNumber = 87_820 + index
      expect(step.sourceRef).toBe(`L${String(lineNumber)}`)
      expect(lineAt(lineNumber)).toBe(`${String(index + 1)}. ${step.text}`)
    })
    // Neither boundary is a numbered step, so the list cannot have started
    // late or run long.
    expect(lineAt(87_819).startsWith('1. ')).toBe(false)
    expect(/^\d+\. /.test(lineAt(87_820 + PAUSE_RESUME_WORKFLOW.length))).toBe(false)
  })

  it('carries L87826 — a missing scheduled artifact is unavailability, not silence', () => {
    const step = PAUSE_RESUME_WORKFLOW.find((s) => s.sourceRef === 'L87826')
    expect(step?.text).toContain('the absence is shown as unavailability, not silence')
  })
})

/**
 * THE AGENT ROSTER, AS A LITERAL LIST OUTSIDE THE MODULE — ids AND names.
 *
 * `src/ai/controls/stop.ts` says a hand-assembled identity list "would be short
 * by exactly the agent nobody remembered", and the covering assertion was
 * `expect(AGENT_IDENTITY_COLUMNS.length).toBeGreaterThan(0)`. A silent loss of
 * one stayed green in the exact place the module warns about it.
 *
 * TWO HALVES, AND EACH CATCHES WHAT THE OTHER CANNOT. The id list is typed to
 * `AiAgentId`, so an ADDITION to that union is a `tsc` error here — the
 * `Exclude` check below names the missing member. The name list is compared with
 * `toEqual`, so a deletion, a re-order or a re-worded name is red at run time.
 * The Vision Reasoning Agent is the fourth on purpose: it is the roster row with
 * "Not specified" governance and no role matrix anywhere, which is exactly the
 * one a build drops.
 */
const AGENT_IDENTITY_ROSTER_IDS = [
  'prevention',
  'deviation-and-containment',
  'shift-handoff',
  'vision-reasoning',
] as const satisfies readonly AiAgentId[]

type MissingFromAgentRoster = Exclude<AiAgentId, (typeof AGENT_IDENTITY_ROSTER_IDS)[number]>
const _agentRosterExhaustive: MissingFromAgentRoster extends never ? true : never = true
void _agentRosterExhaustive

const AGENT_IDENTITY_ROSTER_NAMES = [
  'Prevention Agent',
  'Deviation and Containment Agent',
  'Shift Handoff Agent',
  'Vision Reasoning Agent',
] as const

describe('AC-AI-015-7 — no agent initiates any of the four acts', () => {
  it('names the four acts the criterion names, and no others', () => {
    expect(STOP_ACTS).toEqual(['pause', 'resume', 'kill', 'rollback'])
    expect(lineAt(87_892)).toContain(
      'No agent can initiate a pause, a resume, a kill, or any rollback.',
    )
  })

  it('builds one identity column per roster agent, keyed on the agent and not on a role', () => {
    // A LITERAL LIST, DECLARED OUTSIDE THE MODULE, IN THE ROSTER'S OWN ORDER.
    // This asserted `toBeGreaterThan(0)` in the one place `src/ai/controls/
    // stop.ts` says a hand-assembled identity list "would be short by exactly
    // the agent nobody remembered" — so a silent loss of one stayed green, and
    // the Vision Reasoning Agent is precisely the one a build drops. The list
    // fails on a DELETION, on an ADDITION, and on a re-order, and `tsc` fails
    // too if a name stops being a member of the roster's own union.
    expect(AGENT_IDENTITY_COLUMNS.map((column) => column.header)).toEqual(
      AGENT_IDENTITY_ROSTER_NAMES,
    )
    // The id half, used at run time as well as by the `Exclude` check above —
    // so the roster's ids and its names both have to line up with this file.
    expect(AI_AGENT_ROSTER.map((agent) => agent.id)).toEqual([...AGENT_IDENTITY_ROSTER_IDS])
    for (const column of AGENT_IDENTITY_COLUMNS) {
      expect(column.kind).toBe('identity')
      expect(column.identitySourceRefs.length).toBeGreaterThan(0)
    }
  })

  it('reads that roster off the frozen source, one line per agent', () => {
    // The four rows of chapter 44's roster, counted from the header down. The
    // header is L91461, the separator L91462, and the data runs L91463-L91466.
    //
    // THE LINE AFTER THE LAST ROW IS ASSERTED NOT TO BE A TABLE ROW, so the
    // roster cannot run long — and that line is NOT cited by number here,
    // deliberately. It is blank, and a citation of a blank line is always wrong
    // because a blank line states nothing: `tests/coverage/locator-fidelity.
    // test.ts` convicts exactly that shape and it convicted this comment. The
    // boundary is stated relative to the last row instead, and the assertion
    // below is what actually establishes it.
    AGENT_IDENTITY_ROSTER_NAMES.forEach((name, index) => {
      expect(lineAt(91_463 + index), name).toContain(`| ${name} |`)
    })
    expect(lineAt(91_463 + AGENT_IDENTITY_ROSTER_NAMES.length).trim().startsWith('|')).toBe(false)
    // And every column's locator lands on the row that names it.
    for (const column of AGENT_IDENTITY_COLUMNS) {
      for (const ref of column.identitySourceRefs) {
        expect(lineAt(Number(ref.replace(/^L/, ''))), `${column.header} at ${ref}`).toContain(
          column.header,
        )
      }
    }
  })

  it('refuses every act from every identity, and audits every refusal', () => {
    // TEST-AI-015-7, L87904: "Attempt pause, resume, kill and rollback from
    // every agent identity; assert refusal and audit in every case."
    expect(lineAt(87_904)).toContain('assert refusal and audit in every case')
    expect(AGENT_INITIATION_REFUSALS).toHaveLength(
      STOP_ACTS.length * AGENT_IDENTITY_COLUMNS.length,
    )
    for (const refusal of AGENT_INITIATION_REFUSALS) {
      expect(isRefusal(refusal.decision), `${refusal.act} by ${refusal.identity.header}`).toBe(true)
      expect(permitsAction(refusal.decision)).toBe(false)
      expect(refusal.auditRecord).toContain(refusal.identity.header)
      expect(refusal.auditRecord).toContain(refusal.act)
    }
  })

  it('is the one place all four acts route through, and it declines a human session', () => {
    // A non-human identity's cell is answered from its own declared authority,
    // never from whoever happens to be looking at the screen (L99197). The
    // shared evaluator enforces that; this asserts the refusal goes through it.
    const [identity] = AGENT_IDENTITY_COLUMNS
    if (identity === undefined) throw new Error('no agent identity columns')
    for (const act of STOP_ACTS) {
      expect(isRefusal(refuseAgentInitiation(act, identity).decision)).toBe(true)
    }
  })
})

describe('the Frontline side of the pause — an abstention, stated', () => {
  /**
   * THE BRIEF ASSIGNS THIS CONFLICT TO TASK 14 AND THE DIFF DISCLOSED IT
   * NOWHERE. `AC-AI-015-4` (L87889) requires that "no surface renders silence".
   * `SB-AI-015`'s second clause (L87854), marked `Derived Clarification`, rules
   * the Frontline surface shows nothing at all about the pause. Both readings
   * are real and neither outranks the other on provenance; the canon already
   * holds all of it as `DEC-AIDISCLOSE-001`.
   *
   * A stated abstention and an oversight look identical from outside, which is
   * the whole reason this record exists rather than nothing. It POINTS at the
   * canon record — `src/disclosure/decisions.ts` is read-only to this task and
   * a second home for one decision is what `DecisionDisclosure` exists to
   * prevent — and says which half of the conflict this task builds.
   */
  it('names the conflict, both criteria, and the canon record that holds it', () => {
    expect(FRONTLINE_PAUSE_DISCLOSURE.decision).toBe('DEC-AIDISCLOSE-001')
    expect(FRONTLINE_PAUSE_DISCLOSURE.decision).toSatisfy((id: string) =>
      (OPEN_DECISION_IDS as readonly string[]).includes(id),
    )
    expect(FRONTLINE_PAUSE_DISCLOSURE.canonHome).toBe('src/disclosure/decisions.ts')
    // Both sides, each pinned to the line that carries it.
    expect(lineAt(87_889)).toContain('`AC-AI-015-4`')
    expect(lineAt(87_889)).toContain('no surface renders silence')
    expect(lineAt(87_854)).toContain('`SB-AI-015`')
    expect(lineAt(87_854)).toContain('Derived Clarification')
    for (const locator of FRONTLINE_PAUSE_DISCLOSURE.locators) {
      expect(lineAt(Number(locator.replace(/^L/, ''))), locator).not.toBe('')
    }
    expect(FRONTLINE_PAUSE_DISCLOSURE.locators).toContain('L87889')
    expect(FRONTLINE_PAUSE_DISCLOSURE.locators).toContain('L87854')
  })

  it('says what this task owns and what it does not, and adopts neither reading', () => {
    expect(FRONTLINE_PAUSE_DISCLOSURE.whatThisTaskOwns).toMatch(/Super Admin|platform console/i)
    expect(FRONTLINE_PAUSE_DISCLOSURE.whatThisTaskDoesNotOwn).toMatch(/Frontline/i)
    expect(FRONTLINE_PAUSE_DISCLOSURE.adopted).toMatch(/neither/i)
    // The one thing that IS settled, per L87826, is carried rather than lost.
    expect(lineAt(87_826)).toContain('the absence is shown as unavailability, not silence')
  })
})

describe('provenance', () => {
  it('emits exactly one class, and it is the deterministic-rule one', () => {
    expect(STOP_CONTROLS_PROVENANCE).toBe('PROV-4')
  })
})

function walk(root: string, own?: string): string[] {
  const out: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (isForeignProbe(entry, own)) continue
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) visit(path)
      else out.push(path)
    }
  }
  visit(join(process.cwd(), root))
  return out
}
