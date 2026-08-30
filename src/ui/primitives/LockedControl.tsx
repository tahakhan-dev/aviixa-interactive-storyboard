import { StatusPill } from './StatusPill'

/**
 * A setting the reader can SEE, cannot change, and is told why — rendered
 * where the changeable version of the same setting would sit.
 *
 * `SB-PREF-01`, L73702 — "Every locked control states its reason inline
 * rather than showing a disabled control with no explanation." The same
 * storyboard names the three groups a preferences screen draws: Always sent,
 * locked; Protected, L73702 — "locked for disabling with email frequency
 * options only"; and Configurable. The numbered workflow says the same thing
 * about what the screen contains, L73681 — "plus the non-disableable set
 * rendered as locked".
 *
 * ── WHY THIS COMPONENT EXISTS AT ALL, WHICH IS A COUNTING ARGUMENT ─────────
 * The 30C.10 preference matrix (header L73706, separator L73707, four data
 * rows L73708-L73711 — twenty permission cells) reads `Explicitly prohibited`
 * in eleven of those twenty cells outright, and in a twelfth as a qualified
 * variant. The categorical-prohibition rule this build inherited from slice 4
 * sends `Explicitly prohibited` at `BASE_ROLE` to ABSENT — nothing drawn — so
 * applying it here deletes the Always-sent and Protected groups outright and
 * leaves a preferences screen showing only what CAN be switched off. That is
 * the inversion of what the storyboard draws, and it is not a rendering
 * quibble: a screen that shows only the disableable categories tells a Tenant
 * Admin that the protected set does not exist, which is the false claim the
 * ABSENT rule exists to prevent in the other direction.
 *
 * WHAT THE COUNT IS NOT. It is not "every cell of three of the five columns".
 * Measured column by column, exactly ONE column is `Explicitly prohibited` in
 * every cell (May disable a protected category); May disable a mandatory
 * family is bare in three of four and qualified in the fourth; May disable
 * in-app is three of four with a `Not applicable` fourth. The trap is real at
 * one column and survives at two; it was never true at three.
 *
 * ── INOPERABLE BY CONSTRUCTION, NOT BY STYLING OR BY GUARD ────────────────
 * There is no `<button>`, no `<input>`, no `role="switch"`, no `role="button"`
 * and no `contenteditable` below, and there is no handler prop that could add
 * one. Nothing here is disabled, because nothing here is operable: the props
 * interface carries no `onClick`, no `onChange` and no `onAct`, so a caller
 * has nothing to pass and TypeScript refuses the literal that tries.
 *
 * THIS IS THE DIFFERENCE FROM EVERY DISABLED CONTROL IN THE TREE, AND IT IS
 * DELIBERATE. `Button` with `disabledReason` renders a real `<button>` that
 * is inert because an `if (inert) return` inside its own handler declines to
 * call through — inoperable by GUARD. `ProhibitionNotice`'s
 * `disabled-with-reason` arm and four of `WriteControl`'s five branches are
 * that same `Button`. A guard is defeated by any future edit to the guard; an
 * absent handler cannot be defeated, because there is nothing to call.
 *
 * NO `aria-disabled` ANYWHERE, ON PURPOSE. `aria-disabled` is the right
 * attribute for a widget that exists and declines — that is `Button`'s job
 * and `Button` does it correctly. Here it would announce a widget that is not
 * present. It is also the token that satisfied a slice-9 test asserting only
 * that a control was there: a test which asserts `aria-disabled` present is
 * green over a control that does nothing AND over a control that should never
 * have been a control. This component gives such a test nothing to bind to.
 *
 * ── THE REASON IS IN THE ACCESSIBILITY TREE, NOT MERELY ON SCREEN ─────────
 * `aria-labelledby` names the setting and `aria-describedby` carries the
 * reason and, when there is one, what the reader may still change. Both ids
 * are derived from the caller's `controlId`, NOT from `useId`, which is why
 * this file has no `'use client'`: `useId` is a hook, a hook makes this a
 * client component, and a client component cannot be handed a decision by a
 * server component without a boundary crossing. Six of slice 9's seven
 * panels shipped exactly that crossing. This component takes no function and
 * needs no client runtime, so every caller — server or client — may render it
 * without deciding anything about the boundary. **A caller that needs a
 * boundary needs an operable control, which is not this component.**
 *
 * The group carries `tabIndex={0}`, so a keyboard user reaches it. That is
 * the whole interaction: focus, hear the setting and its reason, move on.
 * Without it a locked control containing no focusable descendant would be
 * unreachable by keyboard, and its reason readable only by a screen reader
 * walking the document in reading order.
 *
 * A FOCUSABLE NON-INTERACTIVE CONTAINER IS ALREADY SHIPPED HERE AND ALREADY
 * AXE-CLEAN, so this is a precedent rather than a judgement: the scrollable
 * table region in `app/coverage/[registry]/page.tsx` is a `role="region"` with
 * `tabIndex={0}` and no interactive descendant, and its route is one of the
 * ones the accessibility suite scans. `focus-order-semantics` — the rule that
 * would object — carries only axe's `best-practice` tag and is outside
 * `WCAG_TAGS` in `tests/accessibility/axe-policy.ts`, so it is reported in the
 * other bucket rather than counted as a WCAG failure.
 *
 * ── THREE THINGS IT IS NOT, AND WHAT EACH ONE WOULD CLAIM INSTEAD ─────────
 * - NOT `PermissionNotice`. That renders a `PermissionDecision`'s own
 *   explanation as prose where a decision was refused; it draws no setting
 *   and shows no value, and it renders NOTHING for an `allowed` decision. A
 *   locked always-sent notification is not a refusal at all — the setting is
 *   ON, permanently, and the reader is being told so.
 * - NOT ABSENT. ABSENT is for a capability that exists nowhere and for a
 *   person who never holds it, where a drawn control would invite the belief
 *   the right exists somewhere. Here the source draws the control on purpose.
 * - NOT STATE-06 (`src/ui/screen-state.ts`), whose contract is one banner
 *   naming one cause for a whole screen and whose `neverDo` forbids
 *   scattering the cause across several messages. A preferences screen has a
 *   different reason per locked category and is not read-only: the
 *   Configurable group is fully writable on the same screen.
 *
 * It also does not overlap `@/ui/doh/CrossSurfaceStatement` or
 * `@/ui/doh/SeamNotice`, both of which state that a capability is somewhere
 * ELSE — permanently on another surface, or arriving with a later slice.
 * A locked control states that the capability is HERE and fixed. Nothing in
 * this slice's load needed either of those two widened; see the report.
 */
export interface LockedControlProps {
  /**
   * The setting's own identifier, QUALIFIED, and the qualification is a rule
   * the component enforces rather than a convention. Three HTML ids and a
   * `data-` attribute are derived from it, so it must be document-unique and
   * usable as an `id`.
   *
   * A BARE REGISTER IDENTIFIER IS REFUSED, and this doc used to offer one as
   * its example. `NOTIF-059` names two different notifications: the two
   * registers in `@/registry/signals` both number from `NOTIF-001` and agree
   * on none of their twenty-five overlapping names, which is why that module
   * makes a bare `NOTIF-*` literal unholdable and hands out a branded
   * `NotificationKey` instead. Two callers reading different registers would
   * emit one id twice into one document — two locked controls sharing one
   * `aria-labelledby` target, which is a rendering defect and an
   * accessibility one at the same time. So `AAA-999` throws below and the
   * caller must say which register it read: `ch30c2-NOTIF-059` is the form
   * `MOD-DOH-10`'s preference screen passes.
   *
   * IT IS STILL `string`, NOT `NotificationKey`, AND THAT IS A DECISION.
   * Taking the branded key would couple a generic UI primitive to one domain
   * register, and the brand's own value is `register#IDENT` — a `#` and a `.`
   * that no HTML id may carry — so the component would have to RE-ENCODE it,
   * which is a second spelling of the qualification and the collision back
   * again by another route. The rule is stated here and checked at run time;
   * the type cannot express it without importing the register.
   */
  readonly controlId: string
  /** The setting, in the source's own words. Never blank. */
  readonly label: string
  /**
   * The value the setting is fixed AT, in words — "Always sent", "On", "In-app
   * only". A lock with no visible value is a claim with no subject: the reader
   * cannot tell whether they are locked into the state they want.
   */
  readonly settingValue: string
  /**
   * Why it is locked, inline, in the source's own words. Never blank — a
   * locked control with no explanation is the exact thing L73702 forbids, so
   * it throws rather than rendering.
   */
  readonly reason: string
  /**
   * What the reader CAN still change about this category, or `null` when the
   * answer is nothing. This is what separates the storyboard's two locked
   * groups without a second component: Always sent is `null`, and Protected
   * carries its remaining options. L73704 renders both halves in one
   * sentence — "Containment notifications cannot be turned off. You can
   * change who receives them and reduce email frequency."
   *
   * Required-but-nullable rather than optional: a caller that omits it has
   * not stated which of the two groups this control is in, and a silent
   * default would put every Protected category in the Always-sent group.
   */
  readonly remains: string | null
}

export function LockedControl({
  controlId,
  label,
  settingValue,
  reason,
  remains,
}: LockedControlProps) {
  // Fails closed rather than rendering a lock nobody can account for. Both
  // fields are load-bearing: a blank reason is the defect the storyboard
  // names, and a blank label leaves a lock over an unnamed setting, which is
  // visible without being legible.
  if (label.trim() === '' || reason.trim() === '') {
    throw new Error(
      `LockedControl \`${controlId}\` needs a label and an inline reason: a locked control that ` +
        'states no reason is the disabled-control-with-no-explanation the preference storyboard ' +
        'refuses.',
    )
  }
  // THE ID RULE, ENFORCED — see `controlId`'s doc for why. Two checks, and
  // they catch the two things the prop's type cannot: an id that is not a
  // usable HTML id (which is what passing a branded `NotificationKey` through
  // would be, `#` and `.` and all), and a BARE register identifier, which
  // names two rows when two registers number alike.
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(controlId)) {
    throw new Error(
      `LockedControl \`${controlId}\` is not usable as an HTML id, and three ids and a data ` +
        'attribute are derived from it. A branded register key is not an id — qualify it into one.',
    )
  }
  if (/^[A-Za-z]+-\d+$/.test(controlId)) {
    throw new Error(
      `LockedControl \`${controlId}\` is a bare register identifier and does not identify one ` +
        'row: two registers numbering from the same start collide on it, and two locked controls ' +
        'would then share one id and one aria-labelledby target. Qualify it with the register — ' +
        '`ch30c2-NOTIF-059`, not `NOTIF-059`.',
    )
  }
  const labelId = `${controlId}-locked-label`
  const reasonId = `${controlId}-locked-reason`
  const remainsId = `${controlId}-locked-remains`
  return (
    <div
      role="group"
      tabIndex={0}
      aria-labelledby={labelId}
      aria-describedby={remains === null ? reasonId : `${reasonId} ${remainsId}`}
      data-testid="locked-control"
      data-locked-control={controlId}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-3"
    >
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <span id={labelId} className="font-medium text-[var(--color-ink)]">
          {label}
        </span>
        <StatusPill tone="neutral" icon="🔒" label={`Locked — ${settingValue}`} />
      </p>
      <p id={reasonId} className="mt-1 text-sm text-[var(--color-ink-muted)]">
        {reason}
      </p>
      {remains === null ? null : (
        <p id={remainsId} className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {remains}
        </p>
      )}
    </div>
  )
}
