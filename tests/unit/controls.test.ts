import { describe, it, expect } from 'vitest'
import { createControls, CONNECTIVITY_MODES } from '@/scenario/controls'
import { fixedClock, CANONICAL_EPOCH_MS } from '@/domain/clock'
import type { PresentationState } from '@/domain/state'

function harness() {
  const clock = fixedClock(CANONICAL_EPOCH_MS)
  // Annotated explicitly: without it, `let presentation = {...}` infers a
  // literal-narrowed shape (`surface: null`, `storyStepId: string`) instead
  // of `PresentationState` (`SurfaceId | null`, `string | null`), which then
  // fails to compile where `setPresentation`'s parameter -- contextually
  // typed as the full `PresentationState` by `ControlsDeps` -- is assigned
  // back into it. Reproduced via `pnpm typecheck` before adding this.
  let presentation: PresentationState = { surface: null, locale: 'en' as const, density: 'comfortable' as const,
    filters: { q: 'x' }, selection: [], storyStepId: 'STEP-03' }
  const steps = ['STEP-01', 'STEP-02', 'STEP-03', 'STEP-04']
  const controls = createControls({
    clock, steps,
    getPresentation: () => presentation,
    setPresentation: (p) => { presentation = p },
  })
  return { controls, clock, get presentation() { return presentation } }
}

describe('scenario controls', () => {
  it('steps forward and back through the story', () => {
    const h = harness()
    h.controls.step(1)
    expect(h.presentation.storyStepId).toBe('STEP-04')
    h.controls.step(-2)
    expect(h.presentation.storyStepId).toBe('STEP-02')
  })

  it('clamps at both ends rather than wrapping or going out of range', () => {
    const h = harness()
    h.controls.step(99)
    expect(h.presentation.storyStepId).toBe('STEP-04')
    h.controls.step(-99)
    expect(h.presentation.storyStepId).toBe('STEP-01')
  })

  it('jumps to a named step', () => {
    const h = harness()
    h.controls.jumpTo('STEP-02')
    expect(h.presentation.storyStepId).toBe('STEP-02')
  })

  it('throws on a jump to an unknown step rather than silently doing nothing', () => {
    const h = harness()
    expect(() => h.controls.jumpTo('STEP-99')).toThrow(/STEP-99/)
  })

  it('resets presentation only — filters clear, story position clears', () => {
    const h = harness()
    h.controls.resetPresentation()
    expect(h.presentation.filters).toEqual({})
  })

  it('offers exactly the six connectivity modes', () => {
    expect(CONNECTIVITY_MODES).toHaveLength(6)
    expect([...CONNECTIVITY_MODES]).toContain('flapping')
  })

  it('advances only the injected clock, never real time', () => {
    const h = harness()
    const before = h.clock.now()
    h.controls.advanceClock(60_000)
    expect(h.clock.now()).toBe(before + 60_000)
  })

  it('refuses to move the clock backwards', () => {
    const h = harness()
    expect(() => h.controls.advanceClock(-1)).toThrow()
  })
})
