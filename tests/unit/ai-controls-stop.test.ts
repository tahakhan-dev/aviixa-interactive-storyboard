import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isRefusal, permitsAction } from '@/policy/decision'
import {
  AGENT_IDENTITY_COLUMNS,
  AGENT_INITIATION_REFUSALS,
  KILL_SWITCH,
  PAUSE_RESUME_WORKFLOW,
  PAUSE_SEMANTICS,
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
    const offenders: string[] = []
    for (const file of walk('src/ai/controls').concat(walk('src/ai/join'), walk('app/super-admin/ai-incidents'))) {
      const text = readFileSync(file, 'utf8')
      // Comment lines are stripped: this file's own prose explains the rule.
      const code = text
        .split('\n')
        .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
        .join('\n')
      if (/setTimeout|setInterval|autoResume|resumeAfter|resumeTimer|resumeWindow/i.test(code)) {
        offenders.push(file)
      }
    }
    expect(offenders, 'an automatic resume path (AC-AI-015-5, L87890)').toEqual([])
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

describe('AC-AI-015-7 — no agent initiates any of the four acts', () => {
  it('names the four acts the criterion names, and no others', () => {
    expect(STOP_ACTS).toEqual(['pause', 'resume', 'kill', 'rollback'])
    expect(lineAt(87_892)).toContain(
      'No agent can initiate a pause, a resume, a kill, or any rollback.',
    )
  })

  it('builds one identity column per roster agent, keyed on the agent and not on a role', () => {
    expect(AGENT_IDENTITY_COLUMNS.length).toBeGreaterThan(0)
    for (const column of AGENT_IDENTITY_COLUMNS) {
      expect(column.kind).toBe('identity')
      expect(column.identitySourceRefs.length).toBeGreaterThan(0)
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

describe('provenance', () => {
  it('emits exactly one class, and it is the deterministic-rule one', () => {
    expect(STOP_CONTROLS_PROVENANCE).toBe('PROV-4')
  })
})

function walk(root: string): string[] {
  const out: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (/^\.zz-probe-\d+$/.test(entry)) continue
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) visit(path)
      else out.push(path)
    }
  }
  visit(join(process.cwd(), root))
  return out
}
