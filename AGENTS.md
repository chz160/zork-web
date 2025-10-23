## Copilot’s Prime Directives (Angular • SOLID • DRY • KISS • Evolutionary Change)

You are contributing to an Angular (v16–20+) monorepo using TypeScript. Follow these rules in this order:

1) **Safety & Tests First**
   - Never change behavior without tests that prove the behavior.
   - For legacy/untested areas, create **characterization tests** before refactoring.
   - Prefer **Jest** for unit tests; **Cypress/Playwright** for e2e; use **Testing Library** helpers for DOM.

2) **DRY Above All**
   - Before writing anything, **search the repo** for similar components/services/pipes/operators/tokens.
   - Extract common code to `@shared` libs (pure functions, pipes, directives) or `@ui` libs (presentational).
   - Reuse primitives (validators, mappers, query services) instead of re-implementing them.

3) **SOLID Design (Frontend-ified)**
   - **S**RP: A component does one UI job; a service handles one domain concern; a directive handles one behavior.
   - **O**CP: Extend via **standalone components**, directives, strategies, and DI tokens—don’t edit stable cores.
   - **L**SP: Reusable components must remain substitutable (respect inputs/outputs contracts).
   - **I**SP: Keep interfaces/tokens small and focused (e.g., `DateFormatter` vs `MegaUtils`).
   - **D**IP: Depend on **abstractions** (interfaces/InjectionTokens). Inject via `inject()` or constructors.

4) **KISS: Keep It Simple**
   - Prefer the smallest clear solution that works. Avoid clever RxJS acrobatics if a simple signal or method does.
   - Choose **standalone components** + feature routing over deep module hierarchies.
   - Prefer **reactive forms** and simple validators over custom form engines.
   - No premature patterns; add them **only when they improve clarity/testability**.

5) **Evolve, Don’t Mutate (Strangler Fig)**
   - Introduce new **standalone** components/services alongside legacy ones.
   - Route traffic via feature flags or thin adapters; migrate call sites gradually.
   - Mark deprecated exports in barrel files and README of the feature; remove with a scheduled cleanup.

---

## Angular Change Protocol (Copilot must follow in this order)

1) **Understand**
   - Restate the user story/bug & acceptance criteria.
   - List inputs/outputs, state touched (signals, stores, services), and cross-cutting concerns (perf, a11y, security).

2) **Inventory & Reuse Check**
   - Search for existing: components, UI primitives, directives, validators, pipes, query/mutation services, interceptors.
   - List candidates with paths and state reuse vs. replace decision.

3) **Design Sketch (Minimal/SOLID/DRY/KISS)**
   - New components (standalone) with one-sentence responsibilities.
   - Inputs/Outputs/signals, and where **change detection** boundaries lie (`OnPush` by default).
   - Services: public interface (methods), DI tokens, and how side effects are isolated.
   - Data flow (Observable/Signal), and unsubscribe strategy (e.g., `takeUntilDestroyed()`).

4) **Risk & Migration Plan**
   - Blast radius (routes, shared styles, interceptors).
   - Feature toggle/config flag name + default.
   - Deprecations (old component/service) and the transition note.

5) **Test Plan**
   - Unit: components (input/output cases), services (happy/edge), pipes/directives.
   - Integration: route + resolver/guard + interceptor flows.
   - e2e: user-visible paths and accessibility checks.

6) **Implementation**
   - Build the **smallest vertical slice** that meets the story.
   - Prefer **pure functions** for transformations; keep effects in services/interceptors.
   - Keep functions small, templates simple, and selectors explicit.

7) **Validation**
   - Show passing tests and bundle size impact.
   - Explain duplication removed or prevented.
   - Note a11y/perf outcomes (see budgets below).

---

## Code Rules (self-enforced quick checks)

- **Project structure**
  - Use **standalone components**; co-locate template, stylesheet, and spec with component.
  - Feature folders: `feature/`, shared UI: `shared/ui/`, shared utilities: `shared/util/`, data layer: `data/`.
  - Barrel files only for stable public APIs of a feature.

- **Components**
  - Default **OnPush** change detection. Use **signals** or `async` pipe; avoid manual `subscribe()` in components.
  - Keep components presentational when possible; push data-fetching to services.
  - Use `trackBy` for `*ngFor`; prefer small, readable templates; avoid deep structural nesting.

- **State & Data**
  - Prefer **signals** or simple `Observable` streams; minimize global state.
  - If complex cross-feature state emerges, introduce a **store** (e.g., NgRx/Signals Store) with facades.
  - Cache idempotent queries with `shareReplay({ bufferSize: 1, refCount: true })` + TTL in a service.

- **RxJS**
  - Pipeable operators only; **no nested subscribes**. Prefer `switchMap` for request chains.
  - Use `takeUntilDestroyed()` or `untilDestroyed` for teardown in components/directives.
  - Avoid custom operator over-engineering unless reused ≥3 places.

- **DI & Abstractions**
  - Define small **InjectionTokens** for pluggable behavior (e.g., `API_BASE_URL`, `DateFormatter`).
  - Interact with browser APIs via **adapters** (e.g., `StoragePort` service vs `localStorage` directly).

- **HTTP & Interceptors**
  - Keep **auth/logging/error/caching** in interceptors; keep components free of HTTP details.
  - Always handle errors (map to typed failures); never leak raw `HttpErrorResponse` to UI.

- **Routing**
  - Lazy-load features; keep guards/resolvers minimal and testable.
  - Avoid giant route configs; split per feature and compose.

- **Forms**
  - Use **Reactive Forms**; isolate cross-field validators in shared utilities.
  - For reusable inputs, implement **ControlValueAccessor** with clear `@Input()`s.

- **Styling**
  - Encapsulated component styles; avoid global overrides. Use design tokens / variables.
  - No magic numbers; use spacing scale and CSS utilities.

- **Performance**
  - Prefer pure pipes, memoized selectors/signals, and route-level code splitting.
  - Defer heavy work (`requestIdleCallback`, `setTimeout(0)`, or worker) when not UX-critical.

- **Accessibility (a11y)**
  - All interactive elements keyboard-navigable; proper roles/labels.
  - Visible focus states; color contrast meets WCAG AA.

- **Immutability & CQS**
  - Treat state as immutable; avoid in-place mutations in services/components.
  - **CQS**: queries don’t mutate; commands don’t return domain data.

---

## Duplication Prevention Routine (run before coding)

1) Search for similar **templates** (same markup patterns), **validators**, **pipes**, **queries**, **adapters**.
2) Search by **domain keywords** and **operator shapes** in RxJS chains.
3) If ≥2 similar spots exist, extract a **shared primitive** (directive/pipe/util/service).
4) If domains differ, keep call-site adapters thin; do not push leaky base classes.

---

## Refactor-First Patterns to Prefer (only when truly useful — KISS)

- **Container/Presenter** split for complex screens.
- **Facade + Store** for complex state coordination.
- **Adapter** around browser/platform APIs.
- **Interceptor** for cross-cutting HTTP concerns.
- **Directive** for reusable DOM behavior; **Pipe** for pure formatting.
- **Strategy** for pluggable UI rules (validators, formatters, feature decisions).

> ⚠️ **KISS Clause:** If a plain component + service is clearer, do that. Patterns are optional tools, not goals.

---

## Required Artifacts per Significant Change

- **Tests:** unit + integration; critical flows covered in e2e.
- **ADR:** if adding/removing a pattern, introducing a store, or changing a shared contract.
- **a11y note:** what was checked/added (labels, roles, focus).
- **Perf note:** expected effect on bundle/time-to-interactive.
- **Mermaid diagram** of the feature slice (data flow + dependencies).

**ADR Template**
