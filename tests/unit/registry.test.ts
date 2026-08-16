import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { loadRegistry, SourceReferenceSchema } from '@/registry/load'

describe('registry loading', () => {
  it('accepts a valid record', () => {
    const r = loadRegistry(SourceReferenceSchema, {
      id: 'MOD-CC-13', label: 'Operational actions', classification: 'SoW Fact', locator: '§6.14',
    }, 'source reference')
    expect(r.id).toBe('MOD-CC-13')
  })

  // An unknown field is the signature of a version mismatch, so it must not be ignored.
  it('REJECTS an unknown field rather than ignoring it', () => {
    expect(() =>
      loadRegistry(SourceReferenceSchema, {
        id: 'MOD-CC-13', label: 'x', classification: 'SoW Fact', locator: '§6.14',
        unexpectedField: 'from a newer schema',
      }, 'source reference'),
    ).toThrow(/unexpectedField|unrecognized/i)
  })

  it('rejects a missing required field with a labelled error', () => {
    expect(() =>
      loadRegistry(SourceReferenceSchema, { id: 'MOD-CC-13' }, 'source reference'),
    ).toThrow(/source reference/)
  })

  it('rejects an unknown classification value', () => {
    expect(() =>
      loadRegistry(SourceReferenceSchema, {
        id: 'X', label: 'x', classification: 'Made Up', locator: '§1',
      }, 'source reference'),
    ).toThrow()
  })

  // Brief defect fixed: the original assertion was `toMatch(/a/)`, which the
  // surrounding prose "Registry validation failed for probe" already
  // satisfies on its own (it contains the letter "a" four times over)
  // whether or not the failing field's name ever reaches the message. That
  // proof cannot fail even if the field name is dropped entirely, so it
  // cannot detect the bug it names in its title. Tightened to look for the
  // field name as a quoted JSON path segment, which only appears if the
  // issue detail actually flows into the thrown message.
  it('names the failing field in the error so a mismatch is diagnosable', () => {
    try {
      loadRegistry(z.object({ a: z.string() }).strict(), { a: 1 }, 'probe')
      throw new Error('should have thrown')
    } catch (e) {
      expect(String(e)).toContain('"a"')
    }
  })
})
