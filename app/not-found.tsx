import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-3 text-[var(--color-ink-muted)]">
        This storyboard location does not exist. It may have been renamed, or
        the scenario state it needed was never prepared.
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
