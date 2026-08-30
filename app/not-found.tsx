import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-3 text-[var(--color-ink-muted)]">
        This storyboard location does not exist. It may have been renamed, or
        the scenario state it needed was never prepared.
      </p>
      {/*
        R6-B08. Three of the export's 103 pages are this component --
        `out/404.html`, `out/404/index.html`, `out/_not-found/index.html` --
        and all three carried no not-real statement. The brief asked for the
        404 variants to be checked deliberately rather than exempted by
        reflex, and the check came out the same way it does for every other
        page: a reader who lands here has landed in the deliverable, and the
        deliverable says what it is. Carrying it here is one line and leaves
        `tests/coverage/rendered-disclosure.test.ts` with an EMPTY exemption
        list, which is a stronger claim than a three-entry one.
      */}
      <p className="mt-3 text-[var(--color-ink-muted)]">
        Simulated behaviour only. This is a client-validation storyboard for
        the AVIIXA platform, not a connected production system.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-[var(--color-primary)] underline"
      >
        Return to the storyboard entry page
      </Link>
    </main>
  )
}
