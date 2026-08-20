import type { PermissionDecision } from '@/policy/decision'
import { Button } from '@/ui/primitives'
import { ProhibitionNotice } from '@/ui/sa/ProhibitionNotice'

/**
 * ONE rendering rule for every write control on a Hub module screen.
 *
 * Four branches, applied in the order the rules bind — the role first, then
 * the evaluator's own refusal, then the tenant state gate, then the object's
 * own condition. Three module screens each carried a hand-inlined copy of
 * exactly this; two of them agreed on every branch and differed only in the
 * words, so those two now route through here.
 *
 * THIS COMPONENT HOLDS NO POLICY AND CANNOT. The decision is HANDED IN,
 * never computed here: `@/policy/decision` is imported for its TYPE only
 * (the import is erased at compile time and carries no runtime value), and
 * `tests/coverage/contract-gates.test.ts` fails the build if anything under
 * `src/ui/` value-imports `@/policy` or re-derives a grant.
 *
 * IT ALSO SETTLES NOTHING. Whether a role-refused control should render as
 * nothing at all or as a control disabled with its reason is UNSETTLED in
 * the frozen source — a source adjudication returned inconsistent at
 * named-test strength. Each module's CURRENT rendering is preserved exactly.
 * What this file buys is that when the question IS settled, the branch flips
 * in one place instead of once per module.
 *
 * ONE CLASSIFICATION INSIDE THAT QUESTION IS ALREADY DECIDED, and the ABSENT
 * branch now reflects it. `ROLE_NOT_GRANTED` is written by evaluators for TWO
 * situations that the slice-4 adjudication separates:
 *
 * - a CATEGORICAL prohibition — nobody holds the capability, or this person
 *   never holds it in any circumstance. Nothing is drawn, because a disabled
 *   control invites the belief the right exists somewhere.
 * - a grant this person DID hold and no longer holds — revoked, expired, or
 *   assigned but not yet active. They are refused here, now, and the disabled
 *   control carrying the reason is what teaches the rule at the moment it
 *   binds (L34605: "the session is not silently degraded").
 *
 * Keying ABSENT on the reason code alone collapsed the second onto the first
 * and told a person whose grant was revoked that it had never existed. The
 * branch therefore keys on the OUTCOME as well — the token the source
 * actually writes — so only `explicitlyProhibited` renders absent, and a
 * revoked grant (`unavailable`, same reason code) falls through to the
 * disabled branch below with its own explanation and condition. `src/studio/
 * modules/stu-18/rendering.ts` reached this rule independently and is where
 * the collision was first named.
 *
 * This narrows ONE branch. It does not choose a side in the general question
 * above: the categorical case still renders absent, exactly as the
 * `role-refused-write-control` fixture in `tests/coverage/slice-04-gates.
 * test.ts` pins it.
 */
export interface WriteControlProps {
  readonly label: string
  /** Handed in by the screen. Never computed here. */
  readonly decision: PermissionDecision
  readonly roleName: string
  /** From `writeAllowed` over the one write-class table. */
  readonly gateReason: string | null
  /** From the state of the object this control acts on. */
  readonly objectReason: string | null
  /**
   * The module's own wording for the role-refused case, rendered as the
   * ABSENT note. Required rather than optional (the reviewer's sketch marked
   * it `?`): every caller states its own wording, and a default here would
   * be one module's noun rendered silently under another module's control.
   */
  readonly refusalNote: string
  /**
   * The module's own clause for the D7 sentence — the text between
   * "because " and " (D7)". Required for the same reason as `refusalNote`.
   */
  readonly neverQueuedNote: string
  readonly onAct: () => void
}

export function WriteControl({
  label,
  decision,
  roleName,
  gateReason,
  objectReason,
  refusalNote,
  neverQueuedNote,
  onAct,
}: WriteControlProps) {
  if (decision.reasonCode === 'ROLE_NOT_GRANTED' && decision.outcome === 'explicitlyProhibited') {
    return <ProhibitionNotice rendering={{ kind: 'absent', note: refusalNote }} />
  }
  if (decision.outcome !== 'allowed') {
    return (
      <Button
        disabledReason={`${decision.explanation}${
          decision.conditionToEnable !== null ? ` ${decision.conditionToEnable}` : ''
        } Nothing here is queued — never queued, in any state — because ${neverQueuedNote} (D7). Viewing as ${roleName}.`}
      >
        {label}
      </Button>
    )
  }
  if (gateReason !== null) return <Button disabledReason={gateReason}>{label}</Button>
  if (objectReason !== null) return <Button disabledReason={objectReason}>{label}</Button>
  return <Button onClick={onAct}>{label}</Button>
}
