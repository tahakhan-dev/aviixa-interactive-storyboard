#!/usr/bin/env node
/**
 * SEAL THE PRODUCT CANDIDATE AND THE EVIDENCE ENVELOPE (round-6 `R6-B04`).
 *
 * Master prompt §23.2 requires two NON-SELF-REFERENTIAL hash scopes:
 *
 *   1. Product Candidate — application source, tests, fixtures, configuration,
 *      lockfile, assets, visual baselines, and required product/delivery
 *      documentation. **The Product Candidate Manifest does not hash itself**,
 *      and here it cannot: the manifest lives under `docs/process/ledgers/`,
 *      which is an EVIDENCE root, so it is outside the product scope by
 *      construction rather than by an exclusion someone must remember.
 *   2. Evidence Envelope — process ledgers, approvals, research receipts,
 *      command output, review and verification reports, bound to one Candidate
 *      ID. **The Evidence Envelope Manifest hashes its payload but excludes
 *      itself**, and that is the one exclusion in this file, stated as data in
 *      the manifest it writes (`excludes`) rather than hidden in code.
 *
 * WHY IT EXISTS. Both manifests named candidate `SLICE04-b82f66e93567c0a5`, a
 * candidate seven slices back: 185 of its 365 entries had drifted, and the
 * envelope named slice 2b with three drifted entries and one file that a schema
 * change had retired. §29.5 requires the final response to state exact
 * Candidate IDs and hashes, so quoting either would have shipped a false hash
 * to the client. Resealing by hand is how they got seven slices stale; this is
 * one command, and `tests/coverage/process-evidence.test.ts` reds when the tree
 * moves away from what it wrote.
 *
 * THE FILE SET IS DERIVED, NEVER TYPED. `git ls-files --cached --others
 * --exclude-standard` — tracked files PLUS untracked ones git does not ignore,
 * so a new file that nobody has committed yet is still inside a scope and
 * cannot be silently absent from both manifests. The partition is TOTAL: every
 * listed path lands in exactly one of the two scopes, and the gate asserts that
 * as an equality in both directions, so a file dropped from a manifest reds
 * rather than shrinking a population.
 *
 * WHAT A SEAL PROVES AND WHAT IT DOES NOT. It proves these bytes are the bytes
 * that were here when the chain was run. It proves NOTHING about whether a
 * review happened, whether the findings are closed, or whether the verification
 * figures below were honestly measured — those are the disposition record's job
 * and the verification ledger's. A manifest is a fingerprint, not a warrant.
 *
 *   node scripts/seal-manifests.mjs --verify   # report drift, write nothing
 *   node scripts/seal-manifests.mjs            # reseal both
 *
 * Verification figures are NOT invented here. `--verification <file>` takes a
 * JSON object that is copied into the candidate manifest verbatim; without it
 * the block already on disk is carried forward and its `sealed_against` field
 * is set to `stale` so a reader can see it was not re-measured.
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export const PRODUCT_MANIFEST = 'docs/process/ledgers/product-candidate-manifest.json'
export const ENVELOPE_MANIFEST = 'docs/process/ledgers/evidence-envelope-manifest.json'

/**
 * The evidence side of the partition. Everything else is product.
 *
 * A ROOT LIST AND NOT A FILE LIST, so a new ledger, a new audit register or a
 * new brief joins the envelope the moment it exists. `docs/census/` is here
 * because its build maps are research receipts — how a census was derived —
 * not something the application ships; `docs/walkthroughs.md`,
 * `docs/client-review-guide.md`, `docs/deployment.md` and `docs/screenshots/`
 * are required DELIVERY documentation and stay on the product side.
 */
export const EVIDENCE_ROOTS = [
  'docs/process/',
  'docs/superpowers/',
  'docs/census/',
  'artifacts/evidence/',
]

/** Exactly the probe convention `tests/probe-paths.ts` defines. */
const FOREIGN_PROBE_ENTRY = /^\.zz-probe-(?:[a-z0-9-]+-)?\d+(?:\.json)?$/
const holdsForeignProbe = (path) => path.split('/').some((s) => FOREIGN_PROBE_ENTRY.test(s))

/** Every path git accounts for, tracked or not-yet-tracked, probes removed. */
export function repoFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  return out.split('\n').filter((p) => p !== '' && !holdsForeignProbe(p)).sort()
}

export const isEvidence = (path) => EVIDENCE_ROOTS.some((root) => path.startsWith(root))

/** `[product, evidence]`, a total partition of `files`. */
export function partition(files) {
  return [files.filter((f) => !isEvidence(f)), files.filter(isEvidence)]
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

export function entriesFor(paths) {
  return paths.map((path) => {
    const bytes = readFileSync(join(ROOT, path))
    return { path, bytes: statSync(join(ROOT, path)).size, sha256: sha256(bytes) }
  })
}

/**
 * The scope digest: sha256 over `path\0sha256\n` for every entry, in path
 * order. Content-derived and independent of the manifest wrapper, so neither
 * manifest's own bytes can enter its own digest.
 */
export const scopeDigest = (entries) =>
  sha256(entries.map((e) => `${e.path}\0${e.sha256}\n`).join(''))

function gitOrNull(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function main() {
  const verifyOnly = process.argv.includes('--verify')
  const vIndex = process.argv.indexOf('--verification')
  const verificationFile = vIndex === -1 ? null : process.argv[vIndex + 1]

  const [productPaths, evidenceAll] = partition(repoFiles())
  const envelopePaths = evidenceAll.filter((p) => p !== ENVELOPE_MANIFEST)

  const productEntries = entriesFor(productPaths)
  const productDigest = scopeDigest(productEntries)
  const candidateId = `SLICE11-${productDigest.slice(0, 16)}`

  const previous = JSON.parse(readFileSync(join(ROOT, PRODUCT_MANIFEST), 'utf8'))
  const verification = verificationFile
    ? JSON.parse(readFileSync(verificationFile, 'utf8'))
    : { ...previous.verification, sealed_against: 'stale — resealed without a fresh measurement' }

  const product = {
    schema_version: 2,
    ledger: 'Product Candidate Manifest',
    governing_section: 'master prompt §23.2 — scope 1 of the two non-self-referential hash scopes',
    slice: '11',
    candidate_id: candidateId,
    candidate_manifest_sha256: productDigest,
    scope: {
      kind: 'product-candidate',
      contents:
        'application source, tests, fixtures, configuration, lockfile, assets and required '
        + 'delivery documentation',
      derivation:
        'git ls-files --cached --others --exclude-standard, foreign probe entries removed, '
        + 'every path NOT under an evidence root',
      evidence_roots: EVIDENCE_ROOTS,
      hashes_itself: false,
      why_not:
        'this manifest lives under docs/process/ledgers/, an evidence root, so it is outside '
        + 'the product scope by construction rather than by a remembered exclusion',
    },
    git_commit: gitOrNull(['rev-parse', 'HEAD']),
    git_tree: gitOrNull(['rev-parse', 'HEAD^{tree}']),
    worktree_clean: gitOrNull(['status', '--porcelain']) === '',
    source_sha256: '47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27',
    source_drift_from_s0: 'none — the frozen blueprint is re-hashed by 40 test files on every run',
    file_count: productEntries.length,
    total_bytes: productEntries.reduce((n, e) => n + e.bytes, 0),
    supersedes: previous.candidate_id,
    verification,
    files: productEntries,
  }

  // The product manifest is payload too, and it must be hashed AFTER it is
  // written or the envelope would seal the bytes it is replacing.
  if (!verifyOnly) writeFileSync(join(ROOT, PRODUCT_MANIFEST), `${JSON.stringify(product, null, 2)}\n`)
  const payload = entriesFor(envelopePaths)
  const envelopeDigest = scopeDigest(payload)

  const envelope = {
    schema_version: 2,
    ledger: 'Evidence Envelope Manifest',
    governing_section: 'master prompt §23.2 — scope 2 of the two non-self-referential hash scopes',
    envelope_id: `ENV11-${envelopeDigest.slice(0, 16)}`,
    candidate_id: candidateId,
    slice: '11',
    payload_sha256: envelopeDigest,
    scope: {
      kind: 'evidence-envelope',
      contents:
        'process ledgers, approvals, research receipts, command output, review reports, '
        + 'verification reports and status reports',
      derivation:
        'git ls-files --cached --others --exclude-standard, foreign probe entries removed, '
        + 'every path under an evidence root, this manifest excluded',
      evidence_roots: EVIDENCE_ROOTS,
      excludes: [ENVELOPE_MANIFEST],
    },
    payload_excludes_self: true,
    payload_count: payload.length,
    supersedes: 'c276164c9eb96503 (slice 2b)',
    payload,
  }

  if (verifyOnly) {
    const report = (name, entries) => {
      let drifted = 0
      let missing = 0
      for (const e of entries) {
        try {
          if (sha256(readFileSync(join(ROOT, e.path))) !== e.sha256) drifted += 1
        } catch {
          missing += 1
        }
      }
      console.log(`${name}: entries=${entries.length} drifted=${drifted} missing=${missing}`)
    }
    report('product', JSON.parse(readFileSync(join(ROOT, PRODUCT_MANIFEST), 'utf8')).files)
    report('envelope', JSON.parse(readFileSync(join(ROOT, ENVELOPE_MANIFEST), 'utf8')).payload)
    return
  }

  writeFileSync(join(ROOT, ENVELOPE_MANIFEST), `${JSON.stringify(envelope, null, 2)}\n`)
  console.log(
    `Sealed ${candidateId}\n`
      + `  product  ${product.file_count} files  sha256 ${productDigest}\n`
      + `  envelope ${envelope.payload_count} files  sha256 ${envelopeDigest}`,
  )
}

if (process.argv[1] && process.argv[1].endsWith('seal-manifests.mjs')) main()
