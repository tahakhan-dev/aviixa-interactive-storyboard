import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { isForeignProbe } from '../probe-paths'

/* ==================================================================== *
 * THE ABSENCE-SWEEP PREAMBLE, HOISTED.
 *
 * `slice-07-absence-sweep`, `slice-08-absence-sweep` and
 * `slice-09-absence-sweep` each re-implemented the same three obligations in
 * their own words, sharing only `../probe-paths`. This is the fourth slice
 * that needs them, and a fourth private copy is the duplicate-vocabulary
 * shape this build keeps shipping — the same shape that put thirteen copies
 * of the probe predicate in `tests/`, two of which had silently drifted.
 *
 * The three obligations, and why each is here rather than restated:
 *
 *  1. A NON-VACUITY FLOOR, so the sweep has a population to sweep. An
 *     absence claim is the shape most easily satisfied by finding nothing:
 *     `expect(offenders).toEqual([])` over an empty corpus passes for ever.
 *     `sweptSources` is a probe-aware WALK rather than a file list, so a file
 *     added later is covered without an edit, and `expectPopulationFloor`
 *     asserts the walk still finds a population before any absence is
 *     claimed.
 *
 *  2. A FROZEN-SOURCE PIN — sha256 AND line count — so the sweep is against
 *     the bytes the slice was built on. The line count matters separately
 *     from the digest: without it, an exemption numbered one line past the
 *     end passes a range check, and the trailing newline makes the naive
 *     split report 122,242.
 *
 *  3. EVERY CLOSED VOCABULARY DECLARED `as const satisfies`, NEVER WITH A
 *     LEADING ANNOTATION. A leading `readonly T[]` widens the literals back
 *     to the union, so the exhaustiveness the declaration looks like it
 *     provides is gone and a missing member is a type-checked no-op. Commit
 *     `018b390` shows this obligation catching a SLICE-11 defect through
 *     slice-09's Command-Center-scoped copy — its author found it and no gate
 *     did, because no copy's scope covered the file. One implementation,
 *     called with each slice's own roots, is what closes that.
 *
 * WHAT IS DELIBERATELY NOT HOISTED. Each slice's FLOORS and each slice's
 * ROOTS stay in its own file. A floor is a measurement of one surface and a
 * shared default would be a number nobody owns; a root list is the scope
 * decision that slice-08's copy already got wrong once, when
 * `src/surfaces/cc` grew slice-09's twelve modules and slice 8 began reading
 * them as its own.
 * ==================================================================== */

/* ── obligation 2: the frozen source ───────────────────────────────────── */

/**
 * Resolved from the repository rather than written absolute:
 * `prohibited-patterns.test.ts` bans an author path from the release artifact
 * and there is no reason to type one into a gate either.
 */
export const FROZEN_SOURCE_PATH = join(process.cwd(), '..', 'AVIIXA_Production_Product_Blueprint.md')
export const FROZEN_SOURCE_SHA256 =
  '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27'
export const FROZEN_SOURCE_LINE_COUNT = 122_241

export const frozenSourceBytes: Buffer = existsSync(FROZEN_SOURCE_PATH)
  ? readFileSync(FROZEN_SOURCE_PATH)
  : Buffer.alloc(0)

/**
 * The trailing newline yields one extra empty element that is not a line.
 * Leaving it in makes the count 122,242 and lets a locator one past the end
 * pass a range check.
 */
export const frozenSourceLines: readonly string[] = ((lines: readonly string[]) =>
  lines.at(-1) === '' ? lines.slice(0, -1) : lines)(frozenSourceBytes.toString('utf8').split('\n'))

/** One line of the frozen source, 1-based. Throws rather than returning `''`. */
export function sourceLine(n: number): string {
  const text = frozenSourceLines[n - 1]
  if (text === undefined) throw new Error(`the frozen source has no line ${n}`)
  return text
}

/**
 * The pin, as three cases rather than one. The presence check names the path
 * it looked at, because a gate that reports "expected 0 to be 122241" when
 * the file is simply absent sends the next reader to the wrong question.
 */
export function describeFrozenSourcePin(label: string): void {
  describe(`${label}: the frozen source this sweep is checked against`, () => {
    it('is present where every locator points', () => {
      expect(existsSync(FROZEN_SOURCE_PATH), `frozen source not found at ${FROZEN_SOURCE_PATH}`)
        .toBe(true)
    })

    it('is the frozen bytes and not a drifted copy', () => {
      expect(createHash('sha256').update(frozenSourceBytes).digest('hex')).toBe(FROZEN_SOURCE_SHA256)
    })

    it('has the line count the locators are numbered against', () => {
      expect(frozenSourceLines.length).toBe(FROZEN_SOURCE_LINE_COUNT)
    })
  })
}

/* ── obligation 1: the population ──────────────────────────────────────── */

/**
 * Every file under `dir`, recursively, skipping a CONCURRENT process's
 * scratch probe. Nine of the twenty-five release gates plant and delete
 * probes on the real filesystem, and a walk that does not skip them lists one
 * and then ENOENTs on it the moment its owner cleans up. Absolute paths in,
 * absolute paths out.
 */
export function walkFiles(dir: string, into: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (isForeignProbe(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walkFiles(full, into)
    else into.push(full)
  }
  return into
}

/** Every `.ts`/`.tsx` file under a repository-relative root, repo-relative and sorted. */
export function sweptSources(root: string, cwd: string = process.cwd()): readonly string[] {
  return walkFiles(join(cwd, root))
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => relative(cwd, f))
    .sort()
}

/**
 * The floor, asserted with the root that produced it in the message.
 * A FLOOR AND NOT AN EQUALITY: an exact population count is a stored copy of
 * a derived answer and goes stale the next time the slice grows a file, which
 * is how this build shipped a count with twenty-nine hand-maintained copies.
 * What an absence claim needs is only that the population is not empty and
 * has not silently collapsed.
 */
export function expectPopulationFloor(
  population: readonly unknown[],
  floor: number,
  what: string,
): void {
  expect(population.length, `${what} swept ${population.length} items, below its floor of ${floor}`)
    .toBeGreaterThan(floor)
}

/* ── obligation 3: no widening annotation on a closed vocabulary ────────── */

/** One `export const NAME[: annotation] = [` declaration, with the file it is in. */
export interface VocabularyDeclaration {
  readonly file: string
  /** The declaration's head, verbatim and trimmed. */
  readonly text: string
}

/**
 * Every exported array-literal constant in `files`, by its declaration head.
 *
 * MATCHED ON THE HEAD, NOT ON THE NAME. A gate keyed on a list of vocabulary
 * names covers the vocabularies someone remembered; this covers the shape,
 * so a vocabulary added later is covered without an edit. A COMPUTED array
 * (`= SOMETHING.map(...)`) is deliberately outside the match: it has no
 * literals to widen.
 */
export function vocabularyDeclarations(
  files: readonly string[],
  cwd: string = process.cwd(),
): readonly VocabularyDeclaration[] {
  const found: VocabularyDeclaration[] = []
  for (const file of files) {
    const text = readFileSync(join(cwd, file), 'utf8')
    for (const m of text.matchAll(/^export const [A-Z][A-Z0-9_]*(?::[^=\n]*)? = \[/gm)) {
      found.push({ file, text: m[0]!.trim() })
    }
  }
  return found
}

/**
 * Obligation 3, as two cases: the population, then the property.
 *
 * The offender list is rendered as `file: declaration` strings rather than as
 * objects, because a diff of two object arrays is unreadable in a CI log and
 * an unreadable failure is one someone re-runs instead of fixing.
 */
export function describeClosedVocabularyAnnotations(
  label: string,
  files: readonly string[],
  floor: number,
): void {
  describe(`${label}: every closed vocabulary is \`as const satisfies\`, never a leading annotation`, () => {
    const declarations = vocabularyDeclarations(files)

    it('finds the vocabularies it is meant to police', () => {
      expect(
        declarations.length,
        `the declaration scan found ${declarations.length} exported array literals, below its floor of ${floor}`,
      ).toBeGreaterThan(floor)
    })

    it('none of them widens its literals back to the union', () => {
      const annotated = declarations.filter((d) => /: *readonly /.test(d.text))
      expect(
        annotated.map((d) => `${d.file}: ${d.text}`),
        'a leading `readonly T[]` annotation widens the literals back to the union, so the '
          + 'exhaustiveness the declaration looks like it provides is gone and a missing member '
          + 'is a type-checked no-op. Declare it `as const satisfies readonly T[]` instead.',
      ).toEqual([])
    })

    // RED when: the matcher stops matching. Both directions, on this run, so
    // the scan cannot quietly stop seeing either shape.
    it('its matcher fires on the widening shape and is silent on the correct one', () => {
      const head = (src: string): readonly string[] =>
        [...src.matchAll(/^export const [A-Z][A-Z0-9_]*(?::[^=\n]*)? = \[/gm)].map((m) => m[0]!)
      const widened = head('export const IDS: readonly Id[] = [\n')
      expect(widened).toHaveLength(1)
      expect(/: *readonly /.test(widened[0]!)).toBe(true)
      const correct = head('export const IDS = [\n')
      expect(correct).toHaveLength(1)
      expect(/: *readonly /.test(correct[0]!)).toBe(false)
    })
  })
}
