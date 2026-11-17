# Grid Plan playground

The playground is an independent Vue application. Its `grid-plan: workspace:*`
dependency links the current root package, and `import { GridPlan, defaultConfig }
from 'grid-plan'` resolves through that package's exports to `dist/`. There are no
aliases or imports into the library's source directory.

The root and playground share a pnpm workspace and lockfile. Use pnpm 12.15.0
(the version pinned in both manifests). A single install covers both packages.

From the repository root:

```sh
pnpm install
pnpm run dev
```

`dev` builds the library and declarations first, then watches library source and
rebuilds JavaScript and generated declarations in `dist` alongside the playground's Vite server. The preview updates from
those built files. Vue and Three.js are deduplicated so the linked package and
application share their runtime instances.

```sh
pnpm run build                 # Library JavaScript and declarations
pnpm run typecheck             # Strict library type checking
pnpm run typecheck:playground  # Playground checked against dist types
pnpm run test:types            # Isolated consumer checks (Vue 3.3 and 3.5)
pnpm run build:playground      # Library, then playground/dist
pnpm test --run                # Library tests
pnpm run test:playground       # Rebuild library, then playground tests
pnpm run preview               # Serve an already-built playground/dist
pnpm run test:e2e              # Build and run the playground's Cypress tests
```

You can also run `pnpm run dev`, `pnpm run build`, or `pnpm test` from this folder.
Install workspace dependencies before using these commands. Cypress needs its browser
binary installed to run the end-to-end tests.

## Structure

- `src/App.vue`: page composition and event wiring.
- `src/composables/usePlayground.ts`: demo state, item synchronization, presets,
  selection, and bounded event history.
- `src/data/`: sample item definitions and configuration-control metadata.
- `src/components/ConfigPanel.vue` and `ConfigControl.vue`: searchable settings
  and typed inputs with individual resets.
- `src/components/PlanPreview.vue`: the package consumer and slot examples.
- `src/components/PreviewToolbar.vue` and `TypePalette.vue`: preview controls.
- `src/components/SelectionInspector.vue`, `EventLog.vue`, and `ConfigExport.vue`:
  inspection and export tools; clipboard status stays local to the export panel.
- `src/assets/`: app styling and shared visual primitives.
- `src/__tests__/` and `cypress/`: playground-specific tests.

Bootstrap Icons, its fonts, and all app assets belong to this package. The
published library remains independent of the playground's dependencies.

The app entry and supporting modules use TypeScript. Its build runs `vue-tsc`
before Vite, and consumes only the library's generated declarations from
`dist/types/index.d.ts`. Workspace-level TypeScript tooling is declared in the
root package.
