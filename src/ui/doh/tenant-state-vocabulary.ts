import { TENANT_STATES, type TenantState } from '@/surfaces/doh/tenant-state'
import type { StatusTone, SelectOption } from '@/ui/primitives'

/**
 * The WORDS and the TONE for a tenant state — presentation vocabulary over a
 * closed union, held once.
 *
 * It lives under `src/ui/` rather than beside the union in
 * `@/surfaces/doh/tenant-state`, on the division this codebase already draws:
 * `src/surfaces/**` is the spine — the states, the write-class table and
 * `writeAllowed` — and knows nothing about how anything renders, while
 * `src/ui/**` holds what a reader sees. `TENANT_STATE_TONE` settles it on its
 * own: its values are `StatusTone`, a `@/ui/primitives` type, so putting it in
 * the spine would point the spine at the rendering layer. `src/ui/screen-state.ts`
 * is the existing precedent for a data-only vocabulary module under `src/ui/`.
 *
 * Each map is checked exhaustively against `TenantState` rather than trusting a
 * bare `Record`, in the same idiom the spine uses (`_tenantStatesExhaustive`):
 * a sixth state fails to compile here rather than rendering a blank label.
 */

/** Never a bare identifier in the interface (`RouteDefinition.title`'s rule,
 *  `src/routes/definitions.ts`). The token stays the data; this is the label. */
export const TENANT_STATE_LABEL = {
  active: 'Active',
  'soft-suspended': 'Suspended — billing (soft)',
  'hard-suspended': 'Suspended — read-only (hard)',
  'compliance-suspended': 'Suspended — compliance',
  archived: 'Closed — archived',
} as const satisfies Record<TenantState, string>

type MissingFromStateLabels = Exclude<TenantState, keyof typeof TENANT_STATE_LABEL>
const _stateLabelsExhaustive: MissingFromStateLabels extends never ? true : never = true
void _stateLabelsExhaustive

/** Every tenant state as a `Select` option, labelled through the map above.
 *  Seven Hub screens each hand-built this exact list with `label: s` — the
 *  raw token, e.g. `compliance-suspended` — instead of the label; one had
 *  already been fixed in isolation with its own inline version of this same
 *  map. This is the one place both classes of caller should get it from. */
export const TENANT_STATE_OPTIONS: readonly SelectOption[] = TENANT_STATES.map((s) => ({
  value: s,
  label: TENANT_STATE_LABEL[s],
}))

/** Colour is never load-bearing alone (`StatusPill`'s rule) — the pill this
 *  feeds carries its label beside the tone. */
export const TENANT_STATE_TONE = {
  active: 'ok',
  'soft-suspended': 'attention',
  'hard-suspended': 'attention',
  'compliance-suspended': 'blocked',
  archived: 'neutral',
} as const satisfies Record<TenantState, StatusTone>

type MissingFromStateTones = Exclude<TenantState, keyof typeof TENANT_STATE_TONE>
const _stateTonesExhaustive: MissingFromStateTones extends never ? true : never = true
void _stateTonesExhaustive
