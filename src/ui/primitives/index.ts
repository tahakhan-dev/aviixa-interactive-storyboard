// Task 3: status and messaging primitives.
export * from './StatusPill'
export * from './Banner'
export * from './EmptyState'
export * from './SkeletonBlock'
export * from './FreshnessLabel'
export * from './PermissionNotice'

// Slice 10, task 4: a setting that is visible, inoperable and states its
// reason inline. Re-exported here for the same reason as the others, with the
// same known limitation: `graphify affected` does not resolve a star
// re-export through this barrel, so "who imports LockedControl" is not
// answerable from the graph and every consumer must be named by its own task.
// Consumers today: `app/hub/notifications/NotificationsScreen.tsx`, whose
// payloads are built by `src/surfaces/doh/modules/doh-10/rendering.ts`, and
// `tests/component/slice-10-locked-control.test.tsx`. This line read
// "Consumers today: the test only" while that screen was already importing it
// through this barrel — a stale claim about the one thing the star re-export
// makes unanswerable from the graph, which is exactly why it has to be
// maintained by hand and exactly how it went stale.
export * from './LockedControl'

// Task 4: form and table primitives.
export * from './Button'
export * from './Field'
export * from './Select'
export * from './Checkbox'
export * from './Table'

// Task 5: overlay and navigation primitives.
export * from './Dialog'
export * from './Drawer'
export * from './Tabs'
export * from './Breadcrumbs'
export * from './Toast'
export * from './LiveRegion'

// ── THE TWO ORPHANS, BOTH NAMED — WHICH IS THE ONLY WAY EITHER CAN BE ──────
//
// Of the eighteen primitives this barrel re-exports, exactly two have no JSX
// render site anywhere in `src/` or `app/`: `Drawer` and `Toast`. Measured per
// primitive on the RENDER site rather than the import, because an import edge
// is not a mount:
//
//     grep -rEn "<Drawer\b" src app --include='*.tsx' | grep -v primitives/Drawer.tsx
//     grep -rEn "<Toast\b"  src app --include='*.tsx' | grep -v primitives/Toast.tsx
//
// Both return nothing; every other primitive returns at least one line. Both
// are exercised only by `tests/component/primitives-overlay.test.tsx`.
//
// TOAST'S CONDITION WAS ALREADY RECORDED AND DRAWER'S WAS RECORDED NOWHERE,
// and removing that asymmetry is the whole point of this block.
// `tests/coverage/slice-11-gates.test.ts` records Toast's in detail, as the
// plant that proved gate 6's `.tsx`-only limit — "a component reachable only
// through a `.ts` barrel", and the barrel is this file. `Drawer` has the
// identical condition and no record of it, and the orphan gate that would
// convict it is scoped to slice-11 files, so a task-5 primitive is outside its
// population. An orphan nothing names is not a small gap here: the comment on
// `LockedControl` above says why — `graphify affected` does not resolve a star
// re-export through this barrel, so "who renders X" is unanswerable from the
// graph and every consumer, or the absence of one, has to be named by hand.
// This block is the hand.
//
// `Drawer` IS KEPT, AND NOT FOR SYMMETRY WITH TOAST. It shares
// `./useOverlayFocus` with `Dialog`, which has one render site; deleting the
// second caller would leave a shared focus trap exercised by one. Its four
// assertions in the overlay suite — focus moved in, Escape closes, Tab
// contained, focus restored to the invoker — are the covering suite for that
// helper as much as for the component. Delete it only together with the
// helper, and only when `Dialog` no longer needs it.
