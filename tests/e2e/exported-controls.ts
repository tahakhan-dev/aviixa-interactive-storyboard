import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { exportedRoutes } from './exported-routes'

/**
 * EVERY DRIVABLE CONTROL IN THE STATIC EXPORT, READ FROM THE EXPORT.
 *
 * THE DEFECT THIS CLOSES. `tests/e2e/exported-routes.ts` derived the ROUTE
 * list from the built tree and fixed the hand-list defect one level up —
 * but every harness built on it then called `page.goto(path)` and scanned
 * whatever the page renders on arrival. Task 26's verification measured the
 * consequence: axe covered 71 routes with zero violations, at their DEFAULT
 * STATE ONLY. Nothing drove a persona, a screen state or a simulation
 * toggle, so the WCAG 2.2 AA claim covered one position of a control space
 * that has hundreds — and eleven of the eighteen Studio screens had no pass
 * in any state other than the one the page happens to load in.
 *
 * The fix is the same shape as the route fix, one level down: the CONTROLS
 * are derived too. A new select, a new option or a new toggle is driven the
 * moment `pnpm build` emits it, with no edit here and none in the spec.
 *
 * WHY THE `id` AND NOT THE LABEL TEXT IS THE HANDLE. Both are returned, but
 * the `id` is what a driver locates by. Every control on this surface is a
 * `src/ui/primitives` `Select` or `Checkbox`, both of which mint their `id`
 * with React's `useId` — an id that is IDENTICAL in the server-rendered
 * markup and after hydration, which is the whole contract of `useId`. So an
 * id parsed out of `index.html` addresses the same element the live page
 * exposes, and it needs no HTML-entity decoding, no disambiguation between
 * two controls that happen to share a label, and no `exact:` guesswork. The
 * label is carried for the failure message, because `#_R_2qmav5ubtb_` names
 * nothing a human can act on.
 *
 * WHAT THIS DOES NOT DO. It reports what a control OFFERS. It says nothing
 * about whether driving it changes anything — that is the driver's
 * assertion to make, and `tests/accessibility/axe-states.spec.ts` makes it
 * on every position it drives, because a scan of the default state repeated
 * eight times under eight different labels is exactly the vacuous pass this
 * file exists to end.
 */
export interface ExportedSelect {
  readonly id: string
  readonly label: string
  /** Every `<option value>`, in document order. The first is not necessarily
   *  the selected one — `selected` is a `value` on the `<select>`, and the
   *  driver reads the live value rather than assuming position zero. */
  readonly options: readonly string[]
}

export interface ExportedCheckbox {
  readonly id: string
  readonly label: string
}

export interface RouteControls {
  readonly path: string
  readonly selects: readonly ExportedSelect[]
  readonly checkboxes: readonly ExportedCheckbox[]
}

const escapeForRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The four entities React escapes into SSR text. Reporting only — never a
 *  locator, so a fifth entity showing up degrades a message and breaks
 *  nothing. */
function decodeText(raw: string): string {
  return raw
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

export function controlsInHtml(html: string): Omit<RouteControls, 'path'> {
  const selects: ExportedSelect[] = []
  const checkboxes: ExportedCheckbox[] = []

  for (const m of html.matchAll(/<label[^>]*\sfor="([^"]+)"[^>]*>([^<]*)<\/label>/g)) {
    const id = m[1]
    const label = decodeText(m[2] ?? '')
    if (id === undefined) continue
    const anchored = escapeForRegExp(id)

    const select = html.match(new RegExp(`<select[^>]*\\sid="${anchored}"[^>]*>([\\s\\S]*?)</select>`))
    if (select) {
      const body = select[1] ?? ''
      selects.push({
        id,
        label,
        options: [...body.matchAll(/<option[^>]*\svalue="([^"]*)"/g)].map((o) => o[1] ?? ''),
      })
      continue
    }

    const input = html.match(new RegExp(`<input[^>]*\\sid="${anchored}"[^>]*>`))
    if (input && /\stype="checkbox"/.test(input[0])) checkboxes.push({ id, label })
  }

  return { selects, checkboxes }
}

/**
 * Pure over `root` for the same reason `exportedRoutes` is: so its own
 * behaviour can be proved against a synthesised tree rather than against
 * whatever `out/` happens to hold. See the planted-page proof in
 * `tests/e2e/routes.spec.ts`.
 */
export function drivableControls(root = 'out'): RouteControls[] {
  return exportedRoutes(root).map((path) => {
    const html = readFileSync(join(root, path, 'index.html'), 'utf8')
    return { path, ...controlsInHtml(html) }
  })
}
