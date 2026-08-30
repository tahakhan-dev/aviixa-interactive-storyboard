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

/* `SCREEN_ANNOTATION` AND `SCREEN_PURPOSE` WERE HERE AND ARE GONE. Both
 * existed only because this route was rendered in `HubShell`'s
 * uncatalogued-screen mode while `MOD-DOH-10` was not a row of `DOH_MODULES`.
 * It is one now, so the shell derives the annotation from
 * `@/surfaces/doh/screens` and the purpose from the module row, and a second
 * copy of either here would be a hand-maintained duplicate of a registered
 * value — the annotation's own text asserted "this route draws no rail entry",
 * which the rail now contradicts. `SCREEN_TITLE` stays because the browser tab
 * is the one thing the shell does not name. */
