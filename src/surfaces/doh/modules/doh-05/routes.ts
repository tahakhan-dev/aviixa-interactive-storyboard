import type { HubShellUncataloguedScreen } from '../../../../../app/hub/HubShell'
import { dohScreenById } from '@/surfaces/doh/screens'

/**
 * The two routes `MOD-DOH-05` serves, and the header both render under.
 *
 * TWO ROUTES FOR ONE MODULE, WHICH THE HUB RAIL CANNOT YET EXPRESS. The
 * rail is keyed one route per module — `/hub/${module.slug}/` — and
 * catalogue B gives `SCR-DOH-12` a navigation entry of its own,
 * "Operations home, work group", rather than reaching it from the Job list.
 * So the second route is linked from the first and from the module header
 * rather than from the rail, and the two screens link to each other.
 *
 * WHY `HubShell`'S UNCATALOGUED-SCREEN MODE AND NOT ITS MODULE MODE.
 * `HubShellProps.module` takes a `DohModuleDefinition`, and `MOD-DOH-05` is
 * still listed in `DOH_OUT_OF_SLICE_MODULES` — registering it means editing
 * `src/surfaces/doh/modules.ts`, which three sibling module tasks are
 * consuming concurrently in this same wave, and four tasks editing one
 * closed union is how a shared file loses a member. The header below states
 * the module identifier and its catalogue-B screen annotations itself, so
 * nothing about the screen's identity is lost by taking the third mode; what
 * IS lost is the rail entry, and that is recorded rather than worked around
 * with a hand-written rail.
 */

export const JOB_LIFECYCLE_ROUTE = '/hub/job-lifecycle-and-approval/'
export const APPROVAL_QUEUE_ROUTE = '/hub/job-approval-queue/'

/** Card L27676 for the name; card L27677 for the purpose, quoted. */
export const MODULE_HEADER: HubShellUncataloguedScreen = {
  title: 'Job Lifecycle and Approval',
  annotation: `MOD-DOH-05 · ${dohScreenById('SCR-DOH-10').id} · ${dohScreenById('SCR-DOH-11').id} · ${dohScreenById('SCR-DOH-12').id} — annotations, never route keys. This module serves two routes because catalogue B gives the approval queue its own navigation entry; the module rail is keyed one route per module and does not yet offer either.`,
  purpose:
    'Hold the standing definition of work, gate it through an absolute segregation of duties, and route version-adoption decisions to an accountable owner.',
}

/** The same header, with the queue named as the current screen. */
export const QUEUE_HEADER: HubShellUncataloguedScreen = {
  ...MODULE_HEADER,
  title: `Job Lifecycle and Approval — ${dohScreenById('SCR-DOH-12').name}`,
}
