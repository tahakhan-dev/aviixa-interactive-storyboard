/**
 * §8 of the spec: every screen carries this disclosure. `AC-SCOPE-033`
 * (L2612) forbids describing the audit log as tamper-evident, chained or
 * signed; in a prototype that extends to never claiming append-only-
 * enforced either, and D10 extends the same ban to "verified". This exact
 * copy is reused by all nineteen modules so the words never drift screen to
 * screen — `tests/component/sa-spine.test.tsx` and the slice gates both
 * check it never contains any of the four forbidden words.
 */
const DISCLOSURE_TEXT =
  'Simulated behaviour only. This screen is part of a client-validation storyboard: every state shown is seeded fixture data the user steps through, not a computed transition against a connected production system.'

export function PrototypeDisclosure() {
  return <p className="mt-6 max-w-prose text-sm text-[var(--color-ink-subtle)]">{DISCLOSURE_TEXT}</p>
}
