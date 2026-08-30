/**
 * FIVE-SURFACE CONVERGENCE VALIDATION — §36.7, "Five-Surface Convergence
 * Validation" at L80603, run as step 35 of the reconnection protocol.
 *
 * Five surfaces show pictures of the same work. Convergence validation is the
 * check that they agree, or that where they do not, the difference is stated
 * and visible. L80647 — "It shows three outcomes rather than two: agreement,
 * honest divergence, and unexplained divergence."
 *
 * ── THE OBLIGATION TABLE ───────────────────────────────────────────────────
 * Header L80668, separator L80669, FIVE data rows L80670-L80674. Four columns:
 * Surface, What it must agree on, Expected divergence displayed, Unexplained
 * divergence a defect. Transcribed header-keyed; `cells` is a total `Record`.
 *
 * FIVE ROWS, NOT THREE. The dispatch summarised the Hub, the Studio and the
 * Command Center. The table also carries the Frontline Worker Application
 * (L80673) and the Super Admin platform console (L80674), and the section is
 * named for five surfaces throughout — L80619's own list runs to five, and the
 * step is L79965's "Five-surface convergence validation". Dropping two rows
 * would have left two surfaces with no obligation and the comparator unable to
 * classify anything they reported.
 *
 * ── THE RULE THE THIRD VERDICT TURNS ON ────────────────────────────────────
 * L80658 — "a difference that is expected but not shown is an unexplained
 * difference for this purpose, because the honesty rule is about what the user
 * sees, not about what the platform knows."
 *
 * So `expected` alone never buys a pass. A surface that quietly agrees when it
 * should be SHOWING a stated divergence fails, and it fails as `unexplained
 * divergence` — not as a lesser thing, and not as `converged`. This is the one
 * place a comparator would be tempted to be generous, and generosity here
 * produces exactly the defect the section exists to catch: a supervisor acting
 * on a picture that looks settled. The fallback contract `FB-SYNC-06` (L80676)
 * states it as an invariant at L80683 — "every expected divergence is actually
 * displayed".
 *
 * ── AND THE HUB HAS NO EXPECTED DIVERGENCE AT ALL ──────────────────────────
 * Its third cell (L80670) is `Not applicable`, because the Hub IS the
 * reference the comparison is made against. A caller reporting a Hub
 * difference as expected is contradicting the table, so the surface's own row
 * overrules the claim and the difference is unexplained. `expectsNoDivergence`
 * reads that off the transcribed cell rather than hardcoding one surface, so a
 * corrected transcription moves the rule with it.
 *
 * ── WHAT THE SESSION VERDICT MEANS ─────────────────────────────────────────
 * Honest divergence is a PASS. L80643 routes it into the same validated node
 * as agreement, and L80678 marks the session converged on "All five
 * obligations satisfied or divergence honestly displayed". Only unexplained
 * divergence fails, and it fails twice over — L80659, "Unexplained differences
 * raise a convergence exception to the client's platform team, and the session
 * is marked not converged", which L80644 restates as "Session marked not
 * converged; no surface claims otherwise".
 *
 * This module compares and classifies. It changes nothing: L80693 says
 * convergence validation "is a read-and-compare mechanism only".
 */
import type { SurfaceId } from '@/domain/surfaces'

/* ── the obligation table ──────────────────────────────────────────────── */

/** The four columns of L80668, in the source's own order. */
export const CONVERGENCE_COLUMNS = [
  'Surface',
  'What it must agree on',
  'Expected divergence, displayed',
  'Unexplained divergence, a defect',
] as const

export type ConvergenceColumn = (typeof CONVERGENCE_COLUMNS)[number]

export interface ConvergenceObligation {
  /** Keyed on the five ids already settled in `@/domain/surfaces`. */
  readonly surface: SurfaceId
  readonly line: number
  readonly cells: Readonly<Record<ConvergenceColumn, string>>
}

export const CONVERGENCE_OBLIGATIONS = [
  {
    surface: 'SURF-DOH',
    line: 80670,
    cells: {
      Surface: 'Delivery Operations Hub',
      'What it must agree on':
        'The accepted set, conflict events, quarantine entries, command states, the audit chain',
      'Expected divergence, displayed':
        '`Not applicable — the Hub is the record of truth and is the reference for the comparison`',
      'Unexplained divergence, a defect': 'Any accepted capture absent from the record',
    },
  },
  {
    surface: 'SURF-STU',
    line: 80671,
    cells: {
      Surface: 'Standards and Operations Studio',
      'What it must agree on': 'The pinned version each run executed against',
      'Expected divergence, displayed':
        'A version published after the run started, which the run correctly does not adopt because it stays pinned',
      'Unexplained divergence, a defect':
        'A landed record claiming a version the Studio never published',
    },
  },
  {
    surface: 'SURF-CC',
    line: 80672,
    cells: {
      Surface: 'Client Command Center',
      'What it must agree on': 'Aggregates, drill views, freshness markers, as-of stamps',
      'Expected divergence, displayed':
        'Offline devices shown offline with pending counts; holds shown as issued, propagating, or in force per device; late captures flagged',
      'Unexplained divergence, a defect':
        'A tile serving a stale figure without a stale as-of stamp',
    },
  },
  {
    surface: 'SURF-FL',
    line: 80673,
    cells: {
      Surface: 'Frontline Worker Application',
      'What it must agree on': 'Acknowledged set, pending count, applied commands',
      'Expected divergence, displayed':
        'Commands not yet delivered because the device was offline, shown as pending on the server side and absent on the device side',
      'Unexplained divergence, a defect':
        'A device showing a capture as accepted that the server did not accept',
    },
  },
  {
    surface: 'SURF-SA',
    line: 80674,
    cells: {
      Surface: 'Super Admin platform console',
      'What it must agree on':
        'Sync health, queue depth, last-seen, skew events, storage signals, package inventory',
      'Expected divergence, displayed': 'Telemetry lag within its stated refresh interval',
      'Unexplained divergence, a defect':
        "Telemetry contradicting the session's own recorded outcomes",
    },
  },
] as const satisfies readonly ConvergenceObligation[]

export function convergenceObligation(surface: SurfaceId): ConvergenceObligation {
  const found = CONVERGENCE_OBLIGATIONS.find((o) => o.surface === surface)
  // Every `SurfaceId` has a row, so a miss is a build defect rather than a
  // runtime condition.
  if (found === undefined) throw new Error(`no convergence obligation for ${surface}`)
  return found
}

/**
 * Does this surface's row name an expected divergence at all? Read off the
 * transcribed cell: a row whose expected-divergence column is `Not applicable`
 * admits none, so nothing on that surface can be excused as expected.
 *
 * Anchored to the START of the cell, not a substring search. `Not applicable`
 * appears inside ordinary prose elsewhere in this document, and a substring
 * test would let a row that merely MENTIONS the phrase stop admitting its own
 * real divergence.
 */
export function expectsNoDivergence(surface: SurfaceId): boolean {
  const cell = convergenceObligation(surface).cells['Expected divergence, displayed']
  return cell.replace(/^`/, '').startsWith('Not applicable')
}

/**
 * Lines this module asserts something about, so that every one of them is
 * opened by `tests/unit/offline-convergence.test.ts` at test time rather than
 * being decoration in a comment. A locator no test opens is the shape that put
 * eleven wrong citations into this build.
 */
export const CONVERGENCE_LOCATORS = {
  /** The obligation-table header. */
  obligationHeader: 80668,
  /** The rule: expected but not shown is unexplained. */
  displayRule: 80658,
  /** Three outcomes rather than two. */
  threeOutcomes: 80647,
  /** Honest divergence and agreement both mark the session converged. */
  sessionConverged: 80678,
  /** An unexplained difference raises the exception and fails the session. */
  exceptionRaised: 80659,
  /** And no surface claims otherwise. */
  sessionNotConverged: 80644,
  /** The same invariant, restated in the fallback contract `FB-SYNC-06`. */
  fallbackInvariant: 80683,
} as const

/* ── the comparator ────────────────────────────────────────────────────── */

export const CONVERGENCE_VERDICTS = [
  'converged',
  'honest divergence',
  'unexplained divergence',
] as const

export type ConvergenceVerdict = (typeof CONVERGENCE_VERDICTS)[number]

/** A single difference the step-35 comparison found on one surface. */
export interface ObservedDifference {
  readonly surface: SurfaceId
  /** Does the surface's own row name a difference of this kind as expected? */
  readonly expected: boolean
  /** Is it ACTUALLY on screen? The question L80658 makes decisive. */
  readonly displayed: boolean
  readonly what: string
}

/**
 * A difference is honest only where the table expects it AND the surface is
 * showing it. Anything else is unexplained — including the quiet case, where
 * the difference is genuinely expected and the surface says nothing.
 *
 * `converged` is not reachable here: a difference exists, so the session is
 * not identical. Only `compareSession` can reach it, and only with no
 * differences at all.
 */
export function classifyDifference(
  difference: ObservedDifference,
): Exclude<ConvergenceVerdict, 'converged'> {
  if (expectsNoDivergence(difference.surface)) return 'unexplained divergence'
  if (!difference.expected) return 'unexplained divergence'
  if (!difference.displayed) return 'unexplained divergence'
  return 'honest divergence'
}

export interface ConvergenceOutcome {
  readonly verdict: ConvergenceVerdict
  /**
   * L80678: honest divergence still marks the session converged. L80644: an
   * unexplained one does not, "and no surface claims otherwise".
   */
  readonly converged: boolean
  /** The differences that raise a convergence exception, L80659. */
  readonly exceptions: readonly ObservedDifference[]
  /** Who the exception goes to, L80659. Never a surface, never the tenant. */
  readonly exceptionOwner: string | null
}

export function compareSession(
  differences: readonly ObservedDifference[],
): ConvergenceOutcome {
  const exceptions = differences.filter(
    (d) => classifyDifference(d) === 'unexplained divergence',
  )
  if (exceptions.length > 0) {
    return {
      verdict: 'unexplained divergence',
      converged: false,
      exceptions,
      exceptionOwner: "the client's platform team",
    }
  }
  return {
    verdict: differences.length === 0 ? 'converged' : 'honest divergence',
    converged: true,
    exceptions: [],
    exceptionOwner: null,
  }
}
