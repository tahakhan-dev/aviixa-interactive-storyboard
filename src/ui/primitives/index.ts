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
// Consumers today: `tests/component/slice-10-locked-control.test.tsx` only.
// The first screen consumer is slice 10 task 8, `MOD-DOH-10` at
// `/hub/notifications`, which draws the preference storyboard's Always-sent
// and Protected groups.
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
