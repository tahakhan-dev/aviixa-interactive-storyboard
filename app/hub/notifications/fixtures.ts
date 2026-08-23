/**
 * Seeded copy for `/hub/notifications`, `MOD-DOH-10`.
 *
 * WHY THE TITLE NAMES BOTH HALVES. Catalogue B calls this screen
 * "Notification policy" and admits the Tenant Admin alone (L48113); catalogue
 * A calls the same module's screen "Notification policy and preferences" and
 * names every user for the preferences half (L26070). Nine of the twelve
 * matrix rows are the policy half and two are the preference half, so a title
 * carrying only catalogue B's name would describe a screen that renders more
 * than it says. The route slug carries neither number, per D1 — an `SCR-*` id
 * is an annotation and never a route key, and catalogue A's identifier for
 * this row is the banned three-digit form in any case.
 */
export const SCREEN_TITLE = 'Notification policy and preferences'

export const ROUTE_SLUG = 'notifications'

/**
 * Sits where a module's id and screen annotation would. This route uses
 * `HubShell`'s uncatalogued-screen mode, because `MOD-DOH-10` is not in
 * `DOH_MODULES` — a shared registry this task does not own. The annotation
 * therefore carries the module id and the catalogue-B screen id as text,
 * which is what the shell would print if the module were registered.
 */
export const SCREEN_ANNOTATION =
  'MOD-DOH-10 · SCR-DOH-19 · /hub/notifications — annotations, never route keys (D1). The module is not yet a row in the Hub module registry, so this route draws no rail entry; see the on-screen note.'

/** The module's own Purpose field, verbatim from its identity card, L28672. */
export const SCREEN_PURPOSE =
  'Carry operational and administrative facts to the right people on two channels, with a mandatory floor that cannot be silenced.'
