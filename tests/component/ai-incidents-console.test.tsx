import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ROLLBACK_FORMS } from '@/ai/controls/rollback'
import { BLAST_RADIUS_NODES, PAUSE_DOES_NOT_TABLE } from '@/ai/controls/blast-radius'
import { LOCAL_OPEN_DECISIONS } from '@/ai/controls/decisions'
import { PAUSE_SEMANTICS, STOP_ACTS } from '@/ai/controls/stop'
import { UNSET_GOVERNING_VALUES } from '@/ai/failures/open-values'
import {
  CONSOLE_AUTHORITY_ROWS,
  NOT_SHIPPABLE_AUTHORITY_ROWS,
  SHIPPABLE_AUTHORITY_ROWS,
} from '@/surfaces/sa/ai-failure-authority'
import { AiIncidentConsoleScreen } from '../../app/super-admin/ai-incidents/AiIncidentConsoleScreen'
import { SaConsoleShell } from '../../app/super-admin/SaConsoleShell'
import {
  DISAMBIGUATION_BANNERS,
  INCIDENT_ROUTE,
  PAUSE_SCREEN_FIELDS,
  RECONCILIATION_CLOSE_CONTROL,
} from '../../app/super-admin/ai-incidents/fixtures'

/**
 * `SB-43-351` (L91276) — THE INCIDENT CONSOLE, ON A ROUTE THE SOURCE DOES NOT
 * NAME.
 *
 * WHAT EACH CASE BELOW IS FOR:
 *
 *   1. A DERIVED ROUTE PRESENTED AS A SOURCE FACT. `grep -n '/super-admin/'`
 *      over the frozen source returns ZERO hits and `ai-incidents` occurs
 *      nowhere in it — both re-run here rather than trusted. The route is a
 *      build decision and renders as a client-delegated choice under APP-012.
 *   2. ONE CONTROL LABELLED "ROLLBACK". Eight forms are rendered; every
 *      operable element on the screen is checked, and none carries a bare
 *      rollback label. L87803 is the rule.
 *   3. A THIRD PAUSE SCOPE THAT WORKS. The site-scoped pause is drawn and
 *      inoperable with its identifier and every reading.
 *   4. A RENDERED COUNT. The whole rendered text is scanned for a number
 *      adjacent to a stopping or continuing word.
 *   5. TENANT OPERATIONAL CONTENT ON THE CONSOLE. L91276's last sentence and
 *      L91296 make reaching any a separate, audited, session-scoped act —
 *      conditional for EVERY role including Root. Nothing operational is drawn.
 *   6. A CLOSE CONTROL THAT CLOSES. L91276 gives the reconciliation checklist a
 *      DISABLED close control and L89965 says the page cannot be closed while
 *      any item is outstanding.
 *   7. AN ENABLED CONTROL FOR AN UNDECIDED ACT. Every unshippable authority row
 *      is checked for having no operable element bearing its name.
 *   8. A MANUFACTURING-SEVERITY COMPONENT. `AC-43-103` forbids sharing one, so
 *      the screen's imports are swept.
 *   9. AN INVENTED RECOVERY OBJECTIVE. `DEC-AIRTO-001` renders unset.
 *  10. A PANEL REACHABLE FROM NOTHING. The authority panel is mounted here, and
 *      the route file that reaches it is opened.
 */

const SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
const sourceText = readFileSync(SOURCE_PATH, 'utf8')
const sourceLines = ((lines: string[]) => (lines.at(-1) === '' ? lines.slice(0, -1) : lines))(
  sourceText.split('\n'),
)
const lineAt = (n: number): string => sourceLines[n - 1] ?? ''

const ROLES = ['ROOT_SUPER_ADMIN', 'ADMIN', 'PLATFORM_ENGINEER', 'SUPPORT'] as const

function interactiveElements(): Element[] {
  return Array.from(
    document.body.querySelectorAll(
      'button, a, input, select, textarea, [role=switch], [role=button], [role=tab]',
    ),
  )
}

/** Operable means it is not inert. `aria-disabled` and `disabled` are not. */
function operableElements(): Element[] {
  return interactiveElements().filter(
    (el) => el.getAttribute('aria-disabled') !== 'true' && !el.hasAttribute('disabled'),
  )
}

describe('the route is a build decision and says so', () => {
  it('finds no URL notation for this surface anywhere in the frozen source', () => {
    // The two greps the brief reports, re-run rather than trusted.
    expect(sourceText.includes('/super-admin/')).toBe(false)
    expect(sourceText.includes('ai-incidents')).toBe(false)
  })

  it('renders the route as a client-delegated choice under APP-012', () => {
    expect(INCIDENT_ROUTE.path).toBe('/super-admin/ai-incidents/')
    expect(INCIDENT_ROUTE.sourceStatus).toMatch(/build decision/i)
    render(<AiIncidentConsoleScreen />)
    expect(screen.getByTestId('incident-route-attribution').textContent).toMatch(/APP-012/)
  })

  it('carries the source-real screen identifiers it does have, each at its own line', () => {
    for (const screenId of INCIDENT_ROUTE.screenIdentifiers) {
      const line = lineAt(Number(screenId.locator.replace(/^L/, '')))
      expect(line, `${screenId.id} at ${screenId.locator}`).toContain(screenId.id)
    }
    render(<AiIncidentConsoleScreen />)
    for (const screenId of INCIDENT_ROUTE.screenIdentifiers) {
      expect(screen.getAllByText(new RegExp(screenId.id)).length).toBeGreaterThan(0)
    }
  })
})

describe('reachability, end to end and not by assumption', () => {
  it('is linked from the console index, labelled as a non-module route', () => {
    // A route Next.js will serve but nothing links to is a route only a
    // URL-typist finds, and this build's rule is that a component reachable
    // from nothing is not shipped. The index lists it under its own heading —
    // NOT among the modules, because no module identifier claims it.
    render(<SaConsoleShell />)
    const link = screen.getByRole('link', {
      name: /Artificial-intelligence incident console/i,
    })
    // MEASURED, not assumed: `next/link` renders the href WITHOUT the trailing
    // slash under jsdom, and `trailingSlash: true` in `next.config.ts` adds it
    // at build time. Every module link on this index renders the same way, so
    // the assertion matches what the DOM actually holds rather than what the
    // route registry spells. An exact-match on the slashed form was red here,
    // and loosening it to `contains` would pass for a link to a longer path.
    expect(link.getAttribute('href')).toMatch(/^\/super-admin\/ai-incidents\/?$/)
    const section = link.closest('section')
    expect(section?.textContent).toMatch(/not module routes/i)
    expect(section?.textContent).toMatch(/APP-012/)
  })

  it('does not list it among the module routes', () => {
    render(<SaConsoleShell />)
    const link = screen.getByRole('link', {
      name: /Artificial-intelligence incident console/i,
    })
    // The module lists are the two band sections; this link must be in
    // neither, or the index would be claiming a module owns the route.
    const heading = link.closest('section')?.querySelector('h2')?.textContent ?? ''
    expect(heading).not.toMatch(/Definition layer|Operations layer/)
  })
})

describe('SB-43-351 — every part of the one screen the storyboard names', () => {
  it('renders the three disambiguation banners as a vocabulary, and asserts none', () => {
    // No incident runs behind this prototype, so picking one banner would
    // claim an incident classification. The three strings and the rule that
    // computes them render instead.
    expect(DISAMBIGUATION_BANNERS.map((b) => b.text)).toEqual([
      'Artificial-intelligence incident — devices are syncing',
      'Connectivity incident — providers are healthy',
      'Compound incident',
    ])
    for (const banner of DISAMBIGUATION_BANNERS) {
      expect(lineAt(91_276)).toContain(banner.text)
    }
    render(<AiIncidentConsoleScreen />)
    const region = screen.getByTestId('incident-disambiguation')
    for (const banner of DISAMBIGUATION_BANNERS) {
      expect(region.textContent).toContain(banner.text)
    }
    // The computed rule, not a judgement — L91227.
    expect(region.textContent).toMatch(/syncing normally/i)
  })

  it('renders the blast-radius strip as tenant, site and device fields with no invented value', () => {
    render(<AiIncidentConsoleScreen />)
    const strip = screen.getByTestId('incident-blast-radius-strip')
    for (const field of ['Tenant', 'Site', 'Device']) {
      expect(strip.textContent).toContain(field)
    }
    // No occurrence exists behind this prototype, so every count states that
    // rather than showing a number. A plausible count is indistinguishable
    // from a real one and would be quoted back as the source's.
    expect(strip.textContent).toMatch(/not recorded/i)
    expect(strip.textContent).not.toMatch(/\d/)
  })

  it('renders provider-and-agent health and queue-health as separate panels', () => {
    render(<AiIncidentConsoleScreen />)
    expect(screen.getByTestId('incident-health-cards')).toBeDefined()
    expect(screen.getByTestId('incident-queue-cards')).toBeDefined()
    // Counts and rates without content (L91220, L91225-L91226) — and with no
    // occurrence, the fields render as unrecorded.
    expect(screen.getByTestId('incident-queue-cards').textContent).toMatch(/without content|counts/i)
  })

  it('renders a communications panel', () => {
    render(<AiIncidentConsoleScreen />)
    expect(screen.getByTestId('incident-communications')).toBeDefined()
  })

  it('renders the reconciliation checklist with a close control that cannot close', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const checklist = screen.getByTestId('incident-reconciliation')
    expect(checklist).toBeDefined()
    expect(RECONCILIATION_CLOSE_CONTROL.sourceRefs).toContain('L91276')
    expect(RECONCILIATION_CLOSE_CONTROL.sourceRefs).toContain('L89965')
    expect(lineAt(89_965)).toContain(
      'The page cannot be closed while any reconciliation item is outstanding.',
    )
    // Drawn and inert, for the root as much as for anyone: the storyboard's own
    // close control is disabled, and the reason is on screen.
    for (const el of operableElements()) {
      expect(el.textContent ?? '', 'an operable close control').not.toMatch(/close (the )?incident/i)
    }
    expect(checklist.textContent).toMatch(/outstanding/i)
  })
})

describe('no tenant operational content, for any role including Root', () => {
  it('renders the access-class rule rather than any operational field', () => {
    expect(lineAt(91_276)).toContain(
      'No operational content appears anywhere, and reaching any is a separate, audited, ' +
        'session-scoped act under one of the three named access classes.',
    )
    // L91296: conditional for EVERY role, Root included.
    expect(lineAt(91_296)).toContain(
      '| Read tenant operational content | Allowed with conditions — only under a named access class',
    )
    for (const role of ROLES) {
      document.body.innerHTML = ''
      render(<AiIncidentConsoleScreen role={role} />)
      const text = document.body.textContent ?? ''
      // The four operational nouns the console's own "Not in this console"
      // rule names: gate decisions, learned-change approvals, lot releases and
      // deviation handling belong to the tenant's Command Center (L91220).
      expect(text, role).not.toMatch(/\bLOT-[A-Z0-9-]+/)
      expect(text, role).not.toMatch(/\bTAB-\d+/)
      expect(text, role).not.toMatch(/Newton met/i)
      expect(screen.getByTestId('incident-access-class-rule').textContent).toMatch(
        /separate, audited, session-scoped/i,
      )
    }
  })
})

describe('the rollback taxonomy — eight forms, and no control that says "rollback"', () => {
  it('renders every form with its own mechanism and its own source classification', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-rollback-taxonomy')
    for (const form of ROLLBACK_FORMS) {
      expect(panel.textContent, form.id).toContain(form.form)
      expect(panel.textContent, form.id).toContain(form.sourceRef)
    }
    expect(panel.textContent).toMatch(/must not be conflated/i)
  })

  it('offers no operable element whose name is a bare rollback word, for any role', () => {
    for (const role of ROLES) {
      document.body.innerHTML = ''
      render(<AiIncidentConsoleScreen role={role} />)
      for (const el of interactiveElements()) {
        expect((el.textContent ?? '').trim(), role).not.toMatch(/^roll ?back$/i)
        expect(el.getAttribute('aria-label') ?? '', role).not.toMatch(/^roll ?back$/i)
      }
    }
  })

  it('renders the form that reverses nothing as prohibited, not as a seventh option', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-rollback-taxonomy')
    expect(panel.textContent).toContain('Evidence or audit reversal')
    expect(panel.textContent).toContain('Explicitly prohibited')
    expect(panel.textContent).toContain('Not specified in the Statement of Work')
  })
})

describe('the pause, the resume and the kill switch', () => {
  it('renders the pause screen fields the fuller field list names (L70933)', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-pause-screen')
    for (const field of PAUSE_SCREEN_FIELDS) {
      expect(panel.textContent, field.label).toContain(field.label)
      expect(lineAt(70_933), field.label).toContain(field.quotation)
    }
  })

  it('renders the three fixed semantics, each with its own line', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-pause-screen')
    for (const semantic of PAUSE_SEMANTICS) {
      expect(panel.textContent, semantic.id).toContain(semantic.heading)
      expect(panel.textContent, semantic.id).toContain(semantic.sourceRef)
    }
  })

  it('renders the site-scoped pause drawn, inoperable, with its identifier', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    expect(screen.getAllByText(/Site-scoped pause/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/DEC-AIPAUSE-001/).length).toBeGreaterThan(0)
    for (const el of operableElements()) {
      expect(el.textContent ?? '').not.toMatch(/site-scoped/i)
    }
  })

  it('renders the kill switch as its own mechanism, never beside the pause as one control', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-stop-mechanisms')
    expect(panel.textContent).toContain('Runaway-loop kill switch')
    expect(panel.textContent).toContain('Orchestration')
    expect(panel.textContent).toContain('Governance and Safety')
    expect(panel.textContent).toMatch(/not be conflated/i)
    // No operable kill control anywhere: scope, threshold, authority and class
    // are all unstated, so there is no behaviour to build.
    for (const el of operableElements()) {
      expect(el.textContent ?? '').not.toMatch(/kill switch/i)
    }
  })

  it('offers no resume path that is not its own approved act', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/no automatic resume/i)
    expect(text).toContain('AC-AI-015-5')
  })
})

describe('the blast radius renders as an enumeration and never as a count', () => {
  it('renders every node and both supporting tables', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-blast-radius')
    for (const node of BLAST_RADIUS_NODES) {
      expect(panel.textContent, node.key).toContain(node.label)
    }
    for (const row of PAUSE_DOES_NOT_TABLE.rows) {
      expect(panel.textContent, row.whatItDoesNotDo).toContain(row.whatItDoesNotDo)
      expect(panel.textContent, row.whatItDoesNotDo).toContain(row.reason.replaceAll('`', ''))
    }
  })

  it('renders no number beside a stopping or continuing word, for any role', () => {
    // THE PREDICATE IS ADJACENCY, NOT CO-OCCURRENCE, AND THAT IS A MEASURED
    // CORRECTION. A first draft convicted any sentence holding both a number
    // and a stop/continue word, and it went red on two lines of REAL SOURCE:
    // "the Severity 1 hold — continue untouched" (L87791) and the node label
    // "Automatic Severity 1 lot freeze continues" (L87842). Neither is a count
    // of behaviours; `Severity 1` is a severity identifier. Loosening the
    // matcher to pass those would have gutted it, so the source's own
    // identifiers are scrubbed first and the defect shape — a quantity
    // GOVERNING a stop or continue verb — is what is convicted.
    const scrub = (text: string): string =>
      text
        .replaceAll(/Severity \d+/g, 'Severity')
        .replaceAll(/§[\d.]+/g, '')
        .replaceAll(/\bL\d{4,6}/g, '')
        .replaceAll(/\b(?:AC|TEST|SB|DEC|FAIL-AI|AIMODE|PROV|MOD|FEAT|SUB|FUNC|SCR|FB)[A-Z0-9-]*\b/g, '')
    for (const role of ROLES) {
      document.body.innerHTML = ''
      render(<AiIncidentConsoleScreen role={role} />)
      const text = scrub(document.body.textContent ?? '')
      for (const [phrase] of text.matchAll(
        /\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|\d+)\b(?:\s+\w+){0,2}\s+(?:stops?|continues?)\b/gi,
      )) {
        // The source's own quoted sentence is disclosure; anything else is
        // this build picking a side of a disagreement the source leaves open.
        expect(phrase, 'a rendered count of stopping or continuing behaviours').toMatch(
          /Six things stop|nine continue/i,
        )
      }
    }
  })
})

describe('the response panel is enabled per row, from the row\'s own cells', () => {
  it('mounts the authority matrix panel — which nothing reached before this route', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    expect(screen.getByTestId('sa-ai-failure-authority')).toBeDefined()
    // Reachability, asserted on the route file rather than assumed.
    const page = readFileSync(
      join(process.cwd(), 'app/super-admin/ai-incidents/page.tsx'),
      'utf8',
    )
    expect(page).toMatch(/AiIncidentConsoleScreen/)
    expect(page).toMatch(/— Super Admin Platform Console/)
  })

  it('draws every one of the fifteen controls, granted and undecided alike', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-response-panel')
    for (const row of CONSOLE_AUTHORITY_ROWS) {
      expect(panel.textContent, row.id).toContain(row.operation)
    }
  })

  it('gives every unshippable row its own reason and no operable control', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-response-panel')
    for (const row of NOT_SHIPPABLE_AUTHORITY_ROWS) {
      expect(row.notShippableReason).not.toBeNull()
      expect(panel.textContent, row.id).toContain(row.notShippableReason ?? '')
    }
    // And each of them is inert. Checked by name against every operable
    // element on the page, for every role.
    for (const role of ROLES) {
      document.body.innerHTML = ''
      render(<AiIncidentConsoleScreen role={role} />)
      for (const el of operableElements()) {
        for (const row of NOT_SHIPPABLE_AUTHORITY_ROWS) {
          expect((el.textContent ?? '').toLowerCase(), `${role} / ${row.id}`).not.toContain(
            row.operation.toLowerCase(),
          )
        }
      }
    }
  })

  it('does not refuse everything — the granted rows are drawn as granted', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-response-panel')
    expect(SHIPPABLE_AUTHORITY_ROWS.length).toBeGreaterThan(0)
    for (const row of SHIPPABLE_AUTHORITY_ROWS) {
      expect(panel.textContent, row.id).toContain(row.operation)
    }
  })
})

describe('AC-AI-015-7 is rendered, not merely enforced', () => {
  it('names all four acts and says the refusal is audited', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-agent-refusal')
    for (const act of STOP_ACTS) {
      expect(panel.textContent, act).toContain(act)
    }
    expect(panel.textContent).toContain('AC-AI-015-7')
    expect(panel.textContent).toMatch(/audit/i)
  })
})

describe('the four decisions this console may not register', () => {
  it('discloses each locally, with its identifier and every reading', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const text = document.body.textContent ?? ''
    for (const decision of LOCAL_OPEN_DECISIONS) {
      expect(text, decision.id).toContain(decision.id)
      for (const reading of decision.readings) {
        expect(text, `${decision.id} ${reading.locator}`).toContain(reading.locator)
      }
    }
    expect(text).toMatch(/APP-012/)
  })

  it('renders DEC-AIRTO-001 as unset, with no recovery figure anywhere on the page', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const panel = screen.getByTestId('incident-recovery-objective')
    expect(panel.textContent).toContain('DEC-AIRTO-001')
    expect(panel.textContent).toMatch(/not yet set|unset/i)
    // The identifier and the section references are the SOURCE's numbers.
    // Anything else numeric in this panel is a figure this build wrote, which
    // is exactly what L87880 calls a defect.
    const scrubbed = (panel.textContent ?? '')
      .replaceAll(/DEC-[A-Z0-9]+-\d+/g, '')
      .replaceAll(/§[\d.]+/g, '')
      .replaceAll(/\bL\d{4,6}/g, '')
      .replaceAll(/\bAPP-\d+\b/g, '')
    expect(scrubbed, 'an invented recovery objective on the incident screen').not.toMatch(/\d/)
  })

  it('renders every unset governing value with its decision identifier', () => {
    // AC-43-113 (L90040). The panel that owns them is platform settings; this
    // console names the refusal that governs its own response controls.
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const text = document.body.textContent ?? ''
    const governing = UNSET_GOVERNING_VALUES.filter((value) =>
      ['DEC-AIFAILOVER-001', 'DEC-AIQUAR-001', 'DEC-AIREPLAY-001'].includes(value.id),
    )
    for (const value of governing) {
      expect(text, value.id).toContain(value.id)
    }
  })
})

describe('operational severity shares no rendering with manufacturing severity', () => {
  it('imports no severity component from an earlier slice', () => {
    // AC-43-103 (L89975) / TEST-43-103 (L89981): separate fields, separate
    // vocabularies, no shared rendering component.
    expect(lineAt(89_975)).toContain('AC-43-103')
    for (const file of walk('app/super-admin/ai-incidents')) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toMatch(/import[^;]*Severity[A-Za-z]*\s*(,|\}|from)/)
    }
  })
})

describe('provenance', () => {
  it('marks every provenance-bearing region, and every mark is the same one class', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const marks = Array.from(document.body.querySelectorAll('[data-provenance-class]'))
    expect(marks.length).toBeGreaterThan(0)
    for (const mark of marks) {
      expect(mark.getAttribute('data-provenance-class')).toBe('PROV-4')
    }
  })

  it('labels nothing on this console as live artificial intelligence', () => {
    render(<AiIncidentConsoleScreen role="ROOT_SUPER_ADMIN" />)
    const text = document.body.textContent ?? ''
    // §42.4's absolute rule. Everything here is a transcribed deterministic
    // rule, so a "live" label anywhere would be false by construction.
    for (const [sentence] of text.matchAll(/[^.]*\./g)) {
      if (/\blive artificial intelligence\b/i.test(sentence)) {
        expect(sentence, 'a live-AI label on a deterministic rule').toMatch(/never|not|no/i)
      }
    }
  })
})

function walk(root: string): string[] {
  const out: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (/^\.zz-probe-\d+$/.test(entry)) continue
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) visit(path)
      else out.push(path)
    }
  }
  visit(join(process.cwd(), root))
  return out
}
