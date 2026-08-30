# §24.3 fidelity audit — the before-state, captured in Chrome

Captured 2026-08-26 against the committed static export at `76a0da2`, served by
`pnpm serve:out` on :4173 and driven through the Chrome MCP server at 1440×664.
These are the bytes a client would have seen.

| surface | route | interactive elements | above the fold |
|---|---|---|---|
| SURF-SA | `/super-admin/tenants-lifecycle-and-pilots/` | 15 buttons, 8 inputs, 3 links | title, three narrative paragraphs, one line of blueprint locators (`L42806`, `L44984`, `L75604`…), two dev selectors. No shell, no navigation, no tenant table. |
| SURF-DOH | `/hub/` | 1 button, 1 input, 19 links | a link list; `Layout: main#main` with no `nav` landmark at all |
| SURF-FL | `/frontline/run-player/` | 20 buttons, 0 inputs, 7 links | — |
| SURF-CC | `/command-center/live-shift-board/` | 1 button, 0 inputs, 14 links | — |
| SURF-STU | `/studio/builder/` | 52 buttons, 23 inputs, 2 links | title, three narrative blocks, then a reviewer-controls panel whose own body is four more paragraphs of prose about a permission matrix |

**The Studio finding is the sharpest one.** Master prompt §8.3 makes the Workflow Builder the
exemplar that must be "a real interactive authoring journey rather than a picture". It is the most
interactive page in the build — 52 buttons, 23 inputs — and a client still meets several screens of
narrative before reaching any of it. The page does honestly label its reviewer controls "NOT PART
OF THE PRODUCT", which is the right instinct in the wrong place: §8.6.2 requires that chrome be
collapsible and the product be what the screen opens on.

All five fail the three §8.6.2 litmus tests — Figma, screenshot, deletion. Delete the narrative
from any of them and the remaining page cannot do the job the narrative was doing.

Kept so the rebuilt screens can be compared against what they replaced, and so the claim that a
rebuild was necessary rests on captures rather than on this controller's description of them.
