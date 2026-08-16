import { z } from 'zod'
import { canonicalSerialize, sha256Hex } from '@/domain/hash'
import { SURFACES, type SurfaceId } from '@/domain/surfaces'
import {
  REVIEW_STATUSES, REVIEW_SEVERITIES, REVIEW_DISPOSITIONS,
  type ReviewRecord, type ReviewStatus, type ReviewSeverity, type ReviewDisposition,
} from './records'

// Failure-signalling convention (documented in full at the top of
// `@/review/store`): `importReviewPackage` below is the IO/parsing boundary
// and follows it exactly -- never throws, always resolves a typed
// `ImportOutcome` discriminated by `ok`. `exportReviewPackage`'s one throw
// (a `memory` field on the input) is the synchronous-precondition exception
// to that rule: it can only fire if an immediate caller bypasses the input
// type, which is a programming error, not a runtime IO failure.

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

// ---------------------------------------------------------------------------
// Import: validate, then quarantine or preview. Never apply.
// ---------------------------------------------------------------------------

/** A package larger than this is refused before it is even shape-checked. */
export const MAX_PACKAGE_BYTES = 5_000_000

const REVIEW_STATUS_VALUES = REVIEW_STATUSES as unknown as [ReviewStatus, ...ReviewStatus[]]
const REVIEW_SEVERITY_VALUES = REVIEW_SEVERITIES as unknown as [ReviewSeverity, ...ReviewSeverity[]]
const REVIEW_DISPOSITION_VALUES = REVIEW_DISPOSITIONS as unknown as [ReviewDisposition, ...ReviewDisposition[]]
const SURFACE_ID_VALUES = SURFACES.map((s) => s.id) as unknown as [SurfaceId, ...SurfaceId[]]

const PackageManifestEntrySchema = z
  .object({
    path: z.string().min(1),
    bytes: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict()

/** Mirrors `ReviewRecord` field-for-field. An unknown field fails closed. */
const ReviewRecordSchema = z
  .object({
    id: z.string().min(1),
    anchorType: z.string().min(1),
    anchorId: z.string().min(1),
    surface: z.enum(SURFACE_ID_VALUES),
    module: z.string().min(1).optional(),
    functionId: z.string().min(1).optional(),
    route: z.string().min(1).optional(),
    screen: z.string().min(1).optional(),
    storyState: z.string().min(1).optional(),
    reviewerLabel: z.string().min(1),
    status: z.enum(REVIEW_STATUS_VALUES),
    severity: z.enum(REVIEW_SEVERITY_VALUES),
    comment: z.string(),
    requestedChange: z.string().min(1).optional(),
    sourceFingerprint: z.string().min(1),
    scenarioVersion: z.string().min(1),
    buildHash: z.string().min(1),
    createdAtLogical: z.number(),
    updatedAtLogical: z.number(),
    disposition: z.enum(REVIEW_DISPOSITION_VALUES),
    response: z.string().nullable(),
    supersededBy: z.string().nullable(),
  })
  .strict()

const ReviewPackageSchema = z
  .object({
    formatVersion: z.number(),
    sourceHash: z.string().min(1),
    buildHash: z.string().min(1),
    scenarioVersion: z.string().min(1),
    records: z.array(ReviewRecordSchema),
    manifest: z.array(PackageManifestEntrySchema),
    manifestChecksum: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict()

/**
 * zod's `.optional()` infers `T | undefined` for a field's TYPE, which is
 * how zod represents "may be absent" -- but `exactOptionalPropertyTypes`
 * distinguishes that from `field?: T` ("key may be omitted, but if present
 * is never explicitly `undefined`"), which is the shape `ReviewRecord`
 * actually declares. At runtime this is a non-issue: a `raw` value parsed
 * from `JSON.parse` never has a key explicitly set to `undefined` (JSON has
 * no `undefined` literal), so zod's parsed output only ever OMITS an absent
 * optional key. This function makes that omission explicit to the type
 * checker too, by spreading each optional field only when defined.
 */
function toReviewRecord(r: z.infer<typeof ReviewRecordSchema>): ReviewRecord {
  return {
    id: r.id,
    anchorType: r.anchorType,
    anchorId: r.anchorId,
    surface: r.surface,
    ...(r.module !== undefined && { module: r.module }),
    ...(r.functionId !== undefined && { functionId: r.functionId }),
    ...(r.route !== undefined && { route: r.route }),
    ...(r.screen !== undefined && { screen: r.screen }),
    ...(r.storyState !== undefined && { storyState: r.storyState }),
    reviewerLabel: r.reviewerLabel,
    status: r.status,
    severity: r.severity,
    comment: r.comment,
    ...(r.requestedChange !== undefined && { requestedChange: r.requestedChange }),
    sourceFingerprint: r.sourceFingerprint,
    scenarioVersion: r.scenarioVersion,
    buildHash: r.buildHash,
    createdAtLogical: r.createdAtLogical,
    updatedAtLogical: r.updatedAtLogical,
    disposition: r.disposition,
    response: r.response,
    supersededBy: r.supersededBy,
  }
}

/** What a reviewer sees before anything is applied. Import stops here. */
export interface ImportPreview {
  readonly recordCount: number
  readonly records: readonly ReviewRecord[]
  readonly sourceHash: string
  readonly buildHash: string
  readonly scenarioVersion: string
}

export type ImportOutcome =
  | { readonly ok: true; readonly preview: ImportPreview }
  | {
      readonly ok: false
      readonly quarantined: true
      readonly failingEntry: string | null
      readonly expected: string | null
      readonly actual: string | null
      readonly reason: string
    }

function quarantine(
  reason: string,
  detail?: { failingEntry?: string | null; expected?: string | null; actual?: string | null },
): ImportOutcome {
  return {
    ok: false,
    quarantined: true,
    failingEntry: detail?.failingEntry ?? null,
    expected: detail?.expected ?? null,
    actual: detail?.actual ?? null,
    reason,
  }
}

/**
 * Best-effort byte size of an arbitrary unvalidated value, used only to
 * reject an oversized package before spending any work on it. A value that
 * cannot be serialised at all (e.g. a circular reference) is treated as
 * over-size rather than thrown from — this function must never throw, since
 * it runs before the shape check that is actually responsible for naming
 * what is wrong with the payload.
 */
function packageByteSize(raw: unknown): number {
  try {
    const serialised = JSON.stringify(raw)
    return serialised === undefined ? 0 : new TextEncoder().encode(serialised).length
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

/**
 * Validates a raw import candidate and either quarantines it or returns a
 * preview — it never applies anything to the review store itself; nothing in
 * this module writes to `@/review/store`. Order, matching the brief exactly:
 * size, then shape (Zod, strict), then format version, then source/build
 * compatibility, then per-entry hashes, then the manifest checksum. The
 * FIRST failure quarantines and stops — later steps never run once an
 * earlier one has failed, so a reviewer is never shown a preview built from
 * data that already failed an earlier, cheaper check.
 */
export async function importReviewPackage(
  raw: unknown,
  expected: { readonly sourceHash: string; readonly buildHash: string },
): Promise<ImportOutcome> {
  // 1. size
  const byteSize = packageByteSize(raw)
  if (byteSize > MAX_PACKAGE_BYTES) {
    return quarantine(
      `Package is ${byteSize} bytes, over the ${MAX_PACKAGE_BYTES}-byte import limit.`,
      { expected: String(MAX_PACKAGE_BYTES), actual: String(byteSize) },
    )
  }

  // 2. shape
  const parsed = ReviewPackageSchema.safeParse(raw)
  if (!parsed.success) {
    return quarantine(
      `Package does not match the expected shape: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
    )
  }
  const pkg = parsed.data
  const normalizedRecords: readonly ReviewRecord[] = pkg.records.map(toReviewRecord)

  // 3. format version
  if (pkg.formatVersion !== PACKAGE_FORMAT_VERSION) {
    return quarantine('Unsupported package format version.', {
      expected: String(PACKAGE_FORMAT_VERSION),
      actual: String(pkg.formatVersion),
    })
  }

  // 4. source and build compatibility — refuse to merge across sources/builds
  if (pkg.sourceHash !== expected.sourceHash) {
    return quarantine(
      'Package source hash does not match the running source; refusing to merge review comments across sources.',
      { expected: expected.sourceHash, actual: pkg.sourceHash },
    )
  }
  if (pkg.buildHash !== expected.buildHash) {
    return quarantine('Package build hash does not match the running build.', {
      expected: expected.buildHash,
      actual: pkg.buildHash,
    })
  }

  // 5. per-entry hashes — recompute each logical file from the package's own
  // declared fields and compare against what the manifest claims. Checked
  // BOTH directions (I5, final review): the forward loop below catches a
  // real payload that is missing or altered; the reverse loop catches the
  // opposite -- a manifest entry DECLARED that this package would never
  // have produced (e.g. a `memory.json` this exporter is structurally
  // incapable of exporting, per spec §5). Step 6's checksum is recomputed
  // from `recomputedManifest`, not from `pkg.manifest`, so it is blind to
  // anything declared beyond the real entries -- the reverse loop is the
  // only place an extra declared entry is ever caught.
  const recomputedManifest = await buildManifest(packageFiles({ ...pkg, records: normalizedRecords }))
  const declaredByPath = new Map(pkg.manifest.map((entry) => [entry.path, entry]))
  const recomputedByPath = new Map(recomputedManifest.map((entry) => [entry.path, entry]))
  for (const entry of recomputedManifest) {
    const declared = declaredByPath.get(entry.path)
    if (!declared || declared.sha256 !== entry.sha256 || declared.bytes !== entry.bytes) {
      return quarantine(`Manifest entry "${entry.path}" does not match its content hash.`, {
        failingEntry: entry.path,
        expected: declared?.sha256 ?? null,
        actual: entry.sha256,
      })
    }
  }
  for (const declared of pkg.manifest) {
    if (!recomputedByPath.has(declared.path)) {
      return quarantine(
        `Manifest declares an entry ("${declared.path}") this package does not actually contain.`,
        { failingEntry: declared.path, expected: null, actual: declared.sha256 },
      )
    }
  }

  // 6. manifest checksum
  const recomputedChecksum = await sha256Hex(canonicalSerialize(recomputedManifest))
  if (recomputedChecksum !== pkg.manifestChecksum) {
    return quarantine('Manifest checksum does not match the manifest contents.', {
      expected: recomputedChecksum,
      actual: pkg.manifestChecksum,
    })
  }

  return {
    ok: true,
    preview: {
      recordCount: normalizedRecords.length,
      records: normalizedRecords,
      sourceHash: pkg.sourceHash,
      buildHash: pkg.buildHash,
      scenarioVersion: pkg.scenarioVersion,
    },
  }
}
