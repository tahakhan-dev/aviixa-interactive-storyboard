/**
 * The single sign-on connection record. Controller ruling C2: the record is
 * DATA, not a screen — `MOD-DOH-09`'s two-track sign-in branches on it, and
 * the integration settings screen (a later task) renders it. It lands here so
 * both consumers read one definition instead of two.
 *
 * There is no authentication anywhere in this build. This record is a seeded
 * fixture: nothing below contacts an identity provider, and no field means a
 * directory was reached. See `SSO_PROTOTYPE_NOTE`, which every screen that
 * renders this record must also render.
 *
 * Two source gates shape the type and must never be softened by adding a
 * field that implies otherwise:
 *
 * - **Authentication is not authorization** (L95776, `AC-RBAC-203` L20993).
 *   Role assignment stays inside the platform; an assertion carrying a group
 *   or role claim is untrusted input, logged and ignored. That is why the
 *   record carries `assertedRoleClaimHandling` as a one-value union rather
 *   than a mapping table: there is no claim-to-role mapping to configure.
 * - **No just-in-time provisioning at the first version** (L95794). The
 *   platform maps the asserted subject to exactly one existing user record in
 *   exactly one tenant; where none exists, sign-in is refused. `DEC-SSO-001`
 *   (L95907) is the open decision that governs it.
 */

/** The connection record's own states (module card for the integration surface). */
export type SsoConnectionState = 'configured' | 'not_configured' | 'reserved_inert'

export const SSO_CONNECTION_STATES = [
  'configured',
  'not_configured',
  'reserved_inert',
] as const satisfies readonly SsoConnectionState[]

type MissingFromConnectionStates = Exclude<
  SsoConnectionState,
  (typeof SSO_CONNECTION_STATES)[number]
>
const _connectionStatesExhaustive: MissingFromConnectionStates extends never ? true : never = true
void _connectionStatesExhaustive

/** `FEAT-DOH-1201` names both and nothing else (L47260). */
export type SsoProtocol = 'saml' | 'openid-connect'

export const SSO_PROTOCOLS = ['saml', 'openid-connect'] as const satisfies readonly SsoProtocol[]

type MissingFromProtocols = Exclude<SsoProtocol, (typeof SSO_PROTOCOLS)[number]>
const _protocolsExhaustive: MissingFromProtocols extends never ? true : never = true
void _protocolsExhaustive

/**
 * The two tracks of `FEAT-DOH-0903`. Deliberately closed at two: the source
 * describes an address screen that resolves the email domain to a configured
 * connection, and a secondary platform-managed credential path for staff with
 * no identity provider (L95827-L95832). There is no third track.
 */
export type SignInTrack = 'sso' | 'managed'

export const SIGN_IN_TRACKS = ['sso', 'managed'] as const satisfies readonly SignInTrack[]

type MissingFromTracks = Exclude<SignInTrack, (typeof SIGN_IN_TRACKS)[number]>
const _tracksExhaustive: MissingFromTracks extends never ? true : never = true
void _tracksExhaustive

export interface SsoConnectionRecord {
  /** The configuration record's identifier. Never a route key. */
  readonly id: string
  readonly state: SsoConnectionState
  /** `null` while the connection is not configured — a protocol nobody chose. */
  readonly protocol: SsoProtocol | null
  /** Display only. Naming a vendor here claims no contact with one. */
  readonly providerLabel: string
  /** The email domains the address screen resolves onto this connection. */
  readonly emailDomains: readonly string[]
  /** The tenant contact email the same configuration record carries. */
  readonly tenantContactEmail: string
  /** A fixture label. No clock exists in this build (determinism). */
  readonly configuredAsOfLabel: string
  /** Where the figure above came from, so a reader can judge it. */
  readonly originLabel: string
  /** Closed at one value: a role claim grants nothing (`AC-RBAC-203`). */
  readonly assertedRoleClaimHandling: 'logged-and-ignored'
  /** Closed at one value: no just-in-time provisioning at the first version. */
  readonly justInTimeProvisioning: 'refused-no-record-no-sign-in'
  /** The open client decision governing this behaviour, or `null`. */
  readonly openDecision: string | null
  /** The secondary path for staff with no identity provider. */
  readonly managedCredentialPath: 'available' | 'unavailable'
  readonly sourceRefs: readonly string[]
}

/**
 * The seeded default. One tenant, one connection, configured — so the
 * two-track sign-in has two tracks to resolve between. Every value is a
 * fixture string; none was read from anywhere.
 */
export const SEEDED_SSO_CONNECTION: SsoConnectionRecord = {
  id: 'INT-DOH-SSO',
  state: 'configured',
  protocol: 'openid-connect',
  providerLabel: 'Northfield Foods corporate directory (seeded fixture)',
  emailDomains: ['northfieldfoods.example'],
  tenantContactEmail: 'workspace.admin@northfieldfoods.example',
  configuredAsOfLabel: 'as of day 14 of the seeded scenario, 09:12 site time',
  originLabel: 'from the seeded tenant configuration record, not from a directory',
  assertedRoleClaimHandling: 'logged-and-ignored',
  justInTimeProvisioning: 'refused-no-record-no-sign-in',
  openDecision: 'DEC-SSO-001',
  managedCredentialPath: 'available',
  sourceRefs: ['L29031', 'L47260', 'L95776', 'L95794', 'L95827', 'AC-RBAC-203 L20993'],
}

/**
 * The sentence every screen rendering this record must also render. Kept with
 * the record so two screens cannot describe the same fixture differently.
 */
export const SSO_PROTOTYPE_NOTE =
  'This connection record is a seeded fixture. No identity provider was contacted, nothing here ' +
  'authenticates anybody, and changing a value would change no sign-in anywhere.'

/**
 * The domain half of an address, or `null` when the value is not usable as
 * one. Deliberately strict rather than clever: exactly one `@`, something
 * either side of it, and at least one dot in the domain. A refusal here is a
 * validation state on the screen, never a silent pass.
 */
export function emailDomainOf(address: string): string | null {
  const parts = address.trim().toLowerCase().split('@')
  if (parts.length !== 2) return null
  const [local, domain] = parts
  if (local === undefined || domain === undefined) return null
  if (local.length === 0 || domain.length === 0) return null
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return null
  return domain
}

/**
 * Which of the two tracks an address resolves onto. `null` means the address
 * could not be read as one at all — the caller renders that as a validation
 * state, never as a track.
 *
 * Fails toward the managed track, never toward the federated one: an address
 * that matches no configured connection has no identity provider to send it
 * to, so the platform-held credential path is the only remaining door.
 */
export function resolveSignInTrack(
  address: string,
  record: SsoConnectionRecord,
): SignInTrack | null {
  const domain = emailDomainOf(address)
  if (domain === null) return null
  if (record.state !== 'configured') return 'managed'
  return record.emailDomains.some((d) => d.toLowerCase() === domain) ? 'sso' : 'managed'
}
