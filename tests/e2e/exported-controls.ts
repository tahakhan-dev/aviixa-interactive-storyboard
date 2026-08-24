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
 * THE `id` IS NOT A SAFE HANDLE ON A LIVE PAGE, AND THIS COMMENT USED TO SAY
 * IT WAS. Both fields are returned. The claim here was that the `id` is what
 * a driver should locate by: every control on this surface is a
 * `src/ui/primitives` `Select` or `Checkbox`, both of which mint their `id`
 * with React's `useId`, and `useId` is IDENTICAL in the server-rendered
 * markup and after hydration. That much is true, and it is not enough.
 *
 * `useId` is stable across HYDRATION. It is NOT stable across an UNMOUNT AND
 * REMOUNT: React mints a fresh value, in a different format. Measured on
 * `/hub/integration-surface/`, driving the viewer role off its default and
 * back — a region that unmounts for a role that cannot read it:
 *
 *   before  Screen state = _R_a5uav5ubtb_      (server-rendered)
 *   away    Screen state = _r_1_               (remounted on the client)
 *   back    Screen state = _r_5_               (remounted again)
 *
 * A driver holding the exported id addresses NOTHING from that point on, and
 * because a Playwright action given no explicit timeout inherits the test's,
 * it reports the wall clock rather than the cause. This cost two Hub routes a
 * five-minute `Test timeout exceeded` before it was tracked down.
 *
 * SO THE LABEL IS THE HANDLE, and `tests/accessibility/axe-states.spec.ts`
 * locates by it. That is not a retreat to hand-written prose: the label is
 * parsed from the SAME export as the id, in the same pass, so a relabelled
 * control moves the export and the locator together in one build. The `id` is
 * still returned — it is what proves two parsed controls are distinct, and it
 * still names the element in a report.
 *
 * THE PROPERTY THAT MAKES A LABEL A LOCATOR IS NOW ASSERTED, NOT PUBLISHED. This
 * paragraph used to end "measured across all 78 exported routes there is not one
 * duplicated control label and not one empty one" — a hand measurement, three
 * slices stale by the time it was read (re-measured: 102 exported routes, 261
 * control positions, still zero duplicated and zero empty), checked by nothing.
 * `axe-states.spec.ts`'s `the derived control enumeration is not a stub` now
 * asserts both halves over whatever this function returns on the run, so the
 * claim cannot outlive the property and there is no number here to go stale.
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
