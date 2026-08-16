import { canonicalSerialize, sha256Hex } from '@/domain/hash'
import type { ReviewRecord } from './records'

/**
 * V1 has exactly one package shape. A future format change bumps this and
 * import checks it explicitly (Task 10) rather than guessing from shape.
 */
export const PACKAGE_FORMAT_VERSION = 1

export interface PackageManifestEntry {
  readonly path: string
  readonly bytes: number
  readonly sha256: string
}

export interface ExportReviewPackageInput {
  readonly sourceHash: string
  readonly buildHash: string
  readonly scenarioVersion: string
  readonly records: readonly ReviewRecord[]
}

/**
 * A review package is a small self-describing bundle: reviewer comments plus
 * a manifest that lets an importer detect ACCIDENTAL CORRUPTION of the bytes
 * in transit (e.g. a truncated download, a bad copy-paste). This is a
 * checksum, not a signature: it says nothing about who produced the package
 * or whether its content is truthful, only whether it still matches the
 * bytes it was exported with.
 */
export interface ReviewPackage {
  readonly formatVersion: number
  readonly sourceHash: string
  readonly buildHash: string
  readonly scenarioVersion: string
  readonly records: readonly ReviewRecord[]
  readonly manifest: readonly PackageManifestEntry[]
  readonly manifestChecksum: string
}

/**
 * The package's content, broken into named logical files the manifest can
 * describe independently. `meta.json` carries everything BUT the records so
 * a corrupted records blob can be told apart from corrupted metadata; the
 * two are hashed and reported as separate manifest entries.
 */
function packageFiles(input: ExportReviewPackageInput): Readonly<Record<string, string>> {
  return {
    'meta.json': canonicalSerialize({
      formatVersion: PACKAGE_FORMAT_VERSION,
      sourceHash: input.sourceHash,
      buildHash: input.buildHash,
      scenarioVersion: input.scenarioVersion,
    }),
    'records.json': canonicalSerialize(input.records),
  }
}

/**
 * One entry per logical file, sorted by normalised (already-relative,
 * forward-slash) path so the manifest — and therefore its checksum — is
 * stable regardless of object key enumeration order.
 */
async function buildManifest(
  files: Readonly<Record<string, string>>,
): Promise<readonly PackageManifestEntry[]> {
  const entries = await Promise.all(
    Object.entries(files).map(async ([path, content]) => ({
      path,
      bytes: new TextEncoder().encode(content).length,
      sha256: await sha256Hex(content),
    })),
  )
  return entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
}

/**
 * Exports the given records as a `ReviewPackage`. The input type carries no
 * memory field, and the guard below rejects one anyway at runtime: the
 * frozen source closes the data classes at seven (operational records,
 * configuration, evidence media, audit, telemetry, memory, personal data)
 * and gives memory no export path at V1. Being structurally unable to
 * export it is the requirement, not a convention a future caller could
 * accidentally sidestep by widening the input type.
 *
 * `manifestChecksum` hashes the manifest ARRAY built above, which has no
 * `checksum` field of its own — the scope of the hash never includes the
 * hash itself, so the checksum cannot validate a manifest that was silently
 * altered to match it.
 */
export async function exportReviewPackage(input: ExportReviewPackageInput): Promise<ReviewPackage> {
  if ('memory' in input) {
    throw new Error(
      'Review package export cannot include memory data: the frozen source gives memory no export path at V1.',
    )
  }

  const files = packageFiles(input)
  const manifest = await buildManifest(files)
  const manifestChecksum = await sha256Hex(canonicalSerialize(manifest))

  return {
    formatVersion: PACKAGE_FORMAT_VERSION,
    sourceHash: input.sourceHash,
    buildHash: input.buildHash,
    scenarioVersion: input.scenarioVersion,
    records: input.records,
    manifest,
    manifestChecksum,
  }
}
