# The Claude Code hook configuration, kept where it can be recovered

## Why these files are here rather than only where they are used

The hooks live at `Ron-project1/CLAUDE.md` and `Ron-project1/.claude/settings.json` — one
directory ABOVE this repository, because that is where Claude Code sessions run.

That directory is not a git repository. So the live configuration has no history, no backup,
and does not travel with a clone of this repo: someone who checks the storyboard out on
another machine gets the graph, the scripts and the gates, and none of the wiring that makes
them automatic.

These are copies, committed so the configuration is recoverable and reviewable. They are not
the live files.

## Restoring them

    cp docs/process/claude-hooks/CLAUDE.md      ../CLAUDE.md
    mkdir -p ../.claude
    cp docs/process/claude-hooks/settings.json  ../.claude/settings.json

Then **restart Claude Code**. Hook configuration is read when a session starts; editing it
mid-session leaves the old configuration live and the new one silently inert.

## What they do

`settings.json` registers three hooks, each of which first `cd`s into this repository —
graphify resolves `graphify-out/` relative to the working directory, and without the `cd` every
guard emits nothing at all:

| Hook | Matcher | Command |
|---|---|---|
| PreToolUse | `Bash\|Grep` | `graphify hook-guard search` — pushes a search through the graph before it becomes a grep over 122,241 lines |
| PreToolUse | `Read\|Glob` | `graphify hook-guard read` |
| Stop | — | `node scripts/graph-update.mjs` — brings the graph back in step with the code |

`CLAUDE.md` carries the rules: ask the graph first, the graph never outranks the blueprint,
cite the blueprint never the graph, and **never run `graphify update .`** — it rebuilds from
the code corpus alone and once replaced 29,498 nodes with 6,849, discarding every blueprint
node while reporting success.

## Keeping the copies honest

A copy that drifts from the live file is worse than no copy, because it looks authoritative.
`tests/coverage/hook-config.test.ts` fails if the two diverge.
