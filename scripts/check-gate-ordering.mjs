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
    subject:
      'the frozen blueprint at run time, plus src/, app/, tests/, scripts/, docs/ and, since R5-Q02, ' +
      'the authored and generated JSON under registries/ (registries/raw and the committed identifier ' +
      'index excluded, and the surviving file list asserted by name)',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and the asymmetry is the same one walkthrough-routes relies on. `build` chains ' +
      '`build:registries` and so rewrites ONE side of the comparison -- registries/generated -- and ' +
      'runs first. It cannot write the other: the other side is the frozen blueprint, whose sha256 ' +
      'this file asserts on every run and which is read-only input by the standing rule. A ' +
      'regeneration that emitted a wrong locator makes the artefact wrong and this gate says so; a ' +
      'regeneration cannot make a wrong locator right. Reading the FRESH registries/generated is the ' +
      'point -- the claim is about what the dashboard renders -- and it was watched red against a real ' +
      'blank-line locator planted in source-reconciliation.json and restored byte-exact.',
  },
  'prohibited-patterns.test.ts': {
    subject: 'a fixed literal set, scanned over authored sources',
    rewrittenBy: null,
    verdict: 'NOT VACUOUS. Carries its own explicit non-vacuity guard.',
  },
  'screenshot-manifest.test.ts': {
    subject: 'out/ as built, compared against the committed docs/screenshots/manifest.json',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and it runs in the release project BECAUSE build rewrites half its subject. The manifest side is written only by `pnpm screenshots`, which verify does not run -- which is exactly the staleness this gate exists to catch (audit C-23: 85 rows against a 102-route export, three slices old). The pre-existing check lived in the WRITER, tests/screenshots/capture.spec.ts, and compared rows to routes after writing them, so it could not fail for being unrun.',
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
  'slice-10-gates.test.ts': {
    subject:
      'the frozen blueprint at run time, compared against src/** and app/** as authored -- the two ' +
      'notification register bodies, the two command-state enumerations, the six closed ' +
      'vocabularies, the decision canon at src/disclosure/decisions.ts, the matrix column type at ' +
      'src/policy/columns.ts with the two schedule matrices, MOD-DOH-11\'s read-scope selector and ' +
      'its seeded fixture, MOD-DOH-18\'s report sets, the scheduled-work census, and the ' +
      'occurrence-outcome conflict record. NO ASSERTION READS A BUILD PRODUCT: not out/, and ' +
      'not registries/generated. The plant log at the foot of the file NAMES registries/generated ' +
      'once, as a cross-reference to a plant run against slice-09-gates\' subject, and check 2 ' +
      'below rightly refuses to take that on trust — so this entry is filed as rewrittenBy ' +
      '\'build\' and the verdict states what the mention is. Rewording the comment to slip past ' +
      'the check would have weakened the check for the next gate.',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and nothing `verify` writes is on either end of any assertion here. Every ' +
      'gate has the blueprint on one side -- read-only input whose sha256 this file asserts -- and ' +
      'authored src/ or app/ on the other, and no verify step writes either. Unlike slice-06 and ' +
      'slice-09 this gate reads NO build product at all: not registries/generated, not out/. The ' +
      'ordering that matters for this file is the one its own header states and it is a ' +
      'DEPENDENCY order rather than a verify-step one -- it is written strictly after the thirteen ' +
      'build tasks, because a directory enumeration written before the directories exist passes ' +
      'on an empty scan. Every derived list carries a floor whose failure message names what it ' +
      'walked, and the floor instrument itself is exercised on each run. Every assertion whose ' +
      'subject this build can change was watched red on a real plant into a real shipping file, ' +
      'and each file restored byte-identically against a checksum taken once before the first ' +
      'plant.',
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
      'identifier-anchored citations under src/, app/, tests/, scripts/ and docs/ ' +
      '(.ts/.tsx/.mjs/.js and .md)',
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
    subject:
      'out/workflows/index.html and out/coverage/**, compared against ' +
      'registries/generated/workflows.json, registries/generated/source-reconciliation.json ' +
      'and the committed master-prompt artefact',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and the entry was widened when R4-B07 and R4-B08 were added -- it used to ' +
      'read "authored workflow sources", which stopped being the whole subject the moment the ' +
      'file started reading out/. `build` writes one end and runs first, and what makes that ' +
      'safe is the other end: the generated workflows registry and the hand-authored ' +
      'reconciliation report are INPUTS to the page, and the master prompt artefact is a ' +
      'committed document no verify step writes. Every figure the page is held to is recomputed ' +
      'from one of those three, never read back out of out/, so build cannot satisfy the gate ' +
      'by rewriting what it compares against.',
  },
  'reconciliation-table.test.ts': {
    subject:
      'out/coverage/index.html, compared against registries/generated/source-reconciliation.json, ' +
      'the fourteen registries/generated/*.json, src/coverage/descriptors.ts and the committed ' +
      'master-prompt artefact',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` writes the page and runs first, which is the arrangement this audit ' +
      'exists to catch, and what makes it safe is that every expectation is an INPUT to that ' +
      'page rather than a product of it: the reconciliation report is hand-authored and nothing ' +
      'in verify writes it, the registries are the generator\'s output which the page consumes, ' +
      'and the descriptor list is authored src/. The registry-slug coverage check is an ' +
      'EQUALITY against REGISTRY_DESCRIPTORS in both directions rather than a containment, ' +
      'because a thirteen-row table missing five inventories passed containment for eleven ' +
      'slices. Every population is asserted non-empty and at its measured size first.',
  },
  'census-closure.test.ts': {
    subject:
      'out/coverage/**, compared against the app/ and src/ trees scanned for control-matrix ' +
      'labels, the fourteen registries/generated/*.json, ' +
      'registries/authored/census-status-overrides.json, the frozen blueprint and the committed ' +
      'master-prompt artefact',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` writes out/ and rewrites registries/generated, and both are named ' +
      'here rather than glossed. What makes it safe is that the two figures under test are ' +
      'RECOMPUTED from the authored trees -- this file carries its own transcribed copy of the ' +
      'generator\'s `control:` regex and walks app/ and src/ itself, so a generator whose scan ' +
      'narrows again diverges from this one and goes red rather than moving both ends together. ' +
      'The override records are checked against the frozen blueprint, read-only input, at the ' +
      'exact line each cites. The gate deliberately does NOT assert either direction is at ' +
      'zero: neither is, and a gate that could only pass at zero would be satisfied by ' +
      'relabelling 4,670 rows, which is the outcome the finding warns against. It asserts the ' +
      'distances are measured, published and unchanged.',
  },
  'registry-index-figures.test.ts': {
    subject:
      'every out/coverage/<slug>/index.html, compared against the fourteen ' +
      'registries/generated/*.json and the committed master-prompt artefact, plus an existence ' +
      'check of every linked route against out/',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and one assertion has BOTH ends inside build\'s output by design: a linked ' +
      'route is checked against out/ on disk, because the claim under test is precisely that ' +
      'the export contains the page the row links to. That is reading the transformation, not ' +
      'comparing a directory to itself -- the route comes from the generated registry and the ' +
      'page from the Next export, and a renamed route breaks one without breaking the other. ' +
      'Every other expectation is recomputed from the generated registries, which are the ' +
      'page\'s input. Populations are floored: fourteen indexes, at least eight with a linked ' +
      'row, over 250 linked rows, so a fix that resolved one route could not pass.',
  },
  'rendered-absence-claims.test.ts': {
    subject:
      'the frozen blueprint at run time, compared against (a) authored .ts/.tsx under app/ and ' +
      'src/ swept for rendered claims that the source lacks a named identifier, and (b) every ' +
      'sourceLine field and every @L composite id under registries/generated',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and half its subject is the COMMITTED artefact build rewrites, which is the ' +
      'arrangement this audit exists to catch. What makes it safe is that the other end is the ' +
      'frozen blueprint -- read-only input whose sha256 and line count this file asserts -- and ' +
      'no expectation is read back out of registries/generated. `build` regenerates the ' +
      'registries from registries/raw and cannot make a blank line non-blank, so it cannot ' +
      'satisfy this gate by rewriting what the gate compares against; reading the FRESH ' +
      'registries is the point, because the claim is about the artefact that ships. The app/ ' +
      'and src/ half is authored and no verify step writes it. Both halves carry a population ' +
      'floor and a detector self-test on real data -- the four disclosures as they shipped, and ' +
      'three real blank lines against the three heading lines above them -- because closing ' +
      'R4-01 removes most of the absence claims from the tree and a sweep over nothing would ' +
      'otherwise be indistinguishable from a clean one.',
  },
  'canon-size-literal.test.ts': {
    subject: 'authored .ts/.tsx under src/ and app/, plus OPEN_DECISIONS.length read from src/',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS. No verify step writes src/ or app/. Both ends of the comparison are authored: the forbidden literal is derived from OPEN_DECISIONS.length at run time and the scan is over the same authored tree, so nothing the pipeline produces can satisfy it. Carries a file-count floor so an empty walk cannot pass silently, and three self-plants (current size spelled and numeric, a wrong size, and the quoted-record exemption proved by convicting the same words unquoted).',
  },
  'slice-11-gates.test.ts': {
    subject:
      'every out/**/index.html, parsed, against the provenance contract and the six class ' +
      'records in src/; plus the frozen blueprint at run time; plus authored .ts/.tsx under ' +
      'src/ and app/ for the severity separation, the reachability closure and the ' +
      'widening-annotation sweep',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` writes one end and runs first -- the arrangement this audit exists ' +
      'to catch -- and what makes it safe is that no expectation is read back out of out/. ' +
      'Every expectation comes from src/ as authored, from the frozen blueprint whose sha256 ' +
      'and line count this file asserts, or from the checker `src/ai/provenance/contract.ts` ' +
      'exports: the class vocabulary, the exactly-one-per-guidance-element rule, and the two ' +
      'forbidden live-inference labels read off the PROV-1 and PROV-2 records. The build turns ' +
      'src/ into out/ and this gate asserts properties of that transformation, so the build ' +
      'cannot satisfy it by rewriting what it compares against. Reading the FRESH out/ is the ' +
      'whole point -- L89439 is a rule about what a person is SHOWN, and fifty provenance ' +
      'marks across sixteen exported pages are the only place that claim can be checked. ' +
      'Contrast registry-freshness, which compared committed artefacts to freshly generated ' +
      'ones and could only ever compare a directory to itself. ' +
      'IT WRITES TO out/ ONCE, DELIBERATELY: one case splices a second sibling provenance mark ' +
      'into a real exported page, asserts the checker convicts, restores the bytes in a ' +
      '`finally` and then asserts the restoration byte-for-byte. That plant is why this gate ' +
      'is known to be able to fail, and it is the reason `test:release` runs with ' +
      'fileParallelism: false. It touches no committed artefact: nothing under ' +
      'registries/generated, src/ or app/ is written by this file. ' +
      'The three authored-tree halves are NOT VACUOUS anywhere in verify: no step writes src/ ' +
      'or app/, and the severity check is asserted disjoint over two non-empty component sets ' +
      'rather than over an empty one.',
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
