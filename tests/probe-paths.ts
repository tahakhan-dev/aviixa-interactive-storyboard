import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * THE ONE PROBE CONVENTION, hoisted. Every gate in this build proves it can
 * fail by planting a scratch file on the REAL shared filesystem and deleting
 * it again. Two suites running at once therefore walk each other's probes:
 * one process lists a sibling's probe and ENOENTs on it the moment the
 * sibling's `finally` removes it. Two concurrent `pnpm test:release` runs
 * went from 16+15 failures with 7 ENOENTs to 207/207 both, once the
 * exclusion below was applied.
 *
 * Before this file the predicate was copy-pasted into THIRTEEN test files,
 * and the copies had already drifted apart in two ways that each cost a real
 * red run:
 *
 * 1. THE OPTIONAL MIDDLE GROUP. `/^\.zz-probe-\d+$/` recognises only the
 *    `<pid>` shape, so it does NOT recognise
 *    `tests/component/stu-shell.test.tsx`'s `.zz-probe-stu-reach-<pid>` and
 *    loses exactly the race the exclusion exists to remove — reproduced as
 *    `ENOENT: ... open 'src/studio/.zz-probe-stu-reach-48498/probe.ts'`.
 *    `slice-04-gates.test.ts` records the correction; `slice-03-gates.test.ts`
 *    still carried the uncorrected form when this file was written, and its
 *    `walk()` covers `src/ui/sa` and `src/surfaces/sa`. The corrected form
 *    wins, on that evidence.
 *
 * 2. THE `.json` TAIL. `slice-2c-gates.test.ts` plants a scratch registry as
 *    a FILE, `.zz-probe-<pid>.json`, directly inside `registries/generated`
 *    — it has to, because the gate it must trip lists that directory one
 *    level deep and keys on the extension. It carried a SECOND, private
 *    predicate for that shape. `registry-freshness.test.ts` walks the same
 *    directory and compares FILE SETS, so the directory-only predicate would
 *    not have closed its hole at all: the probe it actually meets there is
 *    the `.json` one. One predicate covers both tails, so a fix can no
 *    longer reach one probe shape and miss the other.
 *
 * THE MATCH IS EXACT, NEVER A PREFIX, and that is load-bearing rather than
 * fussy. A prefix form (`zz-probe`) would also hide a real source file named
 * `zz-probe.tsx`, `zz-probeHelpers.tsx` or `zz-probe.html` from EVERY gate at
 * once — a safety gate walkable past by choosing a filename. A leading dot
 * AND a trailing pid are both required here, so none of those match anything.
 *
 * Dot-prefixed, too: `tsc`'s `include` glob does not descend into a path
 * segment starting with `.` (verified directly — a deliberate type error in a
 * dot-prefixed probe was invisible to `pnpm typecheck`), and Next's app
 * router does not treat one as a route segment. So a concurrent typecheck or
 * `next build` can never observe a probe mid-lifetime and fail on a path that
 * no longer exists by the time it reports.
 */
export const FOREIGN_PROBE_ENTRY = /^\.zz-probe-(?:[a-z0-9-]+-)?\d+(?:\.json)?$/

/**
 * This process's own probe entry name. A pid is stable for the life of one
 * process and distinct between any two processes alive at once, so two runs
 * write to two different paths and cannot delete each other's probe.
 *
 * `tag` is for a file that needs more than one probe shape, or that wants its
 * probe recognisable in a child process's output
 * (`.zz-probe-stu-reach-<pid>`).
 */
export const ownProbeDir = (tag?: string): string =>
  `.zz-probe-${tag === undefined ? '' : `${tag}-`}${process.pid}`

/**
 * True for a probe belonging to SOME OTHER process. Pass `own` at any call
 * site that plants its own probe and then scans for it — without it the scan
 * would skip the very thing it planted, which is a gate that cannot fail.
 * Omit `own` where the caller plants nothing: it should see no probe at all.
 */
export const isForeignProbe = (entry: string, own?: string): boolean =>
  FOREIGN_PROBE_ENTRY.test(entry) && entry !== own

/**
 * ENOENT ON AN ENTRY A WALK ITSELF LISTED IS TOLERATED, and that is not
 * laziness — `scripts/build-stu-module-reach.mjs` states the same rule for
 * the same reason. The exclusion above removes the probe race outright, but a
 * walk of `out/` also runs while a sibling `pnpm build` rewrites it, and a
 * file that disappears between the listing and the touch is not a finding.
 * It cannot hide one either: only an ALREADY-DELETED path is skipped, and a
 * deleted file ships nothing and renders nothing.
 *
 * A walk's ROOT is deliberately never covered by this — `walk('out')` on a
 * missing `out/` must still fail loudly rather than scan zero files and pass.
 */
export function presentOrNull<T>(read: () => T): T | null {
  try {
    return read()
  } catch (err) {
    if ((err as NodeJS.ErrnoException | null)?.code === 'ENOENT') return null
    throw err
  }
}

/**
 * Plant a violation on the real filesystem, prove the gate catches it, then
 * remove it. A gate that cannot fail reports safety it does not provide, and
 * this build has shipped five of those.
 *
 * Creation and the write are inside the `try`, so a failure partway through
 * still cleans up rather than only the success path doing so. Callers add a
 * module-level `process.on('exit', ...)` as a second, independent path for a
 * crash that skips a pending `finally`; a hard kill bypasses both, and a
 * probe orphaned that way is handled by the two properties above instead of
 * by cleanup — invisible to `tsc` and to `next build`, and foreign to every
 * later run's walk.
 */
export function withPlanted(
  root: string,
  name: string,
  contents: string,
  assertCaught: (probe: string) => void,
  own: string = ownProbeDir(),
): void {
  const dir = join(root, own)
  const probe = join(dir, name)
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(probe, contents)
    assertCaught(probe)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * The pid a probe entry names, or `null` if the entry is not a probe.
 *
 * Every probe name ends in the pid of the process that planted it — that is
 * what makes two concurrent runs write to two different paths — so the pid is
 * recoverable from the name alone, with no bookkeeping anywhere.
 */
export function probePid(entry: string): number | null {
  if (!FOREIGN_PROBE_ENTRY.test(entry)) return null
  const digits = /(\d+)(?:\.json)?$/.exec(entry)?.[1]
  return digits === undefined ? null : Number(digits)
}

/**
 * A probe NOBODY OWNS: the shape matches and the process that planted it is
 * gone, so no `finally` and no `process.on('exit')` will ever remove it.
 *
 * THE LIVE/ORPHAN DISTINCTION IS THE WHOLE POINT, and it is what lets a gate
 * be strict without re-opening the race this module exists to close. A LIVE
 * probe belongs to a running test and is none of a sibling's business — that
 * is `isForeignProbe`'s job. An ORPHAN belongs to nobody, and it is invisible
 * to `git status` (`.gitignore`) and to every gate (`isForeignProbe`) at
 * once, which is exactly how one sat in `app/super-admin/` unnoticed.
 *
 * `signal 0` sends nothing; it only asks whether the process exists. EPERM
 * means it exists and belongs to another user, so it counts as alive. The
 * residual risk is pid REUSE — an orphan whose pid was later handed to an
 * unrelated process reads as live. That makes this check conservative, never
 * a false alarm, which is the right direction for a gate.
 */
export function isOrphanProbe(entry: string): boolean {
  const pid = probePid(entry)
  if (pid === null) return false
  try {
    process.kill(pid, 0)
    return false
  } catch (err) {
    return (err as NodeJS.ErrnoException).code !== 'EPERM'
  }
}
