'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { checkAreaReference, checkSiteReference, scopeReferenceMessage } from '@/data/scope-reference'
import { Site, Area, Location } from '@/data/schemas/org'
import type { AccessContext, Query, Repository, RowOf, WriteResult } from '@/data/repository'
import { dohModuleById } from '@/surfaces/doh/modules'

/**
 * Task 1 (unit-02) — `MOD-DOH-02`, Location Configuration: `SCR-DOH-04`
 * ("Location hierarchy configuration", `moduleId: 'MOD-DOH-02'`,
 * `catalogueBRoles: 'Tenant Admin'`, `sourceRef: 'L48098, SB-DOH-014
 * L27217'` — `@/surfaces/doh/screens.ts`). This is a route ANNOTATION, not
 * a route key (D1) — this file IS that screen, at `/hub/location-
 * configuration/`; the identifier is carried here, in a comment, never
 * rendered as page text.
 *
 * Replaces the previous 1,846-line document-style body (`./fixtures.ts`'s
 * `DOH_SITES`/`DOH_AREAS`/`DOH_CELLS` fixture arrays, a thirteen-state
 * `ScreenStateBoundary`, a role/tenant-state radio-group pair standing in
 * for a real signed-in identity) with a real Site → Area → Location tree
 * over the repository: `useRepository()`/`useAccessContext()`/
 * `useRepositoryQuery()`, exactly the runtime pattern unit 1 established
 * (`TenantsScreen.tsx`, `ConsoleUsersScreen.tsx` — read in full before this
 * file was written, and this file follows their shape: a screen-level
 * `evaluateAccess` display gate beside the real, enforced authorisation
 * the write door itself runs, never a hand-rolled `role === '...'` check).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LOCATOR RELOCATION — every identifier `./fixtures.ts` carried, and where
 * the fact it named now lives. (Report carries this same table.)
 * ─────────────────────────────────────────────────────────────────────────
 *  - `OBJ-DOH-SITE`/`OBJ-DOH-AREA`/`OBJ-DOH-CELL`, the two-state vocabulary
 *    (L27106) → the real `Site`/`Area`/`Location` schemas
 *    (`@/data/schemas/org.ts`), `status: 'active' | 'archived'`, exactly
 *    two states, enforced by the schema itself rather than a locally
 *    re-declared union.
 *  - D21 (the three flags — `scope-pending`/`unbound`/`archiving`) → NOT
 *    CARRIED FORWARD AS A LIVE MECHANISM. `Site`/`Area`/`Location` carry no
 *    flags field in the real schema (`org.ts`, confirmed against it before
 *    writing this file — this task has no source authority to add one).
 *    `archiving` specifically named a paused-Job-reassignment cascade; this
 *    build's real data layer has no Job-pause integration at this
 *    collection's authority, so `archiveLocationTierEntity`
 *    (`@/data/repository.ts`) takes the alternate path the design spec
 *    itself names — `WF-DOH-02-CASCADE`, "refuse and name every active
 *    child" — rather than simulating a cascade this task cannot honestly
 *    build. See that method's own comment.
 *  - D22 (certification types as a closed, seeded, un-administrable list)
 *    → the real schema disagrees: `Location.requiredCertification` is
 *    `z.string().nullable()`, free text, not a foreign key into a
 *    certification-types collection (no such collection exists in the
 *    §3.1 forty-name list). This build follows the real schema — the
 *    Location create form below takes free text — which resolves D22's
 *    own open question (no create/edit/retire screen for a certification
 *    TYPE) by construction: there is no separate type registry to need
 *    one.
 *  - CTL-01 ("View the location tree", L27117, L27215) → the three-tier
 *    `DataTable` set below. Scoping is real, not simulated:
 *    `repository.list(...)`'s own `withinScope` (`repository.ts`) filters
 *    every read by the caller's tenant already; a Site row itself carries
 *    no `siteId`/`areaId` field to further scope by (so every tenant role
 *    sees every Site of ITS OWN tenant), while an Area's `siteId` and a
 *    Location's `areaId` DO narrow by `ctx.identity.siteScope`/`areaScope`
 *    when those arrays are non-empty. Today, every real sign-in this build
 *    produces (`session.ts#sessionFor`) leaves both empty — no seeded or
 *    signed-in session carries a narrower site/area scope yet, a fact
 *    disclosed here rather than staged as a demonstrable state this build
 *    cannot actually produce. `WORKER` reaches no Hub screen at all (D11);
 *    this file gates the whole body on a real `evaluateAccess` call for
 *    exactly that reason, rather than relying on the nav rail alone to
 *    keep a Worker out of a direct URL.
 *  - CTL-02 ("Create a Site, an Area or a Location", L27118, L26919) → the
 *    Create actions below. `authorizeWrite`'s real `'hub'`-authority floor
 *    (`repository.ts`, `TENANT_OPERATIONAL_WRITERS`) is WIDER than
 *    `./fixtures.ts`'s own reading of L27118 (Tenant Admin only,
 *    Supervisor/Quality Manager/Auditor/Worker all `explicitly-prohibited`)
 *    — see the disclosure beside the Create control below for why this
 *    build follows the repository's own uniform floor rather than the
 *    narrower per-module reading, and the ledger below for both citations.
 *  - CTL-03 ("Edit a name, an address or a contact", L27119) → NOT BUILT.
 *    The task brief's own Step 4 enumerates create, archive and the
 *    timezone field as this task's deliverables; it does not name an edit
 *    control, and none is added here. A real gap, not a silent one — the
 *    identifier is preserved here so a future task that DOES build one
 *    knows what it demonstrates.
 *  - CTL-04 ("Re-parent a Location...", L27149, L27185) and CTL-05
 *    ("Split, merge or re-parent an Area...", L27121) → NOT BUILT, for the
 *    same reason as CTL-03 (out of this task's Step 4 scope) — CTL-05 was
 *    never built by any reading (`explicitly-prohibited` for every role at
 *    V1), so only CTL-04 is a real, disclosed gap here.
 *  - CTL-06 ("Archive a Site or an Area", L27122, L112908) →
 *    `archiveLocationTierEntity` and the per-row Archive control. Same
 *    role-floor deviation as CTL-02 (see above and the disclosure below).
 *    The "cascade must complete reassignment first" reading (L27122) is
 *    realised as this build's OWN alternate path — refuse-and-name rather
 *    than hold-and-cascade — per `WF-DOH-02-CASCADE`.
 *  - CTL-07 ("Reassign a paused Job during the cascade", L27123) → NOT
 *    BUILT. There is no paused-Job state to reassign in this build (see
 *    D21 above) — nothing here could act on it honestly.
 *  - CTL-08 ("Set the Site timezone", L27124, `AC-SCOPE-034` L2612) → the
 *    Site create form's Timezone field, and the read-only "Inherited from
 *    Site" line on the Area/Location tiers. Structurally enforced, not
 *    merely observed: `Area`/`Location` (`org.ts`) carry no `timezone`
 *    field at all, confirmed by reading that schema before writing this
 *    file, so there is no per-Area/per-Shift override this screen COULD
 *    offer even if it wanted to.
 *  - CTL-09 ("Set a Location's required certification", L27125, L27215) →
 *    the Location create form's "Required certification" field and the
 *    Locations table's own column. Free text (see D22 above), not a
 *    picklist — a disclosed deviation from the fixture's own reading, not
 *    an oversight.
 *  - CTL-10 ("View a map of locations", L27126) and CTL-11 ("Create an
 *    equipment record", L27127, `TEST-DOH-02-D4` L27246) → NOT BUILT,
 *    matching every prior reading (`not-applicable`/`explicitly-prohibited`
 *    for every role at V1). No deviation.
 *  - `SEEDED_ROLE_SCOPES`, `visibleSiteIds`/`visibleAreaIds` → NOT CARRIED
 *    FORWARD as a second, screen-local scope model. `repository.ts`'s own
 *    `withinScope` is the one real scoping mechanism now (see CTL-01
 *    above); a second, fixture-driven copy of the same idea would be
 *    exactly the risk `repository.ts`'s own header warns against — a
 *    second place the answer could disagree with the first.
 *  - `AS_OF`, `Connection`, `STATE-07`/`STATE-08`/`STATE-13` (offline/
 *    reconnect/freshness states) → NOT CARRIED FORWARD. This surface has
 *    no offline mode (D7, restated in the outgoing file's own
 *    `NEVER_APPLIES` table); nothing here simulates one.
 *  - `UNSPECIFIED_IN_SOURCE`/`UNRESOLVED_IN_SOURCE` (the nine + five open
 *    questions `./fixtures.ts` recorded) → carried forward inline, above,
 *    everywhere a specific one bears on a decision this file actually
 *    makes (D21, D22, the CTL-02/06 role-floor conflict); the remainder
 *    (no unarchive path, no bulk action, no address-format validation, the
 *    depth-limit-is-unstated note, the re-parent-vs-Area-prohibition
 *    tension, the Quality-Manager-on-the-cascade tension) are real, still-
 *    true facts about the source this build has not resolved differently
 *    — not re-litigated here because none of them changes what THIS file
 *    renders, and repeating them without a decision attached would be the
 *    exact "narrative paragraph as primary content" §8.6.2 forbids.
 */

const MODULE = dohModuleById('MOD-DOH-02')

type SiteRow = RowOf<'sites'>
type AreaRow = RowOf<'areas'>
type LocationRow = RowOf<'locations'>

const STATUS_LABEL: Readonly<Record<'active' | 'archived', string>> = {
  active: 'Active',
  archived: 'Archived',
}
const STATUS_TONE: Readonly<Record<'active' | 'archived', StatusToken>> = {
  active: 'ok',
  archived: 'offline',
}

/**
 * L27124's own timezone list is unstated beyond the two the source's own
 * Bright Bikes examples use (`America/Chicago`, and the seed's Northgate/
 * Lakeside share it too). Six common US zones, IANA names, one of which
 * matches every seeded Bright Bikes Site today — this build's own choice
 * of a workable list, not a source-stated one, disclosed the same way
 * `INVITATION_VALIDITY_DAYS` (`repository.ts`) discloses its own client-
 * delegated figure.
 */
const TIMEZONE_OPTIONS = [
  { value: 'America/Chicago', label: 'Central — America/Chicago' },
  { value: 'America/New_York', label: 'Eastern — America/New_York' },
  { value: 'America/Indiana/Indianapolis', label: 'Eastern (Indiana) — America/Indiana/Indianapolis' },
  { value: 'America/Denver', label: 'Mountain — America/Denver' },
  { value: 'America/Phoenix', label: 'Mountain, no DST — America/Phoenix' },
  { value: 'America/Los_Angeles', label: 'Pacific — America/Los_Angeles' },
] as const

/**
 * The whole screen's own view gate — CTL-01's `Unavailable` reading for
 * the Worker (L27117: "no standing on the module in any scope"), realised
 * as a real, enforced check rather than left to the nav rail alone (a
 * direct URL bypasses a rail entirely). Every role that reaches THIS
 * module at all — Tenant Admin, Supervisor, Quality Manager, Read-only
 * Auditor — sees the same tree; write authority (below) is what actually
 * differs between them.
 */
const VIEW_REQUEST: AccessRequest = {
  action: 'view-location-hierarchy',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'],
  // `SB-DOH-014` (L27217) is `SCR-DOH-04`'s own storyboard —
  // `@/surfaces/doh/screens.ts#dohScreenById('SCR-DOH-04')`'s own
  // `sourceRef` names it for this exact screen — cited here, in real code,
  // rather than only in this file's header comment (a header comment is
  // stripped before `scripts/build-registries.mjs`'s citation scan ever
  // runs; `TenantsScreen.tsx`'s own header explains the same defect class
  // for `SB-31-01`/`SB-SA-09`).
  sourceRefs: ['L27117', 'L27215', 'SB-DOH-014'],
}

/**
 * CTL-02/CTL-06's real floor: `repository.ts`'s `'hub'`-authority write
 * door (`TENANT_OPERATIONAL_WRITERS`) governs every Site/Area/Location
 * write uniformly — Create and Archive share this SAME request, matching
 * what the repository itself actually enforces (see this file's header,
 * "LOCATOR RELOCATION", CTL-02/CTL-06). WIDER than `./fixtures.ts`'s own
 * per-module reading of L27118/L27122 (Tenant Admin only); this build
 * follows the repository's uniform floor, disclosed via `ControlDisclosure`
 * beside the Create control below, rather than adding a second, narrower,
 * screen-local gate that would just disagree with the door it sits in
 * front of.
 */
const WRITE_REQUEST: AccessRequest = {
  action: 'configure-location-hierarchy',
  allowedRoles: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER'],
  sourceRefs: ['L27118', 'L27122', 'L26919', 'repository.ts', 'WF-DOH-02-CASCADE'],
}

function toneFor(status: 'active' | 'archived'): StatusToken {
  return STATUS_TONE[status]
}

export function LocationConfigurationScreen() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <LocationConfigurationGate session={session} />}
    </RequireSession>
  )
}

/**
 * Resolves `?site=<id>&area=<id>` against the live repository through
 * `checkSiteReference`/`checkAreaReference` (`@/data/scope-reference`,
 * this unit's own Task 1 helper) BEFORE any tier renders — the one place
 * on this screen a hand-edited or cross-tenant id in the address bar (or
 * React DevTools state, for a reviewer without a second seeded tenant's
 * credentials) meets the SAME check `createAreaUnderSite`/
 * `createLocationUnderArea` run at write time, rather than a screen that
 * trusts whatever id arrives. A missing parameter and an invalid one take
 * the same honest "could not open" branch — matching
 * `TenantDetailScreen.tsx`'s own `TenantDetailGate` precedent for the
 * identical class of problem.
 */
function LocationConfigurationGate({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  const store = useStore()
  const searchParams = useSearchParams()
  const siteParam = searchParams.get('site')
  const areaParam = searchParams.get('area')

  const viewGate = evaluateAccess(VIEW_REQUEST, ctx)
  if (viewGate.outcome !== 'allowed') {
    return (
      <AppShell surface="SURF-DOH" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
        <p data-control-id="location-config-unavailable" className={`text-sm ${textColor('ink-muted')}`}>
          {viewGate.explanation}
        </p>
      </AppShell>
    )
  }

  const actorTenant = ctx.identity.tenant
  const siteProblem = siteParam === null || actorTenant === null ? null : checkSiteReference(store, actorTenant, siteParam)
  const areaProblem =
    areaParam === null || actorTenant === null || siteProblem !== null
      ? null
      : checkAreaReference(store, actorTenant, areaParam, siteParam ?? undefined)

  if (siteParam !== null && (siteProblem !== null || actorTenant === null)) {
    return (
      <ReferenceRefused
        session={session}
        message={actorTenant === null ? 'This session carries no tenant to resolve a Site against.' : scopeReferenceMessage(siteProblem!)}
      />
    )
  }
  if (areaParam !== null && areaProblem !== null) {
    return <ReferenceRefused session={session} message={scopeReferenceMessage(areaProblem)} />
  }

  return (
    <LocationConfigurationBody
      session={session}
      siteId={siteParam}
      areaId={areaParam}
      ctx={ctx}
    />
  )
}

function ReferenceRefused({ session, message }: { readonly session: ProductSession; readonly message: string }) {
  const router = useRouter()
  return (
    <AppShell surface="SURF-DOH" session={session} title={MODULE.name} breadcrumbs={[{ label: MODULE.name }]}>
      <div
        role="alert"
        data-control-id="location-config-reference-refused"
        className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('raised')} p-4`}
      >
        <p className={`font-semibold ${textColor('ink')}`}>This could not be opened</p>
        <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>{message}</p>
        <button
          type="button"
          data-control-id="location-config-reference-refused-back"
          onClick={() => router.push('/hub/location-configuration/')}
          className={`mt-3 ${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
        >
          Back to Sites
        </button>
      </div>
    </AppShell>
  )
}

type Tier = 'sites' | 'areas' | 'locations'

function LocationConfigurationBody({
  session,
  siteId,
  areaId,
  ctx,
}: {
  readonly session: ProductSession
  readonly siteId: string | null
  readonly areaId: string | null
  readonly ctx: AccessContext
}) {
  const repository = useRepository()
  const store = useStore()
  const router = useRouter()

  const sitesQuery = useRepositoryQuery((r, c) => r.list('sites', c))
  const areasQuery = useRepositoryQuery((r, c) => r.list('areas', c))
  const locationsQuery = useRepositoryQuery((r, c) => r.list('locations', c))
  const allSites = sitesQuery.all()
  const allAreas = areasQuery.all()
  const allLocations = locationsQuery.all()

  const site = siteId === null ? null : (allSites.find((s) => s.id === siteId) ?? null)
  const area = areaId === null ? null : (allAreas.find((a) => a.id === areaId) ?? null)
  const tier: Tier = area !== null ? 'locations' : site !== null ? 'areas' : 'sites'

  const [createTier, setCreateTier] = useState<Tier | 'closed'>('closed')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<{
    readonly collection: 'sites' | 'areas' | 'locations'
    readonly id: string
    readonly name: string
  } | null>(null)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [toasts, setToasts] = useState<readonly ToastItem[]>([])

  const writeGate = evaluateAccess(WRITE_REQUEST, ctx)
  const canWrite = writeGate.outcome === 'allowed'

  function pushToast(tone: StatusToken, label: string): void {
    setToasts((prev) => [...prev, { id: `${store.nextSequence()}`, tone, label }])
  }
  function dismissToast(id: string): void {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function openCreate(kind: Tier): void {
    setPendingId(`${kind === 'sites' ? 'SITE' : kind === 'areas' ? 'AREA' : 'LOC'}-${store.nextSequence()}`)
    setCreateTier(kind)
  }
  function closeCreate(): void {
    setCreateTier('closed')
    setPendingId(null)
  }

  // Route-change focus (accessibility floor): a tier change here is a
  // `router.push` on the SAME pathname (a search-parameter change, per
  // this file's header), never a real navigation React would remount for
  // — so focus is moved to the new tier's own heading explicitly, the
  // same obligation a real page transition would otherwise satisfy for
  // free.
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [tier])

  async function confirmArchive(): Promise<void> {
    if (archiveTarget === null) return
    setArchiveBusy(true)
    const result = await repository.archiveLocationTierEntity(archiveTarget.collection, archiveTarget.id, ctx)
    setArchiveBusy(false)
    setArchiveTarget(null)
    if (result.ok) {
      pushToast('ok', `${archiveTarget.name} was archived.`)
    } else if (result.kind === 'has-active-children') {
      pushToast(
        'danger',
        `${archiveTarget.name} could not be archived: it still has ${result.children.map((c) => c.name).join(', ')}.`,
      )
    } else {
      pushToast('danger', result.explain)
    }
  }

  const breadcrumbLabel =
    tier === 'sites' ? 'Sites' : tier === 'areas' ? (site?.name ?? 'Site') : `${site?.name ?? 'Site'} / ${area?.name ?? 'Area'}`

  return (
    <AppShell
      surface="SURF-DOH"
      session={session}
      title={MODULE.name}
      breadcrumbs={[{ label: MODULE.name }, { label: breadcrumbLabel }]}
      actions={
        <CreateAction
          tier={tier}
          canWrite={canWrite}
          writeGate={writeGate}
          onOpen={() => openCreate(tier)}
        />
      }
    >
      {tier === 'sites' ? (
        <SitesTier
          headingRef={headingRef}
          sitesQuery={sitesQuery}
          allAreas={allAreas}
          allLocations={allLocations}
          canWrite={canWrite}
          onOpenSite={(s) => router.push(`/hub/location-configuration/?site=${encodeURIComponent(s.id)}`)}
          onRequestArchive={(s) => setArchiveTarget({ collection: 'sites', id: s.id, name: s.name })}
        />
      ) : tier === 'areas' && site !== null ? (
        <AreasTier
          headingRef={headingRef}
          site={site}
          areasQuery={areasQuery.where((a) => a.siteId === site.id)}
          allLocations={allLocations}
          canWrite={canWrite}
          onBack={() => router.push('/hub/location-configuration/')}
          onOpenArea={(a) => router.push(`/hub/location-configuration/?site=${encodeURIComponent(site.id)}&area=${encodeURIComponent(a.id)}`)}
          onRequestArchive={(a) => setArchiveTarget({ collection: 'areas', id: a.id, name: a.name })}
        />
      ) : tier === 'locations' && site !== null && area !== null ? (
        <LocationsTier
          headingRef={headingRef}
          site={site}
          area={area}
          locationsQuery={locationsQuery.where((l) => l.areaId === area.id)}
          canWrite={canWrite}
          onBackToSite={() => router.push('/hub/location-configuration/')}
          onBackToArea={() => router.push(`/hub/location-configuration/?site=${encodeURIComponent(site.id)}`)}
          onRequestArchive={(l) => setArchiveTarget({ collection: 'locations', id: l.id, name: l.name })}
        />
      ) : null}

      <CreateDrawer
        tier={createTier}
        pendingId={pendingId}
        tenantId={ctx.identity.tenant}
        siteId={site?.id ?? null}
        areaId={area?.id ?? null}
        repository={repository}
        ctx={ctx}
        onClose={closeCreate}
        onCreated={(label) => pushToast('ok', label)}
      />

      {archiveTarget !== null ? (
        <ConfirmDialog
          open
          controlId="location-config-archive-confirm"
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
 * The Create action + its role-floor disclosure — shared shape across all
 * three tiers, matching `TenantsScreen.tsx`'s own actions-slot pattern.
 * ────────────────────────────────────────────────────────────────────── */

const TIER_NOUN: Readonly<Record<Tier, string>> = { sites: 'site', areas: 'area', locations: 'location' }

function CreateAction({
  tier,
  canWrite,
  writeGate,
  onOpen,
}: {
  readonly tier: Tier
  readonly canWrite: boolean
  readonly writeGate: ReturnType<typeof evaluateAccess>
  readonly onOpen: () => void
}) {
  const noun = TIER_NOUN[tier]
  const controlId = `location-config-create-${tier}`
  if (canWrite) {
    return (
      <button
        type="button"
        data-control-id={controlId}
        onClick={onOpen}
        className={`${radiusClass('md')} ${bg('accent')} px-4 py-2 text-sm font-medium text-[var(--accent-ink)]`}
      >
        {`Create ${noun}`}
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
        {`Create ${noun}`}
      </button>
      <p id={`${controlId}-reason`} className={`text-right text-xs ${textColor('ink-muted')}`}>
        {writeGate.explanation}
      </p>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Sites tier
 * ────────────────────────────────────────────────────────────────────── */

/**
 * §8.6.1 fixture adequacy on the primary table: `pageSize={10}` against
 * Bright Bikes' 24 seeded Sites (Task 1's own seed top-up, see the report's
 * before/after counts) gives three genuinely distinct pages — 10, 10, 4 —
 * a first, a middle and a last-partial, not merely "more than one page".
 * `TenantsScreen.tsx`'s own `TENANT_LIST_PAGE_SIZE` sets the same
 * precedent for the same reason (its own header comment explains why the
 * default `pageSize=20` would not exercise a middle page at all).
 */
const SITES_PAGE_SIZE = 10

function activeAreaAndLocationNames(siteId: string, allAreas: readonly AreaRow[], allLocations: readonly LocationRow[]): readonly string[] {
  const areasUnderSite = allAreas.filter((a) => a.siteId === siteId)
  const activeAreaNames = areasUnderSite.filter((a) => a.status === 'active').map((a) => a.name)
  const areaIds = new Set(areasUnderSite.map((a) => a.id))
  const activeLocationNames = allLocations.filter((l) => areaIds.has(l.areaId) && l.status === 'active').map((l) => l.name)
  return [...activeAreaNames, ...activeLocationNames]
}

function SitesTier({
  headingRef,
  sitesQuery,
  allAreas,
  allLocations,
  canWrite,
  onOpenSite,
  onRequestArchive,
}: {
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly sitesQuery: Query<SiteRow>
  readonly allAreas: readonly AreaRow[]
  readonly allLocations: readonly LocationRow[]
  readonly canWrite: boolean
  readonly onOpenSite: (site: SiteRow) => void
  readonly onRequestArchive: (site: SiteRow) => void
}) {
  const areaCount = (siteId: string) => allAreas.filter((a) => a.siteId === siteId).length

  const columns: readonly DataTableColumn<SiteRow>[] = [
    {
      key: 'name',
      header: 'Site',
      sortValue: (s) => s.name,
      render: (s) => (
        <button
          type="button"
          data-control-id={`location-config-open-site-${s.id}`}
          onClick={() => onOpenSite(s)}
          className={`flex flex-col text-left underline-offset-2 hover:underline ${textColor('ink')}`}
        >
          <span className="font-medium">{s.name}</span>
          <span className={`text-xs ${textColor('ink-subtle')}`}>{s.id}</span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span data-control-id={`location-config-status-site-${s.id}-${s.status}`}>
          <StatusPill tone={toneFor(s.status)} label={STATUS_LABEL[s.status]} />
        </span>
      ),
    },
    { key: 'timezone', header: 'Timezone', render: (s) => s.timezone },
    { key: 'address', header: 'Address', render: (s) => s.address, hideBelow: 'lg' },
    { key: 'contact', header: 'Contact', render: (s) => s.contact, hideBelow: 'lg' },
    {
      key: 'areas',
      header: 'Areas',
      align: 'end',
      sortValue: (s) => areaCount(s.id),
      render: (s) => areaCount(s.id),
    },
    {
      key: 'archive',
      header: 'Archive',
      render: (s) => (
        <ArchiveControl
          controlId={`location-config-archive-site-${s.id}`}
          row={s}
          canWrite={canWrite}
          activeChildren={activeAreaAndLocationNames(s.id, allAreas, allLocations)}
          onRequestArchive={() => onRequestArchive(s)}
        />
      ),
    },
  ]

  return (
    <section aria-labelledby="location-config-sites-heading" className="mt-6 flex flex-col gap-4">
      <h2
        id="location-config-sites-heading"
        ref={headingRef as RefObject<HTMLHeadingElement>}
        tabIndex={-1}
        className={`text-lg font-semibold ${textColor('ink')} focus:outline-none`}
      >
        Sites
      </h2>
      <DataTable
        caption="Sites"
        columns={columns}
        query={sitesQuery}
        rowId={(s) => s.id}
        search={{
          placeholder: 'Search by name or id',
          match: (s, q) => {
            const needle = q.toLowerCase()
            return s.name.toLowerCase().includes(needle) || s.id.toLowerCase().includes(needle)
          },
        }}
        pageSize={SITES_PAGE_SIZE}
        emptyState={{
          title: 'There are no Sites yet.',
          whatCreatesIt: 'A Tenant Admin, Supervisor or Quality Manager creates the first one from Create site.',
        }}
      />
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * The Archive control — one shape shared by all three tiers. `WF-DOH-02-
 * CASCADE`'s own alternate path realised as a render-time decision: this
 * component computes the SAME active-children question
 * `archiveLocationTierEntity` (`repository.ts`) asks server-side, so a
 * caller who cannot succeed never sees an enabled control that would only
 * be refused a moment later — the repository call in `confirmArchive`
 * above is the authoritative, enforced check; this is its render-time
 * preview, the same split `TenantsScreen.tsx#createDecision` and
 * `repository.ts#PROVISION_TENANT_REQUEST` already keep between a screen's
 * OWN display gate and the door's real authorisation.
 * ────────────────────────────────────────────────────────────────────── */

function ArchiveControl({
  controlId,
  row,
  canWrite,
  activeChildren,
  onRequestArchive,
}: {
  readonly controlId: string
  readonly row: { readonly status: 'active' | 'archived' }
  readonly canWrite: boolean
  readonly activeChildren: readonly string[]
  readonly onRequestArchive: () => void
}) {
  if (row.status === 'archived') {
    return <span className={`text-xs ${textColor('ink-muted')}`}>Already archived</span>
  }
  if (!canWrite) {
    return (
      <button
        type="button"
        disabled
        data-control-id={controlId}
        className={`cursor-not-allowed ${radiusClass('md')} border ${borderColor('border')} ${bg('sunken')} px-2 py-1 text-xs ${textColor('ink-subtle')}`}
      >
        Archive
      </button>
    )
  }
  if (activeChildren.length > 0) {
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
          {`Has ${activeChildren.length} active: ${activeChildren.join(', ')}.`}
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

/* ────────────────────────────────────────────────────────────────────── *
 * Areas tier
 * ────────────────────────────────────────────────────────────────────── */

function AreasTier({
  headingRef,
  site,
  areasQuery,
  allLocations,
  canWrite,
  onBack,
  onOpenArea,
  onRequestArchive,
}: {
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly site: SiteRow
  readonly areasQuery: Query<AreaRow>
  readonly allLocations: readonly LocationRow[]
  readonly canWrite: boolean
  readonly onBack: () => void
  readonly onOpenArea: (area: AreaRow) => void
  readonly onRequestArchive: (area: AreaRow) => void
}) {
  const locationCount = (areaId: string) => allLocations.filter((l) => l.areaId === areaId).length
  const activeLocationNames = (areaId: string) =>
    allLocations.filter((l) => l.areaId === areaId && l.status === 'active').map((l) => l.name)

  const columns: readonly DataTableColumn<AreaRow>[] = [
    {
      key: 'name',
      header: 'Area',
      sortValue: (a) => a.name,
      render: (a) => (
        <button
          type="button"
          data-control-id={`location-config-open-area-${a.id}`}
          onClick={() => onOpenArea(a)}
          className={`flex flex-col text-left underline-offset-2 hover:underline ${textColor('ink')}`}
        >
          <span className="font-medium">{a.name}</span>
          <span className={`text-xs ${textColor('ink-subtle')}`}>{a.id}</span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <span data-control-id={`location-config-status-area-${a.id}-${a.status}`}>
          <StatusPill tone={toneFor(a.status)} label={STATUS_LABEL[a.status]} />
        </span>
      ),
    },
    {
      key: 'locations',
      header: 'Locations',
      align: 'end',
      sortValue: (a) => locationCount(a.id),
      render: (a) => locationCount(a.id),
    },
    {
      key: 'archive',
      header: 'Archive',
      render: (a) => (
        <ArchiveControl
          controlId={`location-config-archive-area-${a.id}`}
          row={a}
          canWrite={canWrite}
          activeChildren={activeLocationNames(a.id)}
          onRequestArchive={() => onRequestArchive(a)}
        />
      ),
    },
  ]

  return (
    <section aria-labelledby="location-config-areas-heading" className="mt-6 flex flex-col gap-4">
      <button
        type="button"
        data-control-id="location-config-back-to-sites"
        onClick={onBack}
        className={`self-start text-sm underline ${textColor('ink-muted')}`}
      >
        ← Back to Sites
      </button>
      <div>
        <h2
          id="location-config-areas-heading"
          ref={headingRef as RefObject<HTMLHeadingElement>}
          tabIndex={-1}
          className={`text-lg font-semibold ${textColor('ink')} focus:outline-none`}
        >
          {`${site.name} — Areas`}
        </h2>
        {/* CTL-08, L27124, AC-SCOPE-034 L2612 (see this file's own header,
            "LOCATOR RELOCATION") — one timezone per Site, no per-Area/per-
            Shift override; the citation stays in this comment, never in
            the rendered text (§8.6.2). */}
        <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
          {`Timezone (inherited from ${site.name}, Site-only): `}
          <span className={`font-medium ${textColor('ink')}`}>{site.timezone}</span>
        </p>
      </div>
      <DataTable
        caption="Areas"
        columns={columns}
        query={areasQuery}
        rowId={(a) => a.id}
        search={{
          placeholder: 'Search by name or id',
          match: (a, q) => {
            const needle = q.toLowerCase()
            return a.name.toLowerCase().includes(needle) || a.id.toLowerCase().includes(needle)
          },
        }}
        emptyState={{
          title: 'There is no Area under this Site yet.',
          whatCreatesIt: 'A Tenant Admin, Supervisor or Quality Manager creates the first one from Create area.',
        }}
      />
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * Locations tier
 * ────────────────────────────────────────────────────────────────────── */

function LocationsTier({
  headingRef,
  site,
  area,
  locationsQuery,
  canWrite,
  onBackToSite,
  onBackToArea,
  onRequestArchive,
}: {
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly site: SiteRow
  readonly area: AreaRow
  readonly locationsQuery: Query<LocationRow>
  readonly canWrite: boolean
  readonly onBackToSite: () => void
  readonly onBackToArea: () => void
  readonly onRequestArchive: (location: LocationRow) => void
}) {
  const columns: readonly DataTableColumn<LocationRow>[] = [
    {
      key: 'name',
      header: 'Location',
      sortValue: (l) => l.name,
      render: (l) => (
        <span className="flex flex-col">
          <span className={`font-medium ${textColor('ink')}`}>{l.name}</span>
          <span className={`text-xs ${textColor('ink-subtle')}`}>{l.id}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => (
        <span data-control-id={`location-config-status-location-${l.id}-${l.status}`}>
          <StatusPill tone={toneFor(l.status)} label={STATUS_LABEL[l.status]} />
        </span>
      ),
    },
    {
      key: 'requiredCertification',
      header: 'Required certification',
      render: (l) => l.requiredCertification ?? 'None',
    },
    {
      key: 'archive',
      header: 'Archive',
      render: (l) => (
        <ArchiveControl
          controlId={`location-config-archive-location-${l.id}`}
          row={l}
          canWrite={canWrite}
          activeChildren={[]}
          onRequestArchive={() => onRequestArchive(l)}
        />
      ),
    },
  ]

  return (
    <section aria-labelledby="location-config-locations-heading" className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          data-control-id="location-config-back-to-sites-2"
          onClick={onBackToSite}
          className={`text-sm underline ${textColor('ink-muted')}`}
        >
          ← Back to Sites
        </button>
        <button
          type="button"
          data-control-id="location-config-back-to-areas"
          onClick={onBackToArea}
          className={`text-sm underline ${textColor('ink-muted')}`}
        >
          {`← Back to ${site.name}`}
        </button>
      </div>
      <div>
        <h2
          id="location-config-locations-heading"
          ref={headingRef as RefObject<HTMLHeadingElement>}
          tabIndex={-1}
          className={`text-lg font-semibold ${textColor('ink')} focus:outline-none`}
        >
          {`${area.name} — Locations`}
        </h2>
        {/* CTL-08, L27124, AC-SCOPE-034 L2612 (see this file's own header,
            "LOCATOR RELOCATION") — one timezone per Site, no per-Area/per-
            Shift override; the citation stays in this comment, never in
            the rendered text (§8.6.2). */}
        <p className={`mt-1 text-sm ${textColor('ink-muted')}`}>
          {`Timezone (inherited from ${site.name}, Site-only): `}
          <span className={`font-medium ${textColor('ink')}`}>{site.timezone}</span>
        </p>
      </div>
      <DataTable
        caption="Locations"
        columns={columns}
        query={locationsQuery}
        rowId={(l) => l.id}
        search={{
          placeholder: 'Search by name or id',
          match: (l, q) => {
            const needle = q.toLowerCase()
            return l.name.toLowerCase().includes(needle) || l.id.toLowerCase().includes(needle)
          },
        }}
        emptyState={{
          title: 'There is no Location under this Area yet.',
          whatCreatesIt: 'A Tenant Admin, Supervisor or Quality Manager creates the first one from Create location.',
        }}
      />
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────── *
 * The Create drawer — one `Form` per tier, `schema` the exact zod object
 * `repository.ts` validates the write against (`Form.tsx`'s own "single
 * most important property"). Hidden fields (`id`/`tenantId`/`siteId`/
 * `areaId`/`status`) are seeded through `Form`'s `initial` prop and never
 * exposed as a control — a real product screen names its own new row's id
 * and parent, not a person typing one in.
 * ────────────────────────────────────────────────────────────────────── */

function CreateDrawer({
  tier,
  pendingId,
  tenantId,
  siteId,
  areaId,
  repository,
  ctx,
  onClose,
  onCreated,
}: {
  readonly tier: Tier | 'closed'
  readonly pendingId: string | null
  readonly tenantId: string | null
  readonly siteId: string | null
  readonly areaId: string | null
  readonly repository: Repository
  readonly ctx: AccessContext
  readonly onClose: () => void
  readonly onCreated: (label: string) => void
}) {
  const open = tier !== 'closed' && pendingId !== null
  const title = tier === 'sites' ? 'Create site' : tier === 'areas' ? 'Create area' : tier === 'locations' ? 'Create location' : ''

  async function onSiteSubmit(value: RowOf<'sites'>): Promise<WriteResult<unknown>> {
    const result = await repository.create('sites', value, ctx)
    if (result.ok) onCreated(`${result.row.name} was created.`)
    return result
  }
  async function onAreaSubmit(value: RowOf<'areas'>): Promise<WriteResult<unknown>> {
    const result = await repository.createAreaUnderSite(value, ctx)
    if (result.ok) onCreated(`${result.row.name} was created.`)
    return result
  }
  async function onLocationSubmit(value: RowOf<'locations'>): Promise<WriteResult<unknown>> {
    const normalized = { ...value, requiredCertification: value.requiredCertification === '' ? null : value.requiredCertification }
    const result = await repository.createLocationUnderArea(normalized, ctx)
    if (result.ok) onCreated(`${result.row.name} was created.`)
    return result
  }

  return (
    <DetailDrawer open={open} onClose={onClose} title={title}>
      {tier === 'sites' && pendingId !== null && tenantId !== null ? (
        <Form
          key={pendingId}
          schema={Site}
          initial={{ id: pendingId, tenantId, status: 'active' }}
          onSubmit={onSiteSubmit}
          submitLabel="Create site"
        >
          <TextField name="name" label="Site name" required />
          <TextField name="address" label="Address" required />
          <TextField name="contact" label="Contact email" type="email" required autoComplete="email" />
          <SelectField name="timezone" label="Timezone" required options={[...TIMEZONE_OPTIONS]} />
        </Form>
      ) : tier === 'areas' && pendingId !== null && siteId !== null ? (
        <Form
          key={pendingId}
          schema={Area}
          initial={{ id: pendingId, siteId, status: 'active', shiftIds: [] }}
          onSubmit={onAreaSubmit}
          submitLabel="Create area"
        >
          <TextField name="name" label="Area name" required />
        </Form>
      ) : tier === 'locations' && pendingId !== null && areaId !== null ? (
        <Form
          key={pendingId}
          schema={Location}
          initial={{ id: pendingId, areaId, status: 'active', requiredCertification: null }}
          onSubmit={onLocationSubmit}
          submitLabel="Create location"
        >
          <TextField name="name" label="Location name" required />
          <TextField name="requiredCertification" label="Required certification (optional)" />
        </Form>
      ) : null}
    </DetailDrawer>
  )
}
