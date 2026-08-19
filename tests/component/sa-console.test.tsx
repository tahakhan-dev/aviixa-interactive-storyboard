import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SA_MODULES, SA_BANDS } from '@/surfaces/sa/modules'
import { SaConsoleShell } from '../../app/super-admin/SaConsoleShell'

describe('SaConsoleShell — the module index', () => {
  it('lists all nineteen modules grouped into two named bands, each labelled V1', () => {
    render(<SaConsoleShell />)
    expect(screen.getByText('Definition layer')).toBeDefined()
    expect(screen.getByText('Operations layer')).toBeDefined()
    // "V1" appears once per band heading, twice in total.
    expect(screen.getAllByText(/V1/)).toHaveLength(SA_BANDS.length)
    for (const m of SA_MODULES) {
      expect(screen.getByText(m.name), m.id).toBeDefined()
    }
  })

  it('exposes exactly one <h1> and a <main> landmark', () => {
    render(<SaConsoleShell />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('main')).toBeDefined()
  })

  it('links every module to its own route by slug, never by a bare SCR-SA-NN number', () => {
    render(<SaConsoleShell />)
    for (const m of SA_MODULES) {
      const link = screen.getByRole('link', { name: new RegExp(m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
      const href = link.getAttribute('href') ?? ''
      // next/link normalises the trailing slash outside a running Next app
      // router (see tests/e2e/sa-console.spec.ts for the served-export,
      // real-router assertion of the exact `trailingSlash: true` path);
      // here the load-bearing fact is the slug, and only the slug.
      expect(href, m.id).toMatch(new RegExp(`^/super-admin/${m.slug}/?$`))
      expect(href, m.id).not.toMatch(/SCR-SA-\d+/i)
    }
  })

  it('groups the seven definition-layer modules and twelve operations-layer modules under their own band', () => {
    render(<SaConsoleShell />)
    const definitionSection = screen.getByText('Definition layer').closest('section')
    const operationsSection = screen.getByText('Operations layer').closest('section')
    expect(definitionSection).not.toBeNull()
    expect(operationsSection).not.toBeNull()
    for (const m of SA_MODULES.filter((mod) => mod.band === 'definition')) {
      expect(definitionSection?.textContent, m.id).toContain(m.name)
    }
    for (const m of SA_MODULES.filter((mod) => mod.band === 'operations')) {
      expect(operationsSection?.textContent, m.id).toContain(m.name)
    }
  })

  it('carries the prototype disclosure', () => {
    render(<SaConsoleShell />)
    expect(screen.getByText(/simulated/i)).toBeDefined()
  })

  it('renders each module id as an annotation, never as the route key', () => {
    render(<SaConsoleShell />)
    for (const m of SA_MODULES) {
      expect(screen.getByText(m.id)).toBeDefined()
    }
  })
})

describe('SaConsoleShell — module mode (consumed by later module routes)', () => {
  it('renders the given module\'s own heading, band and purpose instead of the index', () => {
    const module = SA_MODULES[0]!
    render(<SaConsoleShell module={module} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(module.name)
    expect(screen.getByText(module.purpose)).toBeDefined()
    expect(screen.queryByText('Definition layer')).not.toBeNull() // shown as annotation, not as an index heading
    expect(screen.queryByText(SA_MODULES[1]!.name)).toBeNull() // no other module leaks in
  })
})
