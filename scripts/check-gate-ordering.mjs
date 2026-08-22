#!/usr/bin/env node
/**
 * THE ORDERING AUDIT, INSTITUTED (Phase 0.9).
 *
 * `verify` is `typecheck && lint && check:gate-ordering && test:unit &&
 * test:component && test:freshness && build && test:release && test:e2e`.
 * Step `build` REWRITES `registries/generated/**`, `.next/**` and `out/**`.
 * A release gate whose subject is one of those artefacts, and which runs
 * after `build`, is comparing the pipeline's own output against itself: it
 * can be correct in its own file and unable to fail where it actually runs.
 *
 * That is not hypothetical. `registry-freshness` gate 1 regenerated the
 * registries into scratch and compared them to `registries/generated/`, which
 * `build` had rewritten one step earlier -- so a stale committed registry rode
 * through an `exit 0` verify for four commits. Every gate on this build had
 * been planted in isolation. Not one had been planted inside the pipeline that
 * ships, and ~480 isolated plants could not detect it, because the property
 * they test is not the property that failed.
 *
 * The plan (§2 item 0.2) records the audit of the eleven gates that existed
 * when it was written. This file is why that audit does not have to be
 * remembered: **a release gate that has not answered the question cannot
 * land.** A note in a plan is not a mechanism.
 *
 * WHAT THIS CHECKS, AND WHAT IT DOES NOT.
 *
 *   1. Every `tests/coverage/**\/*.test.ts` -- the release project's whole
 *      include -- has an entry below. A new gate is RED until its author
 *      writes down what it reads and whether `build` rewrites that. An entry
 *      for a file that no longer exists is red too, so the list cannot rot
 *      into a record of gates that used to be here.
 *
 *   2. The one part of the answer that is derivable is derived rather than
 *      trusted: a gate whose text names `registries/generated`, the only
 *      COMMITTED artefact `build` rewrites, may not be filed as having a
 *      subject nothing rewrites. It must say `rewrittenBy: 'build'` and then
 *      say where it runs. That is exactly the sentence `registry-freshness`
 *      could not have written truthfully before Phase 0.2.
 *
 * `verdict` itself is prose and is not machine-checked -- deciding whether
 * `out/super-admin/**` is "the build's own output" or "an independent product
 * of `src/`" is a reading, not a grep. What is enforced is that a human made
 * the reading and left it where the next one can disagree with it.
 *
 * ponytail: keyed on the file EXISTING, not on its contents, so editing a
 * gate does not force a re-audit. Sized to the stated obligation ("every NEW
 * release gate"), and it keeps the check quiet during the fix waves that edit
 * these files constantly. Add a content hash when a gate's subject actually
 * changes under an unchanged filename.
 *
 * Run with: node scripts/check-gate-ordering.mjs [gate-dir]
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/** Overridable so this check can be planted against a scratch directory. */
const GATE_DIR = process.argv[2] ?? join(ROOT, 'tests', 'coverage')

/** The only COMMITTED artefact any `verify` step rewrites. See check 2. */
const REWRITTEN_BY_BUILD = 'registries/generated'

/**
 * The audited answer for every release gate, keyed on file name.
 *
 * `rewrittenBy` is the `verify` step that rewrites this gate's subject, or
 * `null` when no earlier step touches it. `runsBeforeBuild` is required
 * whenever `rewrittenBy` is a step, and answers the only question that
 * matters once it is: does this gate get to read the subject before the
 * pipeline overwrites it?
 *
 * The eleven verdicts below are the audit recorded in
 * `docs/superpowers/plans/2026-08-21-replan-slices-05-13.md` §2 item 0.2,
 * transcribed here so the check and the record cannot drift apart.
 */
const AUDITED = {
  'contract-gates.test.ts': {
    subject: 'src/** as authored',
    rewrittenBy: null,
    verdict: 'NOT VACUOUS. No verify step writes src/.',
  },
  'locator-fidelity.test.ts': {
    subject: 'the frozen blueprint at run time, plus src/, app/, tests/, docs/, registries/raw',
    rewrittenBy: null,
    verdict: 'NOT VACUOUS. The blueprint is read-only input; nothing in verify writes registries/raw.',
  },
  'prohibited-patterns.test.ts': {
    subject: 'a fixed literal set, scanned over authored sources',
    rewrittenBy: null,
    verdict: 'NOT VACUOUS. Carries its own explicit non-vacuity guard.',
  },
  'registry-freshness.test.ts': {
    subject:
      'gate 1 compares registries/generated/** against a fresh generation into scratch; gate 2 walks tests/** for generator call sites',
    rewrittenBy: 'build',
    runsBeforeBuild: true,
    verdict:
      'THIS IS F1. Gate 1 was VACUOUS inside verify: build rewrote its subject at step 5 and the gate read that same tree at step 6. Fixed by ORDERING, not by the gate -- package.json runs `test:freshness` ahead of EVERY step that can write registries/generated: before build, and before test:unit and test:component, whose historical generator call sites are what gate 2 exists to keep redirected. The copy left in the release project runs after build and is vacuous there; that second run is deliberate and costs three generator invocations. Gate 2 is NOT VACUOUS anywhere: nothing in verify writes tests/.',
  },
  'slice-03-gates.test.ts': {
    subject: 'out/super-admin/** compared against CRITICAL_ACTIONS in src/',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. Two step-5 products are not compared against each other: the built HTML is compared against an authored constant in src/ that build never writes. Reading the FRESH out/ is the point -- the gate is about what shipped.',
  },
  'slice-04-gates.test.ts': {
    subject: 'app/-authored hrefs compared against the out/ route tree (danglingHrefs), plus app/ and src/ scans',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. Both sides are step-5 products but from different inputs -- authored hrefs against the routes the build actually emitted -- so the comparison still has two independent ends.',
  },
  'slice-05-gates.test.ts': {
    subject: 'out/studio/** against expectations read from src/studio/modules.ts and screen-states.ts',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict: 'NOT VACUOUS. Expectations come from src/, never from out/.',
  },
  'slice-06-gates.test.ts': {
    subject:
      'out/hub/** against expectations read from src/surfaces/doh/**, the frozen blueprint, ' +
      'and the real build-registries generator',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` writes the subject and runs first, which is the arrangement this ' +
      'audit exists to catch -- but what makes it safe is the test, not the order. Every ' +
      'expectation is derived from src/, from the blueprint, or from the generator; none is ' +
      'read back out of out/. The build turns src/ into out/ and the gate asserts properties ' +
      'of that transformation, so the build cannot satisfy the gate by rewriting what the gate ' +
      'compares against. Contrast registry-freshness, which compared committed artefacts to ' +
      'freshly generated ones and could only ever compare a directory to itself.',
  },
  'walkthrough-routes.test.ts': {
    subject:
      'the route paths named in docs/walkthroughs.md, compared against the route list ' +
      'exportedRoutes() derives from out/',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and the asymmetry is the point. `build` writes ONE of the two sides -- ' +
      'the export -- and runs first. It cannot write the other: nothing in `verify` edits ' +
      'docs/walkthroughs.md, which is a hand-written document, and a hand-written document ' +
      'compared against a derived list is exactly the shape this gate exists for. A build ' +
      'that renames a route makes the document wrong and this gate says so; a build cannot ' +
      'make the document right. Planted three ways and each went red: a renamed route in a ' +
      'step, a built surface losing its only step, and the document losing its tables.',
  },
  'rendered-text-sanity.test.ts': {
    subject: 'every index.html under out/, as text nodes',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` writes the subject and runs first, and this gate reads nothing ' +
      'else -- but it compares the built pages against SHAPES, not against anything the ' +
      'build could satisfy by rewriting. An attribute assignment, a closing tag or an ' +
      'orphaned brace-paren appearing as prose is a defect whatever produced it. The gate ' +
      'was written because `role="group"` shipped fourteen times as visible text on the Run ' +
      'Player while four independent harnesses stayed green, and it carries a third case ' +
      'that runs its own predicate over that exact string and over this build\'s ordinary ' +
      'prose, so it cannot quietly stop seeing either.',
  },
  'slice-07-absence-sweep.test.ts': {
    subject:
      'out/frontline/**/index.html and out/_next/static/**, against the frozen blueprint and ' +
      'the routes authored under app/frontline',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` writes the subject and runs first, which is the arrangement this ' +
      'audit exists to catch. What makes it safe is that no expectation is read back out of ' +
      'out/: every one of the twenty exempt strings is pinned to a line of the frozen ' +
      'blueprint whose sha256 the suite asserts, and the route population comes from ' +
      'app/frontline as authored. The build cannot satisfy this gate by rewriting what the ' +
      'gate compares against. Reading the FRESH out/ is the whole point -- the claim is about ' +
      'what shipped, and the sweep was watched red against a real pnpm build with a pace ' +
      'figure injected into a module source.',
  },
  'offline-phrasing.test.ts': {
    subject:
      'every out/**/index.html the export emits, against the prohibited-phrasing dictionary in ' +
      'src/honesty/lexicon.ts and eight disclosures pinned to the frozen blueprint',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` writes the subject and runs first, the arrangement this audit exists ' +
      'to catch, and what makes it safe is that no expectation is read back out of out/. The ' +
      'dictionary is transcribed from the eight-row table at L78400-L78407 of the frozen ' +
      'blueprint, whose sha256 this suite asserts, and tests/unit/honesty-kernel.test.ts checks ' +
      'every cell of it against that line BEFORE build runs. Three of the eight disclosures are ' +
      'pinned to a blueprint line and verified verbatim there; the other five are this build\'s ' +
      'own sentences and are held at a fixed count instead. The build cannot satisfy this gate ' +
      'by rewriting what the gate compares against. Reading the FRESH out/ is the whole point -- ' +
      'the claim is about what a supervisor is shown, and the sweep was watched red against a ' +
      'real pnpm build with a completion claim injected into a shipping module source.',
  },
  'slice-07-gates.test.ts': {
    subject:
      'the frozen blueprint at run time, compared against src/frontline/** as authored -- the ' +
      'twelve module transcriptions, the wave-0 shared representations, the module spine, and ' +
      'app/frontline/ as a route-directory listing',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS. Neither end is written by any verify step: the blueprint is read-only input ' +
      'and its sha256 is asserted here, and nothing in verify writes src/ or app/. This gate ' +
      'reads out/ nowhere at all -- every count it makes is parsed out of the frozen source and ' +
      'compared against an authored transcription, so `build` cannot satisfy it by rewriting ' +
      'anything. The route check lists app/frontline/ (authored), never out/frontline/ (built).',
  },
  'slice-08-gates.test.ts': {
    subject:
      'the frozen blueprint at run time, compared against src/offline/**, src/fallbacks/**, ' +
      'src/surfaces/cc/** and src/honesty/artefacts.ts as authored -- the transcribed tables, ' +
      'the recorded count contradictions, and four module source files read as text',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS. Neither end is written by any verify step: the blueprint is read-only input ' +
      'and its sha256 is asserted here, and nothing in verify writes src/. This gate reads out/ ' +
      'nowhere at all -- every count it makes is PARSED out of the frozen source and compared ' +
      'against an authored transcription, so `build` cannot satisfy it by rewriting anything. ' +
      'Three of its claims read only the frozen source and are named FREEZE assertions in the ' +
      'file: that §38 calls its eleven-column table nine-column, that "six" occurs nowhere in ' +
      '§37.1, and that §35.6 never writes "fifteen". Their subject is read-only input, so the ' +
      'only thing that can turn them red is the source drifting, which is what they are for. ' +
      'Every other assertion was watched red on a real plant into a real shipping file, and the ' +
      'file restored byte-identically against a checksum taken before the plant.',
  },
  'slice-08-absence-sweep.test.ts': {
    subject:
      'src/offline/**, src/fallbacks/** and src/surfaces/cc/** as authored, swept for the ' +
      'decision identifiers and answer-shaped fields slice 8 must NOT hold, compared against ' +
      'the decision canon at src/disclosure/decisions.ts and the frozen blueprint',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS, and this one is an ABSENCE claim, which is the shape most at risk of being ' +
      'satisfied by finding nothing. Every population it sweeps is asserted non-empty and at or ' +
      'above a measured floor before the absence is checked, and the sweep is derived from a ' +
      'directory walk rather than a literal file list, so a slice-8 module added later is ' +
      'covered without an edit here. No verify step writes src/, and the canon it compares ' +
      'against is another task’s hand-written file that nothing in the build generates -- which ' +
      'is exactly what makes "these identifiers are absent from the canon" go red on the day a ' +
      'later task lifts them, rather than quietly staying true.',
  },
  'slice-09-gates.test.ts': {
    subject:
      'the frozen blueprint at run time, compared against src/surfaces/cc/**, app/command-center/** ' +
      'and src/domain/commands.ts as authored -- the eighteen transcribed permission matrices, the ' +
      'three-table divergence, the route/screen mapping, the client-boundary shapes, import ' +
      'reachability from app/, and prose counts across all of src/ and app/. It also reads ' +
      'registries/generated/modules.json and runs scripts/cc-reach.mjs.',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and the one subject `build` rewrites is named rather than glossed. Almost ' +
      'every assertion here has the blueprint on one end and authored src/ or app/ on the other, ' +
      'and no verify step writes either -- the blueprint is read-only input and its sha256 is ' +
      'asserted in this file. TWO subjects are build products and both are safe for the same ' +
      'reason as slice-06: registries/generated/modules.json is what the GENERATOR produces from ' +
      'src/ and app/, and gate 15 asserts that the module statuses it derives agree with the ' +
      'SPINE\'s own abstentions in src/surfaces/cc/modules.ts, which build never writes -- so ' +
      'build cannot satisfy the gate by rewriting the side it owns. scripts/cc-reach.mjs is ' +
      'invoked directly rather than read out of a generated artefact, and is checked against ' +
      'CC_SCREENS and the app/command-center directory listing. This gate reads out/ nowhere at ' +
      'all. Every assertion whose subject this build can change was watched red on a real plant ' +
      'into a real shipping file, and each file restored byte-identically against a checksum ' +
      'taken once before the first plant.',
  },
  'slice-09-absence-sweep.test.ts': {
    subject:
      'src/surfaces/cc/** and app/command-center/** as authored, swept for the decision ' +
      'identifiers, adopted positions, route names, vocabulary members and fabricated answers ' +
      'this surface must NOT hold, compared against the decision canon at ' +
      'src/disclosure/decisions.ts, src/scenario/controls.ts and the frozen blueprint',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS, and this one is an ABSENCE claim, the shape most at risk of being satisfied ' +
      'by finding nothing. Every population it sweeps is asserted non-empty and at or above a ' +
      'measured floor before the absence is checked, and every sweep is derived from a directory ' +
      'walk or from a shipped constant rather than from a literal file list, so a slice-9 file ' +
      'added later is covered without an edit here. No verify step writes src/ or app/, and the ' +
      'canon it compares against is another task\'s hand-written file that nothing in the build ' +
      'generates -- which is what makes "these identifiers are absent from the canon" go red on ' +
      'the day a later slice lifts one, rather than quietly staying true.',
  },
  'hook-config.test.ts': {
    subject:
      'docs/process/claude-hooks/{CLAUDE.md,settings.json} (committed copies) and the live ' +
      'configuration at ../CLAUDE.md and ../.claude/settings.json',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS. Neither subject is written by any verify step. The committed copies are ' +
      'edited by hand when the live configuration changes; the live files sit OUTSIDE this ' +
      'repository entirely, in a directory that is not a git repo, and nothing in the build ' +
      'writes there. The drift comparison is skipped when the live files are absent (a fresh ' +
      'clone, or CI) and says so on stderr rather than passing in silence.',
  },
  'citation-graph.test.ts': {
    subject:
      'registries/blueprint-locators.json (committed) and the frozen blueprint, plus ' +
      'identifier-anchored citations under src/, app/, tests/ and scripts/',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS. Neither subject is written by any verify step. `build:registries` writes ' +
      'registries/generated/, a different directory; the blueprint is frozen and its sha256 is ' +
      'asserted here. The locator index is regenerated only by an explicit ' +
      '`node scripts/build-locator-index.mjs`, which requires the local knowledge graph and is ' +
      'deliberately NOT part of verify -- a gate that rebuilt its own subject is exactly the ' +
      'defect registry-freshness was repaired for.',
  },
  'slice-2b-gates.test.ts': {
    subject: 'authored sources under src/ and app/',
    rewrittenBy: null,
    verdict: 'NOT VACUOUS.',
  },
  'slice-2c-gates.test.ts': {
    subject: 'the shape and schema of each registries/generated/*.json, plus app/ and src/ scans',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and running after build is correct here. Its subject is what the GENERATOR produces, not whether the committed copy matches it -- so reading the freshly-built tree is reading the thing under test. A schema-invalid registry fails whether or not the file on disk was refreshed first. (Contrast registry-freshness gate 1, whose subject is precisely the committed copy.)',
  },
  'static-export.test.ts': {
    subject: 'out/**',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'MOSTLY VACUOUS AND HARMLESS. Its two existence checks assert that build produced files build just produced -- smoke checks, disclosed rather than removed. Its one content check is real.',
  },
  'workflow-index.test.ts': {
    subject: 'authored workflow sources',
    rewrittenBy: null,
    verdict: 'NOT VACUOUS.',
  },
}

const HOW_TO_FIX =
  'Answer it in scripts/check-gate-ordering.mjs by adding an entry: `subject` (what the gate ' +
  "reads), `rewrittenBy` (the verify step that rewrites that subject, or null), and -- when it is " +
  'a step -- `runsBeforeBuild`, plus a `verdict` saying why that is acceptable. If an earlier step ' +
  'does rewrite the subject, fix the ORDERING in package.json rather than weakening the gate, and ' +
  'prove it: plant the defect and watch the WHOLE of `pnpm verify` go red end to end.'

function gateFiles(dir, prefix = '') {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? gateFiles(dir, join(prefix, e.name))
      : e.name.endsWith('.test.ts')
        ? [join(prefix, e.name)]
        : [],
  )
}

const found = gateFiles(GATE_DIR).sort()
const failures = []

// A gate this build has never audited. The whole obligation, in one check.
for (const file of found) {
  if (!Object.hasOwn(AUDITED, file)) {
    failures.push(
      `${join(relative(ROOT, GATE_DIR), file)} is a release gate with no ordering audit. ` +
        'Before it lands it must answer: DOES AN EARLIER STEP OF `verify` REWRITE MY SUBJECT? ' +
        HOW_TO_FIX,
    )
  }
}

// An entry with no file is a record of a gate that used to be here.
for (const name of Object.keys(AUDITED)) {
  if (!found.includes(name)) {
    failures.push(
      `${name} has an ordering-audit entry but no such gate exists under ` +
        `${relative(ROOT, GATE_DIR)}. Delete the entry, or restore the gate.`,
    )
  }
}

// The derivable half of the answer, derived instead of trusted.
for (const file of found) {
  const entry = AUDITED[file]
  if (entry === undefined) continue
  const readsCommittedRegistries = readFileSync(join(GATE_DIR, file), 'utf8').includes(REWRITTEN_BY_BUILD)
  if (readsCommittedRegistries && entry.rewrittenBy !== 'build') {
    failures.push(
      `${file} names \`${REWRITTEN_BY_BUILD}\` but is filed with rewrittenBy: ` +
        `${JSON.stringify(entry.rewrittenBy ?? null)}. \`build\` rewrites that directory in place ` +
        'at step 5 of verify. File it as rewrittenBy: \'build\' and say where the gate runs.',
    )
  }
  if (entry.rewrittenBy !== null && typeof entry.runsBeforeBuild !== 'boolean') {
    failures.push(
      `${file} declares its subject is rewritten by \`${entry.rewrittenBy}\` but does not say ` +
        'whether it runs before it. `runsBeforeBuild` must be true or false.',
    )
  }
}

if (failures.length > 0) {
  console.error(`Gate ordering audit failed (${failures.length}):\n  - ${failures.join('\n  - ')}`)
  process.exit(1)
}
console.log(
  `Gate ordering audit: ${found.length} release gates, all audited. ` +
    `${Object.values(AUDITED).filter((e) => e.rewrittenBy !== null).length} read a subject an ` +
    'earlier verify step rewrites; each says where it runs and why.',
)
