/**
 * The SURF-DOH spine, part 3 of 6: scope resolution. Spec §2 S5.
 *
 * Three orthogonal dimensions, held simultaneously, additive, and a scope
 * NARROWS a role and never widens it (L17470). Scopes do not merge across
 * grants (`AC-16-02`, L20046).
 */
export type DohScope = 'tenant' | 'site' | 'area'

export const DOH_SCOPES = ['tenant', 'site', 'area'] as const satisfies readonly DohScope[]

type MissingFromDohScopes = Exclude<DohScope, (typeof DOH_SCOPES)[number]>
const _dohScopesExhaustive: MissingFromDohScopes extends never ? true : never = true
void _dohScopesExhaustive

/**
 * Cell, Job and worker scoping are deferred beyond V1 and no rule may
 * depend on them (L14515, L16370). Named here, deliberately kept OUT of
 * `DohScope`, so a later module can render them ABSENT rather than
 * disabled (L23918) without inventing a fourth live dimension to do it.
 */
export type DeferredDohScope = 'cell' | 'job' | 'worker'

export const DEFERRED_DOH_SCOPES = ['cell', 'job', 'worker'] as const satisfies readonly DeferredDohScope[]

type MissingFromDeferredScopes = Exclude<DeferredDohScope, (typeof DEFERRED_DOH_SCOPES)[number]>
const _deferredScopesExhaustive: MissingFromDeferredScopes extends never ? true : never = true
void _deferredScopesExhaustive
