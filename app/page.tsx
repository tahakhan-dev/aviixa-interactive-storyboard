import Link from 'next/link'

// Minor (final review): this page used to link to nothing at all -- the
// entry point of a 25-page static export with no way out of it. These three
// are the storyboard's own top-level destinations, not a full site map (the
// five surfaces are reached from the coverage dashboard and review shell,
// same as before).
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
      <ul className="mt-6 space-y-2 text-[var(--color-primary)] underline">
        <li>
          <Link href="/coverage/">Coverage dashboard</Link>
        </li>
        <li>
          <Link href="/workflows/">Workflow Index</Link>
        </li>
        <li>
          <Link href="/review/">Review</Link>
        </li>
      </ul>
    </main>
  )
}
