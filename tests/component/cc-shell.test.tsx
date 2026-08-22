import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { CommandCenterShell } from '@/surfaces/cc/shell/CommandCenterShell'
import { CC_NAV, ccScreen } from '@/surfaces/cc/screens'
import { CC_SEAMS, ccSeamStatus } from '@/surfaces/cc/seams'
import { CC_SPINE_SEAM_VERDICTS } from '@/surfaces/cc/seams/spine-status'

/**
 * THE `SURF-CC` SHELL, RENDERED.
 *
 * WHAT THE BUILT-SET PROP IS FOR, and it is not testability for its own sake.
 * `CC_NAV` publishes twelve pathnames and the tree holds one directory, so
 * "offers no link for an unbuilt route" is satisfied TODAY by the route not
 * existing — a check that passes on the code and on its own negation, which
 * `app/studio/StudioShell.tsx` records this build shipping four times. Driving
 * the set from the caller lets both directions be asserted over the same
 * tree, which is the only way the fail-closed branch is proven to fire.
 *
 * EVERY ROW IS READ THROUGH ITS OWN `data-testid`, never by sweeping the
 * container's `textContent`. The rail's rows are adjacent elements and
 * `textContent` welds adjacent elements together — first on the catalogue of
 * gates that could not fail — and a screen name is a prefix of nothing here
 * only by luck.
 */

const ALL_SLUGS = CC_NAV.map((n) => n.pathname.slice('/command-center/'.length))
const ONE = ['sync-conflict-review-panel']

const linkIn = (screenId: string): HTMLAnchorElement | null =>
  screen.getByTestId(`cc-rail-${screenId}`).querySelector('a')

describe('the rail offers a link only for a route that exists', () => {
  // FAILS IF: the shell links a route it has not been told is built. Eleven of
  // the twelve keys have no directory, so every one of those links is a 404 —
  // slice 4's defect shape 5, a screen pointing at content that is not there.
  // PLANTED: replaced `built={builtPaths.has(entry.pathname)}` with
  //          `built={true}` in `src/surfaces/cc/shell/CommandCenterShell.tsx`.
  // RED: SCR-CC-02: expected <a …(2)></a> to be null.
  //
  // TWO GUARDS, PLANTED EACH AND BOTH. This row is protected twice — an
  // unbuilt route draws no anchor, AND it states why — and either alone would
  // let the other rot.
  // PLANTED: the anchor branch replaced with an unconditional `<Link>`.
  // RED: SCR-CC-02: expected <a …(2)></a> to be null.
  // PLANTED: the `{built ? null : …}` reason turned into `{false ? null : …}`
  //          under a different testid, so the reason renders on every row and
  //          the one this test looks for is gone.
  // RED: TestingLibraryElementError: Unable to find an element by:
  //      [data-testid="cc-rail-unbuilt-SCR-CC-02"].
  // PLANTED: both together.
  // RED: SCR-CC-02: expected <a …(2)></a> to be null.
  it('draws no anchor for an unbuilt route and says which it is', () => {
    render(<CommandCenterShell builtSlugs={ONE} />)

    expect(linkIn('SCR-CC-10')?.getAttribute('href')).toBe(
      '/command-center/sync-conflict-review-panel',
    )
    expect(screen.queryByTestId('cc-rail-unbuilt-SCR-CC-10')).toBeNull()

    for (const entry of CC_NAV) {
      if (entry.screen === 'SCR-CC-10') continue
      expect(linkIn(entry.screen), entry.screen).toBeNull()
      // The reason is stated, never a row going quiet.
      expect(screen.getByTestId(`cc-rail-unbuilt-${entry.screen}`).textContent).toContain(
        entry.pathname,
      )
    }
  })

  // FAILS IF: the shell ignores the built set in the other direction — a rail
  // that never links anything also passes the gate above. Same tree, same
  // component, the opposite input.
  // PLANTED: replaced `built={builtPaths.has(entry.pathname)}` with
  //          `built={false}` in `src/surfaces/cc/shell/CommandCenterShell.tsx`.
  // RED: SCR-CC-02: expected undefined to be '/command-center/live-shift-board'.
  it('draws an anchor for every route once they are all built', () => {
    render(<CommandCenterShell builtSlugs={ALL_SLUGS} />)
    for (const entry of CC_NAV) {
      expect(linkIn(entry.screen)?.getAttribute('href'), entry.screen).toBe(entry.pathname)
      expect(screen.queryByTestId(`cc-rail-unbuilt-${entry.screen}`), entry.screen).toBeNull()
    }
  })

  // FAILS IF: a slug the register does not key inflates the count the shell
  // prints. The caller reads a directory listing, and a directory that is not
  // a route key is exactly what the register-keying rule exists to catch.
  // PLANTED: replaced `builtCount` with `builtPaths.size` in
  //          `src/surfaces/cc/shell/CommandCenterShell.tsx`.
  // RED: expected '12 routes are keyed from the screen r…' to contain
  //      '1 of them are built' — the stray key had been counted.
  it('counts rail entries, not whatever the caller listed', () => {
    render(<CommandCenterShell builtSlugs={[...ONE, 'not-a-register-key']} />)
    const counts = screen.getByTestId('cc-rail-counts').textContent ?? ''
    expect(counts).toContain(`${CC_NAV.length} routes`)
    expect(counts).toContain('1 of them are built')
    expect(screen.queryByTestId('cc-rail-not-a-register-key')).toBeNull()
  })

  // FAILS IF: the sign-in reappears as a rail item. It is the thirteenth
  // register row and the twelfth route key does not exist for it: `SCR-CC-01`
  // reuses MOD-DOH-09 (L48386) and `sign-in` already names two directories on
  // other surfaces.
  // PLANTED: removed the `s.id === 'SCR-CC-01'` term from `CC_NAV` in
  //          `src/surfaces/cc/screens.ts` (wave 0's file — reported, restored,
  //          not kept).
  // RED: expected <li data-testid="cc-rail-SCR-CC-01">…(2)</li> to be null.
  it('carries twelve rows over a register of thirteen', () => {
    render(<CommandCenterShell builtSlugs={ONE} />)
    expect(screen.queryByTestId('cc-rail-SCR-CC-01')).toBeNull()
    expect(
      CC_NAV.map((n) => screen.getByTestId(`cc-rail-${n.screen}`)).length,
      'every rail row is present and reachable by its own id',
    ).toBe(12)
    expect(screen.getByTestId('cc-rail-counts').textContent).toContain('thirteen screens')
  })
})

describe('the two mount points state an absence only while there is one', () => {
  // WHAT THIS GATE USED TO SAY, AND WHY IT IS THE OPPOSITE NOW. Its
  // predecessor asserted `ccSeamStatus(seam)).toBe('open')` and then read the
  // notice, on the reasoning that "a reviewer must meet a stated absence
  // naming the module that owes the missing half — not an empty frame". That
  // reasoning holds for an OPEN seam and inverts for a closed one: slice 9
  // built both owning halves, and the assertion kept "Until that board exists
  // there is no host" on twelve of the thirteen Command Center pages, on the
  // surface that ships the board. The notice on a closed seam is the empty
  // frame's opposite defect — an absence asserted where there is none.
  //
  // FAILS IF: a seam whose owning half is built and reached renders its
  // absence notice again. The verdict record is the substance check and
  // `tests/unit/cc-seams.test.ts` opens each piece of its evidence; this gate
  // is the rendered consequence of it.
  // PLANTED: reverted `const THIS_SLICE = 9` to 8 in src/surfaces/cc/seams.ts.
  // RED: sync-state-chrome-host: its owning half is built, so no absence may
  //      be drawn for it: expected 'open' to be 'closed'.
  it('draws no absence for a seam whose owning half is built', () => {
    render(<CommandCenterShell builtSlugs={ONE} />)
    // NON-VACUITY, TWO WAYS. The verdicts cover every registered row, so the
    // loop cannot be empty; and both mount points are asserted PRESENT, so
    // "no notice" cannot be satisfied by the shell rendering no slots at all.
    expect(CC_SPINE_SEAM_VERDICTS.length).toBe(CC_SEAMS.length)
    expect(screen.getByTestId('cc-chrome-slot')).not.toBeNull()
    expect(screen.getByTestId('cc-action-rail-slot')).not.toBeNull()
    for (const verdict of CC_SPINE_SEAM_VERDICTS) {
      const seam = CC_SEAMS.find((s) => s.id === verdict.id)!
      expect(verdict.owningHalfBuilt, verdict.id).toBe(true)
      expect(
        ccSeamStatus(seam),
        `${verdict.id}: its owning half is built, so no absence may be drawn for it`,
      ).toBe('closed')
      expect(screen.queryByTestId(`cc-seam-${seam.id}`), `${seam.id} still draws an absence`).toBeNull()
    }
    // AND THE MECHANISM IS STILL THERE, so a silent slot means "closed" and
    // not "the notice was deleted". Both the status guard and the fallback
    // are read out of the shell's own source.
    const shell = readFileSync(
      join(process.cwd(), 'src', 'surfaces', 'cc', 'shell', 'CommandCenterShell.tsx'),
      'utf8',
    )
    expect(shell).toContain("if (ccSeamStatus(seam) === 'closed') return null")
    expect(shell).toContain('{seam.whatIsMissing}')
  })

  // FAILS IF: a supplied mount steps on the seam notice or is dropped. This is
  // what makes the slot a mount point rather than a placeholder: a screen with
  // the data hands its chrome in and this file does not change.
  // PLANTED: changed `{chrome ?? <SeamNotice .../>}` to `{<SeamNotice .../>}`
  //          in `src/surfaces/cc/shell/CommandCenterShell.tsx`.
  // RED: TestingLibraryElementError: Unable to find an element by:
  //      [data-testid="cc-chrome-supplied"].
  it('steps aside when a screen supplies the chrome or the action rail', () => {
    render(
      <CommandCenterShell
        builtSlugs={ONE}
        chrome={<p data-testid="cc-chrome-supplied">the board’s marker</p>}
        actionRail={<p data-testid="cc-rail-supplied">the closed set of ten</p>}
      />,
    )
    expect(screen.getByTestId('cc-chrome-supplied')).not.toBeNull()
    expect(screen.getByTestId('cc-rail-supplied')).not.toBeNull()
    expect(screen.queryByTestId('cc-seam-sync-state-chrome-host')).toBeNull()
    expect(screen.queryByTestId('cc-seam-operational-action-set')).toBeNull()
  })
})

describe('a screen route is annotated from its own register row', () => {
  // FAILS IF: the annotation is assembled from anything but the register row.
  // The roles column is the source's own words — `SCR-CC-10` reads "Supervisor
  // for viewing, Quality Manager for resolution" — and flattening it to a role
  // list loses the distinction the register makes.
  // PLANTED: replaced `{screen.rolesColumn}` with
  //          `{screen.rolesThatCanOpen.join(', ')}` in
  //          `src/surfaces/cc/shell/CommandCenterShell.tsx`.
  // RED: expected 'SCR-CC-10 · register row L48395 · rol…' to contain
  //      'Supervisor for viewing, Quality Manag…'.
  it('prints the register row’s own identifier, line and roles column', () => {
    const row = ccScreen('SCR-CC-10')
    render(<CommandCenterShell screen={row} builtSlugs={ONE} />)
    const annotation = screen.getByTestId('cc-screen-annotation').textContent ?? ''
    expect(annotation).toContain(row.id)
    expect(annotation).toContain(row.registerRef)
    expect(annotation).toContain(row.rolesColumn)
    expect(annotation).toContain('Supervisor for viewing, Quality Manager for resolution')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(row.name)
  })
})
