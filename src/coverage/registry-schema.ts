import { z } from 'zod'
import { COVERAGE_STATUSES, SOURCE_CLASSES, BUILD_CLASSES } from '@/coverage/descriptors'

/**
 * The pure Zod schema/type half of the generated-registry contract --
 * deliberately kept free of `node:fs` (unlike `registry-loader.ts`'s
 * `loadGeneratedRegistry`), so a CLIENT component (e.g.
 * `app/workflows/WorkflowIndex.tsx`, Task 11's filters) can import
 * `GeneratedRegistrySchema`/`RegistryRow` without pulling a Node-only
 * module into the browser bundle. Turbopack fails outright if it does --
 * "the chunking context does not support external modules (request:
 * node:fs)" -- reproduced while building Task 11, which is what prompted
 * this split.
 *
 * One row of a generated registry file (`registries/generated/<slug>.json`,
 * written by `scripts/build-registries.mjs`). Every row carries `id`,
 * `sourceLine` and `status`; everything else is optional because what a row
 * carries depends on which raw source built it:
 *
 *  - semantic-extraction rows (modules, business objects) carry
 *    `label`/`surface`/`purpose`, taken straight from the extraction;
 *  - identifier-index rows joined to a module band or surface (functions,
 *    features, sub-features) carry `moduleId` and/or `surface`;
 *  - workflow rows carry `label`, `collapsedFrom` and `idIsPlaceholder`
 *    (composite-key collapse provenance, Task 7), PLUS the workflow-only
 *    extension fields `primaryActor`, `trigger`, `surfacesTouched` and
 *    `terminalStates` (fix round 2, §0): consolidating every registry onto
 *    one shared row shape flattened workflows to the lowest common
 *    denominator and silently dropped these, which slice 2b spec §7
 *    requires on the Workflow Index and Task 11's surface/actor filters
 *    need on the row to filter by at all. A common core plus typed,
 *    optional, per-inventory extension fields -- never a widened
 *    `Record<string, unknown>` to make one inventory's richer shape fit;
 *  - the remaining identifier-index families (business use cases, events,
 *    commands, notifications, offline scenarios, scheduled work) carry only
 *    the three required fields -- the frozen source extraction never named
 *    these identifiers;
 *  - a file that honestly holds more than one distinct sub-inventory
 *    (`ai-storyboards`: five separate SB-* registers — audit C-28's repair
 *    split `SB-AI-*` by id width, and the generator interpolates the count
 *    into the published `countedThing` rather than spelling it;
 *    `actionable-controls`:
 *    the 605-row UI-control catalogue plus the separate 22-row DNC-*
 *    do-not-use-cron register) tags every row with `register`, naming which
 *    sub-inventory it belongs to, so nothing is silently merged or dropped;
 *  - `sourceClass`/`buildClass` (Task 10) classify what the frozen source
 *    claims about a row and what this build did with it, ORTHOGONALLY to
 *    `status` -- see `SourceClass`/`BuildClass` in `@/coverage/descriptors`.
 *    `sourceClass` is taken straight from a raw record's own
 *    `classification` field (a STRUCTURED source, never parsed out of
 *    `RegistryDescriptor.sourceNote` prose): addendum §5 requires the 18
 *    Studio modules render as `derived`, never `source-defined`, under
 *    DEC-STUDIO-001.
 *
 *    R6-B02: THIS COMMENT USED TO READ "Only `modules` populates
 *    `sourceClass` today" AND SO DID THE COVERAGE DASHBOARD. Measured over
 *    the generated files: modules 81 of 81 and NOTIFICATIONS 56 of 286, 137
 *    rows in all. Which registries carry one is not written down here any
 *    more -- `app/coverage/page.tsx` derives it from the loaded rows, and
 *    `tests/coverage/registry-index-figures.test.ts` compares the rendered
 *    set against the measured one by equality, so no prose anywhere has to
 *    be kept in step by hand.
 */
export const RegistryRowSchema = z
  .object({
    id: z.string().min(1),
    sourceLine: z.number().int().nonnegative(),
    status: z.enum(COVERAGE_STATUSES),
    label: z.string().min(1).optional(),
    surface: z.string().min(1).optional(),
    purpose: z.string().min(1).optional(),
    moduleId: z.string().min(1).optional(),
    collapsedFrom: z.number().int().positive().optional(),
    idIsPlaceholder: z.boolean().optional(),
    register: z.string().min(1).optional(),
    /**
     * Why this row carries the status it does, where the status alone would
     * read as a shortfall and is not one. Audit C-32: the 18 chapter-40/41
     * `SB-AI-NNN` rows read `not-represented` beside 30 transcribed siblings
     * with nothing saying they belong to a different register — a bare status
     * where the build's standard elsewhere is a stated reason.
     */
    statusReason: z.string().min(40).optional(),
    /**
     * R4-B10: the shipped route that demonstrates this row, or absent when
     * nothing resolves one. Always a trailing-slash absolute path under the
     * static export, never a dynamic segment — see `routeUrlFor` in
     * `scripts/build-registries.mjs` for why a `[param]` directory resolves
     * to nothing rather than to one of the URLs it stands for.
     */
    route: z.string().regex(/^\/(?:[A-Za-z0-9._-]+\/)*$/).optional(),
    /**
     * R4-B04: the two §13.1 census dimensions the extraction can answer for
     * an actionable control, normalised, with the extraction's own wording
     * kept beside each wherever normalisation changed it. `surface` above
     * carries the canonical `SURF-*` id or the literal `cross-surface`;
     * `moduleId` carries a canonical `MOD-*` id only. A module cell the
     * extraction wrote in prose, or that names several modules at once, is
     * NOT guessed into an id — it is carried verbatim here.
     */
    moduleDescriptor: z.string().min(1).optional(),
    surfaceDescriptor: z.string().min(1).optional(),
    // Workflow-only extension fields (fix round 2, §0).
    primaryActor: z.string().min(1).optional(),
    trigger: z.string().min(1).optional(),
    surfacesTouched: z.array(z.string()).optional(),
    terminalStates: z.array(z.string()).optional(),
    /**
     * R4-B07, both workflow-only. `participatingRoles` is DERIVED — the
     * canonical nine role names that occur in this row's own extracted
     * `primaryActor` and `trigger` text, longest name first with each match
     * consumed so "Tenant Admin" is not also counted as "Admin". It is not
     * the source's role-result mapping, which master prompt §10.5 also
     * requires and which the extraction does not carry. `exercisedBy` is
     * carried straight through: the use cases the extraction recorded for
     * this workflow, which is §9.2's trace chain and was being dropped.
     */
    participatingRoles: z.array(z.string()).optional(),
    exercisedBy: z.array(z.string()).optional(),
    // Task 10: orthogonal to `status`; see doc comment above.
    sourceClass: z.enum(SOURCE_CLASSES).optional(),
    buildClass: z.enum(BUILD_CLASSES).optional(),
  })
  .strict()

export type RegistryRow = z.infer<typeof RegistryRowSchema>

/**
 * One of the fourteen `registries/generated/<slug>.json` files. The
 * refinement below is the type system enforcing the count-scope rule this
 * slice turns on: a registry cannot claim BOTH that the frozen source fixes
 * no total for what it counts (`sourceFixesNoTotal: true`) AND carry a
 * `reconciledCount` for that same total -- those two claims contradict each
 * other, and without this check nothing stops a future build from shipping
 * a canonical-looking number the source never actually fixed. This is the
 * single failure this slice's spec warns about most.
 */
export const GeneratedRegistrySchema = z
  .object({
    slug: z.string().min(1),
    countedThing: z.string().min(9),
    /**
     * What each row's `sourceLine` actually holds — the FIRST MENTION of the
     * identifier anywhere in the frozen source, not the line that defines it.
     *
     * Required rather than optional, and stated in the artefact rather than
     * only in a comment, because the coverage pages put that number in front
     * of a client and the field's name implies a definition it does not
     * carry. Measured on one sample of thirty rows, eighteen point at a group
     * table, a diagram paragraph, or a neighbouring entry.
     */
    sourceLineMeaning: z.string().min(40),
    /**
     * How many rows are named anywhere under `src/` or `app/` — WEAKER than a
     * status and deliberately not one.
     *
     * A status says a route screen demonstrates the row. This says only that
     * some file in the build spells its identifier. Both are published because
     * they differ by a lot -- and by how much is not written here, because it
     * moves on every build that adds a route or a row: this comment carried
     * "258 rows read demonstrated and 813 are named" and both were stale
     * within the same slice. Measure it by summing the
     * `demonstrated-in-storyboard` rows and `namedInSourceCount` over the
     * fourteen `registries/generated/*.json`. The shape worth stating is
     * `offline-scenarios`, which reads zero demonstrated against every row
     * named, because two tasks transcribed all seventy use cases and no route
     * names a `UC-OFF-*` identifier.
     *
     * One number in front of a client reads as the whole truth. Two do not.
     */
    namedInSourceCount: z.number().int().nonnegative(),
    namedInSourceMeaning: z.string().min(40),
    /**
     * R4-B10: how many of this registry's rows carry a `route`, published
     * beside the rows so an index can state the resolvable fraction rather
     * than leaving a reader to count em dashes. `routeMeaning` says what the
     * field is and, more importantly, what its absence means.
     */
    routeResolvedCount: z.number().int().nonnegative(),
    routeMeaning: z.string().min(40),
    reconciledCount: z.number().int().nonnegative().nullable(),
    rawCount: z.number().int().nonnegative(),
    dedupRule: z.string().min(1).nullable(),
    sourceFixesNoTotal: z.boolean(),
    rows: z.array(RegistryRowSchema),
  })
  .strict()
  .refine((r) => !(r.sourceFixesNoTotal && r.reconciledCount !== null), {
    message:
      'sourceFixesNoTotal is true but reconciledCount is not null -- a registry cannot claim ' +
      'the source fixes no total for what it counts while also carrying a reconciledCount for it',
    path: ['reconciledCount'],
  })

export type GeneratedRegistry = z.infer<typeof GeneratedRegistrySchema>
