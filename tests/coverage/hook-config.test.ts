/**
 * THE HOOK CONFIGURATION GATE.
 *
 * The wiring that makes the knowledge graph automatic lives one directory ABOVE
 * this repository — `Ron-project1/CLAUDE.md` and `Ron-project1/.claude/settings.json`
 * — because that is where Claude Code sessions run. That directory is not a git
 * repository, so the live configuration has no history and does not travel with
 * a clone.
 *
 * `docs/process/claude-hooks/` holds committed copies so it is recoverable. A
 * copy that drifts from the live file is worse than no copy at all, because it
 * looks authoritative while being wrong — someone restores from it and gets
 * yesterday's wiring. This is what stops that.
 *
 * WHY THE ABSENCE OF THE LIVE FILES IS NOT A FAILURE. On a fresh clone, or in
 * CI, the parent directory holds nothing. There is nothing to have drifted from,
 * and failing there would make the suite red for a reason nobody caused — which
 * is how a check gets deleted. The copies are simply asserted to be complete and
 * self-consistent instead.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = process.cwd()
const COPIES = join(ROOT, 'docs', 'process', 'claude-hooks')
const LIVE_DIR = resolve(ROOT, '..')

const REPO_DIR = 'AVIIXA_Interactive_Storyboard'

interface HookEntry {
  readonly matcher?: string
  readonly hooks: readonly { readonly type: string; readonly command: string }[]
}
interface Settings {
  readonly hooks: Readonly<Record<string, readonly HookEntry[]>>
}

const committedSettings = JSON.parse(readFileSync(join(COPIES, 'settings.json'), 'utf8')) as Settings
const committedClaudeMd = readFileSync(join(COPIES, 'CLAUDE.md'), 'utf8')

const allCommands = Object.values(committedSettings.hooks)
  .flat()
  .flatMap((entry) => entry.hooks.map((h) => h.command))

describe('the committed hook configuration is complete', () => {
  it('registers the guards and the updater', () => {
    // Non-vacuity first: an empty hooks object would satisfy every assertion
    // below about what the commands contain.
    expect(Object.keys(committedSettings.hooks).sort()).toEqual(['PreToolUse', 'Stop'])
    expect(committedSettings.hooks.PreToolUse?.length, 'PreToolUse guards').toBe(2)
    expect(committedSettings.hooks.Stop?.length, 'Stop hooks').toBe(1)
    expect(allCommands.length).toBe(3)
  })

  it('every command changes into the repository first', () => {
    /*
     * graphify resolves `graphify-out/` relative to the working directory, and
     * sessions run from the PARENT of this repo. Without the `cd` the guards
     * find no graph and emit nothing at all — they do not error, they simply go
     * quiet, which is the worst way for a guard to be wrong. This was observed
     * before the `cd` was added.
     */
    for (const command of allCommands) {
      expect(command, `command must cd into ${REPO_DIR}`).toContain(REPO_DIR)
      expect(command.indexOf('cd '), 'the cd must come first').toBe(0)
    }
  })

  it('the Stop hook runs the project updater, never `graphify update`', () => {
    /*
     * `graphify update .` rebuilds from the CODE corpus and writes that as the
     * whole graph. Run once against this project it replaced 29,498 nodes with
     * 6,849 and discarded every blueprint node, reporting success. It must never
     * reach this configuration.
     */
    const stop = committedSettings.hooks.Stop?.[0]?.hooks?.[0]?.command ?? ''
    expect(stop).toContain('scripts/graph-update.mjs')
    for (const command of allCommands) {
      expect(command, 'no hook may run `graphify update`').not.toMatch(/graphify\s+update\b/)
    }
  })

  it('CLAUDE.md carries the rules the graph depends on', () => {
    // Each of these is a rule this build paid for. A CLAUDE.md that quietly
    // loses one is a CLAUDE.md that stops protecting anything.
    expect(committedClaudeMd, 'the graph must not outrank the blueprint').toMatch(
      /never outranks the blueprint/i,
    )
    expect(committedClaudeMd, 'citations go to the blueprint').toMatch(/cite the blueprint/i)
    expect(committedClaudeMd, 'the destructive command must be warned against').toMatch(
      /Never run `graphify update \.`/i,
    )
  })
})

describe('the committed copies match the live configuration', () => {
  const liveSettings = join(LIVE_DIR, '.claude', 'settings.json')
  const liveClaudeMd = join(LIVE_DIR, 'CLAUDE.md')
  const bothPresent = existsSync(liveSettings) && existsSync(liveClaudeMd)

  it.runIf(bothPresent)('settings.json has not drifted', () => {
    expect(
      JSON.parse(readFileSync(liveSettings, 'utf8')),
      'live .claude/settings.json differs from the committed copy — ' +
        're-copy it into docs/process/claude-hooks/ so the recovery instructions stay true',
    ).toEqual(committedSettings)
  })

  it.runIf(bothPresent)('CLAUDE.md has not drifted', () => {
    expect(
      readFileSync(liveClaudeMd, 'utf8'),
      'live CLAUDE.md differs from the committed copy — re-copy it into ' +
        'docs/process/claude-hooks/ so the recovery instructions stay true',
    ).toBe(committedClaudeMd)
  })

  it('says plainly when it could not compare', () => {
    // Not a skip in disguise. If the live files are absent the suite should say
    // so out loud rather than pass in silence and let someone believe the
    // comparison happened.
    if (!bothPresent) {
      console.error(
        '[hook-config] live configuration not present at ' +
          `${LIVE_DIR} — drift was NOT checked; the committed copies were only ` +
          'checked for internal completeness.',
      )
    }
    expect(true).toBe(true)
  })
})
