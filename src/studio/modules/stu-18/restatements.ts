/**
 * The other five tables the frozen source states about Studio permissions,
 * and the things it does not state at all.
 *
 * EVERY STATUS IN THIS FILE IS A SENTENCE, NEVER A PERMISSION TOKEN. That is
 * the structural half of "not one of its statuses reaches an affordance":
 * there is no `PermissionOutcome` anywhere in this file for an evaluator to
 * consume, so a disputed table cannot grant or refuse anything even by
 * accident. `matrix.ts` holds the only cells this module evaluates.
 *
 * D2 — THE GOVERNING RULE. The chapter-20 module matrices govern every cell,
 * without exception. The three coarser tables below are restatements at
 * coarser granularity and they disagree with chapter 20; all three are
 * transcribed so the disagreement is visible rather than inherited.
 *
 * No row here carries a field named `surface`, deliberately:
 * `scripts/build-stu-module-reach.mjs` finds a module's matrix by shape, and
 * a second array of rows carrying that key would make this module's real
 * matrix ambiguous — the generator takes a file only when it yields exactly
 * one candidate, and silently skips the file otherwise.
 */

/* ==================================================================== *
 * §5.18's own table — L34514 to L34518, FIVE data rows.
 * ==================================================================== */

export interface FixedRoleRow {
  readonly role: string
  readonly access: string
  readonly locator: string
}

/**
 * Headed **Fixed role**. It INCLUDES Plant Manager, which §3.5 states is not
 * a role, and it OMITS the Read-only Auditor entirely — which is the whole of
 * why `DEC-AUDSTU-001` exists.
 */
export const FIVE_ROLE_TABLE = [
  {
    role: 'Quality Manager',
    access:
      'Full authoring across all nine sections, Shared Instruction Blocks, and Content Libraries which the Quality Manager owns; manages Qualification Requirements; Release Authority by tenant default; holds or delegates the Agent Author capability; learning read view',
    locator: 'L34514',
  },
  {
    role: 'Supervisor',
    access:
      'Read-only access to published Workflow content — screen sequences, instruction text, specification limits — for reference. With the authoring grant, meaning a quality engineer staffed in this role: create Workflows, author all nine sections, create and apply Shared Instruction Blocks, propose Content Library changes, and submit for review; act as Reviewer on submissions they did not author; cannot approve or release',
    locator: 'L34515',
  },
  {
    role: 'Plant Manager',
    access:
      'Read-only access to published Workflow content. No access to drafts or in-review versions; cannot edit',
    locator: 'L34516',
  },
  {
    role: 'Tenant Admin',
    access:
      'Administers Studio capacities — assigns and revokes the authoring grant and the Agent Author delegation, per the tenant administration area; read-only access to published content; holds no stage of the approval chain, for separation of duties',
    locator: 'L34517',
  },
  {
    role: 'Frontline Worker',
    access:
      'No access to the Studio. Workers meet Workflow content exclusively through the Frontline surface during Run execution',
    locator: 'L34518',
  },
] as const satisfies readonly FixedRoleRow[]

/* ==================================================================== *
 * Chapter 20's expansion — L30821 to L30828, EIGHT data rows.
 * ==================================================================== */

export interface Chapter20RoleRow {
  readonly role: string
  readonly identifier: string
  readonly access: string
  readonly classification: 'SoW Fact' | 'Client Decision Required'
  readonly locator: string
}

export const CHAPTER20_TENANT_ROLES = [
  {
    role: 'Quality Manager',
    identifier: 'ROLE-TEN-QM',
    access:
      'Allowed — full authoring across all nine screen configuration sections, Shared Instruction Blocks, and Content Libraries which the Quality Manager owns; manages Qualification Requirements; Release Authority by tenant default; holds or delegates the Agent Author capability; learning read view',
    classification: 'SoW Fact',
    locator: 'L30821',
  },
  {
    role: 'Supervisor, without the authoring grant',
    identifier: 'ROLE-TEN-SUP',
    access:
      'Read-only — published Workflow content only: screen sequences, instruction text, specification limits, for reference',
    classification: 'SoW Fact',
    locator: 'L30822',
  },
  {
    role: 'Supervisor with the authoring grant',
    identifier: 'GRANT-STU-AUTHOR',
    access:
      'Allowed with conditions — create Workflows, author all nine sections, create and apply Shared Instruction Blocks, propose Content Library changes, submit for review, act as Reviewer on submissions they did not author; cannot approve or release',
    classification: 'SoW Fact',
    locator: 'L30823',
  },
  {
    role: 'Tenant Admin',
    identifier: 'ROLE-TEN-ADMIN',
    access:
      'Allowed with conditions — administers Studio capacities, assigning and revoking the authoring grant and the Agent Author delegation from the tenant administration area; read-only access to published content; holds no stage of the approval chain',
    classification: 'SoW Fact',
    locator: 'L30824',
  },
  {
    role: 'Read-only Auditor',
    identifier: 'ROLE-TEN-AUD',
    access:
      'Client Decision Required — DEC-AUDSTU-001; the §5.18 table does not include this role',
    classification: 'Client Decision Required',
    locator: 'L30825',
  },
  {
    role: 'Worker',
    identifier: 'ROLE-TEN-WKR',
    access: 'Explicitly prohibited — no Studio access of any kind',
    classification: 'SoW Fact',
    locator: 'L30826',
  },
  {
    role: 'Plant Manager, a persona listed as a fixed role in §5.18',
    identifier: 'DEC-ROLE-001',
    access:
      'Read-only — published Workflow content; no access to drafts or in-review versions; cannot edit. Carried under DEC-ROLE-001',
    classification: 'Client Decision Required',
    locator: 'L30827',
  },
  {
    role: 'Implementation team, during onboarding',
    identifier: 'GRANT-STU-IMPL',
    access:
      'Allowed with conditions — full authoring and submission rights, no approve or release rights, all actions audited, access revoked at the conclusion of onboarding',
    classification: 'SoW Fact',
    locator: 'L30828',
  },
] as const satisfies readonly Chapter20RoleRow[]

/* ==================================================================== *
 * Platform roles — L30809 to L30812, FOUR data rows. BOTH COLUMNS.
 * ==================================================================== */

export interface PlatformRoleRow {
  readonly role: string
  readonly roleId: string
  /** Standing access, which is `Explicitly prohibited` for all four. */
  readonly standing: string
  /** Access through a named class, which is a permission for all four. */
  readonly throughNamedClass: string
  readonly note: string
  readonly locator: string
}

/**
 * BOTH COLUMNS RENDER, LABELLED, and the reason is a real defect this avoids.
 *
 * `MTX-PLAT-01` (L21068) gives the Platform Engineer `Explicitly prohibited`
 * at surface level while §20.1.3's platform table (L30811) gives the same
 * role `Allowed with conditions — support session read-only`. **Both are
 * true.** The surface matrix states STANDING access; the chapter table states
 * access through a NAMED CLASS. A build reading only the surface matrix
 * renders the Engineer as never able to see a Studio screen, which is wrong
 * inside a support session.
 */
export const PLATFORM_ROLE_ACCESS = {
  locator: 'L30807–L30812',
  surfaceMatrixLocator: 'MTX-PLAT-01 · L21068',
  surfaceMatrixReading:
    'MTX-PLAT-01 gives SURF-STU `Allowed with conditions` to the Root Super Admin, the Admin and Support, and `Explicitly prohibited` to the Platform Engineer — a STANDING-access statement.',
  chapterReading:
    '§20.1.3’s platform table gives the Platform Engineer `Allowed with conditions — support session read-only; registry and evaluation work happens in the console, not the Studio` — an access-through-a-named-class statement.',
  reconciliation:
    'Both are true and they answer different questions. Neither is dropped, and neither is treated as correcting the other: standing access and named-class access are two rows of the same fact.',
  rows: [
    {
      role: 'Root Super Admin',
      roleId: 'ROLE-PLAT-ROOT',
      standing: 'Explicitly prohibited',
      throughNamedClass:
        'Allowed with conditions — compliance-emergency path only, dual-authorised with one Admin, time-boxed, scope declared before it opens',
      note: 'Exactly one account exists; created through the backend at platform commissioning.',
      locator: 'L30809',
    },
    {
      role: 'Admin',
      roleId: 'ROLE-PLAT-ADMIN',
      standing: 'Explicitly prohibited',
      throughNamedClass:
        'Allowed with conditions — support session read-only, or as the second authorisation on the compliance-emergency path',
      note: 'Cannot author or release tenant Workflow content in any class.',
      locator: 'L30810',
    },
    {
      role: 'Platform Engineer',
      roleId: 'ROLE-PLAT-ENG',
      standing: 'Explicitly prohibited',
      throughNamedClass:
        'Allowed with conditions — support session read-only; registry and evaluation work happens in the console, not the Studio',
      note: 'Mutating console changes submit into the approval cycle.',
      locator: 'L30811',
    },
    {
      role: 'Support',
      roleId: 'ROLE-PLAT-SUP',
      standing: 'Explicitly prohibited',
      throughNamedClass:
        'Allowed with conditions — read-only, time-boxed support session with a tenant-visible banner',
      note: 'No configuration changes in any surface.',
      locator: 'L30812',
    },
  ] as const satisfies readonly PlatformRoleRow[],
} as const

/* ==================================================================== *
 * §25.3 — L48321 to L48328, EIGHT data rows. ATTRIBUTED BUT DISPUTED.
 * ==================================================================== */

export interface Section253Row {
  readonly action: string
  readonly tenantAdmin: string
  readonly supervisor: string
  readonly qualityManager: string
  readonly readOnlyAuditor: string
  readonly worker: string
}

export interface Section253Disagreement {
  readonly what: string
  readonly governedBy: string
}

/**
 * THE SINGLE MOST LIKELY THING ON THIS SURFACE FOR AN IMPLEMENTER TO
 * TRANSCRIBE. It is compact, it looks authoritative, and it fills the
 * Read-only Auditor column with statuses on all eight rows — `Not
 * applicable`, `Unavailable`, `Read-only` — where chapter 20 gives `Client
 * Decision Required` on the equivalent rows and `AC-STU-157` (L34674) forbids
 * exactly that: "every Read-only Auditor cell states `Client Decision
 * Required` rather than being guessed."
 *
 * It renders on `SCR-STU-15` as the ALTERNATIVE READING under
 * `DEC-AUDSTU-001`, with its locator, and not one of its statuses reaches an
 * affordance.
 */
export const SECTION_253_DISPUTED = {
  title: 'Actions and permissions on the Standards and Operations Studio',
  locator: '§25.3 · L48319 (header) · L48321–L48328 (eight data rows)',
  standing: 'attributed-but-disputed' as const,
  whyDisputed:
    'It gives the Read-only Auditor a resolved status on all eight rows. AC-STU-157 (L34674) forbids exactly that, and D2 rules that the chapter-20 module matrices govern every cell without exception. The table is reproduced because a disagreement a client cannot see is a disagreement a client cannot decide.',
  rows: [
    {
      action: 'Open published Workflow content',
      tenantAdmin: 'Read-only',
      supervisor: 'Read-only',
      qualityManager: 'Allowed',
      readOnlyAuditor:
        'Not applicable — the Auditor works from the Delivery Operations Hub record, which carries every publication event',
      worker: 'Explicitly prohibited',
    },
    {
      action: 'Create or edit a Workflow draft',
      tenantAdmin: 'Unavailable',
      supervisor: 'Allowed with conditions — only with the authoring grant',
      qualityManager: 'Allowed',
      readOnlyAuditor: 'Unavailable',
      worker: 'Explicitly prohibited',
    },
    {
      action: 'Act as Reviewer on a submission',
      tenantAdmin: 'Explicitly prohibited — the Tenant Admin holds no stage of the chain',
      supervisor:
        'Allowed with conditions — only with the authoring grant and only on submissions this identity did not author',
      qualityManager: 'Allowed with conditions — never on this identity’s own submission',
      readOnlyAuditor: 'Unavailable',
      worker: 'Explicitly prohibited',
    },
    {
      action: 'Publish a version as Release Authority',
      tenantAdmin: 'Explicitly prohibited',
      supervisor: 'Unavailable',
      qualityManager: 'Allowed with conditions — tenant default, overridable per workflow',
      readOnlyAuditor: 'Unavailable',
      worker: 'Explicitly prohibited',
    },
    {
      action: 'Maintain Content Libraries',
      tenantAdmin: 'Unavailable',
      supervisor: 'Allowed with conditions — may propose changes through the approval chain',
      qualityManager: 'Allowed',
      readOnlyAuditor: 'Read-only',
      worker: 'Explicitly prohibited',
    },
    {
      action: 'Compose a reasoning agent',
      tenantAdmin:
        'Allowed with conditions — may delegate the Agent Author capability but not exercise it',
      supervisor: 'Unavailable',
      qualityManager:
        'Allowed with conditions — requires the Agent Author capability and a Growth or Enterprise tier',
      readOnlyAuditor: 'Unavailable',
      worker: 'Explicitly prohibited',
    },
    {
      action: 'Assign or revoke the authoring grant',
      tenantAdmin: 'Allowed',
      supervisor: 'Unavailable',
      qualityManager: 'Unavailable',
      readOnlyAuditor: 'Read-only',
      worker: 'Explicitly prohibited',
    },
    {
      action: 'Define a severity level',
      tenantAdmin: 'Explicitly prohibited',
      supervisor: 'Explicitly prohibited',
      qualityManager: 'Explicitly prohibited',
      readOnlyAuditor: 'Explicitly prohibited',
      worker: 'Explicitly prohibited',
    },
  ] as const satisfies readonly Section253Row[],
  disagreements: [
    {
      what:
        'It gives the Read-only Auditor a resolved status on all eight rows, where chapter 20 gives Client Decision Required on the equivalent rows.',
      governedBy: 'AC-STU-157 · L34674',
    },
    {
      what:
        'Row five gives the Auditor Read-only on Content Libraries, where MOD-STU-07’s own matrix gives Client Decision Required — DEC-AUDSTU-001.',
      governedBy: 'MOD-STU-07 · L32637',
    },
    {
      what:
        'Row seven gives the Auditor Read-only on grant administration, where the consolidated matrix gives Explicitly prohibited.',
      governedBy: 'MOD-STU-18 · L34558',
    },
  ] as const satisfies readonly Section253Disagreement[],
} as const

/* ==================================================================== *
 * The three coarser restatements, one row each about SURF-STU.
 * ==================================================================== */

export interface CoarserRestatement {
  readonly id: string
  readonly title: string
  readonly locator: string
  readonly statement: string
  readonly disagreement: string
  readonly governedBy: string
}

export const COARSER_RESTATEMENTS = [
  {
    id: 'MTX-TEN-02b',
    title: 'Tenant role to module, the eighteen derived Studio modules',
    locator: 'L22050',
    statement:
      'MOD-STU-18’s own row: Tenant Admin `Allowed with conditions` [Y20]; Supervisor `Read-only`; Quality Manager `Read-only`; Read-only Auditor `Client Decision Required` [Y1]; Worker `Explicitly prohibited` [Y2].',
    disagreement:
      'It states five columns where the consolidated matrix heads eight, so the two Supervisor columns, the Plant Manager persona and GRANT-STU-IMPL have nowhere to go. Its `Unavailable` cells on MOD-STU-04, MOD-STU-05 and MOD-STU-10 are the ROLE-axis sense of the token, which chapter 20 states as Explicitly prohibited or Read-only — and under D9 those two render oppositely, so a build reading this table would draw disabled controls where chapter 20 draws nothing.',
    governedBy: 'D2 — the chapter-20 module matrices govern every cell, without exception.',
  },
  {
    id: 'MTX-TEN-01',
    title: 'Tenant role to surface',
    locator: 'L21928',
    statement:
      'SURF-STU: Tenant Admin `Allowed with conditions` [U6]; Supervisor `Read-only` [U7]; Quality Manager `Allowed` [U8]; Read-only Auditor `Client Decision Required` [U9]; Worker `Explicitly prohibited` [U10].',
    disagreement:
      'One row for a whole surface. It cannot express the authoring grant, so the Supervisor reads as read-only even where the grant is applied — which is the case §5.18 calls a quality engineer.',
    governedBy: 'D2 — a surface-level restatement, correct about the surface and coarse about the module.',
  },
  {
    id: 'MTX-PLAT-01',
    title: 'Platform role to surface',
    locator: 'L21068',
    statement:
      'SURF-STU: Root Super Admin `Allowed with conditions` [P4]; Admin `Allowed with conditions` [P8]; Platform Engineer `Explicitly prohibited` [P6]; Support `Allowed with conditions` [P7].',
    disagreement:
      'It gives the Platform Engineer Explicitly prohibited at surface level while §20.1.3 gives the same role support-session read-only. Both are true — standing access against access through a named class — and this build renders both, labelled.',
    governedBy: 'D2, and the standing-versus-named-class distinction stated beside it.',
  },
] as const satisfies readonly CoarserRestatement[]

/* ==================================================================== *
 * What the source does not state at all.
 * ==================================================================== */

export interface UnspecifiedItem {
  readonly id: string
  readonly question: string
  readonly readings: readonly { readonly text: string; readonly locator: string }[]
  readonly adopted: string
  /** What this build's position costs, stated rather than hidden. */
  readonly cost: string
  readonly locator: string
}

/**
 * The unspecified-in-source panel for `MOD-STU-18`.
 *
 * These are NOT rendered through `DecisionDisclosure`: task 3's twenty-four
 * records carry no entry for `DEC-ROLE-001`, and none for the two divergences
 * this module found in its own reading, so there is no id to hand it. Each
 * entry therefore states its own alternatives and its own cost, which is what
 * the standing rule requires of an unresolved source decision — the client
 * delegated the decision, not the pretence that the source settled it.
 */
export const UNSPECIFIED_IN_SOURCE = [
  {
    id: 'DEC-ROLE-001',
    question: 'Is Plant Manager a fixed role, or a persona?',
    readings: [
      {
        text: '§5.18’s table is headed **Fixed role** and includes Plant Manager as one of its five rows.',
        locator: 'L34512–L34516',
      },
      {
        text: '§3.5 states plainly that there is no Quality Director and fixes exactly five roles: Tenant Admin, Supervisor, Quality Manager, Read-only Auditor and Worker. §6.1.3 separately lists “Plant Manager / Quality Director” as a Client Command Center user group.',
        locator: 'DEC-ROLE-001 · L34522',
      },
    ],
    adopted:
      'The source’s own recorded position: a persona “whose Studio access is delivered by a Supervisor role without the authoring grant, which produces exactly the access §5.18 describes”. The column stays in the matrix and no sixth role is minted, so this build’s evaluator resolves a Plant Manager through the supervisor-without-grant column and says so.',
    cost:
      'A Plant Manager and a Supervisor without the grant are indistinguishable in the audit log, because they are one role there. If the client makes Plant Manager a role, every cell of that column becomes separately settable and the two stop sharing an answer.',
    locator: 'L34522 · L34516',
  },
  {
    id: 'grant-administration-surface',
    question: 'Where does grant administration happen — the Studio, or the Hub?',
    readings: [
      {
        text: 'MOD-STU-18’s own Owning surface field: “grant administration sits in the tenant administration area inside the Delivery Operations Hub”. Row 18’s Tenant Admin cell repeats it: “administers Studio capacities from the tenant administration area”.',
        locator: 'L34532 · L34558',
      },
      {
        text: 'Catalogue B gives the Studio a screen whose stated purpose is exactly this: SCR-STU-15, “Studio permissions and grants — Assign and revoke authoring and Agent Author grants”. Chapter 12 names the screen SCR-STU-GRANT-01, a Studio-prefixed identifier.',
        locator: 'L48273 · L16457',
      },
    ],
    adopted:
      'The screen is built here, because two source statements put a Studio screen on it and one puts the administrative area elsewhere, and a build with no screen at all would leave SCR-STU-15 pointing at nothing. Row 18 is classified as a screen row for the same reason. The divergence is recorded rather than resolved.',
    cost:
      'If the client rules that grant administration is Hub-only, this screen becomes a read view and the two controls move to MOD-DOH-09 — the matrix row and its audit path are unchanged, because the rule is the same wherever the control is drawn.',
    locator: 'L34532 · L48273 · L16457',
  },
  {
    id: 'scr-stu-15-roles-that-can-open-it',
    question: 'Who may open SCR-STU-15?',
    readings: [
      {
        text: 'Catalogue B’s “Roles that can open it” column names the Tenant Admin, and nobody else.',
        locator: 'L48273',
      },
      {
        text: 'SB-STU-21 describes the capability panel as “a view showing the signed-in identity, its roles, its grants, and the tenant’s tier”, and adds that “the Tenant Admin’s view of the same information adds Assign and Revoke controls” — which reads as every signed-in identity seeing the panel and one of them seeing the controls.',
        locator: 'L34631',
      },
    ],
    adopted:
      'SB-STU-21’s reading, because it is the more specific statement and because a capability panel only the Tenant Admin can open cannot satisfy AC-STU-155 — “every unavailable capability is shown with its specific missing condition named” — for the people whose capabilities are unavailable. The Assign and Revoke controls remain the Tenant Admin’s alone, decided per control by the evaluator over row 18.',
    cost:
      'If catalogue B governs, this screen narrows to one persona and the capability panel moves wholly onto SCR-STU-01, which every signed-in identity reaches. Nothing about who may assign a grant changes either way.',
    locator: 'L48273 · L34631 · AC-STU-155 L34672',
  },
] as const satisfies readonly UnspecifiedItem[]
