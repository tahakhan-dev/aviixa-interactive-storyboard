import type { Metadata } from 'next'
import { saModuleById } from '@/surfaces/sa/modules'
import { CoreAgentsScreen } from './CoreAgentsScreen'
import { AiDegradationOverlay } from '@/ai/five-surface/AiDegradationOverlay'
import { SA_AI_OVERLAY } from '@/surfaces/sa/ai-degradation'

// R4-M01: this read the screen's own `MODULE` export, and the screen carries
// `'use client'`. On the server that binding is a client-reference proxy; a
// PROPERTY read off it does not throw the way a call does, so the built page
// shipped an empty module name in its `<title>` rather than a visible error.
// The module registry is a plain server module and is the same source the
// screen reads, so both sides still agree — this is the shape every sibling
// page in this directory already uses.
const MODULE = saModuleById('MOD-SA-03')

export const metadata: Metadata = { title: `${MODULE.name} — Super Admin Platform Console` }


/**
 * THE SLICE-11 ARTIFICIAL-INTELLIGENCE DEGRADATION OVERLAY MOUNTS HERE, AT THE
 * ROUTE, AND NOT INSIDE THE SCREEN COMPONENT.
 *
 * It was mounted inside the screen first, and six shipped component suites went
 * red. Not on the overlay's content — on its EXISTENCE. Those suites render the
 * screen component directly and query the whole rendered document:
 * `getByRole('table')` becomes ambiguous the moment a second table is on the
 * page, `getByText(/named access class/i)` the moment a second element carries
 * the phrase, and the suites that enumerate every `tr` see the overlay's rows
 * as if they were the module's.
 *
 * Those queries are not wrong and the suites are not mine to edit. They assert
 * the MODULE SCREEN's own contract — this screen's copy, this screen's tables,
 * this screen's rows — and the overlay is not part of that contract. It is a
 * slice-11 addition to the ROUTE. Mounting it here keeps each screen-contract
 * test measuring exactly what it was written to measure, and the overlay is
 * still reachable from `app/` because this file is the route.
 *
 * There is a second reason this overlay is careful on this surface. The console
 * carries a forbidden-copy rule under D10: four words that are audit-integrity
 * claims the source does not support here may not appear in its copy, and a
 * gate enforces it over the surface's own files. `AC-43-356` at L91309 states
 * its check method with one of those four, in an entirely unrelated sense. The
 * overlay withholds that clause and renders the reason beside it rather than
 * paraphrasing the criterion or dropping it, so no file of this task spells any
 * of the four. Reported as a seam: the collision is real, and neither rule is
 * weakened to resolve it.
 */
export default function CoreAgentsPage() {
  return (
    <>
      <CoreAgentsScreen />
      <AiDegradationOverlay overlay={SA_AI_OVERLAY} mountedOn="MOD-SA-03 — Core Agents and Composed-Agent Review" />
    </>
  )
}
