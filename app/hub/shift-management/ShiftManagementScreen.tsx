'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AppShell,
  ConfirmDialog,
  DataTable,
  DetailDrawer,
  Form,
  RequireSession,
  SelectField,
  StatusPill,
  TextField,
  Toaster,
  bg,
  borderColor,
  radiusClass,
  textColor,
  useAccessContext,
  useRepository,
  useRepositoryQuery,
  useStore,
  type DataTableColumn,
  type ProductSession,
  type StatusToken,
  type ToastItem,
} from '@/ui/product'
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import { deny } from '@/policy/decision'
import { scopeReferenceMessage } from '@/data/scope-reference'
import { Shift } from '@/data/schemas/org'
import type {
  AccessContext,
  CreateShiftResult,
  RowOf,
  UpdateShiftResult,
  WriteResult,
} from '@/data/repository'
import { dohModuleById } from '@/surfaces/doh/modules'

/**
 * Task 2 (unit-02) — `MOD-DOH-03`, Shift Management: `SCR-DOH-05` ("Shift
 * management", `moduleId: 'MOD-DOH-03'` — `@/surfaces/doh/screens.ts`).
 * This is a route ANNOTATION, not a route key (D1) — this file IS that
 * screen, at `/hub/shift-management/`; the identifier is carried here, in a
 * comment, never rendered as page text.
 *
 * Replaces the previous 1,443-line document-style body (`./fixtures.ts`'s
 * `DOH_SHIFTS` fixture array, a nine-state `ScreenStateBoundary`, a role/
 * tenant-state radio-group pair standing in for a real signed-in identity)
 * with a real Shift register over the repository:
 * `useRepository()`/`useAccessContext()`/`useRepositoryQuery()`, the exact
 * runtime pattern Task 1's `LocationConfigurationScreen.tsx` established
 * one screen over (read in full before this file was written, and this
 * file follows its shape: a screen-level `evaluateAccess` display gate
 * beside the real, enforced authorisation the write doors themselves run,
 * never a hand-rolled `role === '...'` check).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LOCATOR RELOCATION — every identifier `./fixtures.ts` carried, and where
 * the fact it named now lives. (Report carries this same table.)
 * ─────────────────────────────────────────────────────────────────────────
 *  - `OBJ-DOH-SHIFT`, the two-state vocabulary (L27281) → the real `Shift`
 *    schema (`@/data/schemas/org.ts`), `status: 'active' | 'archived'`,
 *    exactly two states, enforced by the schema itself.
 *  - CTL "View Shifts" (L27297) → `VIEW_REQUEST` below and the `DataTable`
 *    it gates. Scoping is real, not simulated: `repository.list(...)`'s own
 *    `withinScope` (`repository.ts`) filters every read by the caller's
 *    tenant already; a Shift's `siteId` narrows further by
 *    `ctx.identity.siteScope` when it is non-empty. Today, every real
 *    sign-in this build produces leaves it empty (same disclosure Task 1's
 *    own header makes) — not staged as a demonstrable state this build
 *    cannot actually produce.
 *  - CTL "Create a Shift" (L27291), "Edit a Shift" (L27292), "Archive a
 *    Shift" (L27293) → `createShift`/`updateShift` (`repository.ts`, this
 *    task) and the generic `update()` door for archive, gated on-screen by
 *    `WRITE_REQUEST` below. `authorizeWrite`'s real `'hub'`-authority floor
 *    (`repository.ts`, `TENANT_OPERATIONAL_WRITERS`) is WIDER than
 *    `./fixtures.ts`'s own reading of these three rows (Tenant Admin only)
 *    — the same disclosed deviation Task 1's own header records for its
 *    own CTL-02/CTL-06, and for the same reason: this build follows the
 *    repository's uniform floor rather than a narrower per-module reading.
 *  - AC-51-13 (L113055, "no two Shifts with overlapping times") → the
 *    overlap refusal, but re-keyed. The outgoing fixture read the rule as
 *    Shift-to-AREA (no two Shifts sharing an Area may overlap); this task's
 *    brief states it as Shift-to-SITE (no two Shifts at the same `siteId`
 *    may overlap `[startTime, endTime)`), and `Shift` carries no per-Area
 *    time window in the real schema for an Area-keyed reading to check
 *    against — `createShift`/`updateShift` (`repository.ts`) enforce the
 *    Site-keyed rule the brief states, naming the specific conflicting
 *    Shift, not a generic "overlap" sentence.
 *  - "Bind a Shift to Areas" (L27294) and DEC-SHIFT-001 (Shift-to-Area
 *    cardinality, open in the source) → NOT BUILT. `Shift.areaIds` exists
 *    in the real schema and renders here as a read-only count (the brief's
 *    own column list: "site, name, start/end, digest delivery time, area
 *    count, status" — no editing control), the same "real gap, disclosed
 *    rather than silent" treatment Task 1's header gives its own unbuilt
 *    CTL-03/CTL-04/CTL-05. A new Shift is created with `areaIds: []`;
 *    binding it to an Area is a future task's control, on this same door
 *    or a sibling one.
 *  - "Set the per-Shift digest delivery time" (L27295, `SCR-TEN-SHIFT-01`
 *    L118001) → the Create/Edit form's "Digest delivery time" field. One
 *    field on the same door as every other Shift field, not a separate
 *    control — the real schema (`Shift.digestDeliveryTime`) carries no
 *    rule requiring it be written independently, and `./fixtures.ts`'s own
 *    reading of "the bound" (a timezone anchor vs. a permitted window) is
 *    UNRESOLVED IN SOURCE per that file's own header; this build reads it
 *    the same way that file did — no numeric window enforced, since the
 *    source states none.
 *  - The inherited-timezone panel, `override-timezone` (L27296) → NOT
 *    CARRIED FORWARD as a rendered mechanism. The real `Shift`/`Site`
 *    schemas make this true by construction rather than by a rule this
 *    screen applies: `Shift` carries no `timezone` field (confirmed against
 *    `org.ts` before writing this file), so there is nothing to inherit
 *    FROM in a typed sense and nothing for an override control to write TO
 *    — the Site column beside each Shift is the only place a reviewer
 *    reads which Site (and therefore which timezone, via `Site.timezone`)
 *    a Shift belongs to.
 *  - `scheduledRunIds`, the archival refusal, `NOTIF-DOH-03-3` → NOT
 *    CARRIED FORWARD. The real `Shift` schema (`org.ts`) carries no
 *    run-reference field at all — no Job/Run integration exists at this
 *    collection's real authority yet (the same absence Task 1's own
 *    `archiveLocationTierEntity` comment records for the location tier) —
 *    so archiving a Shift here is a plain `status: 'archived'` write
 *    through the generic `update()` door, with no children to check: the
 *    brief's own Step 3 confirms `Area.shiftIds` is the real back-reference
 *    (Areas reference Shifts, not the reverse), so a Shift owns nothing
 *    beneath it for an archive-cascade door to protect.
 *  - `SEEDED_ROLE_SCOPES`, `shiftsVisibleTo` → NOT CARRIED FORWARD as a
 *    second, screen-local scope model, same reasoning as Task 1's header.
 *  - The seven-row control matrix, the thirteen-state `ScreenStateBoundary`,
 *    `SHIFT_ANCHORS`, `UNSPECIFIED_IN_SOURCE`/`UNRESOLVED_IN_SOURCE` →
 *    the still-true facts among these that bear on a decision THIS file
 *    actually makes are folded inline above; the remainder (metering,
 *    production-date and escalation resolving against this Shift; the
 *    Worker's read grant landing on no Hub route per D11) are real
 *    still-true facts about the source this build has not re-litigated —
 *    not repeated here because none of them changes what this file
 *    renders, which would be the "narrative paragraph as primary content"
 *    §8.6.2 forbids.
 */

const MODULE = dohModuleById('MOD-DOH-03')

type ShiftRow = RowOf<'shifts'>
type SiteRow = RowOf<'sites'>

const STATUS_LABEL: Readonly<Record<'active' | 'archived', string>> = {
  active: 'Active',
  archived: 'Archived',
}
const STATUS_TONE: Readonly<Record<'active' | 'archived', StatusToken>> = {
  active: 'ok',
  archived: 'offline',
}

function toneFor(status: 'active' | 'archived'): StatusToken {
  return STATUS_TONE[status]
}

/**
 * The whole screen's own view gate, matching `LocationConfigurationScreen
 * .tsx`'s own `VIEW_REQUEST` shape — a real, enforced check rather than
 * left to the nav rail alone. `WORKER` is excluded: it reaches no Hub
 * screen at all (D11), and the outgoing fixture's own Worker cell on this
 * exact row (L27297) collided with that surface decision and lost, by that
 * file's own account.
 */
const VIEW_REQUEST: AccessRequest = {
  action: 'view-shifts',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'],
  sourceRefs: ['L27297', 'SB-DOH-015'],
}

/**
 * Create/edit/archive's real floor: `repository.ts`'s named `createShift`/
 * `updateShift`/`archiveShift` doors govern every Shift write uniformly.
 *
 * FINAL WHOLE-UNIT REVIEW (unit-02, Important 1) — archive used to be the
 * exception named in this paragraph: it went through the GENERIC `update()`
 * door, whose only floor for `shifts` is `defaultWriteRoles('hub')`
 * (`TENANT_OPERATIONAL_WRITERS` — Tenant Admin, Supervisor, Quality
 * Manager), so `L27293` was enforced on this screen as a display gate and
 * nowhere else. `repository.archiveShift` is now that path's own named
 * door, `['TENANT_ADMIN']`, and `confirmArchive` below calls it.
 *
 * CORRECTIVE TASK (unit-02, task-corrective-01) — `allowedRoles` narrowed
 * to `['TENANT_ADMIN']`. An earlier pass of this task read the repository's
 * own `'hub'`-authority floor (`TENANT_OPERATIONAL_WRITERS`) as wider than
 * the outgoing fixture's reading and "disclosed" that as a deliberate
 * deviation; `L27291`/`L27292`/`L27293` (this constant's own citations —
 * the Shift Management roles-and-permissions table's Create/Edit/Archive
 * rows) and that table's own "Security" field ("Tenant Admin only for
 * writes; all other roles read within scope") say otherwise. The screen
 * gate now matches the doors it sits in front of
 * (`CREATE_SHIFT_REQUEST`/`UPDATE_SHIFT_REQUEST` in `repository.ts`,
 * narrowed by the same corrective task), rather than disagreeing with them.
 */
const WRITE_REQUEST: AccessRequest = {
  action: 'configure-shifts',
  allowedRoles: ['TENANT_ADMIN'],
  sourceRefs: ['L27291', 'L27292', 'L27293', 'repository.ts'],
}

/**
 * The plain-language reason a disabled Create/Edit/Archive control on this
 * screen shows a Supervisor or Quality Manager — specific rather than the
 * generic `ROLE_NOT_GRANTED` text, and citing the named source class
 * (never a bare line locator, §8.6.2) `WRITE_REQUEST` above cites.
 */
const WRITE_DENIED_REASON =
  "Only the Tenant Admin may create, edit or archive a Shift — the Shift Management module's own roles-and-permissions table prohibits every other role."

/**
 * §8.6.1 fixture adequacy on the primary table: `pageSize={10}` against
 * Bright Bikes' 25 seeded Shifts (this task's own seed top-up,
 * `scripts/generate-shift-seed.mjs` — see the report's before/after
 * counts) gives three genuinely distinct pages — 10, 10, 5 — a first, a
 * middle and a last-partial, not merely "more than one page". Same
 * precedent `LocationConfigurationScreen.tsx`'s own `SITES_PAGE_SIZE` sets.
 */
const SHIFTS_PAGE_SIZE = 10

const LIST_HREF = '/hub/shift-management/'

export function ShiftManagementScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <ShiftManagementGate session={session} />}
    </RequireSession>
  )
}

function ShiftManagementGate({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  const viewGate = evaluateAccess(VIEW_REQUEST, ctx)
  if (viewGate.outcome !== 'allowed') {
    return (
      <AppShell surface="SURF-DOH" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
        <p data-control-id="shift-management-unavailable" className={`text-sm ${textColor('ink-muted')}`}>
          {viewGate.explanation}
        </p>
      </AppShell>
    )
  }
  return <ShiftManagementBody session={session} ctx={ctx} />
}

/** One drawer, two shapes — `'create'` with a freshly minted pending id, or
 *  `'edit'` over a specific existing row — the same `Tier | 'closed'`-style
 *  discriminated state `LocationConfigurationScreen.tsx`'s own `CreateDrawer`
 *  uses one level up. */
type DrawerState = { readonly mode: 'create'; readonly pendingId: string } | { readonly mode: 'edit'; readonly shift: ShiftRow } | null

function ShiftManagementBody({
  session,
  ctx,
}: {
  readonly session: ProductSession
  readonly ctx: AccessContext
}) {
  const repository = useRepository()
  const store = useStore()
  const searchParams = useSearchParams()

  const shiftsQuery = useRepositoryQuery((r, c) => r.list('shifts', c))
  const sitesQuery = useRepositoryQuery((r, c) => r.list('sites', c))
  const allSites = sitesQuery.all()
  const siteById = new Map<string, SiteRow>(allSites.map((s) => [s.id, s]))
  const activeSites = allSites.filter((s) => s.status === 'active')

  /**
   * Task 6 (unit-02) cross-link: `LocationConfigurationScreen.tsx`'s own
   * Site view (`AreasTier`) links here with `?site=<id>` — a Shift's real
   * `siteId` field is the actual anchor (a Shift belongs to a Site, not a
   * Location), so this is a Site-level filter reached from Task 1's Site
   * detail, same query-param shape `PermissionsScreen.tsx`'s own `?assign=`
   * deep link uses. The id is resolved against `siteById` (already
   * tenant-scoped, `.list()`'s own `withinScope`), so a foreign-tenant or
   * unknown id silently falls back to the unfiltered list rather than
   * leaking whether that id exists.
   */
  const siteFilterId = searchParams.get('site')
  const siteFilter = siteFilterId === null ? null : (siteById.get(siteFilterId) ?? null)

  const [drawer, setDrawer] = useState<DrawerState>(null)
  const [archiveTarget, setArchiveTarget] = useState<ShiftRow | null>(null)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [toasts, setToasts] = useState<readonly ToastItem[]>([])
  /** The last overlap refusal's own conflicting row — read by the "links to
   *  it" panel beside the form, cleared on open/close/success/a different
   *  failure kind. Not the same thing as the plain-language message Form's
   *  own generic error box renders (`toFormResult` below): that box carries
   *  the words, this state carries the LIVE row a click can jump to. */
  const [conflict, setConflict] = useState<ShiftRow | null>(null)

  const writeGate = evaluateAccess(WRITE_REQUEST, ctx)
  const canWrite = writeGate.outcome === 'allowed'

  function pushToast(tone: StatusToken, label: string): void {
    setToasts((prev) => [...prev, { id: `${store.nextSequence()}`, tone, label }])
  }
  function dismissToast(id: string): void {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function openCreate(): void {
    setConflict(null)
    setDrawer({ mode: 'create', pendingId: `SHIFT-${store.nextSequence()}` })
  }
  function openEdit(shift: ShiftRow): void {
    setConflict(null)
    setDrawer({ mode: 'edit', shift })
  }
  function closeDrawer(): void {
    setDrawer(null)
    setConflict(null)
  }

  async function confirmArchive(): Promise<void> {
    if (archiveTarget === null) return
    setArchiveBusy(true)
    const result = await repository.archiveShift(archiveTarget.id, ctx)
    setArchiveBusy(false)
    setArchiveTarget(null)
    if (result.ok) {
      pushToast('ok', `${archiveTarget.name} was archived.`)
    } else {
      pushToast('danger', result.explain)
    }
  }

  /**
   * The one rule the generic write door cannot express, named in full:
   * which Shift conflicts, its own id, and the times it already holds —
   * never a bare "times overlap" sentence (task brief, Step 2).
   */
  function overlapMessage(conflictingShift: ShiftRow): string {
    return (
      `${conflictingShift.name} (${conflictingShift.id}) already runs ${conflictingShift.startTime}` +
      `–${conflictingShift.endTime} at this Site, and the times entered would overlap it. Change or ` +
      `move ${conflictingShift.name} first, or choose times that meet it at an endpoint rather than cross it.`
    )
  }

  /**
   * `createShift`/`updateShift` (`repository.ts`) return a THIRD and
   * FOURTH result arm `Form`'s own generic renderer (`Form.tsx`, typed to
   * `WriteResult<unknown>` alone) cannot show: `'overlap'` and
   * `'invalid-reference'` carry no `PermissionDecision` at all — a caller
   * must not read "these times conflict with another Shift" as "you may
   * not do this." This is the one place both are translated into a
   * `WriteResult`-shaped denial FOR DISPLAY ONLY — the same idiom several
   * `super-admin` screens already use (`namedReason()` in
   * `ConsoleUsersScreen.tsx`/`SupportAccessScreen.tsx`, translating a
   * `PermissionDecision` into screen-local words) — so the plain-language
   * message still renders through `Form`'s own error box, while `conflict`
   * (state, above) drives the richer panel beside it that can actually
   * link to the conflicting row.
   */
  function toFormResult(result: CreateShiftResult | UpdateShiftResult, successLabel: string): WriteResult<unknown> {
    if (result.ok) {
      setConflict(null)
      pushToast('ok', successLabel)
      return result
    }
    if (result.kind === 'overlap') {
      setConflict(result.conflictingShift)
      const explain = overlapMessage(result.conflictingShift)
      return {
        ok: false,
        kind: 'denied',
        decision: deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', explain, {
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
        }),
        reason: 'OBJECT_STATE_INVALID',
        explain,
      }
    }
    if (result.kind === 'invalid-reference') {
      setConflict(null)
      const explain = scopeReferenceMessage(result.problem)
      return {
        ok: false,
        kind: 'denied',
        decision: deny('explicitlyProhibited', 'OBJECT_STATE_INVALID', explain, {
          stage: 'COMMAND_VALIDATION',
          sourceRefs: ['repository.ts'],
        }),
        reason: 'OBJECT_STATE_INVALID',
        explain,
      }
    }
    setConflict(null)
    return result
  }

  async function onCreateSubmit(value: ShiftRow): Promise<WriteResult<unknown>> {
    const result = await repository.createShift(value, ctx)
    return toFormResult(result, `${value.name} was created.`)
  }

  async function onEditSubmit(targetId: string, value: ShiftRow): Promise<WriteResult<unknown>> {
    const result = await repository.updateShift(targetId, value, ctx)
    return toFormResult(result, `${value.name} was updated.`)
  }

  /**
   * Active Sites only, plus the Shift's OWN current Site even if archived
   * (an editor over an existing Shift naming a since-archived Site must
   * still show a value that matches what is actually recorded, rather than
   * silently falling back to the first active Site in the list). Same
   * "active only, current excepted" reasoning `LocationConfigurationScreen
   * .tsx`'s own `ACTIVE_PARENT_SITES` filter uses for the same reason one
   * tier up: the source states no rule either way for whether a Shift may
   * name an archived Site, and this build offers only active Sites going
   * FORWARD while leaving an existing archived-Site Shift readable and
   * editable in its other fields.
   */
  function siteOptions(currentSiteId: string | null) {
    const options = activeSites.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }))
    if (currentSiteId !== null && !activeSites.some((s) => s.id === currentSiteId)) {
      const current = siteById.get(currentSiteId)
      if (current !== undefined) {
        return [{ value: current.id, label: `${current.name} (${current.id}) — archived` }, ...options]
      }
    }
    return options
  }

  const columns: readonly DataTableColumn<ShiftRow>[] = [
    {
      key: 'site',
      header: 'Site',
      sortValue: (s) => siteById.get(s.siteId)?.name ?? s.siteId,
      render: (s) => {
        const site = siteById.get(s.siteId)
        return (
          <span className="flex flex-col">
            <span className={`font-medium ${textColor('ink')}`}>{site?.name ?? s.siteId}</span>
            <span className={`text-xs ${textColor('ink-subtle')}`}>{s.siteId}</span>
          </span>
        )
      },
    },
    {
      // CORRECTIVE TASK (unit-02, task-corrective-01) — this cell no longer
      // doubles as the "open edit" trigger (view and write used to share
      // one control, which meant a Supervisor/Quality Manager either lost
      // the click entirely or reached a writable form the door would only
      // refuse). It is now plain, view-only text — every field it showed is
      // still visible, unchanged, for every role that reaches this screen —
      // and the `edit` column below is the one real write trigger, gated on
      // `canWrite` the same way `ArchiveControl` already was.
      key: 'name',
      header: 'Shift',
      sortValue: (s) => s.name,
      render: (s) => (
        <span className="flex flex-col" data-control-id={`shift-management-row-${s.id}`}>
          <span className={`font-medium ${textColor('ink')}`}>{s.name}</span>
          <span className={`text-xs ${textColor('ink-subtle')}`}>{s.id}</span>
        </span>
      ),
    },
    {
      key: 'block',
      header: 'Start–end',
      sortValue: (s) => s.startTime,
      render: (s) => `${s.startTime}–${s.endTime}`,
    },
    {
      key: 'digest',
      header: 'Digest delivery time',
      sortValue: (s) => s.digestDeliveryTime,
      render: (s) => s.digestDeliveryTime,
    },
    {
      key: 'areas',
      header: 'Areas',
      align: 'end',
      sortValue: (s) => s.areaIds.length,
      render: (s) => s.areaIds.length,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span data-control-id={`shift-management-status-${s.id}-${s.status}`}>
          <StatusPill tone={toneFor(s.status)} label={STATUS_LABEL[s.status]} />
        </span>
      ),
    },
    {
      key: 'edit',
      header: 'Edit',
      render: (s) => <EditControl shift={s} canWrite={canWrite} onOpen={() => openEdit(s)} />,
    },
    {
      key: 'archive',
      header: 'Archive',
      render: (s) => (
        <ArchiveControl
          shift={s}
          canWrite={canWrite}
          onRequestArchive={() => setArchiveTarget(s)}
        />
      ),
    },
  ]

  return (
    <AppShell
      surface="SURF-DOH"
      session={session}
      title={MODULE.name}
      breadcrumbs={[{ label: MODULE.name }]}
      actions={<CreateAction canWrite={canWrite} onOpen={openCreate} />}
    >
      <section aria-labelledby="shift-management-heading" className="mt-6 flex flex-col gap-4">
        <h2 id="shift-management-heading" className={`text-lg font-semibold ${textColor('ink')}`}>
          Shifts
        </h2>
        {siteFilterId !== null ? (
          <p
            data-control-id="shift-management-site-filter-banner"
            className={`text-sm ${textColor('ink-muted')}`}
          >
            {siteFilter !== null
              ? `Filtered to Shifts at ${siteFilter.name}, linked from that Site's own record in Location Configuration.`
              : `"${siteFilterId}" does not match any Site this tenant can read, so no filter is applied.`}{' '}
            <Link
              href={LIST_HREF}
              data-control-id="shift-management-clear-site-filter"
              className={`underline ${textColor('ink')}`}
            >
              Clear filter
            </Link>
          </p>
        ) : null}
        <DataTable
          caption="Shifts"
          columns={columns}
          query={siteFilter !== null ? shiftsQuery.where((s) => s.siteId === siteFilter.id) : shiftsQuery}
          rowId={(s) => s.id}
          search={{
            placeholder: 'Search by name, id or Site',
            match: (s, q) => {
              const needle = q.toLowerCase()
              const site = siteById.get(s.siteId)
              return (
                s.name.toLowerCase().includes(needle) ||
                s.id.toLowerCase().includes(needle) ||
                s.siteId.toLowerCase().includes(needle) ||
                (site?.name.toLowerCase().includes(needle) ?? false)
              )
            },
          }}
          pageSize={SHIFTS_PAGE_SIZE}
          emptyState={{
            title: 'There are no Shifts yet.',
            whatCreatesIt: 'A Tenant Admin creates the first one from Create shift.',
          }}
        />
      </section>

      <DetailDrawer
        open={drawer !== null}
        onClose={closeDrawer}
        title={drawer?.mode === 'edit' ? `Edit ${drawer.shift.name}` : 'Create shift'}
      >
        {drawer?.mode === 'create' ? (
          <Form
            key={drawer.pendingId}
            schema={Shift}
            initial={{ id: drawer.pendingId, status: 'active', areaIds: [] }}
            onSubmit={onCreateSubmit}
            submitLabel="Create shift"
          >
            <SelectField name="siteId" label="Site" required options={siteOptions(null)} />
            <TextField name="name" label="Shift name" required />
            <TextField name="startTime" label="Start time" type="time" required />
            <TextField
              name="endTime"
              label="End time"
              type="time"
              required
              hint="An end earlier than the start is read as crossing midnight."
            />
            <TextField name="digestDeliveryTime" label="Digest delivery time" type="time" required />
            <TextField
              name="nominalProductionDateRule"
              label="Nominal production date rule"
              required
              hint='Free text — the source names this field but states no closed set of values for it. Common values: "same calendar day as shift start", "production date is the shift’s start calendar day, carried across midnight".'
            />
          </Form>
        ) : drawer?.mode === 'edit' ? (
          <Form
            key={drawer.shift.id}
            schema={Shift}
            initial={drawer.shift}
            onSubmit={(value) => onEditSubmit(drawer.shift.id, value)}
            submitLabel="Save changes"
          >
            <SelectField name="siteId" label="Site" required options={siteOptions(drawer.shift.siteId)} />
            <TextField name="name" label="Shift name" required />
            <TextField name="startTime" label="Start time" type="time" required />
            <TextField
              name="endTime"
              label="End time"
              type="time"
              required
              hint="An end earlier than the start is read as crossing midnight."
            />
            <TextField name="digestDeliveryTime" label="Digest delivery time" type="time" required />
            <TextField name="nominalProductionDateRule" label="Nominal production date rule" required />
          </Form>
        ) : null}

        {conflict !== null ? (
          <div
            role="note"
            data-control-id="shift-management-overlap-conflict"
            className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('raised')} p-3`}
          >
            <p className={`text-sm ${textColor('ink')}`}>
              {`The conflicting Shift is ${conflict.name} (${conflict.id}), ${conflict.startTime}–${conflict.endTime}.`}
            </p>
            <button
              type="button"
              data-control-id="shift-management-overlap-conflict-open"
              onClick={() => openEdit(conflict)}
              className={`mt-2 text-sm underline underline-offset-2 ${textColor('ink')}`}
            >
              {`View ${conflict.name}`}
            </button>
          </div>
        ) : null}
      </DetailDrawer>

      {archiveTarget !== null ? (
        <ConfirmDialog
          open
          controlId="shift-management-archive-confirm"
          title={`Archive ${archiveTarget.name}`}
          affectedObjects={[{ id: archiveTarget.id, label: archiveTarget.name }]}
          resultingState={{ subject: 'Status', from: 'Active', to: 'Archived' }}
          confirmLabel="Archive"
          busy={archiveBusy}
          onConfirm={() => void confirmArchive()}
          onCancel={() => setArchiveTarget(null)}
        />
      ) : null}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * The Create action + its role-floor disclosure — same shape
 * `LocationConfigurationScreen.tsx`'s own `CreateAction` uses.
 * ────────────────────────────────────────────────────────────────────── */

function CreateAction({
  canWrite,
  onOpen,
}: {
  readonly canWrite: boolean
  readonly onOpen: () => void
}) {
  const controlId = 'shift-management-create'
  if (canWrite) {
    return (
      <button
        type="button"
        data-control-id={controlId}
        onClick={onOpen}
        className={`${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
      >
        Create shift
      </button>
    )
  }
  return (
    <div className="flex max-w-xs flex-col items-end gap-1">
      <button
        type="button"
        disabled
        aria-describedby={`${controlId}-reason`}
        data-control-id={controlId}
        className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border-strong')} ${bg('sunken')} px-4 py-2 text-sm font-medium ${textColor('ink-subtle')}`}
      >
        Create shift
      </button>
      <p id={`${controlId}-reason`} className={`text-right text-xs ${textColor('ink-muted')}`}>
        {WRITE_DENIED_REASON}
      </p>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * The Edit control — CORRECTIVE TASK (unit-02, task-corrective-01). Same
 * shape as `ArchiveControl` below: a live, enabled control for
 * `canWrite`, a disabled one with a visible, `aria-describedby`-linked
 * reason otherwise. Replaces the row name itself doubling as the "open
 * edit" trigger (see the `name` column's own comment above).
 * ────────────────────────────────────────────────────────────────────── */

function EditControl({
  shift,
  canWrite,
  onOpen,
}: {
  readonly shift: ShiftRow
  readonly canWrite: boolean
  readonly onOpen: () => void
}) {
  const controlId = `shift-management-edit-${shift.id}`
  if (!canWrite) {
    return (
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled
          aria-describedby={`${controlId}-reason`}
          data-control-id={controlId}
          className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-2 py-1 text-xs ${textColor('ink-subtle')}`}
        >
          Edit
        </button>
        <p id={`${controlId}-reason`} className={`text-xs ${textColor('ink-muted')}`}>
          Only the Tenant Admin may edit this.
        </p>
      </div>
    )
  }
  return (
    <button
      type="button"
      data-control-id={controlId}
      onClick={onOpen}
      className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-2 py-1 text-xs font-medium ${textColor('ink')}`}
    >
      Edit
    </button>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * The Archive control. Simpler than `LocationConfigurationScreen.tsx`'s own
 * `ArchiveControl`: nothing sits beneath a Shift in this build's real
 * schema (`Area.shiftIds` is the back-reference; a Shift owns no Location/
 * Area of its own), so there is no active-children sweep to preview here —
 * every write is still authorised for real, server-side, by the generic
 * `update()` door this calls (`repository.ts`).
 * ────────────────────────────────────────────────────────────────────── */

function ArchiveControl({
  shift,
  canWrite,
  onRequestArchive,
}: {
  readonly shift: ShiftRow
  readonly canWrite: boolean
  readonly onRequestArchive: () => void
}) {
  const controlId = `shift-management-archive-${shift.id}`
  if (shift.status === 'archived') {
    return <span className={`text-xs ${textColor('ink-muted')}`}>Already archived</span>
  }
  if (!canWrite) {
    return (
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled
          aria-describedby={`${controlId}-reason`}
          data-control-id={controlId}
          className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-2 py-1 text-xs ${textColor('ink-subtle')}`}
        >
          Archive
        </button>
        <p id={`${controlId}-reason`} className={`text-xs ${textColor('ink-muted')}`}>
          Only the Tenant Admin may archive this.
        </p>
      </div>
    )
  }
  return (
    <button
      type="button"
      data-control-id={controlId}
      onClick={onRequestArchive}
      className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-2 py-1 text-xs font-medium ${textColor('ink')}`}
    >
      Archive
    </button>
  )
}
