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
