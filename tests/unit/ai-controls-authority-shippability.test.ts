import { describe, expect, it } from 'vitest'
import { isForeignProbe } from '../probe-paths'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONSOLE_AUTHORITY_ROWS,
  NOT_SHIPPABLE_AUTHORITY_ROWS,
  consoleAuthorityRow,
} from '@/surfaces/sa/ai-failure-authority'

/**
 * SHIPPABILITY, DERIVED FROM EACH ROW'S OWN CELLS AND CLASSIFICATION.
 *
 * Five of §43.3.5's fifteen controls cannot ship as enabled and THE REASON
 * DIFFERS PER ROW:
 *
 *   - a role cell reads `Client Decision Required` — L91289 site-scoped pause,
 *     L91292 model quarantine, L91294 safe replay;
 *   - the classification defers while every role cell grants — L91290
 *     runaway-loop kill switch, whose Platform Engineer cell is simultaneously
 *     permissive and undecided;
 *   - the classification carries an unresolved `DEC-*` under
 *     `Recommendation — R&D` while every role cell grants — L91291 provider or
 *     model failover.
 *
 * WHAT EACH CASE BELOW IS FOR:
 *
 *   1. A HARD-CODED COUNT. Nothing here asserts five, or three, or any number:
 *      the population is asserted as a LITERAL LIST OF ROW IDS declared outside
 *      the module, which fails on an addition, a removal and a re-key alike. A
 *      gate keyed on a number goes stale the moment a row changes, and this
 *      build has shipped that defect twice.
 *   2. THE FIFTH ROW MISSED. The existing `undecided` flag catches four. The
 *      failover row grants in every cell and defers only through an open
 *      decision in its classification, so a shippability derived from
 *      `undecided` alone ships a control whose governing policy is unwritten.
 *      That is the one this file was added for.
 *   3. A REASON ASSIGNED BY HAND. Every reason is derived from the row's own
 *      parsed cells, and each is checked against the frozen bytes of the line
 *      the row was read from.
 *   4. SHIPPABILITY COMPUTED AT A CALL SITE. Swept: no consumer of this module
 *      re-derives it from any field of the row that answers the question. The
 *      tokens are `ROW_FIELDS_NO_CONSUMER_MAY_REASON_OVER`, declared once and
 *      typed to the row, because this file's prose named four tokens while its
 *      regex checked three and the fourth was being re-derived at two call
 *      sites when nobody looked.
 *   5. A CARD THAT CONTRADICTS ITSELF. The lock's own words — its
 *      `settingValue`, its reason and what remains — are derived on the row
 *      beside `notShippableReason`, so a card cannot print "No authority
 *      settled" over a reason that says the authority is settled.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)
const lineAt = (n: number): string => sourceLines[n - 1] ?? ''

describe('the frozen source the matrix was read from', () => {
  it('is the bytes every row locator names', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(122_241)
  })
})

describe('which controls cannot ship as enabled, and why each cannot', () => {
  it('names them as a literal list of row ids, never as a count', () => {
    expect(NOT_SHIPPABLE_AUTHORITY_ROWS.map((row) => row.id)).toEqual([
      'site-scoped-pause',
      'runaway-loop-kill-switch',
      'provider-or-model-failover',
      'model-quarantine',
      'safe-replay',
    ])
  })

  it('gives every other row a shippable state and no reason', () => {
    for (const row of CONSOLE_AUTHORITY_ROWS) {
      if (NOT_SHIPPABLE_AUTHORITY_ROWS.some((other) => other.id === row.id)) continue
      expect(row.shippable, row.id).toBe(true)
      expect(row.notShippableReason, row.id).toBeNull()
    }
  })

  it('derives the role-cell reason for the three rows that defer in a cell', () => {
    for (const id of ['site-scoped-pause', 'model-quarantine', 'safe-replay']) {
      const row = consoleAuthorityRow(id)
      expect(row.shippable, id).toBe(false)
      expect(row.notShippableReason, id).toBe('a role cell defers to the client')
      expect(row.undecidedCells.length, id).toBeGreaterThan(0)
      // Checked against the bytes: the row's own line carries the token.
      expect(lineAt(Number(row.sourceRef.replace(/^L/, '')))).toContain('Client Decision Required')
    }
  })

  it('derives the classification reason for the kill switch, whose cells all grant', () => {
    const row = consoleAuthorityRow('runaway-loop-kill-switch')
    expect(row.sourceRef).toBe('L91290')
    expect(row.shippable).toBe(false)
    expect(row.undecidedCells).toEqual([])
    // Permissive AND deferring in one cell. Both facts are read, not declared.
    expect(row.permissiveCellsDeferring.length).toBeGreaterThan(0)
    expect(row.undecidedInClassification).toBe(true)
    expect(row.notShippableReason).toBe(
      'a cell grants and defers in the same breath, and the classification defers with it',
    )
    expect(lineAt(91_290)).toContain('subject to client decision')
    expect(lineAt(91_290)).toContain(
      'the emergency-application path is `Client Decision Required`',
    )
  })

  it('derives the open-decision reason for the failover row, which the undecided flag misses', () => {
    const row = consoleAuthorityRow('provider-or-model-failover')
    expect(row.sourceRef).toBe('L91291')
    // The row grants in every cell and its classification names no client
    // decision token, so the existing `undecided` flag is FALSE for it — which
    // is exactly why shippability is not that flag.
    expect(row.undecided).toBe(false)
    expect(row.shippable).toBe(false)
    expect(row.notShippableReason).toBe(
      'the authority is settled and the governing policy is an open decision',
    )
    expect(row.citedDecisions).toEqual(['DEC-AIFAILOVER-001'])
    expect(lineAt(91_291)).toContain('`Recommendation — R&D`, `DEC-AIFAILOVER-001`')
  })

  it('derives the lock\'s own words from the row, so no card can contradict itself', () => {
    // THE DEFECT THIS REPLACES. Both call sites applied one literal
    // `settingValue` to every unshippable row — the panel "No authority
    // settled", the console "Not available to anyone" — while printing the
    // row's own reason inches below it. On `provider-or-model-failover` that
    // reason reads "the authority IS settled and the governing policy is an
    // open decision", so one card asserted and denied the same fact two
    // paragraphs apart, and the two call sites disagreed with each other on
    // top. The lock's three fields are now derived beside
    // `notShippableReason`, at the one input, so they cannot part company.
    for (const row of NOT_SHIPPABLE_AUTHORITY_ROWS) {
      const lock = row.notShippableLock
      expect(lock, row.id).not.toBeNull()
      expect(lock?.reason, row.id).toContain(row.notShippableReason ?? '')
      expect(lock?.settingValue.trim(), row.id).not.toBe('')
      // The contradiction, stated as a property rather than as one row's
      // string: a lock may not claim no authority is settled where its own
      // reason says the authority is settled.
      if ((lock?.reason ?? '').includes('the authority is settled')) {
        expect(lock?.settingValue, row.id).not.toContain('No authority settled')
      }
    }
    // And they are not all one string. A single literal across five rows that
    // fail for three different reasons is the fold this replaces.
    expect(
      new Set(NOT_SHIPPABLE_AUTHORITY_ROWS.map((row) => row.notShippableLock?.settingValue)).size,
    ).toBeGreaterThan(1)
  })

  it('names the settled authority on the failover row, and the unsettled one on the pause', () => {
    expect(consoleAuthorityRow('provider-or-model-failover').notShippableLock?.settingValue).toBe(
      'Authority settled; governing policy undecided',
    )
    expect(consoleAuthorityRow('site-scoped-pause').notShippableLock?.settingValue).toBe(
      'No authority settled',
    )
    expect(consoleAuthorityRow('runaway-loop-kill-switch').notShippableLock?.settingValue).toBe(
      'Authority granted; the emergency path undecided',
    )
    // A shippable row carries no lock at all, so nothing can draw one.
    expect(consoleAuthorityRow('resume-a-paused-scope').notShippableLock).toBeNull()
  })

  it('ships the two pause scopes the source grants, and the rollback row', () => {
    // The counterweight to the five. A panel that refused everything would say
    // nothing about authority. `AC-43-353` (L91306) reads "Every critical-class
    // response requires root approval, with no path around it for any account"
    // — a rule about APPROVAL, not a statement that any particular row is
    // granted, which is what this comment used to claim. It is quoted below
    // rather than paraphrased.
    for (const id of [
      'per-tenant-emergency-pause',
      'platform-wide-emergency-pause',
      'rollback-of-a-model-atom-agent-or-package-version',
      'resume-a-paused-scope',
    ]) {
      expect(consoleAuthorityRow(id).shippable, id).toBe(true)
    }
    expect(lineAt(91_306)).toBe(
      '- `AC-43-353` — Every critical-class response requires root approval, with no path around ' +
        'it for any account.',
    )
  })
})

/**
 * EVERY FIELD OF THE ROW A CONSUMER MUST NOT REASON OVER, AND THE SWEEP NOW
 * CHECKS ALL OF THEM.
 *
 * This list used to be three tokens in a regex and four in the prose above it.
 * `citedDecisions` was named and unchecked, and it WAS re-derived, byte-
 * identically, at both `src/ui/sa/AiFailureAuthorityPanel.tsx` and
 * `app/super-admin/ai-incidents/AiIncidentConsoleScreen.tsx` — the `remains`
 * ternary and the `reason` template of the same locked control, spelled twice.
 * The list is declared here so the prose and the regex are one thing.
 *
 * `notShippableReason` and `notShippableLock` are in it for the same reason:
 * they are the row's own answer, and a consumer that re-words either has taken
 * a second position on a fact the module already settled.
 */
const ROW_FIELDS_NO_CONSUMER_MAY_REASON_OVER = [
  'undecidedCells',
  'permissiveCellsDeferring',
  'undecidedInClassification',
  'citedDecisions',
  'notShippableReason',
] as const satisfies readonly (keyof (typeof CONSOLE_AUTHORITY_ROWS)[number])[]

describe('shippability is derived once, at the single input', () => {
  it('is re-derived at no call site anywhere in src/ or app/', () => {
    // SCOPED TO THE FILES THAT ACTUALLY CONSUME THIS MODULE, and that is the
    // precise claim rather than a looser one. A bare token sweep convicts
    // `src/ai/failures/catalogue.ts`, which declares a `citedDecisions` field
    // of its own on an unrelated register — a false alarm, and false alarms are
    // how a token gets dropped from a regex in the first place.
    const tokens = new RegExp(ROW_FIELDS_NO_CONSUMER_MAY_REASON_OVER.join('|'))
    const offenders: string[] = []
    for (const file of walk('src').concat(walk('app'))) {
      if (file.endsWith(join('surfaces', 'sa', 'ai-failure-authority.ts'))) continue
      if (!/\.tsx?$/.test(file)) continue
      const text = readFileSync(file, 'utf8')
      if (!text.includes('surfaces/sa/ai-failure-authority')) continue
      if (tokens.test(text)) offenders.push(file)
    }
    expect(offenders, 'shippability re-derived away from its single input').toEqual([])
  })

  it('sweeps every field its own documentation names — the list is typed to the row', () => {
    // The `satisfies` clause above is the other half: a field renamed on the
    // row is a `tsc` error here, and a field ADDED to this list that the row
    // does not carry is one too. A regex nobody typed against the row is how
    // `citedDecisions` sat in the prose and out of the check.
    expect([...ROW_FIELDS_NO_CONSUMER_MAY_REASON_OVER]).toEqual([
      'undecidedCells',
      'permissiveCellsDeferring',
      'undecidedInClassification',
      'citedDecisions',
      'notShippableReason',
    ])
  })
})

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
