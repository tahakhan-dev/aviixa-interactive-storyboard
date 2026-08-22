import { FreshnessLabel } from '@/ui/primitives'
import { CommandStateBadge } from '@/ui/sa/CommandStateBadge'
import type { CommandState } from '@/surfaces/sa/command-state'
import { fold, isBareClaim, phrasingMatches } from './lexicon'

/**
 * # THE THREE-CLAUSE ELEMENT TEST, AND THE CLAUSE THIS BUILD DID NOT HAVE
 *
 * L78390 states it: an element passes only if all three clauses hold.
 *
 *   L78392  the ORIGIN clause — the element names where the fact came from,
 *           the device or the server's own record.
 *   L78393  the AGE clause — if the element derives from device state, it
 *           carries the age of that knowledge.
 *   L78394  the EFFECT clause — if the element describes an intent aimed at a
 *           device, it names the command's true state and does not use any
 *           word implying completion until acknowledgement and reconciliation.
 *
 * `src/ui/primitives/FreshnessLabel.tsx` already carries origin and age, and is
 * composed here rather than re-implemented. Nothing in this build bound a
 * rendered element to a `CommandState`, which is the effect clause and the one
 * the absolute rule at L78386 turns on. That binding is what this module adds.
 *
 * ## THE BINDING IS THE TYPE, NOT A GUARD
 *
 * `ElementFact` and `ElementIntent` are discriminated unions, so a
 * device-derived fact WITHOUT an age and a device-aimed intent WITHOUT a
 * `CommandState` are both unrepresentable rather than merely rejected. It is
 * the mechanism `src/surfaces/doh/job-owner.ts` uses for a contradicted matrix
 * cell: the defect is not forbidden by a check, it cannot be written down.
 *
 * The fifteen states are consumed from `src/surfaces/sa/command-state.ts`,
 * which already carries the source order and a compile-time exhaustiveness
 * check. There is no second union here; a second spelling of a ruling that
 * already exists is the defect this build records most often.
 *
 * ## WHERE COMPLETION WORDING BECOMES LEGAL, AND WHAT SETTLES IT
 *
 * L78394 licenses completion wording only after acknowledgement and
 * reconciliation, which reads two ways: at `acknowledged`, or only once
 * `reconciled` as well. `AC-OFF-401` at L78442 settles it in the direction the
 * acceptance criterion can be discharged — it forbids completion wording
 * against a device that has not acknowledged — so acknowledgement is the line,
 * and `reconciled` is past it. L78384 says the same thing in the chapter's own
 * simple words: no tick until the tablet itself has said it did it.
 *
 * `applied` is deliberately NOT licensed. It is a state the server can hold
 * about a device that has not spoken since, and licensing it would put the tick
 * back on the server's own say-so.
 *
 * ## TWO DEFECT EXITS, BECAUSE THE SOURCE HAS TWO
 *
 * The diagram at L78409 ends in exactly two defect nodes — L78417 adds origin
 * and age, L78418 replaces completion wording with the command state — and
 * L78430 states that they are the only two failure modes and that every
 * violation catalogued in the table lands on one of them. `HonestyDefect` is
 * those two and is not widened.
 */

/** Clause 1, and clause 2 where it applies: where the fact came from. */
export type ElementFact =
  | { readonly from: 'server-record' }
  | { readonly from: 'device'; readonly asOfLabel: string }

/** Clause 3: whether this element describes an intent aimed at a device. */
export type ElementIntent =
  | { readonly aimedAtDevice: false }
  | { readonly aimedAtDevice: true; readonly commandState: CommandState }

/** The two defect exits of the diagram at L78409, in its own words. */
export type HonestyDefect =
  | 'Defect - add origin and age'
  | 'Defect - replace completion wording with the command state'

/**
 * The states at or past acknowledgement. Typed as `CommandState` so a member
 * that stops being one of the fifteen stops compiling.
 */
export const COMPLETION_LICENSED_STATES: ReadonlySet<CommandState> = new Set<CommandState>([
  'acknowledged',
  'reconciled',
])

/** The origin clause's two answers, in the words L78392 gives them. */
export const ORIGIN_LABEL: Record<ElementFact['from'], string> = {
  device: 'the device',
  'server-record': "the server's own record",
}

export interface ElementUnderTest {
  /** The element's own words — everything it asserts in prose. */
  readonly statement: string
  readonly fact: ElementFact
  readonly intent: ElementIntent
}

/**
 * Which of the two exits this element takes, or neither.
 *
 * The age half of exit one survives the type binding because a required string
 * can still be blank, and a blank as-of label renders as an element that claims
 * an age and carries none.
 *
 * Exit two fires on a phrasing the lexicon prohibits UNLESS the element both
 * declares a device-aimed intent and names a state at or past acknowledgement.
 * A statement carrying such a phrasing while declaring no device intent is the
 * same defect wearing a different hat: L78386 forbids any surface implying an
 * offline tablet received or applied anything, and declaring the element is not
 * about a device does not make the sentence stop saying it.
 */
export function honestyDefects(element: ElementUnderTest): readonly HonestyDefect[] {
  const defects: HonestyDefect[] = []
  if (element.fact.from === 'device' && element.fact.asOfLabel.trim() === '') {
    defects.push('Defect - add origin and age')
  }
  const licensed =
    element.intent.aimedAtDevice && COMPLETION_LICENSED_STATES.has(element.intent.commandState)
  if (!licensed) {
    const folded = fold(element.statement)
    const offending = phrasingMatches(folded).filter(
      (m) => m.scope === 'any-rendering' || isBareClaim(folded, m),
    )
    if (offending.length > 0) {
      defects.push('Defect - replace completion wording with the command state')
    }
  }
  return defects
}

export type HonestElementProps = ElementUnderTest

/**
 * The element the three clauses describe, rendered.
 *
 * Origin is always rendered. Age is rendered with it, through the shipped
 * `FreshnessLabel`, exactly when the fact derives from device state — L78393
 * asks for the age of device knowledge and there is no age to state about a
 * record the server holds itself. The command state is rendered through the
 * shipped `CommandStateBadge`, which names it and never collapses it.
 *
 * A defective element THROWS rather than rendering, the same way
 * `src/ui/ScreenStateBoundary.tsx` refuses a terminal command state under
 * STATE-09. An element that cannot be rendered honestly is not rendered.
 */
export function HonestElement({ statement, fact, intent }: HonestElementProps) {
  const defects = honestyDefects({ statement, fact, intent })
  if (defects.length > 0) {
    throw new Error(
      `HonestElement refuses to render: ${defects.join('; ')}. The three-clause test is ` +
        'the frozen source at L78390-L78394 and the rule it serves is at L78386.',
    )
  }
  return (
    <div data-testid="honest-element">
      <p>{statement}</p>
      {fact.from === 'device' ? (
        <FreshnessLabel asOfLabel={fact.asOfLabel} originLabel={ORIGIN_LABEL.device} />
      ) : (
        <p data-testid="honest-element-origin">{ORIGIN_LABEL['server-record']}</p>
      )}
      {intent.aimedAtDevice ? <CommandStateBadge state={intent.commandState} /> : null}
    </div>
  )
}
