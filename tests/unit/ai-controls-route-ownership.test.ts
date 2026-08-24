import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * THE INCIDENT ROUTE IS OWNED BY NO MODULE, AND ITS OWN FILES MUST NOT SAY
 * OTHERWISE.
 *
 * ── WHY THIS GATE EXISTS, AND IT IS NOT A STYLE RULE ──────────────────────
 * `scripts/build-registries.mjs` walks each route directory, counts every
 * `MOD-*` identifier mentioned in its files, and reads the winner as that
 * route's OWNER. A mention in a cross-reference is indistinguishable, to that
 * scan, from a mention claiming ownership — the script's own comment says so:
 * "a mention can be a cross-reference in a sentence, while an import is the
 * screen actually mounting the thing."
 *
 * This route is claimed by no module identifier anywhere in the frozen source.
 * A first draft of its two files named one module in a FEATURE cross-reference
 * and another in a sentence refusing to mint it — one mention each — and the
 * registry build threw on the tie. Resolving that tie either way would have
 * handed the route to a module that does not own it, which is the
 * identifier-by-proximity trap the authority matrix's attribution paragraph
 * already exists to warn about.
 *
 * So the rule is: no `MOD-*` literal in this directory. The reader still sees
 * the source-attributed module identifier for the pause FEATURE — it is
 * rendered from `PAUSE_FEATURE_ATTRIBUTION` in `src/ai/controls/decisions.ts`,
 * where the claim and its line live together.
 *
 * The pattern below is the SCRIPT'S OWN, copied deliberately: a gate that
 * matched a different shape would be green on a mention the build still throws
 * on.
 */

const ROUTE_DIR = join(process.cwd(), 'app/super-admin/ai-incidents')

/** The exact expression `scripts/build-registries.mjs` counts mentions with. */
const MODULE_TOKEN = /MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g

describe('the incident route claims no module', () => {
  it('names no MOD-* identifier in any file of its own directory', () => {
    const offenders: string[] = []
    for (const entry of readdirSync(ROUTE_DIR, { withFileTypes: true })) {
      if (entry.isDirectory()) continue
      if (!/\.tsx?$/.test(entry.name)) continue
      const text = readFileSync(join(ROUTE_DIR, entry.name), 'utf8')
      for (const token of text.match(MODULE_TOKEN) ?? []) {
        offenders.push(`${entry.name}: ${token}`)
      }
    }
    expect(offenders, 'a module identifier read as ownership of an unowned route').toEqual([])
  })

  it('still shows a reader the pause feature\'s source-attributed module, from the record', () => {
    // The counterweight. A gate that only forbade the literal could be
    // satisfied by deleting the disclosure, which would lose a real
    // source-attributed claim. This asserts the screen reaches the record
    // instead.
    const screen = readFileSync(join(ROUTE_DIR, 'AiIncidentConsoleScreen.tsx'), 'utf8')
    expect(screen).toContain('PAUSE_FEATURE_ATTRIBUTION.module')
    expect(screen).toContain('PAUSE_FEATURE_ATTRIBUTION.whatItDoesNotLicense')
  })
})
