import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import {
  AGREED_TOKENS,
  CONTESTED_TOKENS,
  FL_DESTINATIONS,
  FL_OVERLAY_ON_ANY_DESTINATION,
  FL_PLAYER_VIEWS,
  SCR_FL_NAMESPACE_RULING,
  S227_ROW_COUNT,
  flDestinationBySlug,
  frontlinePathname,
} from '@/frontline/screens'
import { routeBySurface } from '@/routes/definitions'

/* ==================================================================== *
 * RULING FL-1 — the `SCR-FL-*` namespace.
 * ==================================================================== */

describe('the two screen registers, and the ruling over them', () => {
  // FAILS IF: a destination is dropped or a seventh is minted. The expectation
  // is the SOURCE's own assertion — "exactly six destinations" is stated at
  // L40045, L48689 and L48698 — not a count taken off the array under test.
  it('carries exactly six destinations', () => {
    expect(FL_DESTINATIONS).toHaveLength(6)
  })

  // FAILS IF: the twenty-three-row register stops adding up. Three
  // independently transcribed groups — six destinations, seventeen views,
  // one overlay — against the count the source asserts twice (L39956,
  // L40057). A row moved from one group to another leaves this green; a row
  // lost from all three does not.
  it('accounts for all twenty-three rows of the other register', () => {
    expect(S227_ROW_COUNT).toBe(23)
    expect(FL_PLAYER_VIEWS).toHaveLength(17)
    expect(FL_OVERLAY_ON_ANY_DESTINATION.placement).toBe('overlay')
  })

  // FAILS IF: the number of disagreeing tokens changes. Five of six is the
  // plan's own measured finding and it is re-derived here from the records.
  it('finds five of the six shared identifiers naming different screens', () => {
    expect(CONTESTED_TOKENS).toHaveLength(5)
    expect(AGREED_TOKENS).toHaveLength(1)
    expect(AGREED_TOKENS[0]?.token).toBe('SCR-FL-01')
  })

  // FAILS IF: a token is recorded with one reading, or with a reading that
  // does not carry a locator. There is deliberately no field in which a
  // single reading could be the answer, and this is the runtime half of that.
  it('carries both readings and both locators on every shared identifier', () => {
    for (const d of FL_DESTINATIONS) {
      const c = d.contested
      expect(c.registerA.length, c.token).toBeGreaterThan(0)
      expect(c.registerB.length, c.token).toBeGreaterThan(0)
      expect(c.registerARef, c.token).toMatch(/^L4\d{4}$/)
      expect(c.registerBRef, c.token).toMatch(/^L3\d{4}$/)
      const reason = c.agreement.agree ? c.agreement.why : c.agreement.whatEachNames
      expect(reason.length, `${c.token} states no reason for its agreement verdict`).toBeGreaterThan(60)
    }
  })

  // FAILS IF: the two registers' locators drift apart, which is how a
  // citation stops pointing at the line that carries the claim. §25.5's six
  // rows run L48529-L48534 in order; §22.7's first six run L39863-L39868.
  it('cites consecutive data lines in each register, in register order', () => {
    expect(FL_DESTINATIONS.map((d) => d.contested.registerARef)).toEqual([
      'L48529',
      'L48530',
      'L48531',
      'L48532',
      'L48533',
      'L48534',
    ])
    expect(FL_DESTINATIONS.map((d) => d.contested.registerBRef)).toEqual([
      'L39863',
      'L39864',
      'L39865',
      'L39866',
      'L39867',
      'L39868',
    ])
  })

  // FAILS IF: the ruling stops naming the delegation. The client delegated
  // the decision, not the pretence that the source settled it, and a ruling
  // that says only "we picked B" is the quiet pick this record exists to
  // prevent.
  it('records the ruling as a delegated choice, never as a source finding', () => {
    expect(SCR_FL_NAMESPACE_RULING.delegation).toMatch(/client-delegated/i)
    expect(SCR_FL_NAMESPACE_RULING.readings).toHaveLength(2)
    expect(SCR_FL_NAMESPACE_RULING.sourceRef).toMatch(/No DEC-\* identifier is attached/)
    for (const r of SCR_FL_NAMESPACE_RULING.readings) {
      expect(r.locator, r.label).toMatch(/L\d{5}/)
    }
  })
})

/* ==================================================================== *
 * NO IDENTIFIER IS A ROUTE KEY.
 * ==================================================================== */

const APP_FRONTLINE = join('app', 'frontline')

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (isForeignProbe(e)) continue
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.tsx?$/.test(full)) acc.push(full)
  }
  return acc
}

describe('routes are keyed on names, never on screen identifiers', () => {
  // FAILS IF: a slug is spelled as an identifier, or a route directory named
  // after one appears. A three-digit or `SCR-FL-NN` path segment is the
  // defect the ruling exists to stop.
  it('has no route directory named after a screen identifier', () => {
    // A CONCURRENT suite's scratch probe is not a route. Without this skip the
    // walk lists one and then ENOENTs on it the moment that suite's `finally`
    // removes it -- a correct tree failing on a race rather than on a finding.
    const dirs = readdirSync(APP_FRONTLINE).filter(
      (e) => !isForeignProbe(e) && statSync(join(APP_FRONTLINE, e)).isDirectory(),
    )
    expect(dirs.length).toBeGreaterThan(0)
    for (const d of dirs) expect(d, d).not.toMatch(/SCR-FL/i)
    for (const d of FL_DESTINATIONS) expect(d.slug).not.toMatch(/SCR-FL/i)
  })

  // FAILS IF: a route directory exists that no destination declares, or a
  // destination declares one that was never built. Derived from the tree and
  // from the register, so neither can drift alone.
  it('builds exactly one route directory per declared destination', () => {
    // Same skip, and it matters more here: this is a SET EQUALITY against the
    // declared destinations, so a probe present for a few milliseconds would
    // not merely be listed -- it would read as a route nobody declared.
    const dirs = readdirSync(APP_FRONTLINE)
      .filter((e) => !isForeignProbe(e) && statSync(join(APP_FRONTLINE, e)).isDirectory())
      .sort()
    expect(dirs).toEqual([...FL_DESTINATIONS.map((d) => d.slug)].sort())
    for (const slug of FL_DESTINATIONS.map((d) => d.slug)) {
      expect(readdirSync(join(APP_FRONTLINE, slug)), slug).toContain('page.tsx')
    }
  })

  // FAILS IF: the surface index becomes worker-facing. AC-FL-010-1 (L40045)
  // counts destinations a worker can stand in; a link back from a
  // destination to the index makes the count seven.
  it('never links back to the surface index from a destination', () => {
    for (const d of FL_DESTINATIONS) {
      expect(frontlinePathname(d.slug)).toBe(`/frontline/${d.slug}`)
    }
    const shell = readFileSync(join(APP_FRONTLINE, 'FrontlineShell.tsx'), 'utf8')
    expect(shell).not.toMatch(/href=\{?['"`]\/frontline\/?['"`]/)
    expect(routeBySurface('SURF-FL').pathname).toBe('/frontline')
  })

  // FAILS IF: an unbuilt screen identifier is spelled as a literal in a
  // shipped route file. `scripts/build-registries.mjs` counts every
  // identifier-shaped token a route names as evidence the screen is
  // demonstrated, and discloses that it cannot tell "renders it" from "names
  // it in order to deny it". Seventeen unbuilt views named on the index
  // would move seventeen coverage rows on the strength of a sentence saying
  // they are not built.
  it('spells no unbuilt screen identifier as a literal in a shipped route file', () => {
    const files = walk(APP_FRONTLINE)
    expect(files.length).toBeGreaterThan(6)
    const unbuilt = [
      ...FL_PLAYER_VIEWS.map((v) => v.id),
      FL_OVERLAY_ON_ANY_DESTINATION.id,
    ]
    const offenders: string[] = []
    for (const f of files) {
      const text = readFileSync(f, 'utf8')
      for (const id of unbuilt) if (text.includes(id)) offenders.push(`${f}: ${id}`)
    }
    expect(offenders).toEqual([])
  })
})

/* ==================================================================== *
 * THE SLUG THAT COULD NOT BE THE PLAN'S.
 * ==================================================================== */

describe('the Training Library slug', () => {
  // FAILS IF: the Frontline's Training Library route is renamed to
  // `training-library`. `src/studio/modules.ts` declares that slug for
  // MOD-STU-08 and `scripts/build-registries.mjs` throws outright when two
  // route directories carry a name a module has claimed. This is the one
  // route key that could not be the source's own destination name, and the
  // reason is a build constraint rather than a claim about the product.
  it('does not collide with the Studio slug a module already claims', () => {
    const fl = flDestinationBySlug('training-library-viewer')
    expect(fl.name).toBe('Training Library')
    const studioSpine = readFileSync(join('src', 'studio', 'modules.ts'), 'utf8')
    expect(studioSpine).toContain("slug: 'training-library'")
    const dirs = readdirSync(APP_FRONTLINE)
    expect(dirs).not.toContain('training-library')
  })
})

/* ==================================================================== *
 * THE OFFLINE COLUMN, WHICH IS WHERE TWO OUTCOMES BECOME LOAD-BEARING.
 * ==================================================================== */

describe('the destination-property table', () => {
  // FAILS IF: the source's own offline column is flattened. The expectations
  // are the source's four distinct tokens at L40032-L40037, not a re-read of
  // the field: Login is conditional, three are fully offline, the inbox is a
  // cached read-only copy, and the Training Library is unavailable.
  it('keeps four distinct offline answers across the six destinations', () => {
    const byName = Object.fromEntries(FL_DESTINATIONS.map((d) => [d.name, d.offline]))
    expect(byName['Login']).toBe('allowedWithConditions')
    expect(byName['My Runs']).toBe('allowed')
    expect(byName['Run Player']).toBe('allowed')
    expect(byName['Notifications and sync inbox']).toBe('cachedReadOnlyOffline')
    expect(byName['Training Library']).toBe('unavailable')
    expect(byName['Profile-lite']).toBe('allowed')
  })

  // FAILS IF: a destination stops naming its depth or its chrome. AC-FL-010-3
  // (L40047) caps navigation depth at three actions from Login, and
  // AC-FL-010-5 (L40049) requires the sync indicator everywhere.
  it('keeps the depth within the source’s cap and names chrome on every destination', () => {
    for (const d of FL_DESTINATIONS) {
      expect(d.depthFromLogin, d.name).toBeLessThanOrEqual(3)
      expect(d.persistentChrome.length, d.name).toBeGreaterThan(0)
      expect(d.offlineNote.length, d.name).toBeGreaterThan(10)
    }
    expect(FL_DESTINATIONS.filter((d) => d.persistentChrome.includes('Sync indicator'))).toHaveLength(5)
  })
})
