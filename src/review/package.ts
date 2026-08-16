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
 * Bumped to 2 in fix round 1 (review, Minor 1): Task 3 (e690e30) added
 * seven required top-level elements and five required record fields to a
 * `.strict()` schema without bumping this constant, so it briefly asserted
 * something false ("exactly one package shape") while two incompatible
 * shapes both claimed formatVersion 1. A future format change bumps this
 * again and import checks it explicitly, BEFORE the shape check (see the
 * reordering in `importReviewPackage` below) -- so an old package reports a
 * version mismatch by name, rather than quarantining as "does not match the
 * expected shape" the way a pre-e690e30, formatVersion-1 package used to.
 */
export const PACKAGE_FORMAT_VERSION = 2

export interface PackageManifestEntry {
  readonly path: string
  readonly bytes: number
  readonly sha256: string
}

/**
 * What the build claimed at export time: how many anchors sat in each
 * coverage status. Recorded so two packages reviewed against different
 * coverage states can be told apart.
 */
export interface CoverageSnapshot {
  readonly takenAtLogical: number
  readonly byStatus: Readonly<Record<string, number>>
}

export interface ExportReviewPackageInput {
  readonly sourceHash: string
  readonly promptHash: string
  readonly buildHash: string
  readonly scenarioVersion: string
  readonly scenarioSeed: string
  readonly fixtureRefs: readonly string[]
  readonly records: readonly ReviewRecord[]
  readonly decisions: readonly string[]
  readonly bookmarks: readonly string[]
  readonly coverageSnapshot: CoverageSnapshot
  readonly screenshotRefs: readonly string[]
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
  readonly promptHash: string
  readonly buildHash: string
  readonly scenarioVersion: string
  readonly scenarioSeed: string
  readonly fixtureRefs: readonly string[]
  readonly records: readonly ReviewRecord[]
  readonly decisions: readonly string[]
  readonly bookmarks: readonly string[]
  readonly coverageSnapshot: CoverageSnapshot
  readonly screenshotRefs: readonly string[]
  readonly manifest: readonly PackageManifestEntry[]
  readonly manifestChecksum: string
}

/**
 * The package's content, broken into named logical files the manifest can
 * describe independently. `meta.json` carries everything BUT the records so
 * a corrupted records blob can be told apart from corrupted metadata; the
 * two are hashed and reported as separate manifest entries. Every element of
 * the payload lives in one of these two files, so every element falls
 * inside the manifest hash scope -- a package's content cannot change
 * without its checksum changing.
 */
function packageFiles(input: ExportReviewPackageInput): Readonly<Record<string, string>> {
  return {
    'meta.json': canonicalSerialize({
      formatVersion: PACKAGE_FORMAT_VERSION,
      sourceHash: input.sourceHash,
      promptHash: input.promptHash,
      buildHash: input.buildHash,
      scenarioVersion: input.scenarioVersion,
      scenarioSeed: input.scenarioSeed,
      fixtureRefs: input.fixtureRefs,
      decisions: input.decisions,
      bookmarks: input.bookmarks,
      coverageSnapshot: input.coverageSnapshot,
      screenshotRefs: input.screenshotRefs,
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
    promptHash: input.promptHash,
    buildHash: input.buildHash,
    scenarioVersion: input.scenarioVersion,
    scenarioSeed: input.scenarioSeed,
    fixtureRefs: input.fixtureRefs,
    records: input.records,
    decisions: input.decisions,
    bookmarks: input.bookmarks,
    coverageSnapshot: input.coverageSnapshot,
    screenshotRefs: input.screenshotRefs,
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

// Fix round 1 (review, Minor 6 -- corrected, see fix report): the review's
// claim that bare z.number() lets Infinity reach canonicalSerialize's throw
// does not reproduce against this project's installed zod (4.4.3) --
// z.number().safeParse(Infinity) already fails on its own, so the shape
// check catches it before packageFiles is ever called. What bare z.number()
// DOES still accept, unlike PackageManifestEntrySchema.bytes's
// `.int().nonnegative()` above, is a negative or fractional value -- e.g.
// a logical timestamp of -1, or a coverage count of 3.5. Matched to the
// same discipline.
const CoverageSnapshotSchema = z
  .object({
    takenAtLogical: z.number().int().nonnegative(),
    byStatus: z.record(z.string(), z.number().int().nonnegative()),
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
    promptHash: z.string().min(1),
    buildHash: z.string().min(1),
    scenarioVersion: z.string().min(1),
    scenarioSeed: z.string().min(1),
    fixtureRefs: z.array(z.string()),
    records: z.array(ReviewRecordSchema),
    decisions: z.array(z.string()),
    bookmarks: z.array(z.string()),
    coverageSnapshot: CoverageSnapshotSchema,
    screenshotRefs: z.array(z.string()),
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

// Deviation from the brief (documented, evidence-backed): Task 4's brief
// names its dedupe/merge preview type `ImportPreview` too. Declaring both
// under the same name in this file makes TypeScript MERGE them into one
// interface requiring every property from BOTH shapes at once -- confirmed
// by actually doing it and running `pnpm typecheck`: it broke this
// function's own `preview` return object (`recordCount`/`records`/... is
// missing `incoming`/`duplicates`/...) as well as the new `planImport`'s
// (missing `recordCount`/...). Renamed this one -- the package-validation
// preview `importReviewPackage` has always returned -- to
// `PackageImportPreview` so the two distinct concepts (validate-and-preview
// a package; dedupe records against an existing set) get distinct names.
// Nothing outside this file imports `ImportPreview` by name (grepped before
// renaming), so this is safe.

/** What a reviewer sees before anything is applied. Import stops here. */
export interface PackageImportPreview {
  readonly recordCount: number
  readonly records: readonly ReviewRecord[]
  readonly sourceHash: string
  readonly buildHash: string
  readonly scenarioVersion: string
}

export type ImportOutcome =
  | { readonly ok: true; readonly preview: PackageImportPreview }
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

// Fix round 1 (review, Minor 1): deliberately permissive (no `.strict()`,
// `formatVersion` is the only field checked) so a package's version can be
// read WITHOUT first requiring it to match the current, possibly-newer
// strict shape. Used only to move the format-version check ahead of the
// shape check below.
const PackageFormatVersionProbeSchema = z.object({ formatVersion: z.number() })

/**
 * Validates a raw import candidate and either quarantines it or returns a
 * preview — it never applies anything to the review store itself; nothing in
 * this module writes to `@/review/store`. Order: size, then format version,
 * then shape (Zod, strict), then source/build compatibility, then per-entry
 * hashes, then the manifest checksum. The FIRST failure quarantines and
 * stops — later steps never run once an earlier one has failed, so a
 * reviewer is never shown a preview built from data that already failed an
 * earlier, cheaper check.
 *
 * Fix round 1 (review, Minor 1): format version used to run AFTER shape,
 * matching the brief's literal order. But the shape check is `.strict()`
 * against the CURRENT shape, so an old-format package (fewer fields, an
 * honestly-labelled OLDER formatVersion) failed shape first and quarantined
 * as "does not match the expected shape" -- misdiagnosing a version
 * mismatch as corruption. Version now runs first, via a permissive probe
 * schema that only requires `formatVersion` to be present, so an old
 * package can be identified as old before being held to a shape it never
 * claimed to have.
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

  // 2. format version.
  //
  // Two DIFFERENT failures live here and must not share a message. A blob
  // that declares no `formatVersion` at all is not an old package -- it is
  // not a package, and saying "unsupported version" about it names the wrong
  // cause. A blob that declares one we cannot read is genuinely a version
  // problem. Both quarantine; only the second is about a version.
  const versionProbe = PackageFormatVersionProbeSchema.safeParse(raw)
  if (!versionProbe.success) {
    return quarantine(
      'This is not a review package: it declares no formatVersion.',
      { expected: String(PACKAGE_FORMAT_VERSION), actual: null },
    )
  }
  const declaredVersion = versionProbe.data.formatVersion
  if (declaredVersion !== PACKAGE_FORMAT_VERSION) {
    return quarantine('Unsupported package format version.', {
      expected: String(PACKAGE_FORMAT_VERSION),
      actual: String(declaredVersion),
    })
  }

  // 3. shape
  const parsed = ReviewPackageSchema.safeParse(raw)
  if (!parsed.success) {
    return quarantine(
      `Package does not match the expected shape: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
    )
  }
  const pkg = parsed.data
  const normalizedRecords: readonly ReviewRecord[] = pkg.records.map(toReviewRecord)

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

// ---------------------------------------------------------------------------
// Import step 2: dedupe an already-validated set of incoming records against
// what is already in the store, and let the reviewer choose how conflicts
// resolve. This is a separate, pure planning step from `importReviewPackage`
// above -- it never touches `@/review/store` either.
// ---------------------------------------------------------------------------

export interface ImportConflict {
  readonly id: string
  readonly existing: ReviewRecord
  readonly incoming: ReviewRecord
}

// Deviation from the brief (documented, evidence-backed): the brief's
// `ImportPreview` lists only `incoming`, `duplicates`, `conflicts` and
// `newRecords`. Those four cannot carry an EXISTING record that `incoming`
// never mentions at all (neither a duplicate nor a conflict) -- and the
// "both strategies add new records and never drop an existing one" test
// requires exactly that: an existing record absent from `incoming`
// entirely must still appear in `applyImport`'s output. Without the full
// `existing` set retained somewhere in the preview, `applyImport` cannot
// reconstruct that record from `duplicates` (which holds bare ids, not
// records) or `conflicts` (which only covers ids incoming actually
// mentions). Added `existing` as a fifth field rather than repurposing
// `incoming` to secretly mean "existing" -- the latter would satisfy the
// four-field count but make the field's own name lie about its content.
export interface ImportPreview {
  readonly incoming: readonly ReviewRecord[]
  readonly existing: readonly ReviewRecord[]
  readonly duplicates: readonly string[]
  readonly conflicts: readonly ImportConflict[]
  readonly newRecords: readonly ReviewRecord[]
}

export type MergeStrategy = 'merge' | 'replace'

// Controller ruling: compare on substantive fields only, excluding
// `updatedAtLogical`.
//
// Fix round 1 (review, Minor 2 -- corrected): the previous version of this
// comment justified the exclusion with two claims that do not hold against
// this codebase. Recorded honestly instead of restated:
//   - "a superseded/not-superseded pair would conflict purely on
//     `updatedAtLogical`" is false: `superseded()` sets `disposition` and
//     `supersededBy` in the SAME object literal as `updatedAtLogical`, and
//     both of those stay IN this comparison (below). So that pair already
//     conflicts on `disposition` regardless of whether `updatedAtLogical`
//     is compared -- the exclusion changes no verdict for it.
//   - "or re-exported" is false: `exportReviewPackage` never writes
//     `updatedAtLogical` at all, so re-export cannot produce a difference
//     in it.
// Net effect today: the exclusion is INERT. The only pair it could change
// the verdict on is two records with identical `disposition` and
// `supersededBy` but different `updatedAtLogical` -- and nothing in this
// codebase can currently produce that (its one mutator, `superseded()`,
// always changes all three together). It is kept anyway, defensively: if
// `updatedAtLogical` is ever set by something OTHER than `superseded()` --
// a future "touch"/edit-in-place that does not also change `disposition`
// -- this exclusion is what stops that alone from manufacturing a conflict
// out of two substantively identical records. `createdAtLogical` stays IN
// the comparison: for two records sharing an id, it never legitimately
// changes, so a difference there is itself a real discrepancy worth
// flagging.
function comparableFields(record: ReviewRecord): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- deliberately excluded from the substance comparison; see comment above
  const { updatedAtLogical, ...substantive } = record
  return substantive
}

/**
 * Compares `incoming` records against `existing` ones by id, then by
 * substantive content (see `comparableFields`): same id and same substance
 * is a duplicate; same id and different substance is a conflict carrying
 * both sides; an id `existing` has never seen is new. Pure -- mutates
 * neither argument.
 *
 * Fix round 1 (review, Major 3, data loss): `incoming` is deduped BY ID
 * first, before any comparison against `existing`. Nothing validates
 * record-id uniqueness upstream of this function (not `ReviewRecordSchema`,
 * not the manifest checksum), so a malformed package can carry the same id
 * twice. Without deduping, each raw `incoming` entry used to be classified
 * independently: two same-id, no-match-in-`existing` entries both landed in
 * `newRecords` (so `applyImport`'s output carried a duplicate id, and
 * `putReviewRecord`, keyed on `id`, would silently drop one on write -- the
 * exact collision `records.ts`'s `nextId` comment documents, reachable
 * through import instead of a page reload); or one id, present once
 * identical to `existing` and once altered, landed in BOTH `duplicates` and
 * `conflicts` at once. Later entries win on a collision within `incoming`
 * (last write wins, matching `Map` insertion order) -- an arbitrary but
 * deterministic tie-break; nothing in this codebase orders `incoming`
 * meaningfully, so there is no principled way to prefer the earlier one
 * instead. The returned `incoming` field still carries the ORIGINAL,
 * un-deduped array: it is what was received, not what was compared.
 */
export function planImport(
  incoming: readonly ReviewRecord[],
  existing: readonly ReviewRecord[],
): ImportPreview {
  const existingById = new Map(existing.map((r) => [r.id, r] as const))
  const dedupedIncoming = new Map(incoming.map((r) => [r.id, r] as const))
  const duplicates: string[] = []
  const conflicts: ImportConflict[] = []
  const newRecords: ReviewRecord[] = []

  for (const inc of dedupedIncoming.values()) {
    const match = existingById.get(inc.id)
    if (!match) {
      newRecords.push(inc)
      continue
    }
    const same = canonicalSerialize(comparableFields(match)) === canonicalSerialize(comparableFields(inc))
    if (same) {
      duplicates.push(inc.id)
    } else {
      conflicts.push({ id: inc.id, existing: match, incoming: inc })
    }
  }

  return { incoming, existing, duplicates, conflicts, newRecords }
}

/**
 * Resolves every conflict in `preview` by the reviewer's explicit choice --
 * `planImport` never resolves anything itself. `merge` keeps the existing
 * side of each conflict; `replace` takes the incoming side. Either way,
 * every existing record survives (unmodified if untouched by `incoming`,
 * resolved per `strategy` if conflicted) and every genuinely new record is
 * added: neither strategy ever drops an existing record.
 */
export function applyImport(preview: ImportPreview, strategy: MergeStrategy): readonly ReviewRecord[] {
  const conflictById = new Map(preview.conflicts.map((c) => [c.id, c] as const))
  const resolvedExisting = preview.existing.map((record) => {
    const conflict = conflictById.get(record.id)
    if (!conflict) return record
    return strategy === 'merge' ? conflict.existing : conflict.incoming
  })
  return [...resolvedExisting, ...preview.newRecords]
}
