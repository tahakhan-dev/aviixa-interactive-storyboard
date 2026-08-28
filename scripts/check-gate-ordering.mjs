#!/usr/bin/env node
/**
 * THE ORDERING AUDIT, INSTITUTED (Phase 0.9). REPOINTED FOR APP-020.
 *
 * Originally this audited every `tests/coverage/**\/*.test.ts` -- the
 * `test:release` project's whole include -- because `verify` ran `build`
 * (which REWRITES `registries/generated/**`, `.next/**` and `out/**`)
 * partway through its chain, and a release gate whose subject is one of
 * those artefacts, running AFTER `build`, would be comparing the pipeline's
 * own output against itself: correct in its own file, unable to fail where
 * it actually runs. That was not hypothetical -- `registry-freshness` gate 1
 * rode a stale committed registry through a green `verify` for four commits
 * before this file existed to catch exactly that shape.
 *
 * APP-020 (client instruction, this round): every test case in this
 * repository is deleted, `tests/` included -- master prompt §2.3
 * policy-excludes test cases from this project entirely. `test:release` and
 * every file this audit used to cover are gone. The ORDERING RISK this file
 * exists to catch is not gone, though: `pnpm verify` still runs `build`
 * partway through its chain (validate:collections -> lint ->
 * check:gate-ordering -> check:boundary-rules -> build -> the three scans
 * below), and the surviving compile-level scans that read `out/` or
 * `registries/generated/**` are subject to the exact same trap a
 * misordered `verify` step always was. So this file is repointed, not
 * retired: it now audits the same question -- does an earlier `verify` step
 * rewrite this gate's subject? -- over the surviving `check:`/`scan:`/
 * `validate:`/`ledger:` scripts instead of the deleted `tests/coverage/`
 * suites. A gate that asserted over an empty set once `tests/` was gone
 * would be worse than no gate at all; this keeps it asserting over the
 * five real scripts `pnpm verify` still runs.
 *
 * WHAT THIS CHECKS, AND WHAT IT DOES NOT.
 *
 *   1. Every `check:`/`scan:`/`validate:`/`ledger:` script in package.json
 *      (this script's own `check:gate-ordering` excluded) names a
 *      `scripts/*.mjs` file, and every such file has an entry below. A new
 *      gate wired in under one of those four prefixes is RED until its
 *      author writes down what it reads and whether `build` rewrites that.
 *      An entry for a script no longer wired in that way is red too, so the
 *      list cannot rot into a record of gates that used to run.
 *
 *      This is a narrower net than a directory walk (`scripts/` also holds
 *      producers -- build-registries.mjs, build-doh-module-reach.mjs,
 *      build-stu-module-reach.mjs, generate-seed.mjs, seal-manifests.mjs and
 *      others -- that WRITE artefacts rather than gate them, and have no
 *      `subject` to audit in this sense) but it is the same net `verify`
 *      itself uses: every script this audits is one `pnpm verify` actually
 *      runs as a pass/fail check.
 *
 *   2. The one part of the answer that is derivable is derived rather than
 *      trusted: a gate whose text names `registries/generated`, the only
 *      COMMITTED artefact `build` rewrites, may not be filed as having a
 *      subject nothing rewrites. It must say `rewrittenBy: 'build'` and then
 *      say where it runs. `out/`, the OTHER artefact `build` rewrites, is
 *      not committed, so a stale copy cannot ride through a commit the way
 *      a stale `registries/generated/` did -- but running before `build`
 *      writes it still reads nothing or reads last build's export, so the
 *      three scripts that read it are filed by hand below, the same way
 *      the pre-repoint version filed its own out/-reading gates by hand.
 *
 * `verdict` itself is prose and is not machine-checked -- deciding whether
 * a scan's subject is "the build's own output" or "an independent product
 * of `src/`" is a reading, not a grep. What is enforced is that a human made
 * the reading and left it where the next one can disagree with it.
 *
 * Run with: node scripts/check-gate-ordering.mjs [package.json path]
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPTS_DIR = join(ROOT, 'scripts')
/** Overridable so this check can be planted against a scratch package.json. */
const PKG_PATH = process.argv[2] ?? join(ROOT, 'package.json')

/** The only COMMITTED artefact any `verify` step rewrites. See check 2. */
const REWRITTEN_BY_BUILD = 'registries/generated'

/** Prefixes that mark a package.json script as one of THIS project's own gates. */
const GATE_PREFIXES = ['check:', 'scan:', 'validate:', 'ledger:']
/** This file's own package.json entry -- auditing itself is not the question. */
const SELF = 'check:gate-ordering'

/**
 * The audited answer for every surviving gate script, keyed on file name
 * under `scripts/`.
 *
 * `rewrittenBy` is the `verify` step that rewrites this gate's subject, or
 * `null` when no earlier step touches it. `runsBeforeBuild` is required
 * whenever `rewrittenBy` is a step, and answers the only question that
 * matters once it is: does this gate get to read the subject before the
 * pipeline overwrites it?
 */
const AUDITED = {
  'validate-collections.mjs': {
    subject: 'src/data/schemas/** as authored (loaded live via tsx/esm/api)',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS. No verify step writes src/. Runs first in `verify` (step 2, right after ' +
      'typecheck), before `build` even starts, so ordering is moot either way.',
  },
  'check-boundary-rules.mjs': {
    subject:
      'synthetic in-memory source strings, linted against the real production ESLint config ' +
      '(eslint.config.mjs, eslint-rules/*.mjs) via ESLint#lintText',
    rewrittenBy: null,
    verdict:
      'NOT VACUOUS. No verify step writes eslint.config.mjs or eslint-rules/. Runs at step 5 of ' +
      '`verify`, before `build` (step 6) -- and would still be correct after it, since its subject ' +
      'is the lint config, not build output.',
  },
  'scan-no-external-network.mjs': {
    subject: 'src/**, app/** as authored, plus every *.html under out/ with <script> blocks stripped',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS, and the out/ half is exactly the arrangement this audit exists to catch if ' +
      'misordered. `build` writes out/ at step 6 of `verify`; this scan runs at step 7, after it, ' +
      'so it reads the FRESH export rather than a stale or absent one. The src/+app/ half needs no ' +
      'ordering at all -- authored, and no verify step rewrites either tree.',
  },
  'scan-no-fallback-shells.mjs': {
    subject: 'every *.html under out/, grepped for id="__next_error__"',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` writes out/ at step 6 of `verify`; this scan runs at step 8, after it. ' +
      'Reading the FRESH export is the whole point -- this is the exact defect class ' +
      '(724 workflow pages silently 404ing as this fallback shell, task-17-report.md) that a run ' +
      'against a stale or missing out/ would have missed entirely.',
  },
  'ledger-reconcile.mjs': {
    subject: 'the fourteen §9.6 generated registries under registries/generated/*.json',
    rewrittenBy: 'build',
    runsBeforeBuild: false,
    verdict:
      'NOT VACUOUS. `build` chains `build:registries` and rewrites registries/generated/ in place ' +
      'at step 6 of `verify`; this reconciliation runs at step 9, after it, so it reads the FRESH ' +
      'registries rather than the ones a previous build left on disk. This is the precise shape ' +
      '`registry-freshness` got wrong before this audit existed (comparing build output against ' +
      'itself); filing it as `rewrittenBy: null` would repeat that mistake.',
  },
}

const HOW_TO_FIX =
  'Answer it in scripts/check-gate-ordering.mjs by adding an entry: `subject` (what the gate ' +
  "reads), `rewrittenBy` (the verify step that rewrites that subject, or null), and -- when it is " +
  'a step -- `runsBeforeBuild`, plus a `verdict` saying why that is acceptable. If an earlier step ' +
  'does rewrite the subject, fix the ORDERING in package.json rather than weakening the gate, and ' +
  'prove it: plant the defect and watch the WHOLE of `pnpm verify` go red end to end.'

if (!existsSync(PKG_PATH)) {
  console.error(`Gate ordering audit failed: no package.json at ${PKG_PATH}.`)
  process.exit(1)
}
const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'))
const scripts = pkg.scripts ?? {}

// Every package.json script under a gate-shaped prefix, this file's own entry
// excluded, that names a `node scripts/X.mjs` invocation.
const found = Object.entries(scripts)
  .filter(([name]) => name !== SELF && GATE_PREFIXES.some((p) => name.startsWith(p)))
  .map(([name, cmd]) => {
    const m = /node scripts\/([\w.-]+\.mjs)/.exec(cmd)
    return { npmScript: name, file: m?.[1] ?? null }
  })
  .sort((a, b) => a.npmScript.localeCompare(b.npmScript))

const failures = []

// A gate this build has never audited. The whole obligation, in one check.
for (const { npmScript, file } of found) {
  if (!file) {
    failures.push(`package.json script "${npmScript}" is gate-prefixed but names no scripts/*.mjs file.`)
    continue
  }
  if (!existsSync(join(SCRIPTS_DIR, file))) {
    failures.push(`package.json script "${npmScript}" names scripts/${file}, which does not exist.`)
    continue
  }
  if (!Object.hasOwn(AUDITED, file)) {
    failures.push(
      `scripts/${file} (package.json script "${npmScript}") is a gate with no ordering audit. ` +
        'Before it lands it must answer: DOES AN EARLIER STEP OF `verify` REWRITE MY SUBJECT? ' +
        HOW_TO_FIX,
    )
  }
}

// An entry with no matching package.json script is a record of a gate that used to run.
const liveFiles = new Set(found.map((f) => f.file).filter(Boolean))
for (const name of Object.keys(AUDITED)) {
  if (!liveFiles.has(name)) {
    failures.push(
      `scripts/${name} has an ordering-audit entry but no package.json script under ` +
        `${GATE_PREFIXES.join('/')} wires it in. Delete the entry, or restore the wiring.`,
    )
  }
}

// The derivable half of the answer, derived instead of trusted.
for (const name of Object.keys(AUDITED)) {
  if (!liveFiles.has(name)) continue
  const entry = AUDITED[name]
  const readsCommittedRegistries = readFileSync(join(SCRIPTS_DIR, name), 'utf8').includes(REWRITTEN_BY_BUILD)
  if (readsCommittedRegistries && entry.rewrittenBy !== 'build') {
    failures.push(
      `scripts/${name} names \`${REWRITTEN_BY_BUILD}\` but is filed with rewrittenBy: ` +
        `${JSON.stringify(entry.rewrittenBy ?? null)}. \`build\` rewrites that directory in place. ` +
        "File it as rewrittenBy: 'build' and say where the gate runs.",
    )
  }
  if (entry.rewrittenBy !== null && typeof entry.runsBeforeBuild !== 'boolean') {
    failures.push(
      `scripts/${name} declares its subject is rewritten by \`${entry.rewrittenBy}\` but does not ` +
        'say whether it runs before it. `runsBeforeBuild` must be true or false.',
    )
  }
}

if (failures.length > 0) {
  console.error(`Gate ordering audit failed (${failures.length}):\n  - ${failures.join('\n  - ')}`)
  process.exit(1)
}
console.log(
  `Gate ordering audit: ${found.length} gate scripts, all audited. ` +
    `${Object.values(AUDITED).filter((e) => e.rewrittenBy !== null).length} read a subject an ` +
    'earlier verify step rewrites; each says where it runs and why.',
)
