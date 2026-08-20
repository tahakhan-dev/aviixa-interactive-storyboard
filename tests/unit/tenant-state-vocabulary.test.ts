import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { TENANT_STATES } from '@/surfaces/doh/tenant-state'
import { TENANT_STATE_LABEL, TENANT_STATE_OPTIONS } from '@/ui/doh/tenant-state-vocabulary'

/**
 * `TENANT_STATE_OPTIONS` is the ONE place a `Select`'s option list for a
 * tenant state is built. Nine Hub screens used to each build their own copy
 * with `label: s` — the raw token (`compliance-suspended`) instead of the
 * label (`Suspended — compliance`) — and one of the nine had already been
 * fixed in isolation, so the pill read a sentence on that screen and a
 * database token on the other eight. The fix moved the map into
 * `src/ui/doh/tenant-state-vocabulary.ts`; every screen now imports it.
 */
describe('TENANT_STATE_OPTIONS — the one place the Select list is built', () => {
  it('labels every tenant state through TENANT_STATE_LABEL, never the raw token', () => {
    expect(TENANT_STATE_OPTIONS.length).toBe(TENANT_STATES.length)
    for (const opt of TENANT_STATE_OPTIONS) {
      expect(opt.label, opt.value).toBe(TENANT_STATE_LABEL[opt.value as keyof typeof TENANT_STATE_LABEL])
      expect(opt.label, opt.value).not.toBe(opt.value)
    }
  })

  /**
   * A derived guard, not a hand-written file list — the same shape
   * `tests/e2e/exported-routes.ts` uses and the same shape its own comment
   * warns a hand list eventually falls behind. This walks every `.tsx`
   * under `app/`, the moment a tenth screen is added it is covered with no
   * edit here, and it fails on the exact source shape that shipped the
   * defect: `TENANT_STATES.map((x) => ({ value: x, label: x }))`, under any
   * loop-variable name.
   */
  it('no screen rebuilds the tenant-state option list locally with the raw token as the label', () => {
    const rawPattern = /TENANT_STATES\.map\(\s*\(\s*(\w+)\s*\)\s*=>\s*\(\{\s*value:\s*\1\s*,\s*label:\s*\1\s*\}\)\s*\)/

    const offenders: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
        } else if (full.endsWith('.tsx')) {
          const src = readFileSync(full, 'utf8')
          if (rawPattern.test(src)) offenders.push(full)
        }
      }
    }
    walk('app')

    expect(offenders).toEqual([])
  })
})
