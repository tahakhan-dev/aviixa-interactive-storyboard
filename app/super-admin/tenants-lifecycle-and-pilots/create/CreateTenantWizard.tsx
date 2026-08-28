'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { evaluateAccess, type AccessRequest } from '@/policy/evaluate'
import { permitsAction } from '@/policy/decision'
import { Tenant, User } from '@/data/schemas/platform'
import type { WriteResult } from '@/data/repository'
import { saModuleById } from '@/surfaces/sa/modules'

/**
 * Task 5 (unit-01) — the tenant-creation wizard: Identity, Commercial, First
 * administrator, Review. Runs after Task 6, whose detail route
 * (`detail/?tenant=<id>`) is where a successful create navigates.
 *
 * TWO WRITES, ONE LOGICAL CREATION, NO MULTI-COLLECTION TRANSACTION. The
 * repository (`src/data/repository.ts`) commits one collection at a time —
 * there is no primitive that writes `tenants` and `users` atomically
 * together. The choice made here, stated plainly (brief's own instruction):
 * write the tenant FIRST; if that fails, nothing exists and a retry starts
 * clean. If the tenant write SUCCEEDS but the administrator's `users` row
 * then fails, the tenant now exists without an administrator — this is
 * never allowed to pass silently as a generic "could not be saved" message.
 * `partialFailureNote` below renders a distinct, explicit statement of
 * exactly that fact (which row exists, which does not, why), and the
 * already-created tenant's id is remembered (`pending` state) so clicking
 * Finish again retries ONLY the administrator's row — it never re-attempts
 * to create the tenant a second time.
 *
 * TWO PLATFORM-LAYER FIXES THIS TASK NEEDED, BOTH IN `src/data/repository.ts`
 * (disclosed in the task report, not narrated again here): (1) a pre-existing
 * fix (Task 6) that stopped a `tenants` write from refusing itself by reading
 * its own not-yet-active state back as a refusal; (2) a new, narrower fix
 * this task adds — a brand-new tenant is ALWAYS `invited` (`PROVISIONING`)
 * at the exact moment its first administrator's `users` row is created, and
 * without the fix that state read back as a refusal on the SECOND write too.
 * See `authorizeWrite`'s own comment for the reasoning.
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

/**
 * `SB-31-01` (L75180, L52400): New Tenant is held by the Root Super Admin
 * and the Admin alone — the SAME decision `TenantsScreen.tsx`'s own
 * `createDecision` gates the list's "Create tenant" link with, enforced
 * again here at the point of the actual write. `TenantsScreen.tsx` hides
 * its link for every other role, so a Platform Engineer or Support identity
 * reaches this wizard only via a hand-typed or bookmarked URL — reachable,
 * not linked, matching the same pattern `TenantDetailScreen.tsx`'s two "no
 * such tenant" states already established for this surface. This wizard
 * deliberately does NOT repeat that gate at the page level: every step is
 * viewable and fillable by any signed-in platform role (values are real
 * work product regardless of who typed them), and the repository's own
 * role floor for `tenants`/`users` writes (`defaultWriteRoles('platform')`,
 * wider — it also includes Platform Engineer) is not the right floor for
 * THIS specific action either, so this decision is evaluated explicitly,
 * here, before either write is attempted.
 */
const CREATE_TENANT_REQUEST = {
  action: 'create-tenant',
  allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
  sourceRefs: ['L75180', 'L52400', 'SB-31-01'],
} as const satisfies AccessRequest

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

interface Pending {
  readonly tenantId: string
  readonly userId: string
  readonly tenantCreated: boolean
}

function slugify(name: string): string {
  const slug = name.toUpperCase().replace(/[^A-Z0-9]+/g, '')
  return slug.length > 0 ? slug.slice(0, 16) : 'TENANT'
}

/** A single field's own schema (a sub-schema of the exact `Tenant`/`User`
 *  objects the repository validates against), not a hand-copied rule. */
function fieldIssues<V>(schema: { safeParse: (v: V) => { success: boolean; error?: { issues: readonly { message: string }[] } } }, value: V): string[] {
  const result = schema.safeParse(value)
  if (result.success) return []
  return (result.error?.issues ?? []).map((i) => i.message)
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

function CreateTenantWizardBody({ session }: { readonly session: ProductSession }) {
  const ctx = useAccessContext()
  const repository = useRepository()
  const store = useStore()
  const router = useRouter()

  const [values, setValues] = useState<WizardValues>(INITIAL_VALUES)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
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
    setValues((prev) => ({ ...prev, [key]: value }))
    setConfirmed(false)
    // A reserved id is only invalidated by an edit while nothing has
    // actually been written yet — once the tenant row is real
    // (`tenantCreated`), later edits must not orphan it under a fresh id.
    setPending((prev) => (prev !== null && prev.tenantCreated ? prev : null))
  }

  function ensurePending(): Pending {
    if (pending !== null) return pending
    const seq = store.nextSequence()
    const slug = slugify(values.name)
    const next: Pending = { tenantId: `TEN-${slug}-${seq}`, userId: `USR-${slug}-ADM-${seq}`, tenantCreated: false }
    setPending(next)
    return next
  }

  async function submit(): Promise<WriteResult<unknown>> {
    const gate = evaluateAccess(CREATE_TENANT_REQUEST, ctx)
    if (!permitsAction(gate)) {
      // A real permission decision, not a fabricated one — same
      // `evaluateAccess` function and `WriteResult` denied shape
      // `repository.ts#refusal` itself builds from a decision. Nothing is
      // attempted: neither write runs when this gate refuses.
      return { ok: false, kind: 'denied', decision: gate, reason: gate.reasonCode, explain: gate.explanation }
    }

    const current = ensurePending()
    const nowIso = new Date(store.clock.now()).toISOString()

    if (!current.tenantCreated) {
      const tenantResult = await repository.create('tenants', buildTenantRow(current.tenantId, values, nowIso), ctx)
      if (!tenantResult.ok) {
        setPending(null) // nothing written; a retry reserves a fresh id
        return tenantResult
      }
      setPending({ ...current, tenantCreated: true })
    }

    const userResult = await repository.create('users', buildUserRow(current.userId, current.tenantId, values, nowIso), ctx)
    if (!userResult.ok) {
      setPartialFailureNote(
        `${values.name} (${current.tenantId}) was created, but its administrator invitation could not be saved: ` +
          `${userResult.explain} The tenant now exists without an administrator. Click Finish again to retry only ` +
          'the invitation — the tenant will not be created a second time.',
      )
      return userResult
    }
    setPartialFailureNote(null)
    router.push(`/super-admin/tenants-lifecycle-and-pilots/detail/?tenant=${encodeURIComponent(current.tenantId)}&created=1`)
    return userResult
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
        title={`Create ${values.name || 'this tenant'}`}
        affectedObjects={affectedObjects}
        resultingState={{ subject: 'Tenant lifecycle', from: 'Not yet created', to: 'Invited' }}
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
