import { ccElementAssignment } from '@/surfaces/cc/live/model'
import { CC06_MODULE, CC06_SHARED_SCREEN, cc06Row } from './matrix'
import {
  CC06_AGING,
  CC06_LEARNING_VIEW_CONTENT,
  CC06_NO_SWITCH,
  CC06_SHARED_SCREEN_BOUNDARY,
} from './lane-b'

/**
 * `MOD-CC-06`'S HALF OF `SCR-CC-13`, THE LEARNING READ VIEW — A COMPONENT
 * FOR ANOTHER TASK'S ROUTE, AND DELIBERATELY NOT A ROUTE.
 *
 * ══ THE BOUNDARY, AGREED RATHER THAN ASSUMED ═════════════════════════════
 *
 * `src/surfaces/cc/modules.ts` gives `MOD-CC-07` `slug: 'learning-read-view'`,
 * so `app/command-center/learning-read-view/` is the task that owns
 * `MOD-CC-07`'s directory and not this one's. The register row L48398 shows
 * two modules on that screen — `MOD-CC-06 FEAT-CC-0603, MOD-CC-07` — which is
 * the pattern this surface requires and not evidence of ownership: a module
 * mounted inside another's screen moves mention counts and claims nothing.
 *
 * THIS FILE IS THE WHOLE OF WHAT THIS MODULE PUTS ON THAT SCREEN. It takes no
 * props, reads no session and draws no navigation, so mounting it is one
 * import and one element. It is not mounted here, and that is stated rather
 * than left to look like an oversight — `src/surfaces/cc/modules/cc-10-s366/`
 * is what an undeclared absence looks like after a slice, and the difference
 * between a stated abstention and an oversight is the whole difference.
 *
 *     import { Cc06LearningReadView } from '@/surfaces/cc/modules/cc-06/LearningReadView'
 *     …
 *     <Cc06LearningReadView />
 *
 * ══ IT RENDERS TWO FEATURES BECAUSE THE SOURCE NAMES TWO ═════════════════
 *
 * The register names `FEAT-CC-0603` and §21.9's own feature list calls that
 * **Aging** (L37420). The learning read view is `FEAT-CC-0605` (L37432), and
 * the register row's `Purpose` column reads "**Read** what the platform has
 * learned, changing nothing" where `FUNC-CC-0605-1-1`'s own purpose (L37434)
 * reads "**show** what the platform has learned, changing nothing".
 *
 * NOT "WORD FOR WORD", WHICH IS WHAT THIS COMMENT SAID. Every word matches
 * but the verb, and a sibling module reading the same pair caught the
 * overstatement in its own file first. The near-identity is still the
 * evidence — a register cell that reproduces a functionality's purpose in
 * every word but one is describing that functionality — but "word for word"
 * is a claim about the text, and it is false.
 *
 * Two readings of one register cell, both locators on the record in
 * `./lane-b.ts`, neither chosen: both features render, which costs one
 * section and makes the mount correct under either reading.
 *
 * WHY THE IDENTIFIERS DRIFT, established by a sibling and worth keeping here:
 * §25's inventory declares "Thirteen source-stated modules, thirty-nine
 * features" (L47518) — exactly three per module — while §21.9 specifies five
 * for this module. Its names therefore run one identifier ahead from L47538
 * on, and `FEAT-CC-0604` and `FEAT-CC-0605` get no inventory row at all.
 *
 * ══ IT IS READ-ONLY, AND THE ROW THAT SAYS SO IS DRAWN ═══════════════════
 *
 * Matrix row 5 (L37298) is `See the read-only learning view`, and it is the
 * one row of the eight where the Supervisor's cell is bare `Read-only` with
 * no note at all. `FUNC-CC-0605-1-1` prohibits "every role from acting from
 * this view", so there is no control on this component of any kind — not a
 * disabled one, which would imply a condition that could become true.
 *
 * A SERVER COMPONENT, AND IT MUST NOT ACQUIRE `'use client'`. Everything it
 * renders comes from `./matrix`, `./lane-b` and wave 0's live model, all
 * plain data modules whose exports a client boundary would replace with
 * client references.
 */

const H2 = 'mt-8 text-lg font-semibold'
const NOTE = 'mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]'
const REF = 'mt-1 text-xs text-[var(--color-ink-subtle)]'

export function Cc06LearningReadView() {
  const row = cc06Row(5)
  const arrival = ccElementAssignment(CC06_AGING.elementName)

  return (
    <section data-testid="cc-06-learning-read-view" data-module={CC06_MODULE.id}>
      <h2 className={H2}>{CC06_SHARED_SCREEN.name}</h2>
      <p data-testid="cc-06-shared-screen-identity" className={REF}>
        {CC06_MODULE.id} · {CC06_MODULE.name} · mounted on {CC06_SHARED_SCREEN.id}, register row{' '}
        {CC06_SHARED_SCREEN.registerRef} · that route is {CC06_SHARED_SCREEN_BOUNDARY.routeOwnedBy}
        &rsquo;s and is not built here
      </p>
      <p className={NOTE}>{CC06_SHARED_SCREEN_BOUNDARY.whatThisModuleSupplies}</p>

      {/* ── WHICH FEATURE THE REGISTER NAMES — TWO READINGS, NO WINNER ── */}
      <div
        role="note"
        data-testid="cc-06-feature-readings"
        className="mt-4 rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border-strong)] p-4"
      >
        <p className="text-sm font-medium">
          The register cell reads{' '}
          <code>{CC06_SHARED_SCREEN_BOUNDARY.registerModulesShown}</code>, and the feature it names
          is not the feature this screen is
        </p>
        {CC06_SHARED_SCREEN_BOUNDARY.featureReadings.map((r) => (
          <p key={r.locator} className={NOTE}>
            {r.text} <span className="text-[var(--color-ink-subtle)]">[{r.locator}]</span>
          </p>
        ))}
        <p className={NOTE}>
          Neither reading is chosen. Both features are below, so the mount is correct under either
          and nothing on this screen depends on the question being settled.
        </p>
      </div>

      {/* ─────────────── FEAT-CC-0605 — WHAT IS READABLE ──────────────── */}
      <h2 className={H2}>What the platform has learned</h2>
      <p className={NOTE}>
        {row.capability} — the Supervisor&rsquo;s cell on this row is{' '}
        <code>{row.cells.Supervisor.text}</code> and the Quality Manager&rsquo;s is{' '}
        <code>{row.cells['Quality Manager'].text}</code> ({row.sourceRef}). No control of any kind
        is drawn on this view, disabled or otherwise: FUNC-CC-0605-1-1 (L37434) prohibits every role
        from acting from it, and a disabled control would imply a condition that could become true.
      </p>
      <ul data-testid="cc-06-learning-content" className="mt-3 list-disc pl-6 text-sm">
        {CC06_LEARNING_VIEW_CONTENT.map((item) => (
          <li key={item} className="mt-1 text-[var(--color-ink-muted)]">
            {item}
          </li>
        ))}
      </ul>
      <p className={REF}>
        FEAT-CC-0605 · SUB-CC-0605-1 · FUNC-CC-0605-1-1 (L37434), whose four items §21.9 states
        again in prose at L37288. Shared with the Standards and Operations Studio&rsquo;s authors on
        their own surface. Lane A refinements are applied automatically and change no configured
        value by definition; they are visible here and are reversible (L37381).
      </p>

      {/* ─────────────── FEAT-CC-0603 — AGING, NEVER EXPIRY ───────────── */}
      <h2 className={H2}>Aging, never expiry</h2>
      <p data-testid="cc-06-aging" className={NOTE}>
        An undecided proposal is stale-flagged at {CC06_AGING.staleAfterDays} days and the flag is a{' '}
        {CC06_AGING.staleFlagIsA}. The proposal remains in the queue and{' '}
        {CC06_AGING.expires ? 'expires' : 'never expires'}. {CC06_AGING.whyNoExpiry}
      </p>
      <p data-testid="cc-06-aging-marker" className={NOTE}>
        <span className="font-medium">{arrival.element}: </span>
        {arrival.classCell} · {arrival.markerObligation} · {arrival.sourceRef}. The class and its
        marker obligation are read from §21.3&rsquo;s assignment table rather than restated here, so
        a change to that table changes this panel. No day count is computed and no clock is read on
        this screen.
      </p>
      <p className={REF}>
        FEAT-CC-0603 (L37420) · FUNC-CC-0603-1-1 (L37422) · FUNC-CC-0603-1-2 (L37423) · AC-CC-263
        (L37444). Roles
        allowed: not applicable — the flag is automatic and server-side, and every role is
        prohibited from clearing it without a decision.
      </p>

      {/* ───────────────── THE SWITCH THAT DOES NOT EXIST ─────────────── */}
      <div
        role="note"
        data-testid="cc-06-no-switch"
        data-switch-exists={String(CC06_NO_SWITCH.exists)}
        className="mt-6 rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] p-4"
      >
        <p className="text-sm font-medium">There is no learning on-off switch, anywhere</p>
        <p className={NOTE}>{CC06_NO_SWITCH.why}</p>
        <p className={REF}>
          FUNC-CC-0605-1-2 (L37435), roles prohibited: every role · AC-CC-269 (L37450) · matrix row
          6 (L37299), whose Tenant Admin cell carries the reason as its own note.
        </p>
      </div>
    </section>
  )
}
