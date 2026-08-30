import Link from 'next/link'
import { surfaceById, type SurfaceId } from '@/domain/surfaces'
import type { CrossSurfaceLinkState, CrossSurfaceStatementModel } from '@/surfaces/doh/boundary'

/**
 * An adjacent capability — one this Hub screen touches and another SURFACE
 * owns — rendered where the screen touches it. Usually one of the eight rows
 * of the boundary register (§19.1.2, L25719-L25726); sometimes an adjacent
 * capability the register does not list, which is the second shape below.
 *
 * THE COMPONENT'S WHOLE JOB IS THE THING IT DOES NOT DRAW. AC-DOH-012-3
 * (L25767): "A Hub screen that touches an adjacent capability renders a
 * cross-surface link and no inline editing affordance for that capability."
 * `SB-DOH-003` (L25757) shows both halves — the Job detail version panel
 * carries a link reading "Open in the Standards and Operations Studio" and
 * "carries no editing affordance"; the tier and usage screen carries a line
 * reading "Tier and cap changes are administered by platform support" and
 * "no upgrade button". So there is no `<button>`, no field, no toggle and no
 * disabled control anywhere below, and there is no prop that could add one.
 * A disabled control would be its own false claim: it implies a condition
 * that could become true, and this boundary does not move.
 *
 * IT IS NOT `SeamNotice`, AND THE DIFFERENCE IS A CLAIM ABOUT THE PRODUCT.
 * `@/ui/doh/SeamNotice` says "not built here — owned by module X, slice N",
 * which is true of something arriving later and false of an act that
 * permanently lives on another surface. Both components render a bordered
 * note over a capability this screen does not carry, and only one of them is
 * honest about any given case.
 *
 * THIS COMPONENT HOLDS NO POLICY AND COMPUTES NO REACH. It is handed the
 * model — including whether the link renders at all, which is a checked
 * routing question `@/surfaces/doh/boundary` answers against the route
 * registry, not a question a component may answer for itself.
 *
 * ── THE SECOND SHAPE: ADJACENT, AND NOT ON THE REGISTER ────────────────────
 * `crossSurfaceStatement(id, role)` is keyed on `DohBoundaryId`, so it can
 * only build a model for one of the eight. Three rows shipped in slice 6 are
 * adjacent to a capability the register does not list — `MOD-DOH-08` rows 5
 * and 8 (anomaly-severity reclassification, and the Severity 1 lot-hold
 * release which is Client Command Center action 4) and `MOD-DOH-07` row 4
 * (mid-shift reassignment, Command Center action 8). None has a
 * `DohBoundaryId`, so none could be handed to this component, and two modules
 * hand-rolled a bordered note of their own instead. `adjacentAffordance`
 * already ANTICIPATED the case — it returns `{ kind: 'cross-surface',
 * boundary: null }` for a row "adjacent to something the register does not
 * list" — and nothing could render that answer. `OffRegisterCrossSurface` is
 * what renders it.
 *
 * MINTING A NINTH REGISTER ROW WAS THE ALTERNATIVE AND IS THE DEFECT IT
 * AVOIDS. The register is what §4.1.2 registers; inventing an entry to make
 * a link checkable would be manufacturing the evidence for the link. So the
 * off-register shape carries its own `offRegisterNote` and the component
 * PRINTS it: a reader is never shown a boundary claim the register does not
 * carry without being told the register does not carry it.
 *
 * ── THE TWO DISCRIMINATIONS THIS KEEPS, WHICH WIDENING COULD HAVE ERASED ───
 * 1. A ROUTING POINTER IS CHECKED, NEVER ASSERTED — `MOD-DOH-05`'s rule, and
 *    slice 5's before it. A reviewer reads a link as a verified fact, so the
 *    link is still handed in and still drawn only on `linkState === 'link'`
 *    with both halves present. Widening the MODEL does not widen the POINTER:
 *    an off-register statement that wants a link has to have had its reach
 *    checked by whoever built it, exactly as `crossSurfaceStatement` checks it
 *    against `@/routes/definitions`. `MOD-DOH-07` declines to draw one at all
 *    on that reasoning and `MOD-DOH-08` draws one against the route registry;
 *    both remain expressible, and neither is decided here.
 * 2. CROSSING A SURFACE IS NOT CROSSING A MODULE. An alternative that lives
 *    on THIS surface — `MOD-DOH-06`'s record-finish window, set on
 *    `SCR-DOH-23` in the tenant administration area, another Hub screen and
 *    slice 12's to build — is not a boundary, and a cross-surface statement
 *    over it would claim another surface owns something this one does.
 *    `owningSurface` is typed `Exclude<SurfaceId, 'SURF-DOH'>` so the case
 *    does not compile, and the guard below refuses it at runtime for a caller
 *    that reached here untyped.
 *
 *    WHAT THAT CASE IS INSTEAD, stated precisely because the loose version of
 *    this sentence is itself a defect. `routedTo[column]` names a capability
 *    **in the same matrix** — that is `MOD-DOH-08`'s rule (`doh-08/rendering`
 *    reads and folds it, so the mechanism is not Studio-only, and
 *    `doh-07/matrix.ts` still says it is), and pointing one at a row the
 *    matrix does not hold is how `stu-06` drew a disabled control for a
 *    persona who could never reach its target. So: same matrix ⇒ `routedTo`;
 *    another Hub SCREEN ⇒ a named place, in the row's own words, which is
 *    what `MOD-DOH-06` draws; another SURFACE ⇒ this component. Three
 *    answers, and only the third one is here.
 *
 * 3. "MET ELSEWHERE" IS NOT "EXISTS NOWHERE", and the two arrive looking
 *    identical — a row refused in all five columns, or `Not applicable` in
 *    all five. `MOD-DOH-06`'s "Pause or stop a run" is "deliberately
 *    impossible from any oversight surface" and `MOD-DOH-07`'s qualification
 *    override has no surface at all; a cross-surface statement over either
 *    would point a reader at a Client Command Center that cannot do it
 *    either. This component cannot tell the two apart and must not try —
 *    the discrimination is the matrix's `surface` classification, and
 *    `@/surfaces/doh/modules` already fixes it: "a capability that exists
 *    NOWHERE is a `screen` row whose every cell refuses". Only an
 *    `another-surface` row reaches `adjacentAffordance`'s cross-surface arm,
 *    so a row that classified itself honestly can never arrive here.
 */

/**
 * An adjacent capability the §19.1.2 register does not list. Carries what a
 * `DohBoundaryRow` would have supplied, from the matrix row's own cell, plus
 * the disclosure that there is no register row behind it.
 */
export interface OffRegisterCrossSurface {
  /** `null` IS the discriminator: there is no register row to point at. */
  readonly boundary: null
  /** The matrix row's own id, for `data-boundary`. */
  readonly rowId: string
  /** The capability, in the row's own words. */
  readonly capability: string
  /**
   * Never `SURF-DOH`. A capability met on this surface is a different module's
   * or a different screen's, and neither is a surface crossing.
   */
  readonly owningSurface: Exclude<SurfaceId, 'SURF-DOH'>
  readonly linkState: CrossSurfaceLinkState
  readonly linkLabel: string | null
  readonly linkHref: string | null
  /** Why there is no link, or which decision is open. Never blank. */
  readonly note: string
  /** Why the register does not list it. Printed, never implied. */
  readonly offRegisterNote: string
  /** The row's own line in the frozen source. */
  readonly sourceRef: string
}

export interface CrossSurfaceStatementProps {
  /**
   * From `crossSurfaceStatement(id, role)` for a registered boundary, or from
   * the module's own matrix row for one the register does not list. Never
   * assembled by hand at the call site either way.
   */
  readonly statement: CrossSurfaceStatementModel | OffRegisterCrossSurface
}

export function CrossSurfaceStatement({ statement }: CrossSurfaceStatementProps) {
  const { linkState, linkLabel, linkHref, note } = statement
  // BOTH GUARDS, and the cast is why the second one still exists. The type
  // above already refuses `SURF-DOH`, so this comparison is unreachable from
  // typed code and TypeScript says so — but a value that arrived through an
  // `any` or an unvalidated boundary still has to fail closed rather than
  // render a false boundary claim. `src/policy/evaluate.ts` keeps its
  // tenant-isolation check for exactly this reason and states it there.
  if (statement.boundary === null && (statement.owningSurface as SurfaceId) === 'SURF-DOH') {
    throw new Error(
      'CrossSurfaceStatement is for crossing a SURFACE, not a module: ' +
        `\`${statement.rowId}\` names the Delivery Operations Hub as its owner. A capability met ` +
        'on another Hub screen is a routed pointer or a named place, never a cross-surface boundary.',
    )
  }
  const registered = statement.boundary !== null
  const view =
    statement.boundary === null
      ? {
          id: statement.rowId,
          capability: statement.capability,
          surfaceName: surfaceById(statement.owningSurface).name,
          footer: `${statement.offRegisterNote} ${statement.sourceRef}`,
        }
      : {
          id: statement.boundary.id,
          capability: statement.boundary.capability,
          surfaceName: statement.owningSurfaceName,
          footer: `${statement.boundary.owningSurfaceText}. ${statement.boundary.sourceStatus} ${statement.boundary.sourceRef}`,
        }
  return (
    <div
      role="note"
      data-testid="cross-surface-statement"
      data-boundary={view.id}
      data-registered={String(registered)}
      data-link-state={linkState}
      className="rounded-[var(--radius-surface)] border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-4 text-sm"
    >
      <p className="font-medium text-[var(--color-ink)]">
        Cross-surface boundary — owned by the {view.surfaceName}
      </p>
      <p className="mt-1 text-[var(--color-ink-muted)]">{view.capability}</p>
      <p data-testid="cross-surface-note" className="mt-1 text-[var(--color-ink-muted)]">
        {note}
      </p>
      {linkState === 'link' && linkHref !== null && linkLabel !== null ? (
        <p className="mt-2">
          <Link href={linkHref} className="underline text-[var(--color-ink)]">
            {linkLabel}
          </Link>
        </p>
      ) : null}
      <p data-testid="cross-surface-source" className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {view.footer}
      </p>
    </div>
  )
}
