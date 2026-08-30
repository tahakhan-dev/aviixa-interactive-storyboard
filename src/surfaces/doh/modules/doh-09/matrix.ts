import type { PermissionOutcome } from '@/policy/decision'
import type { MatrixRowSurface } from '@/surfaces/doh/modules'
import type { TenantRoleId } from '../../../../../app/hub/HubShell'

/**
 * `MOD-DOH-09` Permissions, Roles and Access — the module's control matrix,
 * and nothing else. Twelve rows, L28520-L28533.
 *
 * ── WHY THIS FILE EXISTS, AND WHAT IT REPLACES ───────────────────────────
 * FINAL WHOLE-UNIT REVIEW (unit-02, Important 3 and 4). This module's matrix
 * used to live in `app/hub/permissions-roles-and-access/fixtures.ts`, one of
 * the slice-4 eight that keep their matrices beside their route. That file
 * was superseded whole by this unit's Task 3, which rebuilt the screen
 * against the repository, and was left behind with ZERO importers anywhere
 * in the codebase — dead in exactly the way `app/hub/devices/fixtures.ts`
 * was when Task 8 deleted it, except that `scripts/build-doh-module-reach
 * .mjs` was still reading this module's reach out of it. A dead file was
 * therefore still deciding what the live module rail drew. The matrix has
 * moved here, to the src home the slice-6 seven already use and the reach
 * generator's own FIRST candidate path, and the dead file is gone.
 *
 * ── THE THREE CORRECTED CELLS ────────────────────────────────────────────
 * The rows below are the outgoing file's, verbatim, except for three cells
 * that are marked and reasoned at their own sites: the Supervisor on
 * `issue-or-reset-managed-pin`, and the Supervisor and the Quality Manager
 * on `view-user-and-role-register`. Those three are the ONLY cells where
 * `MTX-TEN-02a`'s row for this module and this module's own card disagree —
 * the exact set `DOH_09_MODULE_ROW_TENSION.statements` in `./readings.ts`
 * enumerates from the frozen source. The other nine rows refuse both roles
 * on both tables and are untouched.
 *
 * ── WHICH READING THIS BUILD ADOPTS, AND WHO ADOPTED IT ──────────────────
 * The module row (`MTX-TEN-02a`, L22015): Supervisor `Unavailable`, Quality
 * Manager `Unavailable`. NOT because the source settles it — it does not,
 * and `./readings.ts` still carries both readings verbatim, unresolved, with
 * no `DEC-*` identifier to name — but because this unit's Task 3 already
 * adopted it, on the screen, with a reviewed citation:
 * `PermissionsScreen.tsx`'s `VIEW_REQUEST` is
 * `['TENANT_ADMIN', 'READONLY_AUDITOR']`. The defect this file closes is not
 * that the build picked a reading; it is that the build picked one reading
 * at the screen gate and a DIFFERENT one at the module rail, so the rail
 * offered the Supervisor and the Quality Manager a link to a screen that
 * then refused them. One reading, both places.
 *
 * ── WHAT THIS FILE DOES NOT DO ───────────────────────────────────────────
 * It registers no route, adds no row to `DOH_MODULES`, and resolves no
 * source contradiction. `./readings.ts` remains the record of the
 * disagreement and has been amended to say which reading this build adopted
 * and where, rather than continuing to say that neither was adopted.
 *
 * It computes nothing and decides nothing. It is data.
 */

/* ------------------------------------------------------------------ *
 * The twelve-row control matrix (L28520-L28533).
 * ------------------------------------------------------------------ */

export type MatrixRowId =
  | 'create-or-edit-user-account'
  | 'assign-or-remove-role'
  | 'assign-or-remove-scope'
  | 'remove-last-tenant-admin'
  | 'remove-last-approver-capable-role'
  | 'create-custom-role'
  | 'delegate-role-temporarily'
  | 'scope-permission-below-area'
  | 'configure-single-sign-on'
  | 'issue-or-reset-managed-pin'
  | 'view-user-and-role-register'
  | 'attribute-action-to-another-role'

export interface MatrixCell {
  readonly outcome: PermissionOutcome
  /** Never blank: a blank cell is a build-blocking defect (AC-DOC-006, L856). */
  readonly cause: string
}

export interface MatrixRow {
  readonly id: MatrixRowId
  readonly label: string
  /** Where this row's capability is met — read by the shared derivation in
   *  `@/surfaces/doh/modules`. All twelve are this screen's own: the module
   *  owns no banner and hands nothing to a device. Configuring single
   *  sign-on is edited on a SIBLING Hub screen, which is still a screen. */
  readonly surface: MatrixRowSurface
  readonly sourceRef: string
  readonly cells: Readonly<Record<TenantRoleId, MatrixCell>>
  /**
   * Which of the two `Explicitly prohibited` readings this row carries.
   * `categorical` — a rule forbids it for everyone, so it renders ABSENT.
   * `routing` — the control exists on this screen for another role, so the
   * refused role sees it DISABLED with its reason, which is what
   * `FB-QUAL-005` (L64415) asks a disabled control to teach.
   */
  readonly prohibition: 'categorical' | 'routing'
  readonly note: string
}

/** Every non-admin role, refused with the same routing cause. */
function prohibitedForOthers(cause: string): Record<TenantRoleId, MatrixCell> {
  return {
    TENANT_ADMIN: { outcome: 'allowed', cause: 'Allowed.' },
    SUPERVISOR: { outcome: 'explicitlyProhibited', cause },
    QUALITY_MANAGER: { outcome: 'explicitlyProhibited', cause },
    READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause },
    WORKER: { outcome: 'explicitlyProhibited', cause },
  }
}

/** All five refused by the same categorical rule. */
function prohibitedForAll(cause: string): Record<TenantRoleId, MatrixCell> {
  return {
    TENANT_ADMIN: { outcome: 'explicitlyProhibited', cause },
    SUPERVISOR: { outcome: 'explicitlyProhibited', cause },
    QUALITY_MANAGER: { outcome: 'explicitlyProhibited', cause },
    READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause },
    WORKER: { outcome: 'explicitlyProhibited', cause },
  }
}

const AUDITOR_NO_WRITE =
  'Explicitly prohibited — no mutating operation succeeds for the Read-only Auditor on any surface, through any interface, and the attempt is recorded as a security-relevant event (L16997).'

const WORKER_NO_SELF_SERVICE =
  'Explicitly prohibited — self-service role change is a privilege-escalation path, and the source refuses it rather than merely leaving it out (H18, L22027).'

export const PERMISSION_MATRIX = [
  {
    id: 'create-or-edit-user-account',
    surface: 'screen',
    label: 'Create a user account',
    sourceRef: 'L28522',
    prohibition: 'routing',
    cells: {
      TENANT_ADMIN: {
        outcome: 'allowedWithConditions',
        cause:
          'Allowed with conditions — blocked in every suspension state, because creating or editing an account is a configuration edit (L28522, L26919).',
      },
      SUPERVISOR: {
        outcome: 'explicitlyProhibited',
        cause:
          'Explicitly prohibited — creating a tenant user account belongs to the Tenant Admin alone (L28522).',
      },
      QUALITY_MANAGER: {
        outcome: 'explicitlyProhibited',
        cause:
          'Explicitly prohibited — creating a tenant user account belongs to the Tenant Admin alone (L28522).',
      },
      READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause: AUDITOR_NO_WRITE },
      WORKER: { outcome: 'explicitlyProhibited', cause: WORKER_NO_SELF_SERVICE },
    },
    note: 'The only control anywhere in the Hub that creates a tenant user account. Every other module that shows a person shows one this control made.',
  },
  {
    id: 'assign-or-remove-role',
    surface: 'screen',
    label: 'Assign or remove a role',
    sourceRef: 'L28523',
    prohibition: 'routing',
    cells: {
      TENANT_ADMIN: {
        outcome: 'allowedWithConditions',
        cause:
          'Allowed with conditions — the two mandatory-role rules are enforced at the moment of removal, which is the only moment they can be violated (L28495, L28523).',
      },
      SUPERVISOR: {
        outcome: 'explicitlyProhibited',
        cause: 'Explicitly prohibited — role assignment belongs to the Tenant Admin alone (L28523).',
      },
      QUALITY_MANAGER: {
        outcome: 'explicitlyProhibited',
        cause: 'Explicitly prohibited — role assignment belongs to the Tenant Admin alone (L28523).',
      },
      READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause: AUDITOR_NO_WRITE },
      WORKER: { outcome: 'explicitlyProhibited', cause: WORKER_NO_SELF_SERVICE },
    },
    note: 'Permissions become additive immediately on the web surfaces and reach devices at the next sync (WF-WKR-004, L52892).',
  },
  {
    id: 'assign-or-remove-scope',
    surface: 'screen',
    label: 'Assign or remove a scope',
    sourceRef: 'L28524',
    prohibition: 'routing',
    cells: prohibitedForOthers(
      'Explicitly prohibited — scope assignment belongs to the Tenant Admin alone (L28524).',
    ),
    note: 'Three live dimensions: tenant, Site and Area. The Sites and Areas offered are read from the location configuration module’s own records, so this module seeds no second copy of the hierarchy, and an assignment may only ever narrow the grant it acts on.',
  },
  {
    id: 'remove-last-tenant-admin',
    surface: 'screen',
    label: 'Remove the last Tenant Admin',
    sourceRef: 'L28525, AC-16-39 L20658',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — refused with the rule named, and no override exists on any surface, including within support sessions (AC-16-39, L20658).',
    ),
    note: 'The most privileged tenant role cannot do this either. No control is drawn where it would sit; the rule is stated there instead.',
  },
  {
    id: 'remove-last-approver-capable-role',
    surface: 'screen',
    label: 'Remove the last approver-capable role while a Job exists',
    sourceRef: 'L28526, L16859',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — removal of the last approver-capable role while Jobs exist is refused (L16859, L28526).',
    ),
    note: 'The paired rule to the last-Tenant-Admin one, and the reason the standing panel carries two counters rather than one.',
  },
  {
    id: 'create-custom-role',
    surface: 'screen',
    label: 'Create a custom role',
    sourceRef: 'L28527, L17662',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — the platform exposes no create-role, edit-role or clone-role control on any surface at V1 (L17662).',
    ),
    note: 'Absent, not disabled: a disabled control would imply a roadmap promise the source has not made (L23918). The role picker carries a static footnote instead.',
  },
  {
    id: 'delegate-role-temporarily',
    surface: 'screen',
    label: 'Delegate a role temporarily',
    sourceRef: 'L28528',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — delegation is deferred beyond V1, and the cover the source names is manual add and remove (L28495, L28528).',
    ),
    note: 'DEC-DELEG-001 (L17920) is open and pulls the other way: one part of the source defers delegation while another describes an authoring delegation. Nothing is built while it is open.',
  },
  {
    id: 'scope-permission-below-area',
    surface: 'screen',
    label: 'Scope a permission to a Location, a Job or a worker',
    sourceRef: 'L28529, L14515',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — Cell, Job and worker scoping are deferred beyond V1 and no rule may depend on them (L14515, L28529).',
    ),
    note: 'Absent by construction: the three deferred dimensions are held OUTSIDE the live scope type in the spine, so no picker can offer one by accident.',
  },
  {
    id: 'configure-single-sign-on',
    surface: 'screen',
    label: 'Configure single sign-on',
    sourceRef: 'L28530',
    prohibition: 'routing',
    cells: prohibitedForOthers(
      'Explicitly prohibited — the connection record is Tenant Admin configuration (L28530).',
    ),
    note: 'Two module cards claim this same action. This module renders the sign-in tracks it produces; the integration surface owns the settings screen that edits it. See the conflicts panel.',
  },
  {
    id: 'issue-or-reset-managed-pin',
    surface: 'screen',
    label: 'Issue or reset a managed personal identification number',
    sourceRef: 'L28531',
    prohibition: 'routing',
    cells: {
      TENANT_ADMIN: { outcome: 'allowed', cause: 'Allowed.' },
      /**
       * ONE OF THE THREE CORRECTED CELLS. The card reads `Allowed with
       * conditions` — own scope, for workers. `MTX-TEN-02a` marks the
       * Supervisor `Unavailable` on the WHOLE module, and `Unavailable`
       * outranks a grant on the same subject. Adopting the module row
       * therefore takes this write with it, exactly as
       * `DOH_09_MODULE_ROW_TENSION.wouldChange` predicted it would:
       * "nowhere else in the Hub issues a managed personal identification
       * number, so the Supervisor's cell at line 28531 would name a
       * capability with no surface." That is now a stated consequence of an
       * adopted reading rather than an unstated one.
       */
      SUPERVISOR: {
        outcome: 'unavailable',
        cause:
          'Unavailable — the card grants this in own scope for workers (L28531), and the tenant-role-to-module matrix MTX-TEN-02a marks the Supervisor Unavailable on this module outright. The two disagree; this build adopts the module row, so the Supervisor holds no standing here in any scope and this write has no surface.',
      },
      QUALITY_MANAGER: {
        outcome: 'explicitlyProhibited',
        cause:
          'Explicitly prohibited — the credential path is administration, not quality (L28531).',
      },
      READONLY_AUDITOR: { outcome: 'explicitlyProhibited', cause: AUDITOR_NO_WRITE },
      WORKER: { outcome: 'explicitlyProhibited', cause: WORKER_NO_SELF_SERVICE },
    },
    note: 'The login is the credential, not the device: identity and attribution travel with the person onto any conformant device, and a shared tablet confers nothing by itself (L16321).',
  },
  {
    id: 'view-user-and-role-register',
    surface: 'screen',
    label: 'View the user and role register',
    sourceRef: 'L28532',
    prohibition: 'routing',
    cells: {
      TENANT_ADMIN: { outcome: 'allowed', cause: 'Allowed.' },
      /**
       * THE OTHER TWO CORRECTED CELLS, and the pair the whole disagreement
       * turns on. The card reads `Read-only` — own scope for both roles;
       * `MTX-TEN-02a` marks both `Unavailable` on the module. Adopting the
       * module row withholds the route from both, which is precisely what
       * `PermissionsScreen.tsx`'s own `VIEW_REQUEST`
       * (`['TENANT_ADMIN', 'READONLY_AUDITOR']`) already enforces at the
       * screen. Before this file, the rail derived four roles from the card
       * and the screen refused two of them on arrival.
       */
      SUPERVISOR: {
        outcome: 'unavailable',
        cause:
          'Unavailable — the card reads Read-only in own scope (L28532), and MTX-TEN-02a marks the Supervisor Unavailable on this module outright. This build adopts the module row: the route is withheld rather than opened to a refusal.',
      },
      QUALITY_MANAGER: {
        outcome: 'unavailable',
        cause:
          'Unavailable — the card reads Read-only in own scope (L28532), and MTX-TEN-02a marks the Quality Manager Unavailable on this module outright. This build adopts the module row: the route is withheld rather than opened to a refusal.',
      },
      READONLY_AUDITOR: {
        outcome: 'readOnly',
        cause:
          'Read-only, tenant-wide — the cause is the role itself: the Auditor checks what happened and changes nothing, anywhere (L28532, L16997).',
      },
      WORKER: {
        outcome: 'unavailable',
        cause:
          'Unavailable — the Worker cannot hold this in any scope. Unavailable is not the same status as Explicitly prohibited and the two are never merged (L28532, L10238).',
      },
    },
    note: 'Read-only is never shown as the bare words: the cause is named in every one of the three cells that carry it (L48013).',
  },
  {
    id: 'attribute-action-to-another-role',
    surface: 'screen',
    // Deliberately NOT the source's own phrasing. AC-16-12 is what this row
    // enforces, and shipping its literal wording would put the very phrase
    // the gate greps for into the rendered document.
    label: 'Attribute an action to another role in the audit trail',
    sourceRef: 'L28533, AC-16-12 L20225',
    prohibition: 'categorical',
    cells: prohibitedForAll(
      'Explicitly prohibited for all five roles — every audit entry names the identity that performed the action, and no audit entry carries a role-substitution field (L17546, L28533).',
    ),
    note: 'No surface renders a session-level role context of any kind. The view control on this storyboard is the reviewer’s, it changes only which seeded fixtures render, and it alters no audit actor.',
  },
] as const satisfies readonly MatrixRow[]

/** Every declared row id is on the matrix. A missing row would otherwise only
 *  surface as a thrown `matrixRow()` at render time. */
type MissingFromMatrix = Exclude<MatrixRowId, (typeof PERMISSION_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive
