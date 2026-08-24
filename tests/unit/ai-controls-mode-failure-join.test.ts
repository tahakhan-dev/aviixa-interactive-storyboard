import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MODE_FAILURE_JOIN_INFERENCE,
  MODE_FAILURE_JOIN_PROVENANCE,
  PAUSE_MODE_FAILURE_PAIRS,
  PAUSE_SCOPES,
  joinModeToFailure,
  pauseJoins,
  pauseScopeOf,
} from '@/ai/join/mode-failure'

/**
 * THE MODE-TO-FAILURE JOIN — SHARED, BECAUSE FOUR PRIVATE COPIES IS THE SHAPE
 * `src/surfaces/cc/modules/cc-08/degradation.ts:601-612` WARNS ABOUT.
 *
 * The mode machine (§42.3, rows L89356-L89371) and the failure catalogue
 * (§43.2, L90122-L90756) never reference each other. Two of the sixteen modes
 * are pauses and two of the sixty failures are pauses, and no line of the
 * frozen source names a pause mode and a pause failure together. So the pairing
 * is a build inference under `APP-012`, and the thing that makes it checkable
 * rather than asserted is that BOTH SIDES name their own scope in their own
 * words — the mode row's name against the catalogue row's failure-mode cell.
 *
 * WHAT EACH CASE BELOW IS FOR:
 *
 *   1. A JOIN THAT ALWAYS ANSWERS. `pauseScopeOf` returns `null` for a sentence
 *      naming no scope AND for one naming both, because a resolver that always
 *      answers is how "per tenant" becomes "platform-wide" on a screen a tenant
 *      reads.
 *   2. A PAIR WHOSE HALVES DISAGREE. `joinModeToFailure` throws rather than
 *      rendering a guess. `AC-42-303` (L89400-L89412) is the criterion: a
 *      paused platform and a paused tenant call for different human responses.
 *   3. TWO ROWS LANDING ON ONE SCOPE. Two pause states with one scope means one
 *      screen for both, which is the same defect by another route.
 *   4. THE INFERENCE GOING UNSAID. The build's reading is carried as text and
 *      rendered, never silent.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const SOURCE_SHA256 = '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
const sourceBytes = readFileSync(SOURCE_PATH)
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceBytes.toString('utf8').split('\n'),
)
const lineAt = (n: number): string => sourceLines[n - 1] ?? ''

describe('the frozen source this join was measured against', () => {
  it('is the bytes every locator below names', () => {
    expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(SOURCE_SHA256)
    expect(sourceLines).toHaveLength(122_241)
  })
})

describe('the two scopes, in the source own two words', () => {
  it('is a literal list, and both words are the source\'s', () => {
    expect(PAUSE_SCOPES).toEqual(['platform-wide', 'per tenant'])
    // L87785 names both scopes in one sentence; L87821 names them as the
    // choice made at initiation.
    expect(lineAt(87_785)).toContain('platform-wide, or per tenant')
    expect(lineAt(87_821)).toContain('per tenant or platform-wide')
  })

  it('resolves a scope only where exactly one is named', () => {
    expect(pauseScopeOf('Platform suspension')).toBe('platform-wide')
    expect(pauseScopeOf('Tenant suspension')).toBe('per tenant')
    expect(pauseScopeOf('Emergency pause, platform-wide')).toBe('platform-wide')
    expect(pauseScopeOf('Emergency pause, per tenant')).toBe('per tenant')
  })

  it('answers null rather than guessing — for neither named, and for both', () => {
    expect(pauseScopeOf('Artificial-intelligence-unavailable')).toBeNull()
    expect(pauseScopeOf('The pause is platform-wide or per tenant')).toBeNull()
  })
})

describe('the pause pairs, joined on the scope each half states for itself', () => {
  it('pairs the two pause modes with the two pause failures, and nothing else', () => {
    // A literal list declared here, outside the module. It fails on an added
    // pair, a removed one and a re-keyed one.
    expect(PAUSE_MODE_FAILURE_PAIRS.map((p) => [p.modeId, p.failureId])).toEqual([
      ['AIMODE-14', 'FAIL-AI-41'],
      ['AIMODE-13', 'FAIL-AI-42'],
    ])
  })

  it('resolves each pair to one scope, taken from both halves agreeing', () => {
    const joins = pauseJoins()
    expect(joins.map((j) => j.scope)).toEqual(['platform-wide', 'per tenant'])
    for (const join_ of joins) {
      expect(pauseScopeOf(join_.mode.name)).toBe(join_.scope)
      expect(pauseScopeOf(join_.failure.cells.failureMode)).toBe(join_.scope)
    }
  })

  it('carries the Frontline chip text and the tenant message from the two records, never re-spelled', () => {
    const [platform, tenant] = pauseJoins()
    // Both modes carry the SAME worker label, and that is the source's doing:
    // matrix rows L89368 and L89369 are byte-identical in that column.
    expect(platform?.frontlineChipText).toBe('Live coaching paused by the platform')
    expect(tenant?.frontlineChipText).toBe('Live coaching paused by the platform')
    expect(lineAt(89_368)).toContain('Live coaching paused by the platform')
    expect(lineAt(89_369)).toContain('Live coaching paused by the platform')
    // The operational bands DIFFER, which is what separates the two rows.
    expect(platform?.operationalSeverity).toBe('Critical')
    expect(tenant?.operationalSeverity).toBe('Major')
    expect(platform?.tenantWebMessage).not.toBe(tenant?.tenantWebMessage)
  })

  it('refuses a pair whose two halves disagree about scope', () => {
    // AIMODE-14 is platform-wide; FAIL-AI-42 is per tenant. A join that
    // rendered this would put a tenant message under a platform pause.
    expect(() => joinModeToFailure('AIMODE-14', 'FAIL-AI-42')).toThrow(/scope/i)
  })

  it('refuses a pair where either half names no scope at all', () => {
    // AIMODE-03 "Online and unavailable" names neither scope, so there is
    // nothing to agree with and the join declines rather than picking.
    expect(() => joinModeToFailure('AIMODE-03', 'FAIL-AI-41')).toThrow(/scope/i)
  })

  it('states the inference rather than presenting the pairing as the source\'s', () => {
    expect(MODE_FAILURE_JOIN_INFERENCE).toMatch(/APP-012/)
    expect(MODE_FAILURE_JOIN_INFERENCE).toMatch(/build inference|not the source/i)
  })
})

describe('provenance', () => {
  it('emits exactly one class, and it is the deterministic-rule one', () => {
    expect(MODE_FAILURE_JOIN_PROVENANCE).toBe('PROV-4')
  })
})
