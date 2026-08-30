// Task 9: design tokens and the product shell.
export * from './tokens'
export * from './Nav'
export * from './PageHeader'
export * from './AppShell'

// Task 10: DataTable — sort, filter, search, paginate, select over Query<T>.
export * from './DataTable'
export * from './useTableState'
export * from './TableToolbar'
export * from './Pagination'

// Task 11: Form, the field set, ErrorSummary and Wizard.
export * from './Form'
export * from './ErrorSummary'
export * from './Wizard'
export * from './fields/TextField'
export * from './fields/NumberField'
export * from './fields/SelectField'
export * from './fields/DateField'
export * from './fields/CheckboxField'
export * from './fields/RadioGroup'
export * from './fields/TextArea'

// Task 12: ObjectPage, overlays, status and visualisation.
export * from './ObjectPage'
export * from './DetailDrawer'
export * from './ConfirmDialog'
export * from './Toaster'
export * from './StatTile'
export * from './Chart'
export * from './Timeline'
export * from './StatusPill'
export * from './FreshnessStamp'

// Task 13: the Frontline execution frame — device frame, run player shell,
// step canvas, capture control, connectivity and sync-queue badges.
export * from './frontline/DeviceFrame'
export * from './frontline/RunPlayerShell'
export * from './frontline/StepCanvas'
export * from './frontline/CaptureControl'
export * from './frontline/ConnectivityBadge'
export * from './frontline/SyncQueueBadge'

// Task 1 (unit-01) — the product runtime: one repository boot, reachable
// from every route. `ProductRuntime`, `useRepository`/`useStore`/
// `useAccessContext`/`useProductSession`/`useRepositoryQuery`/
// `useRuntimeReady`, and the sign-in state machine (`resolveSignIn`,
// `SignInOutcome`).
export * from './runtime'

// Task 3 (unit-01) — the signed-out guard every screen inside the shell
// reuses: loading before `useRuntimeReady()`, a redirect to sign-in before
// a default persona ever renders.
export * from './RequireSession'
