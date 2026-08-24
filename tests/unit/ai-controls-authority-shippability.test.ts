import { describe, expect, it } from 'vitest'
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
 *   4. SHIPPABILITY COMPUTED AT A CALL SITE. Swept: no file outside the module
 *      re-derives it from `undecidedCells`, `permissiveCellsDeferring` or
 *      `citedDecisions`. One input, one answer.
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

  it('ships the two pause scopes the source grants, and the rollback row', () => {
    // The counterweight to the five. A panel that refused everything would say
    // nothing about authority, and `AC-43-353` is a claim about granted rows.
    for (const id of [
      'per-tenant-emergency-pause',
      'platform-wide-emergency-pause',
      'rollback-of-a-model-atom-agent-or-package-version',
      'resume-a-paused-scope',
    ]) {
      expect(consoleAuthorityRow(id).shippable, id).toBe(true)
    }
  })
})

describe('shippability is derived once, at the single input', () => {
  it('is re-derived at no call site anywhere in src/ or app/', () => {
    const offenders: string[] = []
    for (const file of walk('src').concat(walk('app'))) {
      if (file.endsWith(join('surfaces', 'sa', 'ai-failure-authority.ts'))) continue
      if (!/\.tsx?$/.test(file)) continue
      const text = readFileSync(file, 'utf8')
      if (/undecidedCells|permissiveCellsDeferring|undecidedInClassification/.test(text)) {
        offenders.push(file)
      }
    }
    expect(offenders, 'shippability re-derived away from its single input').toEqual([])
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
