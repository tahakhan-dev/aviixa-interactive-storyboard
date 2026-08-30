'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { z } from 'zod'
import {
  AppShell,
  CheckboxField,
  ConfirmDialog,
  DateField,
  RadioGroup,
  RequireSession,
  TextField,
  Wizard,
  bg,
  borderColor,
  radiusClass,
  statusText,
  textColor,
  useAccessContext,
  useRepository,
  useRepositoryQuery,
  useStore,
  type ConfirmDialogAffected,
  type ProductSession,
  type WizardStep,
} from '@/ui/product'
import { Tenant, User } from '@/data/schemas/platform'
import type { WriteResult } from '@/data/repository'
import { saModuleById } from '@/surfaces/sa/modules'

/**
 * Task 5 (unit-01) — the tenant-creation wizard: Identity, Commercial, First
 * administrator, Review. Runs after Task 6, whose detail route
 * (`detail/?tenant=<id>`) is where a successful create navigates.
 *
 * FIX ROUND 1 (unit-01, Task 5 review) — ONE DOOR, NOT TWO WRITES FROM THIS
 * SCREEN. The first pass called `repository.create('tenants', …)` then
 * `repository.create('users', …)` directly from here, each behind its own
 * `authorizeWrite` check — and the second of those checks used a `ctx`
 * captured once, before either write ran, so it never saw the tenant the
 * FIRST write had just committed (measured: a `TENANT_MISMATCH` refusal at
 * the tenant-isolation stage, not the `TENANT_NOT_ACTIVE` this file's own
 * comment used to claim). Both writes, the one-authorisation-for-both
 * decision, and the two-write failure policy itself now live behind
 * `repository.provisionTenant(tenant, admin, ctx)` — this screen calls that
 * ONE method and routes whatever it returns; it does not evaluate access
 * itself and does not decide what "partial" means. See that method's own
 * comment in `src/data/repository.ts` for the full reasoning, and
 * `useAccessContext`'s own comment (`src/ui/product/runtime/useRepository.ts`)
 * for the staleness bug this design sidesteps rather than papers over.
 */

const MODULE = saModuleById('MOD-SA-09')
const LIST_HREF = '/super-admin/tenants-lifecycle-and-pilots/'

const TIER_LABEL: Readonly<Record<Tenant['tier'], string>> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

const LOCALE_LABEL: Readonly<Record<Tenant['primaryLocale'], string>> = {
  en: 'English',
  es: 'Español',
}

interface WizardValues {
  readonly name: string
  readonly primaryLocale: Tenant['primaryLocale']
  readonly regulatedMode: boolean
  readonly tier: Tenant['tier']
  readonly isPilot: boolean
  /** Empty string = not chosen yet (`DateField`'s own convention); a real `Stamp` once picked. */
  readonly pilotExpiresAt: string
  readonly adminDisplayName: string
  readonly adminEmail: string
}

const INITIAL_VALUES: WizardValues = {
  name: '',
  primaryLocale: 'en',
  regulatedMode: false,
  tier: 'starter',
  isPilot: false,
  pilotExpiresAt: '',
  adminDisplayName: '',
  adminEmail: '',
}

/** The Identity/Commercial fields — frozen once the tenant row is committed (see `updateField`). */
const TENANT_FIELD_KEYS: ReadonlySet<keyof WizardValues> = new Set([
  'name',
  'primaryLocale',
  'regulatedMode',
  'tier',
  'isPilot',
  'pilotExpiresAt',
])

interface Pending {
  readonly tenantId: string
  readonly userId: string
}

function slugify(name: string): string {
  const slug = name.toUpperCase().replace(/[^A-Z0-9]+/g, '')
  return slug.length > 0 ? slug.slice(0, 16) : 'TENANT'
}

/**
 * A single field's own schema — a real sub-schema of the exact `Tenant`/
 * `User` objects the repository validates against, not a hand-copied rule.
 * Fix round 1 (unit-01, Task 5 review, minor): typed against zod's own
 * `z.ZodType<V>` rather than duck-typing a `{ safeParse }` shape — zod is
 * already a dependency, and the duck-typed shape let a caller pass a
 * schema whose `V` did not actually match `value`'s type and still get a
 * plausible, silently-empty issue list back instead of a compile error.
 */
function fieldIssues<V>(schema: z.ZodType<V>, value: V): string[] {
  const result = schema.safeParse(value)
  return result.success ? [] : result.error.issues.map((i) => i.message)
}

function buildTenantRow(id: string, values: WizardValues, nowIso: string): Tenant {
  return {
    id,
    name: values.name,
    // A tenant is not operating until its administrator accepts (brief) —
    // every tenant this wizard creates starts `invited`, regardless of
    // tier or pilot flag. `Activate` (Task 6) is what moves it to
    // `pilot`/`active` later, once that acceptance is real.
    lifecycle: 'invited',
    tier: values.tier,
    isPilot: values.isPilot,
    regulatedMode: values.regulatedMode,
    workerShiftsThisMonth: 0,
    onboardedAt: nowIso,
    archivedAt: null,
    legalHold: false,
    primaryLocale: values.primaryLocale,
    pilotExpiresAt: values.isPilot && values.pilotExpiresAt !== '' ? values.pilotExpiresAt : null,
  }
}

function buildUserRow(id: string, tenantId: string, values: WizardValues, nowIso: string): User {
  return {
    id,
    tenantId,
    displayName: values.adminDisplayName,
    email: values.adminEmail,
    role: 'TENANT_ADMIN',
    // Ruling R5: the first Tenant Admin is a `users` row with
    // `status: 'invited'` — the same shape the seed already carries for
    // `USR-IC-ADM-01`/`USR-CF-ADM-01`/`USR-BC-ADM-01`/`USR-RR-ADM-01`. No
    // second representation of "this administrator has been invited."
    status: 'invited',
    locale: values.primaryLocale,
    createdAt: nowIso,
    lastSignInAt: null,
  }
}

export function CreateTenantWizard() {
  return (
    <RequireSession signInHref="/super-admin/sign-in/">
      {(session) => <CreateTenantWizardBody session={session} />}
    </RequireSession>
  )
}

/** The frozen-fields notice — one render function, not a shared component, since it has exactly two call sites (Identity/Commercial steps). */
function LockedTenantNotice() {
  return (
    <p role="status" className={`text-sm ${statusText('warn')}`}>
      This tenant has already been created — these details cannot be changed anymore. Go to Review to
      retry the administrator invitation.
    </p>
  )
}

function CreateTenantWizardBody({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  const repository = useRepository()
  const store = useStore()
  const router = useRouter()

  const [values, setValues] = useState<WizardValues>(INITIAL_VALUES)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  /**
   * Set once `repository.provisionTenant` reports the tenant half as real
   * (`ok: true` or `kind: 'partial'`) and never cleared afterward — a
   * committed tenant cannot become uncommitted from this screen. Gates
   * `updateField` below: once true, an edit to any Identity/Commercial
   * field is inert (`provisionTenant` itself ignores the tenant argument on
   * a retry once a row with the same id exists, using the committed row
   * instead — see that method's own comment), so those fields must stop
   * accepting edits here too, or the screen would show a value the write
   * path silently never uses (fix round 1, unit-01 Task 5 review, item 4).
   */
  const [tenantCommitted, setTenantCommitted] = useState(false)
  const [partialFailureNote, setPartialFailureNote] = useState<string | null>(null)

  // Real, seeded cap values (`worker-shift-allocation`), never hand-typed —
  // same source `TenantDetailScreen.tsx`'s usage meter reads from, reused
  // by reading the collection again rather than importing that screen's own
  // module-local consts (there is no shared band-caption module yet).
  const entitlementCaps = useRepositoryQuery((r, c) =>
    r
      .list('entitlements', c)
      .where((e) => e.featureKey === 'worker-shift-allocation')
      .all(),
  )
  const capByTier = new Map(entitlementCaps.map((e) => [e.tier, e.cap] as const))
  const starterCap = capByTier.get('starter') ?? null
  const growthCap = capByTier.get('growth') ?? null
  /**
   * Frozen source L2195 (`[SoW Fact — §4.2.1, §1.7]`): three Worker-Shift
   * bands — Starter below 100, Growth 100-199, Enterprise 200 and above.
   * The boundary NUMBERS below are derived from the real entitlement caps
   * (`starterCap`/`growthCap`), never hand-typed as 100/199/200.
   */
  const bandCaption: Readonly<Record<Tenant['tier'], string>> = {
    starter: starterCap !== null ? `Below ${(starterCap + 1).toLocaleString()} Worker-Shifts per month.` : 'Band not recorded.',
    growth:
      starterCap !== null && growthCap !== null
        ? `${(starterCap + 1).toLocaleString()}–${growthCap.toLocaleString()} Worker-Shifts per month.`
        : 'Band not recorded.',
    enterprise: growthCap !== null ? `${(growthCap + 1).toLocaleString()} Worker-Shifts per month and up, uncapped.` : 'Band not recorded.',
  }

  function updateField<K extends keyof WizardValues>(key: K, value: WizardValues[K]): void {
    // Fix round 1 (unit-01, Task 5 review, item 4): once the tenant row is
    // committed, an edit to a tenant-side field would silently diverge from
    // what `provisionTenant` actually has on file (it ignores the tenant
    // argument on a retry — see that method's own comment) — refusing the
    // edit here, rather than accepting it and never using it, is what keeps
    // the screen honest about which fields still do anything.
    if (tenantCommitted && TENANT_FIELD_KEYS.has(key)) return
    setValues((prev) => ({ ...prev, [key]: value }))
    setConfirmed(false)
    // Fix round 2 minor (unit-01, Task 5 re-review): a reserved
    // `pending` id is derived from `values.name` (`ensurePending` below).
    // Before this round's rewrite, an edit cleared it deliberately so a
    // later `ensurePending()` call re-derives a slug that matches the
    // CURRENT name rather than a stale one reserved before this edit.
    // That clear went missing when `pending` was simplified — restored
    // here, but only while nothing has been committed yet: once
    // `tenantCommitted` is true, the reserved id names a row already on
    // file and must not change out from under it (see `Pending`'s own
    // comment above and `provisionTenant`'s idempotent-retry contract).
    if (!tenantCommitted) setPending(null)
  }

  function ensurePending(): Pending {
    if (pending !== null) return pending
    const seq = store.nextSequence()
    const slug = slugify(values.name)
    const next: Pending = { tenantId: `TEN-${slug}-${seq}`, userId: `USR-${slug}-ADM-${seq}` }
    setPending(next)
    return next
  }

  async function submit(): Promise<WriteResult<unknown>> {
    const current = ensurePending()
    const nowIso = new Date(store.clock.now()).toISOString()
    const result = await repository.provisionTenant(
      buildTenantRow(current.tenantId, values, nowIso),
      buildUserRow(current.userId, current.tenantId, values, nowIso),
      ctx,
    )

    if (result.ok) {
      setTenantCommitted(true)
      setPartialFailureNote(null)
      router.push(`/super-admin/tenants-lifecycle-and-pilots/detail/?tenant=${encodeURIComponent(result.tenant.id)}&created=1`)
      // A real, non-fabricated observation of what `provisionTenant` just
      // returned — `events`/`audit` stay empty here (not duplicated from
      // the door's own two commits) because nothing on this screen reads
      // them; the real rows are visible on the destination page's own
      // Audit tab, read live off the repository, not off this return value.
      return { ok: true, row: result, events: [], audit: [], affectedSurfaces: [] }
    }

    if (result.kind === 'partial') {
      setTenantCommitted(true)
      const failure = result.adminFailure
      // Fix round 1 (unit-01, Task 5 review, item 4): the retry advice used
      // to be unconditional. It is false for exactly one arm — a
      // `persistence-unavailable` second write means `repository.ts`
      // already downgraded capability for the rest of this session, so
      // "click Finish again" can never succeed until a full reload
      // restores a durable store. Branch on the actual result kind rather
      // than assume the generic wording covers both.
      setPartialFailureNote(
        failure.kind === 'persistence-unavailable'
          ? `${values.name} (${result.tenant.id}) has been created, but its administrator invitation could not ` +
              `be saved: ${failure.explain} Storage is no longer durable for the rest of this session, so ` +
              'retrying here will not succeed. Only the administrator name and email below can still be changed ' +
              "— the tenant's own details are already saved."
          : `${values.name} (${result.tenant.id}) has been created, but its administrator invitation could not ` +
              `be saved: ${failure.explain} Only the administrator name and email below can still be changed — ` +
              "the tenant's own details are already saved. Click Finish again to retry the invitation.",
      )
      return failure
    }

    setPartialFailureNote(null)
    return result
  }

  const identityStep: WizardStep = {
    id: 'identity',
    title: 'Identity',
    validate: () => [
      ...fieldIssues(Tenant.shape.name, values.name),
      ...fieldIssues(Tenant.shape.primaryLocale, values.primaryLocale),
    ],
    content: (
      <div className="flex flex-col gap-4">
        {tenantCommitted ? <LockedTenantNotice /> : null}
        <TextField
          name="name"
          label="Tenant name"
          required
          value={values.name}
          onChange={(v) => updateField('name', v)}
        />
        <RadioGroup
          name="primaryLocale"
          label="Primary locale"
          required
          options={[
            { value: 'en', label: LOCALE_LABEL.en },
            { value: 'es', label: LOCALE_LABEL.es },
          ]}
          value={values.primaryLocale}
          onChange={(v) => updateField('primaryLocale', v as Tenant['primaryLocale'])}
        />
        <CheckboxField
          name="regulatedMode"
          label="Regulated-industry mode"
          hint="Turns on additional compliance handling for a regulated industry."
          value={values.regulatedMode}
          onChange={(v) => updateField('regulatedMode', v)}
        />
      </div>
    ),
  }

  const commercialStep: WizardStep = {
    id: 'commercial',
    title: 'Commercial',
    validate: () => [
      ...fieldIssues(Tenant.shape.tier, values.tier),
      ...(values.isPilot && values.pilotExpiresAt === '' ? ['A pilot tenant needs an expiry date.'] : []),
      ...(values.pilotExpiresAt !== '' ? fieldIssues(Tenant.shape.pilotExpiresAt, values.pilotExpiresAt) : []),
    ],
    content: (
      <div className="flex flex-col gap-4">
        {tenantCommitted ? <LockedTenantNotice /> : null}
        <RadioGroup
          name="tier"
          label="Tier"
          required
          options={[
            { value: 'starter', label: TIER_LABEL.starter },
            { value: 'growth', label: TIER_LABEL.growth },
            { value: 'enterprise', label: TIER_LABEL.enterprise },
          ]}
          value={values.tier}
          onChange={(v) => updateField('tier', v as Tenant['tier'])}
        />
        <p data-control-id="create-tenant-tier-band" className={`text-sm ${textColor('ink-muted')}`}>
          {TIER_LABEL[values.tier]}: {bandCaption[values.tier]}
        </p>
        <CheckboxField
          name="isPilot"
          label="This is a pilot tenant"
          hint="Invitation-only, functionally identical to a paying tenant, tracked to an expiry."
          value={values.isPilot}
          onChange={(v) => {
            updateField('isPilot', v)
            if (!v) updateField('pilotExpiresAt', '')
          }}
        />
        {values.isPilot ? (
          <DateField
            name="pilotExpiresAt"
            label="Pilot expiry date"
            required
            value={values.pilotExpiresAt}
            onChange={(v) => updateField('pilotExpiresAt', v)}
          />
        ) : null}
      </div>
    ),
  }

  const adminStep: WizardStep = {
    id: 'administrator',
    title: 'First administrator',
    validate: () => [
      ...fieldIssues(User.shape.displayName, values.adminDisplayName),
      ...fieldIssues(User.shape.email, values.adminEmail),
    ],
    content: (
      <div className="flex flex-col gap-4">
        <p className={`text-sm ${textColor('ink-muted')}`}>
          The first Tenant Admin's invitation. This tenant is not operating until this person accepts.
        </p>
        <TextField
          name="adminDisplayName"
          label="Administrator name"
          required
          value={values.adminDisplayName}
          onChange={(v) => updateField('adminDisplayName', v)}
        />
        <TextField
          name="adminEmail"
          label="Administrator email"
          type="email"
          autoComplete="email"
          required
          value={values.adminEmail}
          onChange={(v) => updateField('adminEmail', v)}
        />
      </div>
    ),
  }

  const affectedObjects: ConfirmDialogAffected = pending
    ? [
        { id: pending.tenantId, label: values.name },
        { id: pending.userId, label: `${values.adminDisplayName} (${values.adminEmail})` },
      ]
    : { kind: 'no-object', reason: 'Nothing has been named yet.' }

  const reviewStep: WizardStep = {
    id: 'review',
    title: 'Review',
    validate: () => (confirmed ? [] : ['Review the details below and confirm before finishing.']),
    content: (
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className={textColor('ink-muted')}>Name</dt>
            <dd className={textColor('ink')}>{values.name || '—'}</dd>
          </div>
          <div>
            <dt className={textColor('ink-muted')}>Primary locale</dt>
            <dd className={textColor('ink')}>{LOCALE_LABEL[values.primaryLocale]}</dd>
          </div>
          <div>
            <dt className={textColor('ink-muted')}>Regulated mode</dt>
            <dd className={textColor('ink')}>{values.regulatedMode ? 'On' : 'Off'}</dd>
          </div>
          <div>
            <dt className={textColor('ink-muted')}>Tier</dt>
            <dd className={textColor('ink')}>{TIER_LABEL[values.tier]}</dd>
          </div>
          <div>
            <dt className={textColor('ink-muted')}>Pilot</dt>
            <dd className={textColor('ink')}>
              {values.isPilot ? `Yes — expires ${values.pilotExpiresAt.slice(0, 10) || '—'}` : 'No'}
            </dd>
          </div>
          <div>
            <dt className={textColor('ink-muted')}>First administrator</dt>
            <dd className={textColor('ink')}>
              {values.adminDisplayName || '—'} ({values.adminEmail || '—'})
            </dd>
          </div>
          <div>
            <dt className={textColor('ink-muted')}>Lifecycle after creation</dt>
            <dd className={textColor('ink')}>
              Invited — a tenant is not operating until its administrator accepts.
            </dd>
          </div>
        </dl>

        {partialFailureNote ? (
          <div
            role="alert"
            data-control-id="create-tenant-partial-failure"
            className={`${radiusClass('lg')} border ${borderColor('border-strong')} ${bg('surface')} p-4`}
          >
            <p className={`text-sm ${textColor('ink')}`}>{partialFailureNote}</p>
          </div>
        ) : null}

        <div>
          <button
            type="button"
            data-control-id="create-tenant-review-confirm-trigger"
            onClick={() => {
              ensurePending()
              setConfirmOpen(true)
            }}
            className={`${radiusClass('md')} border ${borderColor('border-strong')} ${bg('surface')} px-4 py-2 text-sm font-medium ${textColor('ink')}`}
          >
            Review and confirm
          </button>
          {confirmed ? (
            <p className={`mt-2 text-sm ${statusText('ok')}`}>Confirmed. Click Finish below to create the tenant.</p>
          ) : null}
        </div>
      </div>
    ),
  }

  return (
    <AppShell
      surface="SURF-SA"
      session={session}
      title={MODULE.name}
      breadcrumbs={[{ label: MODULE.name, href: LIST_HREF }, { label: 'Create tenant' }]}
    >
      <Wizard steps={[identityStep, commercialStep, adminStep, reviewStep]} onComplete={submit} cancelHref={LIST_HREF} />

      <ConfirmDialog
        open={confirmOpen}
        controlId="create-tenant-confirm"
        title={
          tenantCommitted
            ? `Retry the administrator invitation for ${values.name}`
            : `Create ${values.name || 'this tenant'}`
        }
        affectedObjects={affectedObjects}
        resultingState={
          tenantCommitted
            ? { subject: 'Administrator invitation', from: 'Not yet created', to: 'Invited' }
            : { subject: 'Tenant lifecycle', from: 'Not yet created', to: 'Invited' }
        }
        confirmLabel="Confirm"
        onConfirm={() => {
          setConfirmed(true)
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppShell>
  )
}
