import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { isForeignProbe } from '../probe-paths'
import { ROUTES, routesForRole, routeByPathname, routeBySurface } from '@/routes/definitions'
import { SURFACES } from '@/domain/surfaces'
import { ROLES } from '@/domain/roles'
import { metadata as superAdminMetadata } from '../../app/super-admin/page'
import { metadata as hubMetadata } from '../../app/hub/page'
import { metadata as studioMetadata } from '../../app/studio/page'
import { metadata as commandCenterMetadata } from '../../app/command-center/page'
import { metadata as frontlineMetadata } from '../../app/frontline/page'

describe('route registry', () => {
  it('gives every surface at least one route', () => {
    for (const s of SURFACES) {
      expect(ROUTES.some((r) => r.surface === s.id), s.id).toBe(true)
    }
  })

  it('uses unique route ids and unique pathnames', () => {
    expect(new Set(ROUTES.map((r) => r.id)).size).toBe(ROUTES.length)
    expect(new Set(ROUTES.map((r) => r.pathname)).size).toBe(ROUTES.length)
  })

  it('gives every route a title, one heading, and source refs', () => {
    for (const r of ROUTES) {
      expect(r.title.length, r.id).toBeGreaterThan(3)
      expect(r.heading.length, r.id).toBeGreaterThan(3)
      expect(r.sourceRefs.length, r.id).toBeGreaterThan(0)
    }
  })

  it('grants every route to at least one of the nine roles', () => {
    for (const r of ROUTES) {
      expect(r.allowedRoles.length, r.id).toBeGreaterThan(0)
    }
  })

  it('gives every role at least one reachable route', () => {
    for (const role of ROLES) {
      expect(routesForRole(role.id).length, role.id).toBeGreaterThan(0)
    }
  })

  // Read-only Auditor reaches the Hub only. MOD-CC-13 note 4, DEC-AUDSTU-001.
  it('keeps the Read-only Auditor out of the Command Center and Frontline', () => {
    const surfaces = new Set(routesForRole('READONLY_AUDITOR').map((r) => r.surface))
    expect(surfaces.has('SURF-CC')).toBe(false)
    expect(surfaces.has('SURF-FL')).toBe(false)
  })

  // MOD-FL-A2: the Worker's home is the Frontline application.
  it('keeps the Worker on the Frontline surface', () => {
    const surfaces = new Set(routesForRole('WORKER').map((r) => r.surface))
    expect([...surfaces]).toEqual(['SURF-FL'])
  })

  it('resolves a route by pathname', () => {
    expect(routeByPathname('/command-center')?.surface).toBe('SURF-CC')
  })

  // M6: routeByPathname must normalise more than exactly one trailing slash,
  // and must not be case-sensitive about the path segment.
  it('resolves a route regardless of extra trailing slashes or case', () => {
    expect(routeByPathname('/hub//')?.surface).toBe('SURF-DOH')
    expect(routeByPathname('/Hub/')?.surface).toBe('SURF-DOH')
    expect(routeByPathname('/HUB')?.surface).toBe('SURF-DOH')
  })

  // I5: roles.ts's homeSurface/reachableSurfaces and this file's ternary must
  // not be allowed to drift apart silently -- slice 3 must not be able to
  // change one and forget the other.
  it('agrees with roles.ts reachableSurfaces for every role', () => {
    for (const role of ROLES) {
      const fromRoutes = [...new Set(routesForRole(role.id).map((r) => r.surface))].sort()
      const fromRoleDef = [...role.reachableSurfaces].sort()
      expect(fromRoutes, role.id).toEqual(fromRoleDef)
    }
  })

  it('uses no bare acronym as a route title', () => {
    for (const r of ROUTES) {
      expect(r.title, r.id).not.toMatch(/^(SURF|MOD|DOH|STU|CC|FL|SA)-/)
    }
  })

  // M2: RouteDefinition.title is documented as "Browser tab title" -- each
  // page's own `metadata.title` export must actually be sourced from it,
  // not a second hand-typed string that can drift.
  it('wires every surface page metadata.title from the route registry', () => {
    expect(superAdminMetadata.title).toBe(routeBySurface('SURF-SA').title)
    expect(hubMetadata.title).toBe(routeBySurface('SURF-DOH').title)
    expect(studioMetadata.title).toBe(routeBySurface('SURF-STU').title)
    expect(commandCenterMetadata.title).toBe(routeBySurface('SURF-CC').title)
    expect(frontlineMetadata.title).toBe(routeBySurface('SURF-FL').title)
  })
})

/**
 * R4-C01. THE TAB TITLE OF EVERY ROUTE, NOT OF FIVE OF THEM.
 *
 * `app/hub/audit-and-retention`, `app/hub/multi-area-job-pairing` and
 * `app/hub/parts-registry` each shipped a THROWN REACT ERROR as their browser
 * tab title -- `function(){throw Error("Attempted to call SCREEN_TITLE() from
 * the server but SCREEN_TITLE is on the client. ...")} — Delivery Operations
 * Hub` -- for as long as those pages have existed. The suite above asserted
 * `metadata.title` for the FIVE surface index pages, so 82 of 87 page modules
 * had no title assertion of any kind. That is round 2's shape: a SUBSET
 * population standing in for a claim about every member.
 *
 * TWO ASSERTIONS, BECAUSE ONE OF THEM CANNOT SEE THE DEFECT. Under Vitest a
 * `'use client'` directive is inert: importing `SCREEN_TITLE` from a client
 * module yields the real string, so a title-VALUE check reads
 * `'Audit log explorer'` and passes on the exact bytes that ship the thrown
 * error. Only `next build` substitutes the throwing client-reference proxy.
 * So the value check below is paired with a STATIC check of the cause -- no
 * binding imported from a `'use client'` module may be referenced inside a
 * page's `metadata` or `generateMetadata`. The static one is what reds on the
 * real defect; the value one catches empty, `undefined` and drifted titles.
 *
 * POPULATION BY EQUALITY, NOT BY COUNT. The Vite glob and an independent
 * `readdirSync` walk of `app/` are compared as SETS, so a glob that silently
 * stops matching cannot shrink the population, and a floor keeps an empty
 * walk from passing vacuously.
 */
const PAGE_MODULES = import.meta.glob('../../app/**/page.tsx') as Record<
  string,
  () => Promise<Record<string, unknown>>
>

/**
 * Every `page.tsx` under `app/`, walked independently of the glob.
 *
 * Probe-aware, like every other walk in this tree: a concurrent gate plants a
 * scratch directory to prove it can fail, and a walk that lists one then
 * ENOENTs on it -- or reports it as a route. `tests/probe-paths.ts` carries
 * the account. Nothing plants under `app/` today, which is exactly the
 * reasoning that left four walks unguarded, so the rule is uniform instead.
 */
function walkPages(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  )) {
    if (isForeignProbe(entry.name)) continue
    const child = join(dir, entry.name)
    if (entry.isDirectory()) walkPages(child, out)
    else if (entry.name === 'page.tsx') out.push(child)
  }
  return out
}

/** The glob is filtered the same way, or a planted probe breaks the equality. */
const globbedPages = Object.keys(PAGE_MODULES).filter(
  (p) => !p.split('/').some((seg) => isForeignProbe(seg)),
)

const APP_ROOT = resolve(__dirname, '../../app')
const WALKED_PAGES = walkPages(APP_ROOT).map((p) => `../../app/${p.slice(APP_ROOT.length + 1)}`)

/**
 * The three pages that deliberately do NOT export `metadata`, each named with
 * where its title actually comes from. A literal list, so a fourth page
 * quietly losing its title cannot join them: it is `toEqual` against the set
 * difference, never a count and never a subset.
 */
const TITLE_SOURCED_ELSEWHERE: Readonly<Record<string, string>> = {
  // The entry page takes the root layout's `title.default`.
  '../../app/page.tsx': '../../app/layout.tsx',
  // `app/review/layout.tsx` sets `title: 'Client review'` for this segment.
  '../../app/review/page.tsx': '../../app/review/layout.tsx',
  // The one dynamic route: `generateMetadata` per registry slug.
  '../../app/coverage/[registry]/page.tsx': 'generateMetadata',
  // Task 17: `generateMetadata` per workflow id, same shape as the registry route above.
  '../../app/workflows/[workflowId]/page.tsx': 'generateMetadata',
}

/** A title that is any of these is a defect, not a title. */
const POISON = ['Attempted to call', 'function(', 'throw ', 'undefined']

function assertUsableTitle(title: unknown, where: string): void {
  const text = typeof title === 'string' ? title : (title as { default?: string })?.default
  expect(typeof text, `${where}: title is not a string`).toBe('string')
  expect((text as string).trim().length, `${where}: empty title`).toBeGreaterThan(0)
  for (const poison of POISON) {
    expect((text as string), `${where}: title contains ${JSON.stringify(poison)}`).not.toContain(
      poison,
    )
  }
}

describe('every route page ships a usable browser tab title', () => {
  it('covers every page.tsx in app/, by set equality against a filesystem walk', () => {
    expect(WALKED_PAGES.length).toBeGreaterThanOrEqual(87)
    expect(new Set(globbedPages)).toEqual(new Set(WALKED_PAGES))
  })

  it('gives every page a non-empty title carrying no thrown-error text', async () => {
    const withMetadata: string[] = []
    const withoutMetadata: string[] = []
    for (const path of WALKED_PAGES) {
      const loader = PAGE_MODULES[path]
      expect(loader, `${path}: not matched by the page glob`).toBeDefined()
      const mod = await loader!()
      if (mod.metadata === undefined) {
        withoutMetadata.push(path)
        continue
      }
      withMetadata.push(path)
      assertUsableTitle((mod.metadata as { title?: unknown }).title, path)
    }
    // Equality both ways: the pages with no `metadata` are exactly the three
    // named above, and every other page was actually asserted.
    expect(new Set(withoutMetadata)).toEqual(new Set(Object.keys(TITLE_SOURCED_ELSEWHERE)))
    expect(new Set([...withMetadata, ...withoutMetadata])).toEqual(new Set(WALKED_PAGES))
    expect(withMetadata.length).toBe(WALKED_PAGES.length - 4)
    // 30s, not the project's 5s default: this imports all 87 page modules and
    // their component trees, which took 5.2s under parallel load. The budget
    // is for the work, not for a flaky assertion -- the walk is the point.
  }, 30_000)

  it('gives the three metadata-less pages a usable title from where they take it', async () => {
    const rootLayout = (await import('../../app/layout')) as { metadata: { title?: unknown } }
    assertUsableTitle(rootLayout.metadata.title, '../../app/layout.tsx')
    const reviewLayout = (await import('../../app/review/layout')) as {
      metadata: { title?: unknown }
    }
    assertUsableTitle(reviewLayout.metadata.title, '../../app/review/layout.tsx')

    const coverage = (await import('../../app/coverage/[registry]/page')) as {
      generateStaticParams: () => { registry: string }[]
      generateMetadata: (a: { params: Promise<{ registry: string }> }) => Promise<{ title?: unknown }>
    }
    const slugs = coverage.generateStaticParams()
    expect(slugs.length).toBeGreaterThanOrEqual(14)
    for (const p of slugs) {
      const meta = await coverage.generateMetadata({ params: Promise.resolve(p) })
      assertUsableTitle(meta.title, `../../app/coverage/[registry]/page.tsx?registry=${p.registry}`)
    }
  })

  /**
   * THE FIFTH PAGE OF THIS CAUSE IS FIXED AND ITS QUARANTINE IS GONE.
   *
   * `app/super-admin/core-agents-and-composed-agent-review/page.tsx` used to
   * write `title: ${MODULE.name} — Super Admin Platform Console` where
   * `MODULE` came from a `'use client'` module. The proxy does not throw on a
   * property read the way it does on a call, so instead of the visible error
   * text the three Hub pages shipped, that page shipped an EMPTY module name.
   * It now reads the module registry directly, like every sibling page in its
   * directory, and this gate asserts an EMPTY violation set: the equality is
   * the whole point, so a sixth site of the cause reds it immediately.
   */

  /**
   * THE CAUSE, CHECKED STATICALLY -- this is the assertion that reds on the
   * shipped defect. `metadata` is evaluated on the server; a binding imported
   * from a `'use client'` module is replaced by a throwing proxy there, and a
   * template literal stringifies the proxy into the tab.
   */
  it('sources no page title from a `use client` module', () => {
    expect(WALKED_PAGES.length).toBeGreaterThanOrEqual(87)
    const violations: string[] = []
    let metadataBlocksRead = 0

    for (const rel of WALKED_PAGES) {
      const file = resolve(__dirname, rel)
      const source = readFileSync(file, 'utf8')

      // Every `export const metadata = {...}` / `export ... generateMetadata`
      // body, delimited by BRACE BALANCE rather than by a `}` in column 0.
      // The column-0 form was tried first and over-reached badly: eight pages
      // write `export const metadata: Metadata = { title: ... }` on ONE line,
      // which has no column-0 `}`, so the block swallowed the default export
      // and convicted twenty-two innocent pages of reading their own screen
      // component in their metadata.
      const blocks: string[] = []
      for (const m of source.matchAll(
        /^export (?:const metadata\b|async function generateMetadata\b)/gm,
      )) {
        const from = source.indexOf('{', m.index)
        if (from === -1) continue
        let depth = 0
        let to = from
        for (; to < source.length; to += 1) {
          if (source[to] === '{') depth += 1
          else if (source[to] === '}' && (depth -= 1) === 0) break
        }
        blocks.push(source.slice(m.index, to + 1))
      }
      if (blocks.length === 0) continue
      metadataBlocksRead += blocks.length
      const metaText = blocks.join('\n')

      for (const im of source.matchAll(
        /import\s*(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g,
      )) {
        if (im[0].startsWith('import type')) continue
        const spec = im[2]!
        const base = spec.startsWith('@/')
          ? resolve(__dirname, '../../src', spec.slice(2))
          : spec.startsWith('.')
            ? resolve(dirname(file), spec)
            : null
        if (base === null) continue
        const target = ['.ts', '.tsx', '/index.ts', '/index.tsx']
          .map((ext) => base + ext)
          .find((c) => existsSync(c))
        if (target === undefined) continue
        if (!/^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/.test(
          readFileSync(target, 'utf8'),
        )) {
          continue
        }
        for (const raw of im[1]!.split(',')) {
          const name = raw.trim().split(/\s+as\s+/).pop()?.trim()
          if (name === undefined || name.length === 0) continue
          if (new RegExp(`\\b${name}\\b`).test(metaText)) {
            violations.push(`${rel}: metadata reads \`${name}\` from client module ${spec}`)
          }
        }
      }
    }

    // The population is asserted, not only the offender count: a refactor that
    // stops matching `export const metadata` would otherwise empty this gate
    // and leave it green with nothing to say (round 3's shape).
    expect(metadataBlocksRead).toBeGreaterThanOrEqual(84)
    expect(violations).toEqual([])
  })
})
