import Link from 'next/link'
import { SURFACES } from '@/domain/surfaces'

/**
 * THE ENTRY PAGE, AND THE MEASUREMENT THAT REWROTE IT.
 *
 * WHAT STOOD HERE WAS FALSE, and it is corrected rather than renumbered. The
 * comment on this file claimed "the five surfaces are reached from the
 * coverage dashboard and review shell". Audit finding `R3-06` measured a
 * breadth-first walk of the built export's own `href`s from `/`: of 102
 * exported routes, EIGHTEEN were reachable and 84 were not, and all five
 * surface roots — `/super-admin/`, `/hub/`, `/studio/`, `/command-center/`,
 * `/frontline/` — were in the 84. The coverage dashboard links its own
 * registry indexes and `/workflows/`; `/review/` renders no anchor at all.
 * The entire product was reachable only by typing a URL.
 *
 * IT SURVIVED 546 GREEN TESTS because every route-level assertion in
 * `tests/e2e/` and `tests/accessibility/` arrives by `page.goto(path)`, and a
 * `goto` cannot tell a linked page from an orphan. `tests/e2e/reachability.
 * spec.ts` is the assertion that was missing: it walks this page's links the
 * way a client does and compares what it reaches against `scannableRoutes()`
 * BY EQUALITY.
 *
 * SO THIS IS NOT A LINK LIST. Master prompt §20.0 names three ways into the
 * storyboard — a guided story, exploring the product, reviewing the evidence
 * — and the three destinations that used to be the whole of this page are the
 * third of them. All three are offered below, each saying what it is for, so
 * a reader who has never seen this build can pick one.
 *
 * THE FIVE SURFACE ENTRIES ARE DERIVED, from `SURFACES` in
 * `@/domain/surfaces` — name, one-sentence purpose, what the surface owns and
 * its base path, all read off the same register the surfaces themselves
 * render from. A sixth surface appears here with no edit to this file, and a
 * renamed one cannot go stale here while being right there.
 */

/**
 * MODE 1 — THE GUIDED STORY. The two composed walkthroughs this build ships.
 * Each steps through one surface in the order the work actually happens
 * instead of listing its modules, and neither is a module route: both compose
 * module routes and mint no screen identifier (D1).
 *
 * They are linked from here and from nowhere else on purpose. Both were
 * orphans before this page — a walkthrough written for a client to follow,
 * which no page offered the client — and a walkthrough belongs at the way in
 * rather than filed under the surface it crosses.
 *
 * No step COUNT is printed. The steps are the journey screens' own data and a
 * number transcribed here would be a second copy free to rot; the endpoints
 * are what a reader choosing between them needs.
 */
const GUIDED_STORY = [
  {
    href: '/hub/journey/',
    name: 'Operational journey — a Job to a closed record',
    surface: 'Delivery Operations Hub',
    what:
      'A Job is drafted and submitted, a second person approves it, the run is scheduled and the workers assigned, the shift runs, the Execution Summary computes, an anomaly is resolved, and the record closes itself when the finish window elapses.',
  },
  {
    href: '/studio/journey/',
    name: 'Workflow Builder journey — SEQ-011',
    surface: 'Standards and Operations Studio',
    what:
      'A Workflow is opened, classified, structured screen by screen, branched, authored at one difficulty level, validated, diffed, submitted, returned with comments, revised, approved maker-checker and published.',
  },
] as const

/**
 * MODE 3 — REVIEWING THE EVIDENCE. The three destinations that were this
 * page's entire contents. They are kept, and they are now labelled with what
 * each one answers, because "Coverage dashboard" tells a first-time reader
 * nothing about which of the three to open.
 */
const EVIDENCE = [
  {
    href: '/coverage/',
    name: 'Coverage dashboard',
    what:
      'The fourteen source-derived inventories, each with this build’s honest status against it, and the identifier shapes that belong to none of them.',
  },
  {
    href: '/workflows/',
    name: 'Workflow Index',
    what: 'Every Workflow the frozen source names, filterable, with the source line each row came from.',
  },
  {
    href: '/review/',
    name: 'Review',
    what: 'The client review shell — where a reviewer records a decision against what this storyboard shows.',
  },
] as const

function Destination({
  href,
  name,
  meta,
  what,
}: {
  readonly href: string
  readonly name: string
  readonly meta?: string
  readonly what: string
}) {
  return (
    <li>
      <div className="flex flex-wrap items-baseline gap-2">
        <Link href={href} className="text-[var(--color-primary)] underline">
          {name}
        </Link>
        {meta === undefined ? null : (
          <span className="text-xs text-[var(--color-ink-subtle)]">{meta}</span>
        )}
      </div>
      <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">{what}</p>
    </li>
  )
}

export default function EntryPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">
        AVIIXA
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Interactive Storyboard</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        A client-validation walkthrough of the AVIIXA platform. Every action
        here is simulated against local fixtures. No production system is
        connected and no real data is used.
      </p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        There are three ways through it. Follow a guided story end to end,
        explore a product surface on your own, or read the evidence this build
        has assembled against the frozen source.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Follow a guided story</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          One piece of work, followed from beginning to end across the screens
          that handle it. Each step names the surface acting, what the other
          four see, and the client decisions the step does not settle.
        </p>
        <ul className="mt-4 space-y-4">
          {GUIDED_STORY.map((j) => (
            <Destination key={j.href} href={j.href} name={j.name} meta={j.surface} what={j.what} />
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Explore a product surface</h2>
        {/* WHAT THIS PARAGRAPH DOES NOT SAY, AND WHY. It first read "each one
            lists its own modules and says which of them this build has screens
            for", which is true of four surfaces and false of the fifth:
            measured over the export, `out/frontline/index.html` names no
            `MOD-*` identifier at all. It links its six screens, which is what
            the sentence claims now. Every surface index does that. */}
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The five surfaces of the platform. Each one is the index for its own
          screens: open a surface and it lists what this build has built there.
          Each also states what it owns, because the same record is read on
          several surfaces and written on only one.
        </p>
        <ul className="mt-4 space-y-4">
          {SURFACES.map((s) => (
            <li key={s.id}>
              <div className="flex flex-wrap items-baseline gap-2">
                <Link
                  href={`${s.basePath}/`}
                  className="text-[var(--color-primary)] underline"
                >
                  {s.name}
                </Link>
                <span className="text-xs text-[var(--color-ink-subtle)]">{s.id}</span>
              </div>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">{s.purpose}</p>
              <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-subtle)]">
                <span className="font-medium text-[var(--color-ink)]">What it owns: </span>
                {s.ownership}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Review the evidence</h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-ink-muted)]">
          What this build claims about the frozen source, and where each claim
          came from.
        </p>
        <ul className="mt-4 space-y-4">
          {EVIDENCE.map((d) => (
            <Destination key={d.href} href={d.href} name={d.name} what={d.what} />
          ))}
        </ul>
      </section>
    </main>
  )
}
